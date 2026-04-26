// @ts-check
// templates.js — registries for the LLM-authoring side of @runefort/core.
//
// roomKinds: types of room (text, youtube, ampersand, metric, ...)
//            Each defines: id, label, icon, defaultSize, promptSystem (extra
//            instructions appended to the base SYSTEM prompt), and a
//            renderHook (optional — runs after roomFromJson to render
//            kind-specific content into the room element).
//
// floorTemplates / buildingTemplates / campusTemplates: preset starting
//            prompts for the corresponding "+ X" actions. Each defines a
//            label, description, and starterPrompt the user can edit before
//            submitting. The starterPrompt is what fills the textarea.

// ─── Room kinds ──────────────────────────────────────────────────────────

export const roomKinds = [
  {
    id: "text",
    label: "Text tile",
    icon: "▣",
    description: "Title + short body. The default tile shape.",
    defaultSize: [2, 1],
    promptSystem: `Default text tile. Body should be 1-2 sentences.`,
    fields: ["id", "label", "position", "size", "state_class", "body"],
  },
  {
    id: "youtube",
    label: "YouTube video",
    icon: "▶",
    description: "Embed a YouTube video as a tile (uses thumbnail).",
    defaultSize: [3, 2],
    promptSystem: `Generate a YouTube video tile. INCLUDE these extra fields:
  "kind": "youtube",
  "video_id": "<11-character YouTube video ID, e.g., dQw4w9WgXcQ>"
The video_id MUST be 11 characters long, alphanumeric plus dashes/underscores. Pick a real-looking ID that fits the topic the user requested.`,
    fields: ["id", "label", "position", "size", "kind", "video_id", "body"],
    renderHook(roomEl, json) {
      roomEl.setAttribute("data-kind", "youtube");
      if (json.video_id) roomEl.dataset.videoId = json.video_id;
      // Replace default content with a thumbnail card
      const existing = roomEl.querySelector(".room-body, strong");
      // We'll keep the strong (title) but build a richer body
      const oldStrong = roomEl.querySelector("strong");
      const oldBody = roomEl.querySelector(".room-body");
      const titleText = (oldStrong && oldStrong.textContent) || json.label || "untitled";
      const bodyText = (oldBody && oldBody.textContent) || "";

      roomEl.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "rune-yt";

      // Click-to-play thumbnail. Plays the video inline in the tile, replacing
      // the thumbnail with an embedded YouTube iframe. Does NOT open a new
      // window. Click also stops propagation so the room's open-detail
      // handler doesn't fire.
      const thumb = document.createElement("div");
      thumb.className = "rune-yt-thumb";
      thumb.setAttribute("role", "button");
      thumb.setAttribute("aria-label", `Play "${titleText}"`);
      thumb.tabIndex = 0;
      thumb.innerHTML = `<span class="rune-yt-play">▶</span>`;

      const playInline = (ev) => {
        if (ev) {
          ev.stopPropagation();
          ev.preventDefault();
        }
        if (!json.video_id) return;
        // Replace thumbnail with iframe player
        const iframe = document.createElement("iframe");
        iframe.className = "rune-yt-iframe";
        iframe.src = `https://www.youtube.com/embed/${json.video_id}?autoplay=1&rel=0`;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.setAttribute("frameborder", "0");
        thumb.replaceWith(iframe);
      };
      thumb.addEventListener("click", playInline);
      thumb.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") playInline(ev);
      });

      if (json.video_id) {
        // Probe thumbnail availability and fall back gracefully:
        // 1) hqdefault.jpg → 2) mqdefault.jpg → 3) styled placeholder
        const setBg = (url) => { thumb.style.backgroundImage = `url(${url})`; };
        const tryUrl = (url, onFail) => {
          const img = new Image();
          img.onload = () => {
            // YouTube returns a 120x90 grey placeholder for missing videos.
            if (img.naturalWidth === 120 && img.naturalHeight === 90) onFail();
            else setBg(url);
          };
          img.onerror = onFail;
          img.src = url;
        };
        tryUrl(`https://i.ytimg.com/vi/${json.video_id}/hqdefault.jpg`, () => {
          tryUrl(`https://i.ytimg.com/vi/${json.video_id}/mqdefault.jpg`, () => {
            thumb.classList.add("rune-yt-thumb-fallback");
            const note = document.createElement("span");
            note.className = "rune-yt-fallback-note";
            note.textContent = "video preview unavailable";
            thumb.appendChild(note);
          });
        });
      } else {
        thumb.classList.add("rune-yt-thumb-fallback");
      }

      const titleEl = document.createElement("strong");
      titleEl.className = "rune-yt-title";
      titleEl.textContent = titleText;

      const bodyEl = document.createElement("div");
      bodyEl.className = "room-body rune-yt-body";
      bodyEl.textContent = bodyText;

      wrap.appendChild(thumb);
      wrap.appendChild(titleEl);
      if (bodyText) wrap.appendChild(bodyEl);
      roomEl.appendChild(wrap);
    },
  },
  {
    id: "ampersand",
    label: "[&] capability",
    icon: "&",
    description: "A capability composition tile from the [&] Protocol.",
    defaultSize: [2, 2],
    promptSystem: `Generate an [&] Protocol capability tile. INCLUDE these extra fields:
  "kind": "ampersand",
  "composition": "<expression like '&memory(:graphonomous) & &reason(:deliberatic)'>",
  "claim": "<short description of what this composition gives you>"
Use the [&] notation: each capability starts with '&' and may take a parameter in :symbol form. Common capabilities: &memory, &reason, &time, &space, &govern, &observe, &deploy.`,
    fields: ["id", "label", "position", "size", "kind", "composition", "claim", "body"],
    renderHook(roomEl, json) {
      roomEl.setAttribute("data-kind", "ampersand");
      const oldStrong = roomEl.querySelector("strong");
      const titleText = (oldStrong && oldStrong.textContent) || json.label || "untitled";
      const bodyText = json.claim || json.body || "";
      const composition = json.composition || "";
      roomEl.innerHTML = "";
      const titleEl = document.createElement("strong");
      titleEl.textContent = titleText;
      roomEl.appendChild(titleEl);
      if (composition) {
        const code = document.createElement("code");
        code.className = "rune-amp-composition";
        code.textContent = composition;
        roomEl.appendChild(code);
      }
      if (bodyText) {
        const bodyEl = document.createElement("div");
        bodyEl.className = "room-body";
        bodyEl.textContent = bodyText;
        roomEl.appendChild(bodyEl);
      }
    },
  },
  {
    id: "metric",
    label: "Metric tile",
    icon: "#",
    description: "A big number + label, useful for dashboards.",
    defaultSize: [1, 1],
    promptSystem: `Generate a metric tile. INCLUDE these extra fields:
  "kind": "metric",
  "value": "<the big number/value, formatted (e.g., '847', '$12.3K', '99.94%')>",
  "unit": "<optional unit suffix, e.g., 'req/s', 'users'>",
  "trend": "<optional: 'up' | 'down' | 'flat'>"
Body should be 1 sentence about the metric.`,
    fields: ["id", "label", "position", "size", "kind", "value", "unit", "trend", "body"],
    renderHook(roomEl, json) {
      roomEl.setAttribute("data-kind", "metric");
      const oldBody = roomEl.querySelector(".room-body");
      const bodyText = (oldBody && oldBody.textContent) || "";
      const labelText = roomEl.querySelector("strong")?.textContent || json.label || "";
      roomEl.innerHTML = "";
      const value = document.createElement("div");
      value.className = "rune-metric-value";
      value.textContent = json.value || "—";
      if (json.unit) {
        const u = document.createElement("span");
        u.className = "rune-metric-unit";
        u.textContent = " " + json.unit;
        value.appendChild(u);
      }
      if (json.trend) {
        const t = document.createElement("span");
        t.className = "rune-metric-trend rune-metric-trend-" + json.trend;
        t.textContent = json.trend === "up" ? "↑" : json.trend === "down" ? "↓" : "→";
        value.appendChild(t);
      }
      const labelEl = document.createElement("strong");
      labelEl.className = "rune-metric-label";
      labelEl.textContent = labelText;
      roomEl.appendChild(value);
      roomEl.appendChild(labelEl);
      if (bodyText) {
        const bodyEl = document.createElement("div");
        bodyEl.className = "room-body";
        bodyEl.textContent = bodyText;
        roomEl.appendChild(bodyEl);
      }
    },
  },
];

