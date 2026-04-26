<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { getAuth, initAuth, signOut } from "$lib/stores/auth.svelte.js";

  const auth = getAuth();
  let signingOut = $state(false);

  onMount(() => {
    initAuth();
  });

  async function handleSignOut() {
    signingOut = true;
    try {
      await signOut();
      goto("/");
    } catch (e) {
      signingOut = false;
    }
  }

  /** @param {string | undefined} iso */
  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }
</script>

<svelte:head>
  <title>RuneFort — Profile</title>
</svelte:head>

<div class="profile">
  <header class="topbar">
    <a href="/app" class="brand"><span class="brand-rune">ᚲ</span> RUNEFORT</a>
    <a href="/app" class="back">← Editor</a>
  </header>

  <main class="content">
    {#if auth.loading}
      <p class="muted">Loading…</p>
    {:else if !auth.user}
      <div class="card">
        <h1>Not signed in</h1>
        <p class="muted">You need to sign in to view your profile.</p>
        <a href="/app" class="btn primary">Back to editor</a>
      </div>
    {:else}
      <div class="card">
        <div class="avatar">
          {auth.user.email?.charAt(0).toUpperCase() || "U"}
        </div>
        <h1>{auth.user.email || "Anonymous rune-smith"}</h1>

        <dl class="meta">
          <dt>User ID</dt>
          <dd class="mono">{auth.user.id}</dd>

          <dt>Provider</dt>
          <dd>{auth.user.app_metadata?.provider || "email"}</dd>

          <dt>Created</dt>
          <dd>{fmtDate(auth.user.created_at)}</dd>

          <dt>Last sign-in</dt>
          <dd>{fmtDate(auth.user.last_sign_in_at)}</dd>
        </dl>

        <div class="actions">
          <a href="/app" class="btn">Back to editor</a>
          <button class="btn danger" onclick={handleSignOut} disabled={signingOut}>
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  .profile {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: #09090d;
    color: #e4e2dc;
    font-family: "Inter", system-ui, sans-serif;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 1rem;
    background: rgba(9, 9, 13, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(12px);
  }
  .brand {
    font-family: "Cinzel", serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: #e4e2dc;
    text-decoration: none;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .brand-rune { color: #e8a84c; margin-right: 0.2rem; }
  .back {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.7rem;
    color: #7a7770;
    text-decoration: none;
    padding: 0.35rem 0.65rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    transition: all 0.2s;
  }
  .back:hover {
    color: #e4e2dc;
    border-color: rgba(232, 168, 76, 0.3);
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 2.5rem 1.5rem;
    display: flex;
    justify-content: center;
  }
  .card {
    width: 100%;
    max-width: 560px;
    background: rgba(20, 21, 28, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 2rem;
  }
  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(232, 168, 76, 0.12);
    border: 1px solid rgba(232, 168, 76, 0.35);
    color: #e8a84c;
    font-family: "Cinzel", serif;
    font-size: 1.6rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }
  h1 {
    font-family: "Cinzel", serif;
    font-size: 1.2rem;
    font-weight: 500;
    margin: 0 0 1.5rem;
    color: #e4e2dc;
    letter-spacing: 0.02em;
    word-break: break-all;
  }
  .muted { color: #7a7770; font-size: 0.85rem; }

  dl.meta {
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 1.25rem;
    row-gap: 0.6rem;
    margin: 0 0 1.5rem;
    font-size: 0.8rem;
  }
  dt {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #7a7770;
    padding-top: 2px;
  }
  dd {
    margin: 0;
    color: #e4e2dc;
    word-break: break-all;
  }
  .mono {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.72rem;
    color: #b8b4a8;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding-top: 1.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  .btn {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.7rem;
    font-weight: 500;
    padding: 0.5rem 0.9rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: transparent;
    color: #e4e2dc;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn:hover:not(:disabled) {
    border-color: rgba(232, 168, 76, 0.4);
    color: #e8a84c;
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn.primary {
    background: rgba(232, 168, 76, 0.12);
    color: #e8a84c;
    border-color: rgba(232, 168, 76, 0.35);
  }
  .btn.danger {
    color: #e87a5a;
    border-color: rgba(232, 122, 90, 0.3);
  }
  .btn.danger:hover:not(:disabled) {
    background: rgba(232, 122, 90, 0.1);
    border-color: rgba(232, 122, 90, 0.5);
    color: #e87a5a;
  }
</style>
