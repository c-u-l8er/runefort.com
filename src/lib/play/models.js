// OpenRouter model catalog for RuneFort chat (Stage K).
//
// Hand-curated tier list — we don't hit `/api/v1/models` from the browser
// because the full catalog is ~300 entries and most are irrelevant to a
// tool-calling agent. If a user wants something outside this list they can
// type the exact OpenRouter model ID in the search box and we'll pass it
// through unchanged.
//
// Tiers:
//   - "free"     — OpenRouter free tier (:free suffix). Rate-limited but
//                  good enough for demos and onboarding.
//   - "standard" — paid, fast + cheap. Default for day-to-day work.
//   - "frontier" — paid, top-shelf reasoning. Slower/pricier; for hard tasks.

/**
 * @typedef {{ id: string, label: string, tier: "free"|"standard"|"frontier", tools: boolean, note?: string }} ModelCatalogEntry
 */

/** @type {ModelCatalogEntry[]} */
export const MODEL_CATALOG = [
  // Free
  { id: "qwen/qwen3-235b-a22b", label: "Qwen3 235B A22B", tier: "free", tools: true, note: "default, tool-use capable" },
  { id: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek V3", tier: "free", tools: true },
  { id: "meta-llama/llama-4-maverick:free", label: "Llama 4 Maverick", tier: "free", tools: true },
  { id: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash (exp)", tier: "free", tools: true },

  // Standard (paid, fast + cheap, tool-capable)
  { id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5", tier: "standard", tools: true, note: "fast, reliable tool use" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini", tier: "standard", tools: true },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", tier: "standard", tools: true },
  { id: "deepseek/deepseek-chat", label: "DeepSeek Chat (paid)", tier: "standard", tools: true },
  { id: "qwen/qwen-2.5-72b-instruct", label: "Qwen 2.5 72B", tier: "standard", tools: true },

  // Frontier (paid, top-shelf reasoning)
  { id: "anthropic/claude-opus-4.6", label: "Claude Opus 4.6", tier: "frontier", tools: true, note: "best overall reasoning" },
  { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", tier: "frontier", tools: true },
  { id: "openai/gpt-5", label: "GPT-5", tier: "frontier", tools: true },
  { id: "openai/gpt-4o", label: "GPT-4o", tier: "frontier", tools: true },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", tier: "frontier", tools: true },
];

/** Default model ID — free tier so onboarding works without a paid key. */
export const DEFAULT_MODEL_ID = "qwen/qwen3-235b-a22b";

/**
 * Filter the catalog by a free-text query (matches id or label,
 * case-insensitive). Pass "" to get everything.
 * @param {string} query
 * @returns {ModelCatalogEntry[]}
 */
export function searchModels(query) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return MODEL_CATALOG;
  return MODEL_CATALOG.filter(
    (m) => m.id.toLowerCase().includes(q) || m.label.toLowerCase().includes(q)
  );
}

/**
 * Look up a model catalog entry by ID. Returns a synthetic entry for
 * user-typed IDs not in the catalog so they still render sensibly.
 * @param {string} id
 * @returns {ModelCatalogEntry}
 */
export function findModel(id) {
  const hit = MODEL_CATALOG.find((m) => m.id === id);
  if (hit) return hit;
  return { id, label: id, tier: "standard", tools: true, note: "custom" };
}
