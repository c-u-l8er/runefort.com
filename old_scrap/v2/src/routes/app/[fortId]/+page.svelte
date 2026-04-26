<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { loadFort } from "$lib/persistence.js";
  import { loadSavedFort } from "$lib/stores/fort.svelte.js";
  import { initAuth } from "$lib/stores/auth.svelte.js";

  let { data } = $props();
  let loading = $state(true);
  let error = $state("");

  onMount(async () => {
    await initAuth();
    try {
      const saved = await loadFort(data.fortId);
      loadSavedFort(saved);
      goto("/app", { replaceState: true });
    } catch (/** @type {any} */ err) {
      error = err.message || "Fort not found";
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>RuneFort — Loading Blueprint</title>
</svelte:head>

<div class="loader">
  {#if loading && !error}
    <div class="loader-rune">ᚲ</div>
    <div class="loader-text">Loading blueprint...</div>
  {:else if error}
    <div class="loader-rune error">ᚦ</div>
    <div class="loader-text">{error}</div>
    <a href="/app" class="loader-link">Return to editor</a>
  {/if}
</div>

<style>
  .loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: #09090d;
  }
  .loader-rune {
    font-size: 3rem;
    color: #e8a84c;
    margin-bottom: 1rem;
    animation: pulse 1.5s ease-in-out infinite;
  }
  .loader-rune.error {
    color: #e85a5a;
    animation: none;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
  .loader-text {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.75rem;
    color: #7a7770;
    letter-spacing: 0.04em;
  }
  .loader-link {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    color: #e8a84c;
    margin-top: 1rem;
    text-decoration: underline;
  }
</style>
