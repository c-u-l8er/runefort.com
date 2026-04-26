<section id="nesting" class="section-border">
    <div class="container">
        <span class="section-label">Nesting</span>
        <h2>Forts inside <em>forts</em></h2>
        <p class="lead">
            A fort can appear inside any room. That nested fort can contain
            another. There is no depth limit &mdash; the zoom levels repeat
            recursively. When you zoom deeper, you find another fort. Always.
        </p>

        <!-- Nested-fort visual: PRISM contains Graphonomous contains Deliberation. -->
        <div
            class="nest-visual"
            aria-label="PRISM fort contains Graphonomous fort contains Deliberation fort"
        >
            <svg viewBox="0 0 640 260" xmlns="http://www.w3.org/2000/svg">
                <!-- Outer: PRISM fort (amber) -->
                <rect
                    class="frame frame-prism"
                    x="10"
                    y="20"
                    width="620"
                    height="220"
                    rx="4"
                />
                <text x="20" y="40" class="frame-label lbl-prism"
                    >PRISM fort</text
                >
                <text x="108" y="40" class="frame-loop">prism.benchmark</text>

                <!-- PRISM rooms -->
                <rect
                    class="room"
                    x="25"
                    y="60"
                    width="120"
                    height="160"
                    rx="2"
                />
                <text x="85" y="142" class="room-label" text-anchor="middle"
                    >Compose</text
                >

                <rect
                    class="room room-opened"
                    x="160"
                    y="60"
                    width="320"
                    height="160"
                    rx="2"
                />
                <text x="170" y="76" class="room-label room-label-open"
                    >Interact ▽</text
                >

                <rect
                    class="room"
                    x="495"
                    y="60"
                    width="125"
                    height="160"
                    rx="2"
                />
                <text x="557" y="142" class="room-label" text-anchor="middle"
                    >Observe</text
                >

                <!-- Middle: Graphonomous fort (stone) nested inside PRISM's Interact room -->
                <rect
                    class="frame frame-graph"
                    x="175"
                    y="85"
                    width="290"
                    height="125"
                    rx="3"
                />
                <text x="183" y="100" class="frame-label lbl-graph"
                    >Graphonomous fort</text
                >

                <!-- Graphonomous rooms -->
                <rect
                    class="room room-sm"
                    x="185"
                    y="110"
                    width="70"
                    height="95"
                    rx="2"
                />
                <text x="220" y="161" class="room-label-sm" text-anchor="middle"
                    >Retrieve</text
                >

                <rect
                    class="room room-sm room-opened"
                    x="260"
                    y="110"
                    width="120"
                    height="95"
                    rx="2"
                />
                <text x="267" y="125" class="room-label-sm room-label-open"
                    >Route ▽</text
                >

                <rect
                    class="room room-sm"
                    x="385"
                    y="110"
                    width="70"
                    height="95"
                    rx="2"
                />
                <text x="420" y="161" class="room-label-sm" text-anchor="middle"
                    >Act</text
                >

                <!-- Innermost: Deliberation fort (rune) nested inside Graphonomous's Route room -->
                <rect
                    class="frame frame-dlb"
                    x="270"
                    y="132"
                    width="100"
                    height="70"
                    rx="2"
                />
                <text x="276" y="144" class="frame-label lbl-dlb"
                    >Deliberation</text
                >

                <rect
                    class="room room-xs"
                    x="278"
                    y="150"
                    width="42"
                    height="45"
                    rx="1"
                />
                <text x="299" y="176" class="room-label-xs" text-anchor="middle"
                    >Open</text
                >

                <rect
                    class="room room-xs"
                    x="325"
                    y="150"
                    width="42"
                    height="45"
                    rx="1"
                />
                <text x="346" y="176" class="room-label-xs" text-anchor="middle"
                    >Commit</text
                >
            </svg>
        </div>

        <div class="nest-grid">
            <div class="nest-card">
                <div class="nest-n">∞</div>
                <h3>No depth limit</h3>
                <p>
                    Zoom L0 &rarr; L4 describes one fort. But L4 inside a nested
                    fort becomes L0 of its own district. You never run out of
                    layers to zoom into &mdash; you just find more forts.
                </p>
            </div>
            <div class="nest-card">
                <div class="nest-n mono-n">[]</div>
                <h3>Declared in PULSE</h3>
                <p>
                    <code>inner_loops[]</code> is how nesting is made explicit.
                    The trigger condition determines <em>when</em> the nested fort
                    activates. The wait strategy determines whether the outer fort
                    pauses or fires and forgets.
                </p>
            </div>
            <div class="nest-card">
                <div class="nest-n">↻</div>
                <h3>Parent / child, not wrapper / wrapped</h3>
                <p>
                    A fort inside a room is not embedded UI &mdash; it is a real
                    running loop whose lifecycle is governed by its parent. <em
                        >B2B boundary:</em
                    >
                    partner forts render as opaque shapes. Nested forts you own render
                    in full detail.
                </p>
            </div>
        </div>
    </div>
