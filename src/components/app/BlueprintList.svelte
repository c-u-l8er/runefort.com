<script>
  import { getAuth, openAuthModal } from "$lib/stores/auth.svelte.js";

  let { forts = [], onload = () => {}, ondelete = () => {} } = $props();
  const auth = getAuth();

  const loopRunes = {
    "graphonomous.memory_loop": "ᚲ",
    "delegatic.governance": "ᛏ",
    "webhost.deploy_invoke": "ᚠ",
    "prism.benchmark": "ᛉ",
    "agentromatic.deliberation": "ᚹ",
  };
</script>

<div class="blueprint-list">
  <div class="list-header">
    <span class="list-rune">ᚠ</span>
    <span class="list-title">Saved Blueprints</span>
    {#if !auth.user}
      <button class="sign-in-btn" onclick={openAuthModal}>Sign in to view</button>
    {/if}
  </div>
  {#if forts.length === 0}
    <div class="empty">
      {auth.user ? "No saved blueprints yet" : "Sign in to save and load blueprints"}
    </div>
  {:else}
    {#each forts as fort}
      <div class="blueprint-card">
        <div class="card-header">
          <span class="card-rune">{loopRunes[fort.loop_id] || "ᛟ"}</span>
          <span class="card-name">{fort.name}</span>
          <span class="card-level">L{fort.zoom_level}</span>
        </div>
        <div class="card-meta">
          <span>{fort.loop_id}</span>
          <span>{new Date(fort.updated_at).toLocaleDateString()}</span>
        </div>
        <div class="card-actions">
          <button class="action-btn load" onclick={() => onload(fort.id)}>Load</button>
          <button class="action-btn delete" onclick={() => ondelete(fort.id)}>Delete</button>
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .blueprint-list {
    padding: 0.75rem;
    background: rgba(14, 15, 20, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    backdrop-filter: blur(8px);
    max-height: 400px;
    overflow-y: auto;
    min-width: 260px;
  }
  .list-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .list-rune { font-size: 1rem; color: #e8a84c; }
  .list-title {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    font-weight: 600;
    color: #8a9a9e;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .sign-in-btn {
    margin-left: auto;
    background: transparent;
    border: 1px solid rgba(232, 168, 76, 0.3);
    border-radius: 4px;
    color: #e8a84c;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    padding: 0.2rem 0.5rem;
    cursor: pointer;
  }
  .empty {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #44423d;
    padding: 1rem 0;
    text-align: center;
  }
  .blueprint-card {
    padding: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 6px;
    margin-bottom: 0.4rem;
    transition: border-color 0.2s;
  }
  .blueprint-card:hover { border-color: rgba(232, 168, 76, 0.2); }
  .card-header {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-bottom: 0.2rem;
  }
  .card-rune { font-size: 0.85rem; color: #c4956a; }
  .card-name {
    font-family: "Cinzel", serif;
    font-size: 0.75rem;
    font-weight: 500;
    color: #e4e2dc;
    flex: 1;
  }
  .card-level {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    font-weight: 600;
    color: #e8a84c;
  }
  .card-meta {
    display: flex;
    justify-content: space-between;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    color: #44423d;
    margin-bottom: 0.3rem;
  }
  .card-actions {
    display: flex;
    gap: 0.3rem;
  }
  .action-btn {
    flex: 1;
    padding: 0.25rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 4px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
  }
  .action-btn.load {
    color: #6ac48c;
    border-color: rgba(106, 196, 140, 0.2);
  }
  .action-btn.load:hover {
    background: rgba(106, 196, 140, 0.08);
    border-color: rgba(106, 196, 140, 0.4);
  }
  .action-btn.delete {
    color: #e85a5a;
    border-color: rgba(232, 90, 90, 0.2);
  }
  .action-btn.delete:hover {
    background: rgba(232, 90, 90, 0.08);
    border-color: rgba(232, 90, 90, 0.4);
  }
</style>
