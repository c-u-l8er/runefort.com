<script>
  import { getFort, setZoomLevel, zoomOut } from "$lib/stores/fort.svelte.js";

  const fort = getFort();
  const levels = [
    { id: 0, code: "L0", name: "District" },
    { id: 1, code: "L1", name: "Campus" },
    { id: 2, code: "L2", name: "Wing" },
    { id: 3, code: "L3", name: "Room" },
    { id: 4, code: "L4", name: "Rune" },
  ];
</script>

<div class="zoom-bar">
  <button class="zoom-back" onclick={zoomOut} disabled={fort.zoomLevel === 0} title="Zoom out (Escape)">
    ←
  </button>
  {#each levels as level}
    <button
      class="zoom-btn"
      class:active={fort.zoomLevel === level.id}
      class:reachable={level.id <= fort.zoomLevel || (level.id === 1 && fort.activeFortId)}
      onclick={() => setZoomLevel(level.id)}
      disabled={level.id > fort.zoomLevel + 1}
    >
      <span class="zoom-code">{level.code}</span>
      <span class="zoom-name">{level.name}</span>
    </button>
  {/each}
</div>

<style>
  .zoom-bar {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.4rem 0.75rem;
    background: rgba(14, 15, 20, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    backdrop-filter: blur(8px);
  }
  .zoom-back {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 4px;
    color: #e8a84c;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    transition: all 0.2s;
    font-family: inherit;
  }
  .zoom-back:disabled { opacity: 0.3; cursor: default; }
  .zoom-back:not(:disabled):hover {
    background: rgba(232, 168, 76, 0.1);
    border-color: rgba(232, 168, 76, 0.3);
  }
  .zoom-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.25rem 0.5rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    color: inherit;
    min-width: 52px;
  }
  .zoom-btn:disabled { opacity: 0.25; cursor: default; }
  .zoom-btn:not(:disabled):hover {
    border-color: rgba(232, 168, 76, 0.3);
  }
  .zoom-btn.active {
    background: rgba(232, 168, 76, 0.1);
    border-color: rgba(232, 168, 76, 0.4);
  }
  .zoom-code {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    font-weight: 600;
    color: #e8a84c;
  }
  .zoom-name {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    color: #7a7770;
  }
  .zoom-btn.active .zoom-name { color: #e4e2dc; }
</style>
