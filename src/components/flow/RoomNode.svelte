<script>
  import { Handle, Position } from "@xyflow/svelte";
  import { isOverlayActiveOn, setLocalOverlay, clearLocalOverlay } from "$lib/stores/overlays.svelte.js";
  import { thermalStyle, confidenceStyle, temporalStyle, diagnosticStyle, topologyStyle, assemblyStyle, consolidationClass } from "$lib/overlayEffects.js";
  let { id, data } = $props();

  // Spec §6.1 — Living Fort state palette. `sealed` is a dormant state where
  // every child tile has been pruned; the room shows an ice rune (ᛁ) and can
  // still be woken by Memory Revival (ᛁᛞ). `alert` lets any component flip a
  // room into tower-style alerting when a disruption fires nearby.
  const stateColors = {
    active: "#6ac48c",
    pulsing: "#e8a84c",
    idle: "#44423d",
    sealed: "#5b6a8a",
    alert: "#e85a5a",
  };
  let baseBorder = $derived(stateColors[data.state] || "#44423d");
  let isSealed = $derived(data.state === "sealed");
  let isGrowing = $derived(data.lifecycle === "growing");
  let isShrinking = $derived(data.lifecycle === "shrinking");
  // Spec §6.2 — consolidation events drive the 6 keyframes defined in app.css.
  // `data.consolidationEvent` is one of decay|prune|merge|strengthen|promote|abstract.
  // The Living Fort driver (or a real consolidate(run) completion) sets this field
  // and clears it after the animation completes.
  let consolidateClass = $derived(consolidationClass(data.consolidationEvent));

  // Motion-is-the-menu (spec §2.3): hovering a room fades Thermal in on *this room*.
  // Global overlays still apply via isOverlayActiveOn which checks global OR local.
  function revealThermal() { setLocalOverlay(id, "thermal"); }
  function unrevealThermal() { clearLocalOverlay(id, "thermal"); }

  // Overlay-derived styles (now keyed to this node's local+global activation)
  let thermal = $derived(isOverlayActiveOn(id, "thermal") ? thermalStyle(data.activity ?? 0.5) : null);
  let conf = $derived(isOverlayActiveOn(id, "confidence") && data.confidence !== undefined ? confidenceStyle(data.confidence) : null);
  let temporal = $derived(isOverlayActiveOn(id, "temporal") ? temporalStyle(data.kind, data.timeout) : null);
  let diag = $derived(isOverlayActiveOn(id, "diagnostic") ? diagnosticStyle(data) : null);
  let topo = $derived(isOverlayActiveOn(id, "topology") ? topologyStyle(data, "room") : null);
  let assembly = $derived(isOverlayActiveOn(id, "assembly") && data.buildStatus ? assemblyStyle(data) : null);

  let overlayBg = $derived(assembly?.bg ?? thermal?.bg ?? conf?.bg ?? "transparent");
  let overlayBorder = $derived(assembly?.border ?? topo?.border ?? temporal?.border ?? conf?.border ?? thermal?.border ?? baseBorder);
  let overlayGlow = $derived(assembly?.glow ?? thermal?.glow ?? conf?.glow ?? topo?.glow ?? "none");
</script>

<div
  class="room-node {consolidateClass}"
  class:sealed={isSealed}
  class:growing={isGrowing}
  class:shrinking={isShrinking}
  style="border-color: {overlayBorder}60; background: {overlayBg === 'transparent' ? '#0e0f14' : overlayBg}; box-shadow: {overlayGlow};"
  role="group"
  aria-label={`Room ${data.label ?? id}${isSealed ? ' (sealed — dormant)' : ''} — hover to reveal thermal overlay`}
  tabindex="0"
  onmouseenter={revealThermal}
  onmouseleave={unrevealThermal}
  onfocus={revealThermal}
  onblur={unrevealThermal}
