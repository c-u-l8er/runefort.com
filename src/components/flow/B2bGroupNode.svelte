<script>
  import { Handle, Position } from "@xyflow/svelte";
  let { data } = $props();
  const isOpaque = data.style === "opaque";
</script>

<div class="b2b-group" class:opaque={isOpaque}>
  <div class="b2b-group-title">{data.label}</div>
</div>
<Handle type="source" position={Position.Right} id="right" />
<Handle type="target" position={Position.Left} id="left" />

<style>
  .b2b-group {
    width: 100%;
    height: 100%;
    border: 1px solid rgba(232, 168, 76, 0.3);
    border-radius: 10px;
    background: rgba(14, 15, 20, 0.6);
    position: relative;
  }
  .b2b-group.opaque {
    border-color: rgba(122, 119, 112, 0.3);
  }
  .b2b-group-title {
    position: absolute;
    top: -10px;
    left: 16px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: #e8a84c;
    background: #09090d;
    padding: 0 8px;
  }
  .b2b-group.opaque .b2b-group-title {
    color: #7a7770;
  }
</style>
