<script>
  import { WORKSPACE_TEMPLATES } from "$lib/templates/workspaceTemplates.js";
  import { normalizeManifest, addManifestToActiveWorkspace } from "$lib/play/manifestImport.js";
  import { toastError } from "$lib/stores/toast.svelte.js";

  /**
   * @type {{ open: boolean, initialTab?: "template"|"paste"|"upload", onclose: () => void }}
   */
  let { open, initialTab = "template", onclose } = $props();

  /** @type {"template"|"paste"|"upload"} */
  let tab = $state("template");
  let selectedId = $state("starter");
  let pasted = $state("");
  let fileName = $state("");
  let uploadedText = $state("");
  let errors = $state(/** @type {string[]} */ ([]));
  let busy = $state(false);

  $effect(() => {
    // Re-sync when opened so the right tab is active.
    if (open) {
      tab = initialTab;
      errors = [];
    }
  });

  // Exclude Empty from the manifest-picker — there's no such thing as an
  // "empty manifest" to drop on the canvas.
  const pickable = WORKSPACE_TEMPLATES.filter((t) => t.id !== "empty");

  function reset() {
    pasted = "";
    fileName = "";
    uploadedText = "";
    errors = [];
    busy = false;
  }

  function handleClose() {
    if (busy) return;
    reset();
    onclose();
  }

  /** @param {Event} e */
  async function handleFile(e) {
    const input = /** @type {HTMLInputElement} */ (e.target);
    const file = input.files?.[0];
    if (!file) return;
    fileName = file.name;
    try {
      uploadedText = await file.text();
      errors = [];
    } catch (err) {
      errors = [`could not read file: ${err instanceof Error ? err.message : String(err)}`];
    }
  }

  async function submit() {
    busy = true;
    errors = [];
    try {
      /** @type {any} */
      let manifest = null;
      if (tab === "template") {
        // Templates are pre-validated — persist the baked seed directly
        // instead of re-normalizing. This keeps the template path resilient
        // to any manifest shape differences across DEMO_MANIFESTS vs starter.
        const tpl = pickable.find((t) => t.id === selectedId);
        if (!tpl) { errors = ["pick a template"]; return; }
        const seed = await tpl.loader();
        if (!seed) { errors = ["template has no manifest"]; return; }
        const { saveFort } = await import("$lib/persistence.js");
        const { getAuth, openAuthModal } = await import("$lib/stores/auth.svelte.js");
        const { getWorkspaceState, switchWorkspace } = await import("$lib/stores/workspace.svelte.js");
        const { setPendingAction } = await import("$lib/stores/pendingAction.svelte.js");
        const { toastSuccess, toastInfo } = await import("$lib/stores/toast.svelte.js");
        const auth = getAuth();
        const ws = getWorkspaceState();
        if (!auth?.user) {
          setPendingAction({ type: "create_workspace", name: seed.name, templateId: tpl.id });
          openAuthModal();
          toastInfo("sign in to save this template");
          reset();
          onclose();
          return;
        }
        if (!ws.active) {
          errors = ["pick a workspace first (switch away from Demo)"];
          return;
        }
        await saveFort({
          workspace_id: ws.active.id,
          loop_id: seed.loop_id,
          name: seed.name,
          layout: seed.layout,
          overlays: {},
          zoom_level: seed.zoom_level ?? 1,
        });
        await switchWorkspace(ws.active.id);
        toastSuccess(`added ${seed.name}`);
        reset();
        onclose();
        return;
      } else if (tab === "paste") {
        if (!pasted.trim()) { errors = ["paste a manifest first"]; return; }
        try { manifest = JSON.parse(pasted); }
        catch (err) { errors = [`invalid JSON: ${err instanceof Error ? err.message : String(err)}`]; return; }
      } else {
        if (!uploadedText) { errors = ["choose a .pulse.json file"]; return; }
        try { manifest = JSON.parse(uploadedText); }
        catch (err) { errors = [`invalid JSON: ${err instanceof Error ? err.message : String(err)}`]; return; }
      }

      const res = normalizeManifest(manifest);
      if (!res.ok) { errors = res.errors; return; }

      const out = await addManifestToActiveWorkspace(manifest, { source: tab });
      if (!out.ok) {
        errors = [out.reason ?? "import failed"];
        return;
      }
      reset();
      onclose();
    } catch (err) {
      toastError(err instanceof Error ? err.message : String(err));
    } finally {
      busy = false;
    }
  }

