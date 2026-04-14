<footer>
    <div class="container">
        <div class="footer-inner">
            <div class="footer-brand"><span class="rune">ᚲ</span> RuneFort</div>
            <ul class="footer-links">
                <li>
                    <a
                        href="https://github.com/c-u-l8er/runefort.com"
                        target="_blank"
                        rel="noopener">GitHub</a
                    >
                </li>
                <li>
                    <a
                        href="https://opensentience.org"
                        target="_blank"
                        rel="noopener">OpenSentience</a
                    >
                </li>
                <li>
                    <a
                        href="https://graphonomous.com"
                        target="_blank"
                        rel="noopener">Graphonomous</a
                    >
                </li>
            </ul>
            <div class="footer-copy">
                &copy; 2026 [&] Protocol ecosystem &middot; Spatial cognition
                for autonomous workflows
                <div class="footer-runes">
                    ᚲ ᚨ ᚠ ᛃ ᛞ ᛉ ᚱ ᛏ ᛊ ᛈ ᚦ ᚢ ᚷ ᚹ ᚺ ᚾ ᛁ ᛇ ᛒ ᛖ ᛗ ᛚ ᛜ ᛟ
                </div>
            </div>
        </div>
    </div>
</footer>

<style>
    footer {
        border-top: 1px solid var(--border);
        padding: 3rem 0;
        position: relative;
        z-index: 1;
    }
    .footer-inner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
    }
    .footer-brand {
        font-family: var(--serif);
        font-size: 0.85rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--dim);
    }
    .footer-brand .rune {
        color: var(--rune);
        margin-right: 0.3rem;
    }
    .footer-links {
        display: flex;
        gap: 1.5rem;
        list-style: none;
    }
    .footer-links a {
        font-family: var(--mono);
        font-size: 0.7rem;
        letter-spacing: 0.06em;
        color: var(--muted);
        transition: color 0.2s;
    }
    .footer-links a:hover {
        color: var(--amber);
    }
    .footer-copy {
        width: 100%;
        text-align: center;
        font-size: 0.75rem;
        color: var(--muted);
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border);
    }
    .footer-runes {
        font-size: 1rem;
        letter-spacing: 0.5em;
        color: var(--rune);
        opacity: 0.3;
        margin-top: 0.75rem;
    }
</style>
