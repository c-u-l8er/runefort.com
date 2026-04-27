// @ts-check
// runtime.js — Settings store, OpenRouter client, prompt templates, generation
// pipeline, and persistence utilities. The "non-element" runtime that powers
// the LLM-authoring side of @runefort/core.
//
// IMPORTANT: API keys live in localStorage (plain text). Any script on the
// page can read them. Disclose this in your settings modal.

import { getRoomKind, floorTemplates, buildingTemplates, campusTemplates } from "./templates.js";

/** @param {{id:string}[]} arr @param {string|undefined} id */
function findTemplate(arr, id) {
  if (!id) return null;
  return arr.find((t) => t.id === id) || null;
}

// ─── Settings store ─────────────────────────────────────────────────────

const KEYS = {
  apiKey: "runefort.openrouter.apiKey",
  model: "runefort.openrouter.model",
  costSpent: "runefort.openrouter.costSpent",
  budgetUsd: "runefort.openrouter.budgetUsd",
};

export const settings = {
  /** @returns {string} */
  get apiKey() {
    return localStorage.getItem(KEYS.apiKey) || "";
  },
  /** @param {string} v */
  set apiKey(v) {
    if (v) localStorage.setItem(KEYS.apiKey, v);
    else localStorage.removeItem(KEYS.apiKey);
  },

  /** @returns {string} */
  get model() {
    return localStorage.getItem(KEYS.model) || "anthropic/claude-sonnet-4";
  },
  /** @param {string} v */
  set model(v) {
    localStorage.setItem(KEYS.model, v);
  },

  /** @returns {number} cost spent in USD this session */
  get costSpent() {
    const raw = localStorage.getItem(KEYS.costSpent);
    return raw ? parseFloat(raw) : 0;
  },
  /** @param {number} v */
  set costSpent(v) {
    localStorage.setItem(KEYS.costSpent, String(v));
  },
  addCost(usd) {
    this.costSpent = this.costSpent + usd;
  },

  /** @returns {number} budget cap in USD (0 = no limit) */
  get budgetUsd() {
    const raw = localStorage.getItem(KEYS.budgetUsd);
    return raw ? parseFloat(raw) : 5.0; // default $5 cap
  },
  /** @param {number} v */
  set budgetUsd(v) {
    localStorage.setItem(KEYS.budgetUsd, String(v));
  },

  resetCost() {
    localStorage.setItem(KEYS.costSpent, "0");
  },
};

// ─── OpenRouter client ──────────────────────────────────────────────────

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Recommended models — subset shown in the settings dropdown.
 * Pricing approximate per 1M input/output tokens.
 */
