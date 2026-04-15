<script>
  import { onMount } from "svelte";
  import { SvelteFlow, Background, Controls, MiniMap } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";

  // Flow node types
  import FortNode from "../../components/flow/FortNode.svelte";
  import RoomNode from "../../components/flow/RoomNode.svelte";
  import TileNode from "../../components/flow/TileNode.svelte";
  import RuneNode from "../../components/flow/RuneNode.svelte";
  import GateNode from "../../components/flow/GateNode.svelte";
  import HallNode from "../../components/flow/HallNode.svelte";
  import TowerNode from "../../components/flow/TowerNode.svelte";
  import WallNode from "../../components/flow/WallNode.svelte";
  import BridgeNode from "../../components/flow/BridgeNode.svelte";
  import DistrictNode from "../../components/flow/DistrictNode.svelte";
  import BuildTileNode from "../../components/flow/BuildTileNode.svelte";
  import TestTileNode from "../../components/flow/TestTileNode.svelte";
  import AnimatedEdge from "../../components/flow/AnimatedEdge.svelte";

  // App components
  import OverlayBar from "../../components/app/OverlayBar.svelte";
  import ZoomBar from "../../components/app/ZoomBar.svelte";
  import SaveDialog from "../../components/app/SaveDialog.svelte";
  import BlueprintList from "../../components/app/BlueprintList.svelte";
  import AuthModal from "../../components/app/AuthModal.svelte";
  import ApiKeyModal from "../../components/app/ApiKeyModal.svelte";
  import McpPanel from "../../components/app/McpPanel.svelte";
  import ChatPanel from "../../components/app/ChatPanel.svelte";
  import RepoImportModal from "../../components/app/RepoImportModal.svelte";
  import BuildTriggerDialog from "../../components/app/BuildTriggerDialog.svelte";
  import WorkspaceSwitcher from "../../components/app/WorkspaceSwitcher.svelte";

  // Stores
  import { getFort, loadDemoDistrict, zoomIntoFort, zoomIntoRoom, zoomIntoNode, zoomIntoRune, zoomIntoBuildCorridor, zoomIntoBuild, zoomOut, loadSavedFort } from "$lib/stores/fort.svelte.js";
  import { fetchPipelineStatus, getPipelineData } from "$lib/stores/assembly.svelte.js";
  import { toggleByShortcut, getOverlays, isOverlayActive } from "$lib/stores/overlays.svelte.js";
  import { getAuth, initAuth, openAuthModal, signOut } from "$lib/stores/auth.svelte.js";
  import { listForts, loadFort, deleteFort } from "$lib/persistence.js";
  import { initApiKey, setApiKey, hasApiKey } from "$lib/stores/apikey.svelte.js";
  import { autoConnect, connectedCount } from "$lib/stores/mcp.svelte.js";
  import { initWorkspaces, getWorkspaceState } from "$lib/stores/workspace.svelte.js";
  import { syncPollingToOverlays, stopAllPolling as stopTelemetry } from "$lib/stores/telemetry.svelte.js";
  import { loadSessionContext } from "$lib/play/session-learning.js";

  const nodeTypes = {
    fort: FortNode, room: RoomNode, tile: TileNode, rune: RuneNode,
    gate: GateNode, hall: HallNode, tower: TowerNode, wall: WallNode,
    bridge: BridgeNode, district: DistrictNode,
    buildtile: BuildTileNode, testtile: TestTileNode,
  };

  const edgeTypes = {
    animated: AnimatedEdge,
    default: AnimatedEdge,
  };

  const fort = getFort();
  const auth = getAuth();
  const overlays = getOverlays();

  let showSaveDialog = $state(false);
  let showBlueprints = $state(false);
  let showApiKeyModal = $state(false);
  let showMcpPanel = $state(false);
  let showChatPanel = $state(false);
  let showRepoImport = $state(false);
  /** @type {any[]} */
  let savedForts = $state([]);

  const levelNames = ["District", "Campus", "Wing", "Room", "Rune"];

  onMount(() => {
    loadDemoDistrict();
    initAuth();
    initApiKey();
    autoConnect().then(() => {
      // Load cross-session context after MCP connections are ready
      loadSessionContext("ecosystem");
    });
    // Init workspaces after auth is ready (if authenticated)
    initWorkspaces();

    return () => {
      stopTelemetry();
    };
  });

  function handleKeydown(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    const key = e.key.toUpperCase();
    if (["F", "T", "P", "D", "R", "C", "K", "A"].includes(key)) {
      e.preventDefault();
      toggleByShortcut(key);
      // Sync telemetry polling to overlay state after toggle
      syncPollingToOverlays();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      zoomOut();
    }
  }

  let showBuildTrigger = $state(false);
  let buildTargetFort = $state("");

  /** @param {{ node: any, event: any }} params */
  function handleNodeClick({ node }) {
    if (fort.zoomLevel === 0 && node.type === "fort") {
      // Pre-fetch pipeline data when entering a fort
      fetchPipelineStatus(node.id);
      zoomIntoFort(node.id);
    } else if (fort.zoomLevel === 1 && node.type === "gate" && isOverlayActive("assembly")) {
      // Assembly overlay + gate click = trigger build dialog
      buildTargetFort = fort.activeFortId;
      showBuildTrigger = true;
    } else if (fort.zoomLevel === 1 && node.type === "room") {
      if (isOverlayActive("assembly")) {
        // Assembly overlay: zoom into build corridor
        zoomIntoBuildCorridor(fort.activeFortId);
      } else {
        zoomIntoRoom(node.id);
      }
    } else if (fort.zoomLevel === 2 && node.type === "buildtile") {
      // Click build tile → zoom into test room
      zoomIntoBuild(node.data.buildId, fort.activeFortId);
    } else if (fort.zoomLevel === 2 && node.type === "room") {
      zoomIntoNode(node.id);
    } else if (fort.zoomLevel === 3 && node.type === "tile") {
      zoomIntoRune(node.id);
    }
  }

  async function loadBlueprintList() {
    if (!auth.user) {
      openAuthModal();
      return;
    }
    try {
      savedForts = await listForts(auth.user.id);
    } catch (e) {
      savedForts = [];
    }
    showBlueprints = !showBlueprints;
  }

  /** @param {string} id */
  async function handleLoadFort(id) {
    const saved = await loadFort(id);
    loadSavedFort(saved);
    showBlueprints = false;
  }

  /** @param {string} id */
  async function handleDeleteFort(id) {
    await deleteFort(id);
    savedForts = savedForts.filter((f) => f.id !== id);
  }

  /** Get overlay-specific edge style */
  function getEdgeStyle() {
    if (isOverlayActive("assembly")) return { stroke: "#4a9ade", strokeWidth: 2 };
    if (isOverlayActive("flow")) return { stroke: "#e8a84c", strokeWidth: 2 };
    if (isOverlayActive("thermal")) return { stroke: "#e85a5a", strokeWidth: 1.5 };
    if (isOverlayActive("topology")) return { stroke: "#c4956a", strokeWidth: 2 };
    if (isOverlayActive("temporal")) return { stroke: "#8a9a9e", strokeWidth: 1.5 };
    if (isOverlayActive("diagnostic")) return { stroke: "#5b6a8a", strokeWidth: 1.5 };
    if (isOverlayActive("confidence")) return { stroke: "#6ac48c", strokeWidth: 1.5 };
    if (isOverlayActive("rune")) return { stroke: "#c4956a", strokeWidth: 1.5 };
    return {};
  }
