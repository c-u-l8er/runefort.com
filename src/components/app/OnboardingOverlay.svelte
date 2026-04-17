<script>
  // Four dismissible floating labels that teach the editor without a manual.
  // Spec §9 Phase 0.
  //
  // Each label refers to an affordance that is actually shipped today (Stage
  // D1). If a later stage adds new affordances, extend this list rather than
  // rewording the existing labels — and never claim an affordance that is not
  // yet live (spec §10.7 "onboarding honesty").
  //
  // Persistence model:
  //  - unauthed users: `localStorage.runefort.onboarding.<label_id>=dismissed`
  //  - authed users (future): merge into `amp.profiles.onboarding_state` on
  //    sign-in (not yet implemented — tracked in Stage C TODO)
  // The container also writes `runefort.seen_starter=yes` once every label is
  // dismissed so the Starter Fort does not reappear on the next visit.

  const LABELS = [
    {
      id: "room",
      text: "this is a room. it's one phase of the loop.",
      selector: '.svelte-flow__node-room',
    },
    {
      id: "corridor",
      text: "hover a corridor to see data flowing.",
      selector: '.svelte-flow__edge',
    },
    {
      id: "wall",
      text: "click a wall to crack it open and see the mechanism.",
      selector: '.wall-node',
    },
    {
      id: "rpress",
      text: "press R! in the dark factory to watch a spec become a deployed agent.",
      selector: '.more-lenses',
    },
  ];

  /** @param {string} id */
  function isDismissed(id) {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(`runefort.onboarding.${id}`) === "dismissed";
  }

  /** @param {string} id */
  function dismiss(id) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(`runefort.onboarding.${id}`, "dismissed");
    visible = visible.filter((v) => v.id !== id);
    if (visible.length === 0) {
      window.localStorage.setItem("runefort.seen_starter", "yes");
    }
  }

  /** @type {Array<{ id: string, text: string, selector: string }>} */
  let visible = $state(LABELS.filter((l) => !isDismissed(l.id)));

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key === "Escape" && visible.length > 0) {
      // Esc dismisses the top-most label first.
      dismiss(visible[0].id);
      e.preventDefault();
    }
  }

  function dismissAll() {
    for (const l of LABELS) dismiss(l.id);
  }
</script>

<svelte:window onkeydown={onKey} />

{#if visible.length > 0}
  <div class="onboarding-root" aria-live="polite">
    {#each visible as label, i (label.id)}
      <div class="label" class:first={i === 0} role="dialog" aria-label={label.text}>
        <div class="label-step">{LABELS.findIndex((l) => l.id === label.id) + 1}/{LABELS.length}</div>
        <p class="label-body">{label.text}</p>
        <button
          type="button"
          class="label-dismiss"
          aria-label="Dismiss this tip"
          onclick={() => dismiss(label.id)}
        >Got it</button>
      </div>
    {/each}
    {#if visible.length > 1}
      <button type="button" class="skip-all" onclick={dismissAll} aria-label="Skip onboarding">skip onboarding</button>
    {/if}
  </div>
{/if}

<style>
  .onboarding-root {
    position: fixed;
    top: 80px;
    left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    max-width: min(320px, calc(100vw - 2rem));
    z-index: 40;
    pointer-events: none;
  }
  .label {
    pointer-events: auto;
    padding: 0.75rem 1rem;
    background: rgba(14, 15, 20, 0.98);
    border: 1px solid rgba(232, 168, 76, 0.35);
    border-radius: 10px;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    opacity: 0.88;
    transition: opacity 180ms ease, transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .label.first {
    opacity: 1;
    border-color: rgba(232, 168, 76, 0.65);
  }
  .label-step {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #e8a84c;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .label-body {
    margin: 0;
    font-family: "IBM Plex Sans", sans-serif;
    font-size: 0.85rem;
    line-height: 1.55;
    color: #e4e2dc;
  }
  .label-dismiss {
    align-self: flex-end;
    padding: 0.3rem 0.7rem;
    background: rgba(232, 168, 76, 0.1);
    border: 1px solid rgba(232, 168, 76, 0.4);
    border-radius: 4px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #e4e2dc;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 180ms ease, border-color 180ms ease;
  }
  .label-dismiss:hover,
  .label-dismiss:focus-visible {
    background: rgba(232, 168, 76, 0.2);
    border-color: rgba(232, 168, 76, 0.7);
    outline: none;
  }
  .label-dismiss:focus-visible {
    box-shadow: 0 0 0 2px rgba(232, 168, 76, 0.45);
  }
  .skip-all {
    pointer-events: auto;
    align-self: flex-start;
    background: transparent;
    border: none;
    color: #7a7770;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    padding: 0.25rem 0;
  }
  .skip-all:hover,
  .skip-all:focus-visible {
    color: #e4e2dc;
    outline: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .label { transition: none; }
  }
</style>
