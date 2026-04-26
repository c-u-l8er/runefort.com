import { generateFortFromManifest, generateBuildCorridor, generateTestRoom, generateFactoryControlRoom, DEMO_MANIFESTS } from "$lib/fortGenerator.js";
import { getPipelineData } from "$lib/stores/assembly.svelte.js";
import { getFactoryState } from "$lib/stores/factory.svelte.js";
import { trackNavigation } from "$lib/play/session-learning.js";
import { applyPositionOverrides, savePosition } from "$lib/play/positionStorage.js";

/** The fort id used to key localStorage position overrides for a given zoom. */
function positionScope() {
  if (fort.zoomLevel === 0) return "district";
  if (fort.activeRoomId) return `${fort.activeFortId}:${fort.activeRoomId}`;
  if (fort.activeNodeId) return `${fort.activeFortId}:${fort.activeNodeId}`;
  return fort.activeFortId || "_root";
}

/**
 * Registry of imported forts (repo imports, etc.) that persist across zoom levels.
 * Keyed by fort ID (e.g. "owner/repo").
 * @type {Map<string, { nodes: any[], edges: any[], manifest: any, name: string, color: string, rune: string }>}
 */
const _importedForts = new Map();

/**
 * Registry of the ACTIVE workspace's saved forts, scoped to the current
 * workspace. Cleared whenever the workspace changes so Demo / other workspaces
 * never see them. zoomIntoFort consults this BEFORE `_importedForts` /
 * DEMO_MANIFESTS, which keeps workspace fort IDs isolated from the ecosystem.
 * @type {Map<string, { nodes: any[], edges: any[], manifest: any, name: string, color: string, rune: string }>}
 */
const _workspaceForts = new Map();

/**
 * Reset the workspace-scoped fort cache. Called by workspace.svelte.js on
 * every switch (including the switch to Demo) so stale forts don't leak.
 */
export function clearWorkspaceForts() {
  _workspaceForts.clear();
}

/**
 * @typedef {Object} FortState
 * @property {number} zoomLevel - 0-4
 * @property {string} activeFortId - which fort we're zoomed into
 * @property {string | null} activeRoomId - which room we're viewing (L2+)
 * @property {string | null} activeNodeId - which node we're inspecting (L3+)
 * @property {string | null} activeBuildId - which build tile we're viewing tests for (L3 assembly)
 * @property {any[]} nodes
 * @property {any[]} edges
 * @property {object | null} manifest - current PULSE manifest
 * @property {string | null} savedFortId - database ID if saved
 * @property {string} fortName
 * @property {boolean} dirty - unsaved changes
 */

// Split reactive state: metadata stays deeply reactive ($state), but `nodes`
// and `edges` are $state.raw per Svelte Flow's requirement. Passing a deeply
// reactive array to <SvelteFlow> breaks its ResizeObserver pipeline — the
// library clones nodes via structuredClone which throws on Svelte proxies, so
// handleBounds never populate and edges never render. See initial-store.svelte.js
// `warnIfDeeplyReactive` in @xyflow/svelte.
//
// Callers that mutated `fort.nodes[i].data.state = ...` must now reassign with
// a fresh array (`fort.nodes = fort.nodes.map(...)`) — otherwise reactivity
// doesn't fire and Svelte Flow doesn't see the change.
let _fortMeta = $state({
  zoomLevel: 0,
  activeFortId: "",
  activeRoomId: null,
  activeNodeId: null,
  activeBuildId: null,
  manifest: null,
  savedFortId: null,
  fortName: "Untitled Fort",
  dirty: false,
});
let _fortNodes = $state.raw(/** @type {any[]} */ ([]));
let _fortEdges = $state.raw(/** @type {any[]} */ ([]));

const fort = {
  get zoomLevel() { return _fortMeta.zoomLevel; },
  set zoomLevel(v) { _fortMeta.zoomLevel = v; },
  get activeFortId() { return _fortMeta.activeFortId; },
  set activeFortId(v) { _fortMeta.activeFortId = v; },
  get activeRoomId() { return _fortMeta.activeRoomId; },
  set activeRoomId(v) { _fortMeta.activeRoomId = v; },
  get activeNodeId() { return _fortMeta.activeNodeId; },
  set activeNodeId(v) { _fortMeta.activeNodeId = v; },
  get activeBuildId() { return _fortMeta.activeBuildId; },
  set activeBuildId(v) { _fortMeta.activeBuildId = v; },
  get manifest() { return _fortMeta.manifest; },
  set manifest(v) { _fortMeta.manifest = v; },
  get savedFortId() { return _fortMeta.savedFortId; },
  set savedFortId(v) { _fortMeta.savedFortId = v; },
  get fortName() { return _fortMeta.fortName; },
  set fortName(v) { _fortMeta.fortName = v; },
  get dirty() { return _fortMeta.dirty; },
  set dirty(v) { _fortMeta.dirty = v; },
  get nodes() { return _fortNodes; },
  set nodes(v) { _fortNodes = v; },
  get edges() { return _fortEdges; },
  set edges(v) { _fortEdges = v; },
};

