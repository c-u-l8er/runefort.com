<script>
  const overlays = [
    { key: "—", name: "Structure", desc: "Rooms, walls, corridors, gates, towers. Always on." },
    { key: "F", name: "Flow", desc: "Animated arrows showing data and token movement through phases." },
    { key: "T", name: "Thermal", desc: "Activity heatmap. Hot rooms are busy, cold rooms are dormant." },
    { key: "P", name: "Temporal", desc: "PULSE timing. Which rooms are in which phase right now." },
    { key: "D", name: "Diagnostic", desc: "PRISM scores, anomaly markers, failure clusters." },
    { key: "R", name: "Rune", desc: "The dark code. Operation configs, policy rules, causal chains." },
    { key: "C", name: "Confidence", desc: "Node confidence heatmap. Bright is high, dim is low." },
    { key: "K", name: "Topology", desc: "SCC highlighting, kappa values, cycle visualization." },
  ];
</script>

<section id="overlays" class="section-border">
  <div class="container">
    <span class="section-label">Overlays</span>
    <h2>Same floor plan, <em>different lenses</em></h2>
    <p class="lead">
      Architects have used transparent overlay sheets for centuries &mdash; structural, electrical,
      plumbing, HVAC on the same blueprint. RuneFort does the same for cognitive systems.
    </p>

    <div class="overlay-grid">
      {#each overlays as o}
        <div class="overlay-card">
          <div class="overlay-key">{o.key}</div>
          <div class="overlay-name">{o.name}</div>
          <div class="overlay-desc">{o.desc}</div>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .overlay-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin: 2.5rem 0;
  }
  @media (max-width: 900px) {
    .overlay-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 500px) {
    .overlay-grid { grid-template-columns: 1fr; }
  }
  .overlay-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.25rem;
    transition: all 0.3s ease;
  }
  .overlay-card:hover {
    border-color: var(--border-2);
  }
  .overlay-key {
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
  .overlay-name {
    font-family: var(--serif);
    font-size: 0.95rem;
    font-weight: 500;
    margin-bottom: 0.35rem;
    color: var(--text);
  }
  .overlay-desc {
    font-size: 0.78rem;
    color: var(--dim);
    line-height: 1.5;
  }
</style>
