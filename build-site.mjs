/* ==========================================================================
   runefort.com site build.

   The landing page is GENERATED from records/surface.json and from the
   component files themselves. Every byte figure that reaches the page is
   RECOMPUTED here — the ES module import graph is walked transitively from
   each entry point, the reachable files are concatenated, and the result is
   gzipped at level 9. If a recomputed figure disagrees with the frozen record
   in records/weights.json, this build throws and nothing is emitted.

   That gate exists because of a real defect: this site published "~5KB" seven
   times, as the weight of a thing that was never named, and the smallest
   loadable module graph that renders a floor is 6.6 KB gzipped while the entry
   point the documentation tells you to load is 41 KB. A hand-typed number is
   exactly the thing that cannot be audited.

   Run it through the gate, never on its own:   npm run test:launch
   ========================================================================== */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { gzipSync } from "zlib";
import { resolve, dirname, basename } from "path";

const read = (p) => readFileSync(p, "utf8");
const J = (p) => JSON.parse(read(p));

const surface = J("./records/surface.json");
const pkg = J("./package.json");
const core = J("./packages/core/package.json");
const SRC = "./packages/core/src";
const APP_PATH = "/app/";
const SPEC_URL = "https://docs.ampersandboxdesign.com/#/runefort.com/docs/spec/runefort.protocol.md";
const RUNGS = ["spec", "in_tree", "live_local", "live_deployed", "external"];

/* ---------- release identity: three files, one version, or no build ----------
   The site version, the private site package and the published component
   package must agree. The site advertising a version the package is not at is
   a small lie that nobody would ever catch by reading. */
if (pkg.version !== surface.version || core.version !== surface.version) {
    throw new Error(
        `release identity: package.json ${pkg.version} / packages/core ${core.version} / records/surface.json ${surface.version}`
    );
}
const STAMP = `RUNEFORT v${surface.version} · RECORDS ${surface.verified_at}`;

const esc = (s) =>
    String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

/* ==========================================================================
   THE WEIGHT GATE — walk the module graph, do not guess
   ========================================================================== */
function closure(entries) {
    const seen = new Set();
    const queue = entries.map((e) => resolve(SRC, e));
    while (queue.length) {
        const f = queue.shift();
        if (seen.has(f)) continue;
        if (!existsSync(f)) throw new Error(`module graph: ${f} does not exist`);
        seen.add(f);
        const src = readFileSync(f, "utf8");
        for (const m of src.matchAll(/from\s*"(\.\/[^"]+)"/g)) queue.push(resolve(dirname(f), m[1]));
        for (const m of src.matchAll(/import\s*"(\.\/[^"]+)"/g)) queue.push(resolve(dirname(f), m[1]));
    }
    return [...seen].sort();
}
function weigh(files) {
    const body = files.map((f) => readFileSync(f, "utf8")).join("\n");
    return {
        modules: files.length,
        raw: Buffer.byteLength(body),
        gzip: gzipSync(Buffer.from(body), { level: 9 }).length,
        names: files.map((f) => basename(f)),
    };
}
const KB = (n) => (n / 1024).toFixed(1) + " KB";

