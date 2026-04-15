<script>
  import { Handle, Position } from "@xyflow/svelte";
  import { isOverlayActive } from "$lib/stores/overlays.svelte.js";
  import { thermalStyle, confidenceStyle, temporalStyle, diagnosticStyle, topologyStyle } from "$lib/overlayEffects.js";
  let { data } = $props();

  const stateColors = { active: "#6ac48c", pulsing: "#e8a84c", idle: "#44423d" };
  const baseBorder = stateColors[data.state] || "#44423d";

  // Overlay-derived styles
  let thermal = $derived(isOverlayActive("thermal") ? thermalStyle(data.activity ?? 0.5) : null);
  let conf = $derived(isOverlayActive("confidence") && data.confidence !== undefined ? confidenceStyle(data.confidence) : null);
  let temporal = $derived(isOverlayActive("temporal") ? temporalStyle(data.kind, data.timeout) : null);
  let diag = $derived(isOverlayActive("diagnostic") ? diagnosticStyle(data) : null);
  let topo = $derived(isOverlayActive("topology") ? topologyStyle(data, "room") : null);

  let overlayBg = $derived(thermal?.bg ?? conf?.bg ?? "transparent");
  let overlayBorder = $derived(topo?.border ?? temporal?.border ?? conf?.border ?? thermal?.border ?? baseBorder);
  let overlayGlow = $derived(thermal?.glow ?? conf?.glow ?? topo?.glow ?? "none");
</script>

<div class="room-node" style="border-color: {overlayBorder}60; background: {overlayBg === 'transparent' ? '#0e0f14' : overlayBg}; box-shadow: {overlayGlow};">
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
    transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
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
</style>
