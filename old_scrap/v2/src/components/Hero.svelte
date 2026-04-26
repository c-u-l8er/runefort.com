<header class="hero container">
    <div class="hero-badge">Part of the [&] Protocol ecosystem</div>
    <h1>
        Walk through,<br /> the <em>dark factory</em> that<br /> ships
        <i>agents.</i>
    </h1>
    <p class="subline">
        Other dark factories ship code. <em class="accent"
            >RuneFort ships agents</em
        > &mdash; autonomous capabilities that keep running, learning, and producing
        output forever. Point it at a PULSE manifest. Your loop becomes a floor plan.
        Press R! and the spatial UI drives SpecPrompt &rarr; Agentelic &rarr; FleetPrompt
        &rarr; deploy &mdash; composed agents come out the far end.
    </p>
    <div class="cta-row">
        <a href="/app" class="btn btn-primary">Walk the Starter Fort</a>
        <a href="#how-it-works" class="btn btn-secondary">60-second tour</a>
        <a
            href="https://github.com/c-u-l8er/runefort.com"
            class="btn-link"
            target="_blank"
            rel="noopener">View source &rarr;</a
        >
    </div>

    <!-- Mini-fort: animated teaser. A room lights up, a token travels a corridor, the next room pulses. -->
    <div class="minifort" aria-hidden="true">
        <svg viewBox="0 0 360 120" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter
                    id="softGlow"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                >
                    <feGaussianBlur stdDeviation="2" />
                </filter>
            </defs>
            <!-- grid -->
            <g
                class="mf-grid"
                stroke="rgba(232,168,76,0.07)"
                stroke-width="0.5"
            >
                <path d="M0 30 H360 M0 60 H360 M0 90 H360" />
                <path
                    d="M30 0 V120 M90 0 V120 M150 0 V120 M210 0 V120 M270 0 V120 M330 0 V120"
                />
            </g>
            <!-- rooms -->
            <rect
                class="room room-a"
                x="24"
                y="36"
                width="72"
                height="48"
                rx="2"
            />
            <rect
                class="room room-b"
                x="144"
                y="36"
                width="72"
                height="48"
                rx="2"
            />
            <rect
                class="room room-c"
                x="264"
                y="36"
                width="72"
                height="48"
                rx="2"
            />
            <!-- corridors -->
            <line
                class="corridor corridor-1"
                x1="96"
                y1="60"
                x2="144"
                y2="60"
            />
            <line
                class="corridor corridor-2"
                x1="216"
                y1="60"
                x2="264"
                y2="60"
            />
            <!-- traveling token -->
            <circle class="token" r="3.5" cy="60" />
            <!-- labels -->
            <text x="60" y="105" class="mf-label">retrieve</text>
            <text x="180" y="105" class="mf-label">route</text>
            <text x="300" y="105" class="mf-label">act</text>
        </svg>
    </div>
</header>

