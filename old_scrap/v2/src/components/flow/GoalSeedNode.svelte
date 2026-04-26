<script>
  import { Handle, Position } from "@xyflow/svelte";

  // GoalSeedNode — spec §6.3 Phase 5.
  // Five states, one visual per state:
  //
  //   proposed  → dim seed glyph, no glow           (a wish)
  //   active    → glowing seed + progress ring      (in flight)
  //   completed → amber bloom, petals open          (harvested)
  //   failed    → cracked seed, red fissure         (withered)
  //   blocked   → behind a wall tile, desaturated   (policy hold)
  //
  // Inputs on data:
  //   - label      : short goal title
  //   - detail?    : one-line supporting text
  //   - state      : one of the 5 above
  //   - progress?  : 0..1 (only meaningful for `active`)
  //   - blockedBy? : short label for the policy/wall (only meaningful for `blocked`)
  //
  // The ring for `active` is a pure CSS conic-gradient so it scales without
  // SVG overhead. Reduced-motion collapses the bloom/crack animations to
  // their terminal states.

  let { data } = $props();

  const VALID = /** @type {const} */ (["proposed", "active", "completed", "failed", "blocked"]);
  /** @type {'proposed'|'active'|'completed'|'failed'|'blocked'} */
  const state = $derived(
    VALID.includes(data.state) ? data.state : "proposed"
  );
  const progress = $derived(Math.max(0, Math.min(1, Number(data.progress ?? 0))));
  const progressDeg = $derived(Math.round(progress * 360));

  const GLYPHS = {
    proposed: "ᛝ", active: "ᛝ", completed: "ᛟ", failed: "ᛜ", blocked: "ᚹ",
  };
  const COLORS = {
    proposed: "#7a7770", active: "#e8a84c", completed: "#6ac48c",
    failed: "#e85a5a", blocked: "#5b6a8a",
  };
  const STATUS_LABEL = {
    proposed: "proposed", active: "active", completed: "completed",
    failed: "failed", blocked: "blocked",
  };

  const glyph = $derived(GLYPHS[state]);
  const color = $derived(COLORS[state]);
  const statusLabel = $derived(STATUS_LABEL[state]);
</script>

<div
  class="goal-seed"
  data-state={state}
  style="border-color: {color}50; --goal-color: {color}; --goal-progress-deg: {progressDeg}deg;"
  role="group"
  aria-label={`Goal ${data.label ?? ""} — ${statusLabel}${state === "active" ? ` (${Math.round(progress * 100)}% complete)` : ""}${state === "blocked" && data.blockedBy ? ` (blocked by ${data.blockedBy})` : ""}`}
