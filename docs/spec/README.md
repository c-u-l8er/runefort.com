# RuneFort Spec

**Product:** RuneFort — Spatial cognition interface for continual learning agents
**Status:** v0.1 draft
**Owner:** [&] Protocol ecosystem
**Date:** 2026-04-13

---

## 1. Vision

RuneFort is a spatial visualization and navigation system for AI operating systems. It renders any PULSE-declared closed loop as a navigable **fort** — a blueprint-style floor plan where rooms are cognitive domains, corridors are data flows, walls are policies, and the hidden rune machinery inside the walls is the actual operational code.

**Core metaphor:** The fort is what you understand. The runes are what you inspect.

**Design constraint (the Minecraft rule):** Everything is made of the same primitive — the tile. A room is tiles with shared borders. A corridor is tiles in a line. A tower is tiles that stack into zoom levels. No special-case rendering. One primitive composes into any cognitive architecture.

### 1.1 Positioning

| System | What It Does | RuneFort Difference |
|--------|-------------|---------------------|
| MemPalace | Spatial metadata labels on ChromaDB | RuneFort is navigable, dynamic, multi-fort |
| AIOS (Rutgers) | Kernel abstractions for LLM agents | RuneFort spatializes what AIOS manages |
| MemGPT/Letta | LLM self-manages tiered memory | RuneFort makes those tiers visible and walkable |
| MemOS | Memory infrastructure containers | RuneFort is the building those containers live in |
| EverMemOS | Self-organizing episodic→semantic | RuneFort shows the reorganization happening |

RuneFort does not replace any of these. It renders them. Any system that declares a PULSE loop manifest gets a fort.

### 1.2 Three-Protocol Integration

RuneFort sits atop the [&] three-protocol stack:

- **[&] Protocol** (structural) — defines what capabilities a fort contains (`*.ampersand.json`)
- **PULSE** (temporal) — defines the fort's heartbeat, phases, cadence (`*.pulse.json`)
- **PRISM** (diagnostic) — measures the fort's health from watchtowers

RuneFort reads all three to generate and animate the spatial representation.

---

## 2. Architecture

### 2.1 Zoom Levels

RuneFort uses semantic zoom — the same tile grid renders differently at each level. Zooming in reveals more; zooming out collapses detail into summary.

| Level | Name | What You See | Data Source |
|-------|------|-------------|-------------|
| **L0** | District | Multiple forts on a shared landscape | PULSE manifests across products |
| **L1** | Campus | Single fort — all wings/zones visible | PULSE manifest phases + [&] capabilities |
| **L2** | Wing | Rooms within a zone, connections between them | Graphonomous node clusters + edge topology |
| **L3** | Room | Individual nodes, edges, confidence values | Graphonomous node detail + metrics |
| **L4** | Rune | Single operation — the dark code inside a wall | Phase telemetry, causal provenance, config |

### 2.2 Component System (9 primitives)

Every visual element is composed from these components:

#### Tile (the primitive)

```
<RuneTile>
  Properties:
    - id: string (unique within fort)
    - label: string (human-readable name)
    - state: idle | active | pulsing | sealed | alert
    - activity: 0.0-1.0 (live metric, drives brightness)
    - edges: { n: id?, s: id?, e: id?, w: id? } (connections to adjacent tiles)
    - rune: string? (hidden glyph — the dark code identity, only visible at L4)
    - elevation: number (0 = ground floor, >0 = tower levels)
```

#### Composites (tiles that compose)

| Component | Composition Rule | Fort Role | Zoom Visibility |
|-----------|-----------------|-----------|-----------------|
| `<RuneTile>` | Atomic — the primitive | Any single cell | L2+ |
| `<RuneRoom>` | Bordered tile group | A cognitive domain (memory cluster, goal set) | L1+ |
| `<RuneHall>` | Linear tile sequence | A data flow path (corridor, pipeline) | L1+ |
| `<RuneTower>` | Vertically stacked tiles (zoom-in layers) | Observation point (PRISM), temporal stack (PULSE) | L0+ |
| `<RuneGate>` | Tile with filter state | Router (internal) or border checkpoint (B2B) | L1+ |
| `<RuneWall>` | Barrier tile sequence | Policy boundary, access control | L1+ |
| `<RuneFort>` | Root container — arranges all composites | One cognitive system (one PULSE loop) | L0+ |
| `<RuneBridge>` | Fort-to-fort connection (cross-boundary flow) | Inter-system data exchange | L0 |
| `<RuneDistrict>` | Multi-fort layout | The full ecosystem view | L0 |

#### The fractal property

`<RuneFort>` can appear inside `<RuneRoom>`. This is how loop nesting works:

- PRISM fort contains a room that holds a Graphonomous fort
- Graphonomous fort contains a room that holds a Deliberation fort
- A parent company fort contains rooms that are subsidiary forts

There is no depth limit. The zoom levels repeat recursively.

### 2.3 Overlay System

Same floor plan, different lenses. Overlays are toggleable layers rendered on top of the structural view (L0 overlay is always on):

