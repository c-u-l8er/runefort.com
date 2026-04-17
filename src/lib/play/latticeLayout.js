// Lattice layout — uniform-cell auto-arrangement (Sugiyama-lite).
//
// Every RuneFort node is visually a tile of roughly the same size. That means
// positions can — and should — snap to a uniform grid. This module takes a
// node/edge pair and rewrites `position` in place (returning the new array)
// using three signals the manifest already carries:
//
//   1. Kind-ordered columns — PULSE phase kind (retrieve → route → act →
//      learn → consolidate) gives the canonical x-axis. Unknown kinds sort
//      last. Edge topology (topological distance from source-free nodes)
//      breaks ties between same-kind rooms.
//   2. Role-ordered rows — clocktower on top, walls/gates above, rooms
//      in the main flow, goal seeds below. Each band has a fixed y.
//   3. Uniform cells — one `CELL = { w, h }` constant, positions are
//      `origin + col * CELL.w`, `origin + row * CELL.h`. Edges become clean
//      orthogonal runs instead of diagonal shots.
//
// Hand-placed nodes opt out via `data._pinned = true`. Handles auto-wire
// from the positional delta between source and target so edges always exit
// the correct side of a tile.

/** @typedef {{ id: string, type?: string, position?: { x: number, y: number }, data?: any }} LatticeNode */
/** @typedef {{ id: string, source: string, target: string, sourceHandle?: string, targetHandle?: string, [k: string]: any }} LatticeEdge */

export const CELL = /** @type {const} */ ({ w: 260, h: 200 });

/** PULSE phase kinds → canonical column order (spec §6.2). Unknown = 99. */
const KIND_COL = {
  retrieve: 0, compose: 0,
  route: 1,
  deliberate: 2, interact: 2,
  act: 3, observe: 3,
  learn: 4, reflect: 4,
  consolidate: 5, diagnose: 5,
};

/** Role-row band. Lower index = higher on screen. */
const BAND = {
  TOP: 0,      // clocktower
  WALL: 1,     // walls pin above their host room (visual overlap is fine)
  MAIN: 2,     // rooms, tiles, gates, forts, bridges
  GOAL: 3,     // goal seeds
};

/**
 * Campus-scale lattice layout. Designed for a single fort's phase row:
 * rooms arranged left→right by PULSE kind, walls pinned above their host
 * rooms, goals in their own row below, clocktower centered on top.
 *
 * Mutates `nodes` and `edges` in place (also returns them for convenience).
 *
 * @param {{ nodes: LatticeNode[], edges: LatticeEdge[], origin?: { x:number, y:number } }} args
 * @returns {{ nodes: LatticeNode[], edges: LatticeEdge[] }}
 */
export function layoutCampus({ nodes, edges, origin = { x: 60, y: 40 } }) {
  /** @type {Record<number, LatticeNode[]>} */
  const bands = { [BAND.TOP]: [], [BAND.WALL]: [], [BAND.MAIN]: [], [BAND.GOAL]: [] };
  /** @type {LatticeNode[]} */
  const pinned = [];

  for (const n of nodes) {
    if (n.data?._pinned) { pinned.push(n); continue; }
    const band = bandFor(n);
    bands[band].push(n);
  }

  // ── Main row: sort by PULSE kind, tie-break by topological distance ──
  const topoDist = topologicalDistance(bands[BAND.MAIN], edges);
  bands[BAND.MAIN].sort((a, b) => {
    const ca = KIND_COL[a.data?.kind] ?? 99;
    const cb = KIND_COL[b.data?.kind] ?? 99;
    if (ca !== cb) return ca - cb;
    const da = topoDist.get(a.id) ?? 999;
    const db = topoDist.get(b.id) ?? 999;
    if (da !== db) return da - db;
    return String(a.id).localeCompare(String(b.id));
  });

  bands[BAND.MAIN].forEach((n, i) => {
    n.position = { x: origin.x + i * CELL.w, y: origin.y + BAND.MAIN * CELL.h };
  });

  // ── Clocktower: centered over the main row ──
  if (bands[BAND.TOP].length > 0 && bands[BAND.MAIN].length > 0) {
    const mainSpan = (bands[BAND.MAIN].length - 1) * CELL.w;
    const center = origin.x + mainSpan / 2;
    bands[BAND.TOP].forEach((n, i) => {
      const offset = (i - (bands[BAND.TOP].length - 1) / 2) * CELL.w;
      n.position = { x: center + offset, y: origin.y + BAND.TOP * CELL.h };
    });
  } else {
    bands[BAND.TOP].forEach((n, i) => {
      n.position = { x: origin.x + i * CELL.w, y: origin.y + BAND.TOP * CELL.h };
    });
  }

  // ── Walls: snap above their host room (roomId in data, or `wall-<id>`) ──
  bands[BAND.WALL].forEach((n) => {
    const hostId = n.data?.roomId
      || (typeof n.id === "string" && n.id.startsWith("wall-") ? n.id.slice(5) : null);
    const host = bands[BAND.MAIN].find((r) => r.id === hostId);
    if (host) {
      n.position = { x: host.position.x + 40, y: host.position.y - 90 };
    } else {
      // Orphan wall — park at top-left of its own band
      n.position = { x: origin.x, y: origin.y + BAND.WALL * CELL.h };
    }
  });

  // ── Goals: own row, left-to-right by insertion order ──
  bands[BAND.GOAL].forEach((n, i) => {
    n.position = { x: origin.x + i * CELL.w, y: origin.y + BAND.GOAL * CELL.h + 80 };
  });

  // ── Auto-wire handles based on positional delta ──
  autoWireHandles(nodes, edges);
  return { nodes, edges };
}

