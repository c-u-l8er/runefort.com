<script>
  const components = [
    { name: "<RuneTile>", role: "Any single cell", rule: "Atomic — the primitive" },
    { name: "<RuneRoom>", role: "A cognitive domain", rule: "Bordered tile group" },
    { name: "<RuneHall>", role: "A data flow path", rule: "Linear tile sequence" },
    { name: "<RuneTower>", role: "Observation point", rule: "Vertically stacked tiles" },
    { name: "<RuneGate>", role: "Router or checkpoint", rule: "Tile with filter state" },
    { name: "<RuneWall>", role: "Policy boundary", rule: "Barrier tile sequence" },
    { name: "<RuneFort>", role: "One cognitive system", rule: "Root container (fractal — forts nest inside rooms)" },
    { name: "<RuneBridge>", role: "Inter-system exchange", rule: "Fort-to-fort connection" },
    { name: "<RuneDistrict>", role: "Full ecosystem view", rule: "Multi-fort layout" },
  ];
</script>

<section id="components" class="section-border">
  <div class="container">
    <span class="section-label">9 Primitives</span>
    <h2>One tile composes <em>into anything</em></h2>
    <p class="lead">
      The Minecraft constraint: everything is made of the same primitive. A room is tiles with shared borders.
      A corridor is tiles in a line. A tower is tiles that stack. No special-case rendering.
    </p>

    <table class="component-table">
      <thead>
        <tr>
          <th>Component</th>
          <th>Fort Role</th>
          <th>Composition</th>
        </tr>
      </thead>
      <tbody>
        {#each components as c}
          <tr>
            <td class="comp-name">{c.name}</td>
            <td class="comp-role">{c.role}</td>
            <td class="comp-rule">{c.rule}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<style>
  .component-table {
    width: 100%;
    border-collapse: collapse;
    margin: 2.5rem 0;
    font-size: 0.85rem;
  }
  .component-table th {
    font-family: var(--mono);
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--dim);
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-2);
  }
  .component-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
  }
  .component-table tr:hover td {
    background: var(--surface);
  }
  .comp-name {
    font-family: var(--mono);
    color: var(--amber);
    font-size: 0.8rem;
    white-space: nowrap;
  }
  .comp-role {
    color: var(--text);
  }
  .comp-rule {
    color: var(--dim);
    font-size: 0.8rem;
  }
</style>