export const RECOMMENDED_MODELS = [
  { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4 (recommended)", input: 3.0, output: 15.0 },
  { id: "anthropic/claude-haiku-4-5", label: "Claude Haiku 4.5", input: 1.0, output: 5.0 },
  { id: "openai/gpt-4o", label: "GPT-4o", input: 2.5, output: 10.0 },
  { id: "openai/gpt-4o-mini", label: "GPT-4o-mini", input: 0.15, output: 0.6 },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", input: 0.075, output: 0.3 },
];

/**
 * @typedef {Object} ChatMessage
 * @property {"system" | "user" | "assistant"} role
 * @property {string} content
 */

/**
 * Call OpenRouter's chat completions API.
 * @param {Object} opts
 * @param {ChatMessage[]} opts.messages
 * @param {string} [opts.model]
 * @param {number} [opts.maxTokens]
 * @param {number} [opts.temperature]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{ content: string, usage: any, model: string, costUsd: number }>}
 */
export async function chat({ messages, model, maxTokens = 1500, temperature = 0.7, signal }) {
  const apiKey = settings.apiKey;
  if (!apiKey) {
    throw new Error("OpenRouter API key not set. Open Settings to configure.");
  }
  const m = model || settings.model;
  if (settings.budgetUsd > 0 && settings.costSpent >= settings.budgetUsd) {
    throw new Error(`Budget cap reached ($${settings.budgetUsd.toFixed(2)}). Reset in Settings.`);
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "Runefort",
    },
    body: JSON.stringify({
      model: m,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  const usage = data.usage || {};

  // Cost estimation (rough — based on RECOMMENDED_MODELS table)
  const modelInfo = RECOMMENDED_MODELS.find(rm => rm.id === m);
  const inputCost = ((usage.prompt_tokens || 0) / 1_000_000) * (modelInfo?.input || 0);
  const outputCost = ((usage.completion_tokens || 0) / 1_000_000) * (modelInfo?.output || 0);
  const costUsd = inputCost + outputCost;
  settings.addCost(costUsd);

  return { content, usage, model: m, costUsd };
}

// ─── Prompt templates ───────────────────────────────────────────────────

const SYSTEM_BASE = `You are a layout assistant for Runefort, a CSS-grid-based UI framework.
Output ONLY valid JSON when asked. No prose, no markdown code fences, no explanations
before or after the JSON. The first character of your response must be { or [.`;

/**
 * Build a prompt for generating a single room.
 * @param {Object} ctx
 * @param {{ id: string, position: number[], size: number[] }[]} ctx.existingRooms
 * @param {number} ctx.gridColumns
 * @param {string} ctx.userPrompt
 * @param {string} [ctx.kind] — room kind id (text, youtube, ampersand, metric)
 * @returns {ChatMessage[]}
 */
export function promptAddRoom(ctx) {
  const occupied = ctx.existingRooms.map(
    (r) => `${r.id}@(${r.position[0]},${r.position[1]})+(${r.size[0]}x${r.size[1]})`
  ).join(", ");
  const kind = getRoomKind(ctx.kind || "text");
  const defaultSize = kind.defaultSize || [2, 1];
  return [
    {
      role: "system",
      content: `${SYSTEM_BASE}

Generate a single Runefort room. Return JSON with this base shape:
{
  "id": "kebab-case-unique-id",
  "label": "Display name (short)",
  "position": [col, row],
  "size": [colspan, rowspan],
  "state_class": "cold" | "warm" | "hot" | "fault" | "idle",
  "body": "1-2 sentences"
}

Constraints:
- Grid is ${ctx.gridColumns} columns wide. Position [col, row] is 0-indexed top-left.
- Default size for this kind is [${defaultSize[0]},${defaultSize[1]}]. Adjust if appropriate.
- The new room MUST NOT overlap existing rooms: ${occupied || "(none)"}
- state_class meanings: hot=urgent/active, warm=healthy, cold=normal/quiet, fault=broken, idle=on-call.

Kind: ${kind.id}
${kind.promptSystem || ""}`,
    },
    { role: "user", content: ctx.userPrompt },
  ];
}

/**
 * Build a prompt for generating a single floor with N rooms.
 * @param {Object} ctx
 * @param {{ id: string, label?: string }[]} ctx.existingFloors
 * @param {string} ctx.userPrompt
 * @param {string} [ctx.template]  floor template id (kanban, dashboard, list, ...)
 * @returns {ChatMessage[]}
 */
export function promptAddFloor(ctx) {
  const existing = ctx.existingFloors.map(f => f.id).join(", ");
  const tpl = findTemplate(floorTemplates, ctx.template);
  return [
    {
      role: "system",
      content: `${SYSTEM_BASE}

Generate a Runefort floor with several rooms. Return JSON with this shape:
{
  "id": "kebab-case-unique-id",
  "label": "Display name (short)",
  "data_level": "L1" | "L2" | "L3" | ...,
  "columns": int,
  "cell_height": "100px" | "120px",
  "gap": "12px" | "14px",
  "rooms": [
    { "id", "label", "position": [col,row], "size": [w,h], "state_class": "cold|warm|hot|fault|idle", "body" },
    ...
  ]
}

Constraints:
- Rooms MUST NOT overlap.
- All ids unique within the floor.
- Floor id MUST NOT collide with existing floors: ${existing || "(none)"}
- Pick state_class semantically; vary across rooms.

${tpl?.promptSystem ? `Template: ${tpl.id}\n${tpl.promptSystem}` : `Default placement: left-to-right, top-to-bottom in 3-8 tiles.`}`,
    },
    { role: "user", content: ctx.userPrompt },
  ];
}

/**
 * Build a prompt for generating a building with N floors (each with rooms).
 * @param {Object} ctx
 * @param {{ id: string, label?: string }[]} ctx.existingBuildings
 * @param {string} ctx.userPrompt
 * @param {string} [ctx.template]  building template id
 * @returns {ChatMessage[]}
 */
export function promptAddBuilding(ctx) {
  const existing = ctx.existingBuildings.map(b => b.id).join(", ");
  const tpl = findTemplate(buildingTemplates, ctx.template);
  return [
    {
      role: "system",
      content: `${SYSTEM_BASE}

Generate a Runefort building with multiple floors. Return JSON:
{
  "id": "kebab-case-unique-id",
  "label": "Display name",
  "floors": [
    {
      "id", "label",
      "data_level": "L1",
      "columns": int, "cell_height": "100px", "gap": "12px",
      "rooms": [ { "id", "label", "position", "size", "state_class", "body" }, ... ]
    },
    ...
  ]
}

Constraints:
- 2 to 4 floors. Each floor has 3 to 6 rooms.
- Floors get data_level L1, L2, L3 in order.
- Building id MUST NOT collide with existing: ${existing || "(none)"}
- All ids (building, floors, rooms) globally unique within the building.

${tpl?.promptSystem ? `Template: ${tpl.id}\n${tpl.promptSystem}` : ""}`,
    },
    { role: "user", content: ctx.userPrompt },
  ];
}

/**
 * Build a prompt for generating a full campus with N buildings.
 * @param {Object} ctx
 * @param {{ id: string, label?: string }[]} ctx.existingCampuses
 * @param {string} ctx.userPrompt
 * @param {string} [ctx.template] campus template id
 * @returns {ChatMessage[]}
 */
export function promptAddCampus(ctx) {
  const existing = ctx.existingCampuses.map(c => c.id).join(", ");
  const tpl = findTemplate(campusTemplates, ctx.template);
  return [
    {
      role: "system",
      content: `${SYSTEM_BASE}

Generate a Runefort campus with multiple buildings, floors, and rooms. Return JSON with shape: { id, label, buildings:[{ id, label, floors:[{ id, label, data_level, columns, cell_height, gap, rooms:[ ... ] }] }] }.

Constraints:
- 2 to 3 buildings, 2 to 3 floors per building, 3 to 5 rooms per floor.
- Campus id MUST NOT collide: ${existing || "(none)"}
- ALL ids globally unique within the campus.
- Within EACH building, floors get distinct data_level values "L1", "L2", "L3" in display order. Do NOT repeat "L1" across floors of the same building.
- cell_height MUST be in the form "<n>px" (e.g. "140px"). Never use "auto" or empty.
- gap MUST be in the form "<n>px" (e.g. "14px").
- Room positions MUST NOT overlap. Pack rooms left-to-right, top-to-bottom.

${tpl?.promptSystem ? `Template: ${tpl.id}\n${tpl.promptSystem}` : ""}`,
    },
    { role: "user", content: ctx.userPrompt },
  ];
}

/**
 * Refine an existing room based on follow-up feedback. The prior thread is
 * provided so the LLM has context.
 * @param {Object} ctx
 * @param {Object} ctx.room  Current room JSON shape
 * @param {ChatMessage[]} ctx.history
 * @param {string} ctx.userPrompt
 * @returns {ChatMessage[]}
 */
export function promptRefineRoom(ctx) {
  return [
    {
      role: "system",
      content: `${SYSTEM_BASE}

You are refining an existing Runefort room based on user feedback. Return JSON
with the same shape as before:
{ "id", "label", "position", "size", "state_class", "body" }

Keep the id and position the same unless the user asks to move it. Update
label, body, size, and state_class as the user requests.

Current room: ${JSON.stringify(ctx.room)}`,
    },
    ...ctx.history,
    { role: "user", content: ctx.userPrompt },
  ];
}

// ─── Output validation ─────────────────────────────────────────────────

/**
 * Try to extract a JSON object/array from LLM output. Strips markdown fences,
 * leading prose, etc. Returns null on failure.
 * @param {string} raw
 * @returns {any | null}
 */
export function extractJson(raw) {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim();
  // Strip markdown fences (opening fence — closing may not exist if truncated)
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  // Find first { or [
  const start = s.search(/[{[]/);
  if (start === -1) return null;

  const fromStart = s.slice(start);
  const lastBrace = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (lastBrace !== -1) {
    const slice = s.slice(start, lastBrace + 1);
    try { return JSON.parse(slice); } catch (_) { /* fall through to repair */ }
  }

  // Repair attempt for truncated output (common when maxTokens is hit
  // mid-response). Walks the string tracking open braces/brackets/quotes,
  // then back-tracks to a "safe" boundary (after the last complete value)
  // and appends the missing closers.
  return repairAndParseTruncatedJson(fromStart);
}

/**
 * Best-effort recovery from a JSON string that was truncated mid-output.
 * Strategy: walk once to find the latest position where the parse stack
 * was at a "clean" boundary (just after a complete value at depth ≥ 1),
 * then close the remaining brackets in the right order.
 *
 * @param {string} s
 * @returns {any | null}
 */
function repairAndParseTruncatedJson(s) {
  /** @type {("}"|"]")[]} */
  let stack = [];
  let inString = false;
  let esc = false;
  // Track the last "safe" cut point — index AFTER the character at which
  // the current scope just finished a complete value (string close, number
  // end, true/false/null end, object/array close). At a safe cut, we can
  // truncate the input here, drop any pending comma, and close outstanding
  // brackets.
  let safeEnd = -1;
  /** @type {("}"|"]")[]} */
  let safeStack = [];

  const recordSafeAfterValue = (i, currentStack) => {
    safeEnd = i + 1;
    safeStack = currentStack.slice();
  };

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (esc) { esc = false; continue; }
      if (c === "\\") { esc = true; continue; }
      if (c === '"') {
        inString = false;
        // A string close is a value-position only if the next non-whitespace
        // char is a comma, `}`, or `]` (i.e. NOT a colon — that would mean
        // the string was an object key). Peek ahead to disambiguate.
        if (stack.length > 0) {
          let j = i + 1;
          while (j < s.length && /\s/.test(s[j])) j++;
          const next = s[j];
          if (next === "," || next === "}" || next === "]") {
            recordSafeAfterValue(i, stack);
          }
        }
      }
      continue;
    }
    if (c === '"') { inString = true; continue; }
    if (c === "{") { stack.push("}"); continue; }
    if (c === "[") { stack.push("]"); continue; }
    if (c === "}" || c === "]") {
      stack.pop();
      if (stack.length > 0) recordSafeAfterValue(i, stack);
      else if (stack.length === 0) {
        // Top-level close — try parsing what we have so far directly.
        try { return JSON.parse(s.slice(0, i + 1)); } catch (_) { /* keep walking */ }
      }
      continue;
    }
    // Bare token (number / true / false / null) — only recognize when at
    // a value position. Cheap heuristic: a digit, t, f, n following a
    // colon-or-comma-or-array-open within the current scope.
    if (/[\d\-tfn]/.test(c) && stack.length > 0) {
      // Skip ahead past the bare value.
      const m = s.slice(i).match(/^(?:-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?|true|false|null)/);
      if (m) {
        i += m[0].length - 1;
        recordSafeAfterValue(i, stack);
        continue;
      }
    }
  }

  if (safeEnd === -1) return null;

  // Build a candidate by truncating at safeEnd, stripping any dangling
  // comma, and appending closers from the safeStack in reverse order.
  let candidate = s.slice(0, safeEnd);
  candidate = candidate.replace(/,\s*$/, "");  // strip pending comma
  for (let i = safeStack.length - 1; i >= 0; i--) candidate += safeStack[i];
  try { return JSON.parse(candidate); } catch (_) { return null; }
}

/**
 * Validate a generated room object. Returns { valid, errors }.
 * @param {any} room
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateRoom(room) {
  const errors = [];
  if (!room || typeof room !== "object") return { valid: false, errors: ["not an object"] };
  if (!room.id || typeof room.id !== "string") errors.push("missing/invalid id");
  if (!Array.isArray(room.position) || room.position.length !== 2) errors.push("position must be [col, row]");
  if (!Array.isArray(room.size) || room.size.length !== 2) errors.push("size must be [w, h]");
  if (room.state_class && !["cold", "warm", "hot", "fault", "idle"].includes(room.state_class)) {
    errors.push("state_class must be one of: cold, warm, hot, fault, idle");
  }
  return { valid: errors.length === 0, errors };
}

// ─── Generation pipeline ────────────────────────────────────────────────

/**
 * High-level: take a floor element + user prompt, produce a new <rune-room>
 * appended to it. Returns the created room or throws.
 * @param {HTMLElement} floor
 * @param {string} userPrompt
 * @param {Object} [opts]
 * @param {string} [opts.kind] room kind id (text, youtube, ampersand, metric)
 * @returns {Promise<{ room: HTMLElement, json: any, usage: any, costUsd: number }>}
 */
export async function generateRoomFor(floor, userPrompt, opts = {}) {
  const existingRooms = Array.from(floor.querySelectorAll(":scope > rune-room")).map((el) => {
    const r = /** @type {any} */ (el);
    return {
      id: r.id || r.roomId,
      position: r.position || [0, 0],
      size: r.size || [1, 1],
    };
  });
  const messages = promptAddRoom({
    existingRooms,
    gridColumns: parseInt(floor.getAttribute("columns") || "12", 10),
    userPrompt,
    kind: opts.kind,
  });
  const result = await chat({ messages });
  const json = extractJson(result.content);
  if (!json) throw new Error(`LLM did not return valid JSON. Raw: ${result.content.slice(0, 200)}`);
  const v = validateRoom(json);
  if (!v.valid) throw new Error(`Generated room invalid: ${v.errors.join(", ")}`);
  // If user provided a videoId for youtube kind, use it instead of the LLM's
  if (opts.videoId && (json.kind === "youtube" || opts.kind === "youtube")) {
    json.kind = "youtube";
    json.video_id = opts.videoId;
  }
  const columns = parseInt(floor.getAttribute("columns") || "12", 10);
  const roomEl = roomFromJson(json, { existingRooms, columns });
  floor.appendChild(roomEl);
  // Persist the thread + entity for reload-survival
  threadStore.append(json.id, [
    { role: "user", content: userPrompt, ts: Date.now() },
    { role: "assistant", content: result.content, ts: Date.now() },
  ]);
  // Use the position/size from roomFromJson's auto-relocation (in case LLM
  // returned bad positions). Read back from the element.
  const finalPos = (roomEl.getAttribute("position") || "0,0").split(",").map(Number);
  const finalSize = (roomEl.getAttribute("size") || "1,1").split(",").map(Number);
  const finalJson = { ...json, position: finalPos, size: finalSize };
  entityStore.put(json.id, "room", floor.id || null, finalJson);
  return { room: roomEl, json: finalJson, usage: result.usage, costUsd: result.costUsd };
}

/**
 * Refine a room based on user feedback. Updates the room in-place.
 * @param {HTMLElement} room
 * @param {string} userPrompt
 */
export async function refineRoom(room, userPrompt) {
  const r = /** @type {any} */ (room);
  const currentJson = {
    id: r.id || r.roomId,
    label: r.label,
    position: r.position,
    size: r.size,
    state_class: r.stateClass,
    body: room.querySelector(".room-body")?.textContent || "",
  };
  const history = threadStore.get(currentJson.id).map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const messages = promptRefineRoom({ room: currentJson, history, userPrompt });
  const result = await chat({ messages });
  const json = extractJson(result.content);
  if (!json) throw new Error(`LLM did not return valid JSON. Raw: ${result.content.slice(0, 200)}`);
  const v = validateRoom(json);
  if (!v.valid) throw new Error(`Refined room invalid: ${v.errors.join(", ")}`);

  // Mutate the existing room in place
  if (json.label) room.setAttribute("label", json.label);
  if (Array.isArray(json.size)) room.setAttribute("size", `${json.size[0]},${json.size[1]}`);
  if (json.state_class) room.setAttribute("state-class", json.state_class);
  if (json.body) {
    let body = room.querySelector(".room-body");
    if (!body) {
      body = document.createElement("div");
      body.className = "room-body";
      room.appendChild(body);
    }
    body.textContent = json.body;
  }
  if (json.label) {
    let strong = room.querySelector("strong");
    if (!strong) {
      strong = document.createElement("strong");
      room.insertBefore(strong, room.firstChild);
    }
    strong.textContent = json.label;
  }

  threadStore.append(currentJson.id, [
    { role: "user", content: userPrompt, ts: Date.now() },
    { role: "assistant", content: result.content, ts: Date.now() },
  ]);
  return { json, usage: result.usage, costUsd: result.costUsd };
}

/**
 * Generate a new floor inside an existing building.
 * @param {HTMLElement} building
 * @param {string} userPrompt
 * @param {Object} [opts]
 * @param {string} [opts.template]  floor template id (kanban, dashboard, list, ...)
 */
export async function generateFloorFor(building, userPrompt, opts = {}) {
  const existingFloors = Array.from(building.querySelectorAll(":scope > rune-floor")).map(f => ({
    id: f.id,
    label: f.getAttribute("label") || f.id,
  }));
  const messages = promptAddFloor({ existingFloors, userPrompt, template: opts.template });
  // 2500 covers floors with 6-12 rooms; default of 1500 truncated dense floors.
  const result = await chat({ messages, maxTokens: 2500 });
  let json = extractJson(result.content);
  if (!json || !json.id) {
    const looksTruncated = result.content.length > 1200 && !/[}\]]\s*$/.test(result.content);
    const hint = looksTruncated ? "\n\n(Response appears truncated — try a smaller scope.)" : "";
    throw new Error(`LLM did not return valid floor JSON. Raw: ${result.content.slice(0, 200)}…${hint}`);
  }
  if (!Array.isArray(json.rooms)) throw new Error(`Floor missing "rooms" array. Raw: ${result.content.slice(0, 200)}`);

  // Post-process: prefer caller-supplied postProcess (avoids stale-module-
  // cache issues with the bundled templates), fall back to template lookup.
  const tpl = findTemplate(floorTemplates, opts.template);
  const post = typeof opts.postProcess === "function" ? opts.postProcess : tpl?.postProcess;
  if (post) {
    try { json = post(json) || json; } catch (e) { console.warn("template postProcess failed", e); }
  }

  const floorEl = floorFromJson(json);
  building.appendChild(floorEl);
  threadStore.append(json.id, [
    { role: "user", content: userPrompt, ts: Date.now() },
    { role: "assistant", content: result.content, ts: Date.now() },
  ]);
  entityStore.put(json.id, "floor", building.id || null, json);
  return { floor: floorEl, json, usage: result.usage, costUsd: result.costUsd };
}

/**
 * Generate a new building inside an existing campus.
 * @param {HTMLElement} campus
 * @param {string} userPrompt
 * @param {Object} [opts]
 * @param {string} [opts.template]  building template id
 */
export async function generateBuildingFor(campus, userPrompt, opts = {}) {
  const existingBuildings = Array.from(campus.querySelectorAll(":scope > rune-building")).map(b => ({
    id: b.id,
    label: b.getAttribute("label") || b.id,
  }));
  const messages = promptAddBuilding({ existingBuildings, userPrompt, template: opts.template });
  // Buildings = floors × rooms. 5000 tokens is comfortable for 3-5 floors.
  const result = await chat({ messages, maxTokens: 5000 });
  const json = extractJson(result.content);
  if (!json || !json.id) {
    const looksTruncated = result.content.length > 1500 && !/[}\]]\s*$/.test(result.content);
    const hint = looksTruncated ? "\n\n(Response appears truncated — try a smaller scope.)" : "";
    throw new Error(`LLM did not return valid building JSON. Raw: ${result.content.slice(0, 200)}…${hint}`);
  }
  if (!Array.isArray(json.floors)) throw new Error(`Building missing "floors" array. Raw: ${result.content.slice(0, 200)}`);
  const buildingEl = buildingFromJson(json);
  campus.appendChild(buildingEl);
  threadStore.append(json.id, [
    { role: "user", content: userPrompt, ts: Date.now() },
    { role: "assistant", content: result.content, ts: Date.now() },
  ]);
  entityStore.put(json.id, "building", campus.id || null, json);
  return { building: buildingEl, json, usage: result.usage, costUsd: result.costUsd };
}

