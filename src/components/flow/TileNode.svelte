<script>
  import { Handle, Position } from "@xyflow/svelte";
  import { isOverlayActive } from "$lib/stores/overlays.svelte.js";
  import { thermalStyle, confidenceStyle, diagnosticStyle, topologyStyle, runeStyle } from "$lib/overlayEffects.js";
  let { data } = $props();

  const confColor = data.confidence > 0.8 ? "#6ac48c" : data.confidence > 0.6 ? "#e8a84c" : "#e85a5a";

  // Overlay-derived styles
  let thermal = $derived(isOverlayActive("thermal") ? thermalStyle(data.activity ?? data.confidence ?? 0.5) : null);
  let conf = $derived(isOverlayActive("confidence") ? confidenceStyle(data.confidence) : null);
  let diag = $derived(isOverlayActive("diagnostic") ? diagnosticStyle(data) : null);
  let topo = $derived(isOverlayActive("topology") ? topologyStyle(data, "tile") : null);
  let rune = $derived(isOverlayActive("rune") ? runeStyle(data) : null);

  let overlayBg = $derived(thermal?.bg ?? conf?.bg ?? "transparent");
  let overlayBorder = $derived(topo?.border ?? conf?.border ?? thermal?.border ?? confColor + "30");
  let overlayGlow = $derived(thermal?.glow ?? conf?.glow ?? topo?.glow ?? "none");
</script>

<div class="tile-node" style="border-color: {overlayBorder}; background: {overlayBg}; box-shadow: {overlayGlow};">
  <div class="tile-header">
    <span class="tile-id" style={rune ? `transform: scale(${rune.glyphScale});` : ""}>{data.label}</span>
    <span class="tile-type" style="color: {confColor};">{data.nodeType}</span>
  </div>
  <div class="tile-content">{data.content}</div>
  <div class="tile-meta">
    <span class="conf" style="color: {confColor};">conf: {data.confidence}</span>
    <span class="ts">{data.timescale}</span>
    <span class="access">access: {data.accessCount}</span>
  </div>
  <div class="tile-decay">decay: {data.decayRate}</div>

  {#if conf}
    <div class="overlay-bar">
      <div class="overlay-bar-fill" style="width: {data.confidence * 100}%; background: {conf.barColor};"></div>
    </div>
  {/if}

  {#if diag}
    <div class="diag-badge" style="color: {diag.color}; border-color: {diag.color}40;">
      <span class="diag-grade">{diag.grade}</span>
      <span class="diag-score">{diag.score}</span>
    </div>
    <div class="diag-dims">
      {#each diag.dimensions as dim}
        <span class="diag-dim">{dim.label} <em>{dim.value}</em></span>
      {/each}
    </div>
  {/if}

  {#if rune}
    <div class="rune-weight" style="border-color: {rune.border};">wt: {rune.weight.toFixed(2)}</div>
  {/if}
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />

<style>
  .tile-node {
    background: #0e0f14;
    border: 1px solid;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    min-width: 240px;
    max-width: 300px;
    transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
  }
  .tile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
  }
  .tile-id {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.7rem;
    font-weight: 600;
    color: #e8a84c;
    transition: transform 0.3s;
    transform-origin: left center;
  }
  .tile-type {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.04);
  }
  .tile-content {
    font-size: 0.78rem;
    color: #e4e2dc;
    line-height: 1.5;
    margin-bottom: 0.5rem;
    font-style: italic;
  }
  .tile-meta {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.2rem;
  }
  .tile-meta span {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #7a7770;
  }
  .conf {
    font-weight: 600;
  }
  .tile-decay {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    color: #44423d;
  }

  /* Confidence bar */
  .overlay-bar {
    height: 3px;
    background: #15161d;
    border-radius: 2px;
    margin-top: 0.4rem;
    overflow: hidden;
  }
  .overlay-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  /* Diagnostic badge */
  .diag-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.4rem;
    padding: 0.15rem 0.45rem;
    border: 1px solid;
    border-radius: 4px;
    font-family: "JetBrains Mono", monospace;
  }
  .diag-grade {
    font-size: 0.65rem;
    font-weight: 700;
  }
  .diag-score {
    font-size: 0.55rem;
    opacity: 0.8;
  }
  .diag-dims {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.2rem;
  }
  .diag-dim {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.45rem;
    color: #7a7770;
  }
  .diag-dim em {
    font-style: normal;
    color: #e4e2dc;
  }

  /* Rune weight */
  .rune-weight {
    display: inline-block;
    margin-top: 0.3rem;
    padding: 0.1rem 0.35rem;
    border: 1px solid;
    border-radius: 3px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    color: #c4956a;
  }
</style>
