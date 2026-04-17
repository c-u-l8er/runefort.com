/**
 * Overlay Effects — computes visual styles for nodes/edges based on active overlays.
 * Each overlay interprets node.data fields to produce colors, glows, and badges.
 */

/** @typedef {'thermal'|'temporal'|'diagnostic'|'rune'|'confidence'|'topology'|'assembly'} EffectOverlay */

/**
 * Thermal overlay: maps activity (0–1) to a cold→hot color ramp.
 * @param {number} activity - 0 to 1
 * @returns {{ bg: string, border: string, glow: string }}
 */
export function thermalStyle(activity = 0) {
  const a = Math.max(0, Math.min(1, activity));
  if (a > 0.75) return { bg: "rgba(232, 90, 90, 0.12)", border: "#e85a5a", glow: "0 0 12px rgba(232, 90, 90, 0.4)" };
  if (a > 0.5)  return { bg: "rgba(232, 168, 76, 0.08)", border: "#e8a84c", glow: "0 0 8px rgba(232, 168, 76, 0.3)" };
  if (a > 0.25) return { bg: "rgba(106, 196, 140, 0.06)", border: "#6ac48c", glow: "0 0 6px rgba(106, 196, 140, 0.2)" };
  return { bg: "rgba(91, 106, 138, 0.05)", border: "#5b6a8a", glow: "none" };
}

/**
 * Thermal edge color based on endpoints.
 * @param {number} activity - average activity of source+target
 * @returns {string}
 */
export function thermalEdgeColor(activity = 0) {
  if (activity > 0.75) return "#e85a5a";
  if (activity > 0.5) return "#e8a84c";
  if (activity > 0.25) return "#6ac48c";
  return "#5b6a8a";
}

/**
 * Confidence overlay: maps confidence (0–1) to green/yellow/red.
 * @param {number} confidence
 * @returns {{ bg: string, border: string, glow: string, barColor: string }}
 */
export function confidenceStyle(confidence = 0.5) {
  const c = Math.max(0, Math.min(1, confidence));
  if (c > 0.8)  return { bg: "rgba(106, 196, 140, 0.1)", border: "#6ac48c", glow: "0 0 8px rgba(106, 196, 140, 0.3)", barColor: "#6ac48c" };
  if (c > 0.6)  return { bg: "rgba(232, 168, 76, 0.08)", border: "#e8a84c", glow: "0 0 6px rgba(232, 168, 76, 0.2)", barColor: "#e8a84c" };
  if (c > 0.4)  return { bg: "rgba(232, 168, 76, 0.06)", border: "#c4956a", glow: "none", barColor: "#c4956a" };
  return { bg: "rgba(232, 90, 90, 0.08)", border: "#e85a5a", glow: "0 0 8px rgba(232, 90, 90, 0.25)", barColor: "#e85a5a" };
}

/**
 * Temporal overlay: colors by PULSE phase kind.
 * @param {string} kind - phase kind (retrieve, route, act, learn, consolidate, etc.)
 * @param {number} timeout - timeout_ms
 * @returns {{ border: string, badge: string, urgency: 'fast'|'normal'|'slow' }}
 */
export function temporalStyle(kind = "retrieve", timeout = 5000) {
  const kindColors = {
    retrieve: "#e8a84c", route: "#8a9a9e", act: "#6ac48c",
    learn: "#c4956a", consolidate: "#5b6a8a", deliberate: "#e85a5a",
    observe: "#e85a5a", diagnose: "#e85a5a", compose: "#e8a84c",
    reflect: "#5b6a8a", interact: "#6ac48c",
  };
  const border = kindColors[kind] || "#7a7770";
  const urgency = timeout < 2000 ? "fast" : timeout > 15000 ? "slow" : "normal";
  return { border, badge: `${timeout}ms`, urgency };
}

/**
 * Temporal edge style — pulsing for fast, dashed for slow.
 * @param {string} urgency
 * @returns {{ strokeDasharray: string, stroke: string }}
 */
export function temporalEdgeStyle(urgency = "normal") {
  if (urgency === "fast") return { strokeDasharray: "none", stroke: "#e8a84c" };
  if (urgency === "slow") return { strokeDasharray: "8 4", stroke: "#5b6a8a" };
  return { strokeDasharray: "none", stroke: "#7a7770" };
}

