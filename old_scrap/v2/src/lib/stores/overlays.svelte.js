/** @typedef {import('$lib/types.js').OverlayKey} OverlayKey */

/** @type {import('$lib/types.js').Overlay[]} */
const overlayDefs = [
  { key: "structure",  label: "Structure",  shortcut: "S", active: true },
  { key: "flow",       label: "Flow",       shortcut: "F", active: false },
  { key: "thermal",    label: "Thermal",    shortcut: "T", active: false },
  { key: "temporal",   label: "Temporal",   shortcut: "P", active: false },
  { key: "diagnostic", label: "Diagnostic", shortcut: "D", active: false },
  { key: "rune",       label: "Rune",       shortcut: "R", active: false },
  { key: "confidence", label: "Confidence", shortcut: "C", active: false },
  { key: "topology",   label: "Topology",   shortcut: "K", active: false },
  { key: "assembly",   label: "Assembly",   shortcut: "A", active: false },
];

let overlays = $state(overlayDefs.map((o) => ({ ...o })));

export function getOverlays() {
  return overlays;
}

/** @param {OverlayKey} key */
export function toggleOverlay(key) {
  const overlay = overlays.find((o) => o.key === key);
  if (overlay && key !== "structure") {
    overlay.active = !overlay.active;
  }
}

/** @param {string} shortcut */
export function toggleByShortcut(shortcut) {
  const overlay = overlays.find((o) => o.shortcut === shortcut.toUpperCase());
  if (overlay && overlay.key !== "structure") {
    overlay.active = !overlay.active;
  }
}

/** @param {OverlayKey} key @returns {boolean} */
export function isOverlayActive(key) {
  return overlays.find((o) => o.key === key)?.active ?? false;
}

/** Returns a Set of active overlay keys */
export function activeOverlayKeys() {
  return new Set(overlays.filter((o) => o.active).map((o) => o.key));
}

// ── Local (per-node) overlay activations ──
// Spec §0.2 / §2.3 / §10.7 — "motion is the menu". Hovering a corridor fades
// Flow in on *that corridor*; clicking a wall cracks open Rune on *that wall*.
// This state lives next to the globals so keyboard users (who pin overlays
// globally) and cold users (who discover overlays by interacting) share the
// same store.

/**
 * Per-node overlay activation. We store flat `"nodeId::key"` entries in a plain
 * Set (not reactive) and pair it with a `$state` version counter that's bumped
 * on every mutation. Consumers read `_localVersion` inside their derived before
 * calling `isOverlayActiveOn`, so Svelte 5 tracks a dependency that reliably
 * fires across module boundaries. This is more predictable than relying on
 * `$state(new Set())` proxy semantics for module-scope reactive state.
 *
 * @type {Set<string>}
 */
const _localActive = new Set();
let _localVersion = $state(0);

/** @param {string} nodeId @param {OverlayKey} key */
function _k(nodeId, key) { return `${nodeId}::${key}`; }

/**
 * Mark a local overlay active on a specific node.
 * @param {string} nodeId
 * @param {OverlayKey} key
 */
export function setLocalOverlay(nodeId, key) {
  const k = _k(nodeId, key);
  if (_localActive.has(k)) return;
  _localActive.add(k);
  _localVersion += 1;
}

/**
 * Clear a local overlay from a specific node.
 * @param {string} nodeId
 * @param {OverlayKey} [key] - if omitted, clears all overlays for that node.
 */
export function clearLocalOverlay(nodeId, key) {
  let changed = false;
  if (key) {
    changed = _localActive.delete(_k(nodeId, key));
  } else {
    const prefix = `${nodeId}::`;
    for (const entry of Array.from(_localActive)) {
      if (entry.startsWith(prefix)) {
        _localActive.delete(entry);
        changed = true;
      }
    }
  }
  if (changed) _localVersion += 1;
}

/** Clear every per-node overlay activation (e.g. on `Esc`). */
export function clearAllLocalOverlays() {
  if (_localActive.size === 0) return;
  _localActive.clear();
  _localVersion += 1;
}

/**
 * Whether an overlay is active for a given node — locally OR globally.
 * Read `_localVersion` to register a reactive dependency so consumers re-run
 * when the local activation set mutates.
 * @param {string} nodeId
 * @param {OverlayKey} key
 */
export function isOverlayActiveOn(nodeId, key) {
  // Track the version counter so $derived consumers re-run on mutation.
  void _localVersion;
  if (isOverlayActive(key)) return true;
  return _localActive.has(_k(nodeId, key));
}

/** Returns a live view of local activations. */
export function getLocalActive() {
  void _localVersion;
  return _localActive;
}

