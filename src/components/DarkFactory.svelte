<script>
    import { SvelteFlow, Background, Controls } from "@xyflow/svelte";
    import "@xyflow/svelte/dist/style.css";
    import B2bGroupNode from "./flow/B2bGroupNode.svelte";
    import B2bPhaseNode from "./flow/B2bPhaseNode.svelte";
    import B2bOpaqueNode from "./flow/B2bOpaqueNode.svelte";
    import B2bLabelNode from "./flow/B2bLabelNode.svelte";

    const nodeTypes = {
        b2bGroup: B2bGroupNode,
        b2bPhase: B2bPhaseNode,
        b2bOpaque: B2bOpaqueNode,
        b2bLabel: B2bLabelNode,
    };

    const b2bNodes = [
        // Your Fort container
        {
            id: "your-fort",
            type: "b2bGroup",
            position: { x: 0, y: 0 },
            data: { label: "Your Fort", style: "visible" },
            style: "width: 360px; height: 230px;",
        },
        // Phase nodes inside Your Fort
        {
            id: "retrieve",
            type: "b2bPhase",
            position: { x: 20, y: 40 },
            parentId: "your-fort",
            extent: "parent",
            data: { rune: "ᚲ", label: "Retrieve", detail: "nodes" },
        },
        {
            id: "route",
            type: "b2bPhase",
            position: { x: 195, y: 40 },
            parentId: "your-fort",
            extent: "parent",
            data: { rune: "ᚨ", label: "Route", detail: "κ=0" },
        },
        {
            id: "act",
            type: "b2bPhase",
            position: { x: 20, y: 135 },
            parentId: "your-fort",
            extent: "parent",
            data: { rune: "ᚠ", label: "Act", detail: "store" },
        },
        {
            id: "learn",
            type: "b2bPhase",
            position: { x: 195, y: 135 },
            parentId: "your-fort",
            extent: "parent",
            data: { rune: "ᛃ", label: "Learn", detail: "feed" },
        },

        // Partner Fort container
        {
            id: "partner-fort",
            type: "b2bGroup",
            position: { x: 520, y: 0 },
            data: { label: "Partner Fort", style: "opaque" },
            style: "width: 280px; height: 230px;",
        },
        // Opaque interior
        {
            id: "opaque",
            type: "b2bOpaque",
            position: { x: 35, y: 40 },
            parentId: "partner-fort",
            extent: "parent",
            data: {},
        },

        // Labels below
        {
            id: "lbl-yours",
            type: "b2bLabel",
            position: { x: 110, y: 248 },
            data: { text: "full visibility", highlight: true },
        },
        {
            id: "lbl-bridge",
            type: "b2bLabel",
            position: { x: 420, y: 248 },
            data: { text: "bridge" },
        },
        {
            id: "lbl-partner",
            type: "b2bLabel",
            position: { x: 555, y: 248 },
            data: { text: "walls + gates only" },
        },
    ];

    const b2bEdges = [
        {
            id: "bridge",
            source: "your-fort",
            target: "partner-fort",
            sourceHandle: "right",
            targetHandle: "left",
            label: "ᚷ",
            style: "stroke: #8a9a9e; stroke-width: 2;",
            labelStyle: "fill: #c4956a; font-size: 16px;",
            labelBgStyle: "fill: #09090d; stroke: #09090d;",
        },
    ];
</script>