/**
 * Generate a new campus, appended to a host element (typically <body> or
 * a wrapper). Existing campuses are read from the document.
 * @param {HTMLElement} host
 * @param {string} userPrompt
 * @param {Object} [opts]
 * @param {string} [opts.template]  campus template id
 */
export async function generateCampusFor(host, userPrompt, opts = {}) {
  const existingCampuses = Array.from(document.querySelectorAll("rune-campus")).map(c => ({
    id: c.id,
    label: c.getAttribute("label") || c.id,
  }));
  const messages = promptAddCampus({ existingCampuses, userPrompt, template: opts.template });
  // Campuses are large (multiple buildings × multiple floors × multiple
  // rooms). 8000 tokens covers all reasonable cases without truncating mid-JSON.
  const result = await chat({ messages, maxTokens: 16000 });
  const json = extractJson(result.content);
  if (!json || !json.id) {
    const looksTruncated = result.content.length > 2000 && !/[}\]]\s*$/.test(result.content);
    const hint = looksTruncated
      ? "\n\n(Response appears truncated — try a smaller scope, or set a model with higher max_output_tokens.)"
      : "";
    throw new Error(
      `LLM did not return valid campus JSON. Raw: ${result.content.slice(0, 200)}…${hint}`
    );
  }
  if (!Array.isArray(json.buildings)) throw new Error(`Campus missing "buildings" array. Raw: ${result.content.slice(0, 200)}`);
  const campusEl = campusFromJson(json);
  host.appendChild(campusEl);
  threadStore.append(json.id, [
    { role: "user", content: userPrompt, ts: Date.now() },
    { role: "assistant", content: result.content, ts: Date.now() },
  ]);
  // Top-level campus has no parent
  entityStore.put(json.id, "campus", null, json);
  return { campus: campusEl, json, usage: result.usage, costUsd: result.costUsd };
}

