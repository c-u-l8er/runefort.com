<script>
  import { getFactoryState, generateSyntheticSignals, runSyntheticPipeline, triageSignal, ingestSignal } from "$lib/stores/factory.svelte.js";

  const PRODUCTS = [
    { id: "graphonomous", name: "Graphonomous", rune: "ᚲ", desc: "Continual learning engine", color: "#e8a84c" },
    { id: "bendscript", name: "BendScript", rune: "ᛃ", desc: "Knowledge graph editor", color: "#6ac48c" },
    { id: "webhost-systems", name: "WebHost.Systems", rune: "ᚹ", desc: "Hosting platform", color: "#8a9a9e" },
    { id: "agentromatic", name: "AgenTroMatic", rune: "ᛏ", desc: "Deliberation engine", color: "#c4956a" },
    { id: "delegatic", name: "Delegatic", rune: "ᛉ", desc: "Governance protocol", color: "#5b6a8a" },
    { id: "fleetprompt", name: "FleetPrompt", rune: "ᚷ", desc: "Agent marketplace", color: "#e85a5a" },
    { id: "specprompt", name: "SpecPrompt", rune: "ᛊ", desc: "Spec standard & registry", color: "#a8c4e8" },
    { id: "agentelic", name: "Agentelic", rune: "ᛈ", desc: "Agent orchestration", color: "#d4a8e8" },
    { id: "geofleetic", name: "GeoFleetic", rune: "ᚦ", desc: "Spatial intelligence", color: "#a8e8c4" },
    { id: "ticktickclock", name: "TickTickClock", rune: "ᚢ", desc: "Temporal intelligence", color: "#e8d4a8" },
    { id: "opensentience", name: "OpenSentience", rune: "ᚺ", desc: "Research protocols", color: "#e8a8c4" },
    { id: "deliberatic", name: "Deliberatic", rune: "ᚾ", desc: "Deliberation protocol", color: "#c4e8a8" },
    { id: "runefort", name: "RuneFort", rune: "ᛞ", desc: "Spatial cognition viz", color: "#e8c4a8" },
  ];

  const PHASES = [
    { key: "spec_lifecycle", label: "SPEC", rune: "ᚲ", desc: "Validate spec" },
    { key: "build_pipeline", label: "BUILD", rune: "ᚠ", desc: "Compile & test" },
    { key: "trust_scoring", label: "TRUST", rune: "ᚹ", desc: "Score reputation" },
    { key: "deploy_gate", label: "DEPLOY", rune: "ᛞ", desc: "Gate check" },
  ];

  const factoryState = $derived(getFactoryState());
  let selectedProduct = $state(null);
  let fed = $state(false);
  let showingResult = $state(false);
  let particles = $state([]);
  let conveyorItems = $state([]);

  // Active run for the selected product
  let activeRun = $derived(
    factoryState.activeRuns.find(r => r.fortId === selectedProduct?.id) || null
  );
  let completedRun = $derived(
    factoryState.completedRuns.find(r => r.fortId === selectedProduct?.id) || null
  );

  // All phases completed successfully?
  let allPassed = $derived(() => {
    const run = activeRun || completedRun;
    if (!run) return false;
    return run.phases.every(p => p.status === "succeeded" || p.status === "skipped");
  });

  // Phase status from the active or completed run
  function phaseStatus(phaseKey) {
    const run = activeRun || completedRun;
    if (!run) return "idle";
    const phase = run.phases.find(p => p.phase === phaseKey);
    if (!phase) return "idle";
    return phase.status;
  }

  let feedZoneEl = $state(null);

  function feedProduct(product) {
    selectedProduct = product;
    fed = true;
    showingResult = false;

    // Spawn particles
    spawnParticles();

    // Auto-scroll to pipeline view
    setTimeout(() => {
      feedZoneEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    // Feed it into the factory — create a synthetic signal and run it
    const signalId = crypto.randomUUID();
    ingestSignal({
      id: signalId,
      source: "manual",
      classification: "spec_change",
      classificationConfidence: 1.0,
      fortId: product.id,
      payload: { demo: true, productName: product.name },
      timestamp: new Date().toISOString(),
      status: "pending",
    });

    // Small delay then triage and run
    setTimeout(() => {
      triageSignal(signalId, "spec_change", 1.0);
      setTimeout(() => {
        runSyntheticPipeline(signalId);
      }, 400);
    }, 600);

    // Conveyor belt animation
    startConveyor(product);
  }

  function spawnParticles() {
    const newParticles = [];
    for (let i = 0; i < 24; i++) {
      newParticles.push({
        id: i,
        x: 50 + (Math.random() - 0.5) * 30,
        y: 40 + (Math.random() - 0.5) * 20,
        delay: Math.random() * 0.8,
        duration: 1.5 + Math.random() * 2,
        size: 2 + Math.random() * 4,
      });
    }
    particles = newParticles;
  }

  function startConveyor(product) {
    conveyorItems = [];
    const items = ["spec.md", "src/", "tests/", "build/", product.name.toLowerCase() + ".wasm"];
    items.forEach((label, i) => {
      setTimeout(() => {
        conveyorItems = [...conveyorItems, { id: i, label, entered: true }];
      }, 800 + i * 600);
    });
  }

  function reset() {
    selectedProduct = null;
    fed = false;
    showingResult = false;
    particles = [];
    conveyorItems = [];
  }
</script>

<svelte:head>
  <title>Dark Factory | RuneFort</title>
  <meta name="description" content="Feed a product spec in. Watch autonomous agents build it. No human in the loop." />
</svelte:head>

<!-- Ambient glows -->
<div class="glow glow-1"></div>
<div class="glow glow-2"></div>
<div class="glow glow-3"></div>

<nav class="factory-nav">
  <div class="nav-inner">
    <a href="/" class="nav-brand"><span class="rune">ᚲ</span> RuneFort</a>
    <span class="nav-label">DARK FACTORY</span>
    <a href="/app" class="nav-cta">Open Editor</a>
  </div>
</nav>

<main class="factory-page">
  <!-- Hero -->
  <section class="factory-hero" class:collapsed={fed}>
    <div class="hero-rune-bg">ᛞ</div>
    <div class="container">
      <div class="hero-badge">L5 — Fully Autonomous</div>
      <h1>The Dark<br/><em>Factory</em></h1>
      <p class="hero-sub">
        Spec goes in. Tested code comes out.<br/>
        No human writes or reviews code.
      </p>
      <div class="hero-runes">ᚲ → ᚨ → ᚠ → ᛃ → ᛞ</div>
    </div>
  </section>

  <!-- Feed Zone -->
  <section class="feed-zone" bind:this={feedZoneEl}>
    <div class="container">
      {#if !fed}
        <h2>Feed a product into the factory</h2>
        <p class="feed-desc">Select a product spec. Watch the autonomous pipeline process it.</p>
        <div class="product-grid">
          {#each PRODUCTS as product}
            <button
              class="product-card"
              style="--card-color: {product.color}"
              onclick={() => feedProduct(product)}
            >
              <span class="product-rune">{product.rune}</span>
              <span class="product-name">{product.name}</span>
              <span class="product-desc">{product.desc}</span>
              <span class="feed-arrow">→ FEED</span>
            </button>
          {/each}
        </div>
      {:else}
        <!-- Factory Processing View -->
        <div class="processing-view">
          <div class="processing-header">
            <button class="back-btn" onclick={reset}>← Back</button>
            <div class="processing-product" style="--card-color: {selectedProduct.color}">
              <span class="product-rune">{selectedProduct.rune}</span>
              <span>{selectedProduct.name}</span>
            </div>
            <div class="processing-status">
              {#if activeRun}
                <span class="status-dot pulse"></span> Processing
              {:else if completedRun?.outcome?.status === "success"}
                <span class="status-dot success"></span> Deployed
              {:else if completedRun}
                <span class="status-dot fail"></span> Failed
              {:else}
                <span class="status-dot"></span> Queued
              {/if}
            </div>
          </div>

          <!-- Conveyor Belt -->
          <div class="conveyor-section">
            <div class="conveyor-label">CONVEYOR</div>
            <div class="conveyor-belt">
              <div class="conveyor-track"></div>
              {#each conveyorItems as item (item.id)}
                <div class="conveyor-item" class:entered={item.entered}>
                  <span class="conveyor-item-label">{item.label}</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Pipeline Phases -->
          <div class="pipeline" class:complete={allPassed()}>
            {#each PHASES as phase, i}
              {@const status = phaseStatus(phase.key)}
              <div class="pipeline-phase" class:running={status === "running"} class:succeeded={status === "succeeded"} class:failed={status === "failed"} class:skipped={status === "skipped"}>
                <div class="phase-rune">{phase.rune}</div>
                <div class="phase-label">{phase.label}</div>
                <div class="phase-desc">{phase.desc}</div>
                <div class="phase-status">
                  {#if status === "running"}
                    <span class="spinner"></span>
                  {:else if status === "succeeded"}
                    <span class="check">&#10003;</span>
                  {:else if status === "failed"}
                    <span class="cross">&#10007;</span>
                  {:else if status === "skipped"}
                    <span class="skip">—</span>
                  {:else}
                    <span class="pending-dot"></span>
                  {/if}
                </div>
                {#if i < PHASES.length - 1}
                  <div class="phase-connector" class:active={status === "succeeded"}></div>
                {/if}
              </div>
            {/each}
          </div>

          <!-- Particle Cloud -->
          <div class="particle-field">
            {#each particles as p (p.id)}
              <div
                class="particle"
                style="
                  left: {p.x}%;
                  top: {p.y}%;
                  animation-delay: {p.delay}s;
                  animation-duration: {p.duration}s;
                  width: {p.size}px;
                  height: {p.size}px;
                "
              ></div>
            {/each}
          </div>

          <!-- Output Console -->
          <div class="output-console">
            <div class="console-header">
              <span class="console-dot red"></span>
              <span class="console-dot yellow"></span>
              <span class="console-dot green"></span>
              <span class="console-title">factory.log</span>
            </div>
            <div class="console-body">
              <div class="console-line dim">$ runefort factory --product {selectedProduct?.id}</div>
              {#if factoryState.signalQueue.length > 0 || factoryState.activeRuns.length > 0 || factoryState.completedRuns.length > 0}
                <div class="console-line">&#9656; Signal ingested: spec_change → {selectedProduct?.id}</div>
              {/if}
              {#if activeRun || completedRun}
                {@const run = activeRun || completedRun}
                {#each run.phases as phase}
                  {#if phase.status === "running"}
                    <div class="console-line amber">&#9656; {phase.phase} ... <span class="blink">|</span></div>
                  {:else if phase.status === "succeeded"}
                    <div class="console-line green">&#10003; {phase.phase} — passed</div>
                  {:else if phase.status === "failed"}
                    <div class="console-line red">&#10007; {phase.phase} — FAILED</div>
                  {:else if phase.status === "skipped"}
                    <div class="console-line dim">— {phase.phase} — skipped</div>
                  {/if}
                {/each}
                {#if completedRun?.outcome?.status === "success"}
                  <div class="console-line green bold">&#10003; Pipeline complete. Deployed to production.</div>
                  <div class="console-line dim">&#9656; Outcome fed to Graphonomous knowledge graph.</div>
                {/if}
              {/if}
            </div>
          </div>

          <!-- Run again -->
          {#if completedRun && !activeRun}
            <div class="run-again">
              <button class="btn btn-primary" onclick={() => feedProduct(selectedProduct)}>
                Run Again
              </button>
              <button class="btn btn-secondary" onclick={reset}>
                Choose Another Product
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </section>

  <!-- Maturity Strip -->
  <section class="maturity-section">
    <div class="container">
      <div class="maturity-strip">
        <div class="maturity-level"><div class="maturity-num">L0</div><div class="maturity-title">Manual</div></div>
        <div class="maturity-level"><div class="maturity-num">L1</div><div class="maturity-title">Delegation</div></div>
        <div class="maturity-level"><div class="maturity-num">L2</div><div class="maturity-title">Pairing</div></div>
        <div class="maturity-level"><div class="maturity-num">L3</div><div class="maturity-title">Review</div></div>
        <div class="maturity-level"><div class="maturity-num">L4</div><div class="maturity-title">Spec-Driven</div></div>
        <div class="maturity-level active"><div class="maturity-num">L5</div><div class="maturity-title">Dark Factory</div></div>
      </div>
      <p class="maturity-note">You are here. The factory runs with the lights off.</p>
    </div>
  </section>

  <!-- Footer -->
  <footer class="factory-footer">
    <div class="container">
      <span class="footer-brand"><span class="rune">ᚲ</span> RuneFort</span>
      <span class="footer-copy">&copy; 2026 [&] Protocol ecosystem</span>
      <a href="/" class="footer-link">Home</a>
    </div>
  </footer>
</main>

<style>
  /* ═══ Page ═══ */
  .factory-page {
    min-height: 100vh;
    position: relative;
    z-index: 1;
  }

  .glow-3 {
    position: fixed;
    width: 400px;
    height: 400px;
    background: rgba(232, 168, 76, 0.04);
    top: 50%;
    left: 20%;
    border-radius: 50%;
    filter: blur(120px);
    pointer-events: none;
    z-index: 0;
    animation: drift 22s ease-in-out infinite alternate;
  }

  @keyframes drift {
    0% { transform: translate(0, 0); }
    100% { transform: translate(30px, -20px); }
  }

  /* ═══ Nav ═══ */
  .factory-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 100;
    background: rgba(9, 9, 13, 0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 0.75rem 0;
  }
  .nav-inner {
    max-width: var(--max-w);
    margin: 0 auto;
    padding: 0 var(--gutter);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .nav-brand {
    font-family: var(--serif);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-decoration: none;
  }
  .nav-brand .rune { color: var(--amber); margin-right: 0.3rem; }
  .nav-label {
    font-family: var(--mono);
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    color: var(--amber);
    padding: 0.25rem 0.75rem;
    border: 1px solid rgba(232, 168, 76, 0.3);
    border-radius: 100px;
  }
  .nav-cta {
    font-family: var(--mono);
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--bg);
    background: var(--amber);
    padding: 0.35rem 0.85rem;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 600;
  }

  /* ═══ Hero ═══ */
  .factory-hero {
    padding: 10rem 0 5rem;
    text-align: center;
    position: relative;
    overflow: hidden;
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    max-height: 600px;
  }
  .factory-hero.collapsed {
    padding: 6rem 0 1.5rem;
    max-height: 180px;
    opacity: 0.7;
  }
  .factory-hero.collapsed .hero-sub,
  .factory-hero.collapsed .hero-runes,
  .factory-hero.collapsed .hero-badge {
    opacity: 0;
    pointer-events: none;
    max-height: 0;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
  .factory-hero.collapsed h1 {
    font-size: clamp(1.4rem, 3vw, 2rem);
    margin-bottom: 0;
  }
  .hero-rune-bg {
    position: absolute;
    font-size: 40rem;
    color: rgba(232, 168, 76, 0.015);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    font-weight: 300;
    line-height: 1;
  }
  .hero-badge {
    font-family: var(--mono);
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--amber);
    padding: 0.35rem 1rem;
    border: 1px solid rgba(232, 168, 76, 0.25);
    border-radius: 100px;
    display: inline-block;
    margin-bottom: 2rem;
    background: rgba(232, 168, 76, 0.04);
  }
  .factory-hero h1 {
    font-family: var(--serif);
    font-weight: 400;
    font-size: clamp(3rem, 8vw, 6rem);
    line-height: 1.05;
    letter-spacing: 0.03em;
    margin-bottom: 1.5rem;
    color: var(--text);
  }
  .factory-hero h1 em {
    font-style: normal;
    color: var(--amber);
    display: block;
  }
  .hero-sub {
    font-size: 1.15rem;
    color: var(--dim);
    max-width: 500px;
    margin: 0 auto 2rem;
    line-height: 1.8;
  }
  .hero-runes {
    font-family: var(--mono);
    font-size: 1.1rem;
    color: var(--rune);
    letter-spacing: 0.3em;
    opacity: 0.5;
  }

  /* ═══ Feed Zone ═══ */
  .feed-zone {
    padding: 4rem 0;
  }
  .feed-zone h2 {
    font-family: var(--serif);
    font-weight: 400;
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    text-align: center;
    margin-bottom: 0.75rem;
  }
  .feed-desc {
    text-align: center;
    color: var(--dim);
    font-size: 0.95rem;
    margin-bottom: 2.5rem;
  }

  /* Product Grid */
  .product-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.85rem;
    max-width: 960px;
    margin: 0 auto;
  }
  @media (max-width: 900px) {
    .product-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 600px) {
    .product-grid { grid-template-columns: repeat(2, 1fr); }
  }
  .product-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.2rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
    position: relative;
    overflow: hidden;
    font-family: inherit;
    color: inherit;
  }
  .product-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--card-color);
    opacity: 0.5;
    transition: opacity 0.3s;
  }
  .product-card:hover {
    border-color: var(--card-color);
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
  .product-card:hover::before { opacity: 1; }
  .product-card:hover .feed-arrow {
    opacity: 1;
    transform: translateX(0);
  }
  .product-rune {
    font-size: 1.8rem;
    color: var(--card-color);
  }
  .product-name {
    font-family: var(--serif);
    font-size: 1rem;
    font-weight: 500;
    color: var(--text);
  }
  .product-desc {
    font-size: 0.75rem;
    color: var(--dim);
  }
  .feed-arrow {
    font-family: var(--mono);
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    color: var(--card-color);
    opacity: 0;
    transform: translateX(-10px);
    transition: all 0.3s ease;
    margin-top: 0.25rem;
  }

  /* ═══ Processing View ═══ */
  .processing-view {
    position: relative;
  }
  .processing-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
  }
  .back-btn {
    font-family: var(--mono);
    font-size: 0.7rem;
    color: var(--dim);
    background: none;
    border: 1px solid var(--border);
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .back-btn:hover { color: var(--text); border-color: var(--border-2); }
  .processing-product {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--serif);
    font-size: 1.1rem;
    color: var(--text);
  }
  .processing-product .product-rune {
    font-size: 1.4rem;
  }
  .processing-status {
    font-family: var(--mono);
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    color: var(--dim);
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--muted);
    display: inline-block;
  }
  .status-dot.pulse {
    background: var(--amber);
    animation: pulse-dot 1.5s ease-in-out infinite;
  }
  .status-dot.success { background: var(--green); }
  .status-dot.fail { background: var(--alert); }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(232, 168, 76, 0.4); }
    50% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(232, 168, 76, 0); }
  }

  /* ═══ Conveyor Belt ═══ */
  .conveyor-section {
    margin-bottom: 2.5rem;
  }
  .conveyor-label {
    font-family: var(--mono);
    font-size: 0.55rem;
    letter-spacing: 0.15em;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }
  .conveyor-belt {
    position: relative;
    height: 48px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow-x: auto;
    overflow-y: hidden;
    display: flex;
    align-items: center;
    padding: 0 1rem;
    gap: 0.75rem;
    scrollbar-width: none;
  }
  .conveyor-belt::-webkit-scrollbar { display: none; }
  .conveyor-track {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: repeating-linear-gradient(
      90deg,
      var(--amber) 0px,
      var(--amber) 8px,
      transparent 8px,
      transparent 16px
    );
    animation: conveyor-scroll 2s linear infinite;
  }
  @keyframes conveyor-scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-16px); }
  }
  .conveyor-item {
    font-family: var(--mono);
    font-size: 0.7rem;
    color: var(--amber);
    background: var(--amber-dim);
    padding: 0.3rem 0.6rem;
    border-radius: 3px;
    border: 1px solid rgba(232, 168, 76, 0.2);
    opacity: 0;
    transform: translateX(-20px);
    animation: slide-in 0.4s ease forwards;
    white-space: nowrap;
  }
  .conveyor-item.entered {
    opacity: 1;
    transform: translateX(0);
  }
  @keyframes slide-in {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  /* ═══ Pipeline ═══ */
  .pipeline {
    display: flex;
    gap: 0;
    margin-bottom: 2.5rem;
    position: relative;
  }
  .pipeline.complete {
    box-shadow: 0 0 40px rgba(106, 196, 140, 0.08);
    border-radius: 8px;
  }
  .pipeline-phase {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 1.5rem 1rem;
    text-align: center;
    transition: all 0.4s ease;
    position: relative;
  }
  .pipeline-phase:first-child { border-radius: 8px 0 0 8px; }
  .pipeline-phase:last-child { border-radius: 0 8px 8px 0; }
  .pipeline-phase.running {
    border-color: var(--amber);
    background: rgba(232, 168, 76, 0.04);
    box-shadow: 0 0 24px rgba(232, 168, 76, 0.08);
  }
  .pipeline-phase.succeeded {
    border-color: var(--green);
    background: rgba(106, 196, 140, 0.04);
  }
  .pipeline-phase.failed {
    border-color: var(--alert);
    background: rgba(232, 90, 90, 0.04);
  }
  .phase-rune {
    font-size: 1.6rem;
    color: var(--rune);
    margin-bottom: 0.5rem;
    transition: color 0.3s;
  }
  .pipeline-phase.running .phase-rune { color: var(--amber); }
  .pipeline-phase.succeeded .phase-rune { color: var(--green); }
  .pipeline-phase.failed .phase-rune { color: var(--alert); }
  .phase-label {
    font-family: var(--mono);
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    color: var(--dim);
    margin-bottom: 0.25rem;
  }
  .phase-desc {
    font-size: 0.72rem;
    color: var(--muted);
  }
  .phase-status {
    margin-top: 0.75rem;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--amber-dim);
    border-top-color: var(--amber);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .check { color: var(--green); font-size: 1.1rem; }
  .cross { color: var(--alert); font-size: 1.1rem; }
  .skip { color: var(--muted); font-size: 1rem; }
  .pending-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--muted);
  }
  .phase-connector {
    position: absolute;
    right: -1px;
    top: 50%;
    transform: translateY(-50%);
    width: 2px;
    height: 40%;
    background: var(--border);
    z-index: 2;
    transition: background 0.3s;
  }
  .phase-connector.active {
    background: var(--green);
    box-shadow: 0 0 8px rgba(106, 196, 140, 0.3);
  }

  /* ═══ Particles ═══ */
  .particle-field {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
  }
  .particle {
    position: absolute;
    background: var(--amber);
    border-radius: 50%;
    opacity: 0;
    animation: float-particle ease-in-out infinite;
  }
  @keyframes float-particle {
    0% { opacity: 0; transform: translate(0, 0) scale(0); }
    20% { opacity: 0.6; transform: translate(10px, -20px) scale(1); }
    80% { opacity: 0.3; transform: translate(-10px, -60px) scale(0.8); }
    100% { opacity: 0; transform: translate(5px, -100px) scale(0); }
  }

  /* ═══ Console ═══ */
  .output-console {
    background: #0a0a0f;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    font-family: var(--mono);
    font-size: 0.72rem;
  }
  .console-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1rem;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .console-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .console-dot.red { background: #e85a5a; }
  .console-dot.yellow { background: #e8a84c; }
  .console-dot.green { background: #6ac48c; }
  .console-title {
    margin-left: 0.5rem;
    color: var(--muted);
    font-size: 0.65rem;
  }
  .console-body {
    padding: 1rem;
    max-height: 240px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .console-line {
    color: var(--dim);
    line-height: 1.6;
  }
  .console-line.dim { color: var(--muted); }
  .console-line.amber { color: var(--amber); }
  .console-line.green { color: var(--green); }
  .console-line.red { color: var(--alert); }
  .console-line.bold { font-weight: 600; }
  .blink {
    animation: blink 0.8s step-end infinite;
  }
  @keyframes blink {
    50% { opacity: 0; }
  }

  /* ═══ Run Again ═══ */
  .run-again {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    margin-top: 2rem;
  }

  /* ═══ Maturity Strip ═══ */
  .maturity-section {
    padding: 4rem 0;
    border-top: 1px solid var(--border);
  }
  .maturity-strip {
    display: flex;
    gap: 0;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
  .maturity-level {
    flex: 1;
    padding: 1rem;
    border-right: 1px solid var(--border);
    background: var(--surface);
    text-align: center;
  }
  .maturity-level:last-child { border-right: none; }
  .maturity-level.active {
    background: var(--surface-2);
    border-bottom: 2px solid var(--amber);
  }
  .maturity-num {
    font-family: var(--mono);
    font-size: 0.6rem;
    color: var(--muted);
    margin-bottom: 0.2rem;
  }
  .maturity-level.active .maturity-num { color: var(--amber); }
  .maturity-title {
    font-family: var(--serif);
    font-size: 0.8rem;
    color: var(--dim);
  }
  .maturity-level.active .maturity-title { color: var(--text); font-weight: 500; }
  .maturity-note {
    text-align: center;
    color: var(--muted);
    font-size: 0.8rem;
    margin-top: 1rem;
    font-style: italic;
  }

  /* ═══ Footer ═══ */
  .factory-footer {
    border-top: 1px solid var(--border);
    padding: 1.5rem 0;
  }
  .factory-footer .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .footer-brand {
    font-family: var(--serif);
    font-size: 0.75rem;
    color: var(--dim);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .footer-brand .rune { color: var(--rune); margin-right: 0.2rem; }
  .footer-copy {
    font-size: 0.7rem;
    color: var(--muted);
  }
  .footer-link {
    font-family: var(--mono);
    font-size: 0.65rem;
    color: var(--muted);
    text-decoration: none;
  }
  .footer-link:hover { color: var(--amber); }

  @media (max-width: 600px) {
    .pipeline { flex-direction: column; }
    .pipeline-phase:first-child { border-radius: 8px 8px 0 0; }
    .pipeline-phase:last-child { border-radius: 0 0 8px 8px; }
    .phase-connector { display: none; }
    .maturity-strip { flex-direction: column; }
  }
</style>
