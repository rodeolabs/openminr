import { json, type RequestEvent } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/client';
import { ingestGDACS } from '$lib/server/ingestion/gdacs';
import { ingestFromGrokLive } from '$lib/server/ingestion/grok-live';

/**
 * Manual Sync API Endpoint
 * For browser-based manual sync triggers (no secret required)
 * Uses session-based authentication instead
 */
export async function GET({ request }: RequestEvent) {
  const url = new URL(request.url);
  const force = url.searchParams.get('force') === 'true';

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
