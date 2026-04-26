<section id="how-it-works" class="section-border">
  <div class="container">
    <span class="section-label">60 seconds</span>
    <h2>From your code to a <em>walkable fort</em></h2>
    <p class="lead">
      No new config language. No manual to read. If your system already declares a PULSE loop,
      it already has a fort &mdash; RuneFort just renders it.
    </p>

    <ol class="steps">
      <li class="step">
        <div class="step-head">
          <span class="step-n">01</span>
          <span class="step-time">~10s</span>
        </div>
        <h3>Point at a manifest</h3>
        <p>Drop in a <code>*.pulse.json</code> or a GitHub URL. Phases become rooms, connections become corridors, invariants become walls.</p>
        <pre class="step-code">pulse://graphonomous.memory_loop</pre>
      </li>
      <li class="step">
        <div class="step-head">
          <span class="step-n">02</span>
          <span class="step-time">~20s</span>
        </div>
        <h3>Connect a Graphonomous MCP</h3>
        <p>Rooms light up with live node counts, confidence values, and κ topology. Cold rooms dim. Hot rooms glow. No dashboards.</p>
        <pre class="step-code">graphonomous://workspace/default</pre>
      </li>
      <li class="step">
        <div class="step-head">
          <span class="step-n">03</span>
          <span class="step-time">~30s</span>
        </div>
        <h3>Press <span class="r-key">R!</span></h3>
        <p>The dark-factory loop runs: SpecPrompt validates &rarr; Agentelic builds &rarr; FleetPrompt trusts &rarr; deploy gate. Every stage visible as a corridor tile.</p>
        <pre class="step-code">runefort.dark_factory // running</pre>
      </li>
    </ol>
  </div>
</section>

<style>
  .steps {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-top: 1rem;
    padding: 0;
  }
  @media (max-width: 850px) {
    .steps { grid-template-columns: 1fr; }
  }
  .step {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.5rem 1.5rem 1.25rem;
    position: relative;
    transition: all 0.3s ease;
  }
  .step:hover {
    border-color: var(--border-2);
    transform: translateY(-2px);
  }
  .step-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  .step-n {
    font-family: var(--mono);
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: var(--amber);
    padding: 0.25rem 0.6rem;
    border: 1px solid var(--amber-dim);
    border-radius: 4px;
    background: var(--amber-glow);
  }
  .step-time {
    font-family: var(--mono);
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    color: var(--dim);
  }
  .step h3 {
    font-family: var(--serif);
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--text);
  }
  .step p {
    font-size: 0.85rem;
    color: var(--dim);
    line-height: 1.65;
    margin-bottom: 1rem;
  }
  .step code {
    font-family: var(--mono);
    font-size: 0.8rem;
    color: var(--rune);
  }
  .step-code {
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--amber);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0.5rem 0.7rem;
    margin: 0;
    overflow-x: auto;
    white-space: nowrap;
  }
  .r-key {
    font-family: var(--mono);
    font-size: 0.85rem;
    color: var(--amber);
    background: var(--amber-glow);
    border: 1px solid var(--amber-dim);
    border-radius: 4px;
    padding: 0.05rem 0.4rem;
    font-weight: 600;
  }
</style>
