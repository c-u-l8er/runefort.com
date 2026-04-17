// Pre-seeded node geometry (`measured` + `handles`) so Svelte Flow renders
// edges on first paint, without depending on the ResizeObserver pipeline.
//
// Background: @xyflow/svelte's `adoptUserNodes` → `parseHandles` returns
// populated source/target handleBounds when the userNode exposes a
// `handles: [...]` array AND a `measured: { width, height }`. Without both,
// `handleBounds` stays undefined, `getLayoutedEdges` drops every edge, and
// NodeWrapper clamps `visibility: hidden` until the ResizeObserver fills
// in the missing dimensions. In our Svelte 5 + `$state.raw` setup the RO
// callback was not firing reliably on first mount — pre-seeding sidesteps
// the whole handshake. When the DOM does eventually get measured, real
// values overwrite these seeds.
//
// All custom node types in `src/components/flow/` declare the same 4-handle
// shape (target-top, source-bottom, target-left, source-right), so a single
// default template covers every starter / district / campus node. Anything
// that declares a different handle set (e.g. FortNode's 8 handles) can pass
// its own `handles` array to override.

/**
 * @typedef {'top' | 'bottom' | 'left' | 'right'} HandlePosition
 * @typedef {{ id: string, type: 'source' | 'target', position: HandlePosition, x: number, y: number, width: number, height: number }} SeededHandle
 */

/**
 * Default dimensions by node type. Values are rough measurements from DOM
 * inspection; the RO will correct them once handles are populated.
 * @type {Record<string, { width: number, height: number }>}
 */
const DEFAULT_DIMS = {
  room: { width: 160, height: 95 },
  wall: { width: 120, height: 60 },
  clocktower: { width: 140, height: 110 },
  goalseed: { width: 180, height: 85 },
  fort: { width: 200, height: 110 },
  tile: { width: 120, height: 70 },
  hall: { width: 120, height: 60 },
  bridge: { width: 120, height: 70 },
  gate: { width: 120, height: 60 },
  tower: { width: 120, height: 110 },
  rune: { width: 80, height: 80 },
  buildtile: { width: 160, height: 90 },
  testtile: { width: 140, height: 70 },
  district: { width: 180, height: 100 },
  conveyor: { width: 120, height: 60 },
  b2bopaque: { width: 160, height: 90 },
  b2bphase: { width: 140, height: 80 },
  b2bgroup: { width: 160, height: 90 },
};

const FALLBACK = { width: 160, height: 95 };

/**
 * Build the default 4-handle set (target-top, source-bottom, target-left,
 * source-right) given a node's width/height.
 * @param {number} w
 * @param {number} h
 * @returns {SeededHandle[]}
 */
function defaultHandles(w, h) {
  return [
    { id: "top",    type: "target", position: "top",    x: w / 2, y: 0,     width: 6, height: 6 },
    { id: "bottom", type: "source", position: "bottom", x: w / 2, y: h,     width: 6, height: 6 },
    { id: "left",   type: "target", position: "left",   x: 0,     y: h / 2, width: 6, height: 6 },
    { id: "right",  type: "source", position: "right",  x: w,     y: h / 2, width: 6, height: 6 },
  ];
}

/**
 * Mutate `node` to add `measured` + `handles` so Svelte Flow computes
 * handleBounds without waiting for the ResizeObserver. Returns the same
 * node for chaining.
 * @template {{ id: string, type?: string, measured?: any, handles?: any }} N
 * @param {N} node
 * @returns {N}
 */
export function seedNodeGeometry(node) {
  const type = node.type ?? "default";
  const dims = DEFAULT_DIMS[type] ?? FALLBACK;
  if (!node.measured) {
    node.measured = { width: dims.width, height: dims.height };
  }
  if (!node.handles) {
    node.handles = defaultHandles(node.measured.width, node.measured.height);
  }
  return node;
}

/**
 * Bulk variant — seed every node in an array.
 * @template {{ id: string, type?: string }} N
 * @param {N[]} nodes
 * @returns {N[]}
 */
export function seedAllGeometry(nodes) {
  for (const n of nodes) seedNodeGeometry(n);
  return nodes;
}
