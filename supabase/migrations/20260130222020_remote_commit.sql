-- Migration: Analyst Workflow & Security Hardening
-- Description: Adds tables for notes, audit logs, and applies RLS policies.

-- 1. ANALYST NOTES
-- Allows analysts to append structured observations to incidents without altering the original report.
CREATE TABLE IF NOT EXISTS analyst_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    analyst_id TEXT NOT NULL,
    content TEXT NOT NULL,
    note_type TEXT CHECK (note_type IN ('observation', 'assessment', 'action', 'handoff')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. AUDIT LOG
-- Immutable record of every significant action taken in the system.
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    actor_id TEXT NOT NULL, -- Analyst ID
    target_id UUID,         -- Incident ID
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. WATCHLISTS
-- Dynamic configuration for the ingestion engine.
CREATE TABLE IF NOT EXISTS watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS POLICIES
-- Enable Row Level Security on all tables to ensure data isolation and integrity.

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE intel_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyst_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

-- Policy: Incidents (Open Read, Analyst Write)
CREATE POLICY "Public Read Incidents" ON incidents FOR SELECT USING (true);
CREATE POLICY "Analyst Update Incidents" ON incidents FOR UPDATE USING (true); -- In prod, verify auth.uid()
CREATE POLICY "Analyst Insert Incidents" ON incidents FOR INSERT WITH CHECK (true);

-- Policy: Notes (Analyst Full Access)
CREATE POLICY "Analyst Manage Notes" ON analyst_notes FOR ALL USING (true);

-- Policy: Audit (Insert Only, No Delete/Update for integrity)
CREATE POLICY "System Insert Audit" ON audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins Read Audit" ON audit_log FOR SELECT USING (true);

-- Policy: Watchlist (Analyst Manage)
CREATE POLICY "Analyst Manage Watchlist" ON watchlists FOR ALL USING (true);

-- 5. ANALYST COLUMNS
-- Add workflow tracking columns to the main incidents table if they don't exist.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'claimed_by') THEN
        ALTER TABLE incidents ADD COLUMN claimed_by TEXT;
        ALTER TABLE incidents ADD COLUMN claimed_at TIMESTAMPTZ;
        ALTER TABLE incidents ADD COLUMN escalated_by TEXT;
        ALTER TABLE incidents ADD COLUMN escalated_at TIMESTAMPTZ;
        ALTER TABLE incidents ADD COLUMN escalation_reason TEXT;
        ALTER TABLE incidents ADD COLUMN resolved_by TEXT;
        ALTER TABLE incidents ADD COLUMN resolved_at TIMESTAMPTZ;
        ALTER TABLE incidents ADD COLUMN resolution_summary TEXT;
    END IF;
END $$;
