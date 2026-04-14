<script>
  import { getAuth, closeAuthModal, signIn, signUp } from "$lib/stores/auth.svelte.js";

  const auth = getAuth();
  let mode = $state("signin");
  let email = $state("");
  let password = $state("");
  let error = $state("");
  let loading = $state(false);

  async function handleSubmit(e) {
    e.preventDefault();
    error = "";
    loading = true;
    try {
      if (mode === "signup") {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

{#if auth.showModal}
  <div class="modal-backdrop" onclick={closeAuthModal}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <button class="modal-close" onclick={closeAuthModal}>×</button>
      <div class="modal-header">
        <span class="modal-rune">ᛟ</span>
        <h3>{mode === "signin" ? "Enter the Fort" : "Claim Your Fort"}</h3>
        <p class="modal-sub">Sign {mode === "signin" ? "in" : "up"} to save blueprints to the cloud</p>
      </div>

      <form onsubmit={handleSubmit}>
        <label class="field">
          <span class="field-label">Email</span>
          <input type="email" bind:value={email} required placeholder="builder@runefort.com" />
        </label>
        <label class="field">
          <span class="field-label">Password</span>
          <input type="password" bind:value={password} required minlength="6" placeholder="••••••••" />
        </label>

        {#if error}
          <div class="error">{error}</div>
        {/if}

        <button type="submit" class="submit-btn" disabled={loading}>
          {loading ? "..." : mode === "signin" ? "Sign In" : "Sign Up"}
        </button>
      </form>

      <div class="toggle-mode">
        {#if mode === "signin"}
          <span>No account?</span>
          <button onclick={() => { mode = "signup"; error = ""; }}>Sign up</button>
        {:else}
          <span>Already have an account?</span>
          <button onclick={() => { mode = "signin"; error = ""; }}>Sign in</button>
        {/if}
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
    width: 380px;
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
    font-family: inherit;
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
  .field {
    display: block;
    margin-bottom: 1rem;
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
  .error {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    color: #e85a5a;
    margin-bottom: 0.75rem;
    padding: 0.5rem;
    background: rgba(232, 90, 90, 0.08);
    border-radius: 4px;
  }
  .submit-btn {
    width: 100%;
    padding: 0.75rem;
    background: #e8a84c;
    color: #09090d;
    border: none;
    border-radius: 6px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
  }
  .submit-btn:hover { box-shadow: 0 4px 16px rgba(232, 168, 76, 0.3); }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .toggle-mode {
    text-align: center;
    margin-top: 1.25rem;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
  }
  .toggle-mode button {
    background: transparent;
    border: none;
    color: #e8a84c;
    cursor: pointer;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    text-decoration: underline;
    padding: 0;
  }
</style>