export function getFort() {
  return fort;
}

/**
 * Build an L0 District view for the active workspace out of its saved forts.
 * Each row in `forts` becomes a fort node on the district, and its full layout
 * is registered in `_importedForts` so a later `zoomIntoFort` can unpack it
 * without another Supabase round-trip.
 *
 * Called from workspace.svelte.js (initial switch + refresh) and from
 * zoomOut / setZoomLevel when the user zooms back to L0 inside a workspace.
 *
 * @param {Array<any>} forts rune.forts rows (must include .id, .name, .loop_id,
 *   and .layout with .nodes/.edges — `select("*")` returns this shape).
 */
export function loadWorkspaceDistrict(forts) {
  /** @type {any[]} */
  const nodes = [];
  /** @type {any[]} */
  const edges = [];
  const list = Array.isArray(forts) ? forts : [];

  // Rebuild the workspace-scope registry from scratch — callers have already
  // swapped workspaces, so `ws.forts` is authoritative for this view.
  _workspaceForts.clear();
  list.forEach((f, idx) => {
    const importKey = f.id || f.loop_id;
    const h = _hash(importKey);
    const rune = _FUTHARK[h % _FUTHARK.length];
    const color = _COLORS[h % _COLORS.length];
    // Register the fort's full layout so clicking its district node can
    // zoom in without hitting Supabase again. Scoped to the active workspace.
    if (f.layout?.nodes) {
      _workspaceForts.set(importKey, {
        nodes: f.layout.nodes,
        edges: f.layout.edges ?? [],
        manifest: null,
        name: f.name ?? f.loop_id ?? "Untitled",
        rune,
        color,
      });
    }
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    nodes.push({
      id: `imported-${importKey}`,
      type: "fort",
      position: { x: col * 220 + 40, y: row * 180 + 40 },
      data: {
        label: f.name ?? f.loop_id ?? "Untitled",
        rune,
        role: f.loop_id ?? "Blueprint",
        color,
      },
    });
  });

  fort.zoomLevel = 0;
  fort.activeFortId = "";
  fort.activeRoomId = null;
  fort.activeNodeId = null;
  fort.activeBuildId = null;
  fort.nodes = nodes;
  fort.edges = edges;
  fort.manifest = null;
  fort.savedFortId = null;
  fort.fortName = list.length === 1 ? (list[0].name ?? "Workspace") : "Workspace district";
  fort.dirty = false;
}

/**
 * Clear the canvas to a blank state for an intentionally-empty workspace.
 * Distinct from loadDemoDistrict — which shows the ecosystem district —
 * because a user who picked the "Empty" template shouldn't see ecosystem
 * content on their own workspace. Paired with the EmptyWorkspaceHint overlay.
 */
export function loadEmptyWorkspacePlaceholder() {
  fort.zoomLevel = 0;
  fort.activeFortId = "";
  fort.activeRoomId = null;
  fort.activeNodeId = null;
  fort.activeBuildId = null;
  fort.nodes = [];
  fort.edges = [];
  fort.manifest = null;
  fort.savedFortId = null;
  fort.fortName = "Empty workspace";
  fort.dirty = false;
}

/** Load the demo district (L0 with all ecosystem forts + imported forts) */
export function loadDemoDistrict() {
  const district = generateFortFromManifest("district", null);

  // Append imported forts to the district as additional fort nodes
  if (_importedForts.size > 0) {
    const baseY = Math.max(...district.nodes.map((n) => n.position.y)) + 100;
    let idx = 0;
    for (const [id, imp] of _importedForts) {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      district.nodes.push({
        id: `imported-${id}`,
        type: "fort",
        position: { x: col * 220 + 20, y: baseY + row * 180 },
        data: {
          label: imp.name,
          rune: imp.rune,
          role: "Imported",
          color: imp.color,
        },
      });
      idx++;
    }
  }

  fort.zoomLevel = 0;
  fort.activeFortId = "";
  fort.activeRoomId = null;
  fort.activeNodeId = null;
  applyPositionOverrides(district.nodes, positionScope(), 0);
  fort.nodes = district.nodes;
  fort.edges = district.edges;
  fort.manifest = null;
  fort.savedFortId = null;
  fort.fortName = "RuneFort Ecosystem";
  fort.dirty = false;
}

