<script>
  import {
    getAuth,
    closeAuthModal,
    signIn,
    signUp,
    signInWithMagicLink,
    signInWithProvider,
    resetPasswordForEmail,
  } from "$lib/stores/auth.svelte.js";

  const auth = getAuth();

  /** @type {"signin" | "signup" | "reset"} */
  let mode = $state("signin");
  let email = $state("");
  let password = $state("");
  let error = $state("");
  let loading = $state(false);
  let notice = $state(""); // "magic-link" | "signup-confirm" | "reset-sent"

  /** @param {"signin" | "signup" | "reset"} next */
  function switchMode(next) {
    mode = next;
    error = "";
    notice = "";
    password = "";
  }

  function onClose() {
    closeAuthModal();
    error = "";
    notice = "";
    password = "";
  }

  /** @param {SubmitEvent} e */
  async function handlePasswordSubmit(e) {
    e.preventDefault();
    error = "";
    loading = true;
    try {
      if (mode === "signup") {
        await signUp(email, password);
        notice = "signup-confirm";
      } else {
        await signIn(email, password);
      }
    } catch (/** @type {any} */ err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function handleMagicLink() {
    error = "";
    if (!email) {
      error = "Enter your email first";
      return;
    }
    loading = true;
    try {
      await signInWithMagicLink(email);
      notice = "magic-link";
    } catch (/** @type {any} */ err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  /** @param {"github" | "google"} provider */
  async function handleOAuth(provider) {
    error = "";
    loading = true;
    try {
      await signInWithProvider(provider);
      // redirects away — no further action needed
    } catch (/** @type {any} */ err) {
      error = err.message;
      loading = false;
    }
  }

  /** @param {SubmitEvent} e */
  async function handleReset(e) {
    e.preventDefault();
    error = "";
    if (!email) {
      error = "Enter your email first";
      return;
    }
    loading = true;
    try {
      await resetPasswordForEmail(email);
      notice = "reset-sent";
    } catch (/** @type {any} */ err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  const titles = {
    signin: "Enter the Fort",
    signup: "Claim Your Fort",
    reset: "Reset Password",
  };

  const subtitles = {
    signin: "Sign in to save blueprints to the cloud",
    signup: "Create an account to save blueprints to the cloud",
    reset: "We'll send a reset link to your email",
  };
</script>

{#if auth.showModal}
  <div class="modal-backdrop" onclick={onClose}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <button class="modal-close" onclick={onClose}>×</button>
      <div class="modal-header">
        <span class="modal-rune">ᛟ</span>
        <h3>{titles[mode]}</h3>
        <p class="modal-sub">{subtitles[mode]}</p>
      </div>

      {#if notice === "magic-link"}
        <div class="notice">
          <p>We sent a magic link to <strong>{email}</strong></p>
          <p class="notice-sub">Click the link in the email to sign in.</p>
          <button class="link-btn" onclick={() => { notice = ""; }}>Back</button>
        </div>
      {:else if notice === "signup-confirm"}
        <div class="notice">
          <p>We sent a confirmation link to <strong>{email}</strong></p>
          <p class="notice-sub">Click the link to verify your email and complete sign up.</p>
          <button class="link-btn" onclick={() => { switchMode("signin"); }}>Back to sign in</button>
        </div>
      {:else if notice === "reset-sent"}
        <div class="notice">
          <p>Password reset link sent to <strong>{email}</strong></p>
          <p class="notice-sub">Click the link in the email to set a new password.</p>
          <button class="link-btn" onclick={() => { switchMode("signin"); }}>Back to sign in</button>
        </div>
      {:else if mode === "reset"}
        <form onsubmit={handleReset}>
          <label class="field">
            <span class="field-label">Email</span>
            <input
              type="email"
              bind:value={email}
              required
              autocomplete="email"
              placeholder="builder@runefort.com"
            />
          </label>

          {#if error}
            <div class="error">{error}</div>
          {/if}

          <button type="submit" class="submit-btn" disabled={loading}>
            {loading ? "..." : "Send Reset Link"}
          </button>
        </form>

        <div class="toggle-mode">
          <button onclick={() => switchMode("signin")}>Back to sign in</button>
        </div>
      {:else}
        <form onsubmit={handlePasswordSubmit}>
          <label class="field">
            <span class="field-label">Email</span>
            <input
              type="email"
              bind:value={email}
              required
              autocomplete="email"
              placeholder="builder@runefort.com"
            />
          </label>
          <label class="field">
            <span class="field-label">Password</span>
            <input
              type="password"
              bind:value={password}
              required
              minlength="6"
              autocomplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="••••••••"
            />
          </label>

          {#if error}
            <div class="error">{error}</div>
          {/if}

          <button type="submit" class="submit-btn" disabled={loading}>
            {loading ? "..." : mode === "signin" ? "Sign In with Password" : "Create Account"}
          </button>

          <div class="divider"><span>or</span></div>

          <button
            type="button"
            class="alt-btn"
            disabled={loading || !email}
            onclick={handleMagicLink}
          >
            Send Magic Link
          </button>

          <div class="divider"><span>or continue with</span></div>

          <div class="oauth-row">
            <button type="button" class="oauth-btn" disabled={loading} onclick={() => handleOAuth("github")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.38 7.86 10.9.58.1.79-.25.79-.56v-2.01c-3.2.7-3.87-1.37-3.87-1.37-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.68 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.94 10.94 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.77 1.06.77 2.14v3.17c0 .31.21.67.8.55A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5z"/>
              </svg>
              GitHub
            </button>
            <button type="button" class="oauth-btn" disabled={loading} onclick={() => handleOAuth("google")}>
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.93h5.5c-.24 1.3-.97 2.4-2.06 3.14l3.33 2.58c1.94-1.79 3.06-4.43 3.06-7.57 0-.73-.07-1.43-.19-2.08H12z"/>
                <path fill="#34A853" d="M5.55 14.28l-.75.57-2.65 2.07C3.81 20.06 7.64 22.5 12 22.5c2.98 0 5.48-.98 7.31-2.66l-3.33-2.58c-.92.62-2.1.98-3.98.98-3.06 0-5.66-2.06-6.59-4.83z"/>
                <path fill="#FBBC05" d="M2.15 6.9C1.42 8.34 1 9.97 1 11.7s.42 3.36 1.15 4.8c0 .01 3.4-2.64 3.4-2.64-.21-.63-.33-1.3-.33-2.16s.12-1.53.33-2.16L2.15 6.9z"/>
                <path fill="#4285F4" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.47 2.09 14.97 1 12 1 7.64 1 3.81 3.44 2.15 7.1l3.4 2.64C6.48 7.44 9.08 5.38 12 5.38z"/>
              </svg>
              Google
            </button>
          </div>
        </form>

        <div class="toggle-mode">
          {#if mode === "signin"}
            <span>No account?</span>
            <button onclick={() => switchMode("signup")}>Sign up</button>
            <span class="sep">·</span>
            <button onclick={() => switchMode("reset")}>Forgot password?</button>
          {:else}
            <span>Already have an account?</span>
            <button onclick={() => switchMode("signin")}>Sign in</button>
          {/if}
        </div>
      {/if}
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
    max-width: 92vw;
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
  .submit-btn:hover:not(:disabled) { box-shadow: 0 4px 16px rgba(232, 168, 76, 0.3); }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .alt-btn {
    width: 100%;
    padding: 0.65rem;
    background: transparent;
    color: #e4e2dc;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 6px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
  }
  .alt-btn:hover:not(:disabled) {
    border-color: rgba(232, 168, 76, 0.4);
    color: #e8a84c;
  }
  .alt-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .divider {
    display: flex;
    align-items: center;
    text-align: center;
    margin: 0.9rem 0;
    gap: 0.5rem;
  }
  .divider::before,
  .divider::after {
    content: "";
    flex: 1;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  .divider span {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.58rem;
    color: #5c5a55;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .oauth-row {
    display: flex;
    gap: 0.5rem;
  }
  .oauth-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.65rem 0.5rem;
    background: #15161d;
    color: #e4e2dc;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.68rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .oauth-btn:hover:not(:disabled) {
    border-color: rgba(232, 168, 76, 0.4);
    background: #1a1b24;
  }
  .oauth-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .oauth-btn svg { flex-shrink: 0; }
  .toggle-mode {
    text-align: center;
    margin-top: 1.25rem;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    justify-content: center;
    align-items: center;
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
  .toggle-mode .sep {
    color: #44423d;
  }
  .notice {
    text-align: center;
    font-family: "IBM Plex Sans", sans-serif;
    color: #e4e2dc;
    font-size: 0.85rem;
    padding: 0.5rem 0 0.25rem;
  }
  .notice strong { color: #e8a84c; }
  .notice-sub {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.62rem;
    color: #7a7770;
    margin-top: 0.5rem;
  }
  .link-btn {
    margin-top: 1rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: #e4e2dc;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .link-btn:hover { border-color: rgba(232, 168, 76, 0.4); color: #e8a84c; }
</style>
