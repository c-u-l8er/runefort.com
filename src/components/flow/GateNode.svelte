<script>
  import { Handle, Position } from "@xyflow/svelte";
  let { data } = $props();
</script>

<div class="gate-node">
  <div class="gate-label">{data.label}</div>
  <div class="gate-detail">{data.detail}</div>
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />

<style>
  .gate-node {
    background: #15161d;
    border: 1px solid rgba(232, 168, 76, 0.25);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    text-align: center;
    min-width: 80px;
    transform: rotate(0deg);
  }
  .gate-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.75rem;
    font-weight: 600;
    color: #e8a84c;
    margin-bottom: 0.15rem;
  }
  .gate-detail {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #7a7770;
    line-height: 1.4;
  }
</style>
