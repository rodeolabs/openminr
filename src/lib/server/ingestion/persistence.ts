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
 * Handles deduplication and mission-aware tag merging.
 */
export async function persistIncident(incident: TacticalIncident, reports: IntelReport[]) {
  // 1. Check for existing incident by source_hash
  const { data: existing } = await supabase
    .from('incidents')
    .select('id, tags')
    .eq('source_hash', incident.source_hash)
    .maybeSingle();

  if (existing) {
    // Merge tags to link this incident to the current mission without duplication
    const mergedTags = Array.from(new Set([...(existing.tags || []), ...(incident.tags || [])]));
    
    await supabase
      .from('incidents')
      .update({ tags: mergedTags, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
      
    return { success: true, incident: { ...existing, tags: mergedTags }, duplicate: true };
  }

  // 2. Insert New Incident
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

  if (incError) throw incError;

  // 3. Insert Supporting Intel Reports
  if (reports.length > 0) {
    const reportsToInsert = reports.map(r => ({
      incident_id: newIncident.id,
      source: r.source,
      content: r.content,
      metadata: r.metadata ?? {}
    }));

    await supabase.from('intel_reports').insert(reportsToInsert);
  }

  return { success: true, incident: newIncident };
}
