import { analyzeIncident } from '../grok';
import { persistIncident } from './persistence';
import { XMLParser } from 'fast-xml-parser';

interface GDACSItem {
  title?: string;
  description?: string;
  link?: string;
  guid?: string | { _: string };
  pubDate?: string;
  'geo:lat'?: string;
  'geo:long'?: string;
}

interface GDACSRSS {
  rss?: {
    channel?: {
      item?: GDACSItem | GDACSItem[];
    };
  };
}

/**
 * Ingest disaster alerts from GDACS (Global Disaster Alert and Coordination System)
 * Uses proper XML parsing and robust deduplication.
 * 
 * Deduplication strategy:
 * - Uses GDACS GUID if available (most reliable)
 * - Falls back to link URL
 * - Finally falls back to normalized title + date hash
 */
export async function ingestGDACS() {
  try {
    const response = await fetch('https://www.gdacs.org/xml/rss.xml', {
      headers: {
        'User-Agent': 'OpenMinr/1.0 Tactical Intelligence Platform'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GDACS API returned ${response.status}: ${response.statusText}`);
    }
    
    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseTagValue: false,
      trimValues: true
    });
    
    const parsed: GDACSRSS = parser.parse(xml);
    const items = parsed.rss?.channel?.item;
    
    if (!items) {
      console.log('[GDACS] No items found in RSS feed');
      return { processed: 0, inserted: 0, errors: 0 };
    }
    
    const itemsArray = Array.isArray(items) ? items : [items];
    const stats = { processed: 0, inserted: 0, errors: 0, duplicates: 0 };
    
    // Process only first 5 items (configurable)
    const itemsToProcess = itemsArray.slice(0, 5);
    
    for (const item of itemsToProcess) {
      stats.processed++;
      
      try {
        const title = item.title?.trim();
        const description = item.description?.trim();
        const link = item.link?.trim();
        
        if (!title || !description) {
          console.log('[GDACS] Skipping item without title/description');
          continue;
        }
        
        // Robust deduplication hash
        const hash = generateGDACSHash(item);
        
        const lat = parseFloat(item['geo:lat'] || '0') || null;
        const lon = parseFloat(item['geo:long'] || '0') || null;
        
        // Analyze with Grok
        const analysis = await analyzeIncident(`TITLE: ${title}\nDESCRIPTION: ${description}`);
        
        const result = await persistIncident(
          {
            title: analysis.headline,
            description: analysis.tactical_summary,
            severity: analysis.severity,
            category: analysis.category,
            lat,
            lon,
            source_hash: hash
          },
          [{ 
            source: 'GDACS-RSS', 
            content: description,
            metadata: { 
              gdacs_link: link,
              gdacs_guid: extractGUID(item.guid),
              original_title: title,
              pub_date: item.pubDate
            }
          }]
        );
        
        if (result.duplicate) {
          stats.duplicates++;
        } else {
          stats.inserted++;
        }
        
      } catch (itemError) {
        stats.errors++;
        console.error(`[GDACS] Failed to process item: ${item.title || 'unknown'}`, itemError);
      }
    }
    
    console.log(`[GDACS] Ingestion complete:`, stats);
    return stats;
    
  } catch (error) {
    console.error('[GDACS] Fatal error during ingestion:', error);
    throw error; // Re-throw for upstream handling
  }
}

/**
 * Generates a robust deduplication hash for GDACS items
 * Priority: GUID > Link URL > Normalized Title + Date
 */
function generateGDACSHash(item: GDACSItem): string {
  // 1. Use GDACS GUID if available (most reliable)
  const guid = extractGUID(item.guid);
  if (guid) {
    return `gdacs:guid:${guid}`;
  }
  
  // 2. Use link URL if available
  if (item.link) {
    return `gdacs:link:${item.link}`;
  }
  
  // 3. Fallback: normalized title + date hash
  const normalizedTitle = item.title?.toLowerCase().replace(/\s+/g, ' ').trim() || '';
  const datePart = item.pubDate ? item.pubDate.split('T')[0] : 'nodate';
  return `gdacs:content:${normalizedTitle}:${datePart}`;
}

/**
 * Extracts GUID string from various GDACS formats
 */
function extractGUID(guid: string | { _: string } | undefined): string | null {
  if (!guid) return null;
  if (typeof guid === 'string') return guid;
  if (typeof guid === 'object' && guid._) return guid._;
  return null;
}