/**
 * Coerce LLM-returned position/size shapes into a valid [col, row] tuple.
 * Accepts:
 *   [col, row]          — array
 *   { col, row }        — object with col/row keys
 *   { x, y }            — object with x/y keys
 *   "col,row"           — comma string
 *   single value        — invalid, returns fallback
 * @param {any} v
 * @param {[number, number]} fallback
 * @returns {[number, number]}
 */
function coerceTuple(v, fallback) {
  if (Array.isArray(v) && v.length >= 2) {
    const a = parseInt(v[0], 10);
    const b = parseInt(v[1], 10);
    if (!Number.isNaN(a) && !Number.isNaN(b)) return [a, b];
  }
  if (v && typeof v === "object") {
    const a = parseInt(v.col ?? v.x ?? v[0], 10);
    const b = parseInt(v.row ?? v.y ?? v[1], 10);
    if (!Number.isNaN(a) && !Number.isNaN(b)) return [a, b];
  }
  if (typeof v === "string" && v.includes(",")) {
    const [a, b] = v.split(",").map((s) => parseInt(s.trim(), 10));
    if (!Number.isNaN(a) && !Number.isNaN(b)) return [a, b];
  }
  return fallback;
}

/**
 * Find the next free grid slot given existing room placements.
 * @param {{ position: [number, number], size: [number, number] }[]} existing
 * @param {number} columns
 * @param {[number, number]} sizeNeeded
 * @returns {[number, number]}
 */
