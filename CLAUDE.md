# RuneFort

A layout protocol for tiled, file-backed UIs. Four primitives — room, claim, neighbor,
binding — declared as JSON that lives in a repository.

## The landing page is GENERATED. Do not hand-edit `index.html`.

`/index.html` and `/tiles.js` are emitted by `build-site.mjs` from `records/surface.json`,
`records/weights.json`, `src/landing.html`, `src/shell.css` and `src/tiles.js`.
**An edit to the served HTML is silently reverted by the next build.** Change the record
or the template.

```
npm run test:launch    # emit the site, then run the publication gate
```

`build-site.mjs` walks the ES module import graph from each entry point and gzips what it
reaches, so **every byte figure on the page is measured, never typed**, and the build
refuses when a figure moves without its record. `launch-gate.mjs` reads the emitted
artifact and refuses on the other ways a page lies — a retracted claim reinstated, a rung
invented, a CTA the rung has not earned, a `mailto:`, a text token below 4.5:1, a
documented path that resolves to nothing, an artifact that is not what its source compiles
to, an identifying-animation constant leaking into the copy. **129 checks.** The shell is
documented in `ProjectAmp2/agents/SHELL.md`; this surface is built against revision
**`shell-r9`**, recorded as `shell_revision` in `records/surface.json`.

**Do not hand-type a check count anywhere.** The gate prints its own total; the number
above is what it printed on 2026-08-17, and it went 93 → 129 in a single session.

Two checks are newer than the rest and are the ones to understand first:

- **The computed-colour resolver.** Travis reported the header CTA unreadable and he was
  right: `.top nav a` is specificity 0,2,1 and `.btn` is 0,1,0, so the nav rule won and
  "Walk a fort" painted `rgba(233,234,228,.66)` on `#9ee04f` — **1.19:1** — while the
  identical button in the hero painted `#0b1403` correctly. **Every contrast check here
  passed the whole time**, because they read *declared tokens* and never the colour the
  cascade gives a real element. The gate now resolves the cascade over the emitted
  artifact (specificity, source order, `!important`, `@media` at 1600/1280/800/390,
  `var()`, inheritance) against each `.btn`'s real ancestor chain. Verdicts were
  cross-checked against the browser's computed styles and agreed on all four buttons.
  A selector it cannot parse is a REFUSAL, not a skip; finding zero buttons is a REFUSAL.
- **The correction form's shape** (SHELL.md r9): the `action` must equal the endpoint the
  record declares, and `_gotcha` must be present — a honeypot dropped in a refactor fails
  silently.

`/app/` (the editor) is hand-authored, predates this shell, and is NOT generated. It is
the surface's `live_deployed` artifact.

**The band says "a specification in the ComputeDriven world", not "the interface layer of
ComputeDriven", and that is deliberate.** `ampersand-nav` records runefort as `place: 3`,
and its own `renderPlacement()` gives the layer sentence to `place: 2` only.

## Spec — there is NO `docs/spec/README.md` here

RuneFort is the one Tier-3 domain in the portfolio without one, and the root `CLAUDE.md`
pointed at that filename until 2026-08-15. The real files:

- `docs/spec/runefort.protocol.md` — the protocol (start here)
- `docs/spec/runefort.core.md` — the Web Component API
- `docs/spec/runefort.dsl.md` — the `.rune` syntax. **No parser exists for it.**

## What is built, and what only reads as built

- **Built and measured on the deployed domain:** `<rune-floor>`, `<rune-room>`,
  `<rune-claim>`, `<rune-link>` — a declaration compiles to real CSS grid tracks.
- **Built, unmeasured:** the other ten custom elements, the templates, the generation
  runtime.
- **Not built:** the `.rune` parser, any conformance suite, any second renderer.
- **Built with no backend:** `packages/core/src/supabase.js`. This portfolio ruled the
  shared-Supabase route abandoned on 2026-07-30; the adapter is still inside the
  documented entry point and still costs its bytes.

## Weight — do not quote a number from memory

`records/weights.json` is regenerated on every build. As of 2026-08-16: the four layout
primitives with their dependencies are **24,443 bytes raw / 6,794 gzipped**; the
documented entry point `src/index.js` reaches 19 modules at **163,749 / 42,065**. The
old `~5KB` figure is retracted on the landing page and is in the gate's blocklist.
