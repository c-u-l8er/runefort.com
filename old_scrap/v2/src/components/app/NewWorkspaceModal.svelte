<script>
  import { WORKSPACE_TEMPLATES } from "$lib/templates/workspaceTemplates.js";
  import { createAndSelectWorkspace } from "$lib/stores/workspace.svelte.js";
  import { portal } from "$lib/actions/portal.js";

  /**
   * @type {{ open: boolean, onclose: () => void }}
   */
  let { open, onclose } = $props();

  let name = $state("");
  let selectedId = $state("empty");
  let creating = $state(false);
  let error = $state("");

  const groups = /** @type {const} */ ([
    { key: "empty", label: "Start blank" },
    { key: "quickstart", label: "Quickstart" },
    { key: "ecosystem", label: "Ecosystem" },
  ]);

  const byGroup = $derived.by(() => {
    /** @type {Record<string, typeof WORKSPACE_TEMPLATES>} */
    const g = { empty: [], quickstart: [], ecosystem: [] };
    for (const t of WORKSPACE_TEMPLATES) g[t.group].push(t);
    return g;
  });

  const selected = $derived(
    WORKSPACE_TEMPLATES.find((t) => t.id === selectedId) ?? WORKSPACE_TEMPLATES[0],
  );

  function reset() {
    name = "";
    selectedId = "empty";
    creating = false;
    error = "";
  }

  function handleClose() {
    if (creating) return;
    reset();
    onclose();
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      error = "name required";
      return;
    }
    creating = true;
    error = "";
    try {
      await createAndSelectWorkspace(trimmed, { template: selected });
      reset();
      onclose();
    } catch (/** @type {any} */ err) {
      error = err?.message || "failed to create workspace";
    } finally {
      creating = false;
    }
  }

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (!open) return;
    if (e.key === "Escape") handleClose();
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCreate();
  }
</script>

<svelte:window onkeydown={onKey} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <!-- Teleport to body so backdrop-filter on toolbar ancestor doesn't clip fixed positioning. -->
  <div class="backdrop" use:portal onclick={handleClose}>
    <div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <button class="close" onclick={handleClose} aria-label="Close">×</button>

      <header>
        <div class="rune" style:color={selected?.color ?? "#e8a84c"}>{selected?.rune ?? "ᚢ"}</div>
        <div>
          <h3>New workspace</h3>
          <p class="sub">Start from a template or a blank canvas.</p>
        </div>
      </header>

      <label class="field">
        <span class="field-label">WORKSPACE NAME</span>
        <input
          type="text"
          placeholder="Dark Factory Prod"
          bind:value={name}
          autofocus
          disabled={creating}
        />
      </label>

      <div class="templates">
        {#each groups as g (g.key)}
          {#if byGroup[g.key]?.length}
            <div class="group-label">{g.label}</div>
            <div class="grid">
              {#each byGroup[g.key] as tpl (tpl.id)}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <button
                  type="button"
                  class="card"
                  class:active={selectedId === tpl.id}
                  onclick={() => { selectedId = tpl.id; }}
                  disabled={creating}
                >
                  <span class="card-rune" style:color={tpl.color}>{tpl.rune}</span>
                  <span class="card-name">{tpl.name}</span>
                  <span class="card-desc">{tpl.description}</span>
                </button>
              {/each}
            </div>
          {/if}
        {/each}
      </div>

      {#if error}<div class="error">{error}</div>{/if}

      <footer>
        <button class="btn secondary" onclick={handleClose} disabled={creating}>Cancel</button>
        <button class="btn primary" onclick={handleCreate} disabled={creating || !name.trim()}>
          {creating ? "Creating…" : "Create workspace"}
        </button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(5, 5, 8, 0.72);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal {
    width: min(640px, 94vw);
    max-height: 88vh;
    overflow-y: auto;
    padding: 1.6rem 1.8rem 1.4rem;
    background: #0e0f14;
    border: 1px solid rgba(232, 168, 76, 0.22);
    border-radius: 10px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7);
    position: relative;
  }
  .close {
    position: absolute;
    top: 0.6rem;
    right: 0.8rem;
    background: transparent;
    border: none;
    color: #7a7770;
    font-size: 1.4rem;
    cursor: pointer;
    line-height: 1;
  }
  .close:hover { color: #e4e2dc; }
  header {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    margin-bottom: 1.2rem;
  }
  .rune {
    font-size: 2rem;
    line-height: 1;
  }
  h3 {
    font-family: "Cinzel", serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: #e4e2dc;
    letter-spacing: 0.06em;
    margin: 0;
  }
  .sub {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
    margin: 0.2rem 0 0;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    margin-bottom: 1.1rem;
  }
  .field-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    font-weight: 600;
    color: #7a7770;
    letter-spacing: 0.08em;
  }
  input[type="text"] {
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 0.55rem 0.7rem;
    color: #e4e2dc;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.7rem;
    outline: none;
    transition: border-color 0.2s;
  }
  input[type="text"]:focus {
    border-color: rgba(232, 168, 76, 0.45);
  }
  input[type="text"]::placeholder { color: #44423d; }
  .group-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.52rem;
    font-weight: 600;
    color: #7a7770;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin: 0.6rem 0 0.4rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    padding: 0.6rem 0.7rem;
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    transition: all 0.18s;
  }
  .card:hover:not(:disabled) {
    border-color: rgba(232, 168, 76, 0.35);
    background: #181924;
  }
  .card.active {
    border-color: rgba(232, 168, 76, 0.55);
    background: rgba(232, 168, 76, 0.08);
  }
  .card:disabled { opacity: 0.5; cursor: not-allowed; }
  .card-rune {
    font-size: 1.2rem;
    line-height: 1;
  }
  .card-name {
    font-family: "Cinzel", serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: #e4e2dc;
  }
  .card-desc {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    color: #7a7770;
    line-height: 1.4;
  }
  .error {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.58rem;
    color: #ff6b6b;
    padding: 0.35rem 0.6rem;
    background: rgba(232, 90, 90, 0.1);
    border-radius: 4px;
    margin-bottom: 0.8rem;
  }
  footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.8rem;
  }
  .btn {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    font-weight: 600;
    padding: 0.5rem 0.9rem;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.04em;
  }
  .btn.primary {
    background: #e8a84c;
    color: #09090d;
    border: none;
  }
  .btn.primary:hover:not(:disabled) {
    box-shadow: 0 4px 18px rgba(232, 168, 76, 0.4);
  }
  .btn.secondary {
    background: transparent;
    color: #7a7770;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .btn.secondary:hover:not(:disabled) {
    color: #e4e2dc;
    border-color: rgba(232, 168, 76, 0.35);
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
