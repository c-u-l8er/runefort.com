# @runefort/core — Reference Web Component Framework v0.1

**The canonical browser implementation of the Runefort layout protocol.**

Status: draft v0.1
Position: reference framework, not the protocol itself. Conformant alternatives may exist.
Companion to: `runefort.protocol.md`, `runefort.dsl.md`

---

## 0. What this is

A set of four custom elements (`<rune-floor>`, `<rune-room>`, `<rune-claim>`, `<rune-link>`) that render a Runefort layout in any browser, with no framework dependency. ~5KB minified target. Works inside React, Vue, Svelte, Solid, Astro, Lit, Phoenix LiveView, plain HTML, or anywhere a `<div>` works.

Built on web standards: Custom Elements v1, CSS Grid, CSS custom properties. No build step required.

## 1. Element reference

The framework ships **thirteen** custom elements organized into four layers:

**Layout (4 — required by protocol):**
- `<rune-floor>` — grid container
- `<rune-room>` — tile inside a floor
- `<rune-claim>` — file-system region binding (metadata)
- `<rune-link>` — adjacency declaration for keyboard nav

**Source viewer (2 — optional):**
- `<rune-editor>` — in-browser source viewer
- `<rune-source>` — source content carrier

**Hierarchy (3 — optional):**
- `<rune-campus>` — top-level container, multi-building
- `<rune-building>` — multi-floor container
- `<rune-elevator>` — vertical floor switcher
- `<rune-marquee>` — horizontal nav strip (campus/building/floor scope)

**LLM authoring (4 — optional):**
- `<rune-modal>` — overlay primitive (split-panel via `data-variant="wide"`)
- `<rune-thread>` — BBS-style threaded message list with reply input
- `<rune-message>` — message in a static thread
- `<rune-action>` — declarative action button with hotkey support

Plus a runtime module (`runtime.js`) and a templates registry (`templates.js`) that power LLM-driven authoring (settings store, OpenRouter client, generation pipeline, room kinds, floor/building/campus templates, persistence layer).

A document may use any subset. A single floor with no building is valid; a building with one floor is valid; a building with many floors and several marquees is valid; the LLM authoring elements are entirely optional and only needed for runtime content generation.

### 1.1 `<rune-floor>`

Container element. Establishes the CSS grid and owns signal state.

**Attributes:**

| Attribute | Type | Default | Description |
|---|---|---|---|
| `columns` | int | `12` | Grid column count |
| `rows` | int | `auto` | Grid row count (`auto` = content-driven) |
| `vocabulary` | string | `"core"` | Active vocabulary identifier |
| `editor` | string | `"vscode"` | Editor URL scheme for anchor handoff: `vscode`, `cursor`, `zed`, `idea`, `file`, `github`, `browser`, or full template like `myeditor://open?path={path}&line={line}`. `browser` disables external URL handoff and pairs the floor with a `<rune-editor>`. |
| `cell-width` | length | `auto` | Sets `--rune-cell-width` CSS var |
| `cell-height` | length | `auto` | Sets `--rune-cell-height` CSS var |
| `gap` | length | `8px` | Sets `--rune-gap` CSS var |

**Properties (JS):**

```ts
floor.signals = { kappa: 0.7, queue_depth: 12 };  // live state
floor.bindings = [
  { room: "memory", signal: "kappa",
    thresholds: [
      { if: "< 0.3", class: "cold" },
      { if: "< 0.6", class: "warm" },
      { if: ">= 0.6", class: "hot" }
    ]
  }
];
floor.layout;   // readonly: returns the parsed runefort.json equivalent
```

**Events:**

- `rune:navigate` — fires when keyboard navigation moves focus across rooms. `detail: { from, to, direction }`
- `rune:signal` — fires when a signal value changes. `detail: { name, value, affected_rooms }`

**Methods:**

- `floor.focus(roomId)` — programmatically focus a room
- `floor.toJSON()` — serialize current layout to runefort.json

---

### 1.2 `<rune-room>`

A tile. Must be a direct child of `<rune-floor>` (or nested inside another `<rune-room>` for v0.2 nesting).

**Attributes:**

| Attribute | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique within the floor |
| `position` | `"col,row"` | yes | Top-left grid cell, 0-indexed |
| `size` | `"colspan,rowspan"` | yes | Span in grid cells |
| `label` | string | no | Display name (defaults to `id`) |
| `anchor` | string | no | File path with optional line: `lib/foo.ex:24` |
| `state-class` | string | no | Manual state override (otherwise computed from bindings) |

