# Runefort

**A layout protocol for living, file-backed, tile-grid web apps.**

Runefort is a small declarative protocol for describing tiled UI layouts. You declare *rooms* (tiles), *claims* (file-system regions each room owns), *neighbors* (adjacency for keyboard navigation), and *state bindings* (how live state colors a tile). A conformant renderer compiles the declaration to a CSS grid, wires up file-handoff to the user's editor, and overlays live state.

Independent of [&], PULSE, and PRISM. May be used by them; does not require them.

## Status

v0.1 — draft. Spec stable, reference framework in active development.

## Repository layout

```
runefort.com/
  docs/spec/
    runefort.protocol.md       The protocol itself (4 primitives, JSON shape)
    runefort.core.md           Reference Web Component framework spec
    runefort.dsl.md            .rune authoring DSL spec
  packages/
    core/                      @runefort/core — the reference framework (~5KB target)
  examples/
    no-framework/              Plain HTML demo, proves "runs anywhere"
  old_scrap/
    v1/                        Original game-pivot landing
    v2/                        SvelteKit spatial-cognition app (dark-factory era)
```

## Quickstart

Drop this into any HTML file. No build step.

```html
<script type="module" src="/packages/core/dist/index.js"></script>
<link rel="stylesheet" href="/packages/core/theme.css">

<rune-floor columns="6" rows="2" editor="vscode">
  <rune-room id="memory" position="0,0" size="3,2"
             label="memory.ex"
             anchor="lib/forge/memory.ex:24"
             state-class="hot"></rune-room>
  <rune-room id="deploy" position="3,0" size="3,2"
             label="deploy.ex"
             anchor="lib/forge/deploy.ex"></rune-room>
  <rune-link from="memory" to="deploy" bidirectional></rune-link>
</rune-floor>
```

## Three authoring surfaces, one protocol

| Surface | Format | Use case |
|---|---|---|
| `runefort.json` | JSON | Programmatic generation, canonical persistence |
| `<rune-*>` HTML | Custom Elements | Embedding inside existing apps |
| `.rune` DSL | Curly-brace declarative | Hand-authored layouts |

All three round-trip losslessly via the `runefort` CLI.

## Read the specs

1. [`docs/spec/runefort.protocol.md`](docs/spec/runefort.protocol.md) — start here
2. [`docs/spec/runefort.core.md`](docs/spec/runefort.core.md) — Web Component API
3. [`docs/spec/runefort.dsl.md`](docs/spec/runefort.dsl.md) — DSL syntax