function findFreeSlot(existing, columns, sizeNeeded) {
  const [w, h] = sizeNeeded;
  const occupied = new Set();
  for (const r of existing) {
    const [c, ro] = r.position;
    const [rw, rh] = r.size;
    for (let y = ro; y < ro + rh; y++) {
      for (let x = c; x < c + rw; x++) {
        occupied.add(`${x},${y}`);
      }
    }
  }
  // Search row by row for a free WxH block that fits within columns
  for (let row = 0; row < 100; row++) {
    for (let col = 0; col + w <= columns; col++) {
      let free = true;
      for (let y = row; y < row + h && free; y++) {
        for (let x = col; x < col + w && free; x++) {
          if (occupied.has(`${x},${y}`)) free = false;
        }
      }
      if (free) return [col, row];
    }
  }
  return [0, 0];
}

/**
 * Build a <rune-room> element from a JSON object.
 * @param {any} json
 * @param {Object} [opts]
 * @param {{ position: [number, number], size: [number, number] }[]} [opts.existingRooms] — when provided, bad/overlapping positions get auto-corrected
 * @param {number} [opts.columns]
 * @returns {HTMLElement}
 */
export function roomFromJson(json, opts = {}) {
  const el = document.createElement("rune-room");
  el.id = json.id || `room-${Date.now()}`;

  let size = coerceTuple(json.size, [1, 1]);
  // Clamp size to reasonable bounds
  if (size[0] < 1) size[0] = 1;
  if (size[1] < 1) size[1] = 1;

  let position = coerceTuple(json.position, /** @type {[number, number]} */ ([NaN, NaN]));
  // If position invalid OR overlaps existing OR exceeds columns, find next free slot
  const cols = opts.columns || 12;
  const existing = opts.existingRooms || [];
  const isInvalid = Number.isNaN(position[0]) || Number.isNaN(position[1]) || position[0] + size[0] > cols;
  let needsRelocate = isInvalid;
  if (!needsRelocate && existing.length > 0) {
    // Check overlap
    const occupied = new Set();
    for (const r of existing) {
      for (let y = r.position[1]; y < r.position[1] + r.size[1]; y++) {
        for (let x = r.position[0]; x < r.position[0] + r.size[0]; x++) {
          occupied.add(`${x},${y}`);
        }
      }
    }
    for (let y = position[1]; y < position[1] + size[1] && !needsRelocate; y++) {
      for (let x = position[0]; x < position[0] + size[0] && !needsRelocate; x++) {
        if (occupied.has(`${x},${y}`)) needsRelocate = true;
      }
    }
  }
  if (needsRelocate) {
    position = findFreeSlot(existing, cols, size);
  }

  el.setAttribute("position", `${position[0]},${position[1]}`);
  el.setAttribute("size", `${size[0]},${size[1]}`);
  if (json.label) el.setAttribute("label", json.label);
  if (json.state_class) el.setAttribute("state-class", json.state_class);
  el.dataset.runefortGenerated = "true";

  // Stash the full JSON on the element so detail views can show it
  try {
    el.dataset.runefortJson = JSON.stringify(json);
  } catch (_) {}

  // Default content (text kind). Kind-specific renderHook can replace it below.
  const strong = document.createElement("strong");
  strong.textContent = json.label || json.id;
  el.appendChild(strong);
  if (json.body) {
    const body = document.createElement("div");
    body.className = "room-body";
    body.textContent = json.body;
    el.appendChild(body);
  }

  // Apply kind-specific render hook (youtube, ampersand, metric, ...)
  if (json.kind) {
    el.setAttribute("data-kind", json.kind);
    const kind = getRoomKind(json.kind);
    if (kind.renderHook) {
      try {
        kind.renderHook(el, json);
      } catch (e) {
        console.warn("renderHook failed for kind", json.kind, e);
      }
    }
  }
  return el;
}

