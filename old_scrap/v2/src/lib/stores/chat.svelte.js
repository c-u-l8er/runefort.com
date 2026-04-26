// Svelte 5 rune store for chat sessions (Stage K — Agent Console).
//
// A "session" is a scoped conversation with its own model, MCP allowlist,
// and message history. The user can have many and switch between them from
// the session rail in ChatPanel.
//
// The legacy single-chat API (`getChat() / addMessage / setModel / ...`)
// remains — those helpers now proxy to the *current* session so the rest of
// the app doesn't need to know sessions exist. New helpers (session CRUD,
// allowlist mutation) live below.
//
// Persistence: localStorage via saveChatSessions/loadChatSessions. Not yet
// Supabase-backed — add amp.chat_sessions migration if cross-device sync is
// required.

import { DEFAULT_MODEL_ID } from "$lib/play/models.js";
import { saveChatSessions, loadChatSessions } from "$lib/play/storage.js";

/**
 * @typedef {{ role: string, content: string, tool_calls?: any[], tool_call_id?: string }} ChatMessage
 * @typedef {{
 *   id: string,
 *   name: string,
 *   model: string,
 *   mcpAllowlist: string[] | null,
 *   fortContextId: string | null,
 *   teamId: string | null,
 *   role: string | null,
 *   messages: ChatMessage[],
 *   createdAt: number,
 *   updatedAt: number,
 * }} ChatSession
 */

