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

## Docker Playwright Testing

### MCP Configuration
The Playwright MCP is configured in `~/.config/opencode/opencode.json` with Docker support:

```json
"playwright": {
  "type": "local",
  "command": [
    "docker",
    "run",
    "-i",
    "--rm",
    "--init",
    "--pull=always",
    "-e",
    "PLAYWRIGHT_BASE_URL=http://host.docker.internal:5173",
    "mcr.microsoft.com/playwright/mcp",
    "--headless",
    "--browser=chromium",
    "--no-sandbox"
  ],
  "enabled": true
}
```

### Network Configuration

**The Problem**: On macOS, Docker runs in a virtual machine, so `--network host` doesn't work as expected. The container cannot access the host's localhost directly.

**The Solution**:
1. **Remove `--network host`**: Not supported on macOS Docker Desktop
2. **Use `host.docker.internal`**: Docker's special DNS name that resolves to the host
3. **Pass via environment variable**: The MCP passes `PLAYWRIGHT_BASE_URL` to the container
4. **Vite must bind to all interfaces**: Use `vite --host` in `package.json`

### Configuration Requirements

**~/.config/opencode/opencode.json**:
```json
"playwright": {
  "type": "local",
  "command": [
    "docker",
    "run",
    "-i",
    "--rm",
    "--init",
    "--pull=always",
    "-e",
    "PLAYWRIGHT_BASE_URL=http://host.docker.internal:5173",
    "mcr.microsoft.com/playwright/mcp",
    "--headless",
    "--browser=chromium",
    "--no-sandbox"
  ],
  "enabled": true
}
```

**package.json**:
```json
"scripts": {
  "dev": "vite --host"  // Binds to 0.0.0.0 (all interfaces)
}
```

**playwright.config.ts**:
```typescript
// Use environment variable for Docker MCP compatibility (host.docker.internal on macOS)
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173';

export default defineConfig({
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Platform-Specific Notes

**macOS**:
- `--network host` does NOT work (Docker runs in VM)
- Must use `host.docker.internal` DNS name
- Requires passing environment variable to container

**Linux**:
- `--network host` works natively
- Can use `localhost` directly
- Alternative: Use `host.docker.internal` with `--add-host=host.docker.internal:host-gateway`

**Windows**:
- Similar to macOS, use `host.docker.internal`
- Docker Desktop creates the necessary DNS entry automatically

### Troubleshooting

**Connection Refused Errors**:
- Verify dev server is running: `lsof -i :5173` should show `*:5173` or `0.0.0.0:5173`
- Check Playwright MCP is enabled: `opencode mcp list`
- Ensure Docker daemon is running
- Test host accessibility from container: `docker run --rm alpine ping host.docker.internal`
- Try restarting the dev server after config changes

**host.docker.internal Not Resolving**:
- On older Docker versions, may need to manually add to `/etc/hosts`
- Check Docker Desktop version: `docker version`
- Update to latest Docker Desktop for best compatibility

**IPv6 vs IPv4 Issues**:
- If you see `[::1]:5173` in `lsof` output, the server isn't bound to IPv4
- The `--host` flag ensures binding to all interfaces
- Always use explicit IP or `host.docker.internal` instead of `localhost`

### Testing Workflow

1. **Configure MCP**: Ensure `~/.config/opencode/opencode.json` has the correct Playwright settings
2. **Restart opencode**: Changes to MCP config require restart
3. **Start the dev server**: `npm run dev` (must use `--host`)
4. **Verify accessibility**: 
   - Host: `curl http://127.0.0.1:5173`
   - Container: `docker run --rm alpine sh -c "apk add curl && curl http://host.docker.internal:5173"`
5. **Use Playwright MCP**: Navigate and test via MCP tools
6. **Never use local test runners**: Always use the MCP via `/test` command or Playwright tools

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
