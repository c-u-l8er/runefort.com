<section id="vision" class="section-border">
  <div class="container">
    <span class="section-label">The promise</span>
    <h2>Three steps. <em>That's the product.</em></h2>

    <div class="promise-grid">
      <div class="promise">
        <div class="promise-n">1</div>
        <h3>Drop a manifest</h3>
        <p>Point RuneFort at a <code>*.pulse.json</code>. It generates the fort &mdash; rooms from phases, corridors from signals, walls from policies.</p>
      </div>
      <div class="promise">
        <div class="promise-n">2</div>
        <h3>Walk the fort</h3>
        <p>Zoom from district to rune. Hover to reveal flow, thermal, or diagnostic. No menu to learn &mdash; the right lens fades in where you look.</p>
      </div>
      <div class="promise">
        <div class="promise-n">3</div>
        <h3>Run the factory</h3>
        <p>Press <span class="r-key">R!</span> and the spatial UI drives Agentelic &rarr; FleetPrompt &rarr; WebHost &mdash; composed agents come out the far end.</p>
      </div>
    </div>

    <div class="pullquote">
      <p>The fort is what you understand. The runes are what you inspect.</p>
      <div class="attr">&mdash; Manifests stay canonical. The view just makes them walkable.</div>
    </div>
  </div>
</section>

<style>
  .promise-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
    margin: 2rem 0 3rem;
  }
  @media (max-width: 750px) {
    .promise-grid { grid-template-columns: 1fr; }
  }
  .promise {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.75rem;
    transition: all 0.3s ease;
    position: relative;
  }
  .promise:hover {
    border-color: var(--border-2);
    transform: translateY(-3px);
  }
  .promise-n {
    font-family: var(--serif);
    font-size: 1.3rem;
    color: var(--amber);
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--amber-dim);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    background: var(--amber-glow);
  }
  .promise h3 {
    font-family: var(--serif);
    font-size: 1.15rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
    color: var(--text);
  }
  .promise p {
    font-size: 0.9rem;
    color: var(--dim);
    line-height: 1.7;
  }
  .promise code {
    font-family: var(--mono);
    font-size: 0.8rem;
    color: var(--rune);
    background: var(--surface-2);
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
  }
  .r-key {
    font-family: var(--mono);
    font-size: 0.78rem;
    color: var(--amber);
    background: var(--amber-glow);
    border: 1px solid var(--amber-dim);
    border-radius: 4px;
    padding: 0.1rem 0.4rem;
    font-weight: 600;
  }
</style>
