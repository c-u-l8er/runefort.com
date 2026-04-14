# RFort-2: MCP Proxy + Client + Connection Panel

## Goal
Add MCP server connectivity to RuneFort. A SvelteKit server route proxies JSON-RPC to external MCP servers (avoiding CORS). A client library discovers tools and calls them. A UI panel manages connections.

## Reference Implementation
Port from these BendScript files, adapting to RuneFort's structure:
- `bendscript.com/src/routes/api/play/mcp-proxy/+server.js` — proxy route
- `bendscript.com/src/lib/play/mcp-client.js` — client library
- `bendscript.com/src/lib/play/default-servers.js` — default servers
- `bendscript.com/src/lib/play/tools.js` — MCP→OpenAI tool converter
- `bendscript.com/src/components/play/McpPanel.svelte` — connection UI

## Files to Create

### `src/routes/api/mcp-proxy/+server.js`
SvelteKit server route (POST handler). Receives:
```json
{ "serverUrl": "https://...", "authHeader": "Bearer ...", "sessionId": "...", "request": { "jsonrpc": "2.0", ... } }
```
Forwards to `serverUrl` with auth headers. Returns JSON or parses SSE.
Security: block private network addresses in production, 64KB body limit, 30s timeout.

### `src/lib/play/mcp-client.js`
Functions:
- `discoverTools(serverUrl, authHeader)` — sends `initialize` → `notifications/initialized` → `tools/list` through proxy. Returns `{ name, version, tools, sessionId }`.
- `callTool(serverUrl, authHeader, toolName, args, sessionId, signal)` — sends `tools/call` through proxy. Returns result.

All calls go through `/api/mcp-proxy` to avoid CORS.

### `src/lib/play/default-servers.js`
```js
export const DEFAULT_MCP_SERVERS = [
  { url: 'https://graphonomous-mcp.fly.dev/mcp', name: 'graphonomous', label: 'Graphonomous Memory' },
  { url: 'https://prism-eval.fly.dev/mcp', name: 'os-prism', label: 'PRISM Benchmarks' },
  { url: 'https://box-and-box-mcp.fly.dev/mcp', name: 'box-and-box', label: '[&] Protocol' },
  { url: 'https://os-pulse-mcp.fly.dev/mcp', name: 'os-pulse', label: 'PULSE Manifests' },
];
```

### `src/lib/play/tools.js`
- `mcpToolsToOpenAI(serverName, mcpTools)` — converts MCP tool schemas to OpenAI function-calling format, namespaced as `mcp__<serverName>__<toolName>`.
- `parseMcpToolName(name)` — extracts `{ serverName, toolName }` from namespaced name.
- `BUILTIN_TOOLS` array with RuneFort-specific tools:
  - `navigate_fort` — zoom to a specific level/node
  - `list_forts` — list loaded forts
  - `get_fort_info` — get current fort metadata
  - `save_blueprint` — save current fort to Supabase

### `src/lib/stores/mcp.svelte.js`
Svelte 5 rune store:
```js
let _connections = $state([]);  // { url, name, label, version, tools, openaiTools, sessionId, status }
export function getConnections() { return _connections; }
export function addConnection(conn) { ... }
export function removeConnection(name) { ... }
export function getAllTools() { return _connections.flatMap(c => c.openaiTools); }
export async function autoConnect() { /* discover defaults + saved custom */ }
```

### `src/components/app/McpPanel.svelte`
Slide-out panel (right side). Shows:
- Connected servers with tool count badges
- URL + optional auth token input for custom servers
- Connect/disconnect buttons
- Status indicators (connecting/connected/error)
- Matches RuneFort dark amber theme

## Integration Point
Add a plug/connection icon button to the `/app` toolbar. Opens McpPanel as a slide-over. Badge shows connected server count.

## Constraints
- Proxy must handle both JSON and SSE responses
- MCP JSON-RPC 2.0 protocol (initialize → notifications/initialized → tools/list)
- Session ID must persist across calls to same server
- Save custom connections to localStorage via `saveMcpConnections()`
- Auto-connect to defaults on page load
