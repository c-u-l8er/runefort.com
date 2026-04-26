// @ts-check
// <rune-elevator> — vertical floor-switching sidebar. Auto-generates a list
// of floors from the parent <rune-building> and reflects active state.
//
// If the elevator has any pre-existing <a> children, those are honored
// instead of auto-generation (override mode). The elevator binds to a
// building via:
//   1. The `for` attribute (id of a building element), or
//   2. Closest ancestor <rune-building>

export class RuneElevator extends HTMLElement {
  static get observedAttributes() {
    return ["for"];
  }

  constructor() {
    super();
    /** @type {HTMLElement | null} */
    this._building = null;
    this._authoredOverride = false;
  }

  connectedCallback() {
    this.classList.add("runefort-elevator");
    // Detect override mode: if author placed children before connect.
    this._authoredOverride = this.children.length > 0 &&
      Array.from(this.children).some((c) => c.tagName !== "TEMPLATE");

    queueMicrotask(() => {
      this._bindBuilding();
      if (this._authoredOverride) {
        this._wireAuthoredLinks();
      } else {
        this._buildAutoList();
      }
      this._highlightActive();
    });
  }

  disconnectedCallback() {
    this._unbindBuilding();
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === "for") {
      this._unbindBuilding();
      this._bindBuilding();
      this._highlightActive();
    }
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  _bindBuilding() {
    this._unbindBuilding();
    const id = this.getAttribute("for");
    if (id) {
      this._building = /** @type {HTMLElement | null} */ (document.getElementById(id));
    } else {
      this._building = /** @type {HTMLElement | null} */ (this.closest("rune-building"));
    }
    if (this._building) {
      this._building.addEventListener("rune:floor", this._onFloorChange);
    }
  }

  _unbindBuilding() {
    if (this._building) {
      this._building.removeEventListener("rune:floor", this._onFloorChange);
    }
    this._building = null;
  }

  _buildAutoList() {
    if (!this._building) return;
    const floors = /** @type {any} */ (this._building).floors || [];

    const list = document.createElement("ul");
    list.className = "runefort-elevator-list";

    floors.forEach(
      /** @param {{ id: string, label: string, level: string | null }} f */
      (f) => {
        const li = document.createElement("li");
        li.className = "runefort-elevator-item";
        li.dataset.floor = f.id;

        const a = document.createElement("a");
        a.className = "runefort-elevator-link";
        a.href = `#${f.id}`;
        if (f.level) {
          const levelBadge = document.createElement("span");
          levelBadge.className = "runefort-elevator-level";
          levelBadge.textContent = f.level;
          a.appendChild(levelBadge);
        }
        const label = document.createElement("span");
        label.className = "runefort-elevator-label";
        label.textContent = f.label;
        a.appendChild(label);

        a.addEventListener("click", (e) => {
          e.preventDefault();
          /** @type {any} */ (this._building).activate(f.id);
        });

        li.appendChild(a);
        list.appendChild(li);
      }
    );

    this.replaceChildren(list);
  }

  _wireAuthoredLinks() {
    // For author-overridden elevators, intercept clicks on <a href="#floor-id">
    // and route them through the building's activate() method. Without this,
    // clicks would still work via hashchange — but we want consistent behavior
    // (replaceState, no scroll-jump).
    this.querySelectorAll('a[href^="#"]').forEach((a) => {
      const href = /** @type {HTMLAnchorElement} */ (a).getAttribute("href") || "";
      const id = href.slice(1);
      if (!id) return;
      a.addEventListener("click", (e) => {
        if (this._building && /** @type {any} */ (this._building)._floorIndex?.has(id)) {
          e.preventDefault();
          /** @type {any} */ (this._building).activate(id);
        }
      });
    });
  }

  _highlightActive() {
    if (!this._building) return;
    const active = /** @type {any} */ (this._building).activeFloor;
    // Auto-generated list: highlight by data-floor
    this.querySelectorAll(".runefort-elevator-item").forEach((li) => {
      const floor = /** @type {HTMLElement} */ (li).dataset.floor;
      li.classList.toggle("runefort-elevator-active", floor === active);
    });
    // Authored links: highlight matching anchors
    this.querySelectorAll('a[href^="#"]').forEach((a) => {
      const href = /** @type {HTMLAnchorElement} */ (a).getAttribute("href") || "";
      const id = href.slice(1);
      a.classList.toggle("runefort-elevator-active", id === active);
    });
  }

  _onFloorChange = () => {
    this._highlightActive();
  };

  /** Re-build the elevator list (call after adding/removing floors). */
  refresh() {
    if (!this._building) this._bindBuilding();
    if (!this._authoredOverride) this._buildAutoList();
    this._highlightActive();
  }
}

if (!customElements.get("rune-elevator")) {
  customElements.define("rune-elevator", RuneElevator);
}