/**
 * District-scale lattice layout. Forts don't have a PULSE kind axis, so we
 * group by role: core loops top, governance/temporal middle, products/B2B
 * bottom. Shared-ground gate centered above everything.
 *
 * @param {{ nodes: LatticeNode[], edges: LatticeEdge[], origin?: { x:number, y:number } }} args
 * @returns {{ nodes: LatticeNode[], edges: LatticeEdge[] }}
 */
export function layoutDistrict({ nodes, edges, origin = { x: 80, y: 40 } }) {
  /** Roles grouped into visual tiers (spec §4.1). */
  const ROLE_TIER = /** @type {Record<string, number>} */ ({
    "Memory Substrate": 0,
    "Decision Protocol": 0,
    "Watchtower Complex": 0,
    "Orchestration Loop": 0,
    "Governance": 1,
    "Temporal": 1,
    "Orchestration": 1,
    "Spatial Intelligence": 1,
    "Hosting": 2,
    "Build Pipeline": 2,
    "Marketplace": 2,
    "Knowledge Editor": 2,
  });

  /** @type {LatticeNode[][]} */
  const tiers = [[], [], [], []]; // 0=core, 1=infra, 2=products, 3=b2b
  /** @type {LatticeNode | null} */
  let groundNode = null;
  /** @type {LatticeNode[]} */
  const pinned = [];

  for (const n of nodes) {
    if (n.data?._pinned) { pinned.push(n); continue; }
    if (n.id === "shared-ground") { groundNode = n; continue; }
    if (n.type === "b2bopaque" || n.type === "b2bgroup") { tiers[3].push(n); continue; }
    const tier = ROLE_TIER[n.data?.role] ?? 2;
    tiers[tier].push(n);
  }

  // Sort tiers alphabetically by label so layout is stable across reloads
  tiers.forEach((tier) => {
    tier.sort((a, b) => String(a.data?.label ?? a.id).localeCompare(String(b.data?.label ?? b.id)));
  });

  const maxCols = Math.max(...tiers.map((t) => t.length), 1);
  const rowHeight = CELL.h + 40; // tiers need extra breathing room

  // Shared-ground: centered above tier 0
  if (groundNode) {
    const tierWidth = (maxCols - 1) * CELL.w;
    groundNode.position = { x: origin.x + tierWidth / 2, y: origin.y };
  }

  tiers.forEach((tier, tierIdx) => {
    // Center each tier's row (shorter tiers sit centered rather than left-aligned)
    const span = (tier.length - 1) * CELL.w;
    const maxSpan = (maxCols - 1) * CELL.w;
    const xOffset = (maxSpan - span) / 2;
    tier.forEach((n, i) => {
      n.position = {
        x: origin.x + xOffset + i * CELL.w,
        y: origin.y + (tierIdx + 1) * rowHeight,
      };
    });
  });

  autoWireHandles(nodes, edges);
  return { nodes, edges };
}

/**
 * Band assignment. Keep in sync with `BAND`.
 * @param {LatticeNode} n
 */
function bandFor(n) {
  switch (n.type) {
    case "clocktower": return BAND.TOP;
    case "wall":       return BAND.WALL;
    case "goalseed":   return BAND.GOAL;
    default:           return BAND.MAIN;
  }
}

/**
 * Kahn-style topological distance from edgeless-source nodes. Returns a map
 * `{ nodeId → depth }` for every node in `mainNodes`. Cycles fall back to
 * insertion order.
 *
 * @param {LatticeNode[]} mainNodes
 * @param {LatticeEdge[]} edges
 * @returns {Map<string, number>}
 */
