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
 * @returns {Promise<object>}
 * @throws when not connected or MCP call fails
 */
export async function agentStatus(agentId) {
  const conn = getConn();
  if (!conn) throw new Error("Agentelic MCP not connected");
  return await callTool(conn.url, undefined, "agent_status", { agent_id: agentId }, conn.sessionId);
}

/**
 * Trigger a build for an agent. Optional inline spec_content is forwarded to
 * the server so builds work even when agent.spec_path doesn't resolve on the
 * build host filesystem.
 * @param {string} agentId
 * @param {string} [specContent]
 * @returns {Promise<object>}
 * @throws when not connected or MCP call fails
 */
export async function agentBuild(agentId, specContent) {
  const conn = getConn();
  if (!conn) throw new Error("Agentelic MCP not connected");
  const args = { agent_id: agentId };
  if (specContent) args.spec_content = specContent;
  return await callTool(conn.url, undefined, "agent_build", args, conn.sessionId);
}

/**
 * Find-or-create an Agentelic agent by (workspace_id, slug).
 * Returns the agent_id as a UUID so downstream tools (agent_build, agent_status,
 * agent_deploy) can be called by id.
 *
 * @param {{
 *   name?: string,
 *   slug: string,
 *   framework?: string,
 *   productType?: string,
 *   specPath?: string,
 *   workspaceId: string,
 *   userId: string
 * }} opts
 * @returns {Promise<{ agent_id: string, slug: string, status: string, created: boolean }>}
 */
export async function agentEnsure(opts) {
  const conn = getConn();
  if (!conn) throw new Error("Agentelic MCP not connected");
  const args = {
    name: opts.name || opts.slug,
    slug: opts.slug,
    framework: opts.framework || "elixir",
    product_type: opts.productType || "agent",
    spec_path: opts.specPath || "inline",
    workspace_id: opts.workspaceId,
    user_id: opts.userId,
  };
  const result = await callTool(conn.url, undefined, "agent_ensure", args, conn.sessionId);
  // Agentelic returns the raw result map directly. If an MCP-compliant server
  // ever wraps it in content[].text, handle that too.
  const text = result?.content?.[0]?.text;
  return text ? JSON.parse(text) : result;
}

/**
 * List available templates by framework and product type.
 * @param {string} [framework]
 * @param {string} [productType]
 * @returns {Promise<object>}
 * @throws when not connected or MCP call fails
 */
export async function templateList(framework, productType) {
  const conn = getConn();
  if (!conn) throw new Error("Agentelic MCP not connected");
  const args = {};
  if (framework) args.framework = framework;
  if (productType) args.product_type = productType;
  return await callTool(conn.url, undefined, "template_list", args, conn.sessionId);
}
