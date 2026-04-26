<script>
  let { open = false, onclose, onsave } = $props();

  let key = $state("");

  function handleSave() {
    const trimmed = key.trim();
    if (!trimmed) return;
    onsave(trimmed);
    key = "";
  }

  function handleKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      onclose();
    }
  }
</script>

{#if open}
  <div class="modal-backdrop" onclick={onclose}>
    <div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-label="Set OpenRouter API Key">
      <button class="modal-close" onclick={onclose}>&times;</button>
      <div class="modal-header">
        <span class="modal-rune">&#5765;</span>
        <h3>Bring Your Own Key</h3>
        <p class="modal-sub">Power chat and tool flows with your OpenRouter key</p>
      </div>

      <div class="modal-body">
        <label class="field">
          <span class="field-label">OpenRouter API Key</span>
          <input
            type="password"
            placeholder="sk-or-..."
            bind:value={key}
            onkeydown={handleKeydown}
          />
        </label>
        <p class="hint">
          Stored only in your browser's localStorage.
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">Get a key</a>
        </p>
        <p class="hint">Default model: <code>qwen/qwen3-235b-a22b</code> (free)</p>
      </div>

      <div class="modal-footer">
        <button class="btn secondary" onclick={onclose}>Cancel</button>
        <button class="btn primary" onclick={handleSave}>Save Key</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal {
    background: #0e0f14;
    border: 1px solid rgba(232, 168, 76, 0.2);
    border-radius: 12px;
    padding: 2rem;
    width: 400px;
    max-width: 90vw;
    position: relative;
  }
  .modal-close {
    position: absolute;
    top: 0.75rem;
    right: 1rem;
    background: transparent;
    border: none;
    color: #7a7770;
    font-size: 1.4rem;
    cursor: pointer;
  }
  .modal-close:hover { color: #e4e2dc; }
  .modal-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }
  .modal-rune {
    font-size: 2rem;
    color: #e8a84c;
    display: block;
    margin-bottom: 0.5rem;
  }
  .modal-header h3 {
    font-family: "Cinzel", serif;
    font-size: 1.2rem;
    font-weight: 500;
    color: #e4e2dc;
    margin-bottom: 0.25rem;
  }
  .modal-sub {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    color: #7a7770;
  }
  .modal-body {
    margin-bottom: 1.5rem;
  }
  .field {
    display: block;
    margin-bottom: 0.75rem;
  }
  .field-label {
    display: block;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    font-weight: 600;
    color: #8a9a9e;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 0.35rem;
  }
  input {
    width: 100%;
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 0.65rem 0.75rem;
    color: #e4e2dc;
    font-family: "IBM Plex Sans", sans-serif;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
  }
  input:focus { border-color: rgba(232, 168, 76, 0.4); }
  input::placeholder { color: #44423d; }
  .hint {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
    margin: 0.5rem 0 0;
  }
  .hint a {
    color: #e8a84c;
    text-decoration: underline;
  }
  .hint code {
    font-size: 0.55rem;
    padding: 1px 4px;
    border-radius: 3px;
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  .btn {
    padding: 0.6rem 1.25rem;
    border-radius: 6px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  .btn.primary {
    background: #e8a84c;
    color: #09090d;
  }
  .btn.primary:hover { box-shadow: 0 4px 16px rgba(232, 168, 76, 0.3); }
  .btn.secondary {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #7a7770;
  }
  .btn.secondary:hover {
    color: #e4e2dc;
    border-color: rgba(255, 255, 255, 0.15);
  }
</style>