/**
 * Diagnostic overlay: generates a synthetic PRISM-like score from node data.
 * @param {object} data - node data
 * @returns {{ score: number, grade: string, color: string, dimensions: { label: string, value: number }[] }}
 */
export function diagnosticStyle(data = {}) {
  const conf = data.confidence ?? 0.5;
  const activity = data.activity ?? 0.5;
  const accessCount = data.accessCount ?? 10;
  const decayRate = data.decayRate ?? 0.01;

  // Synthetic CL dimensions
  const retention = Math.min(1, conf * 0.7 + (1 - decayRate * 50) * 0.3);
  const plasticity = Math.min(1, activity * 0.6 + (accessCount > 20 ? 0.4 : accessCount / 50));
  const stability = Math.min(1, (1 - decayRate * 100) * 0.5 + conf * 0.5);
  const score = +(retention * 0.4 + plasticity * 0.3 + stability * 0.3).toFixed(2);

  let grade, color;
  if (score > 0.8) { grade = "A"; color = "#6ac48c"; }
  else if (score > 0.6) { grade = "B"; color = "#e8a84c"; }
  else if (score > 0.4) { grade = "C"; color = "#c4956a"; }
  else { grade = "D"; color = "#e85a5a"; }

  return {
    score, grade, color,
    dimensions: [
      { label: "RET", value: +retention.toFixed(2) },
      { label: "PLA", value: +plasticity.toFixed(2) },
      { label: "STA", value: +stability.toFixed(2) },
    ],
  };
}

/**
 * Topology overlay: detect κ-relevant nodes (gates, cyclic paths).
 * @param {object} data - node data
 * @param {string} nodeType - node type
 * @returns {{ isKappaNode: boolean, isCyclic: boolean, border: string, glow: string }}
 */
export function topologyStyle(data = {}, nodeType = "") {
  const isKappaNode = data.label?.includes("κ") || data.detail?.includes("κ") || false;
  const isCyclic = data.routing === "deliberate" || isKappaNode;
  if (isCyclic) {
    return { isKappaNode, isCyclic, border: "#e85a5a", glow: "0 0 10px rgba(232, 90, 90, 0.35)" };
  }
  if (nodeType === "gate" || nodeType === "bridge") {
    return { isKappaNode, isCyclic, border: "#c4956a", glow: "0 0 6px rgba(196, 149, 106, 0.2)" };
  }
  return { isKappaNode, isCyclic, border: "#44423d", glow: "none" };
}

/**
 * Rune overlay: emphasizes operation weight and causal chains.
 * @param {object} data - node data
 * @returns {{ weight: number, glyphScale: number, border: string }}
 */
export function runeStyle(data = {}) {
  const conf = data.confidence ?? 0.5;
  const accessCount = data.accessCount ?? 10;
  const weight = Math.min(1, conf * 0.5 + Math.min(accessCount, 50) / 100);
  const glyphScale = 0.8 + weight * 0.6; // 0.8x to 1.4x
  const border = weight > 0.7 ? "#c4956a" : weight > 0.4 ? "#7a7770" : "#44423d";
  return { weight, glyphScale, border };
}

/**
 * Assembly overlay: dark factory pipeline status visualization.
 * @param {object} data - node data with pipeline fields
 * @returns {{ bg: string, border: string, glow: string, buildStatus: string, trustScore: number, deployStage: string, specVersion: string }}
 */
