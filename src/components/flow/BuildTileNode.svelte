<script>
  import { Handle, Position } from "@xyflow/svelte";
  import { buildTileStyle } from "$lib/overlayEffects.js";
  let { data } = $props();

  let style = $derived(buildTileStyle(data.status));

  function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }
</script>

<div class="build-tile" style="border-color: {style.border}; background: {style.bg};">
  <div class="build-header">
    <span class="build-version">{data.version}</span>
    <span class="build-status" style="color: {style.border};">{data.status}</span>
  </div>
  {#if data.duration}
    <div class="build-meta">{formatDuration(data.duration)}</div>
  {/if}
  {#if data.timestamp}
    <div class="build-time">{formatDate(data.timestamp)}</div>
  {/if}
  {#if data.testCount != null}
    <div class="build-tests">
      <span class="test-pass">{data.testPass ?? 0}</span>/<span class="test-total">{data.testCount}</span>
    </div>
  {/if}
  {#if data.status === "running"}
    <div class="build-pulse"></div>
  {/if}
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />

<style>
  .build-tile {
    background: #0e0f14;
    border: 1px solid;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    min-width: 110px;
    text-align: center;
    transition: background 0.3s, border-color 0.3s;
    cursor: pointer;
  }
  .build-tile:hover {
    filter: brightness(1.15);
  }
  .build-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    margin-bottom: 0.2rem;
  }
  .build-version {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    font-weight: 600;
    color: #e4e2dc;
  }
  .build-status {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .build-meta, .build-time {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    color: #7a7770;
  }
  .build-tests {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    margin-top: 0.15rem;
  }
  .test-pass { color: #6ac48c; }
  .test-total { color: #7a7770; }
  .build-pulse {
    width: 100%;
    height: 2px;
    margin-top: 0.3rem;
    background: linear-gradient(90deg, transparent, #4a9ade, transparent);
    border-radius: 1px;
    animation: pulse-build 1.5s ease-in-out infinite;
  }
  @keyframes pulse-build {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
</style>