| Overlay | Key | What It Shows | Data Source |
|---------|-----|--------------|-------------|
| **Structure** | always on | Rooms, walls, corridors, gates, towers | PULSE manifest + [&] capabilities |
| **Flow** | `F` | Animated arrows showing data/token movement | PULSE cross-loop signals + phase I/O |
| **Thermal** | `T` | Activity heatmap (hot = busy, cold = dormant) | Phase telemetry (duration_ms, throughput) |
| **Temporal** | `P` | PULSE timing — which rooms are in which phase | PULSE cadence + current phase state |
| **Diagnostic** | `D` | PRISM scores, anomaly markers, failure clusters | PRISM observe/diagnose outputs |
| **Rune** | `R` | The dark code — operation configs, policy rules, causal chains | Graphonomous node metadata, [&] bindings |
| **Confidence** | `C` | Node confidence heatmap (bright = high, dim = low) | Graphonomous confidence values |
| **Topology** | `K` | SCC highlighting, kappa values, cycle visualization | Graphonomous route machine (κ analysis) |

---

## 3. Fort-to-Fort Patterns

RuneFort supports three inter-fort patterns, all using the same component primitives:

### 3.1 Shared Ground (the [&] ecosystem model)

Multiple forts sit on a shared foundation — the shared Supabase instance with `amp.*` core schema (profiles, workspaces, entitlements).

```
<RuneDistrict>
  <SharedGround schema="amp.*" />  <!-- identity, workspaces, entitlements -->
  <RuneFort id="graphonomous" schema="(sqlite)" />
  <RuneFort id="webhost" schema="webhost.*" />
  <RuneFort id="bendscript" schema="kag.*" />
  <RuneFort id="agentromatic" schema="orchestrate.*" />
  ...
</RuneDistrict>
```

Each fort has its own rooms (per-product schema) but shares the ground (amp.* core). No cross-product foreign keys — connection is through identity/workspace only.

### 3.2 Fort-to-Fort Bridges (B2B / AIOS-to-AIOS)

Two independent forts connected by explicit bridges. The five PULSE cross-loop tokens are the traffic:

| Token | CloudEvents Type | Direction | What It Carries |
|-------|-----------------|-----------|-----------------|
| `TopologyContext` | `org.pulse.topology_context` | emit → consume | SCC analysis, κ value, routing decision |
| `DeliberationResult` | `org.pulse.deliberation_result` | emit → consume | Verdict, evidence chain, consensus timestamp |
| `OutcomeSignal` | `org.pulse.outcome_signal` | emit → consume | success/failure/partial/timeout + causal parents |
| `ReputationUpdate` | `org.pulse.reputation_update` | emit → consume | participant_id, delta, evidence |
| `ConsolidationEvent` | `org.pulse.consolidation_event` | emit → consume | merged/pruned/promoted node IDs |

The `<RuneBridge>` component renders as a connection between two `<RuneGate>` components on different forts. The Flow overlay animates tokens crossing the bridge.

**Visibility rule:** You see full detail inside your own fort. Partner forts appear as opaque shapes — you see their outer walls, gates, and bridge connections, but not their rooms. This is the B2B privacy boundary.

### 3.3 Nested Forts (Loop Nesting)

A fort inside a fort. Matches the PULSE nesting declaration:

```
PRISM (outer fort)
├── compose room
├── interact room
│   └── [Graphonomous fort] (nested — triggered during interact)
│       ├── retrieve room
│       ├── route room
│       │   └── [Deliberation fort] (nested — triggered when κ > 0)
│       ├── act room
│       ├── learn room
│       └── consolidate room
├── observe room
├── reflect room
└── diagnose room
```

Nesting is declared in the PULSE manifest via `inner_loops[]`. The trigger condition determines when the nested fort activates (lights up). The wait strategy determines whether the outer fort pauses (`until_done`, `until_stable`) or continues (`fire_forget`).

---

## 4. Mapping the [&] Portfolio

Every product in the ecosystem maps to a fort. The fort layout is generated from three inputs:

1. **PULSE Loop Manifest** → phases become rooms, cadence drives the clocktower
2. **[&] Capability Bindings** → `&memory.*`, `&reason.*`, etc. become room contents
3. **Supabase Schema** (if any) → persistent storage visualized as vault rooms

### 4.1 Product Fort Registry

#### Graphonomous (Memory Substrate)
- **Loop ID:** `graphonomous.memory_loop`
- **Rooms:** Retrieve (ᚲ), Route (ᚨ), Act (ᚠ), Learn (ᛃ), Consolidate (ᛞ)
- **Storage:** Embedded SQLite (no Supabase) — shown as internal vault, not shared ground
- **Special:** This fort appears nested inside every other fort that queries `graphonomous://workspace/{ws_id}`. It is the shared knowledge substrate.
- **Node types visualized:** semantic, procedural, episodic, temporal, outcome, goal
- **Edge types visualized:** causal, supports, contradicts, related, derived_from, supersedes, resolves, part_of, follows, depends_on, similar_to
- **Rune overlay shows:** confidence values, timescale tiers (fast/medium/slow/glacial), decay rates, access recency, causal provenance chains

