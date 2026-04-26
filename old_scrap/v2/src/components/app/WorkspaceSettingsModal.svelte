<script>
  import { getWorkspaceState, renameActiveWorkspace, deleteWorkspaceAndFallback } from "$lib/stores/workspace.svelte.js";
  import { toastSuccess, toastError } from "$lib/stores/toast.svelte.js";
  import { portal } from "$lib/actions/portal.js";

  /** @type {{ open: boolean, onclose: () => void }} */
  let { open, onclose } = $props();

  const ws = getWorkspaceState();

  let newName = $state("");
  let renaming = $state(false);
  let renameError = $state("");

  let confirmingDelete = $state(false);
  let deleting = $state(false);
  let deleteError = $state("");

  // Reset state every time the modal opens so the fields reflect the current
  // workspace instead of the last one.
  $effect(() => {
    if (open && ws.active) {
      newName = ws.active.name;
      renaming = false;
      renameError = "";
      confirmingDelete = false;
      deleting = false;
      deleteError = "";
    }
  });

  function handleClose() {
    if (renaming || deleting) return;
    onclose();
  }

  async function handleRename() {
    if (!ws.active) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === ws.active.name) {
      renameError = trimmed === ws.active.name ? "that's already the name" : "name required";
      return;
    }
    renaming = true;
    renameError = "";
    try {
      await renameActiveWorkspace(ws.active.id, trimmed);
      toastSuccess("workspace renamed");
      onclose();
    } catch (/** @type {any} */ err) {
      renameError = err?.message || "rename failed";
    } finally {
      renaming = false;
    }
  }

  async function handleDelete() {
    if (!ws.active) return;
    deleting = true;
    deleteError = "";
    try {
      const name = ws.active.name;
      await deleteWorkspaceAndFallback(ws.active.id);
      toastSuccess(`deleted ${name}`);
      onclose();
    } catch (/** @type {any} */ err) {
      deleteError = err?.message || "delete failed";
      toastError(deleteError);
    } finally {
      deleting = false;
    }
  }

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (!open) return;
    if (e.key === "Escape") handleClose();
  }
</script>

<svelte:window onkeydown={onKey} />

