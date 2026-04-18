/**
 * Default MCP servers for RuneFort.
 * These are the [&] ecosystem MCP servers that auto-connect on page load.
 *
 * In production (`npm run build`), the deployed Fly.io endpoints are used.
 * In dev (`import.meta.env.DEV`), localhost endpoints matching `npm run dev:all`
 * are used so the factory talks to local services instead of prod.
 */

const PROD_SERVERS = [
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

// Dev mode: only services that have local code + are started by `npm run dev:all`.
// box-and-box and os-pulse have no local counterpart, so they are omitted here.
const DEV_SERVERS = [
  {
    url: "http://localhost:4100/mcp",
    name: "graphonomous",
    label: "Graphonomous Memory (local)",
  },
  {
    url: "http://localhost:4000/mcp",
    name: "os-prism",
    label: "PRISM Benchmarks (local)",
  },
  {
    url: "http://localhost:4001/mcp",
    name: "agentelic",
    label: "Agentelic Pipeline (local)",
  },
  {
    url: "http://localhost:4002/mcp",
    name: "fleetprompt",
    label: "FleetPrompt Registry (local)",
  },
  {
    url: "http://localhost:4200/mcp",
    name: "specprompt",
    label: "SpecPrompt Standards (local)",
  },
];

export const DEFAULT_MCP_SERVERS = import.meta.env.DEV ? DEV_SERVERS : PROD_SERVERS;
