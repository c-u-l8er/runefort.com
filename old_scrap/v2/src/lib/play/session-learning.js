// Session Learning — writes navigation patterns to Graphonomous
// and loads cross-session context on fort init.
// All calls are fire-and-forget (no awaiting in the UI path).

import { findConnection } from "$lib/stores/mcp.svelte.js";
import { callTool } from "$lib/play/mcp-client.js";

/**
 * Get graphonomous connection, or null if not connected.
 * @returns {{ url: string, sessionId?: string } | null}
 */
function getConn() {
  const conn = findConnection("graphonomous");
  if (!conn || conn.status !== "connected") return null;
  return { url: conn.url, sessionId: conn.sessionId };
}

/**
 * Track a navigation event in the fort.
 * @param {string} fortId
 * @param {number} zoomLevel
 * @param {string} [nodeId]
 */
export function trackNavigation(fortId, zoomLevel, nodeId) {
  const conn = getConn();
  if (!conn) return;

  const content = `Fort navigation: ${fortId} → L${zoomLevel}${nodeId ? ` → ${nodeId}` : ""}`;
  callTool(conn.url, undefined, "act", {
    action: "store_node",
    node_type: "episodic",
    content,
    source: "runefort-session",
    confidence: 0.8,
    metadata: JSON.stringify({ fortId, zoomLevel, nodeId, timestamp: new Date().toISOString() }),
  }, conn.sessionId).catch(() => {});
}

/**
 * Track overlay usage pattern.
 * @param {string} overlay
 * @param {string} fortId
 */
export function trackOverlayUsage(overlay, fortId) {
  const conn = getConn();
  if (!conn) return;

  callTool(conn.url, undefined, "act", {
    action: "store_node",
    node_type: "episodic",
    content: `Overlay usage: ${overlay} activated on fort ${fortId}`,
    source: "runefort-session",
    confidence: 0.7,
    metadata: JSON.stringify({ overlay, fortId, timestamp: new Date().toISOString() }),
  }, conn.sessionId).catch(() => {});
}

/**
 * Track build trigger outcome.
 * @param {string} fortId
 * @param {string} buildId
 * @param {'success'|'failure'} status
 */
export function trackBuildTrigger(fortId, buildId, status) {
  const conn = getConn();
  if (!conn) return;

  callTool(conn.url, undefined, "learn", {
    action: "from_outcome",
    status,
    action_id: `build-${buildId}`,
    confidence: 0.9,
    evidence: JSON.stringify({ fortId, buildId, timestamp: new Date().toISOString() }),
  }, conn.sessionId).catch(() => {});
}

/**
 * Track a factory signal in Graphonomous.
 * @param {import('$lib/stores/factory.svelte.js').FactorySignal} signal
 */
export function trackFactorySignal(signal) {
  const conn = getConn();
  if (!conn) return;

  callTool(conn.url, undefined, "act", {
    action: "store_node",
    node_type: "episodic",
    content: `Factory signal: ${signal.source} → ${signal.classification} for ${signal.fortId}`,
    source: "runefort-factory",
    confidence: signal.classificationConfidence || 0.7,
    metadata: JSON.stringify({
      signalId: signal.id,
      source: signal.source,
      classification: signal.classification,
      fortId: signal.fortId,
      timestamp: signal.timestamp,
    }),
  }, conn.sessionId).catch(() => {});
}

/**
 * Track a pipeline run outcome in Graphonomous.
 * @param {import('$lib/stores/factory.svelte.js').PipelineRun} run
 */
export function trackPipelineOutcome(run) {
  const conn = getConn();
  if (!conn) return;

  const status = run.stage === "complete" ? "success" : "failure";
  callTool(conn.url, undefined, "learn", {
    action: "from_outcome",
    status,
    action_id: `factory-pipeline-${run.id}`,
    confidence: 0.9,
    evidence: JSON.stringify({
      runId: run.id,
      fortId: run.fortId,
      stage: run.stage,
      phasesCompleted: run.phases.filter((p) => p.status === "succeeded").length,
      totalPhases: run.phases.length,
      timestamp: run.completedAt || new Date().toISOString(),
    }),
  }, conn.sessionId).catch(() => {});
}

/**
 * Load factory context from Graphonomous.
 * @param {string} fortId
 * @returns {Promise<object|null>}
 */
export async function loadFactoryContext(fortId) {
  const conn = getConn();
  if (!conn) return null;

  try {
    const result = await callTool(conn.url, undefined, "retrieve", {
      action: "context",
      query: `runefort factory patterns for ${fortId}`,
      limit: 10,
    }, conn.sessionId);

    if (result?.content?.[0]?.text) {
      return JSON.parse(result.content[0].text);
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Load cross-session context for a fort.
 * Returns prior navigation patterns and preferences.
 * @param {string} fortId
 * @returns {Promise<object|null>}
 */
export async function loadSessionContext(fortId) {
  const conn = getConn();
  if (!conn) return null;

  try {
    const result = await callTool(conn.url, undefined, "retrieve", {
      action: "context",
      query: `runefort session context for ${fortId}`,
      limit: 10,
    }, conn.sessionId);

    if (result?.content?.[0]?.text) {
      return JSON.parse(result.content[0].text);
    }
    return result;
  } catch {
    return null;
  }
}
