// @ts-check
// <rune-source> — metadata holder. Child of <rune-editor>. Provides source
// content for one anchor. The element itself is invisible; <rune-editor>
// reads its `for`, `language`, and text content.
//
// Source content is taken verbatim from textContent. Authors who need to
// preserve indentation should wrap source in a <template> or use
// `data-source` attribute (CDATA-safe alternative).

export class RuneSource extends HTMLElement {
  static get observedAttributes() {
    return ["for", "language", "data-source"];
  }

  connectedCallback() {
    this.setAttribute("aria-hidden", "true");
    this.style.display = "none";
    // Notify parent editor (in case attributes changed before mount)
    const editor = this.closest("rune-editor");
    if (editor && typeof editor._invalidateSources === "function") {
      editor._invalidateSources();
    }
  }

  disconnectedCallback() {
    const editor = this.closest("rune-editor");
    if (editor && typeof editor._invalidateSources === "function") {
      editor._invalidateSources();
    }
  }

  attributeChangedCallback() {
    const editor = this.closest("rune-editor");
    if (editor && typeof editor._invalidateSources === "function") {
      editor._invalidateSources();
    }
  }

  /** @returns {string | null} */
  get for() {
    return this.getAttribute("for");
  }

  /** @returns {string} */
  get language() {
    return this.getAttribute("language") || "text";
  }

  /** @returns {string} */
  get source() {
    // Prefer data-source attribute (CDATA-safe), fall back to textContent.
    const attr = this.getAttribute("data-source");
    if (attr != null) return attr;
    return this.textContent || "";
  }
}

if (!customElements.get("rune-source")) {
  customElements.define("rune-source", RuneSource);
}
