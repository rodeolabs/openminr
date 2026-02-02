import { GROK_API_KEY } from '$env/static/private';
import crypto from 'crypto';
import { persistIncident } from './persistence';

interface GrokIntelResult {
  incidents: Array<{
    title: string;
    description: string;
    severity: number;
    category: string;
    confidence: number;
    lat: number | null;
    lon: number | null;
    source_posts: Array<{
      author: string;
      content: string;
      timestamp: string;
      url?: string;
    }>;
    dedup_key: string;
  }>;
  search_metadata: {
    query: string;
    timestamp: string;
    posts_analyzed: number;
  };
}

export async function queryGrokLiveSearch(keywords: string[]): Promise<GrokIntelResult> {
  const response = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast-non-reasoning',
      tools: [{ type: 'x_search' }],
      input: [
        {
          role: 'user', 
          content: `MISSION: Search X.com for the 5 most significant REAL-WORLD tactical breaking news events related to: ${keywords.join(', ')} from the last 2 hours. Return pure JSON.`
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'intel_report',
          schema: {
            type: 'object',
            properties: {
              incidents: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    severity: { type: 'integer', minimum: 1, maximum: 5 },
                    category: { type: 'string' },
                    confidence: { type: 'number' },
                    lat: { type: 'number' },
                    lon: { type: 'number' },
                    source_posts: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          author: { type: 'string' },
                          content: { type: 'string' },
                          timestamp: { type: 'string' },
                          url: { type: 'string' }
                        },
                        required: ['author', 'content', 'timestamp']
                      }
                    },
                    dedup_key: { type: 'string' }
                  },
                  required: ['title', 'description', 'severity', 'category', 'confidence', 'source_posts', 'dedup_key']
                }
              }
            },
            required: ['incidents']
          },
          strict: true
        }
      }
    })
  });

  if (!response.ok) throw new Error(`Grok API failed: ${response.statusText}`);
  const data = await response.json();
  const rawContent = data.output[data.output.length - 1]?.content[0]?.text;
  
  if (!rawContent) return { incidents: [], search_metadata: { query: keywords.join(','), timestamp: new Date().toISOString(), posts_analyzed: 0 } };

  return JSON.parse(rawContent.replace(/```json|```/g, '').trim());
}

/**
 * Generates a content-based deduplication hash (NOT time-based)
 * Uses normalized title, category, and location (if available)
 * Time component removed to ensure same incident always gets same hash
 */
function generateDedupHash(incident: GrokIntelResult['incidents'][0]): string {
  const normalizedTitle = incident.title.toLowerCase().replace(/\s+/g, ' ').trim();
  const locationKey = incident.lat && incident.lon 
    ? `${incident.lat.toFixed(2)},${incident.lon.toFixed(2)}` 
    : 'unknown';
  
  // Content-only hash (no timestamp) for true deduplication
  const content = `${incident.category}:${normalizedTitle}:${locationKey}`;
  return `grok:${crypto.createHash('sha256').update(content).digest('hex').slice(0, 16)}`;
}

/**
 * Ingest from Grok Live Search.
 * keywords: The terms to search for.
 * missionId: (Optional) The UUID of the mission that triggered this search.
 */
export async function ingestFromGrokLive(keywords: string[], missionId?: string) {
  try {
    const result = await queryGrokLiveSearch(keywords);
    const stats = { processed: 0, inserted: 0, duplicates: 0, errors: 0 };

    for (const incident of result.incidents || []) {
      stats.processed++;
      try {
        // Tags include the mission ID if provided
        const tags = missionId ? [`mission:${missionId}`] : [];
        
        const { success, duplicate } = await persistIncident(
          {
            ...incident,
            source_hash: incident.dedup_key || generateDedupHash(incident),
            tags
          },
          incident.source_posts.map(p => ({
            source: `X.com/@${p.author}`,
            content: p.content,
            metadata: { ...p, platform: 'x.com' }
          }))
        );

        if (duplicate) stats.duplicates++;
        else if (success) stats.inserted++;
      } catch (err: any) {
        stats.errors++;
        console.error(`[GROK-LIVE] Error processing incident:`, {
          error: err.message,
          title: incident.title,
          timestamp: new Date().toISOString()
        });
      }
    }

    return { success: true, stats, metadata: result.search_metadata };
  } catch (error) {
    console.error('[GROK-LIVE] Fatal error during ingestion:', error);
    throw error;
  }
}
