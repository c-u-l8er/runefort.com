// MCP client wrapper for SpecPrompt standards tools.
// Uses the existing MCP infrastructure (mcp-client.js + mcp store).

import { findConnection } from "$lib/stores/mcp.svelte.js";
import { callTool } from "$lib/play/mcp-client.js";

/**
 * Get the specprompt MCP connection details.
 * @returns {{ url: string, sessionId?: string } | null}
 */
function getConn() {
  const conn = findConnection("specprompt");
  if (!conn || conn.status !== "connected") return null;
  return { url: conn.url, sessionId: conn.sessionId };
}

/**
 * Validate spec markdown against the SpecPrompt standard.
 * Live tool signature: validate(content: string)
 * @param {string} content - Raw SPEC.md content
 * @returns {Promise<object>}
 * @throws when not connected or MCP call fails
 */
export async function specValidate(content) {
  const conn = getConn();
  if (!conn) throw new Error("SpecPrompt MCP not connected");
  return await callTool(conn.url, undefined, "validate", { content }, conn.sessionId);
}

/**
 * Lint a SPEC.md for best practices.
 * Live tool signature: lint(content: string)
 * @param {string} content
 * @returns {Promise<object>}
 * @throws when not connected or MCP call fails
 */
export async function specLint(content) {
  const conn = getConn();
  if (!conn) throw new Error("SpecPrompt MCP not connected");
  return await callTool(conn.url, undefined, "lint", { content }, conn.sessionId);
}

/**
 * Compare two spec versions and return structured changes.
 * Live tool signature: diff(before: string, after: string)
 * @param {string} before
 * @param {string} after
 * @returns {Promise<object>}
 * @throws when not connected or MCP call fails
 */
export async function specDiff(before, after) {
  const conn = getConn();
  if (!conn) throw new Error("SpecPrompt MCP not connected");
  return await callTool(conn.url, undefined, "diff", { before, after }, conn.sessionId);
}
