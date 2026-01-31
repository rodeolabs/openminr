# OpenMinr: Tactical Situational Awareness Platform

OpenMinr is a high-integrity, real-time event detection and alerting platform.

## 1. Core Principles
- **Real-time Tactical Intelligence**: Sub-second propagation via Supabase Realtime.
- **AI-Native Ingestion**: Using xAI Grok with Structured Outputs (JSON Schema) for guaranteed extraction integrity.
- **Lean Architecture**: Centralized persistence and system-wide reactive state management.
- **Command Center Aesthetic**: Data-dense UI with scanline animations and discrete tactical grids.

## 2. Technical Stack
- **Frontend**: Svelte 5 (Runes) with Tailwind CSS (Tactical Theme).
- **Backend**: Supabase (PostgreSQL, Realtime, RLS).
- **Intelligence**: xAI Grok (Grok-4-1-fast) with Live Search and JSON Schema support.

## 3. Data Flow
1. **Ingest**: Sequential triggers for Grok (Primary) and GDACS (Secondary).
2. **Analysis**: Grok extracts `headline`, `category`, `severity`, and `tactical_summary` using strict JSON Schema.
3. **Persist**: Centralized `persistence.ts` handles deduplication (`source_hash`) and atomic inserts.
4. **Broadcast**: Supabase Realtime notifies the "Situation Room" UI via a custom `realtime.ts` wrapper.

## 4. Analyst Workflow (The J2/J3 Loop)
- **Monitor**: Live feed with pulsing "Critical" alerts and tactical audio cues.
- **Claim**: Analysts take ownership of events to prevent redundant efforts.
- **Annotate**: Persistent notes for shared situational awareness.
- **Escalate/Resolve**: Standardized lifecycle for all tactical events.

## 5. Implementation Mandates (Developer/Agent)
- **Strict Runes**: Use `$state`, `$derived`, and `$effect` for all reactivity. No legacy Svelte 4 habits.
- **Standardized Ingestion**: Always use `persistIncident` from `lib/server/ingestion/persistence.ts`.
- **System Store**: Access global states (Sync, Online, Notifications) via the `system` store in `lib/system.svelte.ts`.
- **Structured AI**: Always use `json_schema` response format for AI calls. Never rely on raw text parsing or JSON Mode hacks.
- **Tactical UI**: Adhere to the `--color-brand-*` CSS variable set. Use `tactical-scan` and `tactical-grid` classes for high-integrity visual consistency.
