// Single pipeline for every way a manifest enters the editor: template
// picker, paste-JSON modal, drag-dropped .pulse.json file. Delegates layout
// generation to generateFortFromManifest and persistence to saveFort, so
// each entry point is a thin adapter.

import { generateFortFromManifest } from "$lib/fortGenerator.js";
import { saveFort } from "$lib/persistence.js";
import { getAuth, openAuthModal } from "$lib/stores/auth.svelte.js";
import { getWorkspaceState, switchWorkspace } from "$lib/stores/workspace.svelte.js";
import { loadImportedFort } from "$lib/stores/fort.svelte.js";
import { setPendingAction } from "$lib/stores/pendingAction.svelte.js";
import { toastSuccess, toastInfo, toastError } from "$lib/stores/toast.svelte.js";

/**
 * Verify a raw input is usable by generateFortFromManifest.
 * Intentionally loose: the generator only needs loop_id + phases[].id/kind,
 * so we don't gate on full PULSE v0.1 fields the user may omit in a paste.
 * @param {any} raw
 * @returns {{ ok: boolean, manifest: any, errors: string[] }}
 */
export function normalizeManifest(raw) {
  const errors = [];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    errors.push("manifest must be a JSON object");
    return { ok: false, manifest: raw, errors };
  }
  if (!raw.loop_id || typeof raw.loop_id !== "string") {
    errors.push("manifest.loop_id is required");
  }
  if (!Array.isArray(raw.phases) || raw.phases.length === 0) {
    errors.push("manifest.phases must be a non-empty array");
  } else {
    raw.phases.forEach((p, i) => {
      if (!p || typeof p !== "object") {
        errors.push(`phases[${i}] must be an object`);
        return;
      }
      if (!p.id) errors.push(`phases[${i}].id is required`);
      if (!p.kind) errors.push(`phases[${i}].kind is required`);
    });
  }
  return { ok: errors.length === 0, manifest: raw, errors };
}

/**
 * Add a manifest as a new fort in the current context.
 *
 * Routing:
 *   - signed in + active workspace → persist via saveFort, refresh switchWorkspace
 *   - signed in + Demo (no active workspace) → local preview via loadImportedFort
 *   - signed out → stash in pendingAction, prompt sign-in
 *
 * @param {any} rawManifest
 * @param {{ source?: string }} [opts]
 * @returns {Promise<{ ok: boolean, fortId?: string, reason?: string }>}
 */
export async function addManifestToActiveWorkspace(rawManifest, opts = {}) {
  const source = opts.source ?? "import";
  const { ok, manifest, errors } = normalizeManifest(rawManifest);
  if (!ok) {
    toastError(`Invalid manifest — ${errors[0]}`);
    return { ok: false, reason: errors.join("; ") };
  }

  const { nodes, edges } = generateFortFromManifest("campus", manifest, manifest.loop_id);
  const auth = getAuth();
  const ws = getWorkspaceState();

  if (!auth?.user) {
    setPendingAction({ type: "add_manifest", manifest, source });
    openAuthModal();
    toastInfo("sign in to save this manifest to your workspace");
    return { ok: false, reason: "unauthenticated" };
  }

  if (!ws.active) {
    // Signed in but viewing Demo — preview in the local imported-forts registry
    // so the user sees something immediately. Same path repo-import uses.
    loadImportedFort(nodes, edges, manifest.loop_id, manifest);
    toastInfo(`previewing ${manifest.loop_id} — switch to a workspace to save`);
    return { ok: true };
  }

  try {
    const { id } = await saveFort({
      workspace_id: ws.active.id,
      loop_id: manifest.loop_id,
      name: manifest.label ?? manifest.loop_id,
      layout: { nodes, edges },
      overlays: {},
      zoom_level: 1,
    });
    // Refresh the workspace — my prior fix makes switchWorkspace load the
    // most-recent fort, which will be the one we just inserted.
    await switchWorkspace(ws.active.id);
    toastSuccess(`added ${manifest.loop_id}`);
    return { ok: true, fortId: id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    toastError(`save failed — ${msg}`);
    return { ok: false, reason: msg };
  }
}