/**
 * Build a <rune-floor> element from JSON (with child rooms).
 * Auto-resolves room positions to avoid overlaps, even when LLM returns bad
 * placements.
 * @param {any} json
 * @returns {HTMLElement}
 */
export function floorFromJson(json) {
  const el = document.createElement("rune-floor");
  el.id = json.id;
  if (json.label) el.setAttribute("label", json.label);
  if (json.data_level) el.setAttribute("data-level", json.data_level);
  const columns = parseInt(json.columns, 10) || 6;
  el.setAttribute("columns", String(columns));
  // Apply sensible defaults so LLM-generated floors that omit cell_height /
  // gap render with the same breathing room as hand-authored ones (matches
  // forts/welcome.json conventions). The default rune-floor gap of 8px is
  // too tight for tiles with multi-line body content. Reject non-pixel
  // values (e.g. "auto", empty string) — those make grid-auto-rows
  // content-sized which causes inconsistent row heights and apparent
  // vertical room overlap.
  const validPx = /^\d+(\.\d+)?(px|rem|em)$/i;
  el.setAttribute("cell-height", validPx.test(json.cell_height || "") ? json.cell_height : "140px");
  el.setAttribute("gap", validPx.test(json.gap || "") ? json.gap : "14px");
  el.dataset.runefortGenerated = "true";

  /** @type {{ position: [number, number], size: [number, number] }[]} */
  const placed = [];
  for (const r of json.rooms || []) {
    const roomEl = roomFromJson(r, { existingRooms: placed, columns });
    // Read back the (possibly relocated) position and size for the next iteration
    const pos = roomEl.getAttribute("position")?.split(",").map(Number) || [0, 0];
    const sz = roomEl.getAttribute("size")?.split(",").map(Number) || [1, 1];
    placed.push({
      position: /** @type {[number, number]} */ ([pos[0], pos[1]]),
      size: /** @type {[number, number]} */ ([sz[0], sz[1]]),
    });
    el.appendChild(roomEl);
  }
  return el;
}

/**
 * Build a <rune-building> element from JSON (with floors and rooms inside).
 * Includes a sub-marquee + elevator for navigation.
 * @param {any} json
 * @returns {HTMLElement}
 */
export function buildingFromJson(json) {
  const el = document.createElement("rune-building");
  el.id = json.id;
  if (json.label) el.setAttribute("label", json.label);
  el.dataset.runefortGenerated = "true";

  // Sub-marquee with floor switcher? No — elevator does that.
  // Building-level marquee for switching to sibling buildings:
  const subMarquee = document.createElement("rune-marquee");
  subMarquee.setAttribute("scope", "building");
  subMarquee.setAttribute("data-variant", "sub");
  // Auto-generation will fill it (see updated rune-marquee.js)
  el.appendChild(subMarquee);

  // Elevator for floors
  const elevator = document.createElement("rune-elevator");
  el.appendChild(elevator);

  // Floors. Auto-assign data_level by index when the LLM omitted it or gave
  // duplicates (a common failure mode — every floor ends up labelled "L1"
  // in the elevator). The user-visible level always reflects the sequence
  // within this building.
  const floorJsonList = json.floors || [];
  const seenLevels = new Set();
  for (let i = 0; i < floorJsonList.length; i++) {
    const f = { ...floorJsonList[i] };
    const desired = `L${i + 1}`;
    if (!f.data_level || seenLevels.has(f.data_level)) f.data_level = desired;
    seenLevels.add(f.data_level);
    const floorEl = floorFromJson(f);
    el.appendChild(floorEl);
  }
  return el;
}

/**
 * Build a <rune-campus> element from JSON (full hierarchy).
 * @param {any} json
 * @returns {HTMLElement}
 */
export function campusFromJson(json) {
  const el = document.createElement("rune-campus");
  el.id = json.id;
  if (json.label) el.setAttribute("label", json.label);
  el.dataset.runefortGenerated = "true";

  for (const b of json.buildings || []) {
    const buildingEl = buildingFromJson(b);
    el.appendChild(buildingEl);
  }
  return el;
}

// ─── Thread store ──────────────────────────────────────────────────────

/**
 * @typedef {Object} ThreadMessage
 * @property {"user" | "assistant" | "system"} role
 * @property {string} content
 * @property {number} ts
 * @property {string} [parentId]
 * @property {string} [id]
 */

// ─── Multi-fort persistence ─────────────────────────────────────────────
//
// localStorage layout:
//   runefort.fortRegistry        JSON map { id → { title, vocabulary, createdAt, updatedAt, cloudId? } }
//   runefort.activeFortId        string — currently-edited fort id
//   runefort.fort.{id}.entities  per-fort entity snapshots (was runefort.entities)
//   runefort.fort.{id}.threads   per-fort refinement threads (was runefort.threads)
//
// Legacy keys (pre-multi-fort) are imported on first load and then deleted.

const FORT_KEYS = {
  registry: "runefort.fortRegistry",
  active:   "runefort.activeFortId",
  /** @param {string} fortId */
  entities: (fortId) => `runefort.fort.${fortId}.entities`,
  /** @param {string} fortId */
  threads:  (fortId) => `runefort.fort.${fortId}.threads`,
};

const LEGACY_ENTITY_KEY = "runefort.entities";
const LEGACY_THREAD_KEY = "runefort.threads";

/**
 * @typedef {Object} FortMeta
 * @property {string} id
 * @property {string} title
 * @property {string} vocabulary
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} [cloudId]   server-side rune.forts.id once synced
 * @property {number} [cloudVersion] last-synced rune.forts.version
 */

/**
 * Fort registry — tracks which forts exist locally, which is active, and
 * handles legacy data migration.
 */
