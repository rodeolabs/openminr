export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: number;
  category: string;
  status: 'active' | 'claimed' | 'escalated' | 'resolved' | 'dismissed';
  lat: number | null;
  lon: number | null;
  confidence_score: number;
  created_at: string;
  updated_at: string;
  claimed_by?: string;
  claimed_at?: string;
  escalated_by?: string;
  escalated_at?: string;
  escalation_reason?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_summary?: string;
  intel_reports?: IntelReport[];
}

export interface IntelReport {
  id: string;
  incident_id: string;
  source: string;
  content: string;
  metadata?: any;
  created_at: string;
}

export interface AnalystNote {
  id: string;
  incident_id: string;
  analyst_id: string;
  content: string;
  note_type: 'observation' | 'assessment' | 'action' | 'handoff';
  created_at: string;
}

export interface WatchlistKeyword {
  id: string;
  keyword: string;
  category: string;
  active: boolean;
  created_at: string;
}
