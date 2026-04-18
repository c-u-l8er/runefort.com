<section id="dark-agent-factory" class="section-border">
    <div class="container">
        <span class="section-label">Dark Agent Factory</span>
        <h2>
            Other dark factories ship code.<br />
            <em>RuneFort is a Dark Agent Factory.</em>
        </h2>
        <p class="lead">
            Code is a terminal artifact &mdash; you deploy it, it runs, that's
            the end. An agent is a <em class="accent-inline"
                >generative artifact</em
            >
            &mdash; you deploy it, and it keeps producing output forever. A
            <strong>Dark Agent Factory</strong> is a dark factory whose output is
            itself another dark factory. That's not a feature difference. It's a level
            up.
        </p>

        <div class="ladder">
            <div class="rung">
                <div class="rung-label">L0</div>
                <div class="rung-name">Human writes code</div>
                <div class="rung-out">One feature runs, once.</div>
            </div>
            <div class="rung">
                <div class="rung-label">L1</div>
                <div class="rung-name">AI assistant writes code</div>
                <div class="rung-out">One feature runs, once. Faster.</div>
            </div>
            <div class="rung">
                <div class="rung-label">L2</div>
                <div class="rung-name">Dark factory writes code</div>
                <div class="rung-out">
                    One feature runs autonomously. Repeat per feature.
                </div>
            </div>
            <div class="rung active">
                <div class="rung-label">L3</div>
                <div class="rung-name">Dark Agent Factory deploys agents</div>
                <div class="rung-out">
                    Every deploy ships another autonomous worker. Output
                    compounds.
                </div>
            </div>
        </div>

        <h3 class="sub-h">Six advantages of a Dark Agent Factory</h3>

        <div class="advantage-grid">
            <div class="adv">
                <div class="adv-rune">ᚠ</div>
                <h4>Recursive leverage</h4>
                <p>
                    A shipped PR runs once. A shipped agent ships things every
                    time it wakes. One day of the RuneFort factory deploys N
                    agents; those N agents produce work indefinitely.
                    Code-factory output is <em>additive</em>. Agent-factory
                    output is <em>multiplicative</em>.
                </p>
            </div>

            <div class="adv">
                <div class="adv-rune">ᚷ</div>
                <h4>Composability &mdash; [&] Protocol</h4>
                <p>
                    Every shipped agent is a composable capability. One agent
                    can be joined to another via an <code>*.ampersand.json</code
                    > spec. Code doesn't compose like that &mdash; you can't snap
                    two pull requests together and get a bigger feature.
                </p>
            </div>

            <div class="adv">
                <div class="adv-rune">ᚹ</div>
                <h4>Reputation as a first-class input</h4>
                <p>
                    Code review checks syntax and tests. Agent review requires <em
                        >trust</em
                    > &mdash; how did this actor behave in production? FleetPrompt
                    scores every agent; the deploy gate only opens if trust exceeds
                    threshold. Code factories have no equivalent primitive.
                </p>
            </div>

            <div class="adv">
                <div class="adv-rune">ᛉ</div>
                <h4>Continual-learning benchmarking</h4>
                <p>
                    Code passes or fails tests. An agent's quality is a moving
                    target across 9 dimensions: consistency, generalization,
                    forgetting, transfer, plasticity, stability, efficiency,
                    calibration, safety. PRISM watchtowers evaluate each shipped
                    agent continuously. Code factories ship and forget.
                </p>
            </div>

            <div class="adv">
                <div class="adv-rune">ᛃ</div>
                <h4>Memory that spans deployments</h4>
                <p>
                    Graphonomous holds the graph of every agent, every outcome,
                    every trust update. When a new agent is built, the factory
                    remembers which patterns succeeded, which failed cyclically
                    (&kappa; &gt; 0), and which deserve promotion.
                </p>
            </div>

            <div class="adv">
                <div class="adv-rune">ᛞ</div>
                <h4>Spatial governance of a fleet</h4>
                <p>
                    Reviewing 10 PRs is a list. Governing 10<sup>3</sup>
                    deployed agents is a city. RuneFort's spatial UI scales where
                    dashboards collapse &mdash; districts, forts, rooms, runes. Walls
                    thicken where Delegatic policy tightens. You can
                    <em>see</em> the fleet.
                </p>
            </div>
        </div>

        <div class="category-callout">
            <div class="callout-head">The shift, stated plainly</div>
            <p>
                Spotify Honk is a <strong>Dark Code Factory</strong> &mdash;
                brilliant, shipping 650 PRs/month, but each PR is terminal.
                RuneFort is a <strong>Dark Agent Factory</strong> &mdash; each
                ship adds another autonomous producer to the fleet. The
                comparison isn't Honk vs RuneFort. It's
                <em>Honk the line worker</em> vs
                <em>RuneFort the foreman building more line workers</em>.
            </p>
        </div>
    </div>
