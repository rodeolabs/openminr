export interface Database {
  public: {
    Tables: {
      incidents: {
        Row: Incident
      }
      assets: {
        Row: Asset
      }
    }
  }
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: number;
  category: string;
  domain: 'cyber' | 'physical' | 'geopolitical' | 'brand' | 'executive' | null;
  tactical_summary: string | null;
  status: 'active' | 'claimed' | 'escalated' | 'resolved' | 'dismissed';
  lat: number | null;
  lon: number | null;
  source_hash: string | null;
  confidence_score: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
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

export interface Asset {
  id: string;
  created_at: string;
  name: string;
  type: 'office' | 'datacenter' | 'supply_route' | 'personnel' | 'digital_asset';
  description: string | null;
  lat: number | null;
  lon: number | null;
  criticality: number | null;
  metadata: any;
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

export interface Mission {
  id: string;
  name: string;
  goal: string;
  keywords: string[];
  status: 'active' | 'paused' | 'complete';
  created_at: string;
  updated_at: string;
}
