<script>
  import {
    getConnections,
    connectServer,
    removeConnection,
    saveCustomConnections,
  } from "$lib/stores/mcp.svelte.js";

  let { open = false, onclose } = $props();

  let customUrl = $state("");
  let customAuth = $state("");
  let connecting = $state(false);

  const connections = getConnections();

  async function handleAddCustom() {
    const url = customUrl.trim();
    if (!url) return;
    connecting = true;
    await connectServer({
      url,
      name: url.replace(/https?:\/\//, "").replace(/[/.]/g, "-"),
      label: url,
      authHeader: customAuth.trim() || undefined,
    });
    saveCustomConnections();
    customUrl = "";
    customAuth = "";
    connecting = false;
  }

  function handleRemove(name) {
    removeConnection(name);
    saveCustomConnections();
  }

  function handleKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustom();
    }
    if (e.key === "Escape") {
      onclose();
    }
  }

  function statusIcon(status) {
    if (status === "connected") return "\u25CF";
    if (status === "connecting") return "\u25CB";
    return "\u2716";
  }

  function statusColor(status) {
    if (status === "connected") return "#22c55e";
    if (status === "connecting") return "#e8a84c";
    return "#e85a5a";
  }
</script>

{#if open}
  <div class="panel-backdrop" onclick={onclose}>
    <aside class="panel" onclick={(e) => e.stopPropagation()}>
      <div class="panel-header">
        <h3>MCP Connections</h3>
        <button class="panel-close" onclick={onclose}>&times;</button>
      </div>

      <div class="panel-body">
        <!-- Connected servers -->
        <div class="server-list">
          {#each connections as conn}
            <div class="server-item">
              <div class="server-info">
                <span class="server-status" style="color: {statusColor(conn.status)}">
                  {statusIcon(conn.status)}
                </span>
                <div class="server-meta">
                  <span class="server-label">{conn.label}</span>
                  {#if conn.status === "connected"}
                    <span class="server-tools">{conn.tools.length} tools</span>
                  {:else if conn.status === "error"}
                    <span class="server-error">{conn.error}</span>
                  {:else}
                    <span class="server-tools">connecting...</span>
                  {/if}
                </div>
              </div>
              <button class="remove-btn" onclick={() => handleRemove(conn.name)} title="Disconnect">
                &times;
              </button>
            </div>
          {/each}
          {#if connections.length === 0}
            <p class="empty">No connections yet. Auto-connecting...</p>
          {/if}
        </div>

        <!-- Add custom server -->
        <div class="add-section">
          <span class="section-label">Add Custom Server</span>
          <input
            type="text"
            class="add-input"
            placeholder="https://your-mcp-server.example/mcp"
            bind:value={customUrl}
            onkeydown={handleKeydown}
          />
          <input
            type="password"
            class="add-input"
            placeholder="Auth token (optional)"
            bind:value={customAuth}
            onkeydown={handleKeydown}
          />
          <button class="add-btn" onclick={handleAddCustom} disabled={connecting || !customUrl.trim()}>
            {connecting ? "Connecting..." : "Connect"}
          </button>
        </div>
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
    right: 0;
    bottom: 0;
    width: 340px;
    max-width: 90vw;
    background: #0e0f14;
    border-left: 1px solid rgba(232, 168, 76, 0.15);
    display: flex;
    flex-direction: column;
    z-index: 1001;
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .panel-header h3 {
    font-family: "Cinzel", serif;
    font-size: 0.85rem;
    font-weight: 500;
    color: #e4e2dc;
    margin: 0;
  }
  .panel-close {
    background: transparent;
    border: none;
    color: #7a7770;
    font-size: 1.2rem;
    cursor: pointer;
  }
  .panel-close:hover { color: #e4e2dc; }
  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.25rem;
  }

  /* Server list */
  .server-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  .server-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.75rem;
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 6px;
  }
  .server-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }
  .server-status { font-size: 0.6rem; flex-shrink: 0; }
  .server-meta {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }
  .server-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    font-weight: 600;
    color: #e4e2dc;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .server-tools {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #7a7770;
  }
  .server-error {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #e85a5a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .remove-btn {
    background: transparent;
    border: none;
    color: #44423d;
    font-size: 1rem;
    cursor: pointer;
    padding: 0 4px;
    flex-shrink: 0;
  }
  .remove-btn:hover { color: #e85a5a; }
  .empty {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #44423d;
    text-align: center;
    padding: 1rem 0;
  }

  /* Add custom */
  .add-section {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .section-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    font-weight: 600;
    color: #8a9a9e;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .add-input {
    width: 100%;
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 0.5rem 0.65rem;
    color: #e4e2dc;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.7rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .add-input:focus { border-color: rgba(232, 168, 76, 0.4); }
  .add-input::placeholder { color: #44423d; }
  .add-btn {
    padding: 0.55rem;
    background: rgba(232, 168, 76, 0.15);
    border: 1px solid rgba(232, 168, 76, 0.3);
    border-radius: 6px;
    color: #e8a84c;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
  }
  .add-btn:hover { background: rgba(232, 168, 76, 0.25); }
  .add-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