// ── Proximity reveal (Stage D2, spec §0.2 motion-is-the-menu) ──
// Approaching a busy room in the viewport fades Thermal in on that room,
// even without hovering. Throttled at PROXIMITY_THROTTLE_MS; deactivation
// is debounced by PROXIMITY_DEBOUNCE_MS so small camera drift doesn't
// flicker the overlay on/off. The module itself knows nothing about
// SvelteFlow — the caller (app/+page.svelte) hands in a pre-computed frame
// {centerX, centerY, diagonal, rooms[]} in flow (world) coordinates.
// Skipped entirely under prefers-reduced-motion.

export const PROXIMITY_THRESHOLD_RATIO = 0.35;
const PROXIMITY_THROTTLE_MS = 100;
const PROXIMITY_DEBOUNCE_MS = 400;

/** @typedef {{ id: string, cx: number, cy: number }} RoomCentroid */
/** @typedef {{ centerX: number, centerY: number, diagonal: number, rooms: RoomCentroid[] }} ProximityFrame */

/** @type {ReturnType<typeof setTimeout>|null} */
let _proxThrottleHandle = null;
let _proxLastRunAt = 0;
/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const _proxDebounceTimers = new Map();
/** @type {Set<string>} */
const _proxActive = new Set();

let _proxReducedMotion = false;
if (typeof window !== "undefined" && window.matchMedia) {
  const _mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  _proxReducedMotion = _mq.matches;
  _mq.addEventListener?.("change", (e) => {
    _proxReducedMotion = e.matches;
    if (e.matches) stopProximityTracker();
  });
}

/** @type {{ centerX: number, centerY: number, diagonal: number, active: string[] } | null} */
let _proxHudState = $state(null);

/**
 * Apply a proximity observation frame: activate Thermal on rooms within
 * `PROXIMITY_THRESHOLD_RATIO × diagonal` of the viewport center, schedule
 * debounced deactivation on rooms leaving that radius.
 * @param {ProximityFrame} frame
 */
function applyProximityFrame(frame) {
  if (_proxReducedMotion) return;
  const threshold = frame.diagonal * PROXIMITY_THRESHOLD_RATIO;
  /** @type {string[]} */
  const inRange = [];
  for (const r of frame.rooms) {
    const d = Math.hypot(r.cx - frame.centerX, r.cy - frame.centerY);
    if (d < threshold) inRange.push(r.id);
  }
  const inRangeSet = new Set(inRange);

  // Activate newly in-range rooms; cancel any pending deactivation.
  for (const id of inRange) {
    if (!_proxActive.has(id)) {
      _proxActive.add(id);
      setLocalOverlay(id, /** @type {OverlayKey} */ ("thermal"));
    }
    const pending = _proxDebounceTimers.get(id);
    if (pending) {
      clearTimeout(pending);
      _proxDebounceTimers.delete(id);
    }
  }
  // Debounce deactivation for rooms that left the radius.
  for (const id of Array.from(_proxActive)) {
    if (inRangeSet.has(id)) continue;
    if (_proxDebounceTimers.has(id)) continue;
    const t = setTimeout(() => {
      _proxDebounceTimers.delete(id);
      _proxActive.delete(id);
      clearLocalOverlay(id, /** @type {OverlayKey} */ ("thermal"));
    }, PROXIMITY_DEBOUNCE_MS);
    _proxDebounceTimers.set(id, t);
  }

  _proxHudState = {
    centerX: frame.centerX,
    centerY: frame.centerY,
    diagonal: frame.diagonal,
    active: inRange,
  };
}

/**
 * Observe a viewport change. Caller provides a function that builds a fresh
 * frame (so we don't force a DOM read on every throttled miss).
 * @param {() => ProximityFrame} getFrame
 */
export function observeProximity(getFrame) {
  if (_proxReducedMotion) return;
  const now = Date.now();
  const since = now - _proxLastRunAt;
  if (since >= PROXIMITY_THROTTLE_MS) {
    _proxLastRunAt = now;
    applyProximityFrame(getFrame());
    return;
  }
  if (_proxThrottleHandle) return;
  _proxThrottleHandle = setTimeout(() => {
    _proxLastRunAt = Date.now();
    _proxThrottleHandle = null;
    applyProximityFrame(getFrame());
  }, PROXIMITY_THROTTLE_MS - since);
}

/** Stop the tracker and clear any proximity-activated overlays. */
export function stopProximityTracker() {
  if (_proxThrottleHandle) {
    clearTimeout(_proxThrottleHandle);
    _proxThrottleHandle = null;
  }
  for (const t of _proxDebounceTimers.values()) clearTimeout(t);
  _proxDebounceTimers.clear();
  for (const id of Array.from(_proxActive)) {
    clearLocalOverlay(id, /** @type {OverlayKey} */ ("thermal"));
  }
  _proxActive.clear();
  _proxHudState = null;
}

/**
 * Returns the most recent proximity frame — used by the dev-mode HUD.
 * Reading this in a $derived subscribes to proximity updates.
 */
export function getProximityHudState() {
  return _proxHudState;
}
