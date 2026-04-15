import { listWorkspaces, loadWorkspaceForts } from "$lib/play/workspaces.js";

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
  ws.loading = true;
  try {
    ws.forts = await loadWorkspaceForts(workspaceId);
  } finally {
    ws.loading = false;
  }
}

/**
 * Clear workspace state (on sign out).
 */
export function clearWorkspaces() {
  ws.workspaces = [];
  ws.active = null;
  ws.forts = [];
  ws.loading = false;
}
