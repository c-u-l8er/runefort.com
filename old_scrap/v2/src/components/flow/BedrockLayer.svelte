<script>
  // OpenSentience bedrock (spec §10.6). OpenSentience is NOT a fort — it is
  // the theoretical substrate beneath the district: 10 protocols (OS-001
  // through OS-010) that every fort is built on. We render the substrate as
  // a CSS band pinned to the bottom of the canvas with a row of badges. The
  // band is positioned inside the `.canvas-area` stacking context, behind
  // the SvelteFlow nodes (z-index 1), so pan/zoom doesn't move it.
  //
  // Clicking a badge opens a minimal detail panel that names the protocol.
  // No LLM call, no network fetch — the protocol list is a static catalogue.

  /** @type {{ visible?: boolean }} */
  let { visible = true } = $props();

  const PROTOCOLS = [
    { id: "OS-001", name: "Foundational architecture" },
    { id: "OS-002", name: "Identity & workspace" },
    { id: "OS-003", name: "Entitlement & billing" },
    { id: "OS-004", name: "Audit trail" },
    { id: "OS-005", name: "[&] capability manifest" },
    { id: "OS-006", name: "Agent harness" },
    { id: "OS-007", name: "Spec-driven development" },
    { id: "OS-008", name: "Quality gates" },
    { id: "OS-009", name: "PRISM benchmark" },
    { id: "OS-010", name: "PULSE temporal manifest" },
  ];

  /** @type {string | null} */
  let open = $state(null);

  /** @param {string} id */
  function toggle(id) { open = open === id ? null : id; }
  function close() { open = null; }
</script>

{#if visible}
  <aside class="bedrock" aria-label="OpenSentience bedrock protocols">
    <div class="bedrock-label">
      <span class="label-text">OpenSentience</span>
      <span class="label-sub">bedrock · not a fort</span>
    </div>
    <div class="badge-row" role="toolbar" aria-label="OpenSentience protocols">
      {#each PROTOCOLS as p (p.id)}
        <button
          type="button"
          class="badge"
          class:active={open === p.id}
          aria-pressed={open === p.id}
          aria-label={`${p.id}: ${p.name}`}
          onclick={() => toggle(p.id)}
        >{p.id}</button>
      {/each}
    </div>
    {#if open}
      {@const prot = PROTOCOLS.find((p) => p.id === open)}
      {#if prot}
        <div class="detail" role="dialog" aria-label={`Protocol ${prot.id}`}>
          <span class="detail-id">{prot.id}</span>
          <span class="detail-name">{prot.name}</span>
          <button type="button" class="detail-close" aria-label="Close" onclick={close}>×</button>
        </div>
      {/if}
    {/if}
  </aside>
{/if}

<style>
  .bedrock {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 0.5rem 1rem 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    background: linear-gradient(
      to bottom,
      rgba(14, 15, 20, 0) 0%,
      rgba(14, 15, 20, 0.55) 50%,
      rgba(14, 15, 20, 0.92) 100%
    );
    border-top: 1px solid rgba(232, 168, 76, 0.16);
    pointer-events: none;
    z-index: 1;
  }
  .bedrock-label {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    pointer-events: none;
  }
  .label-text {
    font-family: "Cinzel", serif;
    font-size: 0.8rem;
    letter-spacing: 0.08em;
    color: #c4956a;
  }
  .label-sub {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    color: #44423d;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .badge-row {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
    pointer-events: auto;
  }
  .badge {
    background: rgba(14, 15, 20, 0.88);
    border: 1px solid rgba(232, 168, 76, 0.22);
    border-radius: 3px;
    padding: 0.2rem 0.45rem;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #c4956a;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: background 180ms ease, border-color 180ms ease, color 180ms ease;
  }
  .badge:hover,
  .badge:focus-visible {
    background: rgba(232, 168, 76, 0.1);
    border-color: rgba(232, 168, 76, 0.5);
    color: #e4e2dc;
    outline: none;
  }
  .badge:focus-visible {
    box-shadow: 0 0 0 2px rgba(232, 168, 76, 0.35);
  }
  .badge.active {
    background: rgba(232, 168, 76, 0.15);
    border-color: rgba(232, 168, 76, 0.6);
    color: #e4e2dc;
  }
  .detail {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.55rem 0.25rem 0.7rem;
    background: rgba(14, 15, 20, 0.96);
    border: 1px solid rgba(232, 168, 76, 0.4);
    border-radius: 4px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #e4e2dc;
  }
  .detail-id {
    color: #e8a84c;
    letter-spacing: 0.06em;
  }
  .detail-name {
    color: #c4c1ba;
  }
  .detail-close {
    background: transparent;
    border: none;
    color: #7a7770;
    font-size: 0.95rem;
    cursor: pointer;
    padding: 0 0.25rem;
    line-height: 1;
  }
  .detail-close:hover,
  .detail-close:focus-visible {
    color: #e4e2dc;
    outline: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .badge { transition: none; }
  }
</style>
