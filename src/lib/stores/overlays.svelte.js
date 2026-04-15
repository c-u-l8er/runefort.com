/** @typedef {import('$lib/types.js').OverlayKey} OverlayKey */

/** @type {import('$lib/types.js').Overlay[]} */
const overlayDefs = [
  { key: "structure",  label: "Structure",  shortcut: "S", active: true },
  { key: "flow",       label: "Flow",       shortcut: "F", active: false },
  { key: "thermal",    label: "Thermal",    shortcut: "T", active: false },
  { key: "temporal",   label: "Temporal",   shortcut: "P", active: false },
  { key: "diagnostic", label: "Diagnostic", shortcut: "D", active: false },
  { key: "rune",       label: "Rune",       shortcut: "R", active: false },
  { key: "confidence", label: "Confidence", shortcut: "C", active: false },
  { key: "topology",   label: "Topology",   shortcut: "K", active: false },
  { key: "assembly",   label: "Assembly",   shortcut: "A", active: false },
];

let overlays = $state(overlayDefs.map((o) => ({ ...o })));

export function getOverlays() {
  return overlays;
}

/** @param {OverlayKey} key */
export function toggleOverlay(key) {
  const overlay = overlays.find((o) => o.key === key);
  if (overlay && key !== "structure") {
    overlay.active = !overlay.active;
  }
}

/** @param {string} shortcut */
export function toggleByShortcut(shortcut) {
  const overlay = overlays.find((o) => o.shortcut === shortcut.toUpperCase());
  if (overlay && overlay.key !== "structure") {
    overlay.active = !overlay.active;
  }
}

/** @param {OverlayKey} key @returns {boolean} */
export function isOverlayActive(key) {
  return overlays.find((o) => o.key === key)?.active ?? false;
}

/** Returns a Set of active overlay keys */
export function activeOverlayKeys() {
  return new Set(overlays.filter((o) => o.active).map((o) => o.key));
}