>
  {#if isSealed}
    <div class="sealed-rune" aria-hidden="true">ᛁ</div>
  {/if}
  <div class="room-header">
    <span class="room-rune">{data.rune}</span>
    <span class="room-label">{data.label}</span>
  </div>
  {#if data.kind}
    <div class="room-kind">{data.kind}</div>
  {/if}
  {#if data.confidence !== undefined}
    <div class="room-stats">
      <span class="stat">conf: {data.confidence}</span>
      <span class="stat">tiles: {data.tileCount}</span>
    </div>
    <div class="activity-bar">
      <div class="activity-fill" style="width: {(data.activity || 0) * 100}%; background: {overlayBorder};"></div>
    </div>
  {/if}
  {#if data.timeout}
    <div class="room-timeout">timeout: {data.timeout}ms</div>
  {/if}
  <div class="room-state" style="color: {overlayBorder};">{data.state}</div>

  {#if temporal}
    <div class="temporal-badge" class:fast={temporal.urgency === 'fast'} class:slow={temporal.urgency === 'slow'} style="border-color: {temporal.border}40; color: {temporal.border};">
      {temporal.badge}
      {#if temporal.urgency === 'fast'}
        <span class="urgency-dot fast-dot"></span>
      {:else if temporal.urgency === 'slow'}
        <span class="urgency-dot slow-dot"></span>
      {/if}
    </div>
  {/if}

  {#if conf}
    <div class="conf-bar">
      <div class="conf-fill" style="width: {(data.confidence ?? 0) * 100}%; background: {conf.barColor};"></div>
    </div>
  {/if}

  {#if diag}
    <div class="diag-badge" style="color: {diag.color}; border-color: {diag.color}40;">
      <span class="diag-grade">{diag.grade}</span>
      <span class="diag-score">{diag.score}</span>
    </div>
  {/if}

  {#if assembly}
    <div class="assembly-badge" style="color: {assembly.border}; border-color: {assembly.border}40;">
      <span class="assembly-label">{assembly.buildStatus}</span>
      {#if data.buildCount}
        <span class="assembly-count">{data.buildCount}</span>
      {/if}
    </div>
  {/if}

  {#if data.nestedFortId}
    <!-- Spec §3.3 — nested fort. Miniature <FortNode>-like glyph + name
         on a room whose phase escalates into a child loop (e.g. PRISM's
         interact wraps Graphonomous; Graphonomous's act_mutate escalates
         into Deliberatic when κ > 0). -->
    <div class="nested-fort" style="border-color: {data.nestedFortColor}55; color: {data.nestedFortColor};" aria-label={`nests ${data.nestedFortLabel}`}>
      <span class="nested-rune">{data.nestedFortRune}</span>
      <span class="nested-stack">
        <span class="nested-arrow">↳ nests</span>
        <span class="nested-label">{data.nestedFortLabel}</span>
      </span>
    </div>
  {/if}
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />

<style>
  .room-node {
    background: #0e0f14;
    border: 1px solid;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    min-width: 160px;
    position: relative;
    transition: background 0.3s, border-color 0.3s, box-shadow 0.3s,
                transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1),
                filter 0.4s ease;
  }
  .room-node:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(232, 168, 76, 0.4);
  }
  /* §6.1 behavior #3 — sealed: ice rune + desaturated dormancy */
  .room-node.sealed {
    filter: saturate(0.25) brightness(0.75);
  }
  .sealed-rune {
    position: absolute;
    top: 4px;
    right: 8px;
    font-size: 0.85rem;
    color: #5b6a8a;
    opacity: 0.9;
    pointer-events: none;
  }
  /* §6.1 behavior #4 — grow: scale-in pop for freshly appended tiles */
  .room-node.growing {
    animation: room-grow 600ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  @keyframes room-grow {
    0% { transform: scale(0.94); opacity: 0.6; }
    60% { transform: scale(1.02); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  /* §6.1 behavior #5 — shrink: contraction on consolidation merge */
  .room-node.shrinking {
    animation: room-shrink 600ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  @keyframes room-shrink {
    0% { transform: scale(1); }
    100% { transform: scale(0.96); filter: brightness(0.8); }
  }
  @media (prefers-reduced-motion: reduce) {
    .room-node { transition: none; }
    .room-node.growing, .room-node.shrinking { animation: none; }
  }
  .room-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }
  .room-rune {
    font-size: 1rem;
    color: #c4956a;
  }
  .room-label {
    font-family: "Cinzel", serif;
    font-size: 0.8rem;
    font-weight: 500;
    color: #e4e2dc;
  }
  .room-kind {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #8a9a9e;
    letter-spacing: 0.04em;
    margin-bottom: 0.25rem;
  }
  .room-stats {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
  }
  .stat {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
  }
  .activity-bar {
    height: 3px;
    background: #15161d;
    border-radius: 2px;
    margin-bottom: 0.35rem;
    overflow: hidden;
  }
  .activity-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s ease;
  }
  .room-timeout {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #44423d;
  }
  .room-state {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-top: 0.25rem;
  }

  /* Temporal badge */
  .temporal-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.3rem;
    padding: 0.12rem 0.4rem;
    border: 1px solid;
    border-radius: 3px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    font-weight: 600;
  }
  .urgency-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    display: inline-block;
  }
  .fast-dot {
    background: #e8a84c;
    animation: pulse-fast 0.6s ease-in-out infinite;
  }
  .slow-dot {
    background: #5b6a8a;
  }
  @keyframes pulse-fast {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }

  /* Confidence bar */
  .conf-bar {
    height: 3px;
    background: #15161d;
    border-radius: 2px;
    margin-top: 0.3rem;
    overflow: hidden;
  }
  .conf-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  /* Diagnostic badge */
  .diag-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    margin-top: 0.3rem;
    padding: 0.12rem 0.4rem;
    border: 1px solid;
    border-radius: 4px;
    font-family: "JetBrains Mono", monospace;
  }
  .diag-grade {
    font-size: 0.6rem;
    font-weight: 700;
  }
  .diag-score {
    font-size: 0.5rem;
    opacity: 0.8;
  }

  /* Assembly badge */
  .assembly-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    margin-top: 0.3rem;
    padding: 0.12rem 0.4rem;
    border: 1px solid;
    border-radius: 4px;
    font-family: "JetBrains Mono", monospace;
  }
  .assembly-label {
    font-size: 0.5rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .assembly-count {
    font-size: 0.45rem;
    opacity: 0.7;
  }

  /* Nested fort badge (spec §3.3) */
  .nested-fort {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.4rem;
    padding: 0.22rem 0.45rem;
    border: 1px dashed;
    border-radius: 4px;
    background: rgba(14, 15, 20, 0.8);
    font-family: "JetBrains Mono", monospace;
  }
  .nested-rune {
    font-size: 0.85rem;
    line-height: 1;
  }
  .nested-stack {
    display: flex;
    flex-direction: column;
    gap: 0.08rem;
  }
  .nested-arrow {
    font-size: 0.46rem;
    letter-spacing: 0.06em;
    opacity: 0.65;
    text-transform: uppercase;
  }
  .nested-label {
    font-family: "Cinzel", serif;
    font-size: 0.62rem;
    letter-spacing: 0.04em;
  }
</style>
