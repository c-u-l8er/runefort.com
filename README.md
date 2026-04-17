# RuneFort

**Spatial cognition for autonomous workflows.**

RuneFort renders any PULSE-declared closed loop as a navigable **fort** &mdash; a
blueprint-style floor plan where rooms are cognitive domains, corridors are data
flows, walls are policies, and the hidden rune machinery inside the walls is the
actual operational code. Part of the
[[&] Protocol ecosystem](https://github.com/c-u-l8er).

> The fort is what you understand. The runes are what you inspect.

## Three steps. That's the product.

1. **Drop a manifest.** Point RuneFort at a `*.pulse.json`. It generates the fort &mdash;
   rooms from phases, corridors from signals, walls from policies.
2. **Walk the fort.** Zoom from district to rune. Hover to reveal flow, thermal,
   or diagnostic. No menu to learn &mdash; the right lens fades in where you look.
3. **Ship the factory.** Press `R!`. The dark-factory loop watches signals, triages,
   and sequences SpecPrompt &rarr; Agentelic &rarr; FleetPrompt &rarr; deploy. You watch
   it happen.

The default view is just structure. Everything else &mdash; the nine overlays, the
nine composites, the twenty-four runes &mdash; is available when you want more,
reached by interacting with the fort, not by opening a menu. Manifests stay
canonical (`*.pulse.json`, `*.ampersand.json`); the view just makes them walkable.

## Quick start

```bash
npm install
npm run dev      # Vite dev server (default port 8093)
npm run build    # Production build (Cloudflare Pages adapter)
npm run check    # svelte-check — must pass 0 errors before merge
```

The dev server also drives the `preview_*` tooling via `.claude/launch.json`.

### Verification gate

Every PR into `main` must satisfy:

- `npm run check` &mdash; 0 errors. Pre-existing a11y warnings on legacy components
  are tracked separately and get fixed in the feature stage that touches those
  components (see `docs/spec/README.md` phase plan).
- `npm run build` &mdash; clean Cloudflare Pages bundle.

## Project layout

```
runefort.com/
├── src/
│   ├── routes/
│   │   ├── +page.svelte        # Marketing landing page
│   │   ├── app/                # Editor (the walkable fort)
│   │   ├── factory/            # Dark factory control room
│   │   ├── auth/               # Supabase Auth flows
│   │   └── api/                # Route handlers
│   ├── components/             # Landing-page sections + shared UI
│   │   ├── Hero.svelte         # Animated mini-fort teaser
│   │   ├── Vision.svelte       # Three-step promise
│   │   ├── DarkFactory.svelte  # Promoted: the R! story
│   │   ├── SixtySecond.svelte  # "From code to walkable fort in 60s"
│   │   ├── SemanticZoom.svelte # Interactive zoom L0 → L4
│   │   ├── Vocabulary.svelte   # 9 Lenses / 9 Pieces (tabbed)
│   │   ├── Ecosystem.svelte    # Portfolio fort registry
│   │   ├── RuneLayer.svelte    # 24 Elder Futhark runes (power-user)
│   │   ├── app/                # Editor panels (FactoryPanel, FactoryConsole)
│   │   └── flow/               # Svelte Flow node types
│   ├── lib/
│   │   ├── stores/             # factory.svelte.js, factorylog.svelte.js
│   │   ├── play/               # factory-loop, cloudevents, MCP clients
│   │   └── data/               # zoomData.js and other static fixtures
│   ├── app.css                 # Design tokens (amber, stone, rune, surface)
│   └── app.html
├── static/
│   └── runefort.dark_factory.pulse.json   # PULSE manifest for the orchestration loop
├── docs/
│   └── spec/README.md          # Authoritative spec (architecture + phases)
├── prompts/
│   └── DARK_FACTORY.md         # Implementation prompt for Phase 6.1
├── old_scrap/                  # Historical drafts &mdash; not authoritative
├── svelte.config.js
├── vite.config.js
└── package.json
```

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Framework | SvelteKit 2 + Svelte 5 (runes) | Same as BendScript &mdash; proven in portfolio |
| Adapter | Cloudflare Pages | Zero-cost hosting |
| Graph UI | [`@xyflow/svelte`](https://svelteflow.dev/) | Semantic zoom + node typing |
| Data layer | Supabase (shared `amp.*` + `rune.*` schemas) | Same identity as all [&] products |
| MCP clients | Graphonomous, PRISM, SpecPrompt, Agentelic, FleetPrompt | Live fort data; no LLM calls from RuneFort itself |
| Rendering | CSS Grid + SVG + writable stores | SSR-compatible, accessible, no canvas |

## Two concurrent loops

RuneFort runs two PULSE loops side by side:

- **`runefort.spatial_render`** &mdash; the viewer loop. Retrieves PULSE + [&] manifests,
  routes zoom, renders tiles, learns from navigation patterns, consolidates
  layouts.
- **`runefort.dark_factory`** &mdash; the orchestration loop. Watches signals (git,
  GitHub issues, Graphonomous outcome nodes) &rarr; triages (heuristic, no LLM) &rarr;
  sequences `specprompt` &rarr; `agentelic` &rarr; `fleetprompt` &rarr; deploy &rarr; learns &rarr;
  consolidates.

Both are declared in their PULSE manifests; neither makes LLM calls from inside
RuneFort. The agent calling the MCP tools does any LLM work.

## What lives where

- **Authoritative spec:** [`docs/spec/README.md`](./docs/spec/README.md) &mdash; full
  architecture, zoom levels, overlay system, rune alphabet, fort-to-fort patterns,
  Supabase schema, PULSE manifest, implementation phases.
- **Dark-factory implementation prompt:** [`prompts/DARK_FACTORY.md`](./prompts/DARK_FACTORY.md).
- **Portfolio context:** [`../CLAUDE.md`](../CLAUDE.md) &mdash; the ProjectAmp2 root
  explains the three-protocol stack ([&] / PULSE / PRISM) and how RuneFort fits
  into the wider ecosystem.

## Design principle

**The default experience is play first, understand later.** Walk the fort. Watch
a corridor pulse. Click a wall and see the mechanism crack open. You never have
to open a manual to be useful &mdash; but every layer is there when you're ready to
look at it. Manifests are canonical. The view is how humans walk through them.

## License

See [`LICENSE`](./LICENSE) (or parent portfolio's license if this subrepo
inherits). Contributions follow the [&] ecosystem commit style &mdash; see
`AmpersandBoxDesign/CONTRIBUTING.md`.
