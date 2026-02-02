import { supabase } from '$lib/supabase/client';

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
  // 1. Atomic Upsert: Insert with conflict resolution on source_hash
  // This prevents race conditions where two processes might insert the same incident
  const { data: upsertedIncident, error: upsertError } = await supabase
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
  // If the record was just created, it won't have the exact same timestamp
  const isNewRecord = upsertedIncident.created_at === upsertedIncident.updated_at;
  
  if (!isNewRecord) {
    // This was an update (duplicate) - merge the tags
    // Fetch current tags and merge with new ones
    const { data: existing } = await supabase
      .from('incidents')
      .select('tags')
      .eq('id', upsertedIncident.id)
      .single();
    
    if (existing) {
      const mergedTags = Array.from(new Set([...(existing.tags || []), ...(incident.tags || [])]));
      
      await supabase
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

    await supabase.from('intel_reports').insert(reportsToInsert);
  }

  return { success: true, incident: upsertedIncident };
}
