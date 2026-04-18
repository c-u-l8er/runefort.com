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
  {
    type: "function",
    function: {
      name: "toggle_overlay",
      description:
        "Toggle a visualization overlay lens on the fort view.",
      parameters: {
        type: "object",
        properties: {
          overlay: {
            type: "string",
            description: "Overlay key to toggle (e.g. flow, thermal, confidence, topology, dependency, risk, kappa)",
          },
        },
        required: ["overlay"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "start_benchmark",
      description:
        "Start a token flow benchmark visualization. Animates particles flowing along edges to show token throughput, latency, and concurrency.",
      parameters: {
        type: "object",
        properties: {
          edgeId: {
            type: "string",
            description: "Specific edge ID to animate (omit to animate all edges)",
          },
          tokensPerSecond: {
            type: "number",
            description: "Token throughput (default 50)",
          },
          latencyMs: {
            type: "number",
            description: "Latency in ms — affects color: <200 green, <1000 amber, else red (default 300)",
          },
          concurrency: {
            type: "number",
            description: "Number of concurrent particles per edge (default 3, max 8)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "stop_benchmark",
      description: "Stop all token flow animations.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "spawn_team",
      description:
        "Spawn a team of worker sessions that share a fort context. Each member gets its own model and MCP allowlist. The current session stays focused — the user can switch to any team member from the session rail. Use this to parallelize work across specialists (e.g. 'architect', 'builder', 'reviewer').",
      parameters: {
        type: "object",
        properties: {
          members: {
            type: "array",
            description: "Team members to spawn. At least one required.",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Display name for the session" },
                role: { type: "string", description: "Functional role, e.g. 'architect', 'builder', 'reviewer'" },
                model: { type: "string", description: "OpenRouter model id (optional — inherits default)" },
                mcpAllowlist: {
                  type: "array",
                  items: { type: "string" },
                  description: "MCP server names this member can see. Omit for all; [] for none.",
                },
              },
              required: ["name"],
            },
          },
          fortId: {
            type: "string",
            description: "Fort context shared by all team members. Defaults to current active fort.",
          },
        },
        required: ["members"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "trigger_build",
      description:
        "Trigger an Agentelic build pipeline for a fort (the R! button, via API). Resolves the fort slug to an agent, runs agent_build with an inline PULSE/spec, and returns the build handle. Use sparingly — this invokes the dark factory.",
      parameters: {
        type: "object",
        properties: {
          fortId: {
            type: "string",
            description:
              "Fort ID (e.g. 'graphonomous', 'owner/repo'). Defaults to the currently active fort if omitted.",
          },
          spec: {
            type: "string",
            description:
              "Optional inline spec content (markdown). If omitted a placeholder spec is generated from the fortId.",
          },
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
