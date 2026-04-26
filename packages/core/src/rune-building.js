// @ts-check
// <rune-building> — multi-floor container. Manages which floor is active,
// syncs the active floor to/from URL hash, and provides a public API for
// elevators and marquees to subscribe to floor changes.
//
// Hash routing depends on hierarchy:
//   - Standalone:        #floor-id
//   - Inside <rune-campus>: #campus/building/floor
//
// The building reads/writes its own segment of the hash without clobbering
// segments owned by ancestors (campus) or siblings.
//
// Layout discovery: child <rune-floor> elements (direct descendants only)
// become the floors of the building, in document order.

export class RuneBuilding extends HTMLElement {
  static get observedAttributes() {
    return ["mode", "active-floor"];
  }

  constructor() {
    super();
    /** @type {string | null} */
    this._activeFloor = null;
    /** @type {Map<string, HTMLElement>} */
    this._floorIndex = new Map();
    /** @type {HTMLElement | null} */
    this._campus = null;
  }

  connectedCallback() {
    this.classList.add("runefort-building");
    if (!this.hasAttribute("mode")) this.setAttribute("mode", "switch");

    queueMicrotask(() => {
      this._campus = /** @type {HTMLElement | null} */ (this.closest("rune-campus"));
      this._rebuildIndex();
      this._initActiveFloor();
      this._applyActiveFloor();
      window.addEventListener("hashchange", this._onHashChange);
    });
  }

  disconnectedCallback() {
    window.removeEventListener("hashchange", this._onHashChange);
  }

  attributeChangedCallback(name, _oldVal, newVal) {
    if (!this.isConnected) return;
    if (name === "active-floor" && newVal && newVal !== this._activeFloor) {
      this.activate(newVal);
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** @returns {"switch" | "scroll"} */
  get mode() {
    const m = this.getAttribute("mode");
    return m === "scroll" ? "scroll" : "switch";
  }

  /** @returns {string | null} */
  get activeFloor() {
    return this._activeFloor;
  }

  /** @returns {{ id: string, label: string, level: string | null, element: HTMLElement }[]} */
  get floors() {
    /** @type {{ id: string, label: string, level: string | null, element: HTMLElement }[]} */
    const result = [];
    this._floorIndex.forEach((el, id) => {
      result.push({
        id,
        label: el.getAttribute("label") || id,
        level: el.getAttribute("data-level") || null,
        element: el,
      });
    });
    return result;
  }

  /**
   * Activate a floor by id. No-op if id is not registered.
   * Writes URL hash according to the building's hierarchy (with or without campus).
   * @param {string} floorId
   */
  activate(floorId) {
    if (!this._floorIndex.has(floorId)) return;
    if (this._activeFloor === floorId) return;
    const oldFloor = this._activeFloor;
    this._activeFloor = floorId;
    this._applyActiveFloor();
    this._writeHash();

    this.dispatchEvent(
      new CustomEvent("rune:floor", {
        detail: { from: oldFloor, to: floorId },
        bubbles: true,
      })
    );
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  _rebuildIndex() {
    this._floorIndex.clear();
    this.querySelectorAll(":scope > rune-floor").forEach((f) => {
      const el = /** @type {HTMLElement} */ (f);
      if (el.id) this._floorIndex.set(el.id, el);
    });
  }

  /** Get the floor segment from the current URL hash. */
  _readFloorFromHash() {
    const segments = window.location.hash.slice(1).split("/");
    if (this._campus) {
      // Inside campus: hash format is #campus/building/floor (segments[2])
      const campusSeg = segments[0];
      const buildingSeg = segments[1];
      const floorSeg = segments[2];
      // Only honor the floor segment if our campus AND our building are active
      if (
        campusSeg === this._campus.id &&
        buildingSeg === this.id &&
        floorSeg
      ) {
        return floorSeg;
      }
      return null;
    }
    // Standalone: hash is just #floor
    return segments[0] || null;
  }

  _initActiveFloor() {
    const fromHash = this._readFloorFromHash();
    if (fromHash && this._floorIndex.has(fromHash)) {
      this._activeFloor = fromHash;
      return;
    }
    const attr = this.getAttribute("active-floor");
    if (attr && this._floorIndex.has(attr)) {
      this._activeFloor = attr;
      return;
    }
    const first = this._floorIndex.keys().next().value;
    if (first) this._activeFloor = first;
  }

  _applyActiveFloor() {
    this._floorIndex.forEach((el, id) => {
      if (id === this._activeFloor) el.setAttribute("data-active", "");
      else el.removeAttribute("data-active");
    });
  }

  /**
   * Write the floor segment to the URL hash. Preserves campus and building
   * segments. Only writes if this building is currently active in its campus
   * (or always, if standalone).
   */
  _writeHash() {
    let newHash;
    if (this._campus) {
      // Don't write hash if our campus or building isn't active. The hash
      // belongs to whichever building+campus is currently displayed.
      const campusActive = this._campus.hasAttribute("data-active");
      const weAreActive = this.hasAttribute("data-active");
      if (!campusActive || !weAreActive) return;
      newHash = `#${this._campus.id}/${this.id}/${this._activeFloor}`;
    } else {
      newHash = `#${this._activeFloor}`;
    }
    if (window.location.hash !== newHash) {
      try {
        history.replaceState(null, "", newHash);
      } catch (_) {
        window.location.hash = newHash.slice(1);
      }
    }
  }

  _onHashChange = () => {
    const fromHash = this._readFloorFromHash();
    if (fromHash && this._floorIndex.has(fromHash) && fromHash !== this._activeFloor) {
      this.activate(fromHash);
    }
  };
}

if (!customElements.get("rune-building")) {
  customElements.define("rune-building", RuneBuilding);
}
