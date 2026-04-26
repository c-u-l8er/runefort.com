// @ts-check
// <rune-action> — declarative action button. Renders as a clickable button
// that fires a `rune:action` event when clicked. The host page wires up
// what happens (typically: open a modal, call LLM, mutate state).
//
// Attributes:
//   id            — unique action id (used for hotkey + dispatch)
//   label         — display text
//   target        — selector for the element this action operates on
//                   (resolved at click time relative to closest ancestor or document)
//   keybinding    — keyboard shortcut, e.g. "ctrl+k", "shift+a"
//   icon          — optional unicode glyph or text to prepend
//
// Example:
//   <rune-action id="add-room" label="+ Add room" target="rune-floor[data-active]"
//                keybinding="ctrl+shift+r" icon="+"></rune-action>
//
// Event:
//   rune:action — bubbles. detail: { id, target, action: this }

export class RuneAction extends HTMLElement {
  static get observedAttributes() {
    return ["label", "icon", "disabled"];
  }

  constructor() {
    super();
    this._built = false;
  }

  connectedCallback() {
    if (this._built) return;
    this._built = true;
    this.classList.add("runefort-action");
    if (!this.hasAttribute("role")) this.setAttribute("role", "button");
    if (!this.hasAttribute("tabindex")) this.tabIndex = 0;

    this._render();
    this.addEventListener("click", this._onActivate);
    this.addEventListener("keydown", this._onKey);

    const kb = this.getAttribute("keybinding");
    if (kb) {
      this._kb = parseKeybinding(kb);
      window.addEventListener("keydown", this._onGlobalKey);
    }
  }

  disconnectedCallback() {
    this.removeEventListener("click", this._onActivate);
    this.removeEventListener("keydown", this._onKey);
    if (this._kb) window.removeEventListener("keydown", this._onGlobalKey);
  }

  attributeChangedCallback() {
    if (this._built) this._render();
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** Programmatically trigger the action. */
  invoke() {
    this._fire();
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  _render() {
    const icon = this.getAttribute("icon") || "";
    const label = this.getAttribute("label") || this.id || "action";
    const disabled = this.hasAttribute("disabled");
    if (disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
    this.innerHTML = `
      ${icon ? `<span class="runefort-action-icon">${icon}</span>` : ""}
      <span class="runefort-action-label">${escapeHtml(label)}</span>
    `;
  }

  _resolveTarget() {
    const sel = this.getAttribute("target");
    if (!sel) return null;
    // Look in document; if this action is inside something, prefer closest match
    return /** @type {HTMLElement | null} */ (document.querySelector(sel));
  }

  _onActivate = (/** @type {Event} */ ev) => {
    if (this.hasAttribute("disabled")) return;
    this._fire();
  };

  _onKey = (/** @type {KeyboardEvent} */ ev) => {
    if (this.hasAttribute("disabled")) return;
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      this._fire();
    }
  };

  _onGlobalKey = (/** @type {KeyboardEvent} */ ev) => {
    if (this.hasAttribute("disabled")) return;
    if (!this._kb) return;
    // Don't intercept when typing in inputs/textareas
    const tag = /** @type {HTMLElement} */ (ev.target).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || /** @type {HTMLElement} */ (ev.target).isContentEditable) return;
    const matches =
      ev.key.toLowerCase() === this._kb.key &&
      !!ev.ctrlKey === this._kb.ctrl &&
      !!ev.shiftKey === this._kb.shift &&
      !!ev.altKey === this._kb.alt &&
      !!ev.metaKey === this._kb.meta;
    if (matches) {
      ev.preventDefault();
      this._fire();
    }
  };

  _fire() {
    const target = this._resolveTarget();
    this.dispatchEvent(
      new CustomEvent("rune:action", {
        detail: { id: this.id, target, action: this },
        bubbles: true,
      })
    );
  }
}

/**
 * Parse "ctrl+shift+a" into { key, ctrl, shift, alt, meta }.
 * @param {string} s
 */
function parseKeybinding(s) {
  const parts = s.toLowerCase().split("+").map((p) => p.trim());
  const key = parts[parts.length - 1];
  return {
    key,
    ctrl: parts.includes("ctrl") || parts.includes("control"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
    meta: parts.includes("meta") || parts.includes("cmd") || parts.includes("command"),
  };
}

/** @param {string} s */
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

if (!customElements.get("rune-action")) {
  customElements.define("rune-action", RuneAction);
}