{#if open && ws.active}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <!-- Teleport to body so toolbar's backdrop-filter doesn't clip fixed positioning. -->
  <div class="backdrop" use:portal onclick={handleClose}>
    <div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <button class="close" onclick={handleClose} aria-label="Close">×</button>

      <header>
        <div class="rune">⚙</div>
        <div>
          <h3>Workspace settings</h3>
          <p class="sub">{ws.active.name} · slug <code>{ws.active.slug ?? ""}</code></p>
        </div>
      </header>

      <section class="panel">
        <h4>Rename</h4>
        <label class="field">
          <span class="field-label">NAME</span>
          <input
            type="text"
            bind:value={newName}
            disabled={renaming || deleting}
            maxlength="80"
          />
        </label>
        {#if renameError}<div class="err">{renameError}</div>{/if}
        <div class="row-actions">
          <button
            type="button"
            class="btn primary"
            onclick={handleRename}
            disabled={renaming || deleting || !newName.trim() || newName.trim() === ws.active.name}
          >
            {renaming ? "Renaming…" : "Rename"}
          </button>
        </div>
      </section>

      <section class="panel meta">
        <h4>Details</h4>
        <div class="meta-row">
          <span class="key">Workspace ID</span>
          <span class="val code">{ws.active.id}</span>
        </div>
        <div class="meta-row">
          <span class="key">Forts</span>
          <span class="val">{ws.forts.length}</span>
        </div>
      </section>

      <section class="panel danger">
        <h4>Danger zone</h4>
        <p class="danger-desc">
          Deleting a workspace is permanent. All {ws.forts.length} fort{ws.forts.length === 1 ? "" : "s"} inside
          will be removed (CASCADE). Members will lose access.
        </p>

        {#if !confirmingDelete}
          <button
            type="button"
            class="btn danger"
            onclick={() => { confirmingDelete = true; }}
            disabled={renaming || deleting}
          >
            Delete workspace…
          </button>
        {:else}
          <div class="confirm">
            <div class="confirm-text">
              Type <strong>{ws.active.name}</strong> to confirm:
            </div>
            <input
              type="text"
              bind:value={newName}
              placeholder={ws.active.name}
              disabled={deleting}
            />
            {#if deleteError}<div class="err">{deleteError}</div>{/if}
            <div class="row-actions">
              <button
                type="button"
                class="btn secondary"
                onclick={() => { confirmingDelete = false; deleteError = ""; newName = ws.active?.name ?? ""; }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn danger"
                onclick={handleDelete}
                disabled={deleting || newName.trim() !== ws.active.name}
              >
                {deleting ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        {/if}
      </section>
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
    width: min(560px, 94vw);
    max-height: 88vh;
    overflow-y: auto;
    padding: 1.5rem 1.7rem 1.3rem;
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
  }
  .close:hover { color: #e4e2dc; }
  header {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    margin-bottom: 1rem;
  }
  .rune {
    font-size: 1.8rem;
    color: #e8a84c;
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
    font-size: 0.58rem;
    color: #7a7770;
    margin: 0.2rem 0 0;
  }
  .sub code {
    color: #c4956a;
    background: rgba(196, 149, 106, 0.08);
    padding: 0 0.3rem;
    border-radius: 3px;
  }
  .panel {
    padding: 0.9rem 1rem;
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 7px;
    margin-bottom: 0.9rem;
  }
  .panel h4 {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    font-weight: 700;
    color: #e8a84c;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin: 0 0 0.6rem;
  }
  .panel.danger {
    border-color: rgba(232, 90, 90, 0.22);
  }
  .panel.danger h4 {
    color: #e85a5a;
  }
  .danger-desc {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.58rem;
    color: #8a8680;
    line-height: 1.5;
    margin: 0 0 0.7rem;
  }
  .field {
    display: block;
    margin-bottom: 0.4rem;
  }
  .field-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.52rem;
    font-weight: 600;
    color: #7a7770;
    letter-spacing: 0.08em;
    display: block;
    margin-bottom: 0.3rem;
  }
  input[type="text"] {
    width: 100%;
    background: #0e0f14;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 5px;
    padding: 0.5rem 0.65rem;
    color: #e4e2dc;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    outline: none;
    box-sizing: border-box;
  }
  input[type="text"]:focus { border-color: rgba(232, 168, 76, 0.45); }
  .meta-row {
    display: flex;
    justify-content: space-between;
    padding: 0.2rem 0;
  }
  .meta-row .key {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.58rem;
    color: #7a7770;
  }
  .meta-row .val {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.58rem;
    color: #e4e2dc;
  }
  .meta-row .val.code {
    color: #c4956a;
  }
  .row-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }
  .confirm {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }
  .confirm-text {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #e4e2dc;
  }
  .confirm-text strong {
    color: #e85a5a;
    font-weight: 600;
  }
  .err {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #ff6b6b;
    background: rgba(232, 90, 90, 0.1);
    padding: 0.3rem 0.5rem;
    border-radius: 4px;
  }
  .btn {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.58rem;
    font-weight: 600;
    padding: 0.5rem 0.9rem;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.04em;
    border: 1px solid transparent;
  }
  .btn.primary {
    background: #e8a84c;
    color: #09090d;
  }
  .btn.primary:hover:not(:disabled) {
    box-shadow: 0 4px 18px rgba(232, 168, 76, 0.4);
  }
  .btn.secondary {
    background: transparent;
    color: #7a7770;
    border-color: rgba(255, 255, 255, 0.1);
  }
  .btn.secondary:hover:not(:disabled) {
    color: #e4e2dc;
    border-color: rgba(232, 168, 76, 0.35);
  }
  .btn.danger {
    background: transparent;
    color: #e85a5a;
    border-color: rgba(232, 90, 90, 0.35);
  }
  .btn.danger:hover:not(:disabled) {
    background: rgba(232, 90, 90, 0.15);
    color: #ff6b6b;
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
