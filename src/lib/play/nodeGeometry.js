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
//
// Coordinate system: `@xyflow/system`'s `getHandleBounds` stores the handle's
// top-left corner (`handle.left - node.left`, `handle.top - node.top`) along
// with the DOM width/height. `getHandlePosition` then computes the edge
// endpoint as:
//   top:    { x: x + width/2, y }
//   bottom: { x: x + width/2, y: y + height }
//   left:   { x,              y: y + height/2 }
//   right:  { x: x + width,   y: y + height/2 }
// SvelteFlow's default handle CSS renders a 6×6 dot (`box-sizing:border-box`,
// so the 1px border is inside the 6×6 — total DOM box is 6×6, not 8×8),
// centered on the node border via `translate(±50%, ±50%)` → `translate(±3px,
// ±3px)`. That means the real DOM handle box for a top handle sits at
// (nodeW/2 − 3, −3) with size 6×6 — not (nodeW/2, 0) as earlier seeds
// assumed. The seed math below matches the rendered DOM exactly, so
// re-adopting a seeded node (e.g. after livingFort's shallow-clone pulse)
// produces the same endpoint the ResizeObserver would — no visible shift.

/**
 * @typedef {'top' | 'bottom' | 'left' | 'right'} HandlePosition
 * @typedef {{ id: string, type: 'source' | 'target', position: HandlePosition, x: number, y: number, width: number, height: number }} SeededHandle
 */

/**
 * Default dimensions by node type. Values are rough measurements from DOM
 * inspection; the RO will correct them once handles are populated.
 * @type {Record<string, { width: number, height: number }>}
 */
// Values match the rendered CSS in each flow component. Keep in sync if a
// node's width/min-width changes — seeded geometry is what Svelte Flow uses
// to compute `handleBounds` on first paint, and if these disagree with the
// real DOM the edges will visually miss the handles until the ResizeObserver
// catches up (which is itself unreliable in our $state.raw setup).
const DEFAULT_DIMS = {
  room: { width: 240, height: 115 },       // RoomNode.svelte width:240px, min-height:115px
  wall: { width: 100, height: 54 },        // WallNode min-width:100px
  clocktower: { width: 140, height: 109 }, // ClockTowerNode min-width:140px
  goalseed: { width: 112, height: 107 },   // GoalSeedNode min-width:112px
  fort: { width: 150, height: 105 },       // FortNode min-width:130px; actual ~150 with role text
  tile: { width: 240, height: 86 },        // TileNode.svelte width:240px
  hall: { width: 120, height: 60 },
  bridge: { width: 120, height: 70 },
  gate: { width: 120, height: 60 },
  tower: { width: 120, height: 110 },
  rune: { width: 280, height: 120 },       // RuneNode min-width:280px
  buildtile: { width: 160, height: 90 },
  testtile: { width: 140, height: 70 },
  district: { width: 180, height: 100 },
  conveyor: { width: 120, height: 60 },
  b2bopaque: { width: 180, height: 120 },  // B2bOpaqueNode min-width:180px, min-height:120px
  b2bphase: { width: 130, height: 80 },    // B2bPhaseNode min-width:130px
  b2bgroup: { width: 160, height: 90 },
};

const FALLBACK = { width: 240, height: 115 };

/**
 * Rendered handle DOM box: 6×6 (CSS sets `width:6px; height:6px;
 * box-sizing:border-box`, so the 1px border lives INSIDE the 6×6 box, not
 * outside it). CSS centers the dot on the border via `translate(±50%,
 * ±50%)`, which resolves to `translate(±3px, ±3px)` — hence the TL corner
 * offset of −3 from the border line.
 */
const HANDLE_BOX = 6;
const HANDLE_OFFSET = 3;

/**
 * Build the default 4-handle set (target-top, source-bottom, target-left,
 * source-right) given a node's width/height. Coordinates match the rendered
 * DOM box exactly — see file header comment for the derivation.
 * @param {number} w
 * @param {number} h
 * @returns {SeededHandle[]}
 */
function defaultHandles(w, h) {
  const o = HANDLE_OFFSET;
  const s = HANDLE_BOX;
  return [
    { id: "top",    type: "target", position: "top",    x: w / 2 - o, y: -o,        width: s, height: s },
    { id: "bottom", type: "source", position: "bottom", x: w / 2 - o, y: h - o,     width: s, height: s },
    { id: "left",   type: "target", position: "left",   x: -o,        y: h / 2 - o, width: s, height: s },
    { id: "right",  type: "source", position: "right",  x: w - o,     y: h / 2 - o, width: s, height: s },
  ];
}

/**
 * FortNode declares 8 handles — each side carries BOTH a source and a target
 * variant with distinct IDs. Must match FortNode.svelte exactly or
 * latticeLayout's autoWireHandles will assign an ID SvelteFlow can't resolve
 * and the edge won't render.
 * @param {number} w
 * @param {number} h
 * @returns {SeededHandle[]}
 */
function fortHandles(w, h) {
  const o = HANDLE_OFFSET;
  const s = HANDLE_BOX;
  return [
    { id: "top",           type: "target", position: "top",    x: w / 2 - o, y: -o,        width: s, height: s },
    { id: "top-source",    type: "source", position: "top",    x: w / 2 - o, y: -o,        width: s, height: s },
    { id: "bottom",        type: "source", position: "bottom", x: w / 2 - o, y: h - o,     width: s, height: s },
    { id: "bottom-target", type: "target", position: "bottom", x: w / 2 - o, y: h - o,     width: s, height: s },
    { id: "left",          type: "target", position: "left",   x: -o,        y: h / 2 - o, width: s, height: s },
    { id: "left-source",   type: "source", position: "left",   x: -o,        y: h / 2 - o, width: s, height: s },
    { id: "right",         type: "source", position: "right",  x: w - o,     y: h / 2 - o, width: s, height: s },
    { id: "right-target",  type: "target", position: "right",  x: w - o,     y: h / 2 - o, width: s, height: s },
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
    const w = node.measured.width;
    const h = node.measured.height;
    node.handles = type === "fort" ? fortHandles(w, h) : defaultHandles(w, h);
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