function uid() {
  // Defense — crypto.randomUUID is standard in all modern browsers, but
  // guard for SSR where `crypto` is not present.
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

/**
 * @returns {ChatSession}
 */
function makeSession(name = "New session") {
  const now = Date.now();
  return {
    id: uid(),
    name,
    model: DEFAULT_MODEL_ID,
    mcpAllowlist: null, // null = all connected MCPs; [] = none; [...] = subset
    fortContextId: null,
    teamId: null,
    role: null,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ── Root state ──

const initial = (() => {
  if (typeof localStorage === "undefined") {
    const s = makeSession("Session 1");
    return { sessions: [s], currentSessionId: s.id };
  }
  const loaded = loadChatSessions();
  if (loaded && loaded.sessions.length > 0) {
    return {
      sessions: loaded.sessions,
      currentSessionId: loaded.currentSessionId ?? loaded.sessions[0].id,
    };
  }
  const s = makeSession("Session 1");
  return { sessions: [s], currentSessionId: s.id };
})();

let store = $state({
  /** @type {ChatSession[]} */
  sessions: initial.sessions,
  /** @type {string} */
  currentSessionId: initial.currentSessionId,
  /** Loading flag lives outside sessions — it's UI transient, not history. */
  isLoading: false,
});

function persist() {
  saveChatSessions({
    sessions: store.sessions,
    currentSessionId: store.currentSessionId,
  });
}

/**
 * Find the current session. Always returns a session — if the stored
 * `currentSessionId` is dangling, falls back to the first session and
 * self-heals.
 * @returns {ChatSession}
 */
function current() {
  let s = store.sessions.find((x) => x.id === store.currentSessionId);
  if (!s) {
    s = store.sessions[0] ?? makeSession("Session 1");
    if (!store.sessions.includes(s)) store.sessions = [s];
    store.currentSessionId = s.id;
  }
  return s;
}

// ── Legacy single-chat API (proxies current session) ──

/**
 * Returns an object whose shape matches the old chat store
 * (`{ messages, isLoading, model }`) so existing consumers keep working.
 * Because the returned object uses getters, it stays live as the current
 * session changes under it.
 */
export function getChat() {
  return {
    get messages() { return current().messages; },
    set messages(v) { current().messages = v; touch(); },
    get isLoading() { return store.isLoading; },
    set isLoading(v) { store.isLoading = v; },
    get model() { return current().model; },
    set model(v) { current().model = v; touch(); },
    get mcpAllowlist() { return current().mcpAllowlist; },
    set mcpAllowlist(v) { current().mcpAllowlist = v; touch(); },
  };
}

function touch() {
  current().updatedAt = Date.now();
  persist();
}

/** @param {ChatMessage} msg */
export function addMessage(msg) {
  current().messages.push(msg);
  touch();
}

export function clearMessages() {
  current().messages = [];
  touch();
}

/** @param {boolean} v */
export function setLoading(v) {
  store.isLoading = v;
}

/** @param {string} m */
export function setModel(m) {
  current().model = m;
  touch();
}

// ── Session CRUD ──

export function getSessions() {
  return store.sessions;
}

export function getCurrentSessionId() {
  return store.currentSessionId;
}

export function getCurrentSession() {
  return current();
}

/**
 * Create a new session and switch to it. Returns the created session id.
 * @param {{ name?: string, model?: string, fortContextId?: string|null }} [opts]
 */
export function newSession(opts = {}) {
  const s = makeSession(opts.name ?? `Session ${store.sessions.length + 1}`);
  if (opts.model) s.model = opts.model;
  if (opts.fortContextId !== undefined) s.fortContextId = opts.fortContextId;
  store.sessions = [s, ...store.sessions];
  store.currentSessionId = s.id;
  persist();
  return s.id;
}

/** @param {string} id */
export function selectSession(id) {
  if (store.sessions.some((s) => s.id === id)) {
    store.currentSessionId = id;
    persist();
  }
}

/** @param {string} id */
export function deleteSession(id) {
  store.sessions = store.sessions.filter((s) => s.id !== id);
  if (store.sessions.length === 0) {
    const s = makeSession("Session 1");
    store.sessions = [s];
    store.currentSessionId = s.id;
  } else if (store.currentSessionId === id) {
    store.currentSessionId = store.sessions[0].id;
  }
  persist();
}

/**
 * @param {string} id
 * @param {string} name
 */
export function renameSession(id, name) {
  const s = store.sessions.find((x) => x.id === id);
  if (s) {
    s.name = name.trim() || s.name;
    s.updatedAt = Date.now();
    persist();
  }
}

/**
 * Set the per-session MCP allowlist.
 *   - null   → session can see every connected MCP (default)
 *   - []     → session sees built-ins only, no MCPs
 *   - [...]  → explicit allowlist of MCP server names
 * @param {string[]|null} list
 */
export function setMcpAllowlist(list) {
  current().mcpAllowlist = list;
  touch();
}

/**
 * @param {string} serverName
 * @returns {boolean}
 */
export function isMcpAllowed(serverName) {
  const list = current().mcpAllowlist;
  if (list === null) return true;
  return list.includes(serverName);
}

/** @param {string} serverName */
export function toggleMcpAllowed(serverName) {
  const s = current();
  // If the allowlist is unset (null = all allowed), materialize it on first
  // toggle so the user opts into explicit control.
  if (s.mcpAllowlist === null) {
    s.mcpAllowlist = [serverName];
  } else if (s.mcpAllowlist.includes(serverName)) {
    s.mcpAllowlist = s.mcpAllowlist.filter((n) => n !== serverName);
  } else {
    s.mcpAllowlist = [...s.mcpAllowlist, serverName];
  }
  touch();
}

/** Reset current session's allowlist to "all MCPs allowed". */
export function allowAllMcps() {
  current().mcpAllowlist = null;
  touch();
}

// ── Teams (Stage K #5) ──

/**
 * @typedef {{
 *   name?: string,
 *   role?: string,
 *   model?: string,
 *   mcpAllowlist?: string[] | null,
 *   fortContextId?: string | null,
 * }} TeamMemberSpec
 */

/**
 * Spawn a team of sessions. All members share a generated teamId. The
 * current session does NOT change (keeps the spawning conversation in
 * focus). Returns the teamId and member metadata.
 *
 * @param {TeamMemberSpec[]} specs - one session per member
 * @param {{ fortContextId?: string | null }} [opts]
 * @returns {{ teamId: string, members: Array<{ id: string, name: string, role: string|null }> }}
 */
export function spawnTeam(specs, opts = {}) {
  if (!Array.isArray(specs) || specs.length === 0) {
    throw new Error("spawnTeam: specs must be a non-empty array");
  }
  const teamId = uid();
  const newSessions = specs.map((spec, i) => {
    const s = makeSession(spec.name || `Member ${i + 1}`);
    s.teamId = teamId;
    s.role = spec.role || null;
    if (spec.model) s.model = spec.model;
    if (spec.mcpAllowlist !== undefined) s.mcpAllowlist = spec.mcpAllowlist;
    s.fortContextId = spec.fortContextId ?? opts.fortContextId ?? null;
    return s;
  });
  // Prepend — newest on top — without clobbering currentSessionId.
  store.sessions = [...newSessions, ...store.sessions];
  persist();
  return {
    teamId,
    members: newSessions.map((s) => ({ id: s.id, name: s.name, role: s.role })),
  };
}

/**
 * List every session belonging to a team.
 * @param {string} teamId
 * @returns {ChatSession[]}
 */
export function getTeamMembers(teamId) {
  return store.sessions.filter((s) => s.teamId === teamId);
}