**Properties:**

```ts
room.meta = { autonomy: "advise", uptime_seconds: 957840 };  // arbitrary vocabulary metadata
room.stateClass;  // readonly: current computed state
```

**Events (all bubble):**

- `rune:open` — fires when room is clicked or `Enter`/`Space` pressed while focused. `detail: { id, anchor, anchorUrl, meta }`. Default action navigates to `anchorUrl`. Cancelable with `preventDefault()`.
- `rune:focus` — fires on focus. `detail: { id }`
- `rune:state` — fires when `stateClass` changes. `detail: { id, oldClass, newClass }`

**Slots:**

- Default slot — arbitrary content rendered inside the tile (file viewer, metric, anything).

**Generated CSS classes:**

- `runefort-room` (always)
- `runefort-state-{class}` where `{class}` is one of `cold`, `warm`, `hot`, `fault`, `idle`, or any custom token from a vocabulary
- `runefort-focused` (when keyboard-focused)

---

### 1.3 `<rune-claim>`

File-system binding. Nested inside a `<rune-room>`. Multiple allowed per room.

**Attributes:**

| Attribute | Type | Required | Description |
|---|---|---|---|
| `pattern` | glob | yes | File pattern this room owns |
| `anchor` | string | no | If set, overrides parent room's `anchor` for this claim |

