<script>
  import { Handle, Position } from "@xyflow/svelte";
  let { data } = $props();
</script>

<div class="wall-node" style="border-color: {data.color || '#44423d'};">
  <div class="wall-rune">{data.rune || 'ᚦ'}</div>
  <div class="wall-label">{data.label}</div>
  {#if data.policy}
    <div class="wall-policy">{data.policy}</div>
  {/if}
</div>
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />

<style>
  .wall-node {
    background: repeating-linear-gradient(
      90deg, #15161d 0px, #15161d 6px, #1c1d26 6px, #1c1d26 8px
    );
    border: 2px solid;
    border-radius: 3px;
    padding: 0.35rem 0.75rem;
    min-width: 100px;
    text-align: center;
  }
  .wall-rune { font-size: 0.8rem; color: #c4956a; }
  .wall-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem; font-weight: 600; color: #7a7770;
    letter-spacing: 0.06em; text-transform: uppercase;
  }
  .wall-policy {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem; color: #44423d; margin-top: 0.15rem;
  }
</style>