export function assemblyStyle(data = {}) {
  const buildStatus = data.buildStatus ?? "unknown";
  const trustScore = Math.max(0, Math.min(100, data.trustScore ?? 0));
  const deployStage = data.deployStage ?? "none";
  const specVersion = data.specVersion ?? "–";

  // Build status colors
  const statusColors = {
    parsing:    { bg: "rgba(74, 154, 222, 0.08)", border: "#4a9ade", glow: "0 0 8px rgba(74, 154, 222, 0.3)" },
    generating: { bg: "rgba(232, 168, 76, 0.08)", border: "#e8a84c", glow: "0 0 8px rgba(232, 168, 76, 0.3)" },
    compiling:  { bg: "rgba(232, 136, 76, 0.08)", border: "#e8884c", glow: "0 0 8px rgba(232, 136, 76, 0.3)" },
    succeeded:  { bg: "rgba(106, 196, 140, 0.08)", border: "#6ac48c", glow: "0 0 8px rgba(106, 196, 140, 0.3)" },
    failed:     { bg: "rgba(232, 90, 90, 0.08)", border: "#e85a5a", glow: "0 0 10px rgba(232, 90, 90, 0.4)" },
    unknown:    { bg: "rgba(91, 106, 138, 0.05)", border: "#5b6a8a", glow: "none" },
  };
  const { bg, border, glow } = statusColors[buildStatus] || statusColors.unknown;

  return { bg, border, glow, buildStatus, trustScore, deployStage, specVersion };
}

/**
 * Assembly overlay: deploy stage border color.
 * @param {string} stage
 * @returns {string}
 */
export function assemblyDeployColor(stage = "none") {
  if (stage === "production") return "#6ac48c";
  if (stage === "canary") return "#e8a84c";
  if (stage === "staging") return "#c4956a";
  return "#5b6a8a";
}

/**
 * Assembly overlay: trust score glow intensity.
 * @param {number} trustScore - 0 to 100
 * @returns {string}
 */
export function assemblyTrustGlow(trustScore = 0) {
  const t = Math.max(0, Math.min(100, trustScore));
  const intensity = (t / 100 * 0.5).toFixed(2);
  if (t > 80) return `0 0 14px rgba(106, 196, 140, ${intensity})`;
  if (t > 50) return `0 0 10px rgba(232, 168, 76, ${intensity})`;
  if (t > 20) return `0 0 6px rgba(196, 149, 106, ${intensity})`;
  return "none";
}

/**
 * Consolidation events — spec §6.2 Phase 5. Maps a consolidation event
 * kind to the class applied for its animation lifetime. Keyframes are
 * defined globally in `src/app.css` (`@keyframes decay-sweep`, etc.).
 *
 * @typedef {'decay'|'prune'|'merge'|'strengthen'|'promote'|'abstract'} ConsolidationEvent
 */

/** @type {Record<ConsolidationEvent, string>} */
const CONSOLIDATION_CLASS = {
  decay: "consolidate-decay",
  prune: "consolidate-prune",
  merge: "consolidate-merge",
  strengthen: "consolidate-strengthen",
  promote: "consolidate-promote",
  abstract: "consolidate-abstract",
};

/** @type {Record<ConsolidationEvent, number>} animation duration in ms */
export const CONSOLIDATION_DURATION = {
  decay: 1100,
  prune: 900,
  merge: 1200,
  strengthen: 1400,
  promote: 1000,
  abstract: 1300,
};

/**
 * Returns the class name for a consolidation event, or empty string.
 * @param {ConsolidationEvent | undefined | null} event
 * @returns {string}
 */
export function consolidationClass(event) {
  if (!event) return "";
  return CONSOLIDATION_CLASS[event] || "";
}

/**
 * Assembly overlay: build tile color by status.
 * @param {string} status - succeeded|failed|pending|running
 * @returns {{ bg: string, border: string }}
 */
export function buildTileStyle(status = "pending") {
  if (status === "succeeded") return { bg: "rgba(106, 196, 140, 0.12)", border: "#6ac48c" };
  if (status === "failed") return { bg: "rgba(232, 90, 90, 0.12)", border: "#e85a5a" };
  if (status === "running") return { bg: "rgba(74, 154, 222, 0.1)", border: "#4a9ade" };
  return { bg: "rgba(91, 106, 138, 0.06)", border: "#5b6a8a" };
}

/**
 * Assembly overlay: test tile color by pass/fail.
 * @param {boolean} passed
 * @returns {{ bg: string, border: string }}
 */
export function testTileStyle(passed = true) {
  if (passed) return { bg: "rgba(106, 196, 140, 0.12)", border: "#6ac48c" };
  return { bg: "rgba(232, 90, 90, 0.12)", border: "#e85a5a" };
}
