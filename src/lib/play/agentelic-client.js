// MCP client wrapper for Agentelic pipeline tools.
// Uses the existing MCP infrastructure (mcp-client.js + mcp store).

import { findConnection } from "$lib/stores/mcp.svelte.js";
import { callTool } from "$lib/play/mcp-client.js";

/**
 * Get the agentelic MCP connection details.
 * @returns {{ url: string, sessionId?: string } | null}
 */
function getConn() {
  const conn = findConnection("agentelic");
  if (!conn || conn.status !== "connected") return null;
  return { url: conn.url, sessionId: conn.sessionId };
}

/**
 * Get build status, test results, and deploy stage for an agent.
 * @param {string} agentId
 * @returns {Promise<object|null>}
 */
export async function agentStatus(agentId) {
  const conn = getConn();
  if (!conn) return null;
  try {
    return await callTool(conn.url, undefined, "agent_status", { agent_id: agentId }, conn.sessionId);
  } catch {
    return null;
  }
}

/**
 * Trigger a build for an agent.
 * @param {string} agentId
 * @returns {Promise<object|null>}
 */
export async function agentBuild(agentId) {
  const conn = getConn();
  if (!conn) return null;
  try {
    return await callTool(conn.url, undefined, "agent_build", { agent_id: agentId }, conn.sessionId);
  } catch {
    return null;
  }
}

/**
 * List available templates by framework and product type.
 * @param {string} [framework]
 * @param {string} [productType]
 * @returns {Promise<object|null>}
 */
export async function templateList(framework, productType) {
  const conn = getConn();
  if (!conn) return null;
  const args = {};
  if (framework) args.framework = framework;
  if (productType) args.product_type = productType;
  try {
    return await callTool(conn.url, undefined, "template_list", args, conn.sessionId);
  } catch {
    return null;
  }
}