/** Zoom into a specific fort (L1 campus view) */
export function zoomIntoFort(fortId) {
  // District node IDs are prefixed with "imported-" regardless of whether
  // they come from the workspace registry or the global imported-forts map.
  const importKey = fortId.replace(/^imported-/, "");

  // Workspace-scoped forts take priority so a saved-fort ID that happens to
  // clash with an imported repo name or DEMO_MANIFEST key always resolves
  // inside the active workspace.
  const wsFort = _workspaceForts.get(importKey);
  if (wsFort) {
    fort.zoomLevel = 1;
    fort.activeFortId = fortId;
    fort.activeRoomId = null;
    fort.activeNodeId = null;
    applyPositionOverrides(wsFort.nodes, positionScope(), 1);
    fort.nodes = wsFort.nodes;
    fort.edges = wsFort.edges;
    fort.manifest = wsFort.manifest;
    fort.fortName = wsFort.name;
    fort.dirty = true;
    return;
  }

  const imported = _importedForts.get(importKey);
  if (imported) {
    fort.zoomLevel = 1;
    fort.activeFortId = fortId;
    fort.activeRoomId = null;
    fort.activeNodeId = null;
    applyPositionOverrides(imported.nodes, positionScope(), 1);
    fort.nodes = imported.nodes;
    fort.edges = imported.edges;
    fort.manifest = imported.manifest;
    fort.fortName = imported.name;
    fort.dirty = true;
    return;
  }

  const manifest = DEMO_MANIFESTS[fortId];
  if (!manifest) return;
  const campus = generateFortFromManifest("campus", manifest);
  fort.zoomLevel = 1;
  fort.activeFortId = fortId;
  fort.activeRoomId = null;
  fort.activeNodeId = null;
  applyPositionOverrides(campus.nodes, positionScope(), 1);
  fort.nodes = campus.nodes;
  fort.edges = campus.edges;
  fort.manifest = manifest;
  fort.dirty = true;
  trackNavigation(fortId, 1);
}

/** Zoom into a room (L2 wing view) */
export function zoomIntoRoom(roomId) {
  const wing = generateFortFromManifest("wing", fort.manifest, roomId);
  fort.zoomLevel = 2;
  fort.activeRoomId = roomId;
  fort.activeNodeId = null;
  applyPositionOverrides(wing.nodes, positionScope(), 2);
  fort.nodes = wing.nodes;
  fort.edges = wing.edges;
  fort.dirty = true;
  trackNavigation(fort.activeFortId, 2, roomId);
}

/** Zoom into a node (L3 room detail) */
export function zoomIntoNode(roomId) {
  const room = generateFortFromManifest("room", fort.manifest, roomId);
  fort.zoomLevel = 3;
  fort.activeNodeId = roomId;
  applyPositionOverrides(room.nodes, positionScope(), 3);
  fort.nodes = room.nodes;
  fort.edges = room.edges;
  fort.dirty = true;
  trackNavigation(fort.activeFortId, 3, roomId);
}

/** Zoom into rune detail (L4) */
export function zoomIntoRune(nodeId) {
  const rune = generateFortFromManifest("rune", fort.manifest, nodeId);
  fort.zoomLevel = 4;
  applyPositionOverrides(rune.nodes, positionScope(), 4);
  fort.nodes = rune.nodes;
  fort.edges = rune.edges;
  fort.dirty = true;
}

/** Zoom into factory control room (L2 factory orchestration view) */
export function zoomIntoFactoryControl(fortId) {
  const factoryState = getFactoryState();
  const room = generateFactoryControlRoom(factoryState);
  fort.zoomLevel = 2;
  fort.activeRoomId = `factory-${fortId}`;
  fort.activeNodeId = null;
  fort.activeBuildId = null;
  applyPositionOverrides(room.nodes, positionScope(), 2);
  fort.nodes = room.nodes;
  fort.edges = room.edges;
  fort.dirty = true;
  trackNavigation(fortId, 2, "factory-control");
}

/** Zoom into build corridor for a fort (L2 assembly view) */
export function zoomIntoBuildCorridor(fortId) {
  const pipeline = getPipelineData(fortId);
  if (!pipeline || !pipeline.builds.length) return;
  const corridor = generateBuildCorridor(pipeline.builds, fortId);
  fort.zoomLevel = 2;
  fort.activeRoomId = `corridor-${fortId}`;
  fort.activeNodeId = null;
  fort.activeBuildId = null;
  applyPositionOverrides(corridor.nodes, positionScope(), 2);
  fort.nodes = corridor.nodes;
  fort.edges = corridor.edges;
  fort.dirty = true;
}