A room with multiple claims may render a sub-list of files when focused (renderer's choice). Default behavior: claims are metadata only, used by tooling.

---

### 1.4 `<rune-link>`

Adjacency declaration. Direct child of `<rune-floor>`. Drives keyboard navigation order; may render as a visual connection (renderer's choice).

**Attributes:**

| Attribute | Type | Required | Description |
|---|---|---|---|
| `from` | room id | yes | Source room |
| `to` | room id | yes | Destination room |
| `kind` | enum | no | `adjacent` (default), `linked`, `nested` |
| `bidirectional` | bool | no | If absent, navigation flows `from → to` only |

---

### 1.5 `<rune-editor>` (optional)

In-browser source viewer. Pairs with a `<rune-floor>` and intercepts its
`rune:open` events, rendering source for the matched anchor inline instead
of navigating to an external editor.

**Attributes:**

| Attribute | Type | Default | Description |
|---|---|---|---|
| `for` | string (room id) | (auto) | The id of the floor this editor pairs with. If omitted, auto-binds to the immediately preceding sibling `<rune-floor>`. |

**Behavior:**

- On `rune:open` from the paired floor, calls `event.preventDefault()` and
  renders the source for `event.detail.anchor`.
- Source content comes from `<rune-source>` children indexed by `for` attribute.
- If no source is found for the anchor, renders a "no source available"
  placeholder.

**Methods:**

```ts
editor.show(anchor);   // Programmatically show a source by anchor
editor.clear();        // Reset to the empty placeholder
```

**Optional syntax highlighting:**

If `window.hljs` (highlight.js) is loaded — typically via CDN — the editor
automatically applies syntax highlighting using the source's `language`
attribute. Without highlight.js, the editor renders plain monospace with line
numbers. The framework does not bundle a highlighter; consumers choose what
(if anything) to load.

### 1.6 `<rune-source>` (optional)

Metadata-only carrier of source content. Child of `<rune-editor>`.

**Attributes:**

| Attribute | Type | Required | Description |
|---|---|---|---|
| `for` | string | yes | The anchor this source corresponds to (matches a room's `anchor`). |
| `language` | string | no | Language identifier for highlighting (e.g. `elixir`, `typescript`, `javascript`). Default `text`. |
| `data-source` | string | no | Source content as an attribute (CDATA-safe). If absent, `textContent` is used. |

The element renders nothing visually; it exists only to feed `<rune-editor>`.

**Two ways to provide source:**

```html
<!-- Option A: data-source attribute (recommended for reliability) -->
<rune-source for="lib/foo.ex:24" language="elixir"
             data-source='defmodule Foo do
  def hello, do: "world"
end'></rune-source>

<!-- Option B: text content (preserves whitespace if simple) -->
<rune-source for="lib/foo.ex:24" language="elixir">
defmodule Foo do
  def hello, do: "world"
end
</rune-source>
```

The `data-source` attribute is preferred for non-trivial source because it
avoids HTML-entity encoding pitfalls inside element bodies.

### 1.7 `<rune-building>` (optional)

Multi-floor container. Manages active floor, syncs to URL hash, switches between floors. Direct child `<rune-floor>` elements are auto-discovered as the building's floors.

**Attributes:**

| Attribute | Type | Default | Description |
|---|---|---|---|
| `mode` | enum | `"switch"` | `"switch"` shows only the active floor; `"scroll"` (v0.2) stacks all floors and smooth-scrolls the active into view. |
| `active-floor` | string (room id) | (auto) | Initial active floor. Overridden by URL hash if present. |

**State priority for initial active floor:**
1. URL hash (`#floor-id`) — wins if it matches a known floor
2. `active-floor` attribute
3. First `<rune-floor>` child in document order

**Properties:**

```ts
building.mode;          // "switch" | "scroll"
building.activeFloor;   // current floor id
building.floors;        // [{ id, label, level, element }, ...] in document order
building.activate(id);  // imperative floor switch (also updates URL hash via replaceState)
```

**Events:**

- `rune:floor` — fires when active floor changes. `detail: { from, to }`. Bubbles.

**URL hash semantics:**

- `activate()` uses `history.replaceState()` to update the hash without polluting history. Each elevator click does NOT push a new history entry.
- Direct hash assignment (`location.hash = "fleet"`) and back/forward buttons trigger `hashchange`, which the building listens for.
- This means: the back button takes you to whatever was BEFORE the building was loaded, not between floors. That's intentional — most users don't expect "back" to mean "previous floor". If you want pushState behavior, that's a v0.2 attribute.

### 1.8 `<rune-elevator>` (optional)

Vertical floor-switching sidebar. Auto-generates a list of all floors in the parent `<rune-building>`. Highlights the active floor automatically.

**Attributes:**

| Attribute | Type | Default | Description |
|---|---|---|---|
| `for` | string (id) | (closest ancestor building) | The id of the building this elevator pairs with. |

**Auto-generation:**

The elevator reads each floor's `id`, `label`, and `data-level` attributes and renders a `<ul>` with one `<li>` per floor. Each `<li>` contains an `<a href="#floor-id">` that calls `building.activate()` on click.

**Override mode:**

If the elevator has any pre-existing `<a>` children at connect time, auto-generation is suppressed. The elevator wires those authored links to `activate()` instead. Use this for non-trivial structures (groupings, sub-headings, custom icons).

**Generated DOM (auto mode):**

```html
<rune-elevator>
  <ul class="runefort-elevator-list">
    <li class="runefort-elevator-item runefort-elevator-active" data-floor="supervisor">
      <a class="runefort-elevator-link" href="#supervisor">
        <span class="runefort-elevator-level">L1</span>
        <span class="runefort-elevator-label">Supervisor</span>
      </a>
    </li>
    <!-- ... more floors -->
  </ul>
</rune-elevator>
```

### 1.9 `<rune-marquee>` (optional)

Horizontal nav strip. Used for title bars, sub-title bars, or any other horizontal menu. Multiple marquees per building are supported and freely stylable via attributes.

**Attributes:**

The element has no required attributes. Common patterns:

| Attribute | Description |
|---|---|
| `data-variant="sub"` | Theme hint for sub-title-bar styling (smaller, quieter palette in foundry theme). |
| `data-theme="foundry"` | Apply the foundry theme to a standalone marquee outside a themed building. |

**Behavior:**

Authors put HTML inside (typically `<a href="#floor-id">` links). The marquee finds links whose `href` matches the active floor of the surrounding `<rune-building>` and adds `runefort-marquee-active` to them.

If the marquee is not inside a `<rune-building>`, it just provides styling — no active-state behavior. This means you can use `<rune-marquee>` as a generic styled nav bar even outside of multi-floor apps.

```html
<rune-marquee>
  <strong>BRAND</strong>
  <span style="margin-left:auto;">
    <a href="#supervisor">Supervisor</a>
    <a href="#fleet">Fleet</a>
    <a href="#docs">Docs</a>
  </span>
</rune-marquee>
```

### 1.10 Composition example

```html
<rune-building data-theme="foundry">
  <rune-marquee>
    <strong>ᚲ RUNEFORT</strong>
    <span style="margin-left:auto; display:flex; gap:24px;">
      <a href="#problem">Problem</a>
      <a href="#solution">Solution</a>
      <a href="#install">Install</a>
    </span>
  </rune-marquee>

  <rune-marquee data-variant="sub">
    <span>v0.1.0-alpha</span>
  </rune-marquee>

  <rune-elevator></rune-elevator>

  <rune-floor id="problem" label="Problem" data-level="01" columns="6"> ... </rune-floor>
  <rune-floor id="solution" label="Solution" data-level="02" columns="6"> ... </rune-floor>
  <rune-floor id="install" label="Install" data-level="03" columns="6"> ... </rune-floor>
</rune-building>
```

A complete multi-floor app in 11 lines of meaningful markup. The building owns the routing; the elevator owns the sidebar; the marquees own the horizontal nav.

---

## 2. Minimal example (no build step)

Drop this into any HTML file:

```html
<!doctype html>
<html>
<head>
  <script type="module" src="https://unpkg.com/@runefort/core"></script>
  <link rel="stylesheet" href="https://unpkg.com/@runefort/core/theme.css">
</head>
<body>

<rune-floor columns="6" rows="4" editor="vscode">
  <rune-room id="memory" position="0,0" size="3,2"
             label="memory.ex"
             anchor="lib/my_app/forge/memory.ex:24"
             state-class="hot">
    <rune-claim pattern="lib/my_app/memory/**/*.ex"></rune-claim>
  </rune-room>

  <rune-room id="deploy" position="3,0" size="3,2"
             label="deploy.ex"
             anchor="lib/my_app/forge/deploy.ex">
    <rune-claim pattern="lib/my_app/deploy/**/*.ex"></rune-claim>
  </rune-room>

  <rune-link from="memory" to="deploy" bidirectional></rune-link>
</rune-floor>

<script>
  const floor = document.querySelector('rune-floor');
  floor.bindings = [{
    room: "memory", signal: "kappa",
    thresholds: [
      { if: "< 0.3", class: "cold" },
      { if: "< 0.6", class: "warm" },
      { if: ">= 0.6", class: "hot" }
    ]
  }];
  // Push a live signal — rooms re-color automatically.
  setInterval(() => floor.signals = { kappa: Math.random() }, 2000);

  floor.addEventListener('rune:open', e => {
    console.log('opening', e.detail.anchorUrl);
  });
</script>

</body>
</html>
```

That is the entire framework, in use. No bundler. No npm install (CDN). No JS framework.

## 3. Loading from JSON

For dynamic layouts, mount a runefort.json directly:

```js
import { mount } from "https://unpkg.com/@runefort/core";

const layout = await fetch('/runefort.json').then(r => r.json());
mount(document.getElementById('mount'), layout);
```

`mount()` renders the four-element structure declaratively. The reverse — `floor.toJSON()` — round-trips losslessly.

## 4. Theming

Theming is pure CSS. The framework ships a default theme (`theme.css`) but expects most consumers to override.

**Custom properties (set on `<rune-floor>` or any ancestor):**

```css
rune-floor {
  --rune-cell-width: 120px;
  --rune-cell-height: 80px;
  --rune-gap: 12px;

  --rune-color-cold: #6e6c63;
  --rune-color-warm: #7fb850;
  --rune-color-hot: #ff8a3d;
  --rune-color-fault: #8b3a1c;
  --rune-color-idle: #a8a59a;

  --rune-bg: #141714;
  --rune-fg: #e8e4d8;
  --rune-border: #2a322a;
}
```

**Class hooks (style your own):**

```css
.runefort-room { /* every tile */ }
.runefort-state-hot { /* hot tiles */ }
.runefort-focused { /* keyboard-focused tile */ }
```

No theme is privileged. The dark "foundry" look from runefort.com is `theme-foundry.css`, one of several optional themes.

## 5. Framework adapters

Adapters are ~20-50 lines each. They forward props/state to the web components and translate events into framework-native callbacks.

**React:**

```jsx
import { Floor, Room, Claim, Link } from "@runefort/react";

<Floor columns={6} rows={4} signals={{ kappa: 0.7 }} bindings={bindings}>
  <Room id="memory" position={[0,0]} size={[3,2]} anchor="..."
        onOpen={e => router.push(e.detail.anchorUrl)} />
</Floor>
```

**Vue, Svelte, Solid:** identical shape, idiomatic syntax.

**Phoenix LiveView:** `<.live_component module={Runefort.Floor} ... />` — the LiveView component pushes signal updates to the JS via `pushEvent`.

Adapters are not part of `@runefort/core`. They live in sibling packages: `@runefort/react`, `@runefort/vue`, `@runefort/liveview`, etc.

## 6. Signals (state model)

Runefort does not ship reactive primitives. The `floor.signals` setter is plain property assignment — assign a new object, the framework diffs and updates affected rooms.

```js
floor.signals = { ...floor.signals, kappa: 0.8 };
```

For ergonomic reactivity, recommend `@preact/signals` (1KB) or your framework's native reactivity:

```js
import { signal, effect } from "@preact/signals";
const kappa = signal(0.5);
effect(() => floor.signals = { kappa: kappa.value });
```

This is intentional. Owning a reactive system is a major scope expansion. Web Components observe attribute and property changes natively; that's all we need.

## 7. Accessibility

- Every `<rune-room>` is `tabindex="0"` and has `role="button"` by default.
- Arrow keys navigate the `<rune-link>` graph; `Tab` follows DOM order.
- Each room exposes its `label` as accessible name; `meta` content is described via `aria-describedby` if a `<slot>`-rendered description exists.
- Focus is visible. The default theme uses a phosphor outline; custom themes must preserve a visible focus indicator.
- Color is never the only state indicator — every state class also produces a text/icon cue (configurable).

## 8. Editor handoff

The `editor` attribute on `<rune-floor>` controls how `anchor` strings become URLs. Built-in mappings:

| `editor` | Output for `anchor="lib/foo.ex:24"` |
|---|---|
| `vscode` | `vscode://file/lib/foo.ex:24` |
| `cursor` | `cursor://file/lib/foo.ex:24` |
| `zed` | `zed://file/lib/foo.ex:24` |
| `idea` | `idea://open?file=lib/foo.ex&line=24` |
| `file` | `file:///lib/foo.ex` (no line) |
| `github` | `https://github.com/lib/foo.ex#L24` |
| `browser` | `null` — no URL is built; the paired `<rune-editor>` handles the event in the page |
| custom template | `{path}` and `{line}` are substituted |

The editor handoff respects the user's actual editor preference rather than imposing one. We default to `vscode` only because it's the most common; `browser` is recommended for public sites and demos where the visitor may not have any local editor installed.

## 8.5. Runtime + templates (LLM-authoring layer)

The framework optionally ships a small runtime module that pairs with the LLM-authoring elements (`<rune-modal>`, `<rune-thread>`, `<rune-action>`) and a templates registry. Together they implement: API-key settings, OpenRouter client, prompt templates per content type, generation pipeline that mounts elements into the DOM, refinement loop with thread persistence, and reload-survival via localStorage.

### 8.5.1 Settings store

Plain `localStorage`-backed getters/setters at known keys:

- `runefort.openrouter.apiKey` — string (treat as sensitive; visible to any script on the page)
- `runefort.openrouter.model` — model id (defaults to `anthropic/claude-sonnet-4`)
- `runefort.openrouter.budgetUsd` — soft cap; generation refuses when `costSpent ≥ budgetUsd`
- `runefort.openrouter.costSpent` — running tally, accumulated by the OpenRouter client based on usage tokens × model pricing

Disclose to users in the settings UI that the API key is plaintext-readable.

### 8.5.2 OpenRouter client

`chat({ messages, model?, maxTokens?, temperature? })` POSTs to `https://openrouter.ai/api/v1/chat/completions` with the user's stored API key. Returns `{ content, usage, model, costUsd }`. Cost is estimated from the `RECOMMENDED_MODELS` table (input/output $/1M tokens). Throws if no API key is set or budget is exhausted.

### 8.5.3 Prompt templates

Per generation level there is a system-prompt builder:
- `promptAddRoom({ existingRooms, gridColumns, userPrompt, kind? })`
- `promptAddFloor({ existingFloors, userPrompt })`
- `promptAddBuilding({ existingBuildings, userPrompt })`
- `promptAddCampus({ existingCampuses, userPrompt })`

Each composes a base SYSTEM prompt (`output ONLY JSON, no fences`) with level-specific shape constraints. Room prompts further compose per-`kind` instructions from `templates.js`.

### 8.5.4 Generation pipeline

For each level: `generateXFor(parent, userPrompt, opts?)` →
1. Snapshot existing children → produce a non-overlap context.
2. Build messages via prompt template; include `kind` for rooms.
3. Call `chat()`; parse JSON via `extractJson()` (strips fences/prose); validate.
4. Build the corresponding element via `xFromJson(json)`.
5. Append to parent, persist thread + entity, return result.

Auto-relocation: `roomFromJson` accepts `{ existingRooms, columns }` context. If the LLM returns an invalid or overlapping position, it scans for the next free slot. This makes generation robust to LLM mistakes.

### 8.5.5 Templates registry

`templates.js` exports four registries:

- **`roomKinds`** — `text`, `youtube`, `ampersand`, `metric`. Each entry has `id`, `label`, `icon`, `description`, `defaultSize`, `promptSystem` (extra instructions appended to the room system prompt), `fields`, and an optional `renderHook(roomEl, json)` that mutates the room after construction (e.g., to inject a YouTube thumbnail card or a metric value display).
- **`floorTemplates`** — `blank`, `dashboard`, `list`, `kanban`, `video-gallery`. Each has `starterPrompt` that pre-fills the prompt textarea.
- **`buildingTemplates`** — `blank`, `ops-center`, `documentation`, `marketing-site`, `learning-hub`.
- **`campusTemplates`** — `blank`, `company`, `product-suite`, `open-source-project`.

### 8.5.6 Refinement (`refineRoom`, `refineEntity`)

`refineRoom(room, prompt)` mutates a room in place using the prompt + the room's existing thread as context.

`refineEntity(element, prompt)` is the multi-level refine. It accepts a floor / building / campus, snapshots its current JSON, sends prompt + thread history + snapshot to the LLM, expects updated JSON back, and rebuilds the element via `floorFromJson` / `buildingFromJson` / `campusFromJson`. The element is replaced in place; the original `id` is preserved for stable references.

### 8.5.7 Persistence — `entityStore` + `restoreEntities`

`entityStore` keyed by entity id stores `{ type, parent_id, json, ts }`. Every successful `generateXFor` call writes a record.

`restoreEntities()` should be called once after page load. It walks the store in order (campus → building → floor → room), finds the parent in the DOM (or `<body>` for campuses), and mounts the element. Already-present entities (e.g., reloaded from a hash route) are skipped. Returns `{ restored, skipped, total }` for diagnostics.

Pair with `threadStore` for full session persistence: threads keyed by entity id store the prompt+response history per element. `clearAll()` available on both stores.

### 8.5.8 What it deliberately doesn't do

- **No streaming.** Each chat call blocks until complete.
- **No retry-on-validation-error.** If the LLM returns malformed JSON, generation throws — no auto-reprompt.
- **No web grounding.** YouTube video IDs invented by the LLM 404. The recommended pattern is to ask the user to paste a real URL/ID for kinds that reference real-world identifiers.
- **No undo/redo.** Refine destroys prior state; only the thread retains history.
- **No multi-key user accounts.** Single user, single API key per browser. For team use, every user pastes their own.

## 9. What @runefort/core does NOT do

- No router. Use your framework's, or none.
- No state management beyond signal binding. Use `@preact/signals`, your framework's store, or nothing.
- No SSR runtime. The DSL compiler emits static HTML; that IS the SSR story.
- No virtual DOM. Custom Elements + property setters do everything we need.
- No theming framework. CSS variables and class hooks; the rest is yours.
- No vocabulary parsing logic. Vocabularies are interpreted by app code or by a vocabulary-specific extension package (`@runefort/vocab-supervisor-floor`).
- **No bundled syntax highlighter.** `<rune-editor>` opportunistically uses `window.hljs` if present, but the framework does not load or include a highlighter. Consumers pick (highlight.js, prism, shiki, none).
- **No source fetching.** `<rune-editor>` reads source from `<rune-source>` children only. Fetching files from URLs, GitHub APIs, or filesystems is the consumer's concern (and may be added as `@runefort/source-fetch` in a later version).

## 10. Bundle budget (v0.1 target)

| Component | Size (min+gzip) |
|---|---|
| `@runefort/core` (4 protocol elements) | ≤ 5 KB |
| `+ @runefort/core editor` (`<rune-editor>` + `<rune-source>`) | ≤ 3 KB additional |
| `+ @runefort/core building` (`<rune-building>` + `<rune-elevator>` + `<rune-marquee>`) | ≤ 3 KB additional |
| `theme.css` (default) | ≤ 2 KB |
| `theme-foundry.css` (foundry look) | ≤ 4 KB |
| `@runefort/react` adapter | ≤ 1 KB |
| `@runefort/liveview` adapter | ≤ 1 KB |

Bundle budget is a hard ship gate. If we blow it, we cut features, not raise the budget.
