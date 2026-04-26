// localStorage persistence for /app route.
// 30-day TTL enforced on load.

const API_KEY_STORAGE = "runefort_play_openrouter_key";
const MCP_STORAGE = "runefort_play_mcp_connections";
const PLAY_STATE_STORAGE = "runefort_play_state";
const CHAT_SESSIONS_STORAGE = "runefort_play_chat_sessions_v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Save OpenRouter API key to localStorage.
 * @param {string} key
 */
export function saveApiKey(key) {
  try {
    localStorage.setItem(API_KEY_STORAGE, key);
  } catch {
    // silently fail
  }
}

/**
 * Load OpenRouter API key from localStorage.
 * @returns {string}
 */
export function loadApiKey() {
  try {
    return localStorage.getItem(API_KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

/**
 * Clear OpenRouter API key from localStorage.
 */
export function clearApiKey() {
  try {
    localStorage.removeItem(API_KEY_STORAGE);
  } catch {
    // silently fail
  }
}

/**
 * Save MCP server connections to localStorage.
 * @param {Array<{ url: string, authHeader?: string }>} connections
 */
export function saveMcpConnections(connections) {
  try {
    localStorage.setItem(MCP_STORAGE, JSON.stringify(connections));
  } catch {
    // silently fail
  }
}

/**
 * Load MCP server connections from localStorage.
 * @returns {Array<{ url: string, authHeader?: string }>}
 */
export function loadMcpConnections() {
  try {
    const raw = localStorage.getItem(MCP_STORAGE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save play state to localStorage with timestamp.
 * @param {object} state
 */
export function savePlayState(state) {
  try {
    const payload = { ...state, savedAt: Date.now() };
    localStorage.setItem(PLAY_STATE_STORAGE, JSON.stringify(payload));
  } catch {
    // silently fail
  }
}

/**
 * Load play state from localStorage. Returns null if expired or missing.
 * @returns {object | null}
 */
export function loadPlayState() {
  try {
    const raw = localStorage.getItem(PLAY_STATE_STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.savedAt || Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(PLAY_STATE_STORAGE);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save chat sessions (Stage K) — array of session objects + currentSessionId.
 * @param {{ sessions: Array, currentSessionId: string|null }} payload
 */
export function saveChatSessions(payload) {
  try {
    localStorage.setItem(CHAT_SESSIONS_STORAGE, JSON.stringify(payload));
  } catch {
    // silently fail
  }
}

/**
 * Load chat sessions. Returns null if missing or malformed.
 * @returns {{ sessions: Array, currentSessionId: string|null } | null}
 */
export function loadChatSessions() {
  try {
    const raw = localStorage.getItem(CHAT_SESSIONS_STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.sessions)) return null;
    return parsed;
  } catch {
    return null;
  }
}