<style>
    .hero {
        padding-top: 10rem;
        padding-bottom: 4rem;
        text-align: center;
        position: relative;
        z-index: 1;
    }
    .hero-badge {
        font-family: var(--mono);
        font-size: 0.65rem;
        letter-spacing: 0.08em;
        color: var(--dim);
        padding: 0.4rem 1rem;
        border: 1px solid var(--border);
        border-radius: 100px;
        display: inline-block;
        margin-bottom: 2rem;
    }
    .hero h1 {
        font-family: var(--serif);
        font-weight: 400;
        font-size: clamp(2.4rem, 5.5vw, 4rem);
        line-height: 1.15;
        letter-spacing: 0.02em;
        margin-bottom: 1.5rem;
    }
    .hero h1 em {
        font-style: normal;
        color: var(--amber);
    }
    .subline .accent {
        font-style: normal;
        color: var(--amber);
        font-weight: 500;
    }
    .subline {
        font-size: 1.1rem;
        color: var(--dim);
        max-width: 620px;
        margin: 0 auto 2.25rem;
        line-height: 1.75;
    }
    .cta-row {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 3rem;
    }
    .btn-link {
        font-family: var(--mono);
        font-size: 0.72rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--dim);
        padding: 0.85rem 0.75rem;
        transition: color 0.2s ease;
    }
    .btn-link:hover {
        color: var(--amber);
    }

    /* Animated mini-fort */
    .minifort {
        max-width: 560px;
        margin: 0 auto;
        opacity: 0.9;
    }
    .minifort svg {
        width: 100%;
        height: auto;
        display: block;
    }
    .mf-label {
        font-family: var(--mono);
        font-size: 6px;
        letter-spacing: 0.1em;
        fill: var(--dim);
        text-anchor: middle;
        text-transform: uppercase;
    }
    .room {
        fill: var(--surface);
        stroke: rgba(232, 168, 76, 0.35);
        stroke-width: 1;
    }
    /* Every element shares a single 6s cycle with matched keyframes.
       Token stations:  0–30% in A  |  40–62% in B  |  72–95% in C
       Room lit windows track the token's occupancy exactly. */
    .room-a {
        animation: roomALight 6s linear infinite;
    }
    .room-b {
        animation: roomBLight 6s linear infinite;
    }
    .room-c {
        animation: roomCLight 6s linear infinite;
    }

    @keyframes roomALight {
        0% {
            fill: var(--surface);
            stroke: rgba(232, 168, 76, 0.2);
        }
        5% {
            fill: var(--amber-dim);
            stroke: var(--amber);
        }
        28% {
            fill: var(--amber-dim);
            stroke: var(--amber);
        }
        34% {
            fill: var(--surface);
            stroke: rgba(232, 168, 76, 0.2);
        }
        100% {
            fill: var(--surface);
            stroke: rgba(232, 168, 76, 0.2);
        }
    }
    @keyframes roomBLight {
        0% {
            fill: var(--surface);
            stroke: rgba(232, 168, 76, 0.2);
        }
        38% {
            fill: var(--surface);
            stroke: rgba(232, 168, 76, 0.2);
        }
        42% {
            fill: var(--amber-dim);
            stroke: var(--amber);
        }
        62% {
            fill: var(--amber-dim);
            stroke: var(--amber);
        }
        68% {
            fill: var(--surface);
            stroke: rgba(232, 168, 76, 0.2);
        }
        100% {
            fill: var(--surface);
            stroke: rgba(232, 168, 76, 0.2);
        }
    }
    @keyframes roomCLight {
        0% {
            fill: var(--surface);
            stroke: rgba(232, 168, 76, 0.2);
        }
        70% {
            fill: var(--surface);
            stroke: rgba(232, 168, 76, 0.2);
        }
        74% {
            fill: var(--amber-dim);
            stroke: var(--amber);
        }
        95% {
            fill: var(--amber-dim);
            stroke: var(--amber);
        }
        100% {
            fill: var(--surface);
            stroke: rgba(232, 168, 76, 0.2);
        }
    }

    .corridor {
        stroke: rgba(196, 149, 106, 0.25);
        stroke-width: 1.5;
        stroke-dasharray: 3 3;
    }
    .token {
        fill: var(--amber);
        filter: url(#softGlow);
        animation: tokenTravel 6s linear infinite;
    }
    @keyframes tokenTravel {
        0% {
            cx: 60;
            opacity: 0;
        } /* 0.00s — appear at A */
        5% {
            cx: 60;
            opacity: 1;
        } /* 0.30s — lit in A */
        28% {
            cx: 60;
            opacity: 1;
        } /* 1.68s — leaving A */
        40% {
            cx: 180;
            opacity: 1;
        } /* 2.40s — arrived in B */
        62% {
            cx: 180;
            opacity: 1;
        } /* 3.72s — leaving B */
        74% {
            cx: 300;
            opacity: 1;
        } /* 4.44s — arrived in C */
        95% {
            cx: 300;
            opacity: 1;
        } /* 5.70s — still in C */
        100% {
            cx: 300;
            opacity: 0;
        } /* 6.00s — fade */
    }

    /* Respect reduced-motion preferences */
    @media (prefers-reduced-motion: reduce) {
        .room-a,
        .room-b,
        .room-c,
        .token {
            animation: none;
        }
        .room-b {
            fill: var(--amber-dim);
            stroke: var(--amber);
        }
    }
</style>
