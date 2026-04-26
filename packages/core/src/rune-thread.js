// @ts-check
// <rune-thread> + <rune-message> — BBS-style threaded message tree.
//
// A thread renders messages in chronological order with optional reply
// indentation. Used to show the prompt+response history of a room.
//
// Three ways to populate a thread:
//   1. Author <rune-message> children directly (static)
//   2. Set thread.messages = [...] (programmatic)
//   3. Set thread.roomId = "..." → loads from threadStore
//
// Events:
//   rune:thread-reply — fires when user submits a reply via the input box
//                       detail: { content, parentId? }

import { threadStore } from "./runtime.js";

export class RuneThread extends HTMLElement {
  static get observedAttributes() {
    return ["room-id", "show-input"];
  }

  constructor() {
    super();
    /** @type {any[]} */
    this._messages = [];
    this._built = false;
  }

  connectedCallback() {
    if (this._built) return;
    this._built = true;
    this.classList.add("runefort-thread");

    // Render shell
    const initial = this.innerHTML;
    this.innerHTML = `
      <div class="runefort-thread-list" data-runefort-list>${initial}</div>
      <form class="runefort-thread-input" data-runefort-input style="display:none">
        <textarea placeholder="Type a follow-up... (Cmd-Enter to send)" rows="2"></textarea>
        <button type="submit">Send</button>
      </form>
    `;
    this._list = this.querySelector("[data-runefort-list]");
    this._input = this.querySelector("[data-runefort-input]");
    this._textarea = this._input.querySelector("textarea");

    this._input.addEventListener("submit", this._onSubmit);
    this._textarea.addEventListener("keydown", this._onKey);

    // Load from store if room-id is set
    queueMicrotask(() => this._reload());
  }

  attributeChangedCallback(name) {
    if (!this._built) return;
    if (name === "room-id") this._reload();
    if (name === "show-input") {
      this._input.style.display = this.hasAttribute("show-input") ? "flex" : "none";
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** @returns {string} */
  get roomId() {
    return this.getAttribute("room-id") || "";
  }
  /** @param {string} v */
  set roomId(v) {
    this.setAttribute("room-id", v);
  }

  /** @returns {any[]} */
  get messages() {
    return this._messages;
  }
  /** @param {any[]} v */
  set messages(v) {
    this._messages = Array.isArray(v) ? v : [];
    this._render();
  }

  reload() {
    this._reload();
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  _reload() {
    if (this.roomId) {
      this._messages = threadStore.get(this.roomId);
      this._render();
    }
  }

  _render() {
    if (!this._list) return;
    if (this._messages.length === 0) {
      this._list.innerHTML = `<div class="runefort-thread-empty">no messages yet</div>`;
      return;
    }

    // Build tree by parentId. Top-level messages have no parent.
    /** @type {Map<string, any[]>} */
    const childrenByParent = new Map();
    /** @type {any[]} */
    const roots = [];
    for (const m of this._messages) {
      if (m.parentId) {
        if (!childrenByParent.has(m.parentId)) childrenByParent.set(m.parentId, []);
        childrenByParent.get(m.parentId).push(m);
      } else {
        roots.push(m);
      }
    }

    /** @param {any} m @param {number} depth @returns {string} */
    const renderMsg = (m, depth) => {
      const time = m.ts ? new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
      const role = m.role || "user";
      const content = (m.content || "").toString();
      const children = m.id ? childrenByParent.get(m.id) || [] : [];
      return `
        <div class="runefort-message runefort-role-${role}" style="--depth: ${depth}">
          <div class="runefort-message-meta">
            <span class="runefort-message-role">${role}</span>
            <span class="runefort-message-time">${time}</span>
          </div>
          <div class="runefort-message-content">${escapeHtml(content)}</div>
          ${children.length ? `<div class="runefort-message-replies">${children.map(c => renderMsg(c, depth + 1)).join("")}</div>` : ""}
        </div>
      `;
    };
    this._list.innerHTML = roots.map(r => renderMsg(r, 0)).join("");
    // Auto-scroll to bottom
    this._list.scrollTop = this._list.scrollHeight;
  }

  _onSubmit = (/** @type {Event} */ ev) => {
    ev.preventDefault();
    const content = this._textarea.value.trim();
    if (!content) return;
    this._textarea.value = "";
    this.dispatchEvent(
      new CustomEvent("rune:thread-reply", {
        detail: { content, roomId: this.roomId },
        bubbles: true,
      })
    );
  };

  _onKey = (/** @type {KeyboardEvent} */ ev) => {
    if ((ev.metaKey || ev.ctrlKey) && ev.key === "Enter") {
      ev.preventDefault();
      this._input.requestSubmit();
    }
  };
}

export class RuneMessage extends HTMLElement {
  // Static markup carrier — converted to a regular div when the parent thread
  // renders. Treated as a plain message-like data holder otherwise.
  connectedCallback() {
    this.classList.add("runefort-static-message");
    this.setAttribute("aria-hidden", "true");
  }
}

/** @param {string} s */
function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

if (!customElements.get("rune-thread")) customElements.define("rune-thread", RuneThread);
if (!customElements.get("rune-message")) customElements.define("rune-message", RuneMessage);
