// Per-fort, per-zoom localStorage persistence for user-dragged tile positions.
//
// Positions are keyed by (fortId, zoomLevel). The auto-layout algorithm in
// latticeLayout.js still runs on every zoom/reload so newly-added nodes get
// sensible defaults, but any node whose id matches a saved entry is restored
// and marked `_pinned` so the layout skips it.

const PREFIX = "runefort.positions";

/** @param {string} fortId @param {number} zoom */
function keyFor(fortId, zoom) {
  return `${PREFIX}.${fortId || "_none"}.${zoom}`;
}

/**
 * Load the saved `{ nodeId -> {x,y} }` map for a fort/zoom, or an empty object.
 * @param {string} fortId
 * @param {number} zoom
 * @returns {Record<string, { x:number, y:number }>}
 */
export function loadPositions(fortId, zoom) {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(keyFor(fortId, zoom));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Persist a single node's position.
 * @param {string} fortId
 * @param {number} zoom
 * @param {string} nodeId
 * @param {{ x:number, y:number }} pos
 */
export function savePosition(fortId, zoom, nodeId, pos) {
  if (typeof window === "undefined") return;
  try {
    const map = loadPositions(fortId, zoom);
    map[nodeId] = { x: pos.x, y: pos.y };
    window.localStorage.setItem(keyFor(fortId, zoom), JSON.stringify(map));
  } catch {
    // Quota or privacy mode — silently drop.
  }
}

/**
 * Mutate `nodes` in place: for each node with a saved position, set its
 * position and mark it `_pinned` so the layout algorithm leaves it alone.
 * Returns the number of nodes restored.
 *
 * @param {any[]} nodes
 * @param {string} fortId
 * @param {number} zoom
 */
export function applyPositionOverrides(nodes, fortId, zoom) {
  const saved = loadPositions(fortId, zoom);
  let restored = 0;
  for (const n of nodes) {
    const s = saved[n.id];
    if (!s) continue;
    n.position = { x: s.x, y: s.y };
    n.data = { ...(n.data || {}), _pinned: true };
    restored++;
  }
  return restored;
}

/**
 * Clear all saved positions for a fort/zoom (e.g. "reset layout" affordance).
 * @param {string} fortId
 * @param {number} zoom
 */
export function clearPositions(fortId, zoom) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyFor(fortId, zoom));
  } catch {
    /* ignore */
  }
}