/** Zoom into a build's test room (L3 assembly view) */
export function zoomIntoBuild(buildId, fortId) {
  const pipeline = getPipelineData(fortId || fort.activeFortId);
  if (!pipeline) return;
  const build = pipeline.builds.find((b) => b.id === buildId);
  if (!build) return;
  const room = generateTestRoom(build);
  fort.zoomLevel = 3;
  fort.activeNodeId = buildId;
  fort.activeBuildId = buildId;
  applyPositionOverrides(room.nodes, positionScope(), 3);
  fort.nodes = room.nodes;
  fort.edges = room.edges;
  fort.dirty = true;
}

/**
 * Back out to L0, but pick the right district for the context: the active
 * workspace's saved forts when signed into a workspace, otherwise the
 * ecosystem Demo district. Dynamic import avoids a cyclic static import
 * between fort ↔ workspace stores.
 */
async function loadContextualDistrict() {
  try {
    const { getWorkspaceState } = await import("$lib/stores/workspace.svelte.js");
    const ws = getWorkspaceState();
    if (ws.active) {
      if (ws.forts.length > 0) {
        loadWorkspaceDistrict(ws.forts);
      } else {
        loadEmptyWorkspacePlaceholder();
      }
      return;
    }
  } catch {
    // fall through to demo
  }
  loadDemoDistrict();
}

/** Go back one zoom level */
export function zoomOut() {
  if (fort.zoomLevel === 0) return;
  if (fort.zoomLevel === 1) {
    loadContextualDistrict();
  } else if (fort.zoomLevel === 2) {
    zoomIntoFort(fort.activeFortId);
  } else if (fort.zoomLevel === 3) {
    if (fort.activeBuildId) {
      // Return from test room to build corridor
      zoomIntoBuildCorridor(fort.activeFortId);
    } else {
      zoomIntoRoom(fort.activeRoomId);
    }
  } else if (fort.zoomLevel === 4) {
    zoomIntoNode(fort.activeRoomId);
  }
}

/** Set zoom level directly */
export function setZoomLevel(level) {
  if (level === 0) loadContextualDistrict();
  else if (level === 1 && fort.activeFortId) zoomIntoFort(fort.activeFortId);
  else if (level === 2 && fort.activeRoomId) zoomIntoRoom(fort.activeRoomId);
  else if (level === 3 && fort.activeNodeId) zoomIntoNode(fort.activeNodeId);
}

/** Load a saved fort layout from the database */
export function loadSavedFort(saved) {
  fort.zoomLevel = saved.zoom_level ?? 1;
  fort.activeFortId = saved.loop_id;
  fort.nodes = saved.layout.nodes;
  fort.edges = saved.layout.edges;
  fort.manifest = null;
  fort.savedFortId = saved.id;
  fort.fortName = saved.name;
  fort.dirty = false;
}

/** Mark fort as saved */
export function markSaved(id) {
  fort.savedFortId = id;
  fort.dirty = false;
}

export function setFortName(name) {
  fort.fortName = name;
  fort.dirty = true;
}

/** Deterministic hash for rune assignment */
function _hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const _FUTHARK = ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ"];
const _COLORS = ["#e8a84c","#6ac48c","#5b6a8a","#c4956a","#8a9a9e","#e85a5a"];

/** Load an imported fort (from repo import or external source) */
export function loadImportedFort(nodes, edges, name, manifest = null) {
  const h = _hash(name);
  _importedForts.set(name, {
    nodes,
    edges,
    manifest,
    name,
    rune: _FUTHARK[h % _FUTHARK.length],
    color: _COLORS[h % _COLORS.length],
  });

  fort.zoomLevel = 1;
  fort.activeFortId = `imported-${name}`;
  fort.activeRoomId = null;
  fort.activeNodeId = null;
  applyPositionOverrides(nodes, positionScope(), 1);
  fort.nodes = nodes;
  fort.edges = edges;
  fort.manifest = manifest;
  fort.savedFortId = null;
  fort.fortName = name;
  fort.dirty = true;
}

/** Get count of imported forts */
export function getImportedFortCount() {
  return _importedForts.size;
}

/**
 * Persist a user-dragged position. Updates the reactive nodes array (which is
 * $state.raw, so we reassign with a fresh array) and writes the new position
 * to localStorage keyed by (fort scope, zoom level). Also marks the node
 * `_pinned` so the next lattice re-layout leaves it where the user put it.
 *
 * @param {string} nodeId
 * @param {{ x:number, y:number }} pos
 */
export function setNodePosition(nodeId, pos) {
  const next = fort.nodes.map((n) =>
    n.id === nodeId
      ? { ...n, position: { x: pos.x, y: pos.y }, data: { ...(n.data || {}), _pinned: true } }
      : n
  );
  fort.nodes = next;
  savePosition(positionScope(), fort.zoomLevel, nodeId, pos);
  fort.dirty = true;
}
