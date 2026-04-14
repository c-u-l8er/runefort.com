<script>
  import { Handle, Position } from "@xyflow/svelte";
  let { data } = $props();
  const stateColors = { active: "#6ac48c", pulsing: "#e8a84c", idle: "#44423d" };
</script>

<div class="hall-node" style="border-color: {stateColors[data.state] || '#44423d'}40;">
  <div class="hall-rune">{data.rune || 'ᚖ'}</div>
  <div class="hall-label">{data.label}</div>
  {#if data.flowRate !== undefined}
    <div class="hall-flow">
      <span class="flow-label">flow</span>
      <div class="flow-bar">
        <div class="flow-fill" style="width: {(data.flowRate || 0) * 100}%;"></div>
      </div>
    </div>
  {/if}
</div>
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />

<style>
  .hall-node {
    background: #12131a;
    border: 1px dashed;
    border-radius: 4px;
    padding: 0.4rem 1rem;
    min-width: 120px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .hall-rune { font-size: 0.9rem; color: #c4956a; }
  .hall-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    color: #8a9a9e;
    letter-spacing: 0.04em;
  }
  .hall-flow { display: flex; align-items: center; gap: 0.4rem; margin-left: auto; }
  .flow-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    color: #44423d;
  }
  .flow-bar {
    width: 40px; height: 3px;
    background: #15161d; border-radius: 2px; overflow: hidden;
  }
  .flow-fill {
    height: 100%; background: #e8a84c; border-radius: 2px;
    transition: width 0.5s ease;
  }
</style>
