import { json, type RequestEvent } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/client';
import { ingestGDACS } from '$lib/server/ingestion/gdacs';
import { ingestFromGrokLive } from '$lib/server/ingestion/grok-live';

/**
 * Cron Job: Tactical Intelligence Ingestion Pipeline
 * 
 * Orchestrates the periodic gathering of intelligence from multiple sources.
 * Architecture:
 * 1. PRIMARY: Grok Live Search (real-time X.com intelligence) - High fidelity, real-time.
 * 2. SECONDARY: GDACS (authoritative disaster data) - Slow but high confidence.
 * 
 * Invoked by external cron service (e.g. GitHub Actions, Vercel Cron) or internal "System Online" loop.
 */

export async function GET({ url }: RequestEvent) {
  // Security: Simple secret key authentication for the cron trigger
  const secret = url.searchParams.get('secret');
  const force = url.searchParams.get('force') === 'true';
  
  if (secret !== 'tactical-ingest-2026') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Operational Safety: Check the centralized "kill switch" in the database
  // to ensure ingestion only runs when the system is actively monitoring.
  if (!force) {
    const { data } = await supabase
      .from('system_config')
      .select('value, updated_at')
      .eq('key', 'ingestion_status')
      .single();
      
    if (!data?.value?.enabled) {
        console.log('[INGEST] Skipped: Ingestion disabled by operator.');
        return json({ skipped: true, reason: 'Ingestion disabled' });
    }

    // Rate Limiting: Enforce a 60-second cooldown to respect API quotas and system load.
    const lastRun = data.value.last_run_at ? new Date(data.value.last_run_at).getTime() : 0;
    const now = Date.now();
    if (now - lastRun < 60000) {
        console.log('[INGEST] Skipped: Cooldown active (Last run < 60s ago)');
        return json({ skipped: true, reason: 'Cooldown active' });
    }

    // Update timestamp to lock the process immediately
    await supabase
      .from('system_config')
      .update({ value: { ...data.value, last_run_at: new Date().toISOString() } })
      .eq('key', 'ingestion_status');
  }

  const results: Record<string, any> = {
    pipeline_version: '2.0-grok-centric',
    timestamp: new Date().toISOString()
  };

  try {
    console.log('[INGEST] Starting Grok-Centric Intelligence Pipeline...');

    // Dynamic Targeting: Fetch active keywords from the operator-managed Watchlist.
    // This allows analysts to retarget the system in real-time without code deployment.
    const { data: watchlists } = await supabase
      .from('watchlists')
      .select('keyword, category')
      .eq('active', true);
    
    // Fallback default keywords if watchlist is empty
    const keywords = watchlists?.map(w => w.keyword) || [
      'breaking military',
      'explosion attack',
      'infrastructure failure',
      'cyber attack',
      'protest riot'
    ];
    
    console.log(`[INGEST] Active watchlist: ${keywords.join(', ')}`);

    // Execution: Run ingestion modules sequentially to manage concurrent connection limits.
    
    // 1. Grok Live Search (Primary)
    try {
        const r = await ingestFromGrokLive(keywords);
        results.grok_live = {
            status: 'success',
            new_incidents: r.stats.inserted,
            duplicates: r.stats.duplicates,
            errors: r.stats.errors,
            metadata: r.metadata
        };
    } catch (e: any) {
        console.error('[INGEST] Grok Live failed:', e);
        results.grok_live = { status: 'failed', error: e.message };
    }

    // Short delay to allow DB connections to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. GDACS (Secondary)
    try {
        await ingestGDACS();
        results.gdacs = { status: 'success' };
    } catch (e: any) {
        console.error('[INGEST] GDACS failed:', e);
        results.gdacs = { status: 'failed', error: e.message };
    }
    
    const allFailed = results.grok_live?.status === 'failed' && results.gdacs?.status === 'failed';
    
    console.log('[INGEST] Pipeline complete:', JSON.stringify(results, null, 2));
    
    return json({ 
      success: !allFailed, 
      results 
    }, { 
      status: allFailed ? 500 : 200 
    });

  } catch (error: any) {
    console.error('[INGEST] Critical pipeline failure:', error);
    return json({ 
      success: false, 
      error: error.message || 'Unknown error',
      results 
    }, { status: 500 });
  }
}
