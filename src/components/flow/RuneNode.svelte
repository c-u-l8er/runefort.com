<script>
  import { Handle, Position } from "@xyflow/svelte";
  let { data } = $props();
</script>

<div class="rune-node">
  <div class="rune-glyph">{data.rune}</div>
  <div class="rune-name">{data.runeName}</div>
  <div class="rune-meaning">{data.meaning}</div>
  <div class="rune-divider"></div>
  <div class="rune-section">
    <span class="rune-key">operation</span>
    <span class="rune-val">{data.operation}</span>
  </div>
  <div class="rune-section">
    <span class="rune-key">machine</span>
    <span class="rune-val">{data.machine}</span>
  </div>
  <div class="rune-section">
    <span class="rune-key">kind</span>
    <span class="rune-val">{data.kind}</span>
  </div>
  <div class="rune-divider"></div>
  <div class="rune-section">
    <span class="rune-key">duration</span>
    <span class="rune-val highlight">{data.duration}</span>
  </div>
  <div class="rune-section">
    <span class="rune-key">nodes</span>
    <span class="rune-val">{data.nodesReturned}</span>
  </div>
  <div class="rune-section">
    <span class="rune-key">edges</span>
    <span class="rune-val">{data.edgesReturned}</span>
  </div>
  <div class="rune-divider"></div>
  <div class="rune-section">
    <span class="rune-key">routing</span>
    <span class="rune-val alert">{data.routing}</span>
  </div>
  <div class="rune-reason">{data.reason}</div>
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />

<style>
  .rune-node {
    background: #0e0f14;
    border: 1px solid rgba(196, 149, 106, 0.3);
    border-radius: 10px;
    padding: 1rem 1.25rem;
    min-width: 280px;
  }
  .rune-glyph {
    font-size: 2rem;
    color: #c4956a;
    text-align: center;
    margin-bottom: 0.25rem;
  }
  .rune-name {
    font-family: "Cinzel", serif;
    font-size: 1rem;
    font-weight: 500;
    color: #e4e2dc;
    text-align: center;
    margin-bottom: 0.15rem;
  }
  .rune-meaning {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #8a9a9e;
    text-align: center;
    margin-bottom: 0.5rem;
  }
  .rune-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
    margin: 0.5rem 0;
  }
  .rune-section {
    display: flex;
    justify-content: space-between;
    padding: 0.15rem 0;
  }
  .rune-key {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
  }
  .rune-val {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #e4e2dc;
    font-weight: 500;
  }
  .rune-val.highlight {
    color: #6ac48c;
  }
  .rune-val.alert {
    color: #e85a5a;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .rune-reason {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #44423d;
    margin-top: 0.25rem;
  }
</style>
