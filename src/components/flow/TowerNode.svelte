<script>
  import { Handle, Position } from "@xyflow/svelte";
  let { data } = $props();
  const isAlert = data.state === "alert";
</script>

<div class="tower-node" class:alert={isAlert}>
  <div class="tower-icon">{data.rune || 'ᛉ'}</div>
  <div class="tower-label">{data.label}</div>
  <div class="tower-levels">
    {#each Array(data.elevation || 3) as _, i}
      <div class="tower-level" class:lit={i < (data.litLevels || 1)}></div>
    {/each}
  </div>
  {#if data.detail}
    <div class="tower-detail">{data.detail}</div>
  {/if}
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />

<style>
  .tower-node {
    background: #0e0f14;
    border: 1px solid rgba(232, 168, 76, 0.2);
    border-radius: 6px;
    padding: 0.6rem 0.8rem;
    text-align: center;
    min-width: 80px;
  }
  .tower-node.alert { border-color: rgba(232, 90, 90, 0.5); }
  .tower-icon { font-size: 1.4rem; color: #c4956a; margin-bottom: 0.15rem; }
  .tower-node.alert .tower-icon { color: #e85a5a; }
  .tower-label {
    font-family: "Cinzel", serif;
    font-size: 0.7rem; font-weight: 500; color: #e4e2dc;
    margin-bottom: 0.3rem;
  }
  .tower-levels {
    display: flex; gap: 2px; justify-content: center; margin-bottom: 0.2rem;
  }
  .tower-level {
    width: 8px; height: 8px; border-radius: 2px;
    background: #1c1d26; border: 1px solid #2a2b34;
  }
  .tower-level.lit { background: #e8a84c; border-color: #e8a84c; }
  .tower-detail {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem; color: #44423d;
  }
</style>