/** @param {string} id */
export function getRoomKind(id) {
  return roomKinds.find((k) => k.id === id) || roomKinds[0];
}

// ─── Floor templates ────────────────────────────────────────────────────
//
// Each template optionally provides a `promptSystem` field — extra system
// instructions appended to the base floor prompt. Use this to specify exact
// layouts (positions, sizes, columns) for structured templates like kanban
// and list. Without this, the LLM defaults to the generic "fill rooms
// left-to-right" placement which doesn't fit structured layouts.

export const floorTemplates = [
  {
    id: "blank",
    label: "Blank floor",
    description: "Whatever the user describes — no preset.",
    starterPrompt: "",
  },
  {
    id: "dashboard",
    label: "Dashboard floor",
    description: "Mix of metric tiles, status tiles, and a couple of text tiles.",
    starterPrompt:
      "A dashboard floor with 6 tiles: 3 metric tiles (req/s, error rate, p99 latency), 2 status tiles (database, api gateway), and 1 text tile summarizing overall health.",
    promptSystem: `Use columns: 6, cell_height: "120px", gap: "14px". Place metric tiles in the top row at positions [0,0], [2,0], [4,0] with size [2,1]. Place status tiles below at [0,1] and [3,1] with size [3,1]. Place the summary text tile at [0,2] with size [6,1].`,
  },
  {
    id: "list",
    label: "List floor",
    description: "Vertical stack of equal-sized tiles.",
    starterPrompt:
      "A list-style floor with 5 equal-sized tiles stacked vertically, each representing a queue item with state class.",
    promptSystem: `Generate 5 rooms — labels, state_class, body content for a vertical list. Don't worry about positions; the floor's layout will be re-stacked into a single column.`,
    postProcess(json) {
      if (!json || !Array.isArray(json.rooms)) return json;
      json.columns = 1;
      json.cell_height = "80px";
      json.gap = "10px";
      json.rooms.forEach((r, i) => { r.position = [0, i]; r.size = [1, 1]; });
      return json;
    },
  },
  {
    id: "kanban",
    label: "Kanban floor",
    description: "3 columns: To do / In progress / Done, with tiles per task.",
    starterPrompt:
      "A kanban-style floor with 3 columns (To do, In progress, Done) and 2-3 task tiles in each column representing project tasks.",
    promptSystem: `THIS IS A 3-COLUMN KANBAN BOARD. STRICT LAYOUT REQUIREMENTS:

floor.columns MUST equal 6.
floor.cell_height MUST equal "100px".
floor.gap MUST equal "12px".

You MUST organize rooms into THREE STATUS GROUPS by adding a "kanban_status" field to each room, with one of these EXACT values:
  "todo", "inprogress", "done"

Generate 6-9 task rooms. Distribute them roughly evenly across the three status groups.
For each room:
  - state_class: "cold" or "idle" if kanban_status is "todo"; "warm" or "hot" if "inprogress"; "warm" if "done"
  - size: [2, 1]
  - position: any [col, row] is fine — our code will re-position rooms into the correct kanban columns based on kanban_status

DO NOT add column-header rooms; the layout is rendered headerless.`,
    /**
     * Post-process kanban output: place rooms into 3 columns based on
     * kanban_status. Ignores LLM-provided positions.
     * @param {any} json
     */
    postProcess(json) {
      if (!json || !Array.isArray(json.rooms)) return json;
      json.columns = 6;
      json.cell_height = "100px";
      json.gap = "12px";

      const cols = { todo: [], inprogress: [], done: [] };

      /**
       * Categorize a room into todo / inprogress / done by:
       *  1. Explicit kanban_status field (any case, "in progress" etc).
       *  2. Label prefix ("To do:", "Dev:", "WIP:", "Done:", etc).
       *  3. state_class hint (cold/idle = todo, fault = inprogress, warm/hot = depends).
       *  4. Position-derived hint (if LLM placed at columns 0, 2, 4).
       *  5. Default: null (unknown — fall through to even-thirds split).
       */
      function classify(r, idx) {
        // 1. kanban_status field
        const ks = (r.kanban_status || "").toString().toLowerCase().replace(/[\s_-]/g, "");
        if (ks === "todo" || ks === "backlog") return "todo";
        if (ks === "inprogress" || ks === "doing" || ks === "wip") return "inprogress";
        if (ks === "done" || ks === "shipped" || ks === "complete" || ks === "completed") return "done";

        // 2. Label prefix
        const label = (r.label || "").toLowerCase();
        if (/^(to ?do|backlog|todo|planned)[\s:.\-]/i.test(label)) return "todo";
        if (/^(in ?progress|doing|wip|dev(eloping)?|active)[\s:.\-]/i.test(label)) return "inprogress";
        if (/^(done|shipped|complete[d]?|finished)[\s:.\-]/i.test(label)) return "done";

        // 3. position-derived hint (LLM tried to honor column positions)
        if (Array.isArray(r.position)) {
          const c = r.position[0];
          if (c === 0 || c === 1) return "todo";
          if (c === 2 || c === 3) return "inprogress";
          if (c === 4 || c === 5) return "done";
        }

        return null;
      }

      const unclassified = [];
      json.rooms.forEach((r, idx) => {
        const bucket = classify(r, idx);
        if (bucket) cols[bucket].push(r);
        else unclassified.push(r);
      });

      // Distribute unclassified rooms across the three columns evenly,
      // preferring smaller columns first.
      while (unclassified.length) {
        const next = unclassified.shift();
        const targets = [
          ["todo", cols.todo.length],
          ["inprogress", cols.inprogress.length],
          ["done", cols.done.length],
        ].sort((a, b) => a[1] - b[1]);
        cols[targets[0][0]].push(next);
      }

      // If somehow ALL went to one bucket and another is empty, redistribute
      // by splitting the largest into thirds.
      const total = cols.todo.length + cols.inprogress.length + cols.done.length;
      if (total >= 3) {
        const buckets = ["todo", "inprogress", "done"];
        const empties = buckets.filter(b => cols[b].length === 0);
        if (empties.length > 0) {
          const all = [...cols.todo, ...cols.inprogress, ...cols.done];
          const per = Math.ceil(all.length / 3);
          cols.todo = all.slice(0, per);
          cols.inprogress = all.slice(per, per * 2);
          cols.done = all.slice(per * 2);
        }
      }

      const placeColumn = (rooms, col) => {
        rooms.forEach((r, i) => {
          r.position = [col, i];
          r.size = [2, 1];
        });
      };
      placeColumn(cols.todo, 0);
      placeColumn(cols.inprogress, 2);
      placeColumn(cols.done, 4);
      json.rooms = [...cols.todo, ...cols.inprogress, ...cols.done];
      return json;
    },
  },
  {
    id: "video-gallery",
    label: "Video gallery",
    description: "Grid of YouTube tiles.",
    starterPrompt:
      "A video gallery floor with 4 YouTube tiles. NOTE: the LLM cannot pick real video IDs — leave video_id empty; the user will fill it in by editing each tile.",
    promptSystem: `Use columns: 6, cell_height: "180px", gap: "14px". Generate 4 rooms with kind: "youtube". Position them in a 2x2 grid: [0,0], [3,0], [0,1], [3,1] each with size [3,1].

IMPORTANT: do not invent video_id values — the user will edit each tile to add the real URL. Set video_id to empty string "".

The label is the video title; body is 1 sentence.`,
  },
];

