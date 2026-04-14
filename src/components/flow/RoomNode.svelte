<script>
  import { Handle, Position } from "@xyflow/svelte";
  let { data } = $props();

  const stateColors = { active: "#6ac48c", pulsing: "#e8a84c", idle: "#44423d" };
  const borderColor = stateColors[data.state] || "#44423d";
</script>

<div class="room-node" style="border-color: {borderColor}60;">
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
      <div class="activity-fill" style="width: {(data.activity || 0) * 100}%; background: {borderColor};"></div>
    </div>
  {/if}
  {#if data.timeout}
    <div class="room-timeout">timeout: {data.timeout}ms</div>
  {/if}
  <div class="room-state" style="color: {borderColor};">{data.state}</div>
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
</style>
