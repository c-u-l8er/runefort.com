// @ts-check
// <rune-marquee> — horizontal nav strip. Used for title bars, sub-title bars,
// or any horizontal menu. Multiple marquees per building/campus are supported.
//
// `scope` attribute selects which level's active state to highlight:
//   - scope="campus":   matches links whose href segment 0 equals the active campus
//   - scope="building": matches links whose href segment 1 equals the active building
//   - scope="floor":    matches links whose full href equals the active floor (default)
//
// If scope is omitted, the marquee infers from its position in the DOM:
//   - Outside any campus/building: defaults to "campus"
//   - Inside a campus, outside a building: defaults to "building"
//   - Inside a building: defaults to "floor"
//
// Authors put HTML inside (typically <a href="#..."> links). The marquee adds
// a `runefort-marquee-active` class to the link whose target matches the
// active state at this scope.

export class RuneMarquee extends HTMLElement {
  static get observedAttributes() {
    return ["scope"];
  }

  connectedCallback() {
    this.classList.add("runefort-marquee");

    queueMicrotask(() => {
      this._inferScope();
      this._autoFillLinks();
      this._bindAncestors();
      this._highlightActiveLink();
    });
  }

  /**
   * If the marquee has no manually-authored <a> children and we're in campus
   * or building scope, auto-generate links from the surrounding hierarchy.
   * Re-callable: removes prior auto-generated content before re-rendering, so
   * dynamically-added campuses/buildings appear automatically.
   *
   * Authors who write their own <a> children mark themselves with
   * data-runefort-authored="true" to suppress auto-fill in re-runs. Otherwise
   * any <a> seen on first connect is treated as authored.
   */
  _autoFillLinks() {
    // First-time check: if there are existing <a> children NOT marked as
    // auto-generated, treat them as authored and never auto-fill.
    const hasAuthored = Array.from(this.querySelectorAll('a[href^="#"]'))
      .some(a => a.getAttribute("data-runefort-auto") !== "true");
    if (hasAuthored && !this._autoFilled) {
      this._authored = true;
      return;
    }
    if (this._authored) return;

    if (this._scope === "campus") {
      const campuses = document.querySelectorAll("rune-campus");
      if (campuses.length === 0) return;
      this._renderAutoLinks(
        Array.from(campuses).map(c => {
          const id = /** @type {HTMLElement} */ (c).id;
          const label = c.getAttribute("label") || id;
          return { href: `#${id}`, label };
        })
      );
    } else if (this._scope === "building") {
      const campus = this.closest("rune-campus");
      if (!campus) return;
      const buildings = campus.querySelectorAll(":scope > rune-building");
      if (buildings.length === 0) return;
      this._renderAutoLinks(
        Array.from(buildings).map(b => {
          const id = /** @type {HTMLElement} */ (b).id;
          const label = b.getAttribute("label") || id;
          return { href: `#${campus.id}/${id}`, label };
        })
      );
    }
  }

  /**
   * @param {{href: string, label: string}[]} items
   */
  _renderAutoLinks(items) {
    // Remove previously-auto-generated content
    this.querySelectorAll('[data-runefort-auto="true"]').forEach(el => el.remove());
    const html = items
      .map(it => `<a href="${escapeHtml(it.href)}" data-runefort-auto="true">${escapeHtml(it.label)}</a>`)
      .join('<span class="runefort-marquee-sep" data-runefort-auto="true">·</span>');
    this.insertAdjacentHTML("beforeend", html);
    this._autoFilled = true;
  }

  /** Re-run auto-fill (called when hierarchy may have changed). */
  refresh() {
    this._autoFillLinks();
    this._highlightActiveLink();
  }

  disconnectedCallback() {
    this._unbindAncestors();
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === "scope") {
      this._inferScope();
      this._highlightActiveLink();
    }
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  _inferScope() {
    const explicit = this.getAttribute("scope");
    if (explicit === "campus" || explicit === "building" || explicit === "floor") {
      this._scope = explicit;
      return;
    }
    // Inference based on DOM position
    const inBuilding = !!this.closest("rune-building");
    const inCampus = !!this.closest("rune-campus");
    if (inBuilding) this._scope = "floor";
    else if (inCampus) this._scope = "building";
    else this._scope = "campus";
  }

  _bindAncestors() {
    this._unbindAncestors();
    /** @type {HTMLElement | null} */
    this._building = /** @type {HTMLElement | null} */ (this.closest("rune-building"));
    /** @type {HTMLElement | null} */
    this._campus = /** @type {HTMLElement | null} */ (this.closest("rune-campus"));

    if (this._building) {
      this._building.addEventListener("rune:floor", this._onChange);
    }
    if (this._campus) {
      this._campus.addEventListener("rune:building", this._onChange);
      this._campus.addEventListener("rune:campus", this._onChange);
    }
    // Top-level marquees (scope=campus) need to listen for hashchange too,
    // since they may be outside any campus element.
    if (this._scope === "campus") {
      window.addEventListener("hashchange", this._onChange);
    }
  }

  _unbindAncestors() {
    if (this._building) this._building.removeEventListener("rune:floor", this._onChange);
    if (this._campus) {
      this._campus.removeEventListener("rune:building", this._onChange);
      this._campus.removeEventListener("rune:campus", this._onChange);
    }
    window.removeEventListener("hashchange", this._onChange);
    this._building = null;
    this._campus = null;
  }

  /**
   * Highlight links matching the active state at this marquee's scope.
   *
   * For each <a href="#..."> link, parse the href into segments and compare
   * against the relevant URL hash segment for our scope.
   */
  _highlightActiveLink() {
    if (!this._scope) return;
    const hashSegments = window.location.hash.slice(1).split("/");
    const activeCampus = hashSegments[0] || this._defaultCampus();
    const activeBuilding = hashSegments[1];
    const activeFloor = hashSegments[2] || hashSegments[0]; // standalone floor

    this.querySelectorAll('a[href^="#"]').forEach((a) => {
      const href = /** @type {HTMLAnchorElement} */ (a).getAttribute("href") || "";
      const linkSegments = href.slice(1).split("/");
      let isActive = false;

      if (this._scope === "campus") {
        // Match if link's segment 0 matches the active campus
        isActive = linkSegments[0] === activeCampus;
      } else if (this._scope === "building") {
        // Match if link's segment 1 matches the active building
        // (and ideally segment 0 matches active campus, but allow either)
        if (linkSegments.length >= 2) {
          isActive =
            linkSegments[0] === activeCampus &&
            linkSegments[1] === activeBuilding;
        } else {
          isActive = linkSegments[0] === activeBuilding;
        }
      } else {
        // floor scope — match the full hash
        isActive =
          (this._building && this._campus &&
            linkSegments[0] === activeCampus &&
            linkSegments[1] === activeBuilding &&
            linkSegments[2] === this._building.activeFloor) ||
          (this._building && !this._campus && linkSegments[0] === this._building.activeFloor) ||
          (linkSegments.join("/") === hashSegments.join("/"));
      }

      a.classList.toggle("runefort-marquee-active", isActive);
    });
  }

  /**
   * If no campus is in the hash, the default-active campus is the first one
   * in the document (matches RuneCampus's _resolveActiveCampus logic).
   */
  _defaultCampus() {
    const first = document.querySelector("rune-campus");
    return first ? first.id : "";
  }

  _onChange = () => {
    this._highlightActiveLink();
  };
}

/** @param {string} s */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

if (!customElements.get("rune-marquee")) {
  customElements.define("rune-marquee", RuneMarquee);
}