#### WebHost.Systems (Hosting Layer)
- **Loop ID:** `webhost.deploy_invoke`
- **Rooms:** Retrieve Deployment, Route Runtime, Act Invoke, Learn Telemetry, Consolidate Billing
- **Storage:** Supabase `webhost.*` — agents, deployments, telemetry, billing, API keys
- **Gates:** Incoming (agent invocations), Outgoing (to Cloudflare Workers / AWS AgentCore)
- **Bridges:** → Delegatic (tier entitlements), → TickTickClock (SLA enforcement), → Graphonomous (optional MCP sidecars)
- **Rune overlay shows:** invocation counts, latency percentiles, billing aggregation, runtime provider selection

#### BendScript (Knowledge Layer)
- **Loop ID:** `bendscript.knowledge_edit`
- **Rooms:** Retrieve Graph, Route Synthesis Tier, Act Compose, Learn Topology, Consolidate Export
- **Storage:** Supabase `kag.*` — workspaces, planes, nodes, edges, AI generations
- **Special:** Only non-Elixir product fort (SvelteKit). Canvas rendering engine is a room-level detail.
- **Gates:** MCP Server (search_nodes, get_subgraph, traverse_path, query_graph, build_from_text)
- **Rune overlay shows:** synthesis tier (1-4), node types (normal/stargate), edge extraction confidence

#### Agentelic (Engineering Layer)
- **Loop ID:** `agentelic.build_pipeline`
- **Rooms:** Retrieve Spec, Route Pipeline, Act Build, Learn Build, Consolidate Artifacts
- **Storage:** Supabase `agentelic.*` — agents, builds, test runs, deployments
- **Bridges:** ← SpecPrompt (spec input), → FleetPrompt (publish), → WebHost.Systems (deploy), → Delegatic (compliance gates)
- **Rune overlay shows:** build status, test coverage, deployment stage (staging → canary → production)

#### AgenTroMatic (Orchestration Layer)
- **Loop ID:** `agentromatic.deliberation`
- **Rooms:** Bidding, Overlap Analysis, Negotiation, Election, Execution, Consensus Commit, Learn Reputation
- **Storage:** Ra consensus log + Supabase `orchestrate.*` — deliberations, bids, reputation, traces
- **Special:** 7 phases (not 5) — extended loop topology. Election room has quorum-before-commit invariant (guard post icon).
- **Bridges:** ← Delegatic (task routing), → PRISM (outcome signals), A2A protocol (agent-to-agent comms)
- **Rune overlay shows:** reputation scores (domain-aware ELO), bid values, consensus state, A2A message flow

#### Delegatic (Governance Layer)
- **Loop ID:** `delegatic.governance`
- **Rooms:** Retrieve Policy, Route Decision, Act Enforce, Learn Drift, Consolidate Audit
- **Storage:** Supabase `govern.*` — orgs (containment tree), memberships, policies, audit events
- **Special:** This fort IS the canonical policy substrate. Its walls ARE the walls of every other fort that references `delegatic://workspace/{ws_id}`. Monotonic policy inheritance means child policies can only narrow, never widen.
- **Bridges:** → every fort that declares `policy: delegatic://...` in its PULSE substrate
- **Rune overlay shows:** policy inheritance tree, permission checks, audit trail, drift detection

#### Deliberatic (Decision Protocol)
- **Loop ID:** `deliberatic.argumentation`
- **Rooms:** Open Round, Submit Positions, Compute Semantics, Commit Verdict, Learn Calibration
- **Storage:** In-memory Merkle-chained evidence log (no Supabase)
- **Special:** Transport-agnostic (A2A v0.3, MCP, JSON-RPC). Emits `DeliberationResult` tokens — PULSE-substitutable with AgenTroMatic verdicts.
- **Bridges:** ← Delegatic (triggered on ambiguity), → AgenTroMatic (verdict), → PRISM (outcome)
- **Rune overlay shows:** argument graph (bipolar: attacks + supports), position weights, Merkle chain integrity

#### FleetPrompt (Distribution Layer)
- **Loop ID:** `fleetprompt.marketplace`
- **Rooms:** Retrieve Manifest, Route Discovery, Act Install, Learn Trust, Consolidate Registry
- **Storage:** Supabase `fleet.*` — agents, versions, publishers, trust scores, installs, categories
- **Special:** Trust score is a 4-signal composite (test results, spec compliance, usage history, audit quality). Trust room glows by score.
- **Bridges:** ← Agentelic (tested agents), → WebHost.Systems (one-click deploy), ← PRISM (reputation updates)
- **Rune overlay shows:** trust score breakdown, install counts, category taxonomy, publisher verification

