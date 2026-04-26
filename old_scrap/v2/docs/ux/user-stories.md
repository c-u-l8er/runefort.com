# RuneFort — User Stories

Canonical user-story catalog. Used for Playwright tests + Claude Design input.

**Scope:** Spatial-cognition visualizer for Graphonomous memory graphs + body-* interaction traces. SvelteKit SPA; canvas-based navigable 3D-ish rendering.

**Unit-test surface covered:** none shipped yet — greenfield.

---

## Story 1 · Land and see live memory graph ambient

- **Persona:** Researcher visiting RuneFort for the first time
- **Goal:** Understand at a glance what the product does — ambient graph rendering, zero config
- **Prerequisite:** SvelteKit preview or build; Graphonomous endpoint optional (has fixtures)
- **Steps:**
  1. Visit `runefort.com/`
  2. Hero renders with a navigable graph behind/below the CTA
  3. Graph slowly rotates; nodes pulse; edges shimmer
  4. User scrolls — graph stays "live" even below the fold
- **Success:** Visitor gets the metaphor in <10s without reading copy
- **Covers:** Canvas/WebGL render loop, fixture data loader, first-paint perf
- **UI status:** landing shell exists (`src/routes/+page.svelte`) — canvas placeholder
- **Claude Design hook:** Hero with navigable graph canvas + scroll-anchored CTA

## Story 2 · Explore a real graph

- **Persona:** Operator investigating what an agent has learned
- **Goal:** Fly through the Graphonomous graph; filter by type; click a node to see detail
- **Prerequisite:** Graphonomous MCP endpoint reachable OR fixture seeded
- **Steps:**
  1. Navigate to `/explore`
  2. Keyboard: `/` to search, `j/k` to traverse, `space` to zoom
  3. Filter panel: node type (semantic/episodic/procedural/temporal), confidence range, topic
  4. Click a node → side panel with content, confidence, source, edges
  5. Click an edge → side panel with relationship, weight, provenance
- **Success:** 60fps at 10k nodes; keyboard-only exploration works
- **Covers:** Graphonomous `retrieve.context` wrapper, canvas pick-ray, filter predicates
- **UI status:** planned (largest Claude Design deliverable)
- **Claude Design hook:** Explorer view — canvas + filter rail + detail panel + keyboard shortcut hints

## Story 3 · Watch a trace replay as a flight path

- **Persona:** CL engineer auditing an InteractionTrace
- **Goal:** See a state-hash transition sequence rendered as a glowing flight path through the graph
- **Prerequisite:** Trace ID from body-browser or body-os; Graphonomous `retrieve.replay` reachable
- **Steps:**
  1. Navigate to `/trace/:trace_id` (or paste ID in explorer)
  2. Graph zooms to H0 node; camera begins flying H0 → H1 → H2 → … → Hn
  3. Each edge highlights with affordance label + latency chip
  4. Pause/play/step controls on toolbar
  5. SurpriseSignal events appear as storm effects at their location
- **Success:** Engineer understands trace sequence + divergence events visually
- **Covers:** Trace fetcher, path interpolation, SurpriseSignal renderer
- **UI status:** planned
- **Claude Design hook:** Trace viewer — camera fly-through + playback controls + SurpriseSignal storms

## Story 4 · Consolidation seasons time-lapse

- **Persona:** Memory operator watching consolidation do its work
- **Goal:** See before/after graph shape as consolidation merges + decays + prunes
- **Prerequisite:** Two snapshots or live `consolidate.query` stream
- **Steps:**
  1. Navigate to `/consolidate`
  2. Pick a consolidation window (last 24h / live stream)
  3. Playback: fading (decay), beacons converging (merge), beacons rising (promote)
  4. Counter at bottom: nodes N→N', edges E→E'
  5. Stable-core facts pinned (never fade)
- **Success:** Operator sees consolidation's effect without reading logs
- **Covers:** Snapshot diffing, animation interpolation, pinned-fact filter
- **UI status:** planned
- **Claude Design hook:** Timeline scrubber + before/after overlay + stable-core pins

## Story 5 · Skill transfer side-by-side

- **Persona:** Fleet manager comparing cross-machine replay
- **Goal:** Render Machine A's original trace + Machine B's replay as parallel flight paths
- **Prerequisite:** Two traces from cross-machine replay (e.g. the `body-browser-cross-machine` live-smoke test)
- **Steps:**
  1. Navigate to `/compare/:trace_a/:trace_b`
  2. Split view: left camera fly-through of A; right of B
  3. Divergence indicator at each corresponding edge
  4. Summary card: fidelity % + divergence count
- **Success:** Manager judges "golden universal skill" vs "environment-specific" at a glance
- **Covers:** Dual render context, trace alignment, divergence metric
- **UI status:** planned (tight PRISM integration — `replay_success_rate`)
- **Claude Design hook:** Side-by-side camera panes + divergence indicators + summary card

---

**Tests to implement first:** Story 1 already covered by `tests/marketing/sites.spec.ts` (landing screenshot). For the explorer + trace viewer, wait until the canvas is real — Playwright tests on canvas are pixel-diffs, which isn't useful until content exists.

**Note:** See `runefort.com/docs/spec/README.md` (1087 lines) for the full spatial-cognition metaphor.
