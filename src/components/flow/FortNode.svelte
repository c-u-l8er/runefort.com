<script>
  import { Handle, Position } from "@xyflow/svelte";
  import { isOverlayActive } from "$lib/stores/overlays.svelte.js";
  import { thermalStyle, topologyStyle } from "$lib/overlayEffects.js";
  let { data } = $props();

  let thermal = $derived(isOverlayActive("thermal") ? thermalStyle(0.5) : null);
  let topo = $derived(isOverlayActive("topology") ? topologyStyle(data, "fort") : null);

  let overlayGlow = $derived(thermal?.glow ?? topo?.glow ?? "none");
  let overlayBorder = $derived(topo?.border ?? data.color + "40");
</script>

<div class="fort-node" style="border-color: {overlayBorder}; box-shadow: {overlayGlow};">
  <div class="fort-rune" style="color: {data.color};">{data.rune}</div>
  <div class="fort-label">{data.label}</div>
  <div class="fort-role">{data.role}</div>
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />

<style>
  .fort-node {
    background: #0e0f14;
    border: 1px solid;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    min-width: 130px;
    text-align: center;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  .fort-rune {
    font-size: 1.2rem;
    margin-bottom: 0.25rem;
  }
  .fort-label {
    font-family: "Cinzel", serif;
    font-size: 0.85rem;
    font-weight: 500;
    color: #e4e2dc;
    margin-bottom: 0.15rem;
  }
  .fort-role {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
    letter-spacing: 0.04em;
  }
</style>
