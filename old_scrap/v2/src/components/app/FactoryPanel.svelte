<script>
  import {
    getFactoryState, getFactoryConfig, updateConfig,
    startWatching, stopWatching, manualSignal, dismissSignal,
    generateSyntheticSignals, runSyntheticPipeline, triageSignal,
    startPipelineRun,
  } from "$lib/stores/factory.svelte.js";
  import { classifySignal } from "$lib/play/factory-loop.js";
  import { getFort } from "$lib/stores/fort.svelte.js";
  import { findConnection } from "$lib/stores/mcp.svelte.js";

  /** @type {{ open?: boolean, onclose?: () => void }} */
  let { open = false, onclose = () => {} } = $props();

  const factory = getFactoryState();
  const config = getFactoryConfig();
  const fort = getFort();

  const STAGE_LABELS = {
    spec_update: "Spec",
    build: "Build",
    trust: "Trust",
    deploy: "Deploy",
    complete: "Done",
    failed: "Failed",
  };

  const STAGE_COLORS = {
    spec_update: "#5b6a8a",
    build: "#e8a84c",
    trust: "#6ac48c",
    deploy: "#4a9ade",
    complete: "#22c55e",
    failed: "#e85a5a",
  };

  const CLASSIFICATION_COLORS = {
    spec_change: "#5b6a8a",
    code_change: "#e8a84c",
    bug_report: "#e85a5a",
    feature_request: "#6ac48c",
    regression: "#c4956a",
    unknown: "#44423d",
  };

  function handleStartWatch() {
    // Try to extract owner/repo from active fort ID
    const parts = fort.activeFortId?.split("/");
    if (parts?.length === 2) {
      startWatching(parts[0], parts[1]);
    } else {
      startWatching(); // watch without GitHub
    }
  }

  function handleManualTrigger() {
    const fortId = fort.activeFortId || "demo";
    manualSignal(fortId, "code_change", { manual: true });
  }

  function handleDemoSignals() {
    const fortId = fort.activeFortId || "graphonomous";
    generateSyntheticSignals(fortId);
  }

  async function handleRunSignal(signalId) {
    await runSyntheticPipeline(signalId);
  }

  async function handleRunReal(signal) {
    // Triage first (real path requires signal.status === "triaged")
    const { classification, confidence } = classifySignal(signal);
    triageSignal(signal.id, classification, confidence);
    await startPipelineRun(signal.id);
  }

  // Live connection status for the three pipeline MCP servers
  const pipelineServers = ["specprompt", "agentelic", "fleetprompt"];
  let connStatus = $derived(pipelineServers.map((name) => {
    const conn = findConnection(name);
    return { name, status: conn?.status || "missing", error: conn?.error };
  }));

  function handleTriageSignal(signal) {
    const { classification, confidence } = classifySignal(signal);
    triageSignal(signal.id, classification, confidence);
  }

  function relativeTime(iso) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  /** @param {string} phase @param {string} status */
  function phaseIcon(phase, status) {
    if (status === "succeeded") return "\u2713";
    if (status === "failed") return "\u2717";
    if (status === "running") return "\u25CF";
    if (status === "skipped") return "\u2014";
    return "\u25CB";
  }

  function phaseColor(status) {
    if (status === "succeeded") return "#22c55e";
    if (status === "failed") return "#e85a5a";
    if (status === "running") return "#e8a84c";
    return "#44423d";
  }
</script>

