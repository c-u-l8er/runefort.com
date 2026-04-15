<script>
  import { Handle, Position } from "@xyflow/svelte";
  import { testTileStyle } from "$lib/overlayEffects.js";
  let { data } = $props();

  let style = $derived(testTileStyle(data.passed));
  let showDetail = $state(false);
</script>

<div
  class="test-tile"
  style="border-color: {style.border}; background: {style.bg};"
  ondblclick={() => { showDetail = !showDetail; }}
>
  <div class="test-header">
    <span class="test-icon">{data.passed ? "✓" : "✗"}</span>
    <span class="test-name">{data.name}</span>
  </div>

  {#if showDetail && (data.given || data.expected || data.actual)}
    <div class="test-detail">
      {#if data.given}
        <div class="detail-row"><span class="detail-label">given:</span> {data.given}</div>
      {/if}
      {#if data.expected}
        <div class="detail-row"><span class="detail-label">expect:</span> {data.expected}</div>
      {/if}
      {#if data.actual}
        <div class="detail-row" class:mismatch={data.actual !== data.expected}><span class="detail-label">actual:</span> {data.actual}</div>
      {/if}
      {#if data.assertions?.length}
        <div class="detail-assertions">
          {#each data.assertions as assertion}
            <div class="assertion">{assertion}</div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />

<style>
  .test-tile {
    background: #0e0f14;
    border: 1px solid;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    min-width: 140px;
    transition: background 0.3s, border-color 0.3s;
    cursor: pointer;
  }
  .test-tile:hover {
    filter: brightness(1.15);
  }
  .test-header {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .test-icon {
    font-size: 0.75rem;
    font-weight: 700;
  }
  .test-name {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    font-weight: 500;
    color: #e4e2dc;
  }
  .test-detail {
    margin-top: 0.4rem;
    padding-top: 0.35rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  .detail-row {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    color: #7a7770;
    margin-bottom: 0.15rem;
    word-break: break-word;
  }
  .detail-row.mismatch {
    color: #e85a5a;
  }
  .detail-label {
    font-weight: 600;
    color: #8a9a9e;
  }
  .detail-assertions {
    margin-top: 0.25rem;
    padding-top: 0.2rem;
    border-top: 1px dashed rgba(255, 255, 255, 0.04);
  }
  .assertion {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.45rem;
    color: #44423d;
    margin-bottom: 0.1rem;
  }
</style>
