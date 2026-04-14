<script>
  import { callOpenRouter } from "$lib/play/openrouter.js";
  import { callTool } from "$lib/play/mcp-client.js";
  import { BUILTIN_TOOLS, parseMcpToolName } from "$lib/play/tools.js";
  import { executeBuiltinTool } from "$lib/play/builtins.js";
  import { getApiKey } from "$lib/stores/apikey.svelte.js";
  import { getConnections, getAllTools as getMcpTools } from "$lib/stores/mcp.svelte.js";
  import { getFort, zoomIntoFort, zoomIntoRoom, zoomIntoNode, zoomIntoRune, zoomOut, setZoomLevel } from "$lib/stores/fort.svelte.js";
  import { toggleOverlay, activeOverlayKeys } from "$lib/stores/overlays.svelte.js";
  import { getChat, addMessage, setLoading, setModel } from "$lib/stores/chat.svelte.js";

  let { open = false, onclose, onRequestKey } = $props();

  let input = $state("");
  let messagesEl = $state(null);

  const fort = getFort();
  const chat = getChat();
  const connections = getConnections();

  const FREE_MODELS = [
    { id: "qwen/qwen3-235b-a22b", label: "Qwen3 235B" },
    { id: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek V3" },
    { id: "meta-llama/llama-4-maverick:free", label: "Llama 4 Maverick" },
  ];

  const LEVEL_NAMES = ["District", "Campus", "Wing", "Room", "Rune"];

  function getAllTools() {
    return [...BUILTIN_TOOLS, ...getMcpTools()];
  }

  function buildSystemPrompt() {
    const toolSummary = getAllTools()
      .map((t) => `- ${t.function.name}: ${t.function.description}`)
      .join("\n");

    const overlays = Array.from(activeOverlayKeys());

    return `You are a spatial cognition assistant inside RuneFort. You can navigate the fort, query connected MCP servers, and help the user understand their system architecture.

CURRENT FORT STATE:
- Zoom level: L${fort.zoomLevel} (${LEVEL_NAMES[fort.zoomLevel]})
- Fort name: ${fort.fortName}
- Active fort: ${fort.activeFortId || "none"}
- Active room: ${fort.activeRoomId || "none"}
- Nodes: ${fort.nodes.length}, Edges: ${fort.edges.length}
- Active overlays: ${overlays.length > 0 ? overlays.join(", ") : "structure only"}

RULES:
- Always call tools first, then summarize results. Never describe what you "would" do.
- Be efficient: call multiple tools in parallel when possible.
- Keep responses concise — show key data, not raw JSON dumps.
- Your final response must always be a finished answer, not a promise of future work.
- For fort navigation: use navigate_fort tool to zoom in/out/to levels.
- For overlays: use toggle_overlay to switch visualization lenses.

GRAPHONOMOUS QUERIES:
- Search knowledge: mcp__graphonomous__retrieve with action="context", query="..."
- Graph health: mcp__graphonomous__consolidate with action="stats"
- Store knowledge: mcp__graphonomous__act with action="store_node"

Available tools:
${toolSummary}`;
  }

  async function executeTool(name, args) {
    const mcpInfo = parseMcpToolName(name);
    if (mcpInfo) {
      const conn = connections.find((c) => c.name === mcpInfo.serverName);
      if (!conn) throw new Error(`MCP server "${mcpInfo.serverName}" not connected`);
      return await callTool(conn.url, undefined, mcpInfo.toolName, args, conn.sessionId);
    }

    return executeBuiltinTool(name, args, {
      fortState: fort,
      fortActions: { zoomIntoFort, zoomIntoRoom, zoomIntoNode, zoomIntoRune, zoomOut, setZoomLevel },
      overlayActions: { toggleOverlay, activeOverlayKeys },
    });
  }

  async function sendMessage() {
    if (!input.trim()) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      onRequestKey();
      return;
    }

    const userMsg = { role: "user", content: input.trim() };
    addMessage(userMsg);
    input = "";
    setLoading(true);
    scrollToBottom();

    try {
      const VALID_ROLES = new Set(["user", "assistant", "system", "tool"]);
      const apiMessages = [
        { role: "system", content: buildSystemPrompt() },
        ...chat.messages.filter((m) => VALID_ROLES.has(m.role)),
      ];

      const MAX_ROUNDS = 6;
      const allTools = getAllTools();
      let data = await callOpenRouter(apiKey, apiMessages, allTools, chat.model);
      let msg = data.choices?.[0]?.message;

      let rounds = 0;
      while (msg?.tool_calls?.length > 0 && rounds < MAX_ROUNDS) {
        rounds++;

        const toolNames = msg.tool_calls.map((tc) => tc.function.name);
        addMessage({ role: "tool-status", content: `Calling: ${toolNames.join(", ")}` });
        scrollToBottom();

        apiMessages.push(msg);

        for (const tc of msg.tool_calls) {
          let result;
          try {
            const args = typeof tc.function.arguments === "string"
              ? JSON.parse(tc.function.arguments)
              : tc.function.arguments || {};
            const toolResult = await executeTool(tc.function.name, args);
            result = typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult);
          } catch (err) {
            result = JSON.stringify({ error: err.message });
          }
          apiMessages.push({ role: "tool", tool_call_id: tc.id, content: result });
        }

        const allowMoreTools = rounds < MAX_ROUNDS - 1;
        if (!allowMoreTools) {
          apiMessages.push({
            role: "system",
            content: "This is your final response. Summarize all results. Give a complete, finished answer.",
          });
        }
        data = await callOpenRouter(apiKey, apiMessages, allowMoreTools ? allTools : undefined, chat.model);
        msg = data.choices?.[0]?.message;
      }

      let reply = msg?.content ?? "";
      if (!reply.trim()) {
        reply = rounds > 0
          ? "Tool calls complete. Ask a follow-up for details."
          : "No response received.";
      }
      addMessage({ role: "assistant", content: reply });
    } catch (err) {
      addMessage({ role: "assistant", content: `Request failed: ${err.message}` });
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function handleKeydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === "Escape") {
      onclose();
    }
  }

  function handleModelChange(e) {
    setModel(e.target.value);
  }