<section id="dark-factory" class="section-border">
    <div class="container">
        <span class="section-label">Dark Factory</span>
        <h2>
            Your factory runs in the dark.<br /><em
                >RuneFort turns the lights on and runs the conveyor belt.</em
            >
        </h2>
        <p class="lead">
            Autonomous software factories &mdash; spec in, tested code out, no
            human in the loop &mdash; are real and shipping production code
            today. The question is no longer &ldquo;can agents build
            software?&rdquo; but &ldquo;can you see what they're doing?&rdquo;
        </p>

        <div class="maturity-strip">
            <div class="maturity-level">
                <div class="maturity-num">L0</div>
                <div class="maturity-title">Manual</div>
                <div class="maturity-desc">Human writes everything</div>
            </div>
            <div class="maturity-level">
                <div class="maturity-num">L1</div>
                <div class="maturity-title">Delegation</div>
                <div class="maturity-desc">AI handles discrete tasks</div>
            </div>
            <div class="maturity-level">
                <div class="maturity-num">L2</div>
                <div class="maturity-title">Pairing</div>
                <div class="maturity-desc">AI copilot, human drives</div>
            </div>
            <div class="maturity-level">
                <div class="maturity-num">L3</div>
                <div class="maturity-title">Review</div>
                <div class="maturity-desc">AI writes, human reviews</div>
            </div>
            <div class="maturity-level active">
                <div class="maturity-num">L4</div>
                <div class="maturity-title">Spec-Driven</div>
                <div class="maturity-desc">Specs in, code out</div>
            </div>
            <div class="maturity-level active">
                <div class="maturity-num">L5</div>
                <div class="maturity-title">Dark Factory</div>
                <div class="maturity-desc">Fully autonomous</div>
            </div>
        </div>

        <div class="dark-factory-split">
            <div class="df-card dark">
                <h3>The dark factory (today)</h3>
                <ul>
                    <li>Specs go in, tested software comes out</li>
                    <li>No human writes or reviews code</li>
                    <li>Holdout validation separates train/test</li>
                    <li>Spotify Honk ships 650+ PRs/month into production</li>
                    <li>StrongDM: 3 engineers, 32K LOC, zero code review</li>
                    <li>YAML DAGs orchestrate single-repo pipelines</li>
                </ul>
            </div>
            <div class="df-card lit">
                <h3>RuneFort runs and renders it</h3>
                <ul>
                    <li>
                        <span class="rune-glyph">ᛞ</span>
                        <strong>Dark Factory loop</strong> &mdash; watches signals,
                        triages, sequences SpecPrompt &rarr; Agentelic &rarr; FleetPrompt
                        &rarr; deploy
                    </li>
                    <li>
                        <span class="rune-glyph">ᚲ</span>
                        <strong>Spatial observability</strong> &mdash; walk through
                        the pipeline, not scroll a log
                    </li>
                    <li>
                        <span class="rune-glyph">ᚱ</span>
                        <strong>PULSE temporal algebra</strong> &mdash; phases + cadence
                        + typed cross-loop tokens (no equivalent elsewhere)
                    </li>
                    <li>
                        <span class="rune-glyph">ᚨ</span>
                        <strong>&kappa;-aware routing</strong> &mdash; cyclic failure
                        detection triggers deliberation
                    </li>
                    <li>
                        <span class="rune-glyph">ᛉ</span>
                        <strong>PRISM watchtowers</strong> &mdash; 9-dimension continual-learning
                        evaluation
                    </li>
                    <li>
                        <span class="rune-glyph">ᛃ</span>
                        <strong>Graphonomous memory</strong> &mdash; factory learns
                        across sessions, promotes reliable templates
                    </li>
                </ul>
            </div>
        </div>

        <div class="orchestration-panel">
            <div class="panel-label">
                RuneFort Dark Factory Orchestration Loop
            </div>
            <div class="panel-flow">
                <div class="flow-step">
                    <span class="flow-rune">ᚲ</span>
                    <span class="flow-kind">retrieve</span>
                    <span class="flow-name">watch_signals</span>
                    <span class="flow-detail"
                        >GitHub pushes &middot; Graphonomous outcomes &middot;
                        issues</span
                    >
                </div>
                <div class="flow-arrow">&rarr;</div>
                <div class="flow-step">
                    <span class="flow-rune">ᚨ</span>
                    <span class="flow-kind">route</span>
                    <span class="flow-name">triage_classify</span>
                    <span class="flow-detail"
                        >heuristic classification + &kappa; topology check</span
                    >
                </div>
                <div class="flow-arrow">&rarr;</div>
                <div class="flow-step">
                    <span class="flow-rune">ᚠ</span>
                    <span class="flow-kind">act</span>
                    <span class="flow-name">pipeline_execute</span>
                    <span class="flow-detail"
                        >SpecPrompt &rarr; Agentelic &rarr; FleetPrompt &rarr;
                        deploy gate</span
                    >
                </div>
                <div class="flow-arrow">&rarr;</div>
                <div class="flow-step">
                    <span class="flow-rune">ᛃ</span>
                    <span class="flow-kind">learn</span>
                    <span class="flow-name">learn_outcomes</span>
                    <span class="flow-detail"
                        >OutcomeSignal + ReputationUpdate CloudEvents</span
                    >
                </div>
                <div class="flow-arrow">&rarr;</div>
                <div class="flow-step">
                    <span class="flow-rune">ᛞ</span>
                    <span class="flow-kind">consolidate</span>
                    <span class="flow-name">consolidate_patterns</span>
                    <span class="flow-detail"
                        >merge failure patterns &middot; promote templates</span
                    >
                </div>
            </div>
            <p class="panel-caption">
                Five PULSE phases, running concurrently with <code
                    >runefort.spatial_render</code
                >. No LLM calls from RuneFort &mdash; pure heuristic triage +
                MCP sequencing. Synthetic mode for demos, <strong>R!</strong> for
                real pipelines against live MCP servers.
            </p>
        </div>

        <div class="b2b-visual">
            <div class="b2b-canvas">
                <SvelteFlow
                    nodes={b2bNodes}
                    edges={b2bEdges}
                    {nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.3 }}
                    colorMode="dark"
                    panOnDrag={false}
                    zoomOnScroll={false}
                    zoomOnPinch={false}
                    zoomOnDoubleClick={false}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    minZoom={0.5}
                    maxZoom={1.5}
                >
                    <Background color="rgba(232, 168, 76, 0.03)" gap={48} />
                </SvelteFlow>
            </div>
        </div>
        <p class="b2b-note">
            <strong>B2B privacy boundary:</strong>
            You see full detail inside your own fort. Partner forts appear as opaque
            shapes &mdash; outer walls, gates, and bridge connections, but never their
            rooms.
        </p>
    </div>
