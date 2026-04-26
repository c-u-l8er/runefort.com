// @ts-check
// <rune-campus> — top-level container in the campus → building → floor → room
// hierarchy. Each campus is one tenant/org/app context. URL hash format:
//
//   #campus/building/floor
//
// Each level owns one segment of the path:
//   - campus owns segment 0 (sets/clears data-active on itself based on hash)
//   - building owns segment 1 (active building within the active campus)
//   - floor stays as segment 2 (managed by the active building)
//
// When the campus segment changes, the new campus auto-defaults its first
// building, and that building auto-defaults its first floor. This means
// `#prod` resolves to "prod's first building, that building's first floor".
//
// Multi-campus pages: place several <rune-campus> siblings on the same page.
// Only the one whose id matches hash segment 0 will display (CSS hides
// non-active campuses). If no hash is set, the first campus in DOM order
// wins.

export class RuneCampus extends HTMLElement {
  constructor() {
    super();
    /** @type {string | null} */
    this._activeBuilding = null;
    /** @type {Map<string, HTMLElement>} */
    this._buildingIndex = new Map();
  }

  connectedCallback() {
    this.classList.add("runefort-campus");
    queueMicrotask(() => {
      this._rebuildIndex();
      this._resolveActiveCampus();
      this._initActiveBuilding();
      this._applyActiveBuilding();
      window.addEventListener("hashchange", this._onHashChange);
    });
  }

  disconnectedCallback() {
    window.removeEventListener("hashchange", this._onHashChange);
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** @returns {boolean} */
  get isActiveCampus() {
    return this.hasAttribute("data-active");
  }

  /** @returns {string | null} */
  get activeBuilding() {
    return this._activeBuilding;
  }

  /** @returns {{ id: string, label: string, element: HTMLElement }[]} */
  get buildings() {
    /** @type {{ id: string, label: string, element: HTMLElement }[]} */
    const result = [];
    this._buildingIndex.forEach((el, id) => {
      result.push({
        id,
        label: el.getAttribute("label") || id,
        element: el,
      });
    });
    return result;
  }

  /**
   * Activate a building inside this campus. Updates URL hash segment 1.
   * Does nothing if this campus isn't itself active.
   * @param {string} buildingId
   */
  activate(buildingId) {
    if (!this._buildingIndex.has(buildingId)) return;
    if (this._activeBuilding === buildingId) return;
    const oldBuilding = this._activeBuilding;
    this._activeBuilding = buildingId;
    this._applyActiveBuilding();

    if (this.isActiveCampus) {
      // Only write hash if we're the active campus (otherwise we'd clobber
      // the URL for an inactive campus's user).
      const newHash = `#${this.id}/${this._activeBuilding}`;
      if (window.location.hash !== newHash) {
        try {
          history.replaceState(null, "", newHash);
        } catch (_) {
          window.location.hash = newHash.slice(1);
        }
      }
    }

    this.dispatchEvent(
      new CustomEvent("rune:building", {
        detail: { from: oldBuilding, to: buildingId },
        bubbles: true,
      })
    );
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  _rebuildIndex() {
    this._buildingIndex.clear();
    this.querySelectorAll(":scope > rune-building").forEach((b) => {
      const el = /** @type {HTMLElement} */ (b);
      if (el.id) this._buildingIndex.set(el.id, el);
    });
  }

  /**
   * Decide whether THIS campus is the active one based on URL hash.
   * If hash specifies a campus and it matches this id → active.
   * If hash is empty → first campus in DOM wins.
   * Otherwise → not active.
   */
  _resolveActiveCampus() {
    const segment0 = window.location.hash.slice(1).split("/")[0];
    if (segment0) {
      if (segment0 === this.id) this.setAttribute("data-active", "");
      else this.removeAttribute("data-active");
    } else {
      // No hash. First campus in DOM wins.
      const first = document.querySelector("rune-campus");
      if (first === this) this.setAttribute("data-active", "");
      else this.removeAttribute("data-active");
    }
  }

  _initActiveBuilding() {
    const segments = window.location.hash.slice(1).split("/");
    const segment1 = segments[1];
    if (segment1 && this._buildingIndex.has(segment1)) {
      this._activeBuilding = segment1;
      return;
    }
    // Default: first building in document order
    const first = this._buildingIndex.keys().next().value;
    if (first) this._activeBuilding = first;
  }

  _applyActiveBuilding() {
    this._buildingIndex.forEach((el, id) => {
      if (id === this._activeBuilding) el.setAttribute("data-active", "");
      else el.removeAttribute("data-active");
    });
  }

  _onHashChange = () => {
    const oldActive = this.isActiveCampus;
    this._resolveActiveCampus();
    const newActive = this.isActiveCampus;

    if (newActive) {
      const segments = window.location.hash.slice(1).split("/");
      const segment1 = segments[1];

      // Determine the target building:
      //   - If hash specifies a known building, use it.
      //   - If we just became active (transition) and no building specified,
      //     reset to first (don't reuse a stale active from prior visit).
      //   - Otherwise, leave alone.
      let target = null;
      if (segment1 && this._buildingIndex.has(segment1)) {
        target = segment1;
      } else if (!oldActive) {
        target = this._buildingIndex.keys().next().value || null;
      }

      if (target && target !== this._activeBuilding) {
        const prev = this._activeBuilding;
        this._activeBuilding = target;
        this._applyActiveBuilding();
        this.dispatchEvent(
          new CustomEvent("rune:building", {
            detail: { from: prev, to: target },
            bubbles: true,
          })
        );
      }
    }

    if (oldActive !== newActive) {
      this.dispatchEvent(
        new CustomEvent("rune:campus", {
          detail: { id: this.id, active: newActive },
          bubbles: true,
        })
      );
    }
  };
}

if (!customElements.get("rune-campus")) {
  customElements.define("rune-campus", RuneCampus);
}
