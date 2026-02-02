import { supabaseAdmin } from '$lib/server/supabase';

/**
 * Input interface for persisting a new tactical incident
 * Used by ingestion sources (Grok, GDACS, Manual)
 */
export interface TacticalIncident {
  title: string;
  description: string;
  severity: number;
  category: string;
  lat: number | null;
  lon: number | null;
  confidence?: number;
  source_hash: string;
  tags?: string[];
}

/**
 * Input interface for creating an intel report
 * Differs from the full IntelReport type (in types.ts) which includes DB fields
 */
export interface IntelReportInput {
  source: string;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Standardized persistence layer for all intelligence sources.
 * Handles deduplication and mission-aware tag merging using atomic upsert.
 * 
 * Uses PostgreSQL ON CONFLICT to prevent race conditions during concurrent ingestion.
 */
export async function persistIncident(incident: TacticalIncident, reports: IntelReportInput[]) {
  console.log(`[PERSIST] Processing incident: "${incident.title.slice(0, 60)}..." | Reports: ${reports.length}`);
  if (reports.length > 0) {
    console.log(`[PERSIST] Report sources: ${reports.map(r => r.source).join(', ')}`);
  }
  
  // 1. Atomic Upsert: Insert with conflict resolution on source_hash
  const { data: upsertedIncident, error: upsertError } = await supabaseAdmin
    .from('incidents')
    .upsert({
      title: incident.title.slice(0, 200),
      description: incident.description,
      severity: Math.max(1, Math.min(5, incident.severity)),
      category: incident.category,
      status: 'active',
      lat: incident.lat,
      lon: incident.lon,
      confidence_score: incident.confidence ?? 1.0,
      tags: incident.tags ?? [],
      source_hash: incident.source_hash,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'source_hash',
      ignoreDuplicates: false // Update on conflict to merge tags
    })
    .select()
    .single();

  if (upsertError) throw upsertError;

  // Check if this was an existing record by comparing timestamps
  const isNewRecord = upsertedIncident.created_at === upsertedIncident.updated_at;
  
  if (!isNewRecord) {
    console.log(`[PERSIST] Duplicate detected (source_hash: ${incident.source_hash}) - merging tags, skipping reports`);
    const { data: existing } = await supabaseAdmin
      .from('incidents')
      .select('tags')
      .eq('id', upsertedIncident.id)
      .single();
    
    if (existing) {
      const mergedTags = Array.from(new Set([...(existing.tags || []), ...(incident.tags || [])]));
      
      await supabaseAdmin
        .from('incidents')
        .update({ tags: mergedTags })
        .eq('id', upsertedIncident.id);
      
      return { success: true, incident: { ...upsertedIncident, tags: mergedTags }, duplicate: true };
    }
    
    return { success: true, incident: upsertedIncident, duplicate: true };
  }

  // 2. Insert Supporting Intel Reports (only for new incidents)
  if (reports.length > 0) {
    const reportsToInsert = reports.map(r => ({
      incident_id: upsertedIncident.id,
      source: r.source,
      content: r.content,
      metadata: r.metadata ?? {}
    }));

    console.log(`[PERSIST] Inserting ${reportsToInsert.length} intel reports for incident ${upsertedIncident.id}`);
    console.log(`[PERSIST] Reports data:`, JSON.stringify(reportsToInsert.map(r => ({ source: r.source, hasUrl: !!r.metadata?.url })), null, 2));

    const { data: insertedReports, error: reportsError } = await supabaseAdmin
      .from('intel_reports')
      .insert(reportsToInsert)
      .select();

    if (reportsError) {
      console.error('[PERSIST] CRITICAL ERROR - Failed to insert intel reports:', {
        error: reportsError.message,
        code: reportsError.code,
        details: reportsError.details,
        hint: reportsError.hint,
        incidentId: upsertedIncident.id
      });
    } else {
      console.log(`[PERSIST] SUCCESS - Inserted ${insertedReports?.length || 0} intel reports`);
    }
  } else {
    console.log(`[PERSIST] No intel reports to insert for incident ${upsertedIncident.id}`);
  }

  return { success: true, incident: upsertedIncident };
}
