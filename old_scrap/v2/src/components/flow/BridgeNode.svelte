<script>
  import { Handle, Position } from "@xyflow/svelte";
  import { isOverlayActiveOn, setLocalOverlay, clearLocalOverlay } from "$lib/stores/overlays.svelte.js";

  let { id, data } = $props();

  // Motion-is-the-menu: hovering a bridge reveals Flow + the ᚷ rune locally.
  const flowOn = $derived(isOverlayActiveOn(id, "flow"));

  // Spec §6.1 behavior #11 — bridge lights on token transit: a traveling ᚷ
  // rune glides left→right when `data.tokenInFlight` is truthy.
  const tokenInFlight = $derived(!!data.tokenInFlight);

  function reveal() { setLocalOverlay(id, "flow"); }
  function unreveal() { clearLocalOverlay(id, "flow"); }
</script>

<div
  class="bridge-node"
  class:flow-on={flowOn}
  class:transit={tokenInFlight}
  role="group"
  aria-label={`Bridge ${data.label ?? id}${tokenInFlight ? ' — token in flight' : ''} — hover to reveal flow`}
  tabindex="0"
  onmouseenter={reveal}
  onmouseleave={unreveal}
  onfocus={reveal}
  onblur={unreveal}
>
  {#if tokenInFlight}
    <span class="transit-rune" aria-hidden="true">ᚷ</span>
  {/if}
  <div class="bridge-rune" class:pulsing={flowOn}>ᚷ</div>
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
    position: relative;
    overflow: hidden;
    transition: border-color 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
                box-shadow 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  /* §6.1 behavior #11 — token transit glow */
  .bridge-node.transit {
    border-color: rgba(232, 168, 76, 0.75);
    box-shadow: 0 0 18px rgba(232, 168, 76, 0.3);
  }
  .transit-rune {
    position: absolute;
    top: 50%;
    left: -12px;
    transform: translateY(-50%);
    font-size: 0.95rem;
    color: #e8a84c;
    opacity: 0;
    pointer-events: none;
    text-shadow: 0 0 8px rgba(232, 168, 76, 0.6);
    animation: bridge-transit 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  @keyframes bridge-transit {
    0%   { left: -14px; opacity: 0; }
    25%  { opacity: 1; }
    75%  { opacity: 1; }
    100% { left: calc(100% + 4px); opacity: 0; }
  }
  .bridge-node:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(232, 168, 76, 0.4);
  }
  .bridge-node.flow-on {
    border-color: rgba(232, 168, 76, 0.85);
    box-shadow: 0 0 14px rgba(232, 168, 76, 0.25);
  }
  .bridge-rune {
    font-size: 1rem;
    color: #c4956a;
    margin-bottom: 0.15rem;
    transition: color 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
                transform 1.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .bridge-rune.pulsing {
    color: #e8a84c;
    animation: bridge-pulse 1.6s ease-in-out infinite;
  }
  @keyframes bridge-pulse {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(-2px); opacity: 0.7; }
  }
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
  @media (prefers-reduced-motion: reduce) {
    .bridge-node, .bridge-rune { transition: none; }
    .bridge-rune.pulsing { animation: none; }
    .bridge-node.flow-on { box-shadow: none; }
    .transit-rune { animation: none; left: 10px; opacity: 0.8; }
  }
</style>
