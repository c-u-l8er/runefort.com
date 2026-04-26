// @ts-check
// <rune-claim> — file-system region binding. Nested inside <rune-room>.
// Mostly metadata-only; tooling reads `pattern` and optional `anchor`.

export class RuneClaim extends HTMLElement {
  static get observedAttributes() {
    return ["pattern", "anchor"];
  }

  connectedCallback() {
    // Visually hide claims by default — they are metadata, not display elements.
    // A consumer that wants to render claims can override the CSS rule.
    this.setAttribute("aria-hidden", "true");
  }

  /** @returns {string} */
  get pattern() {
    return this.getAttribute("pattern") || "";
  }

  /** @returns {string | null} */
  get anchor() {
    return this.getAttribute("anchor");
  }

  /** @returns {{ pattern: string, anchor: string | null }} */
  toJSON() {
    return { pattern: this.pattern, anchor: this.anchor };
  }
}

if (!customElements.get("rune-claim")) {
  customElements.define("rune-claim", RuneClaim);
}
