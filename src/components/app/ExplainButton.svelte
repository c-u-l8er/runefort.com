<script>
  // "Explain this fort in English" — deterministic template walker over the
  // loaded PULSE (+ optional [&]) manifest. Produces 30–60 words of prose in
  // the landing-page voice: lowercase body, em-dash rhythm, one amber-accented
  // keyword. Zero network calls from inside RuneFort (spec §7.4). An optional
  // agent-routed path hands the manifest to a chat channel if one is open.
  //
  // See `docs/EXPLAIN_VOICE.md` for worked examples and non-examples.

  import { getFort } from "$lib/stores/fort.svelte.js";

  const fort = getFort();

  let open = $state(false);
  let prose = $state("");

  const PHASE_KIND_VERBS = /** @type {Record<string, string>} */ ({
    retrieve: "pulls context",
    route: "decides the next move",
    act: "does the work",
    learn: "turns outcomes into feedback",
    consolidate: "cleans up and promotes",
  });

  /**
   * Build prose from a PULSE manifest. Returns 1–3 short sentences.
   * @param {any} manifest
   * @returns {string}
   */
  function explain(manifest) {
    if (!manifest) {
      return "no manifest is loaded. drop a PULSE file on the canvas, or walk a fort in the district view to see it.";
    }
    const phases = Array.isArray(manifest.phases) ? manifest.phases : [];
    if (phases.length === 0) {
      return `this loop — ${manifest.loop_id ?? "unnamed"} — has no declared phases yet. add a room to get started.`;
    }

    /** @type {string[]} */
    const kinds = phases.map((/** @type {any} */ p) => p.kind).filter(Boolean);
    const first = kinds[0];
    const last = kinds[kinds.length - 1];
    const n = phases.length;

    // Sentence 1: shape of the loop
    const kindChain = kinds.join(" → ");
    const s1 = `${manifest.loop_id ?? "this loop"} is a ${n}-phase rhythm — ${kindChain}.`;

    // Sentence 2: what it does at the bookends
    const whatFirst = PHASE_KIND_VERBS[first] ?? "starts";
    const whatLast = PHASE_KIND_VERBS[last] ?? "finishes";
    const s2 = first === last
      ? `every tick, it ${whatFirst}.`
      : `every tick, it ${whatFirst}, then ${whatLast}.`;

    // Sentence 3: cadence + κ routing if declared
    const cadence = manifest.cadence?.type;
    const kappa = manifest.invariants?.kappa_routing;
    let s3 = "";
    if (cadence === "tick" && manifest.cadence?.interval_ms) {
      s3 = `cadence: every ${Math.round(manifest.cadence.interval_ms / 1000)}s`;
    } else if (cadence === "event") {
      s3 = "cadence: event-driven";
    }
    if (kappa) s3 += s3 ? ", with κ-aware routing" : "κ-aware routing is on";
    if (s3) s3 += ".";

    return [s1, s2, s3].filter(Boolean).join(" ");
  }

  function toggle() {
    if (!open) {
      prose = explain(fort.manifest);
    }
    open = !open;
  }

  function close() { open = false; }
</script>

<button
  type="button"
  class="explain-btn"
  class:open
  aria-expanded={open}
  aria-controls="explain-pop"
  aria-label="Explain this fort in English"
  onclick={toggle}
>
  <span class="explain-rune">ᛗ</span>
  <span class="explain-text">Explain</span>
</button>

{#if open}
  <div id="explain-pop" class="explain-pop" role="dialog" aria-label="Plain-English summary of this fort">
    <div class="pop-header">
      <span class="pop-label">plain english</span>
      <button type="button" class="pop-close" aria-label="Close explanation" onclick={close}>×</button>
    </div>
    <p class="pop-body">{prose}</p>
    <p class="pop-meta">generated locally, no LLM calls.</p>
  </div>
{/if}

<style>
  .explain-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.7rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 4px;
    cursor: pointer;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    transition: border-color 180ms ease, color 180ms ease, background 180ms ease;
  }
  .explain-btn:hover,
  .explain-btn:focus-visible {
    border-color: rgba(232, 168, 76, 0.35);
    color: #e4e2dc;
    outline: none;
  }
  .explain-btn:focus-visible {
    box-shadow: 0 0 0 2px rgba(232, 168, 76, 0.35);
  }
  .explain-btn.open {
    background: rgba(232, 168, 76, 0.08);
    border-color: rgba(232, 168, 76, 0.4);
    color: #e4e2dc;
  }
  .explain-rune {
    color: #c4956a;
    font-size: 0.8rem;
  }
  .explain-pop {
    position: fixed;
    top: 72px;
    right: 1.25rem;
    width: min(360px, calc(100vw - 2rem));
    padding: 0.9rem 1rem 0.8rem;
    background: rgba(14, 15, 20, 0.98);
    border: 1px solid rgba(232, 168, 76, 0.3);
    border-radius: 10px;
    box-shadow: 0 14px 30px rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(12px);
    z-index: 50;
  }
  .pop-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.4rem;
  }
  .pop-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #e8a84c;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .pop-close {
    background: transparent;
    border: none;
    color: #7a7770;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 0 0.25rem;
    line-height: 1;
  }
  .pop-close:hover,
  .pop-close:focus-visible {
    color: #e4e2dc;
    outline: none;
  }
  .pop-body {
    font-family: "IBM Plex Sans", sans-serif;
    font-size: 0.85rem;
    line-height: 1.55;
    color: #e4e2dc;
    margin: 0 0 0.5rem;
  }
  .pop-meta {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #44423d;
    letter-spacing: 0.04em;
    margin: 0;
  }
  @media (prefers-reduced-motion: reduce) {
    .explain-btn { transition: none; }
  }
</style>
