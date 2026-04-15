# RuneFort Phase 6 — Dark Factory Control Room Build Prompt
**Version:** 1.0 | **Date:** April 2026 | **Type:** Phase 6-7 Implementation (SvelteKit + MCP Integration)

---

## Your Mission

You are building **RuneFort Phase 6: Dark Factory Control Room** — the observability layer that turns the [&] dark factory pipeline into a navigable, spatial interface. Phase 6 adds the Assembly overlay, live MCP data integration, pipeline triggers from the fort, build history corridors, and session learning via Graphonomous.

**Read `docs/spec/README.md` fully before writing a single line.** It is the authoritative spec. Focus on sections 2.3 (Assembly overlay), 7.2 (data flow), 7.4 (MCP integration), and 9 Phases 6-7.

RuneFort is the **observation layer** of the dark factory pipeline:
```
SpecPrompt (spec in) → Agentelic (build) → OS-008 (enforce) → FleetPrompt (distribute) → RuneFort (observe)
```

---

## Target Stack

```
Framework:   SvelteKit 2.x (Svelte 5)
Adapter:     Cloudflare Pages (zero-cost hosting)
Rendering:   CSS Grid + SVG overlays (no canvas, no WebGL)
Pan/Zoom:    Pointer events + CSS transform (~20 lines JS)
State:       Svelte writable stores (Map<"row,col", TileData>)
Rune Font:   Noto Sans Runic (Google Fonts)
Data:        MCP tool calls to Graphonomous, PRISM, Agentelic, FleetPrompt
Auth:        Supabase Auth (shared ecosystem)
Realtime:    Supabase Realtime (multi-user fort viewing)
Database:    Supabase rune.* schema (migration range 090-099)
```

---

## Prerequisites

Phase 6 assumes Phases 1-5 are complete:
- Phase 1: Static blueprint (CSS Grid, L1 campus view, room labels)
- Phase 2: Live data (Graphonomous MCP connection, thermal/confidence overlays)
- Phase 3: Full zoom stack (L0-L4, rune overlay, topology overlay, district view)
- Phase 4: Fort-to-fort (bridges, token flow, B2B privacy, nested forts)
- Phase 5: Living fort (consolidation animations, goal viz, room dynamics)

If any phases are incomplete, implement them first.

---

## What Phase 6 Adds

### 6.1 Assembly Overlay (key `A`)

A new overlay showing dark factory pipeline status for each product fort:

| Visual Element | Data Source | Rendering |
|---------------|-------------|-----------|
| Spec version badge | SpecPrompt ConsolidationEvent | Text badge on fort gate tile |
| Build status | Agentelic `agent_status` MCP tool | Corridor tile colors: blue=parsing, yellow=generating, orange=compiling, green=succeeded, red=failed |
| Trust score | FleetPrompt `registry_trust` MCP tool | Glow intensity on FleetPrompt fort (0-100 mapped to brightness) |
| Deploy stage | Agentelic `agent_status` MCP tool | Gate tile state: staging=amber, canary=yellow, production=green |
| Test results | Agentelic `agent_status` MCP tool | Room of tiles at L3: each test = one tile, green=pass, red=fail |

Toggle the Assembly overlay with the `A` key. When active, all other overlays can still be layered.

### 6.2 Pipeline Trigger from Fort

Clicking a fort's outer gate when Assembly overlay is active triggers a build:
1. Display confirmation dialog: "Trigger build for {fort_name}?"
2. On confirm, call `agentelic.agent_build(agent_id: fort.agent_id)` via MCP
3. Show building animation on the fort (pulsing tiles along the build corridor)
4. Update on completion (success = green glow, fail = red alert)

### 6.3 Build History Corridor

At L2 zoom, show build history as a corridor of tiles inside each product fort:
- Each tile = one build
- Color: green (succeeded), red (failed), gray (pending)
- Click a build tile to see details (version, duration, test results)
- Corridor grows as new builds complete
- Latest build is at the corridor entrance

### 6.4 Test Result Room

At L3 zoom into a build tile, show test results:
- Each acceptance test is a tile
- Green = pass, red = fail
- Click a test tile for details (given/expected/actual, tool calls, assertions)
- Assertion breakdown shown as rune sequences

### 6.5 Live Telemetry Wiring

Replace synthetic data with real MCP data:

