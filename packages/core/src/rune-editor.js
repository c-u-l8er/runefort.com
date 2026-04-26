// @ts-check
// <rune-editor> — in-browser code viewer. Pairs with a <rune-floor> via the
// `for` attribute (or auto-binds to the immediately preceding floor sibling).
// Listens for `rune:open` events; intercepts the default action and renders
// the source for the matched anchor.
//
// Source content comes from <rune-source for="<anchor>" language="..."> children.
// If `window.hljs` (highlight.js) is loaded, syntax highlighting is applied
// automatically. Without it, the viewer falls back to clean monospace output.

import { parseAnchor } from "./editor-handoff.js";

export class RuneEditor extends HTMLElement {
  static get observedAttributes() {
    return ["for"];
  }

  constructor() {
    super();
    /** @type {Map<string, { language: string, source: string }>} */
    this._sources = new Map();
    /** @type {string | null} */
    this._currentAnchor = null;
    /** @type {HTMLElement | null} */
    this._floor = null;
    this._sourcesDirty = true;
    this._shellBuilt = false;
  }

  connectedCallback() {
    this.classList.add("runefort-editor");
    this._buildShell();
    queueMicrotask(() => {
      this._indexSources();
      this._bindFloor();
      if (!this._currentAnchor) this._renderEmpty();
    });
  }

  disconnectedCallback() {
    this._unbindFloor();
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === "for") this._bindFloor();
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** @param {string} anchor */
  show(anchor) {
    this._currentAnchor = anchor;
    if (this._sourcesDirty) this._indexSources();
    const data = this._sources.get(anchor);
    this._renderHeader(anchor);
    if (data) this._renderSource(data.source, data.language);
    else this._renderMissing(anchor);
  }

  clear() {
    this._currentAnchor = null;
    this._renderEmpty();
  }

  // ─── Invalidation ───────────────────────────────────────────────────────

  _invalidateSources() {
    this._sourcesDirty = true;
    queueMicrotask(() => {
      if (this._sourcesDirty) this._indexSources();
      // Re-render current anchor if its source changed
      if (this._currentAnchor) this.show(this._currentAnchor);
    });
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  _bindFloor() {
    this._unbindFloor();
    const id = this.getAttribute("for");
    /** @type {HTMLElement | null} */
    let target = null;
    if (id) {
      target = /** @type {HTMLElement | null} */ (document.getElementById(id));
    } else {
      // Auto-bind: closest ancestor building first (multi-floor case),
      // then a preceding sibling rune-floor (single-floor case).
      target = /** @type {HTMLElement | null} */ (this.closest("rune-building"));
      if (!target) {
        let prev = this.previousElementSibling;
        while (prev) {
          if (prev.tagName === "RUNE-FLOOR") {
            target = /** @type {HTMLElement} */ (prev);
            break;
          }
          prev = prev.previousElementSibling;
        }
      }
    }
    // Accept any element. `rune:open` bubbles from rune-room, so any
    // ancestor element (building, floor, body) can serve as the listener.
    if (target) {
      this._floor = target;
      target.addEventListener("rune:open", this._onOpen);
    }
  }

  _unbindFloor() {
    if (this._floor) {
      this._floor.removeEventListener("rune:open", this._onOpen);
      this._floor = null;
    }
  }

  _indexSources() {
    this._sources.clear();
    this.querySelectorAll("rune-source").forEach((s) => {
      const src = /** @type {any} */ (s);
      const anchor = src.for;
      if (!anchor) return;
      this._sources.set(anchor, {
        language: src.language,
        source: src.source,
      });
    });
    this._sourcesDirty = false;
  }

  _onOpen = (/** @type {CustomEvent} */ ev) => {
    // Intercept default vscode-handoff and render in the viewer instead.
    ev.preventDefault();
    if (ev.detail && ev.detail.anchor) {
      this.show(ev.detail.anchor);
    }
  };

  _buildShell() {
    if (this._shellBuilt) return;
    this._shellBuilt = true;

    this._header = document.createElement("div");
    this._header.className = "runefort-editor-header";

    this._body = document.createElement("div");
    this._body.className = "runefort-editor-body";

    // Move <rune-source> children into a hidden host so they don't interleave
    // with shell DOM. They remain in light DOM (queryable) but invisible.
    const hidden = document.createElement("div");
    hidden.className = "runefort-editor-sources";
    hidden.style.display = "none";
    Array.from(this.querySelectorAll(":scope > rune-source")).forEach((s) =>
      hidden.appendChild(s)
    );

    this.appendChild(this._header);
    this.appendChild(this._body);
    this.appendChild(hidden);
  }

  _renderEmpty() {
    if (!this._header) return;
    this._header.innerHTML = `<span class="runefort-editor-path-empty">no file selected</span>`;
    this._body.innerHTML = `<div class="runefort-editor-placeholder">click a room to view its source</div>`;
  }

  /** @param {string} anchor */
  _renderHeader(anchor) {
    const { path, line } = parseAnchor(anchor);
    this._header.innerHTML =
      `<span class="runefort-editor-path">${escapeHtml(path)}</span>` +
      (line != null ? `<span class="runefort-editor-line-ref">:${line}</span>` : "") +
      `<span class="runefort-editor-ro">read-only</span>`;
  }

  /**
   * @param {string} source
   * @param {string} language
   */
  _renderSource(source, language) {
    const lines = source.split("\n");

    // Optional highlighting via window.hljs (highlight.js). Graceful fallback
    // if absent.
    let highlightedLines = null;
    const hljs = /** @type {any} */ (window).hljs;
    if (hljs && typeof hljs.highlight === "function") {
      try {
        const result = hljs.highlight(source, { language, ignoreIllegals: true });
        highlightedLines = result.value.split("\n");
      } catch (_) {
        highlightedLines = null;
      }
    }

    const rows = lines.map((line, i) => {
      const code = highlightedLines ? highlightedLines[i] : escapeHtml(line);
      const ln = String(i + 1).padStart(2, " ");
      return `<div class="runefort-editor-row"><span class="runefort-editor-ln">${ln}</span><span class="runefort-editor-src">${code || " "}</span></div>`;
    });

    this._body.innerHTML = `<pre class="runefort-editor-pre language-${escapeHtml(language)}"><code>${rows.join("")}</code></pre>`;
  }

  /** @param {string} anchor */
  _renderMissing(anchor) {
    this._body.innerHTML = `<div class="runefort-editor-placeholder">no source available for <code>${escapeHtml(anchor)}</code></div>`;
  }
}

/** @param {string} s */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

if (!customElements.get("rune-editor")) {
  customElements.define("rune-editor", RuneEditor);
}
