# @runefort/core

Reference Web Component framework for the [Runefort layout protocol](../../docs/spec/runefort.protocol.md).

Four custom elements: `<rune-floor>`, `<rune-room>`, `<rune-claim>`, `<rune-link>`. Plain JavaScript with JSDoc types. No build step. No dependencies. Works in any browser, any framework, or no framework.

## Install

```html
<script type="module" src="https://unpkg.com/@runefort/core"></script>
<link rel="stylesheet" href="https://unpkg.com/@runefort/core/theme.css">
```

Or via npm:

```sh
npm install @runefort/core
```

## Use

```html
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

<script type="module">
  import "@runefort/core";

  const floor = document.querySelector("rune-floor");

  // Live state — updates state classes on rooms with bindings.
  floor.bindings = [{
    room: "memory", signal: "kappa",
    thresholds: [
      { if: "< 0.3", class: "cold" },
      { if: "< 0.6", class: "warm" },
      { if: ">= 0.6", class: "hot" }
    ]
  }];
  floor.signals = { kappa: 0.7 };

  floor.addEventListener("rune:open", e => {
    console.log("opening", e.detail.anchorUrl);
  });
</script>
```

## API

See [`docs/spec/runefort.core.md`](../../docs/spec/runefort.core.md) for the full element reference.

## Bundle budget

≤ 5 KB minified+gzipped (hard ship gate). Current size is tracked in CI.