</section>

<style>
    .lead {
        font-size: 1.1rem;
        color: var(--dim);
        line-height: 1.7;
        max-width: 820px;
        margin: 1.5rem 0 2.5rem;
    }
    .accent-inline {
        font-style: normal;
        color: var(--amber);
        font-weight: 500;
    }

    /* L0 -> L3 ladder */
    .ladder {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin: 2.5rem 0 3rem;
    }
    @media (max-width: 900px) {
        .ladder {
            grid-template-columns: 1fr 1fr;
        }
    }
    @media (max-width: 600px) {
        .ladder {
            grid-template-columns: 1fr;
        }
    }
    .rung {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 1.25rem;
        position: relative;
        transition:
            border-color 0.2s,
            transform 0.2s;
    }
    .rung.active {
        border-color: var(--amber);
        background: linear-gradient(180deg, var(--surface-2), var(--surface));
        box-shadow: 0 0 40px rgba(232, 168, 76, 0.08);
    }
    .rung-label {
        font-family: var(--mono);
        font-size: 0.65rem;
        color: var(--muted);
        letter-spacing: 0.08em;
        font-weight: 700;
        margin-bottom: 0.4rem;
    }
    .rung.active .rung-label {
        color: var(--amber);
    }
    .rung-name {
        font-family: var(--serif);
        font-size: 0.95rem;
        color: var(--text);
        font-weight: 500;
        margin-bottom: 0.65rem;
        line-height: 1.3;
    }
    .rung-out {
        font-size: 0.78rem;
        color: var(--dim);
        line-height: 1.5;
        margin-bottom: 0.5rem;
    }
    .rung-examples {
        font-family: var(--mono);
        font-size: 0.65rem;
        color: var(--muted);
        line-height: 1.5;
        padding-top: 0.5rem;
        border-top: 1px solid var(--border);
    }

    .sub-h {
        font-family: var(--serif);
        font-size: 1.35rem;
        font-weight: 400;
        color: var(--text);
        margin: 3rem 0 1.5rem;
        letter-spacing: 0.01em;
    }

    /* Advantages grid */
    .advantage-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.25rem;
        margin-bottom: 2.5rem;
    }
    @media (max-width: 950px) {
        .advantage-grid {
            grid-template-columns: 1fr 1fr;
        }
    }
    @media (max-width: 650px) {
        .advantage-grid {
            grid-template-columns: 1fr;
        }
    }
    .adv {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 1.5rem;
        position: relative;
        transition: border-color 0.2s;
    }
    .adv:hover {
        border-color: var(--rune);
    }
    .adv-rune {
        font-family: "Noto Sans Runic", serif;
        font-size: 1.6rem;
        color: var(--rune);
        line-height: 1;
        margin-bottom: 0.75rem;
    }
    .adv h4 {
        font-family: var(--serif);
        font-size: 1rem;
        color: var(--text);
        font-weight: 500;
        margin-bottom: 0.6rem;
        letter-spacing: 0.01em;
    }
    .adv p {
        font-size: 0.83rem;
        color: var(--dim);
        line-height: 1.6;
        margin: 0;
    }
    .adv p em {
        font-style: italic;
        color: var(--amber);
    }
    .adv code {
        background: var(--surface-2);
        color: var(--rune);
        padding: 0.1rem 0.35rem;
        border-radius: 3px;
        font-size: 0.75rem;
    }

    /* Plain-statement callout */
    .category-callout {
        margin-top: 3rem;
        padding: 1.75rem 2rem;
        background: var(--surface);
        border-left: 3px solid var(--amber);
        border-radius: 4px;
    }
    .callout-head {
        font-family: var(--mono);
        font-size: 0.6rem;
        font-weight: 700;
        color: var(--amber);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 0.75rem;
    }
    .category-callout p {
        font-size: 0.95rem;
        color: var(--text);
        line-height: 1.7;
        margin: 0;
    }
    .category-callout strong {
        color: var(--amber);
        font-weight: 500;
    }
    .category-callout em {
        font-style: italic;
        color: var(--rune);
    }
</style>
