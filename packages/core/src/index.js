// @ts-check
// @runefort/core — entry point. Importing this module registers all four
// custom elements as a side effect.

import { RuneFloor } from "./rune-floor.js";
import { RuneRoom } from "./rune-room.js";
import { RuneClaim } from "./rune-claim.js";
import { RuneLink } from "./rune-link.js";
import { RuneEditor } from "./rune-editor.js";
import { RuneSource } from "./rune-source.js";
import { RuneCampus } from "./rune-campus.js";
import { RuneBuilding } from "./rune-building.js";
import { RuneElevator } from "./rune-elevator.js";
import { RuneMarquee } from "./rune-marquee.js";
import { RuneModal } from "./rune-modal.js";
import { RuneThread, RuneMessage } from "./rune-thread.js";
import { RuneAction } from "./rune-action.js";

export {
  RuneFloor,
  RuneRoom,
  RuneClaim,
  RuneLink,
  RuneEditor,
  RuneSource,
  RuneCampus,
  RuneBuilding,
  RuneElevator,
  RuneMarquee,
  RuneModal,
  RuneThread,
  RuneMessage,
  RuneAction,
};

// Templates registry (room kinds + floor/building/campus templates)
export {
  roomKinds,
  getRoomKind,
  floorTemplates,
  buildingTemplates,
  campusTemplates,
} from "./templates.js";

// Runtime utilities (settings + OpenRouter + generation pipeline + thread store)
export {
  settings,
  RECOMMENDED_MODELS,
  chat,
  promptAddRoom,
  promptAddFloor,
  promptAddBuilding,
  promptAddCampus,
  promptRefineRoom,
  extractJson,
  validateRoom,
  generateRoomFor,
  generateFloorFor,
  generateBuildingFor,
  generateCampusFor,
  refineRoom,
  refineEntity,
  roomFromJson,
  floorFromJson,
  buildingFromJson,
  campusFromJson,
  threadStore,
  entityStore,
  restoreEntities,
} from "./runtime.js";
export { parseAnchor, buildUrl } from "./editor-handoff.js";
export { parseThreshold, classFor } from "./threshold.js";

export const VERSION = "0.1.0-alpha.1";

/**
 * Mount a runefort.json document into a host element. Replaces the host's
 * children with a fully-wired <rune-floor>.
 *
 * @param {HTMLElement} host
 * @param {object} layout  A runefort.json-shaped object
 * @returns {HTMLElement} The created <rune-floor> element
 */
export function mount(host, layout) {
  if (!host || !(host instanceof HTMLElement)) {
    throw new TypeError("mount(host, layout): host must be an HTMLElement");
  }
  if (!layout || typeof layout !== "object") {
    throw new TypeError("mount(host, layout): layout must be an object");
  }

  const floor = document.createElement("rune-floor");
  const grid = /** @type {any} */ (layout).grid || {};
  if (grid.columns) floor.setAttribute("columns", String(grid.columns));
  if (grid.rows && grid.rows !== "auto") floor.setAttribute("rows", String(grid.rows));
  if (/** @type {any} */ (layout).vocabulary) {
    floor.setAttribute("vocabulary", /** @type {any} */ (layout).vocabulary);
  }
  if (/** @type {any} */ (layout).editor) {
    floor.setAttribute("editor", /** @type {any} */ (layout).editor);
  }

  /** @type {any[]} */
  const rooms = /** @type {any} */ (layout).rooms || [];
  /** @type {any[]} */
  const claims = /** @type {any} */ (layout).claims || [];
  /** @type {any[]} */
  const neighbors = /** @type {any} */ (layout).neighbors || [];

  /** @type {Map<string, HTMLElement>} */
  const roomEls = new Map();
  for (const r of rooms) {
    const el = document.createElement("rune-room");
    if (r.id) el.id = r.id;
    if (Array.isArray(r.position)) el.setAttribute("position", `${r.position[0]},${r.position[1]}`);
    if (Array.isArray(r.size)) el.setAttribute("size", `${r.size[0]},${r.size[1]}`);
    if (r.label) el.setAttribute("label", r.label);
    if (r.anchor) el.setAttribute("anchor", r.anchor);
    if (r.state_class) el.setAttribute("state-class", r.state_class);
    if (r.meta && typeof r.meta === "object") /** @type {any} */ (el).meta = r.meta;
    floor.appendChild(el);
    roomEls.set(r.id, el);
  }

  for (const c of claims) {
    const parent = roomEls.get(c.room);
    if (!parent) continue;
    const el = document.createElement("rune-claim");
    if (c.pattern) el.setAttribute("pattern", c.pattern);
    if (c.anchor) el.setAttribute("anchor", c.anchor);
    parent.appendChild(el);
  }

  for (const n of neighbors) {
    const el = document.createElement("rune-link");
    if (n.from) el.setAttribute("from", n.from);
    if (n.to) el.setAttribute("to", n.to);
    if (n.kind) el.setAttribute("kind", n.kind);
    if (n.bidirectional) el.setAttribute("bidirectional", "");
    floor.appendChild(el);
  }

  // Apply state bindings AFTER the element is in the DOM so the floor's
  // setter has access to the room index.
  host.replaceChildren(floor);
  if (Array.isArray(/** @type {any} */ (layout).state_bindings)) {
    /** @type {any} */ (floor).bindings = /** @type {any} */ (layout).state_bindings;
  }

  return floor;
}
