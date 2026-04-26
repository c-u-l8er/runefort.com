// Workspace template registry. Single source of truth for the
// NewWorkspaceModal picker AND the NewManifestModal "From template" tab.
//
// Each entry has a `loader()` that returns the seed shape expected by
// persistence.saveFort — `{ loop_id, name, layout: { nodes, edges }, zoom_level }`
// — or `null` to signal "no seed" (the Empty template).

import { DEMO_MANIFESTS, generateFortFromManifest } from "$lib/fortGenerator.js";
import { getStarterManifest } from "$lib/play/builtins.js";

/**
 * Run the shared L1-campus generator over a manifest and package it into the
 * seed shape expected by saveFort / loadSavedFort.
 * @param {any} manifest
 * @param {string} contextId
 * @returns {{ loop_id: string, name: string, layout: { nodes: any[], edges: any[] }, zoom_level: number }}
 */
function bake(manifest, contextId) {
  // generateFortFromManifest takes a string level ("district" | "campus" |
  // "wing" | "room" | "rune"). A workspace's template is always a single
  // loop — campus view (L1) is the canonical landing.
  const { nodes, edges } = generateFortFromManifest("campus", manifest, contextId);
  return {
    loop_id: manifest.loop_id ?? contextId,
    name: manifest.label ?? manifest.loop_id ?? contextId,
    layout: { nodes, edges },
    zoom_level: 1,
  };
}

/**
 * @typedef {Object} WorkspaceTemplate
 * @property {string} id
 * @property {"empty"|"quickstart"|"ecosystem"} group
 * @property {string} name
 * @property {string} rune
 * @property {string} color
 * @property {string} description
 * @property {number} phaseCount
 * @property {() => Promise<ReturnType<typeof bake>|null>} loader
 */

/** @type {WorkspaceTemplate[]} */
export const WORKSPACE_TEMPLATES = [
  {
    id: "empty",
    group: "empty",
    name: "Empty",
    rune: "·",
    color: "#44423d",
    description: "Blank canvas. Right-click to add forts.",
    phaseCount: 0,
    loader: async () => null,
  },
  {
    id: "starter",
    group: "quickstart",
    name: "Starter Fort",
    rune: "ᚲ",
    color: "#e8a84c",
    description: "A 3-phase loop with policies and a clocktower.",
    phaseCount: 3,
    loader: async () => bake(await getStarterManifest(), "starter"),
  },
  ...Object.entries(DEMO_MANIFESTS).map(([id, m]) => ({
    id,
    group: /** @type {const} */ ("ecosystem"),
    name: m.label,
    rune: m.rune,
    color: m.color,
    description: `${m.role} · ${m.phases.length} phases`,
    phaseCount: m.phases.length,
    loader: async () => bake(m, id),
  })),
];

/** @param {string} id */
export function findTemplate(id) {
  return WORKSPACE_TEMPLATES.find((t) => t.id === id) ?? null;
}