</section>

<style>
    .nest-visual {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 1.5rem;
        margin: 2rem 0 2.5rem;
        overflow: hidden;
    }
    .nest-visual svg {
        width: 100%;
        height: auto;
        display: block;
    }

    /* Outer PRISM frame */
    .frame {
        fill: none;
        stroke-width: 1.5;
    }
    .frame-prism {
        stroke: var(--amber);
    }
    .frame-graph {
        stroke: var(--stone);
        stroke-dasharray: 4 2;
    }
    .frame-dlb {
        stroke: var(--rune);
        stroke-dasharray: 3 2;
    }

    .frame-label {
        font-family: var(--serif);
        font-size: 11px;
        fill: var(--text);
    }
    .lbl-prism {
        fill: var(--amber);
    }
    .lbl-graph {
        fill: var(--stone);
    }
    .lbl-dlb {
        fill: var(--rune);
    }

    .frame-loop {
        font-family: var(--mono);
        font-size: 8px;
        letter-spacing: 0.05em;
        fill: var(--dim);
    }
    .frame-loop-sm {
        font-family: var(--mono);
        font-size: 7px;
        letter-spacing: 0.05em;
        fill: var(--dim);
        text-anchor: end;
    }

    .room {
        fill: rgba(232, 168, 76, 0.04);
        stroke: rgba(232, 168, 76, 0.28);
        stroke-width: 1;
    }
    .room-opened {
        fill: transparent;
        stroke-dasharray: 3 3;
        stroke: rgba(232, 168, 76, 0.55);
    }
    .room-sm {
        fill: rgba(138, 154, 158, 0.05);
        stroke: rgba(138, 154, 158, 0.35);
    }
    .room-xs {
        fill: rgba(196, 149, 106, 0.07);
        stroke: rgba(196, 149, 106, 0.4);
    }

    .room-label {
        font-family: var(--serif);
        font-size: 11px;
        fill: var(--text);
    }
    .room-label-sm {
        font-family: var(--serif);
        font-size: 9px;
        fill: var(--text);
    }
    .room-label-xs {
        font-family: var(--serif);
        font-size: 7px;
        fill: var(--text);
    }
    .room-label-open {
        fill: var(--amber);
        font-style: italic;
    }

    /* Info cards */
    .nest-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }
    @media (max-width: 850px) {
        .nest-grid {
            grid-template-columns: 1fr;
        }
    }
    .nest-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 1.5rem;
        transition: all 0.3s ease;
    }
    .nest-card:hover {
        border-color: var(--border-2);
        transform: translateY(-2px);
    }
    .nest-n {
        font-family: var(--serif);
        font-size: 1.6rem;
        color: var(--amber);
        line-height: 1;
        margin-bottom: 0.75rem;
    }
    .nest-n.mono-n {
        font-family: var(--mono);
        font-size: 1.2rem;
    }
    .nest-card h3 {
        font-family: var(--serif);
        font-size: 1.1rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: var(--text);
    }
    .nest-card p {
        font-size: 0.88rem;
        color: var(--dim);
        line-height: 1.7;
    }
    .nest-card p em {
        font-style: normal;
        color: var(--text);
    }
    .nest-card code {
        font-family: var(--mono);
        font-size: 0.78rem;
        color: var(--rune);
        background: var(--surface-2);
        padding: 0.05rem 0.3rem;
        border-radius: 3px;
    }

    .nest-pullquote {
        border-left: 3px solid var(--amber);
        padding: 1rem 1.5rem;
        background: var(--surface);
        border-radius: 0 8px 8px 0;
        font-size: 0.95rem;
        color: var(--dim);
        line-height: 1.75;
        max-width: 820px;
    }
    .nest-pullquote em {
        font-style: normal;
        color: var(--text);
    }
</style>
