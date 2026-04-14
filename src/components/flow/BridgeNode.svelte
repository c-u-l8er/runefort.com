<script>
  import { Handle, Position } from "@xyflow/svelte";
  let { data } = $props();
</script>

<div class="bridge-node">
  <div class="bridge-rune">ᚷ</div>
  <div class="bridge-label">{data.label}</div>
  {#if data.tokens}
    <div class="bridge-tokens">
      {#each data.tokens as token}
        <span class="token-tag">{token}</span>
      {/each}
    </div>
  {/if}
</div>
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />

<style>
  .bridge-node {
    background: #0e0f14;
    border: 1px solid rgba(196, 149, 106, 0.3);
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    text-align: center;
    min-width: 100px;
  }
  .bridge-rune { font-size: 1rem; color: #c4956a; margin-bottom: 0.15rem; }
  .bridge-label {
    font-family: "Cinzel", serif;
    font-size: 0.7rem; font-weight: 500; color: #e4e2dc;
    margin-bottom: 0.25rem;
  }
  .bridge-tokens { display: flex; gap: 0.25rem; flex-wrap: wrap; justify-content: center; }
  .token-tag {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem; color: #e8a84c;
    padding: 0.1rem 0.35rem;
    border: 1px solid rgba(232, 168, 76, 0.2);
    border-radius: 3px;
    background: rgba(232, 168, 76, 0.05);
  }
</style>
