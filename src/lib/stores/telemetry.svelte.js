// Svelte 5 rune store for live telemetry data from MCP servers.
// Manages polling intervals and provides overlay data.

import { findConnection } from "$lib/stores/mcp.svelte.js";
import { callTool } from "$lib/play/mcp-client.js";
import { isOverlayActive } from "$lib/stores/overlays.svelte.js";

/**
 * @typedef {Object} TelemetryState
 * @property {object|null} thermal - Graphonomous stats
 * @property {object|null} diagnostic - PRISM report
 * @property {object|null} confidence - Graphonomous context
 * @property {object|null} assembly - Agentelic + FleetPrompt
 */

/** @type {TelemetryState} */
let _data = $state({
  thermal: null,
  diagnostic: null,
  confidence: null,
  assembly: null,
});

/** @type {Map<string, ReturnType<typeof setInterval>>} */
const _intervals = new Map();

export function getTelemetryData() {
  return _data;
}

/**
 * Call an MCP tool safely.
 * @param {string} serverName
 * @param {string} toolName
 * @param {object} args
 * @returns {Promise<object|null>}
 */
async function mcpCall(serverName, toolName, args) {
  const conn = findConnection(serverName);
  if (!conn || conn.status !== "connected") return null;
  try {
    return await callTool(conn.url, undefined, toolName, args, conn.sessionId);
  } catch {
    return null;
  }
}

/** Fetch thermal data from Graphonomous */
async function fetchThermal() {
  const result = await mcpCall("graphonomous", "consolidate", { action: "stats" });
  if (result) _data.thermal = result;
}

/** Fetch diagnostic data from PRISM */
async function fetchDiagnostic() {
  const result = await mcpCall("os-prism", "diagnose", { action: "report" });
  if (result) _data.diagnostic = result;
}

/** Fetch confidence data from Graphonomous */
async function fetchConfidence(query = "fort confidence overview") {
  const result = await mcpCall("graphonomous", "retrieve", { action: "context", query, limit: 20 });
  if (result) _data.confidence = result;
}

/** Fetch assembly data from Agentelic + FleetPrompt */
async function fetchAssembly() {
  const [agentResult, fleetResult] = await Promise.all([
    mcpCall("agentelic", "agent_status", { agent_id: "all" }),
    mcpCall("fleetprompt", "registry_search", { query: "all" }),
  ]);
  _data.assembly = { agents: agentResult, registry: fleetResult };
}

/**
 * Start polling for a telemetry type.
 * @param {'thermal'|'diagnostic'|'confidence'|'assembly'} type
 * @param {number} [intervalMs]
 */
export function startPolling(type, intervalMs) {
  stopPolling(type);

  const fetchFn = {
    thermal: fetchThermal,
    diagnostic: fetchDiagnostic,
    confidence: fetchConfidence,
    assembly: fetchAssembly,
  }[type];

  const defaultInterval = {
    thermal: 5000,
    diagnostic: 30000,
    confidence: 5000,
    assembly: 30000,
  }[type];

  if (!fetchFn) return;
  fetchFn(); // initial fetch
  const id = setInterval(fetchFn, intervalMs || defaultInterval);
  _intervals.set(type, id);
}

/**
 * Stop polling for a telemetry type.
 * @param {string} type
 */
export function stopPolling(type) {
  const id = _intervals.get(type);
  if (id) {
    clearInterval(id);
    _intervals.delete(type);
  }
}

/** Stop all polling */
export function stopAllPolling() {
  for (const [type] of _intervals) {
    stopPolling(type);
  }
}

/**
 * Start/stop polling based on active overlays.
 * Call this periodically or on overlay toggle.
 */
export function syncPollingToOverlays() {
  const overlayToTelemetry = {
    thermal: "thermal",
    diagnostic: "diagnostic",
    confidence: "confidence",
    assembly: "assembly",
  };

  for (const [overlayKey, telemetryType] of Object.entries(overlayToTelemetry)) {
    if (isOverlayActive(/** @type {any} */ (overlayKey)) && !_intervals.has(telemetryType)) {
      startPolling(/** @type {any} */ (telemetryType));
    } else if (!isOverlayActive(/** @type {any} */ (overlayKey)) && _intervals.has(telemetryType)) {
      stopPolling(telemetryType);
    }
  }
}
