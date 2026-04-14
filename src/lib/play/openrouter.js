// Client-side OpenRouter caller for BYOK chat.

const DEFAULT_MODEL = "qwen/qwen3-235b-a22b";

/**
 * Call OpenRouter chat completions API.
 * @param {string} apiKey - OpenRouter API key
 * @param {Array<{ role: string, content: string, tool_calls?: any[], tool_call_id?: string }>} messages
 * @param {Array<object>} [tools] - OpenAI-format tool definitions
 * @param {string} [model] - Model ID (defaults to qwen3-235b-a22b)
 * @returns {Promise<object>} OpenAI-compatible chat completion response
 */
export async function callOpenRouter(apiKey, messages, tools, model) {
  const body = {
    model: model || DEFAULT_MODEL,
    messages,
    max_tokens: 4096,
  };
  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://runefort.com",
      "X-Title": "RuneFort",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter error ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json();
}
