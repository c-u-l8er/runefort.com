<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { getSupabase } from "$lib/supabase.js";

  let error = $state("");
  let message = $state("Completing sign in...");

  onMount(async () => {
    const sb = getSupabase();
    if (!sb) {
      error = "Supabase not configured";
      return;
    }

    try {
      // Check for OAuth error in URL (provider failure)
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const urlError = params.get("error") || hashParams.get("error");
      const urlErrorDesc = params.get("error_description") || hashParams.get("error_description");
      if (urlError) {
        throw new Error(urlErrorDesc || urlError);
      }

      // PKCE code exchange (OAuth)
      const code = params.get("code");
      if (code) {
        const { error: exchangeErr } = await sb.auth.exchangeCodeForSession(code);
        if (exchangeErr) throw exchangeErr;
      } else {
        // Magic-link tokens arrive in the URL hash; getSession triggers client-side detection
        const { error: sessionErr } = await sb.auth.getSession();
        if (sessionErr) throw sessionErr;
      }

      // Support the "update-password" recovery flow
      const redirectTo = params.get("redirectTo");
      if (redirectTo === "update-password") {
        await goto("/auth/update-password");
        return;
      }

      // Only allow relative redirects
      const safe =
        redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
          ? redirectTo
          : "/app";
      await goto(safe);
    } catch (/** @type {any} */ err) {
      error = err?.message || "Authentication callback failed";
      message = "Authentication failed";
    }
  });
</script>

<div class="callback-page">
  <div class="card">
    <span class="rune">ᛟ</span>
    <h2>{message}</h2>
    {#if error}
      <div class="error">{error}</div>
      <a class="link-btn" href="/app">Back to the Fort</a>
    {:else}
      <p class="muted">Verifying authentication...</p>
    {/if}
  </div>
</div>

<style>
  .callback-page {
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
    margin: 0 0 0.5rem;
  }
  .muted {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    color: #7a7770;
  }
  .error {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.7rem;
    color: #e85a5a;
    margin: 1rem 0;
    padding: 0.6rem;
    background: rgba(232, 90, 90, 0.08);
    border-radius: 4px;
  }
  .link-btn {
    display: inline-block;
    margin-top: 0.5rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: #e4e2dc;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .link-btn:hover { border-color: rgba(232, 168, 76, 0.4); color: #e8a84c; }
</style>
