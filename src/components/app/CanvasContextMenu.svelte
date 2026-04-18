<script>
  import { onDestroy } from "svelte";

  /**
   * @typedef {{ label: string, icon?: string, onclick?: () => void, disabled?: boolean, danger?: boolean, separator?: boolean }} MenuItem
   */

  /**
   * @type {{
   *   open: boolean,
   *   x: number,
   *   y: number,
   *   items: MenuItem[],
   *   onclose: () => void,
   * }}
   */
  let { open, x, y, items, onclose } = $props();

  let el = $state(/** @type {HTMLDivElement | null} */ (null));

  // Clamp to viewport so the menu never opens off-screen.
  const ESTIMATED_H = 36;
  const ESTIMATED_W = 240;
  const clamped = $derived.by(() => {
    if (typeof window === "undefined") return { left: x, top: y };
    const w = el?.offsetWidth ?? ESTIMATED_W;
    const h = el?.offsetHeight ?? ESTIMATED_H * Math.max(items.length, 1) + 12;
    const left = Math.min(x, window.innerWidth - w - 8);
    const top = Math.min(y, window.innerHeight - h - 8);
    return { left: Math.max(8, left), top: Math.max(8, top) };
  });

  /** @param {MouseEvent} e */
  function handleDocClick(e) {
    if (!open) return;
    if (el && !el.contains(/** @type {Node} */ (e.target))) onclose();
  }
  /** @param {KeyboardEvent} e */
  function handleKey(e) {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      onclose();
    }
  }

  $effect(() => {
    if (!open) return;
    // Attach once while open, detach on close.
    document.addEventListener("mousedown", handleDocClick, true);
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handleDocClick, true);
      document.removeEventListener("keydown", handleKey, true);
    };
  });

  onDestroy(() => {
    document.removeEventListener("mousedown", handleDocClick, true);
    document.removeEventListener("keydown", handleKey, true);
  });

  /** @param {MenuItem} item */
  function handleClick(item) {
    if (item.disabled || item.separator) return;
    onclose();
    if (item.onclick) item.onclick();
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="menu"
    bind:this={el}
    role="menu"
    style:left="{clamped.left}px"
    style:top="{clamped.top}px"
    oncontextmenu={(e) => e.preventDefault()}
  >
    {#each items as item, i (i)}
      {#if item.separator}
        <div class="sep" role="separator"></div>
      {:else}
        <button
          type="button"
          class="item"
          class:danger={item.danger}
          disabled={item.disabled}
          onclick={() => handleClick(item)}
          role="menuitem"
        >
          {#if item.icon}<span class="icon">{item.icon}</span>{/if}
          <span class="label">{item.label}</span>
        </button>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .menu {
    position: fixed;
    z-index: 300;
    min-width: 220px;
    max-width: 320px;
    padding: 0.3rem;
    background: #0e0f14;
    border: 1px solid rgba(232, 168, 76, 0.25);
    border-radius: 8px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
    font-family: "JetBrains Mono", monospace;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.45rem 0.6rem;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #e4e2dc;
    font-family: inherit;
    font-size: 0.65rem;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
  }
  .item:hover:not(:disabled) {
    background: rgba(232, 168, 76, 0.1);
  }
  .item:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .item.danger {
    color: #e85a5a;
  }
  .item.danger:hover:not(:disabled) {
    background: rgba(232, 90, 90, 0.12);
  }
  .icon {
    width: 1rem;
    text-align: center;
    color: #e8a84c;
  }
  .label {
    flex: 1;
  }
  .sep {
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
    margin: 0.25rem 0;
  }
</style>