export const fortStore = {
  /** @returns {Record<string, FortMeta>} */
  _readRegistry() {
    try {
      return JSON.parse(localStorage.getItem(FORT_KEYS.registry) || "{}");
    } catch (_) { return {}; }
  },
  /** @param {Record<string, FortMeta>} reg */
  _writeRegistry(reg) {
    localStorage.setItem(FORT_KEYS.registry, JSON.stringify(reg));
  },

  /** @returns {FortMeta[]} sorted most-recently-updated first */
  list() {
    const reg = this._readRegistry();
    return Object.values(reg).sort((a, b) => b.updatedAt - a.updatedAt);
  },

  /** @param {string} id @returns {FortMeta|null} */
  get(id) {
    return this._readRegistry()[id] || null;
  },

  /**
   * @param {{ title?: string, vocabulary?: string, id?: string }} [opts]
   * @returns {FortMeta}
   */
  create(opts = {}) {
    const id = opts.id || `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();
    const meta = {
      id,
      title: opts.title || "Untitled fort",
      vocabulary: opts.vocabulary || "core",
      createdAt: now,
      updatedAt: now,
    };
    const reg = this._readRegistry();
    reg[id] = meta;
    this._writeRegistry(reg);
    return meta;
  },

  /** @param {string} id @param {Partial<FortMeta>} patch */
  update(id, patch) {
    const reg = this._readRegistry();
    if (!reg[id]) return null;
    reg[id] = { ...reg[id], ...patch, updatedAt: Date.now() };
    this._writeRegistry(reg);
    return reg[id];
  },

  /** @param {string} id */
  delete(id) {
    const reg = this._readRegistry();
    delete reg[id];
    this._writeRegistry(reg);
    localStorage.removeItem(FORT_KEYS.entities(id));
    localStorage.removeItem(FORT_KEYS.threads(id));
    if (this.getActiveId() === id) {
      // Pick another fort if available, otherwise clear active.
      const next = this.list()[0];
      if (next) this.setActiveId(next.id);
      else localStorage.removeItem(FORT_KEYS.active);
    }
  },

  /** @returns {string|null} */
  getActiveId() {
    return localStorage.getItem(FORT_KEYS.active);
  },

  /** @param {string} id */
  setActiveId(id) {
    if (!this._readRegistry()[id]) {
      throw new Error(`fortStore.setActiveId: unknown fort ${id}`);
    }
    localStorage.setItem(FORT_KEYS.active, id);
  },

  /**
   * Idempotent: returns the active fort id, creating one (or migrating legacy
   * data) if none exists. Safe to call from any read/write path.
   * @returns {string}
   */
  ensureActive() {
    let id = this.getActiveId();
    if (id && this._readRegistry()[id]) return id;

    // Migrate legacy single-fort data, if present.
    const legacyEntities = localStorage.getItem(LEGACY_ENTITY_KEY);
    const legacyThreads  = localStorage.getItem(LEGACY_THREAD_KEY);
    const hasLegacyData =
      (legacyEntities && legacyEntities !== "{}") ||
      (legacyThreads  && legacyThreads  !== "{}");

    const meta = this.create({
      title: hasLegacyData ? "Imported fort" : "Untitled fort",
    });
    id = meta.id;

    if (legacyEntities) {
      localStorage.setItem(FORT_KEYS.entities(id), legacyEntities);
      localStorage.removeItem(LEGACY_ENTITY_KEY);
    }
    if (legacyThreads) {
      localStorage.setItem(FORT_KEYS.threads(id), legacyThreads);
      localStorage.removeItem(LEGACY_THREAD_KEY);
    }

    this.setActiveId(id);
    return id;
  },
};

/**
 * Entity store — persists LLM-generated rooms/floors/buildings/campuses to
 * localStorage so they survive reload. Each entry tracks the entity's type,
 * parent id, and the full JSON snapshot used to reconstruct the element.
 *
 * Always operates on the active fort (see fortStore). Schema unchanged:
 *   { [id]: { type, parent_id, json, ts } }
 */
export const entityStore = {
  /** @returns {Record<string, any>} */
  _all() {
    try {
      const fortId = fortStore.ensureActive();
      return JSON.parse(localStorage.getItem(FORT_KEYS.entities(fortId)) || "{}");
    } catch (_) { return {}; }
  },
  _save(data) {
    const fortId = fortStore.ensureActive();
    localStorage.setItem(FORT_KEYS.entities(fortId), JSON.stringify(data));
    fortStore.update(fortId, {});  // bump updatedAt
  },

  /**
   * @param {string} id
   * @param {"room"|"floor"|"building"|"campus"} type
   * @param {string|null} parentId
   * @param {any} json
   */
  put(id, type, parentId, json) {
    const all = this._all();
    all[id] = { type, parent_id: parentId, json, ts: Date.now() };
    this._save(all);
  },

  remove(id) {
    const all = this._all();
    delete all[id];
    this._save(all);
  },

  /** @returns {{id: string, type: string, parent_id: string|null, json: any, ts: number}[]} */
  list() {
    const all = this._all();
    return Object.entries(all)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => a.ts - b.ts); // chronological insertion order
  },

  clearAll() {
    const fortId = fortStore.ensureActive();
    localStorage.removeItem(FORT_KEYS.entities(fortId));
    fortStore.update(fortId, {});
  },
};

/**
 * Walk the entity store and remount every saved entity into the DOM.
 * Call once after page load (and after the static authored DOM is in place).
 *
 * Order matters: campuses first (they go to <body>), then buildings (need
 * their campus parent already in DOM), then floors, then rooms.
 *
 * Returns counts for diagnostics.
 */
export function restoreEntities() {
  const order = ["campus", "building", "floor", "room"];
  const items = entityStore.list();
  let restored = 0, skipped = 0;

  for (const type of order) {
    for (const item of items.filter(i => i.type === type)) {
      // If already in DOM (e.g., user re-loaded with hash that re-created), skip
      if (document.getElementById(item.id)) { skipped++; continue; }

      let host = null;
      if (type === "campus") {
        host = document.body;
      } else if (item.parent_id) {
        host = document.getElementById(item.parent_id);
      }
      if (!host) { skipped++; continue; }

      try {
        let el;
        if (type === "campus") el = campusFromJson(item.json);
        else if (type === "building") el = buildingFromJson(item.json);
        else if (type === "floor") el = floorFromJson(item.json);
        else if (type === "room") {
          // For incremental rooms, pass existing rooms in floor for safe placement
          const existing = Array.from(host.querySelectorAll(":scope > rune-room")).map((r) => ({
            position: (r.getAttribute("position") || "0,0").split(",").map(Number),
            size: (r.getAttribute("size") || "1,1").split(",").map(Number),
          }));
          el = roomFromJson(item.json, { existingRooms: existing, columns: parseInt(host.getAttribute("columns") || "12", 10) });
        }
        if (el) { host.appendChild(el); restored++; }
        else skipped++;
      } catch (e) {
        console.warn("restoreEntities: failed to mount", item.id, e);
        skipped++;
      }
    }
  }
  return { restored, skipped, total: items.length };
}

/**
 * Generic refine for floor/building/campus. Re-prompts the LLM with the
 * current entity JSON + user feedback, expects updated JSON back, mutates
 * the element in place. Updates the persisted entity if it was generated.
 *
 * @param {HTMLElement} element  rune-floor, rune-building, or rune-campus
 * @param {string} userPrompt
 */
export async function refineEntity(element, userPrompt) {
  const tag = element.tagName.toLowerCase();
  const level = tag.replace("rune-", ""); // floor | building | campus
  if (!["floor", "building", "campus"].includes(level)) {
    throw new Error(`refineEntity: unsupported tag ${tag}`);
  }

  // Build a snapshot of the current entity
  let snapshot;
  if (level === "floor") snapshot = entitySnapshotFloor(element);
  else if (level === "building") snapshot = entitySnapshotBuilding(element);
  else snapshot = entitySnapshotCampus(element);

  // Pull thread history (kept by id)
  const history = (threadStore.get(snapshot.id) || []).map(m => ({ role: m.role, content: m.content }));

  const messages = [
    {
      role: "system",
      content: `${SYSTEM_BASE}

You are refining an existing Runefort ${level}. Return JSON with the SAME shape as the input. You may modify any fields, add or remove children. Keep the id stable unless explicitly asked to rename.

Current ${level}: ${JSON.stringify(snapshot, null, 2)}`,
    },
    ...history,
    { role: "user", content: userPrompt },
  ];

  const result = await chat({
    messages,
    maxTokens: level === "campus" ? 16000 : level === "building" ? 5000 : 2500,
  });
  const json = extractJson(result.content);
  if (!json || !json.id) throw new Error(`LLM did not return valid ${level} JSON. Raw: ${result.content.slice(0, 200)}`);

  // Replace the element in place: build a fresh one, swap it in
  let newEl;
  if (level === "floor") {
    if (!Array.isArray(json.rooms)) throw new Error(`Refined floor missing rooms`);
    newEl = floorFromJson(json);
  } else if (level === "building") {
    if (!Array.isArray(json.floors)) throw new Error(`Refined building missing floors`);
    newEl = buildingFromJson(json);
  } else {
    if (!Array.isArray(json.buildings)) throw new Error(`Refined campus missing buildings`);
    newEl = campusFromJson(json);
  }
  // Preserve the original id even if LLM changed it (we want stable references)
  newEl.id = element.id;
  element.replaceWith(newEl);

  // Persist
  if (entityStore._all()[snapshot.id]) {
    entityStore.put(snapshot.id, level, entityStore._all()[snapshot.id].parent_id, json);
  }
  threadStore.append(snapshot.id, [
    { role: "user", content: userPrompt, ts: Date.now() },
    { role: "assistant", content: result.content, ts: Date.now() },
  ]);
  return { element: newEl, json, usage: result.usage, costUsd: result.costUsd };
}

// Snapshot helpers used by refineEntity (same shape as the demo's snapshot fns)
function entitySnapshotRoom(room) {
  return {
    id: room.id,
    label: room.getAttribute("label") || "",
    kind: room.getAttribute("data-kind") || "text",
    position: (room.getAttribute("position") || "0,0").split(",").map((s) => parseInt(s.trim(), 10)),
    size: (room.getAttribute("size") || "1,1").split(",").map((s) => parseInt(s.trim(), 10)),
    state_class: room.getAttribute("state-class") || null,
    body: room.querySelector(".room-body, .rune-yt-body")?.textContent || "",
  };
}
function entitySnapshotFloor(floor) {
  return {
    id: floor.id,
    label: floor.getAttribute("label") || "",
    data_level: floor.getAttribute("data-level") || null,
    columns: parseInt(floor.getAttribute("columns") || "12", 10),
    cell_height: floor.getAttribute("cell-height") || null,
    gap: floor.getAttribute("gap") || null,
    rooms: Array.from(floor.querySelectorAll(":scope > rune-room")).map(entitySnapshotRoom),
  };
}
function entitySnapshotBuilding(building) {
  return {
    id: building.id,
    label: building.getAttribute("label") || "",
    floors: Array.from(building.querySelectorAll(":scope > rune-floor")).map(entitySnapshotFloor),
  };
}
function entitySnapshotCampus(campus) {
  return {
    id: campus.id,
    label: campus.getAttribute("label") || "",
    buildings: Array.from(campus.querySelectorAll(":scope > rune-building")).map(entitySnapshotBuilding),
  };
}

export const threadStore = {
  /** @returns {Record<string, ThreadMessage[]>} */
  _all() {
    try {
      const fortId = fortStore.ensureActive();
      const raw = localStorage.getItem(FORT_KEYS.threads(fortId));
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  },
  _save(data) {
    const fortId = fortStore.ensureActive();
    localStorage.setItem(FORT_KEYS.threads(fortId), JSON.stringify(data));
    fortStore.update(fortId, {});
  },

  /**
   * Get all messages for a room.
   * @param {string} roomId
   * @returns {ThreadMessage[]}
   */
  get(roomId) {
    const all = this._all();
    return all[roomId] || [];
  },

  /**
   * Append messages to a room's thread.
   * @param {string} roomId
   * @param {ThreadMessage[]} messages
   */
  append(roomId, messages) {
    const all = this._all();
    all[roomId] = [...(all[roomId] || []), ...messages];
    this._save(all);
  },

  /**
   * Clear a room's thread.
   * @param {string} roomId
   */
  clear(roomId) {
    const all = this._all();
    delete all[roomId];
    this._save(all);
  },

  /**
   * Clear ALL threads in the active fort.
   */
  clearAll() {
    const fortId = fortStore.ensureActive();
    localStorage.removeItem(FORT_KEYS.threads(fortId));
    fortStore.update(fortId, {});
  },
};
