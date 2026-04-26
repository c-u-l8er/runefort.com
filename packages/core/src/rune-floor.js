// @ts-check
// <rune-floor> — the grid container. Owns signal state, evaluates state
// bindings, and implements keyboard navigation along <rune-link> edges.

import { classFor } from "./threshold.js";

/** @typedef {import("./threshold.js").Threshold} Threshold */

/**
 * @typedef {Object} StateBinding
 * @property {string} room
 * @property {string} signal
 * @property {Threshold[]} thresholds
 */

export class RuneFloor extends HTMLElement {
  static get observedAttributes() {
    return ["columns", "rows", "vocabulary", "editor", "cell-width", "cell-height", "gap"];
  }

  constructor() {
    super();
    /** @type {Record<string, number>} */
    this._signals = {};
    /** @type {StateBinding[]} */
    this._bindings = [];
    /** @type {boolean} */
    this._roomsDirty = true;
    /** @type {boolean} */
    this._linksDirty = true;
    /** @type {Map<string, RuneRoomLike>} */
    this._roomIndex = new Map();
    /** @type {LinkAdj} */
    this._adj = { up: new Map(), down: new Map(), left: new Map(), right: new Map() };
  }

  connectedCallback() {
    this.classList.add("runefort-floor");
    this._applyGridStyles();
    this.addEventListener("keydown", this._onKeyDown);
    // Defer first index build to allow children to upgrade
    queueMicrotask(() => this._rebuildIfNeeded());
  }

  disconnectedCallback() {
    this.removeEventListener("keydown", this._onKeyDown);
  }

