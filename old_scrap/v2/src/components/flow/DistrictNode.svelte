<script>
  import { Handle, Position } from "@xyflow/svelte";
  let { data } = $props();
</script>

<div class="district-node">
  <div class="district-rune">ᛟ</div>
  <div class="district-label">{data.label}</div>
  <div class="district-detail">{data.detail}</div>
  {#if data.fortCount}
    <div class="district-count">{data.fortCount} forts</div>
  {/if}
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />

<style>
  .district-node {
    background: #0a0b10;
    border: 2px solid rgba(232, 168, 76, 0.15);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    text-align: center;
    min-width: 160px;
  }
  .district-rune { font-size: 1.6rem; color: #e8a84c; margin-bottom: 0.25rem; }
  .district-label {
    font-family: "Cinzel", serif;
    font-size: 1rem; font-weight: 600; color: #e4e2dc;
    margin-bottom: 0.15rem;
  }
  .district-detail {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem; color: #7a7770; margin-bottom: 0.25rem;
  }
  .district-count {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem; color: #e8a84c;
    letter-spacing: 0.04em;
  }
</style>
