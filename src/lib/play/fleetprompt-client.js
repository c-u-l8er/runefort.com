// MCP client wrapper for FleetPrompt registry tools.
// Uses the existing MCP infrastructure (mcp-client.js + mcp store).

import { findConnection } from "$lib/stores/mcp.svelte.js";
import { callTool } from "$lib/play/mcp-client.js";

/**
 * Get the fleetprompt MCP connection details.
 * @returns {{ url: string, sessionId?: string } | null}
 */
function getConn() {
  const conn = findConnection("fleetprompt");
  if (!conn || conn.status !== "connected") return null;
  return { url: conn.url, sessionId: conn.sessionId };
}

/**
 * Search the FleetPrompt registry for published agents.
 * @param {string} query
 * @returns {Promise<object>}
 * @throws when not connected or MCP call fails
 */
export async function registrySearch(query) {
  const conn = getConn();
  if (!conn) throw new Error("FleetPrompt MCP not connected");
  return await callTool(conn.url, undefined, "registry_search", { query }, conn.sessionId);
}

/**
 * Get trust score details for a specific agent.
 * @param {string} agentId
 * @returns {Promise<object>}
 * @throws when not connected or MCP call fails
 */
export async function registryTrust(agentId) {
  const conn = getConn();
  if (!conn) throw new Error("FleetPrompt MCP not connected");
  return await callTool(conn.url, undefined, "registry_trust", { agent_id: agentId }, conn.sessionId);
}