  attributeChangedCallback() {
    if (!this.isConnected) return;
    this._applyGridStyles();
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** @returns {number} */
  get columns() {
    return parseInt(this.getAttribute("columns") || "12", 10);
  }

  /** @returns {string} */
  get vocabulary() {
    return this.getAttribute("vocabulary") || "core";
  }

  /** @returns {string} */
  get editor() {
    return this.getAttribute("editor") || "vscode";
  }

  /** @returns {Record<string, number>} */
  get signals() {
    return this._signals;
  }

  /** @param {Record<string, number>} value */
  set signals(value) {
    if (!value || typeof value !== "object") return;
    const oldSignals = this._signals;
    this._signals = { ...value };
    this._evaluateBindings();
    // Diff and emit change events
    const allKeys = new Set([...Object.keys(oldSignals), ...Object.keys(this._signals)]);
    for (const k of allKeys) {
      if (oldSignals[k] !== this._signals[k]) {
        this.dispatchEvent(
          new CustomEvent("rune:signal", {
            detail: {
              name: k,
              value: this._signals[k],
              affected_rooms: this._bindings.filter((b) => b.signal === k).map((b) => b.room),
            },
            bubbles: true,
          })
        );
      }
    }
  }

  /** @returns {StateBinding[]} */
  get bindings() {
    return this._bindings;
  }

  /** @param {StateBinding[]} value */
  set bindings(value) {
    this._bindings = Array.isArray(value) ? value : [];
    this._evaluateBindings();
  }

  /**
   * Programmatically focus a room by id.
   * @param {string} roomId
   */
  focusRoom(roomId) {
    this._rebuildIfNeeded();
    const room = this._roomIndex.get(roomId);
    if (room) /** @type {HTMLElement} */ (room).focus();
  }

  /**
   * Serialize the floor and its children to a runefort.json-shaped object.
   * @returns {object}
   */
  toJSON() {
    this._rebuildIfNeeded();
    /** @type {object[]} */
    const rooms = [];
    /** @type {object[]} */
    const claims = [];
    /** @type {object[]} */
    const neighbors = [];

    this._roomIndex.forEach((room) => {
      const r = /** @type {any} */ (room);
      const json = r.toJSON();
      // Pull claims out into the top-level array, per protocol shape.
      if (Array.isArray(json.claims)) {
        json.claims.forEach((c) =>
          claims.push({ room: json.id, pattern: c.pattern, anchor: c.anchor })
        );
        delete json.claims;
      }
      rooms.push(json);
    });

    this.querySelectorAll(":scope > rune-link").forEach((l) => {
      const link = /** @type {any} */ (l);
      if (typeof link.toJSON === "function") neighbors.push(link.toJSON());
    });

    return {
      runefort: "0.1",
      grid: { columns: this.columns, rows: this.getAttribute("rows") || "auto" },
      vocabulary: this.vocabulary,
      rooms,
      claims,
      neighbors,
      state_bindings: this._bindings,
    };
  }

  // ─── Internal: invalidation hooks (called by children) ─────────────────

  _invalidateRooms() {
    this._roomsDirty = true;
    queueMicrotask(() => this._rebuildIfNeeded());
  }

  _invalidateLinks() {
    this._linksDirty = true;
    queueMicrotask(() => this._rebuildIfNeeded());
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  _applyGridStyles() {
    const columns = this.columns;
    const cellWidth = this.getAttribute("cell-width");
    const cellHeight = this.getAttribute("cell-height");
    const gap = this.getAttribute("gap") || "8px";

    // Note: do NOT set `display` inline. The CSS theme owns it so that the
    // building can hide inactive floors in switch mode (a CSS rule cannot
    // override an inline style at the same specificity).
    this.style.gridTemplateColumns = cellWidth
      ? `repeat(${columns}, ${cellWidth})`
      : `repeat(${columns}, minmax(0, 1fr))`;
    if (cellHeight) {
      this.style.gridAutoRows = cellHeight;
    }
    this.style.gap = gap;
    this.style.setProperty("--rune-gap", gap);
    if (cellWidth) this.style.setProperty("--rune-cell-width", cellWidth);
    if (cellHeight) this.style.setProperty("--rune-cell-height", cellHeight);
  }

  _rebuildIfNeeded() {
    if (this._roomsDirty) this._rebuildRooms();
    if (this._linksDirty) this._rebuildLinks();
    this._evaluateBindings();
  }

  _rebuildRooms() {
    this._roomIndex.clear();
    this.querySelectorAll(":scope > rune-room").forEach((r) => {
      const room = /** @type {RuneRoomLike} */ (/** @type {any} */ (r));
      if (room.roomId) this._roomIndex.set(room.roomId, room);
    });
    this._roomsDirty = false;
  }

  _rebuildLinks() {
    this._adj = { up: new Map(), down: new Map(), left: new Map(), right: new Map() };

    /** @type {{ from: string, to: string, bidi: boolean }[]} */
    const linkPairs = [];
    this.querySelectorAll(":scope > rune-link").forEach((l) => {
      const link = /** @type {any} */ (l);
      const from = link.from;
      const to = link.to;
      if (!from || !to) return;
      linkPairs.push({ from, to, bidi: !!link.bidirectional });
    });

    // Compute spatial direction between two rooms based on grid position.
    for (const { from, to, bidi } of linkPairs) {
      const a = this._roomIndex.get(from);
      const b = this._roomIndex.get(to);
      if (!a || !b) continue;
      const dir = directionBetween(a, b);
      if (!dir) continue;
      this._adj[dir].set(from, to);
      if (bidi) this._adj[opposite(dir)].set(to, from);
    }
    this._linksDirty = false;
  }

  _evaluateBindings() {
    if (!this._bindings || this._bindings.length === 0) return;
    if (this._roomsDirty) this._rebuildRooms();

    for (const b of this._bindings) {
      const room = this._roomIndex.get(b.room);
      if (!room) continue;
      const value = this._signals[b.signal];
      const cls = typeof value === "number" ? classFor(b.thresholds, value) : null;
      const r = /** @type {any} */ (room);
      if (typeof r._setComputedState === "function") {
        r._setComputedState(cls);
      }
    }
  }

  /** @param {KeyboardEvent} ev */
  _onKeyDown = (ev) => {
    /** @type {"up" | "down" | "left" | "right" | null} */
    let dir = null;
    if (ev.key === "ArrowUp" || ev.key === "k") dir = "up";
    else if (ev.key === "ArrowDown" || ev.key === "j") dir = "down";
    else if (ev.key === "ArrowLeft" || ev.key === "h") dir = "left";
    else if (ev.key === "ArrowRight" || ev.key === "l") dir = "right";
    if (!dir) return;

    const target = /** @type {HTMLElement} */ (ev.target);
    const fromRoom = target && target.closest && target.closest("rune-room");
    if (!fromRoom) return;
    const fromId = /** @type {any} */ (fromRoom).roomId;
    if (!fromId) return;

    this._rebuildIfNeeded();
    const toId = this._adj[dir].get(fromId);
    if (!toId) return;
    const toRoom = this._roomIndex.get(toId);
    if (!toRoom) return;

    ev.preventDefault();
    /** @type {HTMLElement} */ (toRoom).focus();
    this.dispatchEvent(
      new CustomEvent("rune:navigate", {
        detail: { from: fromId, to: toId, direction: dir },
        bubbles: true,
      })
    );
  };
}

/**
 * @typedef {Object} RuneRoomLike
 * @property {string} roomId
 * @property {[number, number]} position
 * @property {[number, number]} size
 */

/**
 * @typedef {Object} LinkAdj
 * @property {Map<string, string>} up
 * @property {Map<string, string>} down
 * @property {Map<string, string>} left
 * @property {Map<string, string>} right
 */

/**
 * @param {RuneRoomLike} a
 * @param {RuneRoomLike} b
 * @returns {"up" | "down" | "left" | "right" | null}
 */
function directionBetween(a, b) {
  const [ac, ar] = a.position;
  const [bc, br] = b.position;
  const dc = bc - ac;
  const dr = br - ar;
  if (Math.abs(dr) >= Math.abs(dc)) {
    if (dr < 0) return "up";
    if (dr > 0) return "down";
  } else {
    if (dc < 0) return "left";
    if (dc > 0) return "right";
  }
  return null;
}

/** @param {"up" | "down" | "left" | "right"} dir */
function opposite(dir) {
  return dir === "up" ? "down" : dir === "down" ? "up" : dir === "left" ? "right" : "left";
}

if (!customElements.get("rune-floor")) {
  customElements.define("rune-floor", RuneFloor);
}
