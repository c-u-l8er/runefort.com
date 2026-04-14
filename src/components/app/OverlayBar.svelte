<script>
  import { getOverlays, toggleOverlay } from "$lib/stores/overlays.svelte.js";

  const overlays = getOverlays();
</script>

<div class="overlay-bar">
  <span class="bar-label">Lenses</span>
  {#each overlays as overlay}
    <button
      class="overlay-btn"
      class:active={overlay.active}
      class:locked={overlay.key === 'structure'}
      onclick={() => toggleOverlay(overlay.key)}
      title="{overlay.label} ({overlay.shortcut})"
    >
      <span class="overlay-key">{overlay.shortcut}</span>
      <span class="overlay-name">{overlay.label}</span>
    </button>
  {/each}
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
  }
  .bar-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #44423d;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-right: 0.25rem;
  }
  .overlay-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    color: inherit;
  }
  .overlay-btn:hover { border-color: rgba(232, 168, 76, 0.3); }
  .overlay-btn.active {
    background: rgba(232, 168, 76, 0.1);
    border-color: rgba(232, 168, 76, 0.4);
  }
  .overlay-btn.locked {
    opacity: 0.5;
    cursor: default;
  }
  .overlay-key {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    font-weight: 600;
    color: #e8a84c;
    min-width: 12px;
    text-align: center;
  }
  .overlay-name {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #7a7770;
  }
  .overlay-btn.active .overlay-name { color: #e4e2dc; }
</style>
