import { generateFortFromManifest, generateBuildCorridor, generateTestRoom, generateFactoryControlRoom, DEMO_MANIFESTS } from "$lib/fortGenerator.js";
import { getPipelineData } from "$lib/stores/assembly.svelte.js";
import { getFactoryState } from "$lib/stores/factory.svelte.js";
import { trackNavigation } from "$lib/play/session-learning.js";

/**
 * Registry of imported forts (repo imports, etc.) that persist across zoom levels.
 * Keyed by fort ID (e.g. "owner/repo").
 * @type {Map<string, { nodes: any[], edges: any[], manifest: any, name: string, color: string, rune: string }>}
 */
const _importedForts = new Map();

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
  fort.nodes = district.nodes;
  fort.edges = district.edges;
  fort.manifest = null;
  fort.savedFortId = null;
  fort.fortName = "RuneFort Ecosystem";
  fort.dirty = false;
}

/** Zoom into a specific fort (L1 campus view) */
export function zoomIntoFort(fortId) {
  // Check imported forts first (strip "imported-" prefix from district node IDs)
  const importKey = fortId.replace(/^imported-/, "");
  const imported = _importedForts.get(importKey);
  if (imported) {
    fort.zoomLevel = 1;
    fort.activeFortId = fortId;
    fort.activeRoomId = null;
    fort.activeNodeId = null;
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
  fort.nodes = room.nodes;
  fort.edges = room.edges;
  fort.dirty = true;
  trackNavigation(fort.activeFortId, 3, roomId);
}

/** Zoom into rune detail (L4) */
export function zoomIntoRune(nodeId) {
  const rune = generateFortFromManifest("rune", fort.manifest, nodeId);
  fort.zoomLevel = 4;
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
  fort.nodes = room.nodes;
  fort.edges = room.edges;
  fort.dirty = true;
}

/** Go back one zoom level */
export function zoomOut() {
  if (fort.zoomLevel === 0) return;
  if (fort.zoomLevel === 1) {
    loadDemoDistrict();
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
  if (level === 0) loadDemoDistrict();
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
