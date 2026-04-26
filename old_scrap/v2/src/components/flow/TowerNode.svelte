<script>
  import { Handle, Position } from "@xyflow/svelte";
  let { data } = $props();
  // Spec §6.1 behavior #10 — tower fires on PRISM anomaly: state === "alert"
  // swaps to the ᚺ rune (Haglaz — disruption), lights every level, and emits
  // a fire burst. Reactive so the synthetic driver can flip state mid-session.
  const isAlert = $derived(data.state === "alert");
  const activeRune = $derived(isAlert ? "ᚺ" : (data.rune || "ᛉ"));
  const elevation = $derived(data.elevation || 3);
  const litLevels = $derived(isAlert ? elevation : (data.litLevels || 1));
</script>

<div class="tower-node" class:alert={isAlert} aria-label={`Tower ${data.label}${isAlert ? ' — alert firing' : ''}`}>
  {#if isAlert}
    <div class="tower-burst" aria-hidden="true"></div>
  {/if}
  <div class="tower-icon">{activeRune}</div>
  <div class="tower-label">{data.label}</div>
  <div class="tower-levels">
    {#each Array(elevation) as _, i}
      <div class="tower-level" class:lit={i < litLevels}></div>
    {/each}
  </div>
  {#if data.detail}
    <div class="tower-detail">{data.detail}</div>
  {/if}
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />

<style>
  .tower-node {
    background: #0e0f14;
    border: 1px solid rgba(232, 168, 76, 0.2);
    border-radius: 6px;
    padding: 0.6rem 0.8rem;
    text-align: center;
    min-width: 80px;
    position: relative;
    transition: border-color 240ms cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 240ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .tower-node.alert {
    border-color: rgba(232, 90, 90, 0.7);
    box-shadow: 0 0 20px rgba(232, 90, 90, 0.35);
  }
  .tower-icon {
    font-size: 1.4rem;
    color: #c4956a;
    margin-bottom: 0.15rem;
    transition: color 240ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .tower-node.alert .tower-icon {
    color: #e85a5a;
    animation: tower-fire 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  .tower-burst {
    position: absolute;
    inset: -4px;
    border-radius: 10px;
    pointer-events: none;
    background: radial-gradient(
      circle at 50% 20%,
      rgba(232, 90, 90, 0.35) 0%,
      rgba(232, 90, 90, 0) 60%
    );
    animation: tower-burst 1.6s ease-out infinite;
  }
  @keyframes tower-fire {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.12); opacity: 0.85; }
  }
  @keyframes tower-burst {
    0% { opacity: 0.9; transform: scale(0.85); }
    60% { opacity: 0.25; transform: scale(1.15); }
    100% { opacity: 0; transform: scale(1.25); }
  }
  @media (prefers-reduced-motion: reduce) {
    .tower-node, .tower-icon { transition: none; }
    .tower-node.alert .tower-icon { animation: none; }
    .tower-burst { animation: none; opacity: 0.4; }
  }
  .tower-label {
    font-family: "Cinzel", serif;
    font-size: 0.7rem; font-weight: 500; color: #e4e2dc;
    margin-bottom: 0.3rem;
  }
  .tower-levels {
    display: flex; gap: 2px; justify-content: center; margin-bottom: 0.2rem;
  }
  .tower-level {
    width: 8px; height: 8px; border-radius: 2px;
    background: #1c1d26; border: 1px solid #2a2b34;
  }
  .tower-level.lit { background: #e8a84c; border-color: #e8a84c; }
  .tower-detail {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem; color: #44423d;
  }
</style>
