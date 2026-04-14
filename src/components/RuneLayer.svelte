<section id="runes" class="section-border">
  <div class="container">
    <span class="section-label">The Rune Layer</span>
    <h2>Hidden machinery <em>inside the walls</em></h2>
    <p class="lead">
      Runes are the machine language. The blueprint is the human language.
      The fort should be immediately legible to anyone &mdash; &ldquo;that's a room, that's a hallway,
      that's a locked door.&rdquo; Runes reward deeper inspection but never gatekeep understanding.
    </p>

    <div class="pillar-grid">
      <div class="pillar">
        <div class="pillar-icon rune-icons">ᚲᚨᚠ</div>
        <h3>Fast Path</h3>
        <p>
          Retrieve &rarr; Route &rarr; Act. The standard execution path through a fort.
          No deliberation needed, knowledge flows directly to action.
        </p>
      </div>
      <div class="pillar">
        <div class="pillar-icon rune-icons">ᚲᚨᚱᚠ</div>
        <h3>Deliberation Path</h3>
        <p>
          When &kappa; &gt; 0, cyclic knowledge triggers deliberation.
          The corridor pulses. Evidence is weighed. Only then: action.
        </p>
      </div>
      <div class="pillar">
        <div class="pillar-icon rune-icons">ᚺᛉᛗ</div>
        <h3>Escalation Path</h3>
        <p>
          Disruption detected &rarr; diagnostic shielding &rarr; human escalation.
          The tower fires. Someone gets paged.
        </p>
      </div>
    </div>

    <div class="rune-display">
      <span class="room" title="Kaunan — torch/knowledge — retrieve">ᚲ</span>
      <span class="rune" title="Ansuz — signal — route">ᚨ</span>
      <span class="room" title="Fehu — wealth/store — act">ᚠ</span>
      <span class="rune" title="Jera — harvest — learn">ᛃ</span>
      <span class="room" title="Dagaz — dawn — consolidate">ᛞ</span>
      &ensp;
      <span class="rune" title="Algiz — protection — PRISM">ᛉ</span>
      <span class="room" title="Raidho — journey — deliberation">ᚱ</span>
      <span class="rune" title="Tiwaz — justice — governance">ᛏ</span>
      <span class="room" title="Sowilo — sun — PULSE cadence">ᛊ</span>
      <span class="rune" title="Perthro — mystery — epistemic frontier">ᛈ</span>
      &ensp;
      <span class="room" title="Thurisaz — thorn — access denial">ᚦ</span>
      <span class="rune" title="Uruz — strength — edge weight">ᚢ</span>
      <span class="room" title="Gebo — gift — bridge token">ᚷ</span>
      <span class="rune" title="Wunjo — harmony — consensus">ᚹ</span>
      <span class="room" title="Haglaz — disruption — anomaly">ᚺ</span>
      &ensp;
      <span class="rune" title="Naudiz — constraint — boundary">ᚾ</span>
      <span class="room" title="Isa — ice — sealed memory">ᛁ</span>
      <span class="rune" title="Eihwaz — endurance — glacial">ᛇ</span>
      <span class="room" title="Berkanan — growth — promotion">ᛒ</span>
      <span class="rune" title="Ehwaz — movement — data flow">ᛖ</span>
      &ensp;
      <span class="room" title="Mannaz — human — escalation">ᛗ</span>
      <span class="rune" title="Laguz — water — stream processing">ᛚ</span>
      <span class="room" title="Ingwaz — seed — goal node">ᛜ</span>
      <span class="rune" title="Othala — heritage — workspace root">ᛟ</span>
      <br />
      <span class="rune-caption">24 Elder Futhark runes &mdash; hover for meanings</span>
    </div>
  </div>
</section>

<style>
  .rune-icons {
    font-size: 1.2rem !important;
    letter-spacing: 0.2em;
  }
  .rune-display {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 2.5rem;
    margin: 2.5rem 0;
    text-align: center;
    line-height: 2.5;
    font-size: 1rem;
    letter-spacing: 0.15em;
    position: relative;
    overflow: hidden;
  }
  .rune-display::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--amber), var(--rune), var(--stone));
  }
  .rune-display .room { color: var(--amber); cursor: help; }
  .rune-display .rune { color: var(--rune); opacity: 0.7; cursor: help; }
  .rune-caption {
    font-family: var(--mono);
    font-size: 0.6rem;
    letter-spacing: 0.06em;
    color: var(--dim);
  }
</style>
