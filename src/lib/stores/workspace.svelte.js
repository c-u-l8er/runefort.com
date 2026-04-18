import { listWorkspaces, loadWorkspaceForts, createWorkspace as createWorkspaceRpc, renameWorkspace as renameWorkspaceRpc, deleteWorkspace as deleteWorkspaceRpc } from "$lib/play/workspaces.js";
import { loadFort, saveFort } from "$lib/persistence.js";
import { loadDemoDistrict, loadEmptyWorkspacePlaceholder, loadWorkspaceDistrict, clearWorkspaceForts } from "$lib/stores/fort.svelte.js";

/**
 * @typedef {Object} Workspace
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {number} fort_count
 */

/** @type {{ workspaces: Workspace[], active: Workspace | null, forts: any[], loading: boolean }} */
let ws = $state({
  workspaces: [],
  active: null,
  forts: [],
  loading: false,
});

export function getWorkspaceState() {
  return ws;
}

export function getWorkspaces() {
  return ws.workspaces;
}

export function getActiveWorkspace() {
  return ws.active;
}

export function getWorkspaceForts() {
  return ws.forts;
}

export function isWorkspaceLoading() {
  return ws.loading;
}

/**
 * Load the user's workspaces. Called after auth.
 */
export async function initWorkspaces() {
  ws.loading = true;
  try {
    ws.workspaces = await listWorkspaces();
    if (ws.workspaces.length > 0 && !ws.active) {
      await switchWorkspace(ws.workspaces[0].id);
    }
  } finally {
    ws.loading = false;
  }
}

/**
 * Switch to a different workspace, loading its forts.
 * @param {string} workspaceId
 */
export async function switchWorkspace(workspaceId) {
  const workspace = ws.workspaces.find((w) => w.id === workspaceId);
  if (!workspace) return;
  ws.active = workspace;
  // Drop the previous workspace's fort cache before we start loading this
  // workspace's forts — prevents stale clicks from resolving into the old
  // workspace's layout during the async gap.
  clearWorkspaceForts();
  ws.loading = true;
  try {
    ws.forts = await loadWorkspaceForts(workspaceId);
    // Sync the canvas to the new workspace.
    //
    // Each workspace gets its OWN L0 District built from its saved forts —
    // not the ecosystem DEMO_MANIFESTS district. That district shares the
    // `_importedForts` registry, so clicking a fort node on it zooms straight
    // into the saved L1 campus without another Supabase round-trip.
    //
    // For rows persisted without an inline layout (future-proofing; current
    // saveFort always writes layout), we hydrate via loadFort first.
    if (ws.forts.length > 0) {
      const missingLayout = ws.forts.filter((f) => !f.layout?.nodes);
      if (missingLayout.length > 0) {
        await Promise.all(
          missingLayout.map(async (f, idx) => {
            try {
              const full = await loadFort(f.id);
              const original = ws.forts.indexOf(f);
              if (original >= 0) ws.forts[original] = full;
            } catch {
              // leave it in the list; loadWorkspaceDistrict tolerates missing layouts
            }
          }),
        );
      }
      loadWorkspaceDistrict(ws.forts);
    } else {
      // Intentionally-empty workspace. Distinct from the Demo dropdown entry
      // (which keeps ws.active = null and renders the ecosystem district via
      // selectDemoWorkspace → loadDemoDistrict): here the user explicitly
      // created or selected a workspace that happens to have no forts, so we
      // show a blank canvas + a right-click hint overlay instead of ecosystem
      // content that doesn't belong to them.
      loadEmptyWorkspacePlaceholder();
    }
  } finally {
    ws.loading = false;
  }
}

/**
 * Create a new workspace, optionally seed its first fort from a template,
 * refresh the list, and switch into it.
 *
 * @param {string} name
 * @param {{ template?: { id: string, loader: () => Promise<any> } | null }} [opts]
 */
export async function createAndSelectWorkspace(name, opts = {}) {
  ws.loading = true;
  try {
    const newId = await createWorkspaceRpc(name);
    // Seed a starter fort if the template carries a loader. "Empty" resolves
    // to null and skips seeding entirely — switchWorkspace will then render
    // the EmptyWorkspaceHint.
    const tpl = opts?.template;
    if (tpl && typeof tpl.loader === "function") {
      try {
        const seed = await tpl.loader();
        if (seed) {
          await saveFort({
            workspace_id: newId,
            loop_id: seed.loop_id,
            name: seed.name,
            layout: seed.layout,
            overlays: {},
            zoom_level: seed.zoom_level ?? 1,
          });
        }
      } catch (err) {
        // Seeding is best-effort — if the template loader or saveFort fails,
        // the workspace still exists and switchWorkspace will show the empty
        // placeholder. Surface via console for debuggability.
        console.warn("workspace template seed failed:", err);
      }
    }
    ws.workspaces = await listWorkspaces();
    await switchWorkspace(newId);
    return newId;
  } finally {
    ws.loading = false;
  }
}

/**
 * Rename a workspace. Refreshes the list and, if it was active, updates
 * `ws.active.name` in place so the switcher label reflects the new name
 * without a re-switch.
 * @param {string} workspaceId
 * @param {string} name
 */
export async function renameActiveWorkspace(workspaceId, name) {
  await renameWorkspaceRpc(workspaceId, name);
  ws.workspaces = await listWorkspaces();
  if (ws.active && ws.active.id === workspaceId) {
    ws.active = { ...ws.active, name };
  }
}

/**
 * Delete a workspace. If it was the active workspace, falls back to another
 * workspace (first remaining) or to Demo. The Supabase CASCADE wipes member
 * + fort rows in the same transaction.
 * @param {string} workspaceId
 */
export async function deleteWorkspaceAndFallback(workspaceId) {
  await deleteWorkspaceRpc(workspaceId);
  const wasActive = ws.active?.id === workspaceId;
  ws.workspaces = await listWorkspaces();
  if (wasActive) {
    if (ws.workspaces.length > 0) {
      await switchWorkspace(ws.workspaces[0].id);
    } else {
      selectDemoWorkspace();
    }
  }
}

/**
 * Deselect the active workspace and show the built-in demo district on the
 * canvas. Keeps the workspace list intact so the dropdown still works.
 */
export function selectDemoWorkspace() {
  ws.active = null;
  ws.forts = [];
  clearWorkspaceForts();
  loadDemoDistrict();
}

/**
 * Clear workspace state (on sign out).
 */
export function clearWorkspaces() {
  ws.workspaces = [];
  ws.active = null;
  ws.forts = [];
  ws.loading = false;
  clearWorkspaceForts();
}
