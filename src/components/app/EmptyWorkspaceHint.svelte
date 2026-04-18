<script>
  // Rendered over the empty canvas of an intentionally-empty workspace.
  // Spec §2.3 "motion is the menu" — no buttons. Just a hint that teaches
  // the user the two entry points that exist (right-click, drop).
  /** @type {{ visible: boolean }} */
  let { visible } = $props();
</script>

{#if visible}
  <div class="hint" aria-live="polite">
    <div class="rune">ᚢ</div>
    <div class="title">This workspace is empty</div>
    <div class="line">
      <span class="kbd">Right-click</span> the canvas to add a fort from a template.
    </div>
    <div class="line">
      Or drop a <code>.pulse.json</code> manifest anywhere.
    </div>
  </div>
{/if}

<style>
  .hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 1.6rem 2rem;
    background: rgba(14, 15, 20, 0.82);
    border: 1px dashed rgba(232, 168, 76, 0.3);
    border-radius: 10px;
    backdrop-filter: blur(8px);
    pointer-events: none;
    text-align: center;
    max-width: 420px;
  }
  .rune {
    font-size: 2.4rem;
    color: #e8a84c;
    line-height: 1;
    margin-bottom: 0.2rem;
    animation: breathe 4s ease-in-out infinite;
  }
  .title {
    font-family: "Cinzel", serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: #e4e2dc;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 0.4rem;
  }
  .line {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #8a8680;
  }
  .kbd {
    display: inline-block;
    padding: 0 0.35rem;
    border: 1px solid rgba(232, 168, 76, 0.35);
    border-radius: 3px;
    color: #e8a84c;
    font-weight: 600;
  }
  code {
    color: #c4956a;
    font-size: 0.6rem;
  }
  @keyframes breathe {
    0%, 100% { opacity: 0.55; }
    50% { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .rune { animation: none; opacity: 0.85; }
  }
</style>
