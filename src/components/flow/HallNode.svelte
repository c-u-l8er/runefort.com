<script>
  import { Handle, Position } from "@xyflow/svelte";
  import { setLocalOverlay, clearLocalOverlay, isOverlayActiveOn } from "$lib/stores/overlays.svelte.js";

  let { id, data } = $props();
  const stateColors = { active: "#6ac48c", pulsing: "#e8a84c", idle: "#44423d" };

  // Motion-is-the-menu (spec §2.3): hovering a hall fades Flow in on *this hall*.
  const flowOn = $derived(isOverlayActiveOn(id, "flow"));

  // Spec §6.1 behavior #6 — corridor pulses when κ > 0: a ᚱ rune flows along
  // the hall tiles at a 1.2 s cadence. Driven by `data.kappa > 0` on the hall.
  const kappaActive = $derived((data.kappa ?? 0) > 0);

  function reveal() { setLocalOverlay(id, "flow"); }
  function unreveal() { clearLocalOverlay(id, "flow"); }
</script>

<div
  class="hall-node"
  class:flow-on={flowOn}
  class:kappa={kappaActive}
  style="border-color: {stateColors[data.state] || '#44423d'}40;"
  role="group"
  aria-label={`Corridor ${data.label ?? id}${kappaActive ? ' (deliberation — κ>0)' : ''} — hover to reveal flow overlay`}
  tabindex="0"
  onmouseenter={reveal}
  onmouseleave={unreveal}
  onfocus={reveal}
  onblur={unreveal}
>
  {#if kappaActive}
    <span class="kappa-rune" aria-hidden="true">ᚱ</span>
  {/if}
  <div class="hall-rune">{data.rune || 'ᚖ'}</div>
  <div class="hall-label">{data.label}</div>
  {#if data.flowRate !== undefined}
    <div class="hall-flow">
      <span class="flow-label">flow</span>
      <div class="flow-bar">
        <div class="flow-fill" style="width: {(data.flowRate || 0) * 100}%;"></div>
      </div>
    </div>
  {/if}
</div>
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />

<style>
  .hall-node {
    background: #12131a;
    border: 1px dashed;
    border-radius: 4px;
    padding: 0.4rem 1rem;
    min-width: 120px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    overflow: hidden;
    transition: border-color 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
                background 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
                box-shadow 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  /* §6.1 behavior #6 — κ corridor pulse: ᚱ rune flows left → right */
  .hall-node.kappa {
    border-color: rgba(232, 90, 90, 0.6) !important;
    background: rgba(232, 90, 90, 0.06);
  }
  .kappa-rune {
    position: absolute;
    left: -12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.7rem;
    color: #e85a5a;
    opacity: 0;
    pointer-events: none;
    animation: kappa-travel 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  @keyframes kappa-travel {
    0%   { left: -12px; opacity: 0; }
    20%  { opacity: 1; }
    80%  { opacity: 1; }
    100% { left: 100%; opacity: 0; }
  }
  .hall-node:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(232, 168, 76, 0.4);
  }
  /* Motion-is-the-menu: local Flow reveal highlights this corridor only */
  .hall-node.flow-on {
    border-color: rgba(232, 168, 76, 0.85) !important;
    background: rgba(232, 168, 76, 0.08);
    box-shadow: 0 0 12px rgba(232, 168, 76, 0.2);
  }
  .hall-rune { font-size: 0.9rem; color: #c4956a; }
  .hall-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    color: #8a9a9e;
    letter-spacing: 0.04em;
  }
  .hall-flow { display: flex; align-items: center; gap: 0.4rem; margin-left: auto; }
  .flow-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    color: #44423d;
  }
  .flow-bar {
    width: 40px; height: 3px;
    background: #15161d; border-radius: 2px; overflow: hidden;
  }
  .flow-fill {
    height: 100%; background: #e8a84c; border-radius: 2px;
    transition: width 0.5s ease;
  }

  @media (prefers-reduced-motion: reduce) {
    .hall-node, .flow-fill {
      transition: none;
    }
    .hall-node.flow-on {
      box-shadow: none;
    }
    .kappa-rune {
      animation: none;
      left: 8px;
      opacity: 0.75;
    }
  }
</style>