>
  {#if state === "blocked"}
    <div class="block-wall" aria-hidden="true"></div>
  {/if}

  <div class="seed-slot">
    {#if state === "active"}
      <div class="ring" aria-hidden="true"></div>
    {/if}
    {#if state === "completed"}
      <div class="bloom" aria-hidden="true">
        {#each [0, 72, 144, 216, 288] as angle}
          <span class="petal" style="transform: rotate({angle}deg) translateY(-9px);"></span>
        {/each}
      </div>
    {/if}
    {#if state === "failed"}
      <div class="crack" aria-hidden="true"></div>
    {/if}
    <span class="glyph" style="color: {color};">{glyph}</span>
  </div>

  <div class="goal-label">{data.label ?? "goal"}</div>
  {#if data.detail}
    <div class="goal-detail">{data.detail}</div>
  {/if}
  <div class="goal-status" style="color: {color};">
    {statusLabel}
    {#if state === "active"}
      <span class="goal-pct">· {Math.round(progress * 100)}%</span>
    {:else if state === "blocked" && data.blockedBy}
      <span class="goal-pct">· {data.blockedBy}</span>
    {/if}
  </div>
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />

<style>
  .goal-seed {
    background: #0e0f14;
    border: 1px solid;
    border-radius: 8px;
    padding: 0.55rem 0.7rem 0.6rem;
    text-align: center;
    min-width: 112px;
    position: relative;
    overflow: hidden;
    transition: border-color 240ms ease, box-shadow 240ms ease, filter 240ms ease;
  }
  .goal-seed[data-state="active"] {
    box-shadow: 0 0 14px var(--goal-color, #e8a84c)26;
  }
  .goal-seed[data-state="completed"] {
    box-shadow: 0 0 18px rgba(106, 196, 140, 0.35);
  }
  .goal-seed[data-state="failed"] {
    box-shadow: 0 0 14px rgba(232, 90, 90, 0.3);
  }
  .goal-seed[data-state="blocked"] {
    filter: saturate(0.3) brightness(0.85);
  }
  .goal-seed[data-state="proposed"] {
    filter: brightness(0.9);
  }
  .block-wall {
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
      135deg,
      rgba(91, 106, 138, 0.22) 0 8px,
      rgba(91, 106, 138, 0.08) 8px 14px
    );
    pointer-events: none;
    opacity: 0.75;
  }
  .seed-slot {
    position: relative;
    width: 36px;
    height: 36px;
    margin: 0 auto 0.3rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .glyph {
    font-size: 1.1rem;
    line-height: 1;
    z-index: 1;
    transition: color 240ms ease, transform 240ms ease;
  }
  .goal-seed[data-state="proposed"] .glyph { opacity: 0.55; }
  .goal-seed[data-state="active"] .glyph { animation: goal-pulse 1.6s ease-in-out infinite; }
  .goal-seed[data-state="completed"] .glyph { transform: scale(1.15); }

  /* Progress ring — conic-gradient advances with --goal-progress-deg */
  .ring {
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    background: conic-gradient(
      var(--goal-color, #e8a84c) 0deg,
      var(--goal-color, #e8a84c) var(--goal-progress-deg, 0deg),
      rgba(91, 106, 138, 0.25) var(--goal-progress-deg, 0deg),
      rgba(91, 106, 138, 0.25) 360deg
    );
    mask: radial-gradient(circle, transparent 12px, #000 13px);
    -webkit-mask: radial-gradient(circle, transparent 12px, #000 13px);
    animation: goal-ring-spin 14s linear infinite;
  }

  /* Completed bloom — five petals fan out from center */
  .bloom {
    position: absolute;
    inset: 0;
    animation: goal-bloom 700ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .petal {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 14px;
    margin-left: -2.5px;
    margin-top: -7px;
    background: rgba(106, 196, 140, 0.7);
    border-radius: 50% 50% 50% 50% / 80% 80% 20% 20%;
    transform-origin: center bottom;
  }

  /* Failed crack — diagonal red fissure */
  .crack {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(135deg, transparent 45%, rgba(232, 90, 90, 0.5) 47%, rgba(232, 90, 90, 0.5) 50%, transparent 52%);
    animation: goal-crack 900ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes goal-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.12); opacity: 0.82; }
  }
  @keyframes goal-ring-spin {
    0% { transform: rotate(0); }
    100% { transform: rotate(360deg); }
  }
  @keyframes goal-bloom {
    0%   { transform: scale(0.6); opacity: 0; }
    60%  { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 0.9; }
  }
  @keyframes goal-crack {
    0% { transform: scaleX(0); opacity: 0; }
    60% { transform: scaleX(1); opacity: 1; }
    100% { transform: scaleX(1); opacity: 0.75; }
  }

  .goal-label {
    font-family: "Cinzel", serif;
    font-size: 0.72rem;
    font-weight: 500;
    color: #e4e2dc;
    line-height: 1.2;
  }
  .goal-detail {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.52rem;
    color: #7a7770;
    margin-top: 0.15rem;
    line-height: 1.4;
  }
  .goal-status {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 0.3rem;
    font-weight: 600;
  }
  .goal-pct {
    color: #7a7770;
    font-weight: 400;
    margin-left: 0.2rem;
  }

  @media (prefers-reduced-motion: reduce) {
    .goal-seed { transition: none; }
    .goal-seed[data-state="active"] .glyph { animation: none; }
    .ring { animation: none; }
    .bloom { animation: none; }
    .crack { animation: none; transform: scaleX(1); opacity: 0.75; }
  }
</style>
