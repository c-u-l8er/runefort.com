// Toast store (spec §9 Phase 8 polish).
//
// One source of truth for transient status messages: save/delete/copy
// acknowledgements, MCP reconnect notices, pipeline-complete banners.
//
// Queue caps at 3 visible + 10 pending (per cross-cutting perf budget).
// Each toast carries a kind (info|success|warn|error), a body, an auto
// dismiss timer (4 s default, pause on hover/focus handled by consumer),
// and a stable id for keyed rendering.
//
// a11y: toasts are `role="status"` with `aria-live="polite"` — set in the
// ToastHost component, not here.

/**
 * @typedef {"info" | "success" | "warn" | "error"} ToastKind
 * @typedef {Object} Toast
 * @property {number} id
 * @property {ToastKind} kind
 * @property {string} body
 * @property {number} ttlMs
 * @property {number} createdAt
 */

const MAX_VISIBLE = 3;
const MAX_PENDING = 10;
const DEFAULT_TTL_MS = 4000;

/** @type {{ visible: Toast[], pending: Toast[] }} */
let state = $state({ visible: [], pending: [] });

let _id = 0;
/** @type {Map<number, ReturnType<typeof setTimeout>>} */
const _timers = new Map();

/**
 * @returns {{ visible: Toast[], pending: Toast[] }}
 */
export function getToasts() {
  return state;
}

/**
 * @param {ToastKind} kind
 * @param {string} body
 * @param {number} [ttlMs]
 * @returns {number} toast id (for manual dismissal)
 */
export function toast(kind, body, ttlMs = DEFAULT_TTL_MS) {
  const id = ++_id;
  /** @type {Toast} */
  const t = { id, kind, body, ttlMs, createdAt: Date.now() };

  if (state.visible.length < MAX_VISIBLE) {
    state.visible = [...state.visible, t];
    scheduleDismiss(id, ttlMs);
  } else if (state.pending.length < MAX_PENDING) {
    state.pending = [...state.pending, t];
  }
  return id;
}

/**
 * Convenience helpers — match landing-page voice (lowercase body, em-dash rhythm).
 * @param {string} body
 * @param {number} [ttlMs]
 */
export function toastInfo(body, ttlMs) { return toast("info", body, ttlMs ?? DEFAULT_TTL_MS); }
/** @param {string} body @param {number} [ttlMs] */
export function toastSuccess(body, ttlMs) { return toast("success", body, ttlMs ?? DEFAULT_TTL_MS); }
/** @param {string} body @param {number} [ttlMs] */
export function toastWarn(body, ttlMs) { return toast("warn", body, ttlMs ?? DEFAULT_TTL_MS); }
/** @param {string} body @param {number} [ttlMs] */
export function toastError(body, ttlMs) { return toast("error", body, ttlMs ?? DEFAULT_TTL_MS); }

/**
 * Remove a toast by id; if there is a pending toast, promote it into the
 * now-empty slot and start its timer.
 * @param {number} id
 */
export function dismiss(id) {
  const timer = _timers.get(id);
  if (timer) { clearTimeout(timer); _timers.delete(id); }
  state.visible = state.visible.filter((t) => t.id !== id);
  if (state.pending.length > 0 && state.visible.length < MAX_VISIBLE) {
    const [next, ...rest] = state.pending;
    state.pending = rest;
    state.visible = [...state.visible, next];
    scheduleDismiss(next.id, next.ttlMs);
  }
}

/** Pause the auto-dismiss timer for a toast (on hover/focus). */
export function pause(/** @type {number} */ id) {
  const timer = _timers.get(id);
  if (timer) { clearTimeout(timer); _timers.delete(id); }
}

/** Resume auto-dismiss for a toast with a fresh full TTL. */
export function resume(/** @type {number} */ id) {
  const t = state.visible.find((x) => x.id === id);
  if (t) scheduleDismiss(id, t.ttlMs);
}

/**
 * @param {number} id
 * @param {number} ttlMs
 */
function scheduleDismiss(id, ttlMs) {
  const timer = setTimeout(() => dismiss(id), ttlMs);
  _timers.set(id, timer);
}
