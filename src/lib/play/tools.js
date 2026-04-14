// Tool definitions and helpers for RuneFort LLM chat.
// Built-in tools run client-side; MCP tools proxy through /api/mcp-proxy.

/**
 * Built-in RuneFort tools (always available).
 * Uses OpenAI-compatible tool calling format for OpenRouter.
 */
export const BUILTIN_TOOLS = [
  {
    type: "function",
    function: {
      name: "navigate_fort",
      description:
        "Navigate the fort view. Zoom to a specific level or into a specific node.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["zoom_in", "zoom_out", "zoom_to_level"],
          },
          level: {
            type: "number",
            description:
              "Target level 0-4 (L0=District, L1=Campus, L2=Wing, L3=Room, L4=Rune)",
          },
          nodeId: { type: "string", description: "Node ID to zoom into" },
          fortId: {
            type: "string",
            description: "Fort ID to zoom into from district view",
          },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_forts",
      description: "List all loaded forts in the current district view.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_fort_info",
      description:
        "Get current fort metadata: zoom level, fort name, node/edge counts, active overlays.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "save_blueprint",
      description: "Save the current fort as a blueprint to Supabase (requires auth).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Blueprint name" },
        },
      },
    },
  },
];

/**
 * Convert MCP server tools to OpenAI-compatible tool definitions.
 * @param {string} serverName - Server name for namespacing
 * @param {Array} mcpTools - Tools from MCP tools/list response
 * @returns {Array} OpenAI-format tool definitions
 */
export function mcpToolsToOpenAI(serverName, mcpTools) {
  return mcpTools.map((t) => ({
    type: "function",
    function: {
      name: `mcp__${serverName}__${t.name}`,
      description: t.description || `MCP tool: ${t.name}`,
      parameters: t.inputSchema || { type: "object", properties: {} },
    },
  }));
}

/**
 * Parse MCP tool name from namespaced format.
 * @param {string} name - e.g. "mcp__graphonomous__retrieve"
 * @returns {{ serverName: string, toolName: string } | null}
 */
export function parseMcpToolName(name) {
  const match = name.match(/^mcp__(.+?)__(.+)$/);
  if (!match) return null;
  return { serverName: match[1], toolName: match[2] };
}
