# OpenMinr: Tactical Situational Awareness Platform

A high-integrity, real-time event detection and alerting platform.

## Technical Stack
- **Frontend**: Svelte 5 (Runes) + Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Realtime, RLS)
- **Intelligence**: xAI Grok with JSON Schema output
- **Testing**: MCP (Model Context Protocol) + Playwright

## Core Principles
- **Real-time Tactical Intelligence**: Sub-second propagation via Supabase Realtime
- **AI-Native Ingestion**: Grok extracts `headline`, `category`, `priority`, `tactical_summary` using strict JSON Schema
- **Zero Hardcoded Values**: All configuration/credentials from env vars or persistent storage
- **Priority System**: P1-P4 (not S1-S5), P1 = Critical

## Data Flow
1. **Ingest**: AI-powered collection via Grok API using operational scope keywords
2. **Analysis**: Structured JSON extraction with guaranteed integrity
3. **Persist**: `lib/server/ingestion/persistence.ts` handles deduplication (`source_hash`) and atomic inserts
4. **Broadcast**: Supabase Realtime notifies the Situation Room UI

## Testing Strategy (MCP Primary)

### MCP (Model Context Protocol)
Primary testing method using Supabase MCP tools:

```typescript
// Test database state directly
await supabase.execute_sql('SELECT * FROM incidents WHERE priority = 1')

// Test component behavior with empty states
// Verify P1-P4 priority system
// Check terminology consistency
```

**Use MCP for:**
- Database state verification
- Data integrity validation
- API response testing
- Business logic verification

### Playwright (E2E Secondary)
Use for UI interaction validation only:

```bash
npm run test:e2e
```

**Use Playwright for:**
- User workflow simulation
- Component rendering verification
- Navigation testing

### Testing Without Data
- Verify empty states display correctly
- Test loading skeletons and "Scanning Signal" placeholders
- **NEVER manually insert fake data** (see Prohibitions)
- Create operational scopes to trigger real AI ingestion for data-dependent tests

## Prohibitions (Zero Tolerance)

### No Hardcoded Values
```typescript
// WRONG
let analystId = 'ANALYST-01'
const apiKey = process.env.API_KEY || 'fallback'

// CORRECT
let analystId = $state('')
$effect(() => {
  analystId = localStorage.getItem('analyst_id') || generateUUID()
})

const apiKey = process.env.API_KEY
if (!apiKey) throw new Error('API_KEY required')
```

### No Fake/Test Data
- **NEVER** commit test data, dummy missions, or placeholder incidents
- **NEVER** manually insert test data into database
- **NEVER** use `if (isDevelopment)` blocks to bypass production checks
- All data must come from AI API calls via ingestion pipeline

### No Workarounds
- No `setTimeout` hacks for race conditions (fix root cause)
- No `any` types (use strict TypeScript)
- No empty catch blocks (proper error handling required)

## Terminology Standards

| Term | Never Use | Context |
|------|-----------|---------|
| **Signal** | Alert, Severity | Detected events |
| **Operational Scope** | Mission, Vector | Intelligence collection area |
| **Signal Stream** | Feed | Main intelligence display |
| **Priority** | Severity | P1-P4 (Critical, High, Medium, Low) |
| **Operator** | User | Military context |

### Priority System
| Code | Label | Color |
|------|-------|-------|
| P1 | CRITICAL | Red |
| P2 | HIGH | Orange |
| P3 | MEDIUM | Yellow |
| P4 | LOW | Blue |

## Implementation Mandates
- **Strict Runes**: Use `$state`, `$derived`, `$effect` (no Svelte 4 patterns)
- **Standardized Ingestion**: Always use `persistIncident` from `lib/server/ingestion/persistence.ts`
- **System Store**: Access global states via `lib/system.svelte.ts`
- **Structured AI**: Always use `json_schema` response format, never raw text parsing
- **Tactical UI**: Use `tactical-scan` and `tactical-grid` classes from `DESIGN_SYSTEM.md`

## Code Review Checklist
- [ ] No hardcoded IDs, API keys, or placeholder values
- [ ] No `|| 'fallback'` for required config
- [ ] All data from AI API (no manual inserts)
- [ ] No `any` types or empty catch blocks
- [ ] P1-P4 priority labels throughout
- [ ] Correct terminology ("Signal" not "Alert", "Operational Scope" not "Mission")

## Authentication Strategy
**Current**: Generate unique analyst IDs with `generateUUID()`, store in `localStorage`
**Future**: Replace localStorage with authenticated session, maintain same component interfaces

## Violation Consequences
Code violating prohibitions will be rejected in review, reverted from main branch, and flagged as technical debt.
