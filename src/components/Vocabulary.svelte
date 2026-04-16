<script>
  let tab = $state("lenses");

  const lenses = [
    { key: "—", name: "Structure", desc: "Rooms, walls, corridors, gates. Always on." },
    { key: "F", name: "Flow", desc: "Animated arrows showing data and token movement." },
    { key: "T", name: "Thermal", desc: "Activity heatmap. Hot is busy, cold is dormant." },
    { key: "P", name: "Temporal", desc: "PULSE timing. Which rooms are in which phase now." },
    { key: "D", name: "Diagnostic", desc: "PRISM scores, anomaly markers, failure clusters." },
    { key: "R", name: "Rune", desc: "The dark code. Configs, policy rules, causal chains." },
    { key: "C", name: "Confidence", desc: "Node confidence heatmap. Bright high, dim low." },
    { key: "K", name: "Topology", desc: "SCC highlighting, κ values, cycle visualization." },
  ];

  const pieces = [
    { name: "RuneTile", role: "Any single cell", rule: "The atomic primitive" },
    { name: "RuneRoom", role: "A cognitive domain", rule: "Bordered tile group" },
    { name: "RuneHall", role: "A data flow path", rule: "Linear tile sequence" },
    { name: "RuneTower", role: "Observation point", rule: "Vertically stacked tiles" },
    { name: "RuneGate", role: "Router or checkpoint", rule: "Tile with filter state" },
    { name: "RuneWall", role: "Policy boundary", rule: "Barrier tile sequence" },
    { name: "RuneFort", role: "One cognitive system", rule: "Root container — forts nest inside rooms" },
    { name: "RuneBridge", role: "Inter-system exchange", rule: "Fort-to-fort connection" },
    { name: "RuneDistrict", role: "Full ecosystem view", rule: "Multi-fort layout" },
  ];
</script>

<section id="vocabulary" class="section-border">
  <div class="container">
    <span class="section-label">The vocabulary</span>
    <h2>One floor plan. <em>It reveals itself.</em></h2>
    <p class="lead">
      You don't need to learn eighteen things before you start. The default view is just structure.
      Everything below is what&rsquo;s <em>available</em> when you want more &mdash; reached by hovering a room
      or clicking a wall, not by opening a menu.
    </p>

    <div class="tab-row" role="tablist">
      <button
        role="tab"
        class="tab"
        class:active={tab === "lenses"}
        aria-selected={tab === "lenses"}
        onclick={() => (tab = "lenses")}
      >
        <span class="tab-n">9</span> Lenses
        <span class="tab-sub">on hover / on proximity</span>
      </button>
      <button
        role="tab"
        class="tab"
        class:active={tab === "pieces"}
        aria-selected={tab === "pieces"}
        onclick={() => (tab = "pieces")}
      >
        <span class="tab-n">9</span> Pieces
        <span class="tab-sub">one tile, composed</span>
      </button>
    </div>

    {#if tab === "lenses"}
      <div class="lens-grid" role="tabpanel">
        {#each lenses as l}
          <div class="lens-card">
            <div class="lens-key">{l.key}</div>
            <div class="lens-name">{l.name}</div>
            <div class="lens-desc">{l.desc}</div>
          </div>
        {/each}
      </div>
      <p class="tab-caption">
        Hover a corridor &rarr; Flow fades in. Walk near a busy room &rarr; Thermal glows.
        Click a wall &rarr; Rune reveals. <em>No overlay menu &mdash; motion is the menu.</em>
      </p>
    {:else}
      <div class="piece-grid" role="tabpanel">
        {#each pieces as p}
          <div class="piece-card">
            <div class="piece-name">&lt;{p.name}&gt;</div>
            <div class="piece-role">{p.role}</div>
            <div class="piece-rule">{p.rule}</div>
          </div>
        {/each}
      </div>
      <p class="tab-caption">
        The Minecraft constraint: everything is tiles. A room is tiles with shared borders.
        A corridor is tiles in a line. <em>If you can't build it from tiles, it doesn't belong in the fort.</em>
      </p>
    {/if}
  </div>
</section>

<style>
  .tab-row {
    display: flex;
    gap: 0.5rem;
    margin: 2rem 0 2rem;
    flex-wrap: wrap;
  }
  .tab {
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.85rem 1.25rem;
    color: var(--dim);
    font-family: var(--sans);
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
  }
  .tab:hover {
    color: var(--text);
    border-color: var(--border-2);
  }
  .tab.active {
    color: var(--text);
    border-color: var(--amber-dim);
    background: var(--amber-glow);
  }
  .tab-n {
    font-family: var(--serif);
    font-size: 1.2rem;
    color: var(--amber);
  }
  .tab-sub {
    font-family: var(--mono);
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    color: var(--dim);
    text-transform: uppercase;
  }

  .lens-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.85rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 900px) {
    .lens-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 500px) {
    .lens-grid { grid-template-columns: 1fr; }
  }
  .lens-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.1rem;
    transition: all 0.3s ease;
  }
  .lens-card:hover { border-color: var(--border-2); }
  .lens-key {
    font-family: var(--mono);
    font-size: 0.7rem;
    font-weight: 600;
    width: 1.8rem;
    height: 1.8rem;
    border: 1px solid var(--amber-dim);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--amber);
    margin-bottom: 0.75rem;
    background: var(--amber-glow);
  }
  .lens-name {
    font-family: var(--serif);
    font-size: 0.95rem;
    font-weight: 500;
    margin-bottom: 0.3rem;
    color: var(--text);
  }
  .lens-desc {
    font-size: 0.78rem;
    color: var(--dim);
    line-height: 1.5;
  }

  .piece-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.85rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 900px) {
    .piece-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 500px) {
    .piece-grid { grid-template-columns: 1fr; }
  }
  .piece-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem 1.1rem;
    transition: all 0.3s ease;
  }
  .piece-card:hover { border-color: var(--border-2); }
  .piece-name {
    font-family: var(--mono);
    font-size: 0.82rem;
    color: var(--amber);
    margin-bottom: 0.4rem;
  }
  .piece-role {
    font-family: var(--serif);
    font-size: 0.95rem;
    color: var(--text);
    margin-bottom: 0.35rem;
  }
  .piece-rule {
    font-size: 0.76rem;
    color: var(--dim);
    line-height: 1.5;
  }

  .tab-caption {
    font-size: 0.9rem;
    color: var(--dim);
    line-height: 1.7;
    max-width: 700px;
    margin-top: 1rem;
  }
  .tab-caption em {
    font-style: normal;
    color: var(--text);
  }
</style>
