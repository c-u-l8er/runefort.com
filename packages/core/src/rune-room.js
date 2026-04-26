// @ts-check
// <rune-room> — a tile in the grid. Child of <rune-floor>.

import { buildUrl } from "./editor-handoff.js";

const STATE_CLASS_PREFIX = "runefort-state-";

export class RuneRoom extends HTMLElement {
  static get observedAttributes() {
    return ["id", "position", "size", "label", "anchor", "state-class"];
  }

  constructor() {
    super();
    /** @type {Record<string, unknown>} */
    this._meta = {};
    /** @type {string | null} */
    this._currentStateClass = null;
  }

  connectedCallback() {
    if (!this.hasAttribute("tabindex")) this.tabIndex = 0;
    if (!this.hasAttribute("role")) this.setAttribute("role", "button");
    this.classList.add("runefort-room");

    this._applyGridPlacement();
    this._applyAccessibleName();
    this._applyStateClass(this.getAttribute("state-class"));

    this.addEventListener("click", this._onActivate);
    this.addEventListener("keydown", this._onKeyDown);
    this.addEventListener("focus", this._onFocus);

    // Notify parent floor (in case attributes changed before mount)
    const floor = this.closest("rune-floor");
    if (floor && typeof floor._invalidateRooms === "function") {
      floor._invalidateRooms();
    }
  }

  disconnectedCallback() {
    this.removeEventListener("click", this._onActivate);
    this.removeEventListener("keydown", this._onKeyDown);
    this.removeEventListener("focus", this._onFocus);
    const floor = this.closest("rune-floor");
    if (floor && typeof floor._invalidateRooms === "function") {
      floor._invalidateRooms();
    }
  }

  /**
   * @param {string} name
   * @param {string | null} _oldVal
   * @param {string | null} newVal
   */
  attributeChangedCallback(name, _oldVal, newVal) {
    if (!this.isConnected) return;
    if (name === "position" || name === "size") this._applyGridPlacement();
    if (name === "label" || name === "id") this._applyAccessibleName();
    if (name === "state-class") this._applyStateClass(newVal);
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** @returns {string} */
  get roomId() {
    return this.id || "";
  }

  /** @returns {[number, number]} */
  get position() {
    return parseTuple(this.getAttribute("position")) || [0, 0];
  }

  /** @returns {[number, number]} */
  get size() {
    return parseTuple(this.getAttribute("size")) || [1, 1];
  }

  /** @returns {string} */
  get label() {
    return this.getAttribute("label") || this.id || "";
  }

  /** @returns {string | null} */
  get anchor() {
    return this.getAttribute("anchor");
  }

  /** @returns {string | null} */
  get stateClass() {
    return this._currentStateClass;
  }

  /** @returns {Record<string, unknown>} */
  get meta() {
    return this._meta;
  }

  /** @param {Record<string, unknown>} value */
  set meta(value) {
    this._meta = value && typeof value === "object" ? value : {};
  }

  /**
   * Called by parent floor when bindings/signals produce a new state class
   * for this room. Triggers a `rune:state` event if the class changed.
   * @param {string | null} cls
   */
  _setComputedState(cls) {
    this._applyStateClass(cls);
  }

  /** @returns {object} */
  toJSON() {
    /** @type {{ pattern: string, anchor: string | null }[]} */
    const claims = [];
    this.querySelectorAll("rune-claim").forEach((c) => {
      const claim = /** @type {any} */ (c);
      if (typeof claim.toJSON === "function") claims.push(claim.toJSON());
    });
    return {
      id: this.roomId,
      position: this.position,
      size: this.size,
      label: this.label,
      anchor: this.anchor,
      state_class: this.stateClass,
      meta: this._meta,
      claims,
    };
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  _applyGridPlacement() {
    const [col, row] = this.position;
    const [colspan, rowspan] = this.size;
    // CSS grid is 1-indexed; protocol positions are 0-indexed.
    this.style.gridColumn = `${col + 1} / span ${colspan}`;
    this.style.gridRow = `${row + 1} / span ${rowspan}`;
  }

  _applyAccessibleName() {
    if (!this.hasAttribute("aria-label")) {
      this.setAttribute("aria-label", this.label);
    }
  }

  /** @param {string | null} cls */
  _applyStateClass(cls) {
    // Strip any existing state class
    const toRemove = [];
    this.classList.forEach((c) => {
      if (c.startsWith(STATE_CLASS_PREFIX)) toRemove.push(c);
    });
    toRemove.forEach((c) => this.classList.remove(c));

    if (cls && typeof cls === "string") {
      this.classList.add(STATE_CLASS_PREFIX + cls);
    }

    if (cls !== this._currentStateClass) {
      const oldClass = this._currentStateClass;
      this._currentStateClass = cls;
      this.dispatchEvent(
        new CustomEvent("rune:state", {
          detail: { id: this.roomId, oldClass, newClass: cls },
          bubbles: true,
        })
      );
    }
  }

  _onActivate = (/** @type {Event} */ ev) => {
    this._fireOpen(ev);
  };

  _onKeyDown = (/** @type {KeyboardEvent} */ ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      this._fireOpen(ev);
    }
    // Arrow-key navigation is delegated to the parent floor.
  };

  _onFocus = () => {
    this.classList.add("runefort-focused");
    this.dispatchEvent(
      new CustomEvent("rune:focus", {
        detail: { id: this.roomId },
        bubbles: true,
      })
    );
    // Cleanup focus class on blur (one-time listener)
    this.addEventListener(
      "blur",
      () => this.classList.remove("runefort-focused"),
      { once: true }
    );
  };

  /** @param {Event} originalEvent */
  _fireOpen(originalEvent) {
    const floor = this.closest("rune-floor");
    const editor =
      (floor && /** @type {any} */ (floor).editor) ||
      this.getAttribute("editor") ||
      "vscode";
    const anchorUrl = this.anchor ? buildUrl(editor, this.anchor) : null;

    const ev = new CustomEvent("rune:open", {
      detail: {
        id: this.roomId,
        anchor: this.anchor,
        anchorUrl,
        meta: this._meta,
      },
      bubbles: true,
      cancelable: true,
    });
    const proceed = this.dispatchEvent(ev);
    if (proceed && anchorUrl) {
      // Default action: navigate to the anchor URL.
      // Use location.href so it works for non-http schemes (vscode://, etc).
      window.location.href = anchorUrl;
    }
  }
}

/**
 * Parse "col,row" into [col, row]. Returns null on parse failure.
 * @param {string | null} s
 * @returns {[number, number] | null}
 */
function parseTuple(s) {
  if (!s) return null;
  const parts = s.split(",").map((p) => parseInt(p.trim(), 10));
  if (parts.length !== 2 || parts.some(Number.isNaN)) return null;
  return /** @type {[number, number]} */ ([parts[0], parts[1]]);
}

if (!customElements.get("rune-room")) {
  customElements.define("rune-room", RuneRoom);
}
