// Svelte 5 rune store for dark factory console logs.
// Collects events from the factory loop for display in a bottom console panel.

/**
 * @typedef {Object} LogEntry
 * @property {string} id
 * @property {string} timestamp - ISO string
 * @property {'signal'|'triage'|'pipeline'|'phase'|'learn'|'consolidate'|'error'|'info'} level
 * @property {string} message
 * @property {object} [detail] - optional structured data
 */

const MAX_ENTRIES = 200;

/** @type {LogEntry[]} */
let _entries = $state([]);

/** @type {boolean} */
let _open = $state(false);

/** @type {boolean} */
let _autoScroll = $state(true);

/** @type {Set<string>} */
let _filter = $state(new Set(["signal", "triage", "pipeline", "phase", "learn", "consolidate", "error", "info"]));

export function getLogEntries() {
  return _entries;
}

export function isLogOpen() {
  return _open;
}

export function toggleLogOpen() {
  _open = !_open;
}

export function setLogOpen(v) {
  _open = v;
}

export function getAutoScroll() {
  return _autoScroll;
}

export function toggleAutoScroll() {
  _autoScroll = !_autoScroll;
}

export function getFilter() {
  return _filter;
}

/** @param {string} level */
export function toggleFilter(level) {
  if (_filter.has(level)) {
    _filter.delete(level);
  } else {
    _filter.add(level);
  }
  // Force reactivity by reassigning
  _filter = new Set(_filter);
}

/**
 * Add a log entry.
 * @param {'signal'|'triage'|'pipeline'|'phase'|'learn'|'consolidate'|'error'|'info'} level
 * @param {string} message
 * @param {object} [detail]
 */
export function log(level, message, detail) {
  _entries = [..._entries, {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    level,
    message,
    detail,
  }].slice(-MAX_ENTRIES);
}

/** Clear all entries */
export function clearLog() {
  _entries = [];
}

// ── Convenience loggers ──

/** @param {string} msg @param {object} [detail] */
export function logSignal(msg, detail) { log("signal", msg, detail); }

/** @param {string} msg @param {object} [detail] */
export function logTriage(msg, detail) { log("triage", msg, detail); }

/** @param {string} msg @param {object} [detail] */
export function logPipeline(msg, detail) { log("pipeline", msg, detail); }

/** @param {string} msg @param {object} [detail] */
export function logPhase(msg, detail) { log("phase", msg, detail); }

/** @param {string} msg @param {object} [detail] */
export function logLearn(msg, detail) { log("learn", msg, detail); }

/** @param {string} msg @param {object} [detail] */
export function logConsolidate(msg, detail) { log("consolidate", msg, detail); }

/** @param {string} msg @param {object} [detail] */
export function logError(msg, detail) { log("error", msg, detail); }

/** @param {string} msg @param {object} [detail] */
export function logInfo(msg, detail) { log("info", msg, detail); }
