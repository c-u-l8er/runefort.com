<script>
  import { Handle, Position } from "@xyflow/svelte";

  // ClockTower — spec §6.2 Phase 5.
  // Ticks on the PULSE cadence declared in the loaded manifest. Acts as the
  // fort's metronome: a rotating five-dot face whose active dot is the phase
  // currently executing (retrieve → route → act → learn → consolidate), a
  // monotonic tick counter so the L3 inspector can read cadence drift, and a
  // brief "chime" flash every tick so the tower visually punches the beat.
  //
  // Inputs on data:
  //   - tick       : monotonic integer, bumped per cadence beat
  //   - phase      : current phase kind (one of the 5 canonical kinds)
  //   - cadenceMs  : milliseconds per tick (from manifest.cadence.target_ms)
  //   - label      : display name (e.g. "Cadence")
  //
  // A subtle "chime" keyframe fires when `tick` changes — implemented by
  // keying a reactive `chimeKey` to `tick` so Svelte reruns the animation.

  let { data } = $props();

  const PHASES = /** @type {const} */ (["retrieve", "route", "act", "learn", "consolidate"]);
  const PHASE_RUNE = {
    retrieve: "ᚲ", route: "ᚨ", act: "ᚠ", learn: "ᛃ", consolidate: "ᛞ",
  };
  const PHASE_COLOR = {
    retrieve: "#e8a84c", route: "#8a9a9e", act: "#6ac48c",
    learn: "#c4956a", consolidate: "#5b6a8a",
  };

  const tick = $derived(Number(data.tick ?? 0));
  const activePhase = $derived(
    /** @type {'retrieve'|'route'|'act'|'learn'|'consolidate'} */
    (data.phase ?? PHASES[tick % PHASES.length])
  );
  const cadenceMs = $derived(Number(data.cadenceMs ?? 1500));
  const phaseRune = $derived(PHASE_RUNE[activePhase] || "·");
  const phaseColor = $derived(PHASE_COLOR[activePhase] || "#c4956a");
  // `chimeKey` changes on every tick so the chime keyframe restarts.
  const chimeKey = $derived(`chime-${tick}`);
</script>

<div
  class="clocktower"
  style="border-color: {phaseColor}60; box-shadow: 0 0 14px {phaseColor}26;"
  role="group"
  aria-label={`Clocktower — phase ${activePhase}, tick ${tick}, cadence ${cadenceMs}ms`}
>
  {#key chimeKey}
    <div class="chime" style="background: radial-gradient(circle, {phaseColor}30 0%, transparent 65%);"></div>
  {/key}
  <div class="ct-head">
    <span class="ct-rune" style="color: {phaseColor};">{phaseRune}</span>
    <span class="ct-label">{data.label ?? "Cadence"}</span>
  </div>
  <div class="ct-face" aria-hidden="true">
    {#each PHASES as p}
      <span class="ct-dot" class:active={p === activePhase} style="background: {p === activePhase ? phaseColor : '#1c1d26'};"></span>
    {/each}
  </div>
  <div class="ct-detail">
    <span class="ct-phase" style="color: {phaseColor};">{activePhase}</span>
    <span class="ct-sep">·</span>
    <span class="ct-cadence">{cadenceMs}ms</span>
  </div>
  <div class="ct-tick">t={tick}</div>
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />

<style>
  .clocktower {
    background: #0e0f14;
    border: 1px solid;
    border-radius: 8px;
    padding: 0.55rem 0.75rem;
    min-width: 140px;
    text-align: center;
    position: relative;
    overflow: hidden;
    transition: border-color 240ms cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 240ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .chime {
    position: absolute;
    inset: -4px;
    pointer-events: none;
    border-radius: 10px;
    animation: ct-chime 900ms cubic-bezier(0.2, 0.8, 0.2, 1);
    opacity: 0;
  }
  @keyframes ct-chime {
    0%   { opacity: 0.9; transform: scale(0.88); }
    60%  { opacity: 0.25; transform: scale(1.06); }
    100% { opacity: 0; transform: scale(1.14); }
  }
  .ct-head {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    margin-bottom: 0.3rem;
  }
  .ct-rune {
    font-size: 1rem;
    transition: color 240ms ease;
  }
  .ct-label {
    font-family: "Cinzel", serif;
    font-size: 0.7rem;
    font-weight: 500;
    color: #e4e2dc;
  }
  .ct-face {
    display: flex;
    justify-content: center;
    gap: 4px;
    margin-bottom: 0.3rem;
  }
  .ct-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    border: 1px solid #2a2b34;
    transition: background 240ms ease, transform 240ms ease;
  }
  .ct-dot.active {
    transform: scale(1.25);
    border-color: transparent;
    animation: ct-beat 1s ease-in-out infinite;
  }
  @keyframes ct-beat {
    0%, 100% { transform: scale(1.25); }
    50% { transform: scale(1.4); }
  }
  .ct-detail {
    display: inline-flex;
    gap: 0.35rem;
    align-items: baseline;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
  }
  .ct-phase {
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }
  .ct-sep {
    color: #44423d;
  }
  .ct-cadence {
    color: #7a7770;
  }
  .ct-tick {
    margin-top: 0.2rem;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.48rem;
    color: #44423d;
    letter-spacing: 0.04em;
  }
  @media (prefers-reduced-motion: reduce) {
    .clocktower { transition: none; }
    .chime { animation: none; opacity: 0; }
    .ct-dot.active { animation: none; }
  }
</style>