</script>

<svelte:head>
  <title>RuneFort — Editor</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="editor">
  <!-- Top toolbar -->
  <header class="toolbar">
    <div class="toolbar-left">
      {#if auth.user}
        <WorkspaceSwitcher />
      {:else}
        <a href="/" class="brand"><span class="brand-rune">ᚲ</span> RuneFort</a>
      {/if}
      <button class="tool-btn chat-btn" onclick={() => { showChatPanel = !showChatPanel; }} title="Chat">
        <span class="chat-icon">&#x1F4AC;</span>
      </button>
      <div class="breadcrumb">
        <span class="crumb active">L{fort.zoomLevel}</span>
        <span class="crumb-sep">/</span>
        <span class="crumb-name">{levelNames[fort.zoomLevel]}</span>
        {#if fort.activeFortId}
          <span class="crumb-sep">/</span>
          <span class="crumb-fort">{fort.activeFortId}</span>
        {/if}
        {#if fort.activeRoomId}
          <span class="crumb-sep">/</span>
          <span class="crumb-room">{fort.activeRoomId}</span>
        {/if}
      </div>
    </div>
    <div class="toolbar-center">
      <ZoomBar />
    </div>
    <div class="toolbar-right">
      <button class="tool-btn" onclick={() => { showRepoImport = true; }} title="Import Repo">
        <span class="import-icon">&#x1F4C2;</span>
      </button>
      <button class="tool-btn" onclick={() => { showApiKeyModal = true; }} title="API Key (BYOK)">
        <span class="key-icon">&#x1F511;</span>
        {#if hasApiKey()}
          <span class="key-dot"></span>
        {/if}
      </button>
      <button class="tool-btn" onclick={() => { showMcpPanel = !showMcpPanel; }} title="MCP Connections">
        <span class="plug-icon">&#x26A1;</span>
        {#if connectedCount() > 0}
          <span class="mcp-badge">{connectedCount()}</span>
        {/if}
      </button>
      <button class="tool-btn" onclick={loadBlueprintList} title="Saved Blueprints">
        ᚠ
      </button>
      <button class="tool-btn save" onclick={() => { if (!auth.user) { openAuthModal(); } else { showSaveDialog = true; } }} title="Save Blueprint">
        Save
      </button>
      {#if auth.user}
        <button class="tool-btn user" onclick={signOut} title="Sign out">
          {auth.user.email?.charAt(0).toUpperCase() || "U"}
        </button>
      {:else}
        <button class="tool-btn" onclick={openAuthModal} title="Sign in">
          Sign in
        </button>
      {/if}
    </div>
  </header>

  <!-- Canvas -->
  <div class="canvas-area">
    {#key `${fort.zoomLevel}-${fort.activeFortId}-${fort.activeRoomId}-${fort.activeNodeId}`}
      <SvelteFlow
        nodes={$state.snapshot(fort.nodes)}
        edges={$state.snapshot(fort.edges)}
        {nodeTypes}
        {edgeTypes}
        fitView
        colorMode="dark"
        defaultEdgeOptions={{ animated: false, style: getEdgeStyle() }}
        onnodeclick={handleNodeClick}
        minZoom={0.1}
        maxZoom={4}
      >
        <Background color="rgba(232, 168, 76, 0.03)" gap={48} />
        <Controls position="bottom-left" />
        <MiniMap
          pannable
          zoomable
          nodeColor={(/** @type {any} */ n) => {
            if (n.type === "fort") return n.data?.color || "#e8a84c";
            if (n.type === "room") return "#1c1d26";
            if (n.type === "gate") return "#e8a84c40";
            return "#15161d";
          }}
        />
      </SvelteFlow>
    {/key}

    <!-- Overlay hint (bottom right) -->
    <div class="overlay-hint">
      {#each overlays as o}
        {#if o.active && o.key !== "structure"}
          <span class="hint-tag" style="border-color: {o.key === 'thermal' ? '#e85a5a' : o.key === 'confidence' ? '#6ac48c' : o.key === 'topology' ? '#c4956a' : '#e8a84c'}40;">
            {o.label}
          </span>
        {/if}
      {/each}
    </div>

    <!-- Interaction hint -->
    {#if fort.zoomLevel < 4}
      <div class="click-hint">
        Click a {fort.zoomLevel === 0 ? "fort" : fort.zoomLevel === 1 ? "room" : fort.zoomLevel === 2 ? "room" : "tile"} to zoom in · Esc to zoom out
      </div>
    {/if}
  </div>

  <!-- Bottom overlay bar -->
  <footer class="bottom-bar">
    <OverlayBar />
    <div class="fort-info">
      {#if fort.dirty}
        <span class="dirty-dot" title="Unsaved changes"></span>
      {/if}
      <span class="info-label">{fort.fortName}</span>
      <span class="info-nodes">{fort.nodes.length} nodes · {fort.edges.length} edges</span>
    </div>
  </footer>

  <!-- Blueprint panel (slide-in) -->
  {#if showBlueprints}
    <div class="blueprints-panel">
      <BlueprintList
        forts={savedForts}
        onload={handleLoadFort}
        ondelete={handleDeleteFort}
      />
    </div>
  {/if}
</div>

<SaveDialog open={showSaveDialog} onclose={() => { showSaveDialog = false; }} />
<AuthModal />
<ApiKeyModal
  open={showApiKeyModal}
  onclose={() => { showApiKeyModal = false; }}
  onsave={(key) => { setApiKey(key); showApiKeyModal = false; }}
/>
<McpPanel open={showMcpPanel} onclose={() => { showMcpPanel = false; }} />
<ChatPanel
  open={showChatPanel}
  onclose={() => { showChatPanel = false; }}
  onRequestKey={() => { showChatPanel = false; showApiKeyModal = true; }}
/>
<RepoImportModal
  open={showRepoImport}
  onclose={() => { showRepoImport = false; }}
/>
<BuildTriggerDialog
  open={showBuildTrigger}
  fortId={buildTargetFort}
  onclose={() => { showBuildTrigger = false; }}
/>

<style>
  .editor {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: #09090d;
  }

  /* Toolbar */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    background: rgba(9, 9, 13, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(12px);
    z-index: 50;
    gap: 1rem;
  }
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
  }
  .toolbar-center { flex-shrink: 0; }
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .brand {
    font-family: "Cinzel", serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: #e4e2dc;
    text-decoration: none;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .brand-rune { color: #e8a84c; margin-right: 0.2rem; }
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    overflow: hidden;
  }
  .crumb {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    font-weight: 600;
    color: #e8a84c;
  }
  .crumb-sep { color: #44423d; font-size: 0.7rem; }
  .crumb-name, .crumb-fort, .crumb-room {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tool-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    color: #7a7770;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    font-weight: 500;
    padding: 0.35rem 0.65rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .tool-btn:hover {
    color: #e4e2dc;
    border-color: rgba(232, 168, 76, 0.3);
  }
  .tool-btn.save {
    color: #e8a84c;
    border-color: rgba(232, 168, 76, 0.3);
  }
  .tool-btn.save:hover {
    background: rgba(232, 168, 76, 0.1);
  }
  .tool-btn.user {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #e8a84c;
    border-color: rgba(232, 168, 76, 0.3);
    font-weight: 600;
  }
  .chat-icon {
    font-size: 0.75rem;
    line-height: 1;
  }
  .chat-btn {
    color: #e8a84c;
    border-color: rgba(232, 168, 76, 0.3);
  }
  .key-icon, .plug-icon, .import-icon {
    font-size: 0.75rem;
    line-height: 1;
  }
  .key-dot {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #22c55e;
  }
  .tool-btn {
    position: relative;
  }
  .mcp-badge {
    position: absolute;
    top: -2px;
    right: -4px;
    font-size: 0.5rem;
    font-weight: 700;
    background: #e8a84c;
    color: #09090d;
    border-radius: 50%;
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  /* Canvas */
  .canvas-area {
    flex: 1;
    position: relative;
  }
  .canvas-area :global(.svelte-flow) {
    --xy-background-color: #09090d;
    --xy-node-border-radius: 8px;
    --xy-edge-stroke: #44423d;
    --xy-edge-stroke-selected: #e8a84c;
    --xy-edge-stroke-width: 1;
    --xy-edge-label-color: #7a7770;
    --xy-edge-label-background-color: #15161d;
    --xy-controls-button-background-color: #15161d;
    --xy-controls-button-color: #7a7770;
    --xy-controls-button-border-color: rgba(255, 255, 255, 0.06);
    --xy-minimap-background-color: #0e0f14;
    --xy-minimap-mask-background: rgba(9, 9, 13, 0.7);
  }

  .overlay-hint {
    position: absolute;
    bottom: 4.5rem;
    right: 1rem;
    display: flex;
    gap: 0.3rem;
    z-index: 10;
  }
  .hint-tag {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    font-weight: 600;
    color: #e4e2dc;
    padding: 0.2rem 0.5rem;
    border: 1px solid;
    border-radius: 4px;
    background: rgba(14, 15, 20, 0.9);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .click-hint {
    position: absolute;
    bottom: 4.5rem;
    left: 50%;
    transform: translateX(-50%);
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #44423d;
    background: rgba(14, 15, 20, 0.9);
    padding: 0.3rem 0.75rem;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.04);
    z-index: 10;
    white-space: nowrap;
  }

  /* Bottom bar */
  .bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    background: rgba(9, 9, 13, 0.95);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(12px);
    z-index: 50;
    gap: 1rem;
  }
  .fort-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .dirty-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #e8a84c;
  }
  .info-label {
    font-family: "Cinzel", serif;
    font-size: 0.7rem;
    color: #e4e2dc;
    font-weight: 500;
  }
  .info-nodes {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #44423d;
  }

  /* Blueprints panel */
  .blueprints-panel {
    position: absolute;
    top: 3.5rem;
    right: 1rem;
    z-index: 100;
  }

  @media (max-width: 768px) {
    .toolbar { padding: 0.35rem 0.5rem; gap: 0.5rem; }
    .breadcrumb { display: none; }
    .bottom-bar { flex-direction: column; gap: 0.5rem; }
  }
</style>
