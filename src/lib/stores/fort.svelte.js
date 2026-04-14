import { generateFortFromManifest, DEMO_MANIFESTS } from "$lib/fortGenerator.js";

/**
 * @typedef {Object} FortState
 * @property {number} zoomLevel - 0-4
 * @property {string} activeFortId - which fort we're zoomed into
 * @property {string | null} activeRoomId - which room we're viewing (L2+)
 * @property {string | null} activeNodeId - which node we're inspecting (L3+)
 * @property {import('@xyflow/svelte').Node[]} nodes
 * @property {import('@xyflow/svelte').Edge[]} edges
 * @property {object | null} manifest - current PULSE manifest
 * @property {string | null} savedFortId - database ID if saved
 * @property {string} fortName
 * @property {boolean} dirty - unsaved changes
 */

/** @type {FortState} */
let fort = $state({
  zoomLevel: 0,
  activeFortId: "",
  activeRoomId: null,
  activeNodeId: null,
  nodes: [],
  edges: [],
  manifest: null,
  savedFortId: null,
  fortName: "Untitled Fort",
  dirty: false,
});

export function getFort() {
  return fort;
}

/** Load the demo district (L0 with all ecosystem forts) */
export function loadDemoDistrict() {
  const district = generateFortFromManifest("district", null);
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
}

/** Zoom into a node (L3 room detail) */
export function zoomIntoNode(roomId) {
  const room = generateFortFromManifest("room", fort.manifest, roomId);
  fort.zoomLevel = 3;
  fort.activeNodeId = roomId;
  fort.nodes = room.nodes;
  fort.edges = room.edges;
  fort.dirty = true;
}

/** Zoom into rune detail (L4) */
export function zoomIntoRune(nodeId) {
  const rune = generateFortFromManifest("rune", fort.manifest, nodeId);
  fort.zoomLevel = 4;
  fort.nodes = rune.nodes;
  fort.edges = rune.edges;
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
    zoomIntoRoom(fort.activeRoomId);
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
