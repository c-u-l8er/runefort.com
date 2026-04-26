// @ts-check
// <rune-modal> — overlay modal primitive. Used for settings, prompt input,
// confirmations, etc. Has a backdrop, focus trap, escape-to-close.
//
// Usage:
//   const modal = document.createElement("rune-modal");
//   modal.setAttribute("title", "Settings");
//   modal.innerHTML = `<form>...</form>`;
//   document.body.appendChild(modal);
//   modal.open();
//
// Or declarative:
//   <rune-modal id="settings" title="Settings"> ... </rune-modal>
//   document.querySelector("#settings").open();
//
// Events:
//   rune:modal-open  — fires when shown
//   rune:modal-close — fires when dismissed (detail.reason: "escape" | "backdrop" | "explicit")

export class RuneModal extends HTMLElement {
  static get observedAttributes() {
    return ["title", "open"];
  }

  constructor() {
    super();
    /** @type {HTMLElement | null} */
    this._previousFocus = null;
  }

  connectedCallback() {
    if (this._built) return;
    this._built = true;
    this.classList.add("runefort-modal");
    if (!this.hasAttribute("aria-hidden")) this.setAttribute("aria-hidden", "true");
    this.setAttribute("role", "dialog");
    this.setAttribute("aria-modal", "true");

    // Wrap user content in a panel inside a backdrop
    const userContent = this.innerHTML;
    this.innerHTML = `
      <div class="runefort-modal-backdrop" data-runefort-backdrop></div>
      <div class="runefort-modal-panel">
        <header class="runefort-modal-header">
          <span class="runefort-modal-title"></span>
          <button class="runefort-modal-close" aria-label="Close" data-runefort-close>×</button>
        </header>
        <div class="runefort-modal-body">${userContent}</div>
      </div>
    `;

    this._titleEl = this.querySelector(".runefort-modal-title");
    this._panel = this.querySelector(".runefort-modal-panel");
    this._titleEl.textContent = this.getAttribute("title") || "";

    this.addEventListener("click", this._onClick);
    this.addEventListener("keydown", this._onKeyDown);

    if (this.hasAttribute("open")) this.open();
  }

  attributeChangedCallback(name, _old, val) {
    if (!this._built) return;
    if (name === "title" && this._titleEl) this._titleEl.textContent = val || "";
    if (name === "open") {
      if (val !== null) this.open();
      else this.close();
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  open() {
    if (this.hasAttribute("open")) return;
    this._previousFocus = /** @type {HTMLElement | null} */ (document.activeElement);
    this.setAttribute("open", "");
    this.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    queueMicrotask(() => this._focusFirst());
    this.dispatchEvent(new CustomEvent("rune:modal-open", { bubbles: true }));
  }

  close(reason = "explicit") {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (this._previousFocus && this._previousFocus.focus) {
      try { this._previousFocus.focus(); } catch (_) {}
    }
    this.dispatchEvent(new CustomEvent("rune:modal-close", { detail: { reason }, bubbles: true }));
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  _focusFirst() {
    const focusable = this.querySelector(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) /** @type {HTMLElement} */ (focusable).focus();
  }

  _onClick = (/** @type {MouseEvent} */ ev) => {
    const t = /** @type {HTMLElement} */ (ev.target);
    if (t.dataset.runefortBackdrop !== undefined) this.close("backdrop");
    if (t.dataset.runefortClose !== undefined) this.close("explicit");
  };

  _onKeyDown = (/** @type {KeyboardEvent} */ ev) => {
    if (ev.key === "Escape") {
      ev.stopPropagation();
      this.close("escape");
    }
    // Simple focus trap: cycle within the modal on Tab
    if (ev.key === "Tab") {
      const focusables = this.querySelectorAll(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = /** @type {HTMLElement} */ (focusables[0]);
      const last = /** @type {HTMLElement} */ (focusables[focusables.length - 1]);
      const active = document.activeElement;
      if (ev.shiftKey && active === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && active === last) {
        ev.preventDefault();
        first.focus();
      }
    }
  };
}

if (!customElements.get("rune-modal")) {
  customElements.define("rune-modal", RuneModal);
}
