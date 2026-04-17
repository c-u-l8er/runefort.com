<script>
  import { getToasts, dismiss, pause, resume } from "$lib/stores/toast.svelte.js";
  const toasts = getToasts();
</script>

<div class="toast-host" aria-live="polite" aria-atomic="false">
  {#each toasts.visible as t (t.id)}
    <div
      class="toast toast-{t.kind}"
      role="status"
      onmouseenter={() => pause(t.id)}
      onmouseleave={() => resume(t.id)}
      onfocus={() => pause(t.id)}
      onblur={() => resume(t.id)}
    >
      <span class="toast-body">{t.body}</span>
      <button
        type="button"
        class="toast-close"
        aria-label="Dismiss notification"
        onclick={() => dismiss(t.id)}
      >×</button>
    </div>
  {/each}
</div>

<style>
  .toast-host {
    position: fixed;
    right: 1.25rem;
    bottom: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 9000;
    pointer-events: none;
  }
  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.85rem;
    min-width: 240px;
    max-width: 380px;
    background: #0e0f14;
    border: 1px solid rgba(232, 168, 76, 0.25);
    border-left-width: 3px;
    border-radius: 6px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
    font-family: "JetBrains Mono", monospace;
    font-size: 0.72rem;
    color: #e4e2dc;
    line-height: 1.4;
    animation: toast-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .toast-success { border-left-color: #6ac48c; }
  .toast-warn    { border-left-color: #e8a84c; }
  .toast-error   { border-left-color: #e85a5a; }
  .toast-info    { border-left-color: #8a9a9e; }
  .toast-body {
    flex: 1;
    color: #e4e2dc;
  }
  .toast-close {
    background: transparent;
    border: none;
    color: #7a7770;
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    padding: 0 0.25rem;
    transition: color 160ms ease;
  }
  .toast-close:hover, .toast-close:focus-visible {
    color: #e4e2dc;
    outline: none;
  }
  @keyframes toast-in {
    0%   { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .toast { animation: none; }
  }
</style>