{#if open}
  <div class="factory-panel">
    <div class="panel-header">
      <span class="panel-rune">ᛞ</span>
      <span class="panel-title">Dark Factory</span>
      <span class="loop-badge" style="background: {factory.loopState === 'watching' ? '#4a9ade' : factory.loopState === 'running' ? '#e8a84c' : '#44423d'};">
        {factory.loopState}
      </span>
      <button class="close-btn" onclick={onclose}>✕</button>
    </div>

    <!-- MCP Connection Status -->
    <div class="mcp-status">
      {#each connStatus as s}
        <span class="mcp-chip mcp-{s.status}" title={s.error || s.status}>
          {s.name}: {s.status === "connected" ? "✓" : s.status === "error" ? "✗" : s.status === "connecting" ? "…" : "—"}
        </span>
      {/each}
    </div>

    <!-- Controls -->
    <div class="controls">
      {#if factory.loopState === "idle"}
        <button class="ctrl-btn watch" onclick={handleStartWatch}>Start Watching</button>
      {:else}
        <button class="ctrl-btn stop" onclick={stopWatching}>Stop</button>
      {/if}
      <button class="ctrl-btn" onclick={handleManualTrigger}>Manual Signal</button>
      <button class="ctrl-btn demo" onclick={handleDemoSignals}>Demo</button>
    </div>

    <!-- Threshold slider -->
    <div class="threshold">
      <label>Deploy threshold: <strong>{config.deployThreshold}</strong></label>
      <input type="range" min="0" max="100" bind:value={config.deployThreshold}
        oninput={(e) => updateConfig({ deployThreshold: +(/** @type {HTMLInputElement} */ (e.target)).value })} />
    </div>

    <!-- Signal Queue -->
    <div class="section">
      <div class="section-label">Signals ({factory.signalQueue.length})</div>
      {#if factory.signalQueue.length === 0}
        <div class="empty">No pending signals</div>
      {:else}
        {#each factory.signalQueue as signal}
          <div class="signal-row">
            <span class="signal-badge" style="background: {CLASSIFICATION_COLORS[signal.classification] || '#44423d'};">
              {signal.classification}
            </span>
            <span class="signal-fort">{signal.fortId}</span>
            <span class="signal-time">{relativeTime(signal.timestamp)}</span>
            <div class="signal-actions">
              {#if signal.status === "pending"}
                <button class="mini-btn" onclick={() => handleTriageSignal(signal)} title="Triage">T</button>
                <button class="mini-btn run" onclick={() => handleRunSignal(signal.id)} title="Run synthetic pipeline (setTimeout fakes)">R</button>
                <button class="mini-btn run-real" onclick={() => handleRunReal(signal)} title="Run REAL pipeline (SpecPrompt + Agentelic + FleetPrompt MCP)">R!</button>
                <button class="mini-btn dismiss" onclick={() => dismissSignal(signal.id)} title="Dismiss">✕</button>
              {:else}
                <span class="signal-status">{signal.status}</span>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Active Runs -->
    {#if factory.activeRuns.length > 0}
      <div class="section">
        <div class="section-label">Active Runs ({factory.activeRuns.length})</div>
        {#each factory.activeRuns as run}
          <div class="run-card">
            <div class="run-header">
              <span class="run-fort">{run.fortId}</span>
              <span class="run-stage" style="color: {STAGE_COLORS[run.stage] || '#7a7770'};">
                {STAGE_LABELS[run.stage] || run.stage}
              </span>
            </div>
            <div class="run-phases">
              {#each run.phases as phase}
                <span class="phase-dot" style="color: {phaseColor(phase.status)};" title="{phase.phase}: {phase.status}">
                  {phaseIcon(phase.phase, phase.status)}
                </span>
              {/each}
            </div>
            <div class="run-time">{relativeTime(run.startedAt)}</div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Completed Runs -->
    {#if factory.completedRuns.length > 0}
      <div class="section">
        <div class="section-label">History ({factory.completedRuns.length})</div>
        {#each factory.completedRuns.slice(0, 10) as run}
          <div class="run-card completed">
            <div class="run-header">
              <span class="run-fort">{run.fortId}</span>
              <span class="run-stage" style="color: {STAGE_COLORS[run.stage] || '#7a7770'};">
                {run.outcome?.status === "success" ? "\u2713" : "\u2717"} {run.outcome?.status || run.stage}
              </span>
            </div>
            <div class="run-phases">
              {#each run.phases as phase}
                <span class="phase-dot" style="color: {phaseColor(phase.status)};">
                  {phaseIcon(phase.phase, phase.status)}
                </span>
              {/each}
            </div>
            <div class="run-time">{relativeTime(run.completedAt)}</div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .factory-panel {
    position: absolute;
    top: 3.5rem;
    right: 1rem;
    width: 320px;
    max-height: calc(100vh - 8rem);
    overflow-y: auto;
    background: rgba(14, 15, 20, 0.97);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    z-index: 100;
    font-family: "JetBrains Mono", monospace;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .panel-rune {
    font-family: "Noto Sans Runic", serif;
    font-size: 1.1rem;
    color: #e85a5a;
  }
  .panel-title {
    font-size: 0.7rem;
    font-weight: 600;
    color: #e4e2dc;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    flex: 1;
  }
  .loop-badge {
    font-size: 0.5rem;
    font-weight: 700;
    color: #09090d;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .close-btn {
    background: none;
    border: none;
    color: #44423d;
    cursor: pointer;
    font-size: 0.7rem;
    padding: 0.2rem;
  }
  .close-btn:hover { color: #e4e2dc; }

  .controls {
    display: flex;
    gap: 0.3rem;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }
  .ctrl-btn {
    flex: 1;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 5px;
    color: #7a7770;
    font-family: inherit;
    font-size: 0.5rem;
    font-weight: 600;
    padding: 0.35rem 0.3rem;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    transition: all 0.2s;
  }
  .ctrl-btn:hover { color: #e4e2dc; border-color: rgba(232, 168, 76, 0.3); }
  .ctrl-btn.watch { color: #4a9ade; border-color: rgba(74, 154, 222, 0.3); }
  .ctrl-btn.stop { color: #e85a5a; border-color: rgba(232, 90, 90, 0.3); }
  .ctrl-btn.demo { color: #6ac48c; border-color: rgba(106, 196, 140, 0.3); }

  .threshold {
    padding: 0.4rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }
  .threshold label {
    font-size: 0.5rem;
    color: #7a7770;
    display: block;
    margin-bottom: 0.2rem;
  }
  .threshold strong { color: #e8a84c; }
  .threshold input[type="range"] {
    width: 100%;
    height: 4px;
    accent-color: #e8a84c;
  }

  .section {
    padding: 0.5rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }
  .section-label {
    font-size: 0.5rem;
    font-weight: 700;
    color: #44423d;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 0.4rem;
  }
  .empty {
    font-size: 0.5rem;
    color: #33322e;
    font-style: italic;
  }

  .signal-row {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  }
  .signal-badge {
    font-size: 0.4rem;
    font-weight: 700;
    color: #09090d;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .signal-fort {
    font-size: 0.5rem;
    color: #7a7770;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .signal-time {
    font-size: 0.45rem;
    color: #33322e;
    white-space: nowrap;
  }
  .signal-actions {
    display: flex;
    gap: 0.2rem;
  }
  .signal-status {
    font-size: 0.45rem;
    color: #44423d;
    text-transform: uppercase;
  }
  .mini-btn {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 3px;
    color: #7a7770;
    font-family: inherit;
    font-size: 0.45rem;
    font-weight: 700;
    padding: 0.15rem 0.3rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .mini-btn:hover { color: #e4e2dc; }
  .mini-btn.run { color: #6ac48c; }
  .mini-btn.run-real { color: #e8a84c; border-color: rgba(232, 168, 76, 0.4); }
  .mini-btn.dismiss { color: #e85a5a; }

  .mcp-status {
    display: flex;
    gap: 0.3rem;
    padding: 0.4rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    flex-wrap: wrap;
  }
  .mcp-chip {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.45rem;
    font-weight: 600;
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    text-transform: lowercase;
    letter-spacing: 0.03em;
  }
  .mcp-chip.mcp-connected { color: #6ac48c; border-color: rgba(106, 196, 140, 0.4); }
  .mcp-chip.mcp-connecting { color: #e8a84c; border-color: rgba(232, 168, 76, 0.4); }
  .mcp-chip.mcp-error { color: #e85a5a; border-color: rgba(232, 90, 90, 0.4); }
  .mcp-chip.mcp-missing { color: #44423d; }

  .run-card {
    padding: 0.4rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  }
  .run-card.completed { opacity: 0.7; }
  .run-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.2rem;
  }
  .run-fort {
    font-size: 0.5rem;
    color: #e4e2dc;
    font-weight: 600;
  }
  .run-stage {
    font-size: 0.45rem;
    font-weight: 700;
    text-transform: uppercase;
  }
  .run-phases {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.15rem;
  }
  .phase-dot {
    font-size: 0.55rem;
    font-weight: 700;
    line-height: 1;
  }
  .run-time {
    font-size: 0.4rem;
    color: #33322e;
  }
</style>
