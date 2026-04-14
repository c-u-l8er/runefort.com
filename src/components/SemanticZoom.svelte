<script>
  import { SvelteFlow, Background, Controls } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import FortNode from "./flow/FortNode.svelte";
  import RoomNode from "./flow/RoomNode.svelte";
  import TileNode from "./flow/TileNode.svelte";
  import RuneNode from "./flow/RuneNode.svelte";
  import GateNode from "./flow/GateNode.svelte";
  import { levels, viewerTitles, dataTitles, flowData, jsonPanels } from "$lib/data/zoomData.js";

  const nodeTypes = { fort: FortNode, room: RoomNode, tile: TileNode, rune: RuneNode, gate: GateNode };

  let activeLevel = $state(0);

  function selectZoom(level) {
    activeLevel = level;
  }
</script>

<section id="zoom" class="section-border">
  <div class="container">
    <span class="section-label">Semantic Zoom</span>
    <h2>Five levels of <em>resolution</em></h2>
    <p class="lead">
      The same tile grid renders differently at each level. Zooming in reveals more;
      zooming out collapses detail into summary. No special-case rendering &mdash; one primitive, infinite depth.
    </p>

    <div class="zoom-grid">
      {#each levels as level}
        <button
          class="zoom-card"
          class:active={activeLevel === level.id}
          onclick={() => selectZoom(level.id)}
        >
          <div class="zoom-level">{level.code}</div>
          <div class="zoom-name">{level.name}</div>
          <div class="zoom-desc">{level.desc}</div>
        </button>
      {/each}
    </div>

    <!-- Svelte Flow canvas -->
    <div class="zoom-viewer">
      <div class="zoom-viewer-header">
        <span class="zoom-viewer-title">{viewerTitles[activeLevel]}</span>
        <span class="zoom-viewer-lang">flow</span>
      </div>
      <div class="zoom-canvas">
        {#key activeLevel}
          <SvelteFlow nodes={flowData[activeLevel].nodes} edges={flowData[activeLevel].edges} {nodeTypes} fitView colorMode="dark">
            <Background color="rgba(232, 168, 76, 0.04)" gap={48} />
            <Controls />
          </SvelteFlow>
        {/key}
      </div>
    </div>

    <!-- JSON data panel -->
    <div class="zoom-data-panel">
      <div class="zoom-data-header">
        <span class="zoom-data-title">{dataTitles[activeLevel]}</span>
        <span class="zoom-data-lang">json</span>
      </div>
      <pre class="zoom-json"><code>{jsonPanels[activeLevel]}</code></pre>
    </div>
  </div>
</section>

<style>
  .zoom-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1rem;
    margin: 2.5rem 0;
  }
  @media (max-width: 900px) {
    .zoom-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 550px) {
    .zoom-grid { grid-template-columns: 1fr; }
  }

  .zoom-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem 1.25rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    user-select: none;
    text-align: left;
    font-family: inherit;
    color: inherit;
  }
  .zoom-card:hover {
    border-color: var(--border-2);
    transform: translateY(-3px);
  }
  .zoom-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--amber);
    opacity: 0.3;
    transition: opacity 0.3s;
  }
  .zoom-card.active {
    border-color: rgba(232, 168, 76, 0.4);
    background: var(--surface-2);
  }
  .zoom-card.active::before {
    opacity: 1;
  }

  .zoom-level {
    font-family: var(--mono);
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--amber);
    margin-bottom: 0.5rem;
  }
  .zoom-name {
    font-family: var(--serif);
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--text);
  }
  .zoom-desc {
    font-size: 0.82rem;
    color: var(--dim);
    line-height: 1.6;
  }

  .zoom-viewer {
    position: relative;
    margin: 2rem 0 0;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .zoom-viewer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 1.25rem;
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
  }
  .zoom-viewer-title {
    font-family: var(--mono);
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--amber);
  }
  .zoom-viewer-lang {
    font-family: var(--mono);
    font-size: 0.6rem;
    letter-spacing: 0.06em;
    color: var(--muted);
  }

  .zoom-canvas {
    height: 480px;
    background: var(--surface);
  }

  /* Svelte Flow dark theme overrides */
  .zoom-canvas :global(.svelte-flow) {
    --xy-background-color: var(--surface);
    --xy-node-border-radius: 8px;
    --xy-edge-stroke: var(--dim);
    --xy-edge-stroke-selected: var(--amber);
    --xy-edge-stroke-width: 1;
    --xy-edge-label-color: var(--dim);
    --xy-edge-label-background-color: var(--surface-2);
    --xy-controls-button-background-color: var(--surface-2);
    --xy-controls-button-color: var(--dim);
    --xy-controls-button-border-color: var(--border);
    --xy-minimap-background-color: var(--surface);
  }

  .zoom-data-panel {
    position: relative;
    margin: 1.25rem 0 0;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .zoom-data-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 1.25rem;
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
  }
  .zoom-data-title {
    font-family: var(--mono);
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--dim);
  }
  .zoom-data-lang {
    font-family: var(--mono);
    font-size: 0.6rem;
    letter-spacing: 0.06em;
    color: var(--muted);
  }
  .zoom-json {
    background: var(--surface);
    margin: 0;
    padding: 1.5rem 1.25rem;
    font-family: var(--mono);
    font-size: 0.78rem;
    line-height: 1.8;
    color: var(--dim);
    overflow-x: auto;
    border-radius: 0;
    border: none;
  }
  .zoom-json code {
    font-family: var(--mono);
    font-size: 0.78rem;
    color: var(--stone);
  }
</style>