```svelte
<!-- Replace synthetic overlays with live MCP calls -->

<!-- Thermal overlay: real activity from Graphonomous -->
graphonomous.consolidate(action: "stats") → activity per room

<!-- Diagnostic overlay: real CL scores from PRISM -->
prism.observe(action: "latest_judgments") → CL dimension scores per fort

<!-- Confidence overlay: real confidence from Graphonomous -->
graphonomous.retrieve(action: "context", query: "...") → node confidence values

<!-- Assembly overlay: real build status from Agentelic + FleetPrompt -->
agentelic.agent_status(agent_id: "...") → build/test/deploy status
fleetprompt.registry_search(query: "...") → trust scores
```

### 6.6 Session Learning (Graphonomous Write-Back)

RuneFort now writes to Graphonomous, not just reads:

```
Chat tool call results → graphonomous.act(action: "store_node", ...)
Fort navigation patterns → graphonomous.learn(action: "from_outcome", ...)
Cross-session context → graphonomous.retrieve(action: "context") at fort load
```

This creates a closed loop: navigate fort → learn patterns → optimize layout.

### 6.7 GitHub Integration

Repo import gains live status indicators:
- Branch indicator (current branch, open PRs count)
- Last commit timestamp
- CI workflow status (passing/failing/running)
- Refresh on push via Supabase Realtime subscription

---

## Implementation Structure

Add these files to the existing RuneFort SvelteKit project:

```
src/
├── lib/
│   ├── overlays/
│   │   └── AssemblyOverlay.svelte      # Assembly overlay component (key A)
│   ├── corridor/
│   │   ├── BuildCorridor.svelte        # L2 build history corridor
│   │   └── TestRoom.svelte             # L3 test result room
│   ├── pipeline/
│   │   ├── PipelineTrigger.svelte      # Gate click → build trigger
│   │   └── PipelineStatus.svelte       # Build status badge component
│   ├── telemetry/
│   │   ├── LiveThermal.svelte          # Real thermal data from Graphonomous
│   │   ├── LiveDiagnostic.svelte       # Real CL scores from PRISM
│   │   ├── LiveConfidence.svelte       # Real confidence from Graphonomous
│   │   └── LiveAssembly.svelte         # Real build/trust from Agentelic/FleetPrompt
│   ├── learning/
│   │   ├── SessionLearning.ts          # Write navigation patterns to Graphonomous
│   │   └── CrossSession.ts             # Load prior context on fort init
│   ├── github/
│   │   ├── GitHubStatus.svelte         # Branch, PR, CI status badges
│   │   └── github-api.ts              # GitHub API client for repo status
│   └── mcp/
│       ├── agentelic-client.ts         # MCP client for Agentelic tools
│       └── fleetprompt-client.ts       # MCP client for FleetPrompt tools
├── routes/
│   └── fort/[id]/
│       ├── +page.svelte               # (existing) — add Assembly overlay toggle
│       └── assembly/
│           └── +page.svelte           # Dedicated assembly view
```

---

## Implementation Order

### Step 1: MCP Client Layer (week 1)

1. **Implement Agentelic MCP client** (`mcp/agentelic-client.ts`)
   - `agentStatus(agentId)` → build status, test results, deploy stage
   - `templateList(framework, productType)` → available templates
   - `agentBuild(agentId)` → trigger build
2. **Implement FleetPrompt MCP client** (`mcp/fleetprompt-client.ts`)
   - `registrySearch(query)` → published agents, trust scores
   - `registryTrust(agentId)` → trust score detail
3. Both clients use the existing MCP client infrastructure from Phases 1-5

### Step 2: Assembly Overlay (week 2)

1. **Implement AssemblyOverlay.svelte**
   - Register `A` key toggle in overlay system
   - For each product fort, fetch pipeline status from MCP clients
   - Render spec version badge, build status tiles, trust glow, deploy gate state
   - Poll on interval or subscribe to Supabase Realtime for updates
2. **Add Assembly overlay to overlay table** in fort renderer

### Step 3: Build Corridor + Test Room (weeks 3-4)

1. **Implement BuildCorridor.svelte**
   - Render at L2 zoom inside product forts
   - Each tile = one build, color-coded by status
   - Click handler opens build detail panel
   - Latest build at corridor entrance
2. **Implement TestRoom.svelte**
   - Render at L3 zoom when drilling into a build tile
   - Each acceptance test = one tile
   - Green/red coloring
   - Click handler shows test detail (given/expected/actual, assertions)

### Step 4: Pipeline Trigger (week 4)

1. **Implement PipelineTrigger.svelte**
   - Attach to fort gate click event when Assembly overlay active
   - Confirmation dialog
   - Call `agentelic.agent_build` via MCP
   - Show building animation (pulsing tiles)
   - Update on completion

### Step 5: Live Telemetry (weeks 5-6)