</section>

<style>
    .maturity-strip {
        display: flex;
        gap: 0;
        margin: 2.5rem 0;
        border: 1px solid var(--border);
        border-radius: 8px;
        overflow: hidden;
    }
    @media (max-width: 750px) {
        .maturity-strip {
            flex-direction: column;
        }
    }
    .maturity-level {
        flex: 1;
        padding: 1.25rem 1rem;
        border-right: 1px solid var(--border);
        background: var(--surface);
        transition: background 0.2s;
    }
    .maturity-level:last-child {
        border-right: none;
    }
    .maturity-level:hover {
        background: var(--surface-2);
    }
    .maturity-level.active {
        background: var(--surface-2);
        border-bottom: 2px solid var(--amber);
    }
    .maturity-num {
        font-family: var(--mono);
        font-size: 0.65rem;
        color: var(--muted);
        margin-bottom: 0.25rem;
    }
    .maturity-level.active .maturity-num {
        color: var(--amber);
    }
    .maturity-title {
        font-family: var(--serif);
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--dim);
        margin-bottom: 0.25rem;
    }
    .maturity-level.active .maturity-title {
        color: var(--text);
    }
    .maturity-desc {
        font-size: 0.72rem;
        color: var(--muted);
        line-height: 1.4;
    }
    .maturity-level.active .maturity-desc {
        color: var(--dim);
    }

    .dark-factory-split {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin: 2.5rem 0;
        align-items: start;
    }
    @media (max-width: 750px) {
        .dark-factory-split {
            grid-template-columns: 1fr;
        }
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
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
    }
    .df-card.dark::before {
        background: var(--muted);
    }
    .df-card.lit::before {
        background: var(--amber);
    }
    .df-card h3 {
        font-family: var(--mono);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin-bottom: 1.25rem;
    }
    .df-card.dark h3 {
        color: var(--muted);
    }
    .df-card.lit h3 {
        color: var(--amber);
    }
    .df-card ul {
        list-style: none;
        padding: 0;
    }
    .df-card li {
        font-size: 0.88rem;
        color: var(--dim);
        padding: 0.4rem 0;
        border-bottom: 1px solid var(--border);
        line-height: 1.6;
    }
    .df-card li:last-child {
        border-bottom: none;
    }
    :global(.rune-glyph) {
        color: var(--rune);
        margin-right: 0.5rem;
        font-size: 0.95rem;
    }

    .b2b-visual {
        border: 1px solid var(--border);
        border-radius: 10px;
        overflow: hidden;
        margin: 2.5rem 0;
    }
    .b2b-canvas {
        height: 340px;
        background: var(--surface);
    }
    .b2b-canvas :global(.svelte-flow) {
        --xy-background-color: var(--surface);
        --xy-edge-stroke: var(--dim);
        --xy-edge-stroke-width: 2;
        --xy-edge-label-color: var(--rune);
        --xy-edge-label-background-color: var(--surface);
    }
    .b2b-canvas :global(.svelte-flow__controls) {
        display: none;
    }
    .b2b-canvas :global(.svelte-flow__attribution) {
        display: none;
    }

    .b2b-note {
        color: var(--dim);
        font-size: 0.88rem;
        max-width: 700px;
    }
    .b2b-note strong {
        color: var(--text);
    }

    /* Dark factory orchestration loop visualization */
    .orchestration-panel {
        margin: 2.5rem 0;
        padding: 1.5rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        position: relative;
    }
    .orchestration-panel::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, var(--amber), var(--rune));
    }
    .panel-label {
        font-family: var(--mono);
        font-size: 0.6rem;
        font-weight: 700;
        color: var(--amber);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 1rem;
    }
    .panel-flow {
        display: grid;
        grid-template-columns: repeat(9, auto);
        grid-template-areas: "s1 a1 s2 a2 s3 a3 s4 a4 s5";
        gap: 0.5rem;
        align-items: stretch;
        overflow-x: auto;
        padding-bottom: 0.5rem;
    }
    @media (max-width: 900px) {
        .panel-flow {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        .flow-arrow {
            display: none;
        }
    }
    .flow-step {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.75rem;
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: 6px;
        min-width: 150px;
    }
    .flow-rune {
        font-family: "Noto Sans Runic", serif;
        font-size: 1.2rem;
        color: var(--rune);
        line-height: 1;
    }
    .flow-kind {
        font-family: var(--mono);
        font-size: 0.55rem;
        font-weight: 700;
        color: var(--amber);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }
    .flow-name {
        font-family: var(--mono);
        font-size: 0.7rem;
        color: var(--text);
        font-weight: 600;
    }
    .flow-detail {
        font-size: 0.65rem;
        color: var(--muted);
        line-height: 1.4;
    }
    .flow-arrow {
        color: var(--muted);
        font-size: 1.1rem;
        align-self: center;
        justify-self: center;
    }
    .panel-caption {
        margin-top: 1rem;
        font-size: 0.8rem;
        color: var(--dim);
        line-height: 1.5;
    }
    .panel-caption code {
        background: var(--surface-2);
        color: var(--amber);
        padding: 0.1rem 0.35rem;
        border-radius: 3px;
        font-size: 0.75rem;
    }
    .panel-caption strong {
        color: var(--amber);
        font-family: var(--mono);
    }
</style>
