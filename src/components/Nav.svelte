<nav>
    <div class="nav-inner">
        <a href="#" class="nav-brand"><span class="rune">ᚲ</span> RuneFort</a>
        <ul class="nav-links">
            <li><a href="#vision">Vision</a></li>
            <li><a href="#zoom">Zoom</a></li>
            <li><a href="#dark-factory">Dark Factory</a></li>
            <li><a href="#overlays">Overlays</a></li>
            <li><a href="#ecosystem">Ecosystem</a></li>
            <li>
                <a
                    href="https://github.com/c-u-l8er/runefort.com"
                    target="_blank"
                    rel="noopener">GitHub</a
                >
            </li>
        </ul>
    </div>
</nav>

<style>
    nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        background: rgba(9, 9, 13, 0.88);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border);
        padding: 0.75rem 0;
    }
    .nav-inner {
        max-width: var(--max-w);
        margin: 0 auto;
        padding: 0 var(--gutter);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .nav-brand {
        font-family: var(--serif);
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text);
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }
    .nav-brand .rune {
        color: var(--amber);
        margin-right: 0.3rem;
        font-size: 1rem;
    }
    .nav-links {
        display: flex;
        gap: 1.5rem;
        list-style: none;
    }
    .nav-links a {
        font-family: var(--mono);
        font-size: 0.7rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--dim);
        transition: color 0.2s;
    }
    .nav-links a:hover {
        color: var(--amber);
    }
    @media (max-width: 600px) {
        .nav-links {
            gap: 0.75rem;
        }
        .nav-links a {
            font-size: 0.6rem;
        }
    }
</style>
