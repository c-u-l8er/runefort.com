// Svelte 5 rune store for chat message history.
// Uses a single $state object so references stay reactive (same pattern as fort store).

let chat = $state({
  /** @type {Array<{ role: string, content: string, tool_calls?: any[], tool_call_id?: string }>} */
  messages: [],
  isLoading: false,
  model: "qwen/qwen3-235b-a22b",
});

export function getChat() {
  return chat;
}

export function addMessage(msg) {
  chat.messages.push(msg);
}

export function clearMessages() {
  chat.messages = [];
}

export function setLoading(v) {
  chat.isLoading = v;
}

export function setModel(m) {
  chat.model = m;
}
