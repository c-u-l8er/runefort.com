<script>
  import { Handle, Position } from "@xyflow/svelte";
  let { data } = $props();

  const confColor = data.confidence > 0.8 ? "#6ac48c" : data.confidence > 0.6 ? "#e8a84c" : "#e85a5a";
</script>

<div class="tile-node" style="border-color: {confColor}30;">
  <div class="tile-header">
    <span class="tile-id">{data.label}</span>
    <span class="tile-type" style="color: {confColor};">{data.nodeType}</span>
  </div>
  <div class="tile-content">{data.content}</div>
  <div class="tile-meta">
    <span class="conf" style="color: {confColor};">conf: {data.confidence}</span>
    <span class="ts">{data.timescale}</span>
    <span class="access">access: {data.accessCount}</span>
  </div>
  <div class="tile-decay">decay: {data.decayRate}</div>
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
</style>