#### SpecPrompt (Standards Layer)
- **Loop ID:** `specprompt.spec_lifecycle`
- **Rooms:** Retrieve Spec, Route Action, Act Transform, Learn Lint, Consolidate Versions
- **Storage:** Git-based (no Supabase, no auth)
- **Special:** Smallest fort — operates purely on filesystem. Shown as a watchtower-style structure at the edge of the district, feeding specs into the ecosystem.
- **Bridges:** → Agentelic (spec input), → [&] Protocol (validation)
- **Rune overlay shows:** SPEC.md frontmatter, capability declarations, acceptance test status

#### GeoFleetic (Spatial Layer)
- **Loop ID:** `geofleetic.fleet_learning`
- **Rooms:** Retrieve Twin, Route Optimizer, Act Move, Learn Federated, Consolidate Routes
- **Storage:** PostGIS + Tile38 + Supabase `geo.*` — fleets, assets (spatial twins), routes, geofences
- **Special:** Federated learning via delta-CRDTs (privacy-preserving). Fort has a unique "map room" showing spatial twin positions.
- **Bridges:** → TickTickClock (temporal routing constraints), → Delegatic (fleet authorization), → Graphonomous (learned patterns)
- **MCP Tools:** fleet_locate, route_optimize, geofence_event, route_explain
- **Rune overlay shows:** CRDT sync state, LoRA model deltas, geofence boundaries, route optimization scores

#### TickTickClock (Temporal Layer)
- **Loop ID:** `ticktickclock.temporal_learning`
- **Rooms:** Retrieve Stream, Route Engine, Act Process, Learn Consolidate, Consolidate Promote
- **Storage:** TimescaleDB + SQLite (edge) + Supabase `temporal.*` — streams, data points, anomalies, forecasts
- **Special:** Multi-timescale memory (fast/medium/slow/glacial with independent consolidation — mirrors Graphonomous timescale tiers). The clocktower of the district.
- **Bridges:** → WebHost.Systems (SLA enforcement), → GeoFleetic (temporal routing), → Graphonomous (pattern storage)
- **MCP Tools:** anomaly_detect, anomaly_subscribe, forecast_predict, pattern_detect, temporal_enrich
- **Rune overlay shows:** stream throughput, anomaly scores, forecast confidence, pattern signatures

