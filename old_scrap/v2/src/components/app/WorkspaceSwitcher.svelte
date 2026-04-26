<script>
  import { getWorkspaceState, switchWorkspace, selectDemoWorkspace } from "$lib/stores/workspace.svelte.js";
  import { loadFort } from "$lib/persistence.js";
  import { loadSavedFort } from "$lib/stores/fort.svelte.js";
  import { getAuth, openAuthModal } from "$lib/stores/auth.svelte.js";
  import NewWorkspaceModal from "./NewWorkspaceModal.svelte";
  import WorkspaceSettingsModal from "./WorkspaceSettingsModal.svelte";

  const ws = getWorkspaceState();
  const auth = getAuth();

  let dropdownOpen = $state(false);
  let showNewWorkspaceModal = $state(false);
  let showSettingsModal = $state(false);

  function handleCreate() {
    dropdownOpen = false;
    if (!auth.user) {
      openAuthModal();
      return;
    }
    showNewWorkspaceModal = true;
  }

  function handleOpenSettings() {
    dropdownOpen = false;
    showSettingsModal = true;
  }

  function handleSelect(workspaceId) {
    dropdownOpen = false;
    if (workspaceId === "demo") {
      selectDemoWorkspace();
      return;
    }
    switchWorkspace(workspaceId);
  }

  async function handleFortClick(fortId) {
    dropdownOpen = false;
    try {
      const saved = await loadFort(fortId);
      loadSavedFort(saved);
    } catch {
      // ignore
    }
  }
</script>

<div class="switcher">
  <button class="switcher-btn" onclick={() => { dropdownOpen = !dropdownOpen; }}>
    <span class="switcher-rune">&#5765;</span>
    <span class="switcher-name">
      {ws.active ? ws.active.name : "Demo"}
    </span>
    <span class="switcher-arrow">{dropdownOpen ? "\u25B4" : "\u25BE"}</span>
  </button>

  {#if dropdownOpen}
    <div class="dropdown">
      <button class="dropdown-item" class:active={!ws.active} onclick={() => handleSelect("demo")}>
        <span class="item-name">Demo</span>
        <span class="item-detail">Ecosystem forts</span>
      </button>

      {#if ws.workspaces.length > 0}
        <div class="dropdown-divider"></div>
        <div class="dropdown-label">Workspaces</div>
        {#each ws.workspaces as workspace}
          <button
            class="dropdown-item"
            class:active={ws.active?.id === workspace.id}
            onclick={() => handleSelect(workspace.id)}
          >
            <span class="item-name">{workspace.name}</span>
            <span class="item-badge">{workspace.fort_count}</span>
          </button>
        {/each}
      {/if}

      {#if ws.active && ws.forts.length > 0}
        <div class="dropdown-divider"></div>
        <div class="dropdown-label">Forts</div>
        {#each ws.forts.slice(0, 8) as fort}
          <button class="dropdown-item fort-item" onclick={() => handleFortClick(fort.id)}>
            <span class="item-name">{fort.name}</span>
            <span class="item-detail">L{fort.zoom_level}</span>
          </button>
        {/each}
      {/if}

      {#if ws.loading}
        <div class="dropdown-loading">Loading...</div>
      {/if}

      <div class="dropdown-divider"></div>
      <button class="dropdown-item create-item" onclick={handleCreate}>
        <span class="item-name">+ New workspace</span>
        {#if !auth.user}
          <span class="item-detail">sign in</span>
        {/if}
      </button>
      {#if ws.active}
        <button class="dropdown-item settings-item" onclick={handleOpenSettings}>
          <span class="item-name">⚙ Workspace settings…</span>
          <span class="item-detail">rename · delete</span>
        </button>
      {/if}
    </div>
  {/if}
</div>

{#if dropdownOpen}
  <div class="backdrop" onclick={() => { dropdownOpen = false; }}></div>
{/if}

<NewWorkspaceModal
  open={showNewWorkspaceModal}
  onclose={() => { showNewWorkspaceModal = false; }}
/>

<WorkspaceSettingsModal
  open={showSettingsModal}
  onclose={() => { showSettingsModal = false; }}
/>

<style>
  .switcher {
    position: relative;
  }
  .switcher-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 0.3rem 0.6rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .switcher-btn:hover {
    border-color: rgba(232, 168, 76, 0.3);
  }
  .switcher-rune {
    color: #e8a84c;
    font-size: 0.8rem;
  }
  .switcher-name {
    font-family: "Cinzel", serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: #e4e2dc;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .switcher-arrow {
    font-size: 0.55rem;
    color: #7a7770;
  }
  .dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 200px;
    max-height: 320px;
    overflow-y: auto;
    background: #0e0f14;
    border: 1px solid rgba(232, 168, 76, 0.2);
    border-radius: 8px;
    padding: 0.35rem;
    z-index: 200;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  .dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.45rem 0.6rem;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s;
    gap: 0.5rem;
  }
  .dropdown-item:hover {
    background: rgba(232, 168, 76, 0.08);
  }
  .dropdown-item.active {
    background: rgba(232, 168, 76, 0.12);
  }
  .item-name {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    font-weight: 500;
    color: #e4e2dc;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item-detail {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    color: #7a7770;
    flex-shrink: 0;
  }
  .item-badge {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    font-weight: 700;
    color: #09090d;
    background: #e8a84c;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .dropdown-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
    margin: 0.3rem 0;
  }
  .dropdown-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    font-weight: 600;
    color: #7a7770;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.25rem 0.6rem;
  }
  .fort-item .item-name {
    font-size: 0.55rem;
    color: #8a9a9e;
  }
  .dropdown-loading {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #e8a84c;
    padding: 0.4rem 0.6rem;
    text-align: center;
  }
  .create-item .item-name {
    color: #e8a84c;
  }
  .create-item:disabled {
    opacity: 0.5;
    cursor: wait;
  }
  .settings-item .item-name {
    color: #8a9a9e;
  }
  .settings-item:hover .item-name {
    color: #e4e2dc;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 150;
  }
</style>
