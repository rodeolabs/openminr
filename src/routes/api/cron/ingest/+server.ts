import { json, type RequestEvent } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/client';
import { ingestGDACS } from '$lib/server/ingestion/gdacs';
import { ingestFromGrokLive } from '$lib/server/ingestion/grok-live';

/**
 * Mission-Based Ingestion Pipeline
 * Loops through all active tactical missions and executes optimized search strategies.
 */
export async function GET({ url }: RequestEvent) {
  const secret = url.searchParams.get('secret');
  const force = url.searchParams.get('force') === 'true';
  
  if (secret !== 'tactical-ingest-2026') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Check System Global State
  const { data: config } = await supabase.from('system_config').select('value').eq('key', 'ingestion_status').single();
  if (!force && !config?.value?.enabled) return json({ skipped: true, reason: 'System paused' });

  // 2. Fetch Active Missions
  const { data: missions } = await supabase.from('missions').select('*').eq('status', 'active');
  
  if (!missions?.length) {
    console.log('[INGEST] No active missions found.');
    return json({ success: true, message: 'No active missions' });
  }

  const results: any = { timestamp: new Date().toISOString(), missions_processed: 0, sources: {} };

  // 3. Process Missions
  for (const mission of missions) {
    console.log(`[INGEST] Executing Mission: ${mission.name}`);
    
    // PRIMARY: Grok Live Search
    try {
      const keywords = mission.keywords as string[];
      const r = await ingestFromGrokLive(keywords, mission.id);
      results.sources[mission.name] = { status: 'success', new: r.stats.inserted };
      results.missions_processed++;
    } catch (e: any) {
      console.error(`[INGEST] Mission ${mission.name} failed:`, e);
      results.sources[mission.name] = { status: 'failed', error: e.message };
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }

  // 4. SECONDARY: Global Official Sources (GDACS)
  try {
    await ingestGDACS();
    results.gdacs = 'success';
  } catch (e: any) {
    results.gdacs = 'failed';
  }

  return json({ success: true, results });
}
