<section class="section-border">
  <div class="container">
    <span class="section-label">Why Not a Dashboard</span>
    <h2>Blueprints scale.<br /><em>Dashboards don't.</em></h2>
    <p class="lead">
      Blueprints were literally invented to represent massive buildings and remain navigable.
      Dungeon maps become mazes. Isometric views become visual noise. Dashboards run out of panels.
      Blueprints handle campus &rarr; room &rarr; detail with the same visual language.
    </p>

    <div class="split">
      <div class="df-card dark">
        <h3>Current observability</h3>
        <ul>
          <li>Flat dashboards with panels that multiply</li>
          <li>Trace waterfalls that require expertise to read</li>
          <li>Abstract DAG visualizations disconnected from runtime</li>
          <li>No spatial intuition for non-engineers</li>
          <li>Auditors, PMs, and stakeholders locked out</li>
        </ul>
      </div>
      <div class="df-card lit">
        <h3>Spatial cognition</h3>
        <ul>
          <li><span class="rune-glyph">ᚲ</span> Walk through the system, don't scan a spreadsheet</li>
          <li><span class="rune-glyph">ᛊ</span> Overlay system &mdash; one map, multiple lenses</li>
          <li><span class="rune-glyph">ᛞ</span> Same tile grid from district to single operation</li>
          <li><span class="rune-glyph">ᛗ</span> Immediately legible to anyone, runes reward depth</li>
          <li><span class="rune-glyph">ᚷ</span> B2B boundaries built into the visual model</li>
        </ul>
      </div>
    </div>

    <div class="pullquote">
      <p>
        The fort is alive. Rooms brighten with activity and dim with decay.
        Corridors pulse during deliberation. Walls thicken when policies block.
        Towers fire when anomalies hit. The fort breathes with your system.
      </p>
    </div>
  </div>
</section>

<style>
  .split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin: 2.5rem 0;
    align-items: start;
  }
  @media (max-width: 750px) {
    .split { grid-template-columns: 1fr; }
  }
  .df-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }
  .df-card::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
  }
  .df-card.dark::before { background: var(--muted); }
  .df-card.lit::before { background: var(--amber); }
  .df-card h3 {
    font-family: var(--mono);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 1.25rem;
  }
  .df-card.dark h3 { color: var(--muted); }
  .df-card.lit h3 { color: var(--amber); }
  .df-card ul { list-style: none; padding: 0; }
  .df-card li {
    font-size: 0.88rem;
    color: var(--dim);
    padding: 0.4rem 0;
    border-bottom: 1px solid var(--border);
    line-height: 1.6;
  }
  .df-card li:last-child { border-bottom: none; }
  :global(.rune-glyph) {
    color: var(--rune);
    margin-right: 0.5rem;
    font-size: 0.95rem;
  }
</style>