const PRIMITIVES = ["rune-floor.js", "rune-room.js", "rune-claim.js", "rune-link.js"];
const measured = {
    floor: { ...weigh(closure(PRIMITIVES)), label: "The four layout primitives", entry: PRIMITIVES.join(" + ") },
    entry: { ...weigh(closure(["index.js"])), label: "The documented entry point", entry: "index.js" },
    theme: (() => {
        const css = read("./packages/core/theme.css");
        return { modules: 1, raw: Buffer.byteLength(css), gzip: gzipSync(Buffer.from(css), { level: 9 }).length, label: "theme.css", entry: "theme.css", names: ["theme.css"] };
    })(),
    cloud: { ...weigh(["supabase.js"].map((f) => resolve(SRC, f))), label: "The cloud-sync adapter, inside the entry point", entry: "supabase.js" },
};
const elements = [...new Set(
    readdirSync(SRC).filter((f) => f.endsWith(".js"))
        .flatMap((f) => [...read(`${SRC}/${f}`).matchAll(/customElements\.define\(\s*"([^"]+)"/g)].map((m) => m[1]))
)].sort();

const drift = [];
const FROZEN = "./records/weights.json";
if (existsSync(FROZEN)) {
    const frozen = J(FROZEN);
    for (const k of Object.keys(measured)) {
        for (const field of ["modules", "raw", "gzip"]) {
            if (!frozen.measured[k] || frozen.measured[k][field] !== measured[k][field]) {
                drift.push(`${k}.${field}: built ${measured[k][field]} != record ${frozen.measured[k] ? frozen.measured[k][field] : "(absent)"}`);
            }
        }
    }
    if (frozen.elements.join(",") !== elements.join(",")) {
        drift.push(`custom elements: built [${elements.join(", ")}] != record [${frozen.elements.join(", ")}]`);
    }
} else {
    writeFileSync(FROZEN, JSON.stringify({
        schema: "runefort-weights-v1",
        _comment: "Frozen by build-site.mjs on first run. Every figure here is recomputed from packages/core on every subsequent build by walking the ES module import graph and gzipping at level 9, and the build refuses on any disagreement. Do not hand-edit: if a component grows, that is a fact about the components, not a typo on this page.",
        frozen_at: surface.verified_at,
        measured: Object.fromEntries(Object.entries(measured).map(([k, v]) => [k, { modules: v.modules, raw: v.raw, gzip: v.gzip, names: v.names }])),
        elements,
    }, null, 2) + "\n");
    console.log(`froze ${Object.keys(measured).length} weight measurements into ${FROZEN}`);
}

/* Every local path the documentation tells a reader to load must resolve.
   README.md's quickstart pointed at /packages/core/dist/index.js — there is no
   dist/ in this repository and no build step that would create one — so the
   first line anyone copied returned 404. A documented path that does not
   resolve is the same defect as a button that does nothing. */
for (const file of ["./README.md"]) {
    for (const m of read(file).matchAll(/(?:src|href)="(\/packages\/[^"]+)"/g)) {
        if (!existsSync("." + m[1])) drift.push(`${file} points at ${m[1]}, which does not exist`);
    }
}

if (drift.length) {
    console.error("BUILD REFUSED — the components and the frozen records disagree:");
    drift.forEach((d) => console.error("  " + d));
    process.exit(1);
}
console.log(`weight gate: ${measured.entry.modules} modules walked from the entry point, ${elements.length} custom elements found, 0 drift`);

/* ==========================================================================
   SHELL FRAGMENTS — shared markup; only the tokens in src/shell.css differ.
   ========================================================================== */

function rung(value) {
    const r = RUNGS.includes(value) ? value : "?";
    return `<span class="rung" data-rung="${r}" title="spec · in_tree · live_local · live_deployed · external">${r}</span>`;
}

/* The band states where you are, and WHAT IT MAY STATE DEPENDS ON THE PLACE.
   ampersand-nav/src/amp-nav.js records runefort as place:3, and its own
   renderPlacement() emits the layer sentence for place 2 only — place 3 gets
   "a specification in the ComputeDriven world". Writing the layer sentence
   here would put this band in direct contradiction with the nav rendered
   immediately beneath it. SHELL.md §1 documents the place-2 and place-4
   variants and not this one; the nav is the record and the nav wins. */
function band() {
    const where = {
        4: `A <b>${esc(surface.parent)}</b> project`,
        3: `${esc(surface.surface)} &mdash; a <b>specification</b> in the ${esc(surface.parent)} world`,
        2: `${esc(surface.surface)} is the <b>${esc(surface.layer)}</b> layer of ${esc(surface.parent)}`,
    }[surface.tier];
    if (!where) {
        throw new Error("BUILD REFUSED — records/surface.json declares no usable place, so the band cannot know what it may claim.");
    }
    return `<div class="band" data-tier="${surface.tier}"><span class="where">${where}</span>${rung(surface.surface_rung)}<span class="covers">That rung covers ${esc(surface.surface_rung_covers)}.</span></div>`;
}

function statusBlock() {
    const s = surface.status;
    return `<dl class="status">
<div><dt>Status</dt><dd><strong>${esc(surface.surface_rung)}</strong> &mdash; ${esc(s.statement)}</dd></div>
<div><dt>Last verified</dt><dd>${esc(surface.verified_at)}</dd></div>
<div><dt>Source</dt><dd>${esc(s.source)}</dd></div>
<div class="limit"><dt>Limit</dt><dd>${esc(s.limit)}</dd></div>
<div><dt>Next rung</dt><dd><strong>${esc(surface.advance.next_rung)}</strong> &mdash; ${esc(surface.advance.requires)}</dd></div>
</dl>`;
}

const VERBS = {
    spec: ["Read", "Challenge", "Implement"],
    in_tree: ["Inspect the source", "Run the tests"],
    live_local: ["Use it", "Reproduce it locally"],
    live_deployed: ["Use the deployed artifact"],
    external: ["See independent evidence", "Contribute another result"],
};

function cta(groupRung, label, actions) {
    const allowed = VERBS[groupRung];
    if (!allowed) throw new Error(`CTA group declares an unknown rung: ${groupRung}`);
    for (const a of actions) {
        if (!allowed.includes(a.verb)) {
            throw new Error(
                `BUILD REFUSED — CTA "${a.verb}" is not available at rung ${groupRung}. Allowed: ${allowed.join(", ")}`
            );
        }
    }
    const cls = groupRung === "spec" ? "tag" : "tag ok";
    return `<div class="ctagroup"><div class="${cls}">${esc(groupRung)} &mdash; ${esc(label)}</div><div class="cta">${actions
        .map(
            (a) =>
                `<a href="${a.href}"${a.href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}><span class="verb">${esc(a.verb)}</span><span class="what">${a.what}</span></a>`
        )
        .join("")}</div></div>`;
}

/* ==========================================================================
   GENERATED CONTENT
   ========================================================================== */

/* No plate cell is a bare integer with no noun. That is not typography — a
   bare "14" as a text node would collide with any literal 14 in the animation
   source and refuse the build, and the honest fix for that is a label. */
function plate() {
    const cells = [
        [KB(measured.floor.gzip), "Gzipped, to render a floor"],
        [KB(measured.entry.gzip), "Gzipped, at the documented entry"],
        [String(elements.length), "Custom elements registered"],
        ...surface.zero_counts.map((z) => [z.value, z.label]),
    ];
    return `<div class="grid plate">${cells
        .map(([n, l]) => `<div><div class="n">${esc(n)}</div><div class="l">${esc(l)}</div></div>`)
        .join("")}</div>`;
}

/* THE FLOOR. Each card is placed at exactly the cells it names, with plain
   CSS grid. The page is laid out with the vocabulary it documents. */
function floor() {
    return `<div class="floor">${surface.primitives
        .map(
            (p, i) =>
                `<div class="room r${i}"><div class="cell">${esc(p.pos)} &middot; ${esc(p.size)}</div><h3>${esc(p.name)}</h3><div class="one">${esc(p.one)}</div><p>${esc(p.detail)}</p></div>`
        )
        .join("")}</div>`;
}

function openCards() {
    return `<div class="grid">${surface.unmeasured
        .map(
            (c) =>
                `<div><div class="head"><h3>${esc(c.name)}</h3>${rung(c.rung)}</div><p>${esc(c.detail)}</p><div class="needs"><b>Needs:</b> ${esc(c.needs)} <b>Built:</b> ${esc(c.built)}.</div></div>`
        )
        .join("")}</div>`;
}

/* The table cells come from the module walk, not from the record — the record
   is only what they are checked against. A hand-typed weight is impossible. */
function weightTable() {
    const rows = [
        ["floor", measured.floor, "What a page needs to render rooms on a floor. rune-floor pulls in the threshold parser; rune-room pulls in the editor-handoff URL builder."],
        ["entry", measured.entry, "What <code>import \"@runefort/core\"</code> costs. It registers every element and re-exports the templates, the generation runtime and the cloud adapter."],
        ["cloud", measured.cloud, "Inside the row above. Loaded whether or not it is configured."],
        ["theme", measured.theme, "The stylesheet the components expect. Not JavaScript, and not counted in either figure above."],
    ];
    const body = rows
        .map(([k, m, note]) =>
            `<tr${k === "entry" ? ' class="hi"' : ""}><td class="place">${esc(m.label)}<br><span style="opacity:.7">${note}</span></td><td>${esc(m.entry)}</td><td class="num">${m.modules} ${m.modules === 1 ? "module" : "modules"}</td><td class="num">${m.raw.toLocaleString()} bytes</td><td class="num">${m.gzip.toLocaleString()} gzipped</td></tr>`
        )
        .join("");
    return `<div class="scroll"><table style="min-width:820px"><thead><tr><th>What you load</th><th>Entry point</th><th>Reached</th><th>Raw</th><th>Gzip level 9</th></tr></thead><tbody>${body}</tbody></table></div>`;
}

const ratio = (measured.entry.gzip / measured.floor.gzip).toFixed(1);
const WEIGHT_NOTE =
    `Read the two rows against each other: the smallest module graph that renders a floor of rooms is ` +
    `<strong>${measured.floor.gzip.toLocaleString()} bytes gzipped</strong>, and the entry point the documentation ` +
    `tells you to import is <strong>${measured.entry.gzip.toLocaleString()}</strong> &mdash; <strong>${ratio}&times;</strong> larger, because it ` +
    `registers all ${elements.length} elements and re-exports the templates, the generation runtime and the cloud adapter. ` +
    `Both are true, and the single figure this site used to print was neither. Splitting the entry point so the four primitives can be imported ` +
    `alone is the obvious fix and it has not been done, so the larger figure is the honest one to quote.`;

/* The declaration example. It is checked against the tree by the build: the
   path it names must resolve, or nothing is emitted. */
const QUICKSTART_SRC = "/packages/core/src/index.js";
const QUICKSTART_CSS = "/packages/core/theme.css";
if (!existsSync("." + QUICKSTART_SRC) || !existsSync("." + QUICKSTART_CSS)) {
    throw new Error(`BUILD REFUSED — the quick-start names a path that does not exist: ${QUICKSTART_SRC}`);
}
const QUICKSTART = `<pre>&lt;<b>script</b> type="module" src="<i>${QUICKSTART_SRC}</i>"&gt;&lt;/<b>script</b>&gt;
&lt;<b>link</b> rel="stylesheet" href="<i>${QUICKSTART_CSS}</i>"&gt;

&lt;<b>rune-floor</b> columns="6" rows="2" editor="vscode"&gt;
  &lt;<b>rune-room</b> id="memory" position="0,0" size="3,2" label="memory.ex"&gt;
    &lt;<b>rune-claim</b> pattern="lib/my_app/memory/**/*.ex" anchor="lib/my_app/memory.ex#L24"&gt;&lt;/<b>rune-claim</b>&gt;
  &lt;/<b>rune-room</b>&gt;
  &lt;<b>rune-room</b> id="deploy" position="3,0" size="3,2" label="deploy.ex"&gt;&lt;/<b>rune-room</b>&gt;
  &lt;<b>rune-link</b> from="memory" to="deploy" kind="adjacent" bidirectional&gt;&lt;/<b>rune-link</b>&gt;
&lt;/<b>rune-floor</b>&gt;</pre>`;

/* The measurement, published as its own block. Every figure in it is a
   quotation from records/surface.json's status.source, which is where the
   browser reading was written down. */
const MEASUREMENT = `<dl class="status">
<div><dt>Where</dt><dd><strong>${esc(surface.origin)}${APP_PATH}</strong>, in a browser, on ${esc(surface.verified_at)}. Not a local server and not this repository.</dd></div>
<div><dt>The floor</dt><dd>Computed <code>display</code> was <strong>grid</strong>, and <code>grid-template-columns</code> resolved to six tracks of <strong>157.828px</strong>.</dd></div>
<div><dt>A wide room</dt><dd>A room declaring <code>size="6,1"</code> measured <strong>1017px</strong> &mdash; six tracks plus the five gaps between them.</dd></div>
<div><dt>Two half rooms</dt><dd>Rooms declaring <code>position="0,1"</code> and <code>position="3,1"</code>, both <code>size="3,1"</code>, measured <strong>502px</strong> each, at x=224 and x=740. Side by side, three tracks each, one gap between.</dd></div>
<div><dt>Upgraded</dt><dd>All ${elements.length} custom elements were defined and every <code>&lt;rune-room&gt;</code> in the document had been upgraded by the time the measurement ran.</dd></div>
<div class="limit"><dt>What it is not</dt><dd>A conformance test. There is no corpus of declarations with expected geometry anywhere in this tree, so this is one reading of one page, repeatable by hand and by nothing else.</dd></div>
</dl>`;

function zeros() {
    return `<dl class="status">${surface.zero_counts
        .map(
            (z) =>
                `<div><dt>${esc(z.label)}</dt><dd><strong>${esc(z.value)}.</strong> ${esc(z.witness)}</dd></div>`
        )
        .join("")}</dl>`;
}

/* ==========================================================================
   THE RETRACTION
   The bare string is in launch-gate.mjs's blocklist, so it cannot come back
   by an edit — only by a measurement.
   ========================================================================== */
const RETRACTION = `<div class="retract"><h3>Retraction &mdash; the weight on this page was never measured</h3>
<p>Until this revision this site printed <code>~5KB</code> in its title, in its description, twice in its social cards, in its own eyebrow, and twice more in the comparison table &mdash; seven times, and not once beside the name of the thing being weighed. The README called it a <em>target</em>. The landing page stated it as a fact.</p>
<p>Measured, by walking the ES module import graph and gzipping at level&nbsp;9: the four layout primitives with their own dependencies come to <strong>${measured.floor.gzip.toLocaleString()} bytes gzipped</strong>, and the entry point the documentation tells you to import comes to <strong>${measured.entry.gzip.toLocaleString()}</strong>. Neither is five kilobytes. The nearest true statement is that the four primitive files <em>alone</em> gzip to about five kilobytes &mdash; and they cannot be loaded alone, because the documented entry point registers all ${elements.length} elements and pulls in the templates, the generation runtime and the cloud adapter with them.</p>
<p>A second thing went with it. The README's quick-start pointed at <code>/packages/core/dist/index.js</code>, and there is no <code>dist/</code> in this repository and no build step that would produce one, so the first line anyone copied returned 404. Both are now structural rather than careful: the figures are recomputed from the component files on every build and the build refuses when one moves without its record, and every documented path is resolved against the tree before the page is emitted.</p></div>`;

/* ==========================================================================
   EMIT
   ========================================================================== */
const CSS = read("./src/shell.css")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\n\s*/g, "")
    .replace(/;\}/g, "}")
    .trim();

