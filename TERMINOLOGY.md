# OpenMinr Terminology Strategy
## Military-Intelligence Standard Alignment

Based on research of Dataminr First Alert and military/intelligence best practices, here is our standardized terminology:

---

## Core Concepts

### 1. Operational Scope (replaces "Mission")
**Rationale**: Military operations use "scope" to define the boundaries of an operation. More precise than "mission" which implies a one-time task.
- **Definition**: A defined area/region/topic of intelligence collection
- **Status**: `active` | `paused` | `complete`
- **Example**: "EUROPE-FOCUS operational scope"

### 2. Intelligence Vector (replaces "Source/Keyword Set")
**Rationale**: Military intelligence uses "vectors" to describe lines of information gathering.
- **Definition**: Collection of search parameters and keywords
- **Component**: Keywords, geographic boundaries, time constraints
- **Example**: "Border security intelligence vector"

### 3. Event Priority System (P1-P4)
**Rationale**: NATO and military operations use P-level priority systems (P1 = Priority 1)

| Level | Code | Label | Military Equivalent | Response Time |
|-------|------|-------|-------------------|---------------|
| 1 | P1 | CRITICAL | FLASH | Immediate |
| 2 | P2 | HIGH | PRIORITY | < 15 min |
| 3 | P3 | MEDIUM | ROUTINE | < 1 hour |
| 4 | P4 | LOW | INFO | < 4 hours |

### 4. Signal (replaces "Alert/Notification")
**Rationale**: Military uses "signal" for detected information requiring attention.
- **Definition**: A detected event or intelligence item
- **Usage**: "Incoming signal from border region"

### 5. Situation Room (replaces "Dashboard/Monitor")
**Rationale**: Standard military term for operational command center.
- **Definition**: Main operational interface
- **Components**: Feed, Map, Dossier

---

## UI Labels & Actions

### Navigation
- **Situation Room** → Main tactical view
- **Operational Scopes** → Configuration interface
- **Archive** → Historical records

### Actions
- **Deploy** → Initialize new scope
- **Activate** → Enable scope collection
- **Pause** → Temporarily disable (keep data)
- **Remove** → Delete scope permanently
- **Claim** → Take ownership of signal
- **Escalate** → Increase priority/visibility
- **Resolve** → Mark as complete

### Status Labels
- **Active** → Currently collecting
- **Paused** → Temporarily stopped
- **Claimed** → Has owner
- **Resolved** → Complete

### Data Fields
- **Codename** → Auto-generated identifier (e.g., "BALTIC-SHIELD")
- **Vector ID** → Unique scope identifier
- **Confidence** → Reliability score (0-100%)
- **Tactical Summary** → Brief assessment
- **Source Hash** → Deduplication identifier

---

## Military-Grade Terminology to Use

### Instead of "Scan" → "Collection Cycle"
**Why**: "Scan" is too generic; "collection" is proper intelligence terminology

### Instead of "Feed" → "Intelligence Stream"
**Why**: More professional, aligns with data streaming concepts

### Instead of "Map" → "Tactical Display"
**Why**: Military operations use tactical displays for situational awareness

### Instead of "Settings" → "Configuration"
**Why**: Standard military terminology

### Instead of "Delete" → "Remove" or "Archive"
**Why**: "Delete" sounds destructive; "remove" is more operational

---

## Words to Avoid

| Avoid | Use Instead | Reason |
|-------|-------------|---------|
| Mission | Operational Scope | More precise |
| Scan | Collection | Proper terminology |
| Assets | Resources or omit | Avoid corporate speak |
| Cyber/Kinetic | Use P1-P4 only | Simplifies classification |
| Severity | Priority Level | Standard military ranking |
| Alert | Signal | Less sensational |
| Dashboard | Situation Room | More professional |
| User | Operator | Military context |
| Account | Access Credentials | Security-focused |

---

## Consistency Rules

1. **Always uppercase P-levels**: P1, P2, P3, P4
2. **Codenames**: UPPERCASE with hyphen (e.g., "BALTIC-SHIELD")
3. **Status**: lowercase for code, UPPERCASE for UI labels
4. **Actions**: Verb-first, imperative mood (e.g., "Deploy", "Activate")
5. **Acronyms**: Spell out on first use in docs, use consistently in UI

---

## Dataminr-Inspired Elements

From Dataminr First Alert documentation:
- **"Critical event discovery"** → Our "Signal detection"
- **"Situational awareness"** → Our core value proposition
- **"Decision-making speed"** → Priority system purpose
- **"Operational scope"** → Our chosen term (validated by their usage)
- **"Force protection"** → Use case category
- **"Diplomatic security"** → Use case category

---

## Implementation Checklist

- [x] Change "Mission" to "Operational Scope"
- [x] Remove scan buttons (unnecessary)
- [x] Implement P1-P4 priority system
- [x] Simplify legend to priority-only
- [x] Remove "Assets" terminology
- [ ] Update HUD header labels
- [ ] Update Feed component labels
- [ ] Update TacticalDossier labels
- [ ] Create terminology reference in docs
