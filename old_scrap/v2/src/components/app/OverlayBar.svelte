<script>
  import { getOverlays, toggleOverlay } from "$lib/stores/overlays.svelte.js";

  const overlays = getOverlays();
  let expanded = $state(false);

  // Structure is always on; the disclosure only surfaces the eight non-structure lenses.
  const hiddenLenses = $derived(overlays.filter((o) => o.key !== "structure"));
  const activeCount = $derived(hiddenLenses.filter((o) => o.active).length);

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key === "Escape" && expanded) {
      expanded = false;
      e.preventDefault();
    }
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="overlay-bar" role="toolbar" aria-label="Lens controls">
  <span class="bar-label" aria-hidden="true">Structure</span>
  <span class="bar-dot" aria-hidden="true">·</span>

  <button
    type="button"
    class="more-lenses"
    class:expanded
    aria-expanded={expanded}
    aria-controls="more-lenses-pop"
    aria-label={expanded ? "Hide more lenses" : "Show more lenses"}
    onclick={() => { expanded = !expanded; }}
  >
    <span class="more-caret">{expanded ? "▾" : "▸"}</span>
    <span class="more-text">More lenses</span>
    {#if activeCount > 0}
      <span class="active-chip" title={`${activeCount} active lens${activeCount === 1 ? "" : "es"}`}>{activeCount}</span>
    {/if}
  </button>

  {#if expanded}
    <div id="more-lenses-pop" class="more-pop" role="group" aria-label="Additional lenses">
      {#each hiddenLenses as overlay}
        <button
          type="button"
          class="lens-btn"
          class:active={overlay.active}
          aria-pressed={overlay.active}
          onclick={() => toggleOverlay(overlay.key)}
          title="{overlay.label} ({overlay.shortcut}) — hover a {overlay.key === 'flow' ? 'corridor' : overlay.key === 'thermal' ? 'room' : overlay.key === 'rune' ? 'wall' : 'matching element'} to reveal locally"
        >
          <span class="lens-key">{overlay.shortcut}</span>
          <span class="lens-name">{overlay.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .overlay-bar {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    background: rgba(14, 15, 20, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    backdrop-filter: blur(8px);
    position: relative;
  }
  .bar-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #e8a84c;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .bar-dot {
    color: #44423d;
    font-size: 0.7rem;
  }
  .more-lenses {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.55rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 4px;
    cursor: pointer;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    transition: border-color 0.2s, color 0.2s;
  }
  .more-lenses:hover,
  .more-lenses:focus-visible {
    border-color: rgba(232, 168, 76, 0.3);
    color: #e4e2dc;
    outline: none;
  }
  .more-lenses:focus-visible {
    box-shadow: 0 0 0 2px rgba(232, 168, 76, 0.35);
  }
  .more-lenses.expanded {
    border-color: rgba(232, 168, 76, 0.4);
    color: #e4e2dc;
  }
  .more-caret {
    color: #c4956a;
    font-size: 0.7rem;
  }
  .active-chip {
    min-width: 16px;
    padding: 0 0.3rem;
    height: 14px;
    line-height: 14px;
    border-radius: 8px;
    font-size: 0.55rem;
    background: #e8a84c;
    color: #09090d;
  }
  .more-pop {
    position: absolute;
    bottom: calc(100% + 0.5rem);
    left: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    padding: 0.5rem;
    background: rgba(14, 15, 20, 0.98);
    border: 1px solid rgba(232, 168, 76, 0.25);
    border-radius: 8px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    z-index: 10;
  }
  .lens-btn {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.55rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 4px;
    cursor: pointer;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
  }
  .lens-btn:hover,
  .lens-btn:focus-visible {
    border-color: rgba(232, 168, 76, 0.35);
    color: #e4e2dc;
    outline: none;
  }
  .lens-btn:focus-visible {
    box-shadow: 0 0 0 2px rgba(232, 168, 76, 0.35);
  }
  .lens-btn.active {
    background: rgba(232, 168, 76, 0.12);
    border-color: rgba(232, 168, 76, 0.4);
    color: #e4e2dc;
  }
  .lens-key {
    color: #e8a84c;
    min-width: 12px;
    text-align: center;
    font-weight: 600;
  }

  /* Reduced motion — keep focus/hover color swaps but drop transitions */
  @media (prefers-reduced-motion: reduce) {
    .more-lenses,
    .lens-btn {
      transition: none;
    }
  }
</style>
