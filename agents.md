# OpenMinr: Tactical Situational Awareness Platform

OpenMinr is a high-integrity, real-time event detection and alerting platform.

## 1. Core Principles
- **Real-time Tactical Intelligence**: Sub-second propagation via Supabase Realtime.
- **AI-Native Ingestion**: Using xAI Grok with Structured Outputs (JSON Schema) for guaranteed extraction integrity.
- **Lean Architecture**: Centralized persistence and system-wide reactive state management.
- **Command Center Aesthetic**: Data-dense UI with scanline animations and discrete tactical grids.
- **Zero Hardcoded Values**: All configuration, credentials, and user data must come from environment variables, user input, or persistent storage.

## 2. Technical Stack
- **Frontend**: Svelte 5 (Runes) with Tailwind CSS (Tactical Theme).
- **Backend**: Supabase (PostgreSQL, Realtime, RLS).
- **Intelligence**: xAI Grok (Grok-4) with Live Search and JSON Schema support.

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
- **Tactical UI**: Adhere to the design system specified in `DESIGN_SYSTEM.md`. Use `tactical-scan` and `tactical-grid` classes for high-integrity visual consistency.

## 6. STRICT PROHIBITIONS (Zero Tolerance)

### 6.1 NO Hardcoded Values
- **NEVER** hardcode API keys, credentials, or secrets in source code
- **NEVER** hardcode user IDs (e.g., `analystId = 'ANALYST-01'` or `analystId = 'OP-01'`)
- **NEVER** hardcode placeholder values (e.g., `'PLACEHOLDER'`, `'example'`, `'test'`)
- **NEVER** hardcode configuration values that should be environment-specific

**Correct Approach:**
```typescript
// WRONG - HARDCODED
let analystId = 'ANALYST-01';  // NEVER DO THIS

// CORRECT - From persistent storage or user input
let analystId = $state('');
$effect(() => {
  if (browser) {
    let id = localStorage.getItem('analyst_id');
    if (!id) {
      id = generateUUID();
      localStorage.setItem('analyst_id', id);
    }
    analystId = id;
  }
});
```

### 6.2 NO Fallback Values for Critical Configuration
- **NEVER** use `|| 'fallback'` for required environment variables
- **NEVER** use `|| 'PLACEHOLDER'` patterns
- **NEVER** provide default values for credentials or API keys

**Correct Approach:**
```typescript
// WRONG - FALLBACK
const apiKey = process.env.API_KEY || 'dummy-key';  // NEVER DO THIS

// CORRECT - Required with error
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable is required');
}
```

### 6.3 NO Workarounds or Shortcuts
- **NEVER** implement temporary workarounds "just for now"
- **NEVER** use `setTimeout` hacks to fix race conditions
- **NEVER** disable security features for convenience
- **NEVER** use `any` types to bypass TypeScript checks
- **NEVER** skip error handling with empty catch blocks

**Correct Approach:**
- Fix the root cause of issues
- Implement proper error handling
- Use proper TypeScript types
- Follow security best practices always

### 6.4 NO Fake/Test Data in Production
- **NEVER** commit test data, fake incidents, or dummy missions
- **NEVER** use `if (isDevelopment)` blocks to bypass production checks
- Database should only contain real data in production

## 7. Code Review Checklist
Before committing code, verify:
- [ ] No hardcoded strings that should be configurable
- [ ] No hardcoded IDs (user, analyst, system)
- [ ] No `|| 'placeholder'` or `|| 'fallback'` patterns for critical values
- [ ] All credentials come from environment variables
- [ ] No test data mixed with production code
- [ ] All error cases handled properly (no empty catches)
- [ ] TypeScript types are strict (no `any`)
- [ ] All security policies enforced (no bypasses)

## 8. Consequences of Violations
Code violating these prohibitions will be:
1. Rejected in code review
2. Reverted if discovered in main branch
3. Flagged as technical debt requiring immediate remediation

## 9. Authentication Strategy (Future)
Until authentication is implemented:
- Generate unique analyst IDs using `generateUUID()`
- Store in `localStorage` for session persistence
- Pass as required prop to components (no defaults)
- Display loading states while ID is being initialized

When authentication is ready:
- Replace localStorage with auth context
- Get analystId from authenticated session
- Maintain same component interface (required prop)
