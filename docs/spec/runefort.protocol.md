# Runefort Protocol — v0.1

**A layout protocol for living, file-backed, tile-grid web apps.**

Status: draft v0.1
Owner: runefort.com
Date: 2026-04-25
Position: protocol-level. Independent of [&], PULSE, PRISM. May be used by them; does not require them.

---

## 0. What this is, in one paragraph

Runefort is a small declarative protocol for describing a **tiled, file-backed UI layout**. You declare *rooms* (tiles), *claims* (file-system regions each room owns), *neighbors* (adjacency for navigation), and *state bindings* (how live state colors a tile). A conformant renderer compiles the declaration to a CSS grid, surfaces each claim's content for inline viewing or editing, and overlays live state. The protocol is the contract between the declaration and the renderer. Nothing more.

It is not a workforce platform. It is not a supervisor framework. It is not a graph visualization library. It is the **layout language** that those things can be built with.

## 1. Why a protocol (not a library)

- **Renderer-portable.** The same `runefort.json` should render in Elixir/Phoenix, TypeScript/React, or static HTML. The protocol is the only thing they share.
- **Diffable.** Layouts live in version control as text. Reviews become readable. SVG graph layouts cannot do this.
- **Extensible by composition.** Apps add *vocabularies* (e.g. `supervisor`, `dashboard`, `wiki-page`) on top of the core primitives. The protocol does not know about supervisors.
- **No runtime layout engine required.** All layout is compile-time deterministic. No d3, no dagre, no jitter.

## 2. Core primitives

Four primitives. That is the entire vocabulary.

### 2.1 Room

A room is a tile in the grid. It has an id, a position, a size, and arbitrary metadata.

```json
{
  "id": "memory",
  "position": [0, 0],
  "size": [3, 2],
  "label": "memory.ex",
  "meta": {}
}
```

`position` and `size` are integer cell coordinates in a CSS grid. `[0,0]` is top-left. `size: [3,2]` means 3 columns wide, 2 rows tall. The renderer is free to choose the cell pixel size; the protocol only specifies cell counts.

### 2.2 Claim

A claim is a file-system region a room "owns." A renderer uses claims to (a) list which files belong to a room and (b) surface those files inline — either as a viewer or an editor — when the user activates the room. Optional behaviors include generating external-editor handoff URLs (`vscode://`, `cursor://`, `zed://`) for users who prefer their own tools.

```json
{
  "room": "memory",
  "pattern": "lib/my_app/memory/**/*.ex",
  "anchor": "lib/my_app/forge/memory.ex#L24"
}
```

`pattern` is a glob. `anchor` is the canonical file the room represents (the one a click on the tile opens).

### 2.3 Neighbor

A neighbor declares an adjacency between two rooms. Neighbors drive keyboard navigation (`h/j/k/l`), focus order, and may be rendered as connecting lines.

```json
{ "from": "memory", "to": "deploy", "kind": "adjacent" }
```

`kind` is one of: `adjacent` (touching), `linked` (logical link, may not be touching), `nested` (one contains the other).

### 2.4 State binding

A state binding tells the renderer how to color a room based on a runtime signal. The protocol defines the *binding*, not the signal source — signals are pushed to the renderer over whatever transport the host app provides (WebSocket, SSE, polling, static).

```json
{
  "room": "memory",
  "signal": "kappa",
  "thresholds": [
    { "if": "< 0.3", "class": "cold" },
    { "if": "< 0.6", "class": "warm" },
    { "if": ">= 0.6", "class": "hot" }
  ]
}
```

`class` is a token the renderer maps to CSS. The protocol reserves five canonical classes: `cold`, `warm`, `hot`, `fault`, `idle`. Apps may add custom classes — renderers should ignore unknown classes gracefully (treat as `cold`).

## 3. Document shape

A complete `runefort.json` is just an object containing arrays of the four primitives, plus header metadata.

```json
{
  "runefort": "0.1",
  "title": "my_app forge floor",
  "grid": { "columns": 6, "rows": 4 },
  "rooms": [ ... ],
  "claims": [ ... ],
  "neighbors": [ ... ],
  "state_bindings": [ ... ],
  "vocabulary": "core"
}
```

`grid.columns` and `grid.rows` are the total grid dimensions. `vocabulary` is the name of the extension vocabulary in use; `"core"` means no extensions.

## 4. The DSL surface (host-language sugar)

Hosts may expose a DSL that compiles to the JSON above. The DSL is **not normative** — only the JSON is. A reference Elixir DSL:

```elixir
defmodule MyApp.Floor do
  use Runefort.Layout, columns: 6, rows: 4

  room :memory,
    at: {0, 0}, size: {3, 2},
    claims: ~r{lib/my_app/memory/},
    anchor: "lib/my_app/forge/memory.ex:24"

  room :deploy,
    at: {3, 0}, size: {3, 2},
    claims: ~r{lib/my_app/deploy/}

  neighbors :memory => :deploy

  bind :memory, signal: :kappa,
    cold: "< 0.3", warm: "< 0.6", hot: ">= 0.6"
end
```

A reference TypeScript DSL:

```ts
const floor = layout({ columns: 6, rows: 4 }, [
  room("memory", { at: [0,0], size: [3,2], claims: "lib/my_app/memory/**" }),
  room("deploy", { at: [3,0], size: [3,2], claims: "lib/my_app/deploy/**" }),
  neighbor("memory", "deploy"),
  bind("memory", "kappa", { cold: "< 0.3", warm: "< 0.6", hot: ">= 0.6" }),
]);
```

Both compile to the same JSON. Either is conformant. Neither is privileged.

## 5. Renderer contract

A conformant renderer MUST:

1. **Layout.** Render rooms in a CSS grid (or visually equivalent) using each room's `position` and `size`. The grid MUST be deterministic — given the same JSON, the rendered DOM order MUST be stable.
2. **Anchors.** Resolve each room's `anchor` to its content (the file or content region the room represents). Activating a tile MUST surface that content — by default, inline within the host page (viewer or editor). Renderers MAY additionally offer an external-editor handoff URL as a secondary action, but inline surfacing is the canonical behavior.
3. **State classes.** Apply CSS classes from `state_bindings` to each room's root element. Class names MUST be predictable: `runefort-state-cold`, `runefort-state-hot`, etc.
4. **Accessibility.** Each room MUST be focusable (keyboard) and have a stable accessible name (the room's `label` or `id`).
5. **Neighbor navigation.** Arrow keys (or `h/j/k/l`) MUST move focus along `neighbor` edges. Renderers MAY also expose mouse navigation; keyboard support is required.

A conformant renderer SHOULD:

- Provide an inline editor (not just a read-only viewer) for the focused room's `anchor` when the host environment supports text editing.
- Highlight neighbor adjacencies on hover/focus.
- Re-render on signal change without full reload.

A conformant renderer MAY:

- Add domain-specific vocabularies (see §6).
- Display additional metadata from `meta`.
- Animate state class transitions.
- Offer external-editor handoff URLs (`vscode://`, `cursor://`, `zed://`) as a secondary action for users who prefer their own tools. Renderers that run outside the browser (e.g. static-site generators, server-rendered HTML with no JS) MAY treat handoff as their primary surfacing strategy and still claim conformance.

## 6. Vocabularies (extension points)

The protocol's core knows nothing about supervisors, dashboards, or wikis. Apps declare a *vocabulary* — a named bundle of extra fields on `meta`, extra signals, and extra state classes.

```json
{
  "runefort": "0.1",
  "vocabulary": "supervisor-floor.v1",
  "rooms": [
    {
      "id": "memory",
      "position": [0,0], "size": [3,2],
      "meta": {
        "supervisor": {
          "autonomy": "advise",
          "uptime_seconds": 957840,
          "last_action": "consolidated 47 nodes"
        }
      }
    }
  ]
}
```

The `supervisor-floor.v1` vocabulary defines what `meta.supervisor` contains. A renderer that doesn't know `supervisor-floor.v1` MUST still render the layout correctly — it just won't display the supervisor-specific overlay. **Vocabulary unknown = degrade, don't fail.**

Reserved vocabularies (managed by the protocol authors):

- `core` — the four primitives, no extensions.
- `supervisor-floor.v1` — for [&]/Runefort supervisor workforce apps.
- `codebase-atlas.v1` — for repository visualization apps.
- `dashboard-grid.v1` — for metric/observability tile dashboards.

Custom vocabularies are namespaced freely (`com.example.my-vocab.v1`). The protocol does not require registration.

## 7. Non-goals

Explicit, so the protocol stays small:

- **Not a graph visualization protocol.** Force-directed layouts, dagre, hierarchies — out of scope. Runefort is grids only. If you need a graph, use a graph tool.
- **Not a state-management protocol.** How signals are computed, where they live, how they're transported — host's problem.
- **Not a workforce / supervision framework.** That's a *vocabulary* (`supervisor-floor.v1`), built on top.
- **Not a presentation framework.** No theming spec, no animation spec. CSS is the renderer's job.
- **Not coupled to [&], PULSE, or PRISM.** A `runefort.json` describing a recipe app is fully conformant.

## 8. Versioning

Semver for the protocol itself. The top-level `"runefort": "0.1"` field is the protocol version, NOT the renderer version.

- **Major bump** = breaking JSON shape change.
- **Minor bump** = additive (new optional fields, new reserved vocabularies, new state classes).
- **Patch** = clarification only, no behavior change.

A renderer MUST refuse documents with a major version it does not support. A renderer SHOULD render documents with a higher minor version, ignoring fields it does not recognize.

## 9. Reference framework — `@runefort/core`

The canonical browser-side reference implementation is **`@runefort/core`**: a small set of Web Components (`<rune-floor>`, `<rune-room>`, `<rune-claim>`, `<rune-link>`) implementing this protocol with no framework dependency. ~5KB minified target. Specified in `runefort.core.md`.

Why a reference framework, not just a renderer:

- **Zero-build adoption.** Drop one `<script type="module">` tag into any HTML page and the protocol is rendered. No bundler, no npm, no framework.
- **Universal embedding.** Custom Elements work inside React, Vue, Svelte, Solid, Lit, Astro, Phoenix LiveView, Rails view templates, plain HTML. The framework adapters are ~1KB each, not full reimplementations.
- **Single reactivity story.** Property setters on `<rune-floor>` push signal updates; rooms recompute their state class. No virtual DOM, no opinionated state library — composes with whatever the host app already uses.

Conformant alternatives may exist. `@runefort/core` is the reference, not the only option. A pure-Phoenix-LiveView renderer or a server-rendered static-HTML emitter are both valid conformant implementations.

### 9.1 Authoring surfaces

The same protocol is reachable through three authoring surfaces, all equivalent and all round-trippable:

| Surface | Format | Use case |
|---|---|---|
| `runefort.json` | JSON | Programmatic generation, tooling integration, canonical persistence |
| `<rune-*>` HTML | Custom Elements | Hand-written pages, embedding inside existing apps |
| `.rune` DSL | Curly-brace declarative | Hand-authored layouts, version control reviewability |

The DSL is specified in `runefort.dsl.md`. The CLI converts losslessly between all three.

### 9.2 Planned tree

```
runefort/
  spec/
    runefort.protocol.md       ← this document
    runefort.core.md           ← @runefort/core web component spec
    runefort.dsl.md            ← .rune DSL spec
    schema.json                ← JSON schema for runefort.json
  packages/
    core/                      ← @runefort/core (web components, target ≤5KB)
    cli/                       ← runefort CLI (compile/fmt/to-rune)
    react/                     ← @runefort/react adapter (~1KB)
    vue/                       ← @runefort/vue adapter
    svelte/                    ← @runefort/svelte adapter
    liveview/                  ← @runefort/liveview adapter
  examples/
    no-framework/              ← raw HTML, proves "runs anywhere"
    supervisor-floor/          ← the [&] use case, proves supervisor-floor.v1
    codebase-atlas/            ← non-[&], proves genericity
    dashboard-grid/            ← non-[&], proves genericity
```

Two non-[&] examples are required before we cut v0.1 final. Otherwise we're an [&] dashboard with a spec attached.

### 9.3 Build order (v0.1)

1. `@runefort/core` — the four web components + `mount(json)`. Smallest meaningful artifact.
2. Playground at runefort.com — live `.rune` editor → rendered floor. The shareable demo.
3. CLI compile path — `.rune` → `runefort.json` and `.rune` → static HTML.
4. Adapters — React, then LiveView, then others as demand appears.

Adapters wait until non-zero users exist. Shipping all adapters before having users is the wrong direction of optimization.

## 10. Relationship to the [&] stack

Runefort is **independent of** [&]. It does not import, depend on, or require any [&] protocol. However:

- `[&]` capability descriptors MAY be embedded in `meta` under `supervisor-floor.v1`.
- PULSE manifest phases MAY drive room generation in tooling that bridges PULSE → Runefort.
- PRISM scores MAY be a signal source for state bindings.

These are *integration patterns*, not protocol requirements. A Runefort layout that knows nothing about [&] is fully conformant.

## 11. Open questions for v0.2

- **Nesting.** A room inside a room (zoomable). Worth adding to core, or push to a vocabulary?
- **Streaming layout edits.** Today the JSON is whole-document. Should there be a patch format?
- **Manifest discovery.** Does a renderer auto-discover `runefort.json` in a repo, or is the path always provided?
- **Multiple anchors per room.** Today one anchor. Real codebases have N files per logical region.

These are explicitly deferred. v0.1 ships with the four primitives and nothing else.

---

*This spec is the contract. Everything in `runefort.com/docs/spec/README.md` (the spatial-cognition / dark-factory spec) is now reframed as the `supervisor-floor.v1` vocabulary plus the `runefort.dark_factory` reference application — both built on top of this protocol.*
