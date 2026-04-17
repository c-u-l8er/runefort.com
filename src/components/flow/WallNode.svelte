<script>
  import { Handle, Position } from "@xyflow/svelte";
  import { setLocalOverlay, clearLocalOverlay, isOverlayActiveOn } from "$lib/stores/overlays.svelte.js";

  let { id, data } = $props();

  // Spec §5.1 — clicking a wall cracks open Rune on *that wall*. This is the
  // progressive-disclosure entry point into the rune layer for default users.
  const runeOn = $derived(isOverlayActiveOn(id, "rune"));
  let cracked = $state(false);

  // Spec §6.1 behaviors #7 + #8 — the wall thickens on policy-block count
  // increase (tile multiply, capped at 3) and thins as blocks relax. Driven
  // by `data.tileMultiplier` in the range [1, 3]. 1 = thin; 3 = fortified.
  const tiles = $derived(Math.max(1, Math.min(3, Math.round(data.tileMultiplier ?? 1))));

  function crackOpen() {
    cracked = !cracked;
    if (cracked) setLocalOverlay(id, "rune");
    else clearLocalOverlay(id, "rune");
  }

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      crackOpen();
    }
    if (e.key === "Escape" && cracked) {
      cracked = false;
      clearLocalOverlay(id, "rune");
    }
  }
</script>

<button
  type="button"
  class="wall-node"
  class:rune-on={runeOn}
  class:cracked
  data-tiles={tiles}
  style="border-color: {data.color || '#44423d'}; border-width: {tiles * 2}px;"
  onclick={crackOpen}
  onkeydown={onKey}
  aria-label={`Wall ${data.label ?? id}${cracked ? ' (open)' : ' — click to crack open'}${tiles > 1 ? ` · fortified x${tiles}` : ''}`}
  aria-expanded={cracked}
>
  <div class="wall-rune">{data.rune || 'ᚦ'}</div>
  <div class="wall-label">{data.label}</div>
  {#if data.policy}
    <div class="wall-policy">{data.policy}</div>
  {/if}
  {#if cracked}
    <div class="wall-crack" aria-hidden="true">
      <span class="crack-rune">{data.rune || 'ᚦ'}</span>
      <span class="crack-note">{data.note ?? data.policy ?? "policy mechanism"}</span>
    </div>
  {/if}
</button>
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
    cursor: pointer;
    color: inherit;
    font: inherit;
    transition: border-color 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
                border-width 320ms cubic-bezier(0.2, 0.8, 0.2, 1),
                box-shadow 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
                transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  /* §6.1 behaviors #7/#8 — fortification tile multiply: denser stripe pattern
     as policy-block count rises. Caps at 3 (tile-3). */
  .wall-node[data-tiles="2"] {
    background: repeating-linear-gradient(
      90deg, #15161d 0px, #15161d 4px, #20212c 4px, #20212c 6px
    );
  }
  .wall-node[data-tiles="3"] {
    background: repeating-linear-gradient(
      90deg, #15161d 0px, #15161d 3px, #262732 3px, #262732 5px
    );
    box-shadow: inset 0 0 0 1px rgba(232, 90, 90, 0.25);
  }
  .wall-node:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(232, 168, 76, 0.45);
  }
  .wall-node.rune-on,
  .wall-node.cracked {
    border-color: rgba(196, 149, 106, 0.9) !important;
    box-shadow: 0 0 16px rgba(196, 149, 106, 0.25);
  }
  .wall-node.cracked {
    transform: translateY(-1px);
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
  .wall-crack {
    margin-top: 0.35rem;
    padding: 0.3rem 0.5rem;
    background: rgba(196, 149, 106, 0.08);
    border: 1px solid rgba(196, 149, 106, 0.35);
    border-radius: 3px;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    align-items: center;
  }
  .crack-rune {
    font-size: 1.1rem;
    color: #e8a84c;
  }
  .crack-note {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    color: #c4956a;
    letter-spacing: 0.04em;
  }

  @media (prefers-reduced-motion: reduce) {
    .wall-node { transition: border-color 0s, border-width 0s; }
    .wall-node.cracked { transform: none; }
    .wall-node.rune-on, .wall-node.cracked { box-shadow: none; }
  }
</style>