</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={handleClose}>
    <div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <button class="close" onclick={handleClose} aria-label="Close">×</button>

      <header>
        <div class="rune">ᚲ</div>
        <div>
          <h3>Add manifest</h3>
          <p class="sub">Pick a template, paste a manifest, or upload a .pulse.json.</p>
        </div>
      </header>

      <div class="tabs">
        <button type="button" class:active={tab === "template"} onclick={() => { tab = "template"; errors = []; }}>Template</button>
        <button type="button" class:active={tab === "paste"} onclick={() => { tab = "paste"; errors = []; }}>Paste JSON</button>
        <button type="button" class:active={tab === "upload"} onclick={() => { tab = "upload"; errors = []; }}>Upload file</button>
      </div>

      <div class="body">
        {#if tab === "template"}
          <div class="grid">
            {#each pickable as tpl (tpl.id)}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <button
                type="button"
                class="card"
                class:active={selectedId === tpl.id}
                onclick={() => { selectedId = tpl.id; }}
                disabled={busy}
              >
                <span class="card-rune" style:color={tpl.color}>{tpl.rune}</span>
                <span class="card-name">{tpl.name}</span>
                <span class="card-desc">{tpl.description}</span>
              </button>
            {/each}
          </div>
        {:else if tab === "paste"}
          <label class="field">
            <span class="field-label">PULSE MANIFEST (JSON)</span>
            <textarea
              bind:value={pasted}
              spellcheck="false"
              placeholder={'{\n  "loop_id": "your.loop",\n  "phases": [{"id":"retrieve","kind":"retrieve"}]\n}'}
              disabled={busy}
            ></textarea>
          </label>
        {:else}
          <label class="upload">
            <input type="file" accept="application/json,.json" onchange={handleFile} disabled={busy} />
            <span class="upload-text">
              {fileName ? `📄 ${fileName}` : "Click to choose a .pulse.json file"}
            </span>
          </label>
        {/if}
      </div>

      {#if errors.length > 0}
        <div class="errors">
          {#each errors as e, i (i)}<div class="err">{e}</div>{/each}
        </div>
      {/if}

      <footer>
        <button class="btn secondary" onclick={handleClose} disabled={busy}>Cancel</button>
        <button class="btn primary" onclick={submit} disabled={busy}>
          {busy ? "Adding…" : "Add to workspace"}
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
    width: min(680px, 94vw);
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
    margin-bottom: 1rem;
  }
  .rune { font-size: 2rem; color: #e8a84c; line-height: 1; }
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
  .tabs {
    display: flex;
    gap: 0.3rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    margin-bottom: 1rem;
  }
  .tabs button {
    background: transparent;
    border: none;
    color: #7a7770;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.58rem;
    font-weight: 600;
    padding: 0.45rem 0.8rem;
    cursor: pointer;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-bottom: 2px solid transparent;
  }
  .tabs button:hover { color: #e4e2dc; }
  .tabs button.active {
    color: #e8a84c;
    border-bottom-color: #e8a84c;
  }
  .body { min-height: 220px; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 0.5rem;
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
  .card-rune { font-size: 1.2rem; line-height: 1; }
  .card-name {
    font-family: "Cinzel", serif;
    font-size: 0.68rem;
    font-weight: 600;
    color: #e4e2dc;
  }
  .card-desc {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    color: #7a7770;
    line-height: 1.4;
  }
  .field { display: flex; flex-direction: column; gap: 0.3rem; }
  .field-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    font-weight: 600;
    color: #7a7770;
    letter-spacing: 0.08em;
  }
  textarea {
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 0.6rem 0.7rem;
    color: #e4e2dc;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.62rem;
    line-height: 1.5;
    min-height: 220px;
    resize: vertical;
    outline: none;
  }
  textarea:focus { border-color: rgba(232, 168, 76, 0.45); }
  .upload {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.2rem 1rem;
    background: #15161d;
    border: 1px dashed rgba(232, 168, 76, 0.35);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .upload:hover { background: #181924; border-color: rgba(232, 168, 76, 0.6); }
  .upload input { display: none; }
  .upload-text {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    color: #e4e2dc;
  }
  .errors {
    margin-top: 0.8rem;
    padding: 0.5rem 0.7rem;
    background: rgba(232, 90, 90, 0.1);
    border: 1px solid rgba(232, 90, 90, 0.25);
    border-radius: 5px;
  }
  .err {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.58rem;
    color: #ff6b6b;
    line-height: 1.5;
  }
  footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.9rem;
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