#### OpenSentience (Research Foundation)
- **Loop ID:** (none — defines protocols, doesn't run a loop)
- **Representation:** Not a fort. Rendered as the **bedrock layer** under the district — the theoretical foundation that all forts are built on. Contains the 10 protocol definitions (OS-001 through OS-010).
- **Storage:** ETS (governance cache) + pluggable audit backend
- **Rune overlay shows:** Protocol definitions, governance shim config, autonomy levels (observe/advise/act)

#### PRISM (Diagnostic Measurement)
- **Loop ID:** `prism.benchmark`
- **Rooms:** Compose, Interact, Observe, Reflect, Diagnose
- **Storage:** Implicit (scenarios, transcripts, judgments)
- **Special:** The watchtower complex of the district. Observes all other forts. Contains nested forts during the Interact phase (runs target systems through their loops).
- **9 CL Dimensions visualized:** retrievability, causal grounding, coverage, retention, drift resistance, forgetting quality, transfer, calibration, latency
- **Bridges:** ← every fort (OutcomeSignals), → FleetPrompt (ReputationUpdates), → every fort (DiagnosticReports)
- **Rune overlay shows:** IRT parameters, scenario lifecycle (proposed → valid → running → judged → saturated/retired), failure clusters, leaderboard deltas

#### PULSE (Temporal Declaration)
- **Loop ID:** (meta — declares all other loops)
- **Representation:** Not a fort. Rendered as the **clocktower mechanism** inside every fort. The PULSE manifest IS the blueprint from which a fort's room layout is generated.
- **Rune overlay shows:** Phase definitions, cadence config, invariant checkboxes, nesting topology, cross-loop signal connections

#### [&] Protocol (Structural Composition)
- **Loop ID:** (meta — declares all capabilities)
- **Representation:** Not a fort. Rendered as the **construction material** — the stones, doors, and mechanisms that forts are built from. The `*.ampersand.json` manifest defines what capabilities exist in each room.
- **Five capability domains:** `&memory.*`, `&reason.*`, `&time.*`, `&space.*`, `&govern.*`
- **Rune overlay shows:** Capability bindings, hard/soft constraints, escalation conditions, governance hooks

### 4.2 District Layout (Full Ecosystem)

```
┌─ RUNEFORT DISTRICT ──────────────────────────────────────────────────────┐
│                                                                          │
│   [OpenSentience bedrock layer — protocols OS-001 through OS-010]        │
│   ═══════════════════════════════════════════════════════════════         │
│                                                                          │
│   ┌─ PRISM ────┐                                                         │
│   │ Watchtower │ ←── observes all forts                                  │
│   │ Complex    │                                                         │
│   └────────────┘                                                         │
│         ║                                                                │
│   ┌─────╨──── Shared Ground (amp.*) ────────────────────────────────┐    │
│   │                                                                  │    │
│   │  ┌─Graphonomous─┐  ┌─Delegatic──┐  ┌─TickTickClock─┐           │    │
│   │  │ Memory       │  │ Governance │  │ Temporal      │           │    │
│   │  │ Substrate    │  │ (walls for │  │ (clocktower   │           │    │
│   │  │ (nested in   │  │  all forts)│  │  for all)     │           │    │
│   │  │  every fort) │  └────────────┘  └───────────────┘           │    │
│   │  └──────────────┘                                               │    │
│   │                                                                  │    │
│   │  ┌─WebHost──┐  ┌─Agentelic─┐  ┌─AgenTroMatic─┐  ┌─FleetPrmt─┐ │    │
│   │  │ Hosting  │←─│ Build     │──│ Orchestrate  │──│ Registry  │ │    │
│   │  │ Layer    │  │ Pipeline  │  │ 7-phase loop │  │ + Trust   │ │    │
│   │  └──────────┘  └──────────┘  └──────────────┘  └──────────┘ │    │
│   │                                                                  │    │
│   │  ┌─BendScript─┐  ┌─GeoFleetic─┐  ┌─SpecPrompt─┐               │    │
│   │  │ Knowledge  │  │ Spatial    │  │ Standards  │               │    │
│   │  │ Editor     │  │ Intelligence│  │ (git-only) │               │    │
│   │  └────────────┘  └────────────┘  └────────────┘               │    │
│   │                                                                  │    │
│   │  ┌─Deliberatic─┐                                                │    │
│   │  │ Argument    │  (in-memory, no Supabase)                      │    │
│   │  │ Protocol    │                                                 │    │
│   │  └─────────────┘                                                │    │
│   │                                                                  │    │
│   └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Canonical Bridge Map

These are the declared PULSE cross-loop connections, rendered as bridges:

| From Fort | To Fort | Token(s) | Trigger |
|-----------|---------|----------|---------|
| Graphonomous | PRISM | `OutcomeSignal` | Every learn phase |
| PRISM | FleetPrompt | `ReputationUpdate` | Every diagnose phase |
| PRISM | All forts | `DiagnosticReport` | End of benchmark cycle |
| AgenTroMatic | PRISM | `OutcomeSignal` | Every consensus commit |
| AgenTroMatic | FleetPrompt | `ReputationUpdate` | Reputation learning |
| Deliberatic | AgenTroMatic | `DeliberationResult` | Verdict commit |
| Deliberatic | PRISM | `OutcomeSignal` | Calibration learning |
| Delegatic | AgenTroMatic | Task routing | Ambiguity/conflict detected |
| Delegatic | All forts | Policy enforcement | Every permission check |
| SpecPrompt | Agentelic | Spec input | Spec change / manual trigger |
| Agentelic | FleetPrompt | Agent publish | Build success |
| Agentelic | WebHost.Systems | Deploy | Staged deployment |
| FleetPrompt | WebHost.Systems | One-click deploy | User install |
| TickTickClock | WebHost.Systems | SLA signals | Anomaly detection |
| TickTickClock | GeoFleetic | Temporal context | Route optimization |
| GeoFleetic | Graphonomous | Learned patterns | Federated consolidation |
| Graphonomous | All forts | Memory context | Every retrieve query |

---

## 5. The Rune Layer (Dark Code)

Runes are not the UI. They are the hidden machinery inside the walls. The fort looks like a fort — stone, rooms, doors. Runes are what you find when you inspect a mechanism.

### 5.1 Rune Visibility

Runes appear only:
- At **zoom level L4** (single operation detail)
- When the **Rune overlay (R)** is toggled on at any zoom level
- When **inspecting a wall, gate, or mechanism** (click to crack open)

### 5.2 Rune Alphabet

The Elder Futhark (24 runes, Unicode U+16A0-U+16FF) maps to operational concepts. These are NOT labels on rooms — they are identifiers for the mechanisms running inside:

| Rune | Name | Meaning | RuneFort Operation |
|------|------|---------|-------------------|
| ᚲ | Kaunan | torch/knowledge | `retrieve` phase — illuminating what's known |
| ᚨ | Ansuz | signal | `route` phase — signal processing, κ routing |
| ᚠ | Fehu | wealth/store | `act.store_node` — depositing knowledge |
| ᛃ | Jera | harvest/cycle | `learn` phase — harvesting outcomes |
| ᛞ | Dagaz | dawn/breakthrough | `consolidate` phase — new understanding emerging |
| ᛉ | Algiz | protection | PRISM observation — diagnostic shielding |
| ᚱ | Raidho | journey/path | deliberation path — reasoning through cycles |
| ᛏ | Tiwaz | justice | policy enforcement — Delegatic governance |
| ᛊ | Sowilo | sun/time | PULSE cadence — temporal heartbeat |
| ᛈ | Perthro | mystery/chance | epistemic frontier — unknown zones |
| ᚦ | Thurisaz | thorn/barrier | wall mechanism — access denial, policy block |
| ᚢ | Uruz | strength | edge weight — relationship strength |
| ᚷ | Gebo | gift/exchange | bridge token — cross-loop signal exchange |
| ᚹ | Wunjo | joy/harmony | consensus reached — quorum satisfied |
| ᚺ | Haglaz | disruption | anomaly detected — PRISM alert |
| ᚾ | Naudiz | need/constraint | hard constraint — [&] capability boundary |
| ᛁ | Isa | ice/stasis | sealed room — decayed/forgotten memory domain |
| ᛇ | Eihwaz | endurance | glacial timescale — permanent knowledge |
| ᛒ | Berkanan | growth | timescale promotion — knowledge maturing |
| ᛖ | Ehwaz | movement | data flow — token in transit |
| ᛗ | Mannaz | human | human-in-the-loop — escalation point |
| ᛚ | Laguz | water/flow | stream processing — TickTickClock temporal flow |
| ᛜ | Ingwaz | seed/potential | goal node — intent not yet realized |
| ᛟ | Othala | heritage/home | workspace root — identity anchor |

### 5.3 Rune Combinations

Runes compose into sequences that describe compound operations:

- **ᚲᚨᚠ** (retrieve → route → act) — standard fast-path execution
- **ᚲᚨᚱᚠ** (retrieve → route → deliberate → act) — κ > 0 deliberation path
- **ᛃᛞ** (learn → consolidate) — feedback loop closure
- **ᚷᚨᚷ** (exchange → route → exchange) — bridge relay (fort-to-fort)
- **ᛁᛞ** (sealed → breakthrough) — memory domain revival after decay
- **ᚺᛉᛗ** (disruption → protection → human) — anomaly → diagnostic → escalation

These sequences appear in the Rune overlay as animated glyph chains flowing through corridors and mechanisms.

---

## 6. Live Behaviors

The fort is alive. Components change state based on real-time data from PULSE telemetry and Graphonomous metrics.

### 6.1 Structural Dynamics

| Behavior | Trigger | Visual Effect |
|----------|---------|--------------|
| Room brightens | High access frequency on nodes in that domain | Tile `activity` increases → brighter fill |
| Room dims | Low access, confidence decay | Tile `activity` decreases → darker fill |
| Room seals | Forgetting policy prunes all nodes below threshold | Tile `state` → `sealed`, ᛁ rune overlay |
| Room grows | New knowledge domain emerges (new node cluster) | New tiles appear at fort edges |
| Room shrinks | Consolidation merges nodes, domain contracts | Tiles removed, borders contract |
| Corridor pulses | Deliberation active (κ > 0) | Hall tiles `state` → `pulsing`, ᚱ rune flows |
| Wall thickens | Policy blocks increase | Wall tiles multiply (thicker barrier) |
| Wall thins | Policy relaxation | Wall tiles reduce |
| Gate opens/closes | Router permits/blocks traffic | Gate tile `state` toggles |
| Tower fires | PRISM anomaly detected | Tower tile `state` → `alert`, ᚺ rune |
| Clocktower ticks | PULSE phase transition | Tower tile pulses on cadence |
| Bridge lights up | Cross-loop token in transit | Bridge tiles animate with ᚷ rune |

### 6.2 Consolidation Animations

During Graphonomous consolidation cycles, the fort visibly reorganizes:

1. **Decay sweep** — a wave passes through rooms, dimming low-confidence tiles
2. **Prune** — tiles below threshold fade out and disappear
3. **Merge** — two similar tiles slide together and combine (node merge)
4. **Strengthen** — corridor edges (co-activated paths) glow brighter
5. **Promote** — a tile rises (timescale promotion: fast → medium → slow → glacial)
6. **Abstract** — episodic cluster tiles collapse into a single semantic summary tile

### 6.3 Goal Visualization

Goal nodes (ᛜ Ingwaz rune) have special rendering:

- **Proposed goals** — dim seed icon at room edge
- **Active goals** — glowing seed with progress bar (0.0-1.0)
- **Completed goals** — full bloom icon, fades to wall decoration over time
- **Failed goals** — cracked seed, remains as lesson marker
- **Blocked goals** — seed behind wall segment (ᛗ human escalation marker)

Goal coverage is shown as a highlight ring — linked supporting nodes light up when you select a goal.

---

## 7. Technical Architecture

### 7.1 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | SvelteKit 2.x (Svelte 5) | Same as BendScript — proven in portfolio |
| Adapter | Cloudflare Pages | Same as BendScript — zero-cost hosting |
| Rendering | CSS Grid + SVG overlays | Zero-dependency, SSR-compatible, accessible |
| Pan/Zoom | Pointer events + CSS transform | ~20 lines JS, no library needed |
| Tile state | Svelte writable stores | `Map<"row,col", TileData>` — reactive updates |
| Rune font | Noto Sans Runic (Google Fonts) | Free, covers full Elder Futhark |
| Data source | Graphonomous MCP + PULSE manifests | Live data via MCP tool calls |
| Auth | Supabase Auth (shared ecosystem) | Same identity as all [&] products |
| Fort generation | rot.js algorithms (optional, ~30KB) | BSP room generation, A* pathfinding |
| Real-time | Supabase Realtime | Multi-user fort viewing (shared workspace) |

### 7.2 Data Flow

```
PULSE manifests (*.pulse.json)
  → parsed at build time
  → generate fort skeleton (rooms from phases, bridges from connections)

[&] manifests (*.ampersand.json)
  → parsed at build time
  → populate room contents (capabilities → tile types)

Graphonomous MCP (live)
  → retrieve(action: "context") → populate room detail (nodes, edges, confidence)
  → route(action: "topology") → drive κ overlay
  → consolidate events → trigger reorganization animations

PRISM MCP (live)
  → observe/diagnose outputs → drive diagnostic overlay
  → leaderboard updates → drive trust scores on FleetPrompt fort

PULSE telemetry (live)
  → phase_metrics → drive thermal overlay
  → loop_metrics → drive clocktower cadence
```

### 7.3 Supabase Schema

RuneFort uses the shared Supabase instance with schema range **090-099**:

```sql
-- Schema: rune.*
-- Migration range: 090-099

-- Fort layouts (persisted spatial arrangements)
CREATE TABLE rune.forts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES amp.workspaces(id),
  loop_id TEXT NOT NULL,          -- PULSE loop ID
  layout JSONB NOT NULL,          -- tile grid + room boundaries
  overlays JSONB DEFAULT '{}',    -- saved overlay preferences
  zoom_level INTEGER DEFAULT 1,   -- last viewed zoom level
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Saved views (bookmarked zoom positions)
CREATE TABLE rune.views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fort_id UUID REFERENCES rune.forts(id),
  name TEXT NOT NULL,
  viewport JSONB NOT NULL,        -- {x, y, scale, overlays[], zoom_level}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bridge configurations (fort-to-fort connections)
CREATE TABLE rune.bridges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES amp.workspaces(id),
  from_fort_id UUID REFERENCES rune.forts(id),
  to_fort_id UUID REFERENCES rune.forts(id),
  token_types TEXT[] NOT NULL,    -- which PULSE tokens cross this bridge
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- District layouts (multi-fort arrangements)
CREATE TABLE rune.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES amp.workspaces(id),
  name TEXT NOT NULL,
  fort_positions JSONB NOT NULL,  -- {fort_id: {x, y, scale}}
  bridge_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: workspace-based multi-tenancy (same pattern as all [&] products)
ALTER TABLE rune.forts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rune.views ENABLE ROW LEVEL SECURITY;
ALTER TABLE rune.bridges ENABLE ROW LEVEL SECURITY;
ALTER TABLE rune.districts ENABLE ROW LEVEL SECURITY;
```

### 7.4 MCP Integration

RuneFort reads from Graphonomous and PRISM MCP servers. It does NOT make LLM calls — the agent does all LLM work, RuneFort is a pure visualization layer.

```
RuneFort reads (MCP tool calls from agent):
  - graphonomous.retrieve(action: "context", query: "...")  → node/edge data
  - graphonomous.retrieve(action: "topology", query: "...")  → κ analysis
  - graphonomous.act(action: "get_node", id: "...")          → single node detail
  - graphonomous.consolidate(action: "stats")                → graph health metrics
  - prism.observe(action: "latest_judgments")                 → CL dimension scores
  - prism.diagnose(action: "leaderboard")                    → system rankings
  - prism.diagnose(action: "failure_patterns")               → anomaly data

RuneFort does NOT:
  - Make LLM calls (rendering only)
  - Write to Graphonomous (read-only visualization)
  - Modify PRISM state (observation only)
```

---

## 8. PULSE Loop Manifest

```json
{
  "pulse_version": "0.1",
  "loop_id": "runefort.spatial_render",
  "version": "0.1.0",
  "description": "Spatial cognition visualization loop — renders PULSE-declared systems as navigable forts",
  "phases": [
    {
      "id": "retrieve_layout",
      "kind": "retrieve",
      "description": "Fetch fort skeleton from PULSE manifests + [&] capabilities",
      "inputs": ["pulse_manifests", "ampersand_manifests"],
      "outputs": ["fort_skeleton"],
      "timeout_ms": 5000
    },
    {
      "id": "route_zoom",
      "kind": "route",
      "description": "Determine render detail level based on viewport + semantic zoom thresholds",
      "inputs": ["fort_skeleton", "viewport_state"],
      "outputs": ["render_plan"],
      "timeout_ms": 100
    },
    {
      "id": "act_render",
      "kind": "act",
      "description": "Render tiles, overlays, animations to DOM/SVG",
      "inputs": ["render_plan", "live_telemetry"],
      "outputs": ["rendered_frame"],
      "timeout_ms": 16
    },
    {
      "id": "learn_interaction",
      "kind": "learn",
      "description": "Learn from user navigation patterns — which views are useful, which are ignored",
      "inputs": ["user_events", "viewport_history"],
      "outputs": ["interaction_signal"],
      "timeout_ms": 1000
    },
    {
      "id": "consolidate_layout",
      "kind": "consolidate",
      "description": "Optimize fort layouts based on usage patterns — frequently visited rooms move closer, unused rooms recede",
      "inputs": ["interaction_signals", "fort_skeleton"],
      "outputs": ["optimized_layout"],
      "timeout_ms": 30000
    }
  ],
  "closure": "eventual",
  "cadence": {
    "type": "event",
    "description": "Renders on viewport change, telemetry update, or user interaction"
  },
  "substrates": {
    "memory": "graphonomous://workspace/{ws_id}",
    "policy": "delegatic://workspace/{ws_id}",
    "audit": "supabase://rune.views",
    "auth": "supabase://auth",
    "time": "ticktickclock://workspace/{ws_id}"
  },
  "invariants": {
    "phase_atomicity": true,
    "feedback_immutability": true,
    "append_only_audit": true,
    "kappa_routing": false,
    "quorum_before_commit": false,
    "outcome_grounding": true,
    "trace_id_propagation": true
  },
  "connections": [
    {
      "signal": "TopologyContext",
      "direction": "consume",
      "source_loop": "graphonomous.memory_loop",
      "source_phase": "route_topology",
      "target_phase": "route_zoom",
      "delivery": "best_effort"
    },
    {
      "signal": "OutcomeSignal",
      "direction": "consume",
      "source_loop": "*",
      "source_phase": "*_learn",
      "target_phase": "act_render",
      "delivery": "best_effort"
    },
    {
      "signal": "ConsolidationEvent",
      "direction": "consume",
      "source_loop": "graphonomous.memory_loop",
      "source_phase": "consolidate_idle",
      "target_phase": "act_render",
      "delivery": "best_effort"
    }
  ],
  "telemetry": {
    "phase_metrics": ["duration_ms", "tiles_rendered", "overlay_count"],
    "loop_metrics": ["frame_rate", "viewport_changes_per_min", "zoom_level_distribution"]
  }
}
```

---

## 9. Implementation Phases

### Phase 1: Static Blueprint (MVP)
- Parse PULSE manifests → generate room layout
- CSS Grid rendering at L1 (campus view)
- Room labels from phase IDs
- Click to zoom L1 → L2
- No live data, no overlays

### Phase 2: Live Data
- Connect to Graphonomous MCP → populate rooms with node counts, confidence
- Thermal overlay (activity heatmap)
- Confidence overlay
- Real-time updates via Supabase Realtime

### Phase 3: Full Zoom Stack
- All 5 zoom levels (L0-L4)
- Rune overlay at L4
- Topology overlay (κ visualization)
- District view (multi-fort)

### Phase 4: Fort-to-Fort
- Bridge rendering
- Token flow animation
- B2B privacy boundaries (opaque partner forts)
- Nested fort rendering (fractal zoom)

### Phase 5: Living Fort
- Consolidation animations
- Goal visualization
- Room growth/shrinkage
- Wall dynamics
- Layout optimization from usage patterns

---

## 10. Key Design Decisions

### 10.1 Why Blueprint, Not Dungeon/Isometric/Dashboard

Blueprints scale. They were literally invented to represent massive buildings and remain navigable. Dungeon maps become mazes at scale. Isometric views become visual noise. Dashboards run out of panels. Blueprints handle campus → room → detail with the same visual language.

The overlay system is the killer feature — same floor plan, different lenses. Architects have used this for centuries (structural, electrical, plumbing, HVAC on transparent sheets). RuneFort does the same: structure, flow, thermal, temporal, diagnostic, rune.

### 10.2 Why Runes Are Hidden

Runes are the machine language. The blueprint is the human language. If runes were the UI, only people who memorized the alphabet could navigate. The fort should be immediately legible to anyone — "that's a room, that's a hallway, that's a locked door." The runes reward deeper inspection but never gatekeep understanding.

### 10.3 Why the Minecraft Constraint

One primitive (the tile) prevents special-case explosion. Every new feature must be expressible as tiles + spatial grammar. This keeps the component system small (9 components) and the rendering pipeline uniform. If you can't build it from tiles, it doesn't belong in the fort.

### 10.4 Why RuneFort Has Its Own Loop

RuneFort is not just a viewer — it learns from how you navigate. The `learn_interaction` phase tracks which views are useful. The `consolidate_layout` phase reorganizes the fort to put frequently-visited rooms closer together. The fort itself is a continual learning system, consistent with the [&] ecosystem philosophy.

### 10.5 Products Without Supabase

Four products don't use Supabase: Graphonomous (SQLite), SpecPrompt (git), Deliberatic (in-memory), OpenSentience (ETS). Their forts are rendered from PULSE manifests and MCP data only — no `rune.*` schema dependency for layout generation. Persisted layouts in `rune.forts` are optional.

### 10.6 OpenSentience, PULSE, and [&] Are Not Forts

These three are meta-protocols, not running loops:
- **OpenSentience** → rendered as bedrock (foundation layer under all forts)
- **PULSE** → rendered as clocktower mechanism (inside every fort)
- **[&] Protocol** → rendered as construction material (the stuff forts are built from)

They don't get their own fort because they don't declare their own loop. They are the substrate that forts are made of.
