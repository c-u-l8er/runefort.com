<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { updatePassword, initAuth, getAuth } from "$lib/stores/auth.svelte.js";

  const auth = getAuth();

  let password = $state("");
  let loading = $state(false);
  let error = $state("");
  let success = $state(false);

  onMount(() => {
    initAuth();
  });

  /** @param {SubmitEvent} e */
  async function onSubmit(e) {
    e.preventDefault();
    error = "";
    loading = true;
    try {
      await updatePassword(password);
      success = true;
    } catch (/** @type {any} */ err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="update-page">
  <div class="card">
    <span class="rune">ᛟ</span>
    <h2>{success ? "Password Updated" : "Set a New Password"}</h2>

    {#if success}
      <p class="muted">Your password has been updated.</p>
      <button class="submit-btn" onclick={() => goto("/app")}>Go to the Fort</button>
    {:else}
      <form onsubmit={onSubmit}>
        <label class="field">
          <span class="field-label">New Password</span>
          <input
            type="password"
            bind:value={password}
            required
            minlength="6"
            autocomplete="new-password"
            placeholder="••••••••"
          />
        </label>

        {#if error}
          <div class="error">{error}</div>
        {/if}

        <button type="submit" class="submit-btn" disabled={loading}>
          {loading ? "..." : "Update Password"}
        </button>
      </form>
    {/if}
  </div>
</div>

<style>
  .update-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #09090d;
    padding: 1rem;
  }
  .card {
    width: 400px;
    max-width: 92vw;
    text-align: center;
    background: #0e0f14;
    border: 1px solid rgba(232, 168, 76, 0.2);
    border-radius: 12px;
    padding: 2rem;
  }
  .rune {
    display: block;
    font-size: 2rem;
    color: #e8a84c;
    margin-bottom: 0.5rem;
  }
  h2 {
    font-family: "Cinzel", serif;
    font-size: 1.1rem;
    color: #e4e2dc;
    font-weight: 500;
    margin: 0 0 1rem;
  }
  .muted {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.7rem;
    color: #7a7770;
    margin-bottom: 1rem;
  }
  .field {
    display: block;
    text-align: left;
    margin-bottom: 0.85rem;
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
    box-sizing: border-box;
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 0.65rem 0.75rem;
    color: #e4e2dc;
    font-family: "IBM Plex Sans", sans-serif;
    font-size: 0.9rem;
    outline: none;
  }
  input:focus { border-color: rgba(232, 168, 76, 0.4); }
  .error {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    color: #e85a5a;
    margin-bottom: 0.75rem;
    padding: 0.5rem;
    background: rgba(232, 90, 90, 0.08);
    border-radius: 4px;
    text-align: left;
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
  .submit-btn:hover:not(:disabled) { box-shadow: 0 4px 16px rgba(232, 168, 76, 0.3); }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
