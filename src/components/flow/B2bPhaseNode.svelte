<script>
  import { Handle, Position } from "@xyflow/svelte";
  let { data } = $props();
</script>

<div class="b2b-phase">
  <span class="phase-rune">{data.rune}</span>
  <div class="phase-info">
    <span class="phase-label">{data.label}</span>
    <span class="phase-detail">{data.detail}</span>
  </div>
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />

<style>
  .b2b-phase {
    background: #12131a;
    border: 1px solid rgba(232, 168, 76, 0.2);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 130px;
  }
  .phase-rune {
    font-size: 1.1rem;
    color: #c4956a;
  }
  .phase-info {
    display: flex;
    flex-direction: column;
  }
  .phase-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    font-weight: 600;
    color: #e4e2dc;
  }
  .phase-detail {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #7a7770;
  }
</style>
