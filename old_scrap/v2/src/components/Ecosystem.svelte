<script>
  const products = [
    { rune: "ᚲᚨᚠᛃᛞ", name: "Graphonomous", role: "Memory substrate. Nested in every fort." },
    { rune: "ᛏ", name: "Delegatic", role: "Governance. Its walls are every fort's walls." },
    { rune: "ᛚ", name: "TickTickClock", role: "Temporal intelligence. The district clocktower." },
    { rune: "ᚹ", name: "AgenTroMatic", role: "Multi-agent orchestration. 7-phase deliberation." },
    { rune: "ᚱ", name: "Deliberatic", role: "Argumentation protocol. Merkle-chained evidence." },
    { rune: "ᛉ", name: "PRISM", role: "Diagnostic watchtower. 9 CL dimensions." },
    { rune: "ᚠ", name: "WebHost.Systems", role: "Hosting layer. Deploy and invoke agents." },
    { rune: "ᛜ", name: "Agentelic", role: "Engineering. Spec-driven build pipeline." },
    { rune: "ᚷ", name: "FleetPrompt", role: "Marketplace. Trust-scored agent registry." },
    { rune: "ᛊ", name: "BendScript", role: "Knowledge editor. Canvas-based graph UI." },
    { rune: "ᛈ", name: "GeoFleetic", role: "Spatial intelligence. Federated fleet learning." },
    { rune: "ᛟ", name: "SpecPrompt", role: "Standards. Git-based spec lifecycle." },
  ];
</script>

<section id="ecosystem" class="section-border">
  <div class="container">
    <span class="section-label">Ecosystem</span>
    <h2>Every product gets <em>a fort</em></h2>
    <p class="lead">
      Every product in the [&] ecosystem maps to a fort. The layout is generated from
      PULSE loop manifests, [&] capability bindings, and Supabase schemas. If it declares a loop, it gets a fort.
    </p>

    <div class="eco-grid">
      {#each products as p}
        <div class="eco-card">
          <span class="eco-rune">{p.rune}</span>
          <div class="eco-name">{p.name}</div>
          <div class="eco-role">{p.role}</div>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .eco-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin: 2.5rem 0;
  }
  @media (max-width: 750px) {
    .eco-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 500px) {
    .eco-grid { grid-template-columns: 1fr; }
  }
  .eco-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.25rem;
    transition: all 0.3s ease;
  }
  .eco-card:hover {
    border-color: var(--border-2);
    transform: translateY(-2px);
  }
  .eco-rune {
    color: var(--rune);
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    display: block;
  }
  .eco-name {
    font-family: var(--serif);
    font-size: 0.95rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
    color: var(--text);
  }
  .eco-role {
    font-size: 0.78rem;
    color: var(--dim);
  }
</style>
