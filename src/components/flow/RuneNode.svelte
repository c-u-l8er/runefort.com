<script>
  import { Handle, Position } from "@xyflow/svelte";
  import { isOverlayActive } from "$lib/stores/overlays.svelte.js";
  import { topologyStyle, runeStyle, diagnosticStyle } from "$lib/overlayEffects.js";
  let { data } = $props();

  let topo = $derived(isOverlayActive("topology") ? topologyStyle(data, "rune") : null);
  let rune = $derived(isOverlayActive("rune") ? runeStyle(data) : null);
  let diag = $derived(isOverlayActive("diagnostic") ? diagnosticStyle(data) : null);

  let overlayGlow = $derived(topo?.glow ?? "none");
  let overlayBorder = $derived(topo?.border ?? "rgba(196, 149, 106, 0.3)");
  let glyphScale = $derived(rune?.glyphScale ?? 1);
</script>

<div class="rune-node" style="border-color: {overlayBorder}; box-shadow: {overlayGlow};">
  <div class="rune-glyph" style="transform: scale({glyphScale}); transition: transform 0.3s;">{data.rune}</div>
  <div class="rune-name">{data.runeName}</div>
  <div class="rune-meaning">{data.meaning}</div>
  <div class="rune-divider"></div>
  <div class="rune-section">
    <span class="rune-key">operation</span>
    <span class="rune-val">{data.operation}</span>
  </div>
  <div class="rune-section">
    <span class="rune-key">machine</span>
    <span class="rune-val">{data.machine}</span>
  </div>
  <div class="rune-section">
    <span class="rune-key">kind</span>
    <span class="rune-val">{data.kind}</span>
  </div>
  <div class="rune-divider"></div>
  <div class="rune-section">
    <span class="rune-key">duration</span>
    <span class="rune-val highlight">{data.duration}</span>
  </div>
  <div class="rune-section">
    <span class="rune-key">nodes</span>
    <span class="rune-val">{data.nodesReturned}</span>
  </div>
  <div class="rune-section">
    <span class="rune-key">edges</span>
    <span class="rune-val">{data.edgesReturned}</span>
  </div>
  <div class="rune-divider"></div>
  <div class="rune-section">
    <span class="rune-key">routing</span>
    <span class="rune-val alert">{data.routing}</span>
  </div>
  <div class="rune-reason">{data.reason}</div>

  {#if rune}
    <div class="rune-divider"></div>
    <div class="rune-section">
      <span class="rune-key">weight</span>
      <span class="rune-val" style="color: {rune.border};">{rune.weight.toFixed(2)}</span>
    </div>
  {/if}

  {#if diag}
    <div class="rune-divider"></div>
    <div class="diag-row">
      <span class="diag-grade" style="color: {diag.color};">{diag.grade}</span>
      <span class="diag-score" style="color: {diag.color};">{diag.score}</span>
      {#each diag.dimensions as dim}
        <span class="diag-dim">{dim.label}:{dim.value}</span>
      {/each}
    </div>
  {/if}

  {#if topo?.isCyclic}
    <div class="topo-cyclic">cyclic path</div>
  {/if}
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />

<style>
  .rune-node {
    background: #0e0f14;
    border: 1px solid rgba(196, 149, 106, 0.3);
    border-radius: 10px;
    padding: 1rem 1.25rem;
    min-width: 280px;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  .rune-glyph {
    font-size: 2rem;
    color: #c4956a;
    text-align: center;
    margin-bottom: 0.25rem;
  }
  .rune-name {
    font-family: "Cinzel", serif;
    font-size: 1rem;
    font-weight: 500;
    color: #e4e2dc;
    text-align: center;
    margin-bottom: 0.15rem;
  }
  .rune-meaning {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #8a9a9e;
    text-align: center;
    margin-bottom: 0.5rem;
  }
  .rune-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
    margin: 0.5rem 0;
  }
  .rune-section {
    display: flex;
    justify-content: space-between;
    padding: 0.15rem 0;
  }
  .rune-key {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
  }
  .rune-val {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #e4e2dc;
    font-weight: 500;
  }
  .rune-val.highlight {
    color: #6ac48c;
  }
  .rune-val.alert {
    color: #e85a5a;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .rune-reason {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #44423d;
    margin-top: 0.25rem;
  }

  /* Diagnostic row */
  .diag-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .diag-grade {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.7rem;
    font-weight: 700;
  }
  .diag-score {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    opacity: 0.8;
  }
  .diag-dim {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.45rem;
    color: #7a7770;
  }

  /* Topology cyclic */
  .topo-cyclic {
    margin-top: 0.4rem;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    font-weight: 700;
    color: #e85a5a;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-align: center;
  }
</style>