/* The identifying animation is emitted as its own artifact rather than
   inlined: the landing page's markup stays content-only, so "the content is
   complete with JavaScript off" is verifiable by deleting one line; and the
   animation becomes a file the gate can read constants out of. NEWLINES ARE
   KEPT — joining JavaScript lines the way the CSS is joined is a
   semicolon-insertion bug waiting to happen. */
const ANIM = read("./src/tiles.js")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "")
    .replace(/^[ \t]+/gm, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();

const YEAR = new Date(surface.verified_at).getUTCFullYear();

const landing = fill(read("./src/landing.html"), {
    CSS,
    BAND: band(),
    STAMP,
    APP_PATH,
    ORIGIN: surface.origin,
    REPO: surface.repo,
    SPEC_URL,
    CONTACT: surface.contact.url,
    QUESTION: esc(surface.question),
    YEAR: String(YEAR),
    PLATE: plate(),
    FLOOR: floor(),
    QUICKSTART,
    WEIGHT_TABLE: weightTable(),
    WEIGHT_NOTE,
    MEASUREMENT,
    OPEN_CARDS: openCards(),
    STATUS: statusBlock(),
    ZEROS: zeros(),
    RETRACTION,
    CTA:
        cta("live_deployed", "measured in a browser on this domain", [
            {
                verb: "Use the deployed artifact",
                href: APP_PATH,
                what: "Walk the demo fort. Click a tile to open it, fork the fort, place your own rooms. Local by default &mdash; the cloud path is listed above as unbuilt and it is not in your way.",
            },
        ]) +
        cta("spec", "a draft protocol with one renderer", [
            {
                verb: "Read",
                href: SPEC_URL,
                what: "Four primitives and a JSON shape. §2 is the whole vocabulary; the rest is how a renderer is expected to treat it.",
            },
            {
                verb: "Challenge",
                href: surface.contact.url,
                what: "Find a declaration this renderer lays out differently from what it declares. A declaration and the geometry you expected is the most useful thing anyone can send.",
            },
            {
                verb: "Implement",
                href: surface.repo,
                what: "A second renderer &mdash; Elixir, React, static HTML. That is the only thing that can turn <code>renderer-portable</code> from an intention into a measurement.",
            },
        ]),
});

function fill(tpl, vars) {
    return tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => {
        if (!(k in vars)) throw new Error(`template token {{${k}}} has no value`);
        return vars[k];
    });
}

writeFileSync("./index.html", landing);
writeFileSync("./tiles.js", ANIM + "\n");

console.log(`wrote index.html   ${landing.length.toLocaleString()} bytes`);
console.log(`wrote tiles.js     ${ANIM.length.toLocaleString()} bytes  (decoration; the page's content does not depend on it)`);
