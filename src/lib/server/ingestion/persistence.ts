import { supabase } from '$lib/supabase/client';

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

export interface IntelReport {
  source: string;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Standardized persistence layer for all intelligence sources.
 * Handles deduplication and atomic insertion of incidents and their supporting reports.
 */
export async function persistIncident(incident: TacticalIncident, reports: IntelReport[]) {
  // 1. Insert or Skip Duplicate
  const { data: newIncident, error: incError } = await supabase
    .from('incidents')
    .insert({
      title: incident.title.slice(0, 200),
      description: incident.description,
      severity: Math.max(1, Math.min(5, incident.severity)),
      category: incident.category,
      status: 'active',
      lat: incident.lat,
      lon: incident.lon,
      confidence_score: incident.confidence ?? 1.0,
      tags: incident.tags ?? [],
      source_hash: incident.source_hash
    })
    .select()
    .single();

  if (incError) {
    if (incError.code === '23505') return { success: false, duplicate: true };
    throw incError;
  }

  // 2. Insert Supporting Intel Reports
  if (reports.length > 0) {
    const reportsToInsert = reports.map(r => ({
      incident_id: newIncident.id,
      source: r.source,
      content: r.content,
      metadata: r.metadata ?? {}
    }));

    const { error: repError } = await supabase
      .from('intel_reports')
      .insert(reportsToInsert);

    if (repError) console.error('[PERSISTENCE] Failed to insert intel reports:', repError);
  }

  return { success: true, incident: newIncident };
}
