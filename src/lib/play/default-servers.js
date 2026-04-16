/**
 * Default MCP servers for RuneFort.
 * These are the [&] ecosystem MCP servers deployed to Fly.io.
 * They auto-connect on page load.
 */
export const DEFAULT_MCP_SERVERS = [
  {
    url: "https://graphonomous-mcp.fly.dev/mcp",
    name: "graphonomous",
    label: "Graphonomous Memory",
  },
  {
    url: "https://prism-eval.fly.dev/mcp",
    name: "os-prism",
    label: "PRISM Benchmarks",
  },
  {
    url: "https://box-and-box-mcp.fly.dev/mcp",
    name: "box-and-box",
    label: "[&] Protocol",
  },
  {
    url: "https://os-pulse-mcp.fly.dev/mcp",
    name: "os-pulse",
    label: "PULSE Manifests",
  },
  {
    url: "https://app.agentelic.com/mcp",
    name: "agentelic",
    label: "Agentelic Pipeline",
  },
  {
    url: "https://app.fleetprompt.com/mcp",
    name: "fleetprompt",
    label: "FleetPrompt Registry",
  },
  {
    url: "https://app.specprompt.com/mcp",
    name: "specprompt",
    label: "SpecPrompt Standards",
  },
];
