import { supabase } from '$lib/supabase/client';
import { analyzeIncident } from '../grok';
import { persistIncident } from './persistence';

export async function ingestGDACS() {
  const response = await fetch('https://www.gdacs.org/xml/rss.xml');
  const xml = await response.text();
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  
  for (const item of items.slice(0, 5)) {
    const title = item.match(/<title>(.*?)<\/title>/)?.[1];
    const description = item.match(/<description>(.*?)<\/description>/)?.[1];
    const lat = parseFloat(item.match(/<geo:lat>(.*?)<\/geo:lat>/)?.[1] || '0');
    const lon = parseFloat(item.match(/<geo:long>(.*?)<\/geo:long>/)?.[1] || '0');
    
    if (title && description) {
      const hash = `gdacs:${title}`;
      
      const { data: existing } = await supabase.from('incidents').select('id').eq('source_hash', hash).maybeSingle();
      if (existing) continue;

      try {
        const analysis = await analyzeIncident(`TITLE: ${title}\nDESCRIPTION: ${description}`);
        
        await persistIncident(
          {
            title: analysis.headline,
            description: analysis.tactical_summary,
            severity: analysis.severity,
            category: analysis.category,
            lat,
            lon,
            source_hash: hash
          },
          [{ source: 'GDACS-RSS', content: description }]
        );
      } catch (err) {
        console.error('[GDACS] Failed to process:', err);
      }
    }
  }
}
