# OpenMinr Design System: "Terminal Velocity"

## 1. Philosophy
**"Eyes on Glass, Hands on Keyboard."**
The OpenMinr interface is designed for high-velocity tactical decision making. It minimizes cognitive load through strict hierarchy, keyboard-first navigation, and context preservation. It is not a website; it is a HUD (Heads Up Display).

## 2. Layout Architecture: The Triptych
The application uses a strict three-pane layout to ensure information density without clutter.

### A. The Feed (Left Pane - 25%)
- **Purpose:** Ingestion and Triage.
- **Component:** `Feed.svelte`
- **Behavior:**
    - Virtualized vertical list.
    - Keyboard Navigation (`j`/`k` to select).
    - Status Indicators: Unread (Bright), Read (Dimmed), Claimed (Bordered).
    - **Visuals:** Minimalist "Alert Cards".

### B. The Situation Room (Center Pane - 50%)
- **Purpose:** Spatial Context and Correlation.
- **Component:** `SituationMap.svelte`
- **Behavior:**
    - Default: Geospatial view of active incidents.
    - **Focus Mode:** When an incident is selected, the map pans to the location, and asset connections (lines to nearby offices/servers) are drawn.
    - **Overlay:** `TacticalDossier.svelte` slides in partially to show details without obscuring the map context.

### C. Mission Control (Right Pane - 25%)
- **Purpose:** Analysis and Action.
- **Component:** `MissionHUD.svelte`
- **Modules:**
    - **Active Mission:** Dropdown to switch profiles (e.g., "Cyber Watch" vs. "Physical Security").
    - **Live Ticker:** Rolling stats (Incidents/Hr, Severity Distribution).
    - **Analyst Chat:** Real-time collaboration context-bound to the active incident or mission.

## 3. Visual Language (Tailwind)

### Color Palette (Domains)
We use semantic coloring to distinguish "Domains" instantly.

*   **Cyber Domain** (Digital Risk)
    *   Primary: `emerald-500` (#10b981)
    *   Background: `emerald-950/20`
*   **Kinetic Domain** (Physical Threats)
    *   Primary: `amber-500` (#f59e0b)
    *   Background: `amber-950/20`
*   **Geopolitical Domain** (Civil Unrest/Policy)
    *   Primary: `indigo-500` (#6366f1)
    *   Background: `indigo-950/20`
*   **Critical Alert** (Immediate Action)
    *   Primary: `rose-500` (#f43f5e)
    *   Animation: `animate-pulse`

### Typography
*   **Headers/Summary:** Sans-Serif (Inter/System) for readability.
*   **Data Points:** Monospace (JetBrains Mono/Consolas) for Lat/Lon, Hashes, Timestamps.
    *   Example: `<span class="font-mono text-xs text-brand-muted">34.0522° N, 118.2437° W</span>`

## 4. Interaction Patterns
*   **Shortcuts:**
    *   `?`: Toggle Shortcut Overlay
    *   `Space`: Acknowledge/Claim Selected Incident
    *   `Esc`: Clear Selection/Focus
    *   `/`: Focus "Command Line" (Search/Filter)
*   **Skeleton Loading:**
    *   Never use spinners for the feed. Use pulsing "Skeleton Cards" that match the dimensions of real alerts to maintain visual stability.

## 5. Implementation Directives
*   Use Svelte 5 Runes (`$state`, `$derived`) for all UI state.
*   Use `flex` and `grid` for all structural layout. Absolute positioning is reserved for Map overlays.
*   All new components must reside in `src/lib/components/hud/`.
