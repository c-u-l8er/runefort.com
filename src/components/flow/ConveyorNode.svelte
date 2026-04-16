<script>
  import { Handle, Position } from "@xyflow/svelte";

  let { data = {} } = $props();

  const STAGE_COLORS = {
    spec_update: { border: "#5b6a8a", bg: "rgba(91, 106, 138, 0.15)" },
    build: { border: "#e8a84c", bg: "rgba(232, 168, 76, 0.15)" },
    trust: { border: "#6ac48c", bg: "rgba(106, 196, 140, 0.15)" },
    deploy: { border: "#4a9ade", bg: "rgba(74, 154, 222, 0.15)" },
    complete: { border: "#22c55e", bg: "rgba(34, 197, 94, 0.15)" },
    failed: { border: "#e85a5a", bg: "rgba(232, 90, 90, 0.15)" },
  };

  const PHASE_RUNES = {
    spec_lifecycle: "\u16B2", // ᚲ
    build_pipeline: "\u16A0", // ᚠ
    trust_scoring: "\u16B7", // ᚷ
    deploy_gate: "\u16A8", // ᚨ
  };

  const colors = STAGE_COLORS[data.stage] || STAGE_COLORS.build;
  const isActive = data.status === "running";
</script>

<div class="conveyor-node" style="border-color: {colors.border}; background: {colors.bg};"
  class:pulsing={isActive}>
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />

  <div class="header">
    <span class="stage-label" style="color: {colors.border};">{data.stage || "unknown"}</span>
    {#if data.rune}
      <span class="rune">{data.rune}</span>
    {/if}
  </div>

  {#if data.phase}
    <div class="phase-name">{data.phase}</div>
  {/if}

  {#if data.phases}
    <div class="phase-dots">
      {#each data.phases as phase}
        <span class="dot"
          class:succeeded={phase.status === "succeeded"}
          class:failed={phase.status === "failed"}
          class:running={phase.status === "running"}
          class:skipped={phase.status === "skipped"}
          title="{phase.phase}: {phase.status}">
          {PHASE_RUNES[phase.phase] || "\u25CF"}
        </span>
      {/each}
    </div>
  {/if}

  {#if data.fortId}
    <div class="fort-label">{data.fortId}</div>
  {/if}

  {#if data.trustScore !== undefined}
    <div class="trust-score" style="color: {data.trustScore >= 75 ? '#22c55e' : data.trustScore >= 50 ? '#e8a84c' : '#e85a5a'};">
      Trust: {data.trustScore}
    </div>
  {/if}
</div>

<style>
  .conveyor-node {
    min-width: 120px;
    padding: 0.5rem 0.6rem;
    border: 2px solid;
    border-radius: 8px;
    font-family: "JetBrains Mono", monospace;
    transition: all 0.3s;
  }
  .conveyor-node:hover {
    filter: brightness(1.15);
  }
  .conveyor-node.pulsing {
    animation: conveyorPulse 1.5s ease-in-out infinite;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.2rem;
  }
  .stage-label {
    font-size: 0.55rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .rune {
    font-family: "Noto Sans Runic", serif;
    font-size: 0.7rem;
    color: rgba(228, 226, 220, 0.4);
  }

  .phase-name {
    font-size: 0.45rem;
    color: #7a7770;
    margin-bottom: 0.2rem;
  }

  .phase-dots {
    display: flex;
    gap: 0.3rem;
    margin-bottom: 0.2rem;
  }
  .dot {
    font-size: 0.5rem;
    color: #33322e;
    font-family: "Noto Sans Runic", serif;
  }
  .dot.succeeded { color: #22c55e; }
  .dot.failed { color: #e85a5a; }
  .dot.running { color: #e8a84c; animation: dotPulse 1s infinite; }
  .dot.skipped { color: #33322e; opacity: 0.5; }

  .fort-label {
    font-size: 0.45rem;
    color: #44423d;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .trust-score {
    font-size: 0.45rem;
    font-weight: 700;
    margin-top: 0.15rem;
  }

  @keyframes conveyorPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(232, 168, 76, 0); }
    50% { box-shadow: 0 0 8px 2px rgba(232, 168, 76, 0.3); }
  }
  @keyframes dotPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
</style>