// ─── Building templates ─────────────────────────────────────────────────

export const buildingTemplates = [
  {
    id: "blank",
    label: "Blank building",
    description: "Whatever the user describes — no preset.",
    starterPrompt: "",
  },
  {
    id: "ops-center",
    label: "Ops center",
    description: "Operations: regions, services, alerts, runbooks.",
    starterPrompt:
      "An operations center building with 3 floors: 'Regions' (status of each datacenter), 'Services' (health of each microservice), 'Alerts' (active issues + runbooks).",
    promptSystem: `Each floor uses columns:6, cell_height:"100px". State classes should reflect operational health: hot for issues, warm for healthy, fault for broken, idle for quiet.`,
  },
  {
    id: "documentation",
    label: "Documentation",
    description: "Spec, API reference, examples, FAQ.",
    starterPrompt:
      "A documentation building with 3 floors: 'Specs' (key spec sections as tiles), 'API' (endpoint reference tiles), 'Examples' (code sample tiles).",
  },
  {
    id: "marketing-site",
    label: "Marketing site",
    description: "Hero, features, testimonials, pricing, CTA.",
    starterPrompt:
      "A marketing site building with 4 floors: 'Hero' (1 large tile + 2 supporting), 'Features' (6 feature tiles), 'Testimonials' (3 quote tiles), 'Pricing' (3 plan tiles).",
  },
  {
    id: "learning-hub",
    label: "Learning hub",
    description: "Courses, lessons, exercises — uses YouTube tiles.",
    starterPrompt:
      "A learning hub building with 2 floors: 'Courses' (4 YouTube video tiles for course intros), 'Exercises' (4 text tiles describing practice problems).",
  },
];

// ─── Campus templates ───────────────────────────────────────────────────

export const campusTemplates = [
  {
    id: "blank",
    label: "Blank campus",
    description: "Whatever the user describes — no preset.",
    starterPrompt: "",
  },
  {
    id: "company",
    label: "Company HQ",
    description: "Engineering, Marketing, Operations buildings.",
    starterPrompt:
      "A company HQ campus with 3 buildings: 'Engineering' (Services, Deploys, Incidents floors), 'Marketing' (Site, Campaigns, Analytics floors), 'Operations' (Costs, Vendors, Compliance floors). Realistic content for a SaaS company.",
  },
  {
    id: "product-suite",
    label: "Product suite",
    description: "One building per product, status floor each.",
    starterPrompt:
      "A product suite campus with 3 buildings, one per product (pick a realistic theme like project management): each building has 2 floors — 'Status' (metric tiles) and 'Roadmap' (text tiles).",
  },
  {
    id: "open-source-project",
    label: "Open source project",
    description: "Repo, Docs, Community buildings.",
    starterPrompt:
      "An open source project campus with 3 buildings: 'Repo' (PRs, Issues, CI floors), 'Docs' (Spec, Examples, API floors), 'Community' (Contributors, Discussions, Releases floors).",
  },
];
