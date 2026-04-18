<script>
  import { callOpenRouter } from "$lib/play/openrouter.js";
  import { callTool } from "$lib/play/mcp-client.js";
  import { BUILTIN_TOOLS, parseMcpToolName } from "$lib/play/tools.js";
  import { executeBuiltinTool } from "$lib/play/builtins.js";
  import { getApiKey } from "$lib/stores/apikey.svelte.js";
  import { getConnections, getAllTools as getAllMcpTools } from "$lib/stores/mcp.svelte.js";
  import { getAuth, openAuthModal } from "$lib/stores/auth.svelte.js";
  import { getActiveWorkspace } from "$lib/stores/workspace.svelte.js";
  import { getFort, zoomIntoFort, zoomIntoRoom, zoomIntoNode, zoomIntoRune, zoomOut, setZoomLevel } from "$lib/stores/fort.svelte.js";
  import { toggleOverlay, activeOverlayKeys } from "$lib/stores/overlays.svelte.js";
  import {
    getChat, addMessage, setLoading, setModel,
    getSessions, getCurrentSessionId, newSession, selectSession, deleteSession, renameSession,
    isMcpAllowed, toggleMcpAllowed, allowAllMcps,
  } from "$lib/stores/chat.svelte.js";
  import { MODEL_CATALOG, searchModels, findModel, DEFAULT_MODEL_ID } from "$lib/play/models.js";

  /** @type {{ open?: boolean, onclose?: () => void, onRequestKey?: () => void }} */
  let { open = false, onclose = () => {}, onRequestKey = () => {} } = $props();

  let input = $state("");
  let messagesEl = $state(/** @type {HTMLElement|null} */ (null));
  let modelPickerOpen = $state(false);
  let modelQuery = $state("");
  let renamingId = $state(/** @type {string|null} */ (null));
  let renameDraft = $state("");

  const fort = getFort();
  const chat = getChat();
  const connections = getConnections();

  const LEVEL_NAMES = ["District", "Campus", "Wing", "Room", "Rune"];

  // Agentelic mutation tools that MUST route through the `trigger_build`
  // built-in (which resolves workspace_id / user_id properly). Hiding them
  // from the model prevents hallucinated-UUID failures like
  // "missing valid user identification".
  const HIDDEN_MCP_TOOLS = new Set([
    "mcp__agentelic__agent_ensure",
    "mcp__agentelic__agent_build",
    "mcp__agentelic__agent_deploy",
  ]);

  // ── Tool filtering: session's MCP allowlist controls which MCPs the
  //    agent can see this turn. Built-ins are always on.
  function getAllTools() {
    const allMcp = getAllMcpTools();
    const filteredMcp = allMcp.filter((t) => {
      if (HIDDEN_MCP_TOOLS.has(t.function.name)) return false;
      const parsed = parseMcpToolName(t.function.name);
      return parsed ? isMcpAllowed(parsed.serverName) : true;
    });
    return [...BUILTIN_TOOLS, ...filteredMcp];
  }

  function buildSystemPrompt() {
    const toolSummary = getAllTools()
      .map((t) => `- ${t.function.name}: ${t.function.description}`)
      .join("\n");

    const overlays = Array.from(activeOverlayKeys());

    const auth = getAuth();
    const workspace = getActiveWorkspace();
    const signedIn = !!auth?.user?.id;
    const workspaceLine = workspace
      ? `${workspace.name} (id: ${workspace.id})`
      : signedIn
        ? "none (user has no workspace yet — trigger_build will auto-create one)"
        : "none (user is NOT signed in)";

    return `You are a spatial cognition assistant inside RuneFort. You can navigate the fort, query connected MCP servers, and help the user understand their system architecture.

CURRENT FORT VIEW STATE (UI — distinct from Graphonomous memory):
- Zoom level: L${fort.zoomLevel} (${LEVEL_NAMES[fort.zoomLevel]})
- Fort name: ${fort.fortName}
- Active fort: ${fort.activeFortId || "none"}
- Active room: ${fort.activeRoomId || "none"}
- Nodes in view: ${fort.nodes.length}, Edges in view: ${fort.edges.length}
- Active overlays: ${overlays.length > 0 ? overlays.join(", ") : "structure only"}

SESSION CONTEXT:
- Signed in: ${signedIn ? "yes" : "NO — user must sign in before workspace/factory operations"}
- Active workspace: ${workspaceLine}

HARD RULES:
- Output ONLY prose + real tool_calls. NEVER render tool calls as text, markdown code blocks, or \`tool_code\` fences. If you want to call a tool, call it through the tool-calls mechanism — do not describe or pretend to call it in prose.
- NEVER fabricate node IDs, agent IDs, UUIDs, or tool results. If you don't know a value, call a tool to get it or ask the user.
- Fort view state (above) is NOT the same as Graphonomous memory. Nodes retrieved from graphonomous are knowledge — they are NOT the current fort layout. Do not narrate fort navigation based on memory search results.
- Always call tools first, then summarize actual results. Never describe what you "would" do.
- Be efficient: call multiple tools in parallel when possible.
- Keep responses concise — show key data, not raw JSON dumps.
- Your final response must always be a finished answer, not a promise of future work.

WORKSPACE / FACTORY / BUILD REQUESTS:
- For ANY request about starting a workspace, creating a factory, triggering a build, or spinning up an agent, use the \`trigger_build\` built-in tool. It resolves workspace_id / user_id automatically and auto-creates a personal workspace for signed-in users.
- Do NOT call agentelic tools directly. You will not see \`agent_ensure\`, \`agent_build\`, or \`agent_deploy\` in the tool list — this is intentional. Route everything through \`trigger_build\`.
- If the user is not signed in, tell them to sign in first. Do not attempt \`trigger_build\`.
- AFTER a successful \`trigger_build\`, always tell the user where to find their new workspace and fort:
  1. The workspace switcher (top-left rune button) — click it to see the new workspace and switch into it.
  2. The Factory panel (opens from the toolbar) — shows live build progress for the agent.
  3. The fort dropdown under the active workspace — the new fort appears there once build completes.
  The tool result includes a \`hint\` field; surface that guidance to the user.

NAVIGATION:
- Use \`navigate_fort\` to zoom in/out/to levels — but only based on real fort state above.
- Use \`toggle_overlay\` to switch visualization lenses.

GRAPHONOMOUS QUERIES (if mcp__graphonomous__* tools are allowed):
- Search knowledge: mcp__graphonomous__retrieve with action="context", query="..."
- Graph health: mcp__graphonomous__consolidate with action="stats"
- Store knowledge: mcp__graphonomous__act with action="store_node"

Available tools:
${toolSummary}`;
  }

  async function executeTool(name, args) {
    // Refuse hidden mutation tools even if the model hallucinates them.
    if (HIDDEN_MCP_TOOLS.has(name)) {
      return JSON.stringify({
        error: `Tool "${name}" is not available. Use the built-in \`trigger_build\` tool instead — it handles workspace/user resolution correctly.`,
      });
    }

    const mcpInfo = parseMcpToolName(name);
    if (mcpInfo) {
      if (!isMcpAllowed(mcpInfo.serverName)) {
        return JSON.stringify({ error: `MCP server "${mcpInfo.serverName}" is disabled for this session` });
      }
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

  // Pre-flight check: if the user's message looks like a workspace/factory/
  // build request and they aren't signed in, surface a clear message instead
  // of letting the LLM hit Agentelic with hallucinated UUIDs.
  function needsAuthForMessage(text) {
    const t = text.toLowerCase();
    return /\b(workspace|factory|build|agent|trigger_build|spawn|r!)\b/.test(t);
  }

  async function sendMessage() {
    if (!input.trim()) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      onRequestKey();
      return;
    }

    const auth = getAuth();
    if (!auth?.user?.id && needsAuthForMessage(input)) {
      addMessage({ role: "user", content: input.trim() });
      addMessage({
        role: "assistant",
        content: "You need to sign in before starting a workspace or factory build. Open the auth modal, sign in, and try again.",
      });
      input = "";
      scrollToBottom();
      openAuthModal();
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
      if (modelPickerOpen) { modelPickerOpen = false; return; }
      onclose();
    }
  }

  function handleNewSession() {
    newSession({ name: `Session ${getSessions().length + 1}`, fortContextId: fort.activeFortId });
  }

  function handleSelectSession(id) {
    selectSession(id);
  }

  function handleDeleteSession(id, e) {
    e.stopPropagation();
    if (confirm("Delete this session? Messages can't be recovered.")) {
      deleteSession(id);
    }
  }

  function startRename(id, currentName, e) {
    e.stopPropagation();
    renamingId = id;
    renameDraft = currentName;
  }

  function commitRename() {
    if (renamingId) {
      renameSession(renamingId, renameDraft);
      renamingId = null;
      renameDraft = "";
    }
  }

  function cancelRename() {
    renamingId = null;
    renameDraft = "";
  }

  function pickModel(id) {
    setModel(id);
    modelPickerOpen = false;
    modelQuery = "";
  }

  function handleCustomModel(e) {
    if (e.key === "Enter" && modelQuery.trim() && !searchModels(modelQuery).length) {
      pickModel(modelQuery.trim());
    }
  }

  // Relative time formatter for session rail.
  function relTime(ts) {
    const d = Date.now() - ts;
    if (d < 60_000) return "now";
    if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
    if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h`;
    return `${Math.floor(d / 86_400_000)}d`;
  }

  // Reactive derivations
  let sessions = $derived(getSessions());
  let currentId = $derived(getCurrentSessionId());
  let connectedMcps = $derived(connections.filter((c) => c.status === "connected"));
  let modelEntry = $derived(findModel(chat.model));
  let filteredModels = $derived(searchModels(modelQuery));
</script>

{#if open}
  <div class="panel-backdrop" onclick={onclose}>
    <aside class="panel" onclick={(e) => e.stopPropagation()}>
      <!-- Session rail -->
      <div class="session-rail">
        <div class="rail-header">
          <span class="rail-title">Sessions</span>
          <button class="new-session-btn" onclick={handleNewSession} title="New session">+</button>
        </div>
        <div class="session-list">
          {#each sessions as s (s.id)}
            <div
              class="session-item"
              class:active={s.id === currentId}
              onclick={() => handleSelectSession(s.id)}
              role="button"
              tabindex="0"
              onkeydown={(e) => e.key === "Enter" && handleSelectSession(s.id)}
            >
              {#if renamingId === s.id}
                <input
                  class="rename-input"
                  value={renameDraft}
                  oninput={(e) => renameDraft = /** @type {HTMLInputElement} */ (e.target).value}
                  onblur={commitRename}
                  onkeydown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") cancelRename(); }}
                  onclick={(e) => e.stopPropagation()}
                />
              {:else}
                <button
                  class="session-name"
                  onclick={(e) => startRename(s.id, s.name, e)}
                  title="Click to rename"
                >{s.name}</button>
              {/if}
              <div class="session-meta">
                {#if s.teamId}
                  <span class="team-chip" title="Team: {s.teamId.slice(0, 8)} · role: {s.role || 'member'}">
                    {s.role || "member"}
                  </span>
                {/if}
                <span class="session-time">{relTime(s.updatedAt)}</span>
                <button class="session-delete" onclick={(e) => handleDeleteSession(s.id, e)} title="Delete session">×</button>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Main conversation column -->
      <div class="conv-col">
        <div class="panel-header">
          <h3>Chat</h3>
          <div class="header-right">
            <button class="model-pill" onclick={() => modelPickerOpen = !modelPickerOpen} title="Change model">
              <span class="tier-chip tier-{modelEntry.tier}">{modelEntry.tier[0].toUpperCase()}</span>
              <span class="model-label">{modelEntry.label}</span>
              <span class="caret">▾</span>
            </button>
            <button class="panel-close" onclick={onclose}>&times;</button>
          </div>
        </div>

        {#if modelPickerOpen}
          <div class="model-picker">
            <input
              class="model-search"
              placeholder="Search models — or type a custom OpenRouter id and press Enter"
              value={modelQuery}
              oninput={(e) => modelQuery = /** @type {HTMLInputElement} */ (e.target).value}
              onkeydown={handleCustomModel}
            />
            <div class="model-list">
              {#each filteredModels as m (m.id)}
                <button
                  class="model-row"
                  class:selected={m.id === chat.model}
                  onclick={() => pickModel(m.id)}
                >
                  <span class="tier-chip tier-{m.tier}">{m.tier}</span>
                  <span class="model-row-label">{m.label}</span>
                  {#if m.note}
                    <span class="model-row-note">{m.note}</span>
                  {/if}
                  <span class="model-row-id">{m.id}</span>
                </button>
              {/each}
              {#if filteredModels.length === 0}
                <div class="model-empty">
                  no match — press Enter to use <code>{modelQuery}</code>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        {#if !getApiKey()}
          <div class="chat-empty">
            <p>Set an <b>OpenRouter API key</b> to enable chat.</p>
            <p class="hint">Default model: <code>{DEFAULT_MODEL_ID}</code> (free)</p>
            <button class="set-key-btn" onclick={onRequestKey}>Set API Key</button>
          </div>
        {:else}
          <!-- MCP allowlist chip row -->
          {#if connectedMcps.length > 0}
            <div class="mcp-chips">
              <span class="mcp-chips-label">MCPs:</span>
              {#each connectedMcps as c (c.name)}
                <button
                  class="mcp-chip"
                  class:enabled={isMcpAllowed(c.name)}
                  onclick={() => toggleMcpAllowed(c.name)}
                  title="{isMcpAllowed(c.name) ? 'Enabled — click to disable' : 'Disabled — click to enable'} for this session"
                >
                  {c.label}
                </button>
              {/each}
              <button class="mcp-chip mcp-all" onclick={allowAllMcps} title="Reset to all allowed">all</button>
            </div>
          {/if}

          <div class="chat-messages" bind:this={messagesEl}>
            {#each chat.messages as msg, i (i)}
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
              placeholder="Ask about forts, run tools, trigger builds..."
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
      </div>
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
    width: 600px;
    max-width: 95vw;
    background: #0e0f14;
    border-right: 1px solid rgba(232, 168, 76, 0.15);
    display: flex;
    flex-direction: row;
    z-index: 1001;
  }

  /* Session rail */
  .session-rail {
    width: 180px;
    min-width: 180px;
    background: #0a0b10;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
  }
  .rail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .rail-title {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    font-weight: 700;
    color: #7a7770;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .new-session-btn {
    background: transparent;
    border: 1px solid rgba(232, 168, 76, 0.3);
    color: #e8a84c;
    width: 22px;
    height: 22px;
    border-radius: 4px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.85rem;
    cursor: pointer;
    line-height: 1;
    padding: 0;
  }
  .new-session-btn:hover {
    background: rgba(232, 168, 76, 0.1);
    box-shadow: 0 0 8px rgba(232, 168, 76, 0.2);
  }
  .session-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.35rem 0;
  }
  .session-item {
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0.75rem;
    border-left: 2px solid transparent;
    cursor: pointer;
    transition: background 0.15s;
  }
  .session-item:hover { background: rgba(255, 255, 255, 0.03); }
  .session-item.active {
    background: rgba(232, 168, 76, 0.06);
    border-left-color: #e8a84c;
  }
  .session-name {
    background: transparent;
    border: none;
    text-align: left;
    padding: 0;
    color: #e4e2dc;
    font-family: "IBM Plex Sans", sans-serif;
    font-size: 0.7rem;
    font-weight: 500;
    cursor: text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rename-input {
    background: #15161d;
    border: 1px solid rgba(232, 168, 76, 0.4);
    border-radius: 3px;
    color: #e4e2dc;
    font-family: "IBM Plex Sans", sans-serif;
    font-size: 0.7rem;
    padding: 1px 4px;
    outline: none;
    width: 100%;
  }
  .session-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 2px;
  }
  .session-time {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    color: #44423d;
  }
  .team-chip {
    background: rgba(139, 92, 246, 0.12);
    color: #8b5cf6;
    border: 1px solid rgba(139, 92, 246, 0.25);
    border-radius: 999px;
    padding: 1px 6px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.45rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-right: auto;
  }
  .session-delete {
    background: transparent;
    border: none;
    color: #44423d;
    font-size: 0.85rem;
    cursor: pointer;
    padding: 0 2px;
    line-height: 1;
  }
  .session-delete:hover { color: #e85a5a; }

  /* Conversation column */
  .conv-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
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
  .model-pill {
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 999px;
    color: #e4e2dc;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    padding: 3px 8px 3px 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: border-color 0.2s;
  }
  .model-pill:hover { border-color: rgba(232, 168, 76, 0.4); }
  .model-pill .model-label { font-weight: 500; }
  .model-pill .caret { color: #7a7770; font-size: 0.5rem; }
  .tier-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 0.45rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    line-height: 1;
  }
  .tier-chip.tier-free {
    background: rgba(106, 196, 140, 0.15);
    color: #6ac48c;
  }
  .tier-chip.tier-standard {
    background: rgba(232, 168, 76, 0.15);
    color: #e8a84c;
  }
  .tier-chip.tier-frontier {
    background: rgba(139, 92, 246, 0.15);
    color: #8b5cf6;
  }
  .panel-close {
    background: transparent;
    border: none;
    color: #7a7770;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
  }
  .panel-close:hover { color: #e4e2dc; }

  /* Model picker dropdown */
  .model-picker {
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    padding: 0.6rem 0.75rem;
    background: #0a0b10;
  }
  .model-search {
    width: 100%;
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    color: #e4e2dc;
    padding: 0.4rem 0.6rem;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    outline: none;
    margin-bottom: 0.4rem;
  }
  .model-search:focus { border-color: rgba(232, 168, 76, 0.4); }
  .model-list {
    max-height: 260px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .model-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0.35rem 0.4rem;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #e4e2dc;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
  }
  .model-row:hover { background: rgba(255, 255, 255, 0.04); }
  .model-row.selected { background: rgba(232, 168, 76, 0.08); }
  .model-row-label { font-weight: 500; white-space: nowrap; }
  .model-row-note {
    color: #7a7770;
    font-style: italic;
    white-space: nowrap;
  }
  .model-row-id {
    color: #44423d;
    margin-left: auto;
    font-size: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .model-empty {
    padding: 0.6rem;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #7a7770;
    text-align: center;
  }
  .model-empty code {
    background: #15161d;
    padding: 1px 4px;
    border-radius: 3px;
    color: #e8a84c;
  }

  /* MCP chips */
  .mcp-chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.3rem;
    padding: 0.4rem 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: #0a0b10;
  }
  .mcp-chips-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    color: #7a7770;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-right: 2px;
  }
  .mcp-chip {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 999px;
    color: #44423d;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    padding: 2px 8px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .mcp-chip:hover { border-color: rgba(232, 168, 76, 0.3); }
  .mcp-chip.enabled {
    background: rgba(232, 168, 76, 0.08);
    border-color: rgba(232, 168, 76, 0.35);
    color: #e8a84c;
  }
  .mcp-chip.mcp-all {
    margin-left: auto;
    color: #7a7770;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.5rem;
  }

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
  .chat-msg.user { background: rgba(232, 168, 76, 0.06); }
  .chat-msg.assistant { background: #15161d; }
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
