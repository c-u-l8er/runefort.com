// @ts-check
// <rune-link> — adjacency declaration. Direct child of <rune-floor>.
// Drives keyboard navigation order; pure data — no visual rendering by default.

export class RuneLink extends HTMLElement {
  static get observedAttributes() {
    return ["from", "to", "kind", "bidirectional"];
  }

  connectedCallback() {
    this.setAttribute("aria-hidden", "true");
    // Notify parent floor that links may have changed
    this._notifyFloor();
  }

  attributeChangedCallback() {
    this._notifyFloor();
  }

  disconnectedCallback() {
    this._notifyFloor();
  }

  _notifyFloor() {
    const floor = this.closest("rune-floor");
    if (floor && typeof floor._invalidateLinks === "function") {
      floor._invalidateLinks();
    }
  }

  /** @returns {string | null} */
  get from() {
    return this.getAttribute("from");
  }

  /** @returns {string | null} */
  get to() {
    return this.getAttribute("to");
  }

  /** @returns {"adjacent" | "linked" | "nested"} */
  get kind() {
    const k = this.getAttribute("kind");
    return /** @type {"adjacent" | "linked" | "nested"} */ (
      k === "linked" || k === "nested" ? k : "adjacent"
    );
  }

  /** @returns {boolean} */
  get bidirectional() {
    return this.hasAttribute("bidirectional");
  }

  /** @returns {{ from: string | null, to: string | null, kind: string, bidirectional: boolean }} */
  toJSON() {
    return {
      from: this.from,
      to: this.to,
      kind: this.kind,
      bidirectional: this.bidirectional,
    };
  }
}

if (!customElements.get("rune-link")) {
  customElements.define("rune-link", RuneLink);
}
