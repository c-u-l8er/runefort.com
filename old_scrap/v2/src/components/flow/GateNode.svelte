<script>
  import { Handle, Position } from "@xyflow/svelte";
  import { isOverlayActive } from "$lib/stores/overlays.svelte.js";
  import { topologyStyle, temporalStyle, assemblyDeployColor } from "$lib/overlayEffects.js";
  let { data } = $props();

  let topo = $derived(isOverlayActive("topology") ? topologyStyle(data, "gate") : null);
  let temporal = $derived(isOverlayActive("temporal") ? temporalStyle(data.kind, data.timeout ?? 5000) : null);
  let assemblyActive = $derived(isOverlayActive("assembly"));
  let deployColor = $derived(assemblyActive && data.deployStage ? assemblyDeployColor(data.deployStage) : null);

  // Spec §6.1 behavior #9 — gate opens/closes on router permit/block:
  // `data.gateState` is "open" (permit), "closed" (block), or undefined (default open).
  const gateState = $derived(data.gateState ?? "open");

  let overlayBorder = $derived(deployColor ?? topo?.border ?? "rgba(232, 168, 76, 0.25)");
  let overlayGlow = $derived(deployColor ? `0 0 8px ${deployColor}40` : topo?.glow ?? "none");
</script>

<div
  class="gate-node"
  class:gate-closed={gateState === "closed"}
  class:gate-open={gateState === "open"}
  style="border-color: {overlayBorder}; box-shadow: {overlayGlow};"
  aria-label={`Gate ${data.label} ${gateState === "closed" ? "(closed — blocking)" : "(open)"}`}
>
  <div class="gate-bars" aria-hidden="true">
    <span class="gate-bar left"></span>
    <span class="gate-bar right"></span>
  </div>
  <div class="gate-label">{data.label}</div>
  <div class="gate-detail">{data.detail}</div>
  {#if topo?.isKappaNode}
    <div class="kappa-indicator">cyclic</div>
  {/if}
  {#if assemblyActive && data.deployStage}
    <div class="deploy-stage" style="color: {deployColor};">{data.deployStage}</div>
  {/if}
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />

<style>
  .gate-node {
    background: #15161d;
    border: 1px solid rgba(232, 168, 76, 0.25);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    text-align: center;
    min-width: 80px;
    position: relative;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  /* §6.1 behavior #9 — gate bars rotate open on permit, square-up on block */
  .gate-bars {
    display: flex;
    justify-content: center;
    gap: 2px;
    margin-bottom: 0.35rem;
    height: 8px;
  }
  .gate-bar {
    width: 3px;
    height: 8px;
    background: rgba(232, 168, 76, 0.7);
    border-radius: 1px;
    transition: transform 240ms cubic-bezier(0.4, 0, 0.2, 1),
                background 240ms cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: bottom center;
  }
  .gate-node.gate-open .gate-bar.left { transform: rotate(-28deg); }
  .gate-node.gate-open .gate-bar.right { transform: rotate(28deg); }
  .gate-node.gate-closed .gate-bar {
    background: rgba(232, 90, 90, 0.75);
    transform: rotate(0);
  }
  .gate-node.gate-closed {
    border-color: rgba(232, 90, 90, 0.5);
  }
  .gate-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.75rem;
    font-weight: 600;
    color: #e8a84c;
    margin-bottom: 0.15rem;
  }
  .gate-detail {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #7a7770;
    line-height: 1.4;
  }
  .kappa-indicator {
    margin-top: 0.25rem;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.45rem;
    font-weight: 700;
    color: #e85a5a;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .deploy-stage {
    margin-top: 0.2rem;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.45rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  @media (prefers-reduced-motion: reduce) {
    .gate-bar { transition: none; }
  }
</style>
