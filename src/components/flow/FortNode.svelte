<script>
  import { Handle, Position } from "@xyflow/svelte";
  let { data } = $props();
</script>

<div class="fort-node" style="border-color: {data.color}40;">
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
