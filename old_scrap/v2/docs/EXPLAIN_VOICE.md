# Explain-in-English voice

The "Explain" button (spec §0.6, §7.4.1) produces 30–60 words of plain prose
for whichever fort is currently loaded. It runs entirely locally — no LLM
calls from inside RuneFort — via a deterministic template walker over the
PULSE manifest.

The walker is easy to make *technically* English and *terrible* prose. This
doc fixes the voice so the button's output reads like the landing page.

## Voice rules

1. **Lowercase body.** Follow `src/components/Hero.svelte` subline and
   `src/components/Vision.svelte`. No Title Case.
2. **Em-dash rhythm.** Prefer `—` (U+2014) over commas for the inflection
   point. One em-dash per sentence, two max per paragraph.
3. **One amber keyword.** Highlight exactly one concept per paragraph — the
   loop name, the κ routing, or the cadence. Everything else stays plain.
4. **No jargon parade.** Do NOT list all five kinds (retrieve/route/act/
   learn/consolidate) unless they are actually what's loaded. Say what the
   fort does, not what PULSE is.
5. **Short sentences.** 1–3 sentences total. 30–60 words.
6. **No "this PULSE loop..."** opener. Never. It's the single most common
   failure mode of generated prose and it instantly sounds machine-written.

## Worked examples (✓)

**Starter Fort** (3 phases: retrieve → route → act, tick cadence 2000ms):

> runefort.starter is a 3-phase rhythm — retrieve → route → act. every tick,
> it pulls context, then does the work. cadence: every 2s.

**Graphonomous memory loop** (5 phases, event cadence, κ on):

> graphonomous.memory_loop is a 5-phase rhythm — retrieve → route → act →
> learn → consolidate. every tick, it pulls context, then cleans up and
> promotes. cadence: event-driven, with κ-aware routing.

**PRISM benchmark loop** (5 phases: compose → interact → observe → reflect →
diagnose, event cadence):

> prism.benchmark is a 5-phase rhythm — compose → interact → observe →
> reflect → diagnose. every tick, it starts, then finishes. cadence:
> event-driven.

## Worked non-examples (✗)

> ❌ *This PULSE loop has 5 phases named retrieve, route, act, learn, and
> consolidate.* — reads like a schema dump. Never open with "This PULSE
> loop".

> ❌ *The graphonomous.memory_loop Loop — which consists of a retrieval
> phase, a routing phase, an action phase, a learning phase and a
> consolidation phase — is a multi-phase PULSE-declared closed loop that
> operates over a continual learning graph.* — too long, too jargony, no
> rhythm.

> ❌ *Graphonomous memory loop runs retrieve, route, act, learn,
> consolidate in sequence with κ-aware routing enabled.* — technically
> correct, but no voice. No em-dash, no accent, no breath.

> ❌ *Your fort runs a 5-phase rhythm! Click the rune to learn more!* —
> exclamation marks, marketing CTA, Title Case. Wrong product.

## Walker implementation

See `src/components/app/ExplainButton.svelte::explain(manifest)`. The walker:

- Reads `manifest.phases[*].kind` and joins with ` → `.
- Looks up the first and last kind in `PHASE_KIND_VERBS` for the "every tick"
  sentence.
- Adds the cadence sentence only when `manifest.cadence.type === 'tick'` has
  `interval_ms`, or when `cadence.type === 'event'`, or when
  `invariants.kappa_routing` is truthy.

Before changing the walker, add a new entry to the "Worked examples" list
above with the expected output. If the new prose wouldn't sit next to
`Vision.svelte`'s three-step promise, do not ship it.

## Agent-routed path (optional)

If a chat channel is open (see `src/lib/stores/chat.svelte.js`), a future
revision may emit a `summary.request` CloudEvent on the channel instead of
running the template, letting the calling agent produce the summary with an
LLM. That path must still receive the summary **back** via the chat channel
and display it — RuneFort itself never makes the LLM call.