1. **Replace synthetic data** in existing overlays with real MCP calls:
   - Thermal → `graphonomous.consolidate(action: "stats")`
   - Diagnostic → `prism.observe(action: "latest_judgments")`
   - Confidence → `graphonomous.retrieve(action: "context")`
   - Assembly → `agentelic.agent_status` + `fleetprompt.registry_search`
2. **Implement polling/subscription** strategy
   - Fast data (thermal, confidence): 5s poll or Supabase Realtime
   - Slow data (build status, trust): 30s poll or event-driven

### Step 6: Session Learning (week 7)

1. **Implement SessionLearning.ts**
   - Track fort navigation patterns (rooms visited, zoom levels, overlay usage)
   - On significant interaction, call `graphonomous.act(action: "store_node")` to persist insight
   - On build trigger/result, call `graphonomous.learn(action: "from_outcome")` for feedback
2. **Implement CrossSession.ts**
   - On fort load, call `graphonomous.retrieve(action: "context", query: fort_id)` for prior context
   - Pre-populate overlay preferences, last viewed zoom levels, frequently visited rooms

### Step 7: GitHub Integration (week 8)

1. **Implement github-api.ts** — fetch branch, PR count, last commit, CI status
2. **Implement GitHubStatus.svelte** — badge component showing live repo status
3. **Supabase Realtime subscription** for push-triggered refresh

### Step 8: Phase 7 — Multi-Tenant Dark Factory (weeks 9-12)

1. **Workspace-scoped districts** — each workspace gets its own district view via `rune.districts` table
2. **Private fort sharing** — invite collaborators using Supabase RLS on `rune.forts`
3. **Pipeline event stream** — real-time feed of dark factory events as animated bridge tokens
4. **Cross-workspace bridges** — B2B privacy (see walls, not rooms) for partner organizations
5. **PRISM dashboard integration** — diagnostic overlay becomes full PRISM control panel

---

## Key Constraints

- **RuneFort does NOT make LLM calls.** The agent does all LLM work. RuneFort is pure visualization + persistence.
- **RuneFort does NOT modify Agentelic state.** It reads build status but does not trigger builds directly — the agent triggers via the MCP tool call (the UI just provides the button).
- **RuneFort does NOT modify PRISM state.** Observation only.
- **Session learning writes to Graphonomous** via `act` and `learn` machines. This is the only write path.
- **All fort data is workspace-scoped** via `rune.*` Supabase tables with RLS.
- **CSS Grid + SVG only.** No canvas, no WebGL. The Minecraft constraint: everything is tiles.
- **Zero-cost hosting on Cloudflare Pages.** No server-side runtime budget.

---

## Data Flow Summary

```
Assembly Overlay reads:
  Agentelic MCP → agent_status → build status, test results, deploy stage
  FleetPrompt MCP → registry_search/trust → trust scores, publish status
  SpecPrompt → spec hash (via Agentelic build metadata)

Live Telemetry reads:
  Graphonomous MCP → consolidate(stats) → thermal overlay
  Graphonomous MCP → retrieve(context) → confidence overlay
  PRISM MCP → observe(latest_judgments) → diagnostic overlay
  PRISM MCP → diagnose(leaderboard) → system rankings

Session Learning writes:
  → Graphonomous MCP → act(store_node) → persist chat insights
  → Graphonomous MCP → learn(from_outcome) → feed interaction outcomes
  ← Graphonomous MCP → retrieve(context) → cross-session context at load
```

---

## PULSE Connections (Phase 6+)

Two new connections added to RuneFort's PULSE manifest:

1. **ConsolidationEvent** from `agentelic.build_pipeline.consolidate_artifacts` → `act_render`
   - Build completion events drive Assembly overlay updates
2. **ReputationUpdate** from `fleetprompt.trust.act_rerank` → `act_render`
   - Trust score changes drive Assembly overlay trust badges

---

## Success Criteria

- [ ] Assembly overlay toggles with `A` key and shows pipeline status for all product forts
- [ ] Build corridor renders at L2 with color-coded build history tiles
- [ ] Test result room renders at L3 with per-test pass/fail tiles
- [ ] Pipeline trigger from fort gate calls Agentelic MCP and shows build animation
- [ ] Live telemetry replaces synthetic data in thermal, diagnostic, confidence, assembly overlays
- [ ] Session learning writes navigation patterns to Graphonomous and loads cross-session context
- [ ] GitHub integration shows branch, PR count, CI status on imported forts
- [ ] Workspace-scoped districts work with Supabase RLS
- [ ] Pipeline event stream shows animated tokens on bridges during dark factory events
- [ ] All data flows through MCP — no direct database access from the client
