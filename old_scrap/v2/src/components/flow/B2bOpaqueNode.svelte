<script>
  import { Handle, Position } from "@xyflow/svelte";
  let { data } = $props();
</script>

<div class="b2b-opaque">
  <div class="opaque-bars">
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
  </div>
  <div class="opaque-text">opaque</div>
</div>
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />

<style>
  .b2b-opaque {
    background: #0e0f14;
    border: 2px solid rgba(122, 119, 112, 0.25);
    border-radius: 6px;
    padding: 1.25rem 1.5rem;
    min-width: 180px;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }
  .opaque-bars {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 80%;
  }
  .bar {
    height: 4px;
    background: rgba(122, 119, 112, 0.15);
    border-radius: 2px;
  }
  .bar:nth-child(2) { width: 70%; }
  .bar:nth-child(3) { width: 85%; }
  .bar:nth-child(4) { width: 50%; }
  .opaque-text {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #44423d;
    letter-spacing: 0.08em;
  }
</style>