</script>

{#if open}
  <div class="panel-backdrop" onclick={onclose}>
    <aside class="panel" onclick={(e) => e.stopPropagation()}>
      <div class="panel-header">
        <h3>Chat</h3>
        <div class="header-right">
          <select class="model-select" value={chat.model} onchange={handleModelChange}>
            {#each FREE_MODELS as m}
              <option value={m.id}>{m.label}</option>
            {/each}
          </select>
          <button class="panel-close" onclick={onclose}>&times;</button>
        </div>
      </div>

      {#if !getApiKey()}
        <div class="chat-empty">
          <p>Set an <b>OpenRouter API key</b> to enable chat.</p>
          <p class="hint">Default model: <code>qwen/qwen3-235b-a22b</code> (free)</p>
          <button class="set-key-btn" onclick={onRequestKey}>Set API Key</button>
        </div>
      {:else}
        <div class="chat-messages" bind:this={messagesEl}>
          {#each chat.messages as msg}
            {#if msg.role === "tool-status"}
              <div class="chat-msg tool-status">
                <span class="tool-label">{msg.content}</span>
              </div>
            {:else if msg.role === "user"}
              <div class="chat-msg user">
                <span class="role-label">You</span>
                <span class="msg-content">{msg.content}</span>
              </div>
            {:else if msg.role === "assistant"}
              <div class="chat-msg assistant">
                <span class="role-label">AI</span>
                <span class="msg-content">{msg.content}</span>
              </div>
            {/if}
          {/each}
          {#if chat.isLoading}
            <div class="chat-msg assistant">
              <span class="role-label">AI</span>
              <span class="msg-content loading">Thinking...</span>
            </div>
          {/if}
        </div>

        <div class="chat-input-bar">
          <textarea
            class="chat-input"
            placeholder="Ask about forts, MCP tools, architecture..."
            bind:value={input}
            onkeydown={handleKeydown}
            rows="2"
          ></textarea>
          <button
            class="send-btn"
            onclick={sendMessage}
            disabled={chat.isLoading || !input.trim()}
          >
            Send
          </button>
        </div>
      {/if}
    </aside>
  </div>
{/if}

<style>
  .panel-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000;
  }
  .panel {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 380px;
    max-width: 90vw;
    background: #0e0f14;
    border-right: 1px solid rgba(232, 168, 76, 0.15);
    display: flex;
    flex-direction: column;
    z-index: 1001;
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .panel-header h3 {
    font-family: "Cinzel", serif;
    font-size: 0.85rem;
    font-weight: 500;
    color: #e4e2dc;
    margin: 0;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .model-select {
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    color: #7a7770;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    padding: 0.25rem 0.4rem;
    outline: none;
    cursor: pointer;
  }
  .model-select:focus { border-color: rgba(232, 168, 76, 0.4); }
  .panel-close {
    background: transparent;
    border: none;
    color: #7a7770;
    font-size: 1.2rem;
    cursor: pointer;
  }
  .panel-close:hover { color: #e4e2dc; }

  /* Empty state */
  .chat-empty {
    padding: 2rem 1.25rem;
    text-align: center;
  }
  .chat-empty p {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    color: #7a7770;
    margin: 0 0 0.5rem;
    line-height: 1.5;
  }
  .chat-empty b { color: #e4e2dc; }
  .chat-empty code {
    font-size: 0.55rem;
    padding: 1px 4px;
    border-radius: 3px;
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
  .set-key-btn {
    margin-top: 0.75rem;
    padding: 0.5rem 1.25rem;
    background: #e8a84c;
    color: #09090d;
    border: none;
    border-radius: 6px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
  }
  .set-key-btn:hover { box-shadow: 0 4px 16px rgba(232, 168, 76, 0.3); }

  /* Messages */
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .chat-msg {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0.5rem 0.6rem;
    border-radius: 6px;
    font-size: 0.7rem;
    line-height: 1.5;
  }
  .chat-msg.user {
    background: rgba(232, 168, 76, 0.06);
  }
  .chat-msg.assistant {
    background: #15161d;
  }
  .chat-msg.tool-status {
    background: rgba(139, 92, 246, 0.06);
    border: 1px solid rgba(139, 92, 246, 0.15);
    padding: 0.3rem 0.6rem;
  }
  .role-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    font-weight: 700;
    color: #7a7770;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .tool-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    font-weight: 600;
    color: #8b5cf6;
    font-style: italic;
  }
  .msg-content {
    color: #e4e2dc;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .msg-content.loading {
    color: #7a7770;
    font-style: italic;
  }

  /* Input */
  .chat-input-bar {
    display: flex;
    align-items: flex-end;
    gap: 0.4rem;
    padding: 0.6rem 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  .chat-input {
    flex: 1;
    resize: none;
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    color: #e4e2dc;
    padding: 0.5rem 0.6rem;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.7rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .chat-input:focus { border-color: rgba(232, 168, 76, 0.4); }
  .chat-input::placeholder { color: #44423d; }
  .send-btn {
    padding: 0.5rem 0.85rem;
    background: #e8a84c;
    color: #09090d;
    border: none;
    border-radius: 6px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }
  .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .send-btn:hover:not(:disabled) { box-shadow: 0 2px 8px rgba(232, 168, 76, 0.3); }
</style>
