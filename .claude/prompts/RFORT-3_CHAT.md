# RFort-3: Chat Panel with Fort-Aware Navigation

## Goal
Add a chat panel to `/app` that uses the user's OpenRouter BYOK key with a tool-use loop. The LLM can call MCP tools AND navigate the fort spatially (zoom levels, select nodes, toggle overlays).

## Reference Implementation
Port the tool-use loop from `bendscript.com/src/components/play/LlmChat.svelte`, replacing editor-specific tools with fort navigation tools.

## Prerequisites
- RFort-1 (BYOK) must be done first — provides `callOpenRouter()` and API key store
- RFort-2 (MCP) must be done first — provides MCP tool discovery and calling

## Files to Create

### `src/components/app/ChatPanel.svelte`
Slide-out panel (left side, opposite McpPanel). Svelte 5 runes.

**Layout:**
- Chat history (scrollable, auto-scroll to bottom)
- Message input with send button
- Model selector dropdown (free OpenRouter models)
- Tool call indicators (show which tools are being called)
- "No API key" state with button to open ApiKeyModal

**Tool-use loop** (max 6 rounds per message):
```
User message → buildSystemPrompt() → callOpenRouter(messages, tools)
while (response has tool_calls && rounds < 6):
  for each tool_call:
    if parseMcpToolName(name) → callTool() via MCP
    else → executeBuiltinTool()
  append tool results → callOpenRouter again
Final text → display
```

**System prompt** includes:
- Current fort state (level, fort name, node count, active overlays)
- Available tools with descriptions
- Instruction: "You are a spatial cognition assistant inside RuneFort. You can navigate the fort, query connected MCP servers, and help the user understand their system architecture."

### `src/lib/play/builtins.js`
Built-in tool definitions + executor:

```js
export const BUILTIN_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'navigate_fort',
      description: 'Navigate the fort view. Zoom to a specific level or into a specific node.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['zoom_in', 'zoom_out', 'zoom_to_level'] },
          level: { type: 'number', description: 'Target level 0-4 (L0=District, L1=Campus, L2=Wing, L3=Room, L4=Rune)' },
          nodeId: { type: 'string', description: 'Node ID to zoom into' },
          fortId: { type: 'string', description: 'Fort ID to zoom into from district view' }
        },
        required: ['action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'toggle_overlay',
      description: 'Toggle a visualization overlay lens. Available: structure, flow, thermal, temporal, diagnostic, rune, confidence, topology',
      parameters: {
        type: 'object',
        properties: {
          overlay: { type: 'string' }
        },
        required: ['overlay']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_fort_state',
      description: 'Get current fort state: zoom level, fort name, node/edge counts, active overlays',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'save_blueprint',
      description: 'Save the current fort as a blueprint to Supabase (requires auth)',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Blueprint name' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_nodes',
      description: 'List all nodes in the current fort view with their types and labels',
      parameters: { type: 'object', properties: {} }
    }
  }
];

export function executeBuiltinTool(name, args, fortState, fortActions, overlayActions) {
  // Switch on name, call appropriate store actions
  // Return JSON result
}
```

### `src/lib/stores/chat.svelte.js`
Chat message history store:
```js
let _messages = $state([]);     // { role, content, tool_calls?, tool_call_id? }
let _isLoading = $state(false);
let _model = $state('qwen/qwen3-235b-a22b');
export function getMessages() { return _messages; }
export function addMessage(msg) { ... }
export function clearMessages() { ... }
export function isLoading() { return _isLoading; }
export function setLoading(v) { _isLoading = v; }
export function getModel() { return _model; }
export function setModel(m) { _model = m; }
```

## Integration Point
Add a chat bubble icon to the `/app` toolbar (left side). Opens ChatPanel as a slide-over. The chat panel needs access to:
- Fort store (for reading state + triggering navigation)
- Overlay store (for toggling overlays)
- MCP store (for getting available tools)
- API key store (for the OpenRouter key)

## Constraints
- Max 6 tool-use rounds per message (prevent infinite loops)
- Tool name namespacing: `mcp__<serverName>__<toolName>` for MCP tools
- Built-in tools execute synchronously against fort/overlay stores
- Show tool execution status in chat UI (which tool is running)
- Markdown rendering for assistant responses (use `{@html}` with sanitization or a simple markdown renderer)
- Model selector should include free OpenRouter models: `qwen/qwen3-235b-a22b`, `deepseek/deepseek-chat-v3-0324:free`, `meta-llama/llama-4-maverick:free`
