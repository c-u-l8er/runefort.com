// Svelte 5 rune store for MCP server connections.

import { discoverTools } from "$lib/play/mcp-client.js";
import { DEFAULT_MCP_SERVERS } from "$lib/play/default-servers.js";
import { mcpToolsToOpenAI } from "$lib/play/tools.js";
import { loadMcpConnections, saveMcpConnections } from "$lib/play/storage.js";

/**
 * @typedef {{ url: string, name: string, label: string, version?: string, tools: Array, openaiTools: Array, sessionId?: string, status: 'connecting'|'connected'|'error', error?: string }} McpConnection
 */

/** @type {McpConnection[]} */
let _connections = $state([]);

export function getConnections() {
  return _connections;
}

/**
 * Add or update a connection.
 * @param {McpConnection} conn
 */
export function addConnection(conn) {
  const idx = _connections.findIndex((c) => c.name === conn.name);
  if (idx >= 0) {
    _connections[idx] = conn;
  } else {
    _connections.push(conn);
  }
}

/**
 * Remove a connection by name.
 * @param {string} name
 */
export function removeConnection(name) {
  _connections = _connections.filter((c) => c.name !== name);
}

/**
 * Get all OpenAI-format tools from connected servers.
 * @returns {Array}
 */
export function getAllTools() {
  return _connections
    .filter((c) => c.status === "connected")
    .flatMap((c) => c.openaiTools);
}

/**
 * Find a connection by server name.
 * @param {string} name
 * @returns {McpConnection | undefined}
 */
export function findConnection(name) {
  return _connections.find((c) => c.name === name);
}

/**
 * Connect to a single MCP server.
 * @param {{ url: string, name: string, label: string, authHeader?: string }} server
 */
export async function connectServer(server) {
  addConnection({
    url: server.url,
    name: server.name,
    label: server.label,
    tools: [],
    openaiTools: [],
    status: "connecting",
  });

  try {
    const result = await discoverTools(server.url, server.authHeader);
    const openaiTools = mcpToolsToOpenAI(server.name, result.tools);
    addConnection({
      url: server.url,
      name: server.name,
      label: server.label,
      version: result.version,
      tools: result.tools,
      openaiTools,
      sessionId: result.sessionId,
      status: "connected",
    });
  } catch (err) {
    addConnection({
      url: server.url,
      name: server.name,
      label: server.label,
      tools: [],
      openaiTools: [],
      status: "error",
      error: err.message,
    });
  }
}

/**
 * Auto-connect to default servers + saved custom connections.
 */
export async function autoConnect() {
  const saved = loadMcpConnections();
  const allServers = [
    ...DEFAULT_MCP_SERVERS,
    ...saved
      .filter((s) => !DEFAULT_MCP_SERVERS.some((d) => d.url === s.url))
      .map((s) => ({ url: s.url, name: s.url, label: s.url, authHeader: s.authHeader })),
  ];

  await Promise.allSettled(allServers.map((s) => connectServer(s)));
}

/**
 * Save current custom connections to localStorage.
 */
export function saveCustomConnections() {
  const custom = _connections
    .filter((c) => !DEFAULT_MCP_SERVERS.some((d) => d.url === c.url))
    .map((c) => ({ url: c.url, authHeader: undefined }));
  saveMcpConnections(custom);
}

/**
 * Get count of connected servers.
 * @returns {number}
 */
export function connectedCount() {
  return _connections.filter((c) => c.status === "connected").length;
}