function topologicalDistance(mainNodes, edges) {
  const ids = new Set(mainNodes.map((n) => n.id));
  /** @type {Map<string, number>} */
  const indeg = new Map();
  /** @type {Map<string, string[]>} */
  const succ = new Map();
  for (const n of mainNodes) { indeg.set(n.id, 0); succ.set(n.id, []); }
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
    succ.get(e.source)?.push(e.target);
  }
  /** @type {Map<string, number>} */
  const dist = new Map();
  /** @type {string[]} */
  const queue = [];
  for (const [id, d] of indeg) { if (d === 0) { dist.set(id, 0); queue.push(id); } }
  while (queue.length > 0) {
    const id = /** @type {string} */ (queue.shift());
    const d = dist.get(id) ?? 0;
    for (const s of succ.get(id) ?? []) {
      const nd = Math.max(dist.get(s) ?? 0, d + 1);
      dist.set(s, nd);
      const ind = (indeg.get(s) ?? 0) - 1;
      indeg.set(s, ind);
      if (ind === 0) queue.push(s);
    }
  }
  // Any node not visited (cycle) gets a large default distance
  for (const n of mainNodes) { if (!dist.has(n.id)) dist.set(n.id, 500); }
  return dist;
}

/**
 * Re-pick sourceHandle/targetHandle for each edge based on the positional
 * delta between source and target. Horizontal delta dominates → left/right;
 * vertical delta dominates → top/bottom. Edges with `_pinnedHandles: true`
 * are left alone (used for hand-tuned edges like the κ-gate branch).
 *
 * FortNode (and B2B variants) have directional handle variants — each side
 * carries BOTH a source and a target handle with distinct IDs (`left` is a
 * target, `left-source` is the source on the same side). We pick the right
 * variant based on whether the node sits at the source or target end of the
 * edge.
 *
 * @param {LatticeNode[]} nodes
 * @param {LatticeEdge[]} edges
 */
export function autoWireHandles(nodes, edges) {
  /** @type {Map<string, {x:number,y:number}>} */
  const posById = new Map();
  /** @type {Map<string, string|undefined>} */
  const typeById = new Map();
  for (const n of nodes) {
    if (n.position) posById.set(n.id, n.position);
    typeById.set(n.id, n.type);
  }

  // FortNode is the only stock type with paired source/target handles per
  // side. If more node types adopt the same convention, add them here.
  const NEEDS_SPLIT = new Set(["fort"]);
  /**
   * Map a cardinal side + role to the actual handle id on the node.
   * @param {string|undefined} type
   * @param {"top"|"bottom"|"left"|"right"} side
   * @param {"source"|"target"} role
   */
  function handleId(type, side, role) {
    if (!type || !NEEDS_SPLIT.has(type)) return side;
    // FortNode convention: `top` + `bottom` are target-side by default;
    // `left` + `right` are target-side too (BUT `right` is listed as source
    // in the component — keep that exception). See FortNode.svelte handles.
    // Source variants suffixed with `-source`; target variants with `-target`.
    // Derived from FortNode.svelte:
    //   top (target) · top-source (source)
    //   bottom (source) · bottom-target (target)
    //   left (target) · left-source (source)
    //   right (source) · right-target (target)
    if (side === "top")    return role === "source" ? "top-source" : "top";
    if (side === "bottom") return role === "source" ? "bottom"     : "bottom-target";
    if (side === "left")   return role === "source" ? "left-source": "left";
    /* right */            return role === "source" ? "right"      : "right-target";
  }

  for (const e of edges) {
    if (e._pinnedHandles) continue;
    const s = posById.get(e.source);
    const t = posById.get(e.target);
    if (!s || !t) continue;
    const dx = t.x - s.x;
    const dy = t.y - s.y;
    /** @type {"top"|"bottom"|"left"|"right"} */
    let sourceSide;
    /** @type {"top"|"bottom"|"left"|"right"} */
    let targetSide;
    if (Math.abs(dx) >= Math.abs(dy)) {
      sourceSide = dx >= 0 ? "right"  : "left";
      targetSide = dx >= 0 ? "left"   : "right";
    } else {
      sourceSide = dy >= 0 ? "bottom" : "top";
      targetSide = dy >= 0 ? "top"    : "bottom";
    }
    e.sourceHandle = handleId(typeById.get(e.source), sourceSide, "source");
    e.targetHandle = handleId(typeById.get(e.target), targetSide, "target");
  }
}
