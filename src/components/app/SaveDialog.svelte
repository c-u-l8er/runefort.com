<script>
  import { getFort, markSaved, setFortName } from "$lib/stores/fort.svelte.js";
  import { getAuth, openAuthModal } from "$lib/stores/auth.svelte.js";
  import { activeOverlayKeys } from "$lib/stores/overlays.svelte.js";
  import { saveFort, updateFort } from "$lib/persistence.js";
  import { toastSuccess, toastError } from "$lib/stores/toast.svelte.js";

  const fort = getFort();
  const auth = getAuth();

  /** @type {{ open?: boolean, onclose?: () => void }} */
  let { open = false, onclose = () => {} } = $props();
  let saving = $state(false);
  let error = $state("");
  let success = $state("");

  $effect(() => {
    if (open && !auth.user) {
      openAuthModal();
      onclose();
    }
  });

  async function handleSave() {
    saving = true;
    error = "";
    success = "";
    try {
      /** @type {Record<string, boolean>} */
      const overlays = {};
      for (const k of activeOverlayKeys()) overlays[k] = true;

      if (fort.savedFortId) {
        await updateFort(fort.savedFortId, {
          name: fort.fortName,
          layout: { nodes: fort.nodes, edges: fort.edges },
          overlays,
          zoom_level: fort.zoomLevel,
        });
        markSaved(fort.savedFortId);
        success = "Blueprint updated!";
        toastSuccess("blueprint updated");
      } else {
        // Use a default workspace for demo (first workspace from the user)
        const result = await saveFort({
          workspace_id: auth.user.id,
          loop_id: fort.activeFortId || "custom.fort",
          name: fort.fortName,
          layout: { nodes: fort.nodes, edges: fort.edges },
          overlays,
          zoom_level: fort.zoomLevel,
        });
        markSaved(result.id);
        success = "Blueprint saved to the cloud!";
        toastSuccess("blueprint saved — stored in your workspace");
      }
    } catch (err) {
      error = err.message;
      toastError(`save failed — ${err.message}`);
    } finally {
      saving = false;
    }
  }
</script>

{#if open && auth.user}
  <div class="dialog-backdrop" onclick={onclose}>
    <div class="dialog" onclick={(e) => e.stopPropagation()}>
      <button class="dialog-close" onclick={onclose}>×</button>
      <div class="dialog-header">
        <span class="dialog-rune">ᚠ</span>
        <h3>Save Blueprint</h3>
      </div>

      <label class="field">
        <span class="field-label">Fort Name</span>
        <input
          type="text"
          value={fort.fortName}
          oninput={(e) => setFortName(/** @type {HTMLInputElement} */ (e.target).value)}
          placeholder="My Fort"
        />
      </label>

      <div class="meta">
        <div class="meta-row">
          <span class="meta-key">loop</span>
          <span class="meta-val">{fort.activeFortId || "ecosystem"}</span>
        </div>
        <div class="meta-row">
          <span class="meta-key">zoom</span>
          <span class="meta-val">L{fort.zoomLevel}</span>
        </div>
        <div class="meta-row">
          <span class="meta-key">nodes</span>
          <span class="meta-val">{fort.nodes.length}</span>
        </div>
        <div class="meta-row">
          <span class="meta-key">edges</span>
          <span class="meta-val">{fort.edges.length}</span>
        </div>
      </div>

      {#if error}
        <div class="error">{error}</div>
      {/if}
      {#if success}
        <div class="success">{success}</div>
      {/if}

      <button class="save-btn" onclick={handleSave} disabled={saving}>
        {saving ? "Saving..." : fort.savedFortId ? "Update Blueprint" : "Save to Cloud"}
      </button>
    </div>
  </div>
{/if}

<style>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dialog {
    background: #0e0f14;
    border: 1px solid rgba(232, 168, 76, 0.2);
    border-radius: 12px;
    padding: 1.75rem;
    width: 360px;
    max-width: 90vw;
    position: relative;
  }
  .dialog-close {
    position: absolute;
    top: 0.75rem; right: 1rem;
    background: transparent; border: none;
    color: #7a7770; font-size: 1.4rem; cursor: pointer;
    font-family: inherit;
  }
  .dialog-close:hover { color: #e4e2dc; }
  .dialog-header {
    text-align: center;
    margin-bottom: 1.25rem;
  }
  .dialog-rune {
    font-size: 1.6rem;
    color: #e8a84c;
    display: block;
    margin-bottom: 0.25rem;
  }
  .dialog-header h3 {
    font-family: "Cinzel", serif;
    font-size: 1.1rem;
    font-weight: 500;
    color: #e4e2dc;
  }
  .field {
    display: block;
    margin-bottom: 1rem;
  }
  .field-label {
    display: block;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    font-weight: 600;
    color: #8a9a9e;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 0.35rem;
  }
  input {
    width: 100%;
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 0.6rem 0.75rem;
    color: #e4e2dc;
    font-family: "IBM Plex Sans", sans-serif;
    font-size: 0.9rem;
    outline: none;
  }
  input:focus { border-color: rgba(232, 168, 76, 0.4); }
  .meta {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #15161d;
    border-radius: 6px;
  }
  .meta-row {
    display: flex;
    justify-content: space-between;
    padding: 0.15rem 0;
  }
  .meta-key {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
  }
  .meta-val {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #e4e2dc;
    font-weight: 500;
  }
  .error {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #e85a5a;
    margin-bottom: 0.75rem;
    padding: 0.4rem;
    background: rgba(232, 90, 90, 0.08);
    border-radius: 4px;
  }
  .success {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #6ac48c;
    margin-bottom: 0.75rem;
    padding: 0.4rem;
    background: rgba(106, 196, 140, 0.08);
    border-radius: 4px;
  }
  .save-btn {
    width: 100%;
    padding: 0.7rem;
    background: #e8a84c;
    color: #09090d;
    border: none;
    border-radius: 6px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
  }
  .save-btn:hover { box-shadow: 0 4px 16px rgba(232, 168, 76, 0.3); }
  .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
