<script>
  import { agentBuild } from "$lib/play/agentelic-client.js";
  import { fetchPipelineStatus } from "$lib/stores/assembly.svelte.js";

  let { open = false, fortId = "", onclose = () => {} } = $props();
  let building = $state(false);
  let result = $state("");
  let error = $state("");

  async function handleTrigger() {
    building = true;
    result = "";
    error = "";
    try {
      const res = await agentBuild(fortId);
      if (res) {
        result = "Build triggered successfully!";
        // Refresh pipeline data after build trigger
        fetchPipelineStatus(fortId);
      } else {
        result = "Build queued (MCP server not connected — using demo mode)";
      }
    } catch (/** @type {any} */ err) {
      error = err.message || "Build trigger failed";
    } finally {
      building = false;
    }
  }
</script>

{#if open}
  <div class="dialog-backdrop" onclick={onclose}>
    <div class="dialog" onclick={(e) => e.stopPropagation()}>
      <button class="dialog-close" onclick={onclose}>×</button>
      <div class="dialog-header">
        <span class="dialog-rune">ᛜ</span>
        <h3>Trigger Build</h3>
      </div>

      <div class="meta">
        <div class="meta-row">
          <span class="meta-key">target</span>
          <span class="meta-val">{fortId}</span>
        </div>
        <div class="meta-row">
          <span class="meta-key">pipeline</span>
          <span class="meta-val">Agentelic Dark Factory</span>
        </div>
      </div>

      {#if !result && !error}
        <p class="confirm-text">Trigger a new build for <strong>{fortId}</strong>?</p>
        <p class="confirm-sub">This will queue a build through the Agentelic pipeline.</p>
      {/if}

      {#if building}
        <div class="building-indicator">
          <div class="building-pulse"></div>
          <span class="building-text">Building...</span>
        </div>
      {/if}

      {#if error}
        <div class="error">{error}</div>
      {/if}
      {#if result}
        <div class="success">{result}</div>
      {/if}

      {#if !result && !error}
        <div class="actions">
          <button class="cancel-btn" onclick={onclose} disabled={building}>Cancel</button>
          <button class="trigger-btn" onclick={handleTrigger} disabled={building}>
            {building ? "Building..." : "Trigger Build"}
          </button>
        </div>
      {:else}
        <button class="close-btn" onclick={onclose}>Close</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dialog {
    background: #0e0f14;
    border: 1px solid rgba(74, 154, 222, 0.25);
    border-radius: 12px;
    padding: 1.75rem;
    width: 360px;
    max-width: 90vw;
    position: relative;
  }
  .dialog-close {
    position: absolute;
    top: 0.75rem; right: 1rem;
    background: transparent; border: none;
    color: #7a7770; font-size: 1.4rem; cursor: pointer;
    font-family: inherit;
  }
  .dialog-close:hover { color: #e4e2dc; }
  .dialog-header {
    text-align: center;
    margin-bottom: 1.25rem;
  }
  .dialog-rune {
    font-size: 1.6rem;
    color: #4a9ade;
    display: block;
    margin-bottom: 0.25rem;
  }
  .dialog-header h3 {
    font-family: "Cinzel", serif;
    font-size: 1.1rem;
    font-weight: 500;
    color: #e4e2dc;
  }
  .meta {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #15161d;
    border-radius: 6px;
  }
  .meta-row {
    display: flex;
    justify-content: space-between;
    padding: 0.15rem 0;
  }
  .meta-key {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
  }
  .meta-val {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #e4e2dc;
    font-weight: 500;
  }
  .confirm-text {
    font-family: "IBM Plex Sans", sans-serif;
    font-size: 0.85rem;
    color: #e4e2dc;
    margin-bottom: 0.25rem;
  }
  .confirm-text strong { color: #4a9ade; }
  .confirm-sub {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #7a7770;
    margin-bottom: 1rem;
  }
  .building-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(74, 154, 222, 0.06);
    border: 1px solid rgba(74, 154, 222, 0.2);
    border-radius: 6px;
    margin-bottom: 1rem;
  }
  .building-pulse {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4a9ade;
    animation: pulse-build-dot 1s ease-in-out infinite;
  }
  @keyframes pulse-build-dot {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  .building-text {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    color: #4a9ade;
    font-weight: 600;
  }
  .error {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #e85a5a;
    margin-bottom: 0.75rem;
    padding: 0.4rem;
    background: rgba(232, 90, 90, 0.08);
    border-radius: 4px;
  }
  .success {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #6ac48c;
    margin-bottom: 0.75rem;
    padding: 0.4rem;
    background: rgba(106, 196, 140, 0.08);
    border-radius: 4px;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  .cancel-btn {
    flex: 1;
    padding: 0.6rem;
    background: transparent;
    color: #7a7770;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .cancel-btn:hover { border-color: rgba(255, 255, 255, 0.2); color: #e4e2dc; }
  .trigger-btn {
    flex: 1;
    padding: 0.6rem;
    background: #4a9ade;
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
  .trigger-btn:hover { box-shadow: 0 4px 16px rgba(74, 154, 222, 0.3); }
  .trigger-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .close-btn {
    width: 100%;
    padding: 0.6rem;
    background: transparent;
    color: #7a7770;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .close-btn:hover { border-color: rgba(255, 255, 255, 0.2); color: #e4e2dc; }
</style>
