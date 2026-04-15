<script>
  import { Handle, Position } from "@xyflow/svelte";
  import { isOverlayActive } from "$lib/stores/overlays.svelte.js";
  import { topologyStyle, temporalStyle, assemblyDeployColor } from "$lib/overlayEffects.js";
  let { data } = $props();

  let topo = $derived(isOverlayActive("topology") ? topologyStyle(data, "gate") : null);
  let temporal = $derived(isOverlayActive("temporal") ? temporalStyle(data.kind, data.timeout ?? 5000) : null);
  let assemblyActive = $derived(isOverlayActive("assembly"));
  let deployColor = $derived(assemblyActive && data.deployStage ? assemblyDeployColor(data.deployStage) : null);

  let overlayBorder = $derived(deployColor ?? topo?.border ?? "rgba(232, 168, 76, 0.25)");
  let overlayGlow = $derived(deployColor ? `0 0 8px ${deployColor}40` : topo?.glow ?? "none");
</script>

<div class="gate-node" style="border-color: {overlayBorder}; box-shadow: {overlayGlow};">
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
    transition: border-color 0.3s, box-shadow 0.3s;
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
</style>
