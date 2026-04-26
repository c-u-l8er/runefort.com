// Dynamic node-geometry sync.
//
// Problem: `nodeGeometry.js` seeds `measured` from a static `DEFAULT_DIMS`
// table, but fort / room / tile widths vary with their rendered content
// (label length, role text, overlay badges, repoMeta, etc). If the seed
// says 150×105 and the real DOM is 130×104, then — every time livingFort
// pulses or any other reassignment happens — `adoptUserNodes` calls
// `parseHandles` on the seed, rebuilds handleBounds at the wrong position,
// and edges land several pixels off the visible handle.
//
// This module measures the rendered `.svelte-flow__node` DOM, computes
// correct `measured` + `handles`, and writes them back to the store
// whenever they drift ≥ 1 px from what's stored. With the corrected
// geometry constants in `nodeGeometry.js` (HANDLE_BOX=6, HANDLE_OFFSET=3)
// the synthesized handle coordinates match SvelteFlow's own RO measurements
// exactly, so there's no chicken-and-egg shift between what we write and
// what RO produces — they agree.
//
// Why polling instead of ResizeObserver: per the file header comment in
// `stores/fort.svelte.js`, RO has been unreliable in this Svelte 5 +
// `$state.raw` setup (structuredClone on proxies throws, RO callback
// sometimes never fires). A tiny setTimeout ladder is predictable and
// cheap: 0, 50, 150, 400, 1000 ms during settle, then every 2 s idle.

import { seedNodeGeometry } from "$lib/play/nodeGeometry.js";

/**
 * @typedef {{ get: () => any[], setNodes: (nodes: any[]) => void }} StoreHandle
 */

let _timer = null;
let _handle = /** @type {StoreHandle | null} */ (null);
let _settleIdx = 0;
const SETTLE_DELAYS = [0, 50, 150, 400, 1000];
const IDLE_MS = 2000;
const DRIFT_TOLERANCE = 1; // px

function scheduleNext() {
  if (!_handle) return;
  const delay = _settleIdx < SETTLE_DELAYS.length ? SETTLE_DELAYS[_settleIdx] : IDLE_MS;
  _settleIdx++;
  _timer = setTimeout(() => {
    if (!_handle) return;
    measureOnce();
    scheduleNext();
  }, delay);
}

function measureOnce() {
  if (!_handle) return;
  const nodes = _handle.get();
  if (!nodes?.length) return;

  /** @type {Map<string, { width: number, height: number }>} */
  const dims = new Map();
  for (const el of document.querySelectorAll(".svelte-flow__node")) {
    const id = el.getAttribute("data-id");
    if (!id) continue;
    // offsetWidth/offsetHeight give CSS pixels (unzoomed). getBoundingClientRect
    // would be zoom-scaled — wrong for storing as `measured`.
    const he = /** @type {HTMLElement} */ (el);
    const w = he.offsetWidth;
    const h = he.offsetHeight;
    if (w > 0 && h > 0) dims.set(id, { width: w, height: h });
  }
  if (dims.size === 0) return;

  let changed = false;
  const next = nodes.map((n) => {
    const d = dims.get(n.id);
    if (!d) return n;
    const prev = n.measured;
    if (
      prev &&
      Math.abs(prev.width - d.width) < DRIFT_TOLERANCE &&
      Math.abs(prev.height - d.height) < DRIFT_TOLERANCE
    ) {
      return n;
    }
    changed = true;
    // Strip seeded handles so `seedNodeGeometry` regenerates them with the
    // new dimensions. Seeds use HANDLE_BOX=6, HANDLE_OFFSET=3 which matches
    // SvelteFlow's DOM measurements exactly.
    const { handles, measured, ...rest } = n;
    return seedNodeGeometry({
      ...rest,
      measured: { width: d.width, height: d.height },
    });
  });
  if (changed) _handle.setNodes(next);
}

/**
 * Start measuring rendered node DOM and syncing real dimensions back to the
 * store. Safe to call multiple times — second call replaces the first.
 * @param {StoreHandle} handle
 */
export function startMeasuringNodes(handle) {
  stopMeasuring();
  _handle = handle;
  _settleIdx = 0;
  scheduleNext();
}

export function stopMeasuring() {
  if (_timer) clearTimeout(_timer);
  _timer = null;
  _handle = null;
  _settleIdx = 0;
}
