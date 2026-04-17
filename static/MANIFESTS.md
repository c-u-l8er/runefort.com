# Static manifests

All `*.pulse.json` and `*.ampersand.json` files for RuneFort live here, served
at predictable URLs under the site root. Non-RuneFort consumers (other agents,
other viewers, CI) can fetch them directly — this is what makes the protocol
portable.

| File | Loop / system | Purpose |
|---|---|---|
| `runefort.spatial_render.pulse.json` | `runefort.spatial_render` | The viewer loop — rooms from phases, corridors from signals, walls from policies |
| `runefort.dark_factory.pulse.json`   | `runefort.dark_factory`   | The orchestration loop — watch → triage → pipeline → learn → consolidate |
| `runefort.ampersand.json`            | `runefort` system         | `[&]` capability bindings — `&memory.graphonomous`, `&reason.prism`, `&time.ticktickclock`, `&space.rune`, `&govern.delegatic` |
| `starter.pulse.json`                  | `runefort.starter`        | Pre-built fort the first-run Starter Fort loader reads — gives first-time visitors a live, walkable fort with synthetic signals before any MCP server is connected |

The canonical PULSE schema lives at
[`PULSE/schemas/pulse-loop-manifest.v0.1.json`](../../PULSE/schemas/pulse-loop-manifest.v0.1.json).

The canonical `[&]` schema lives at
[`AmpersandBoxDesign/schemas/ampersand.v0.1.json`](../../AmpersandBoxDesign/schemas/ampersand.v0.1.json).

`starter.pulse.json` contains an extra `starter_seed` object that is **not** part
of the canonical PULSE schema. It is read only by RuneFort's Starter Fort
loader (`src/lib/play/starterFort.js`) and should be ignored by any other
consumer.
