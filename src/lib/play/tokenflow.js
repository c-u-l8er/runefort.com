// Token flow simulation engine.
// Maps benchmark metrics to visual particle parameters and orchestrates flows.

import { setFlow, removeFlow, clearFlows } from "$lib/stores/tokenflow.svelte.js";

/**
 * Map raw metrics to visual parameters.
 * @param {number} tokensPerSecond
 * @param {number} latencyMs
 * @returns {{ speed: number, color: string }}
 */
export function metricsToVisual(tokensPerSecond, latencyMs) {
  const speed = Math.min(tokensPerSecond / 100, 1);
  const color =
    latencyMs < 200 ? "#22c55e" : latencyMs < 1000 ? "#f59e0b" : "#ef4444";
  return { speed, color };
}

/**
 * Start a token flow on a specific edge.
 * @param {string} edgeId
 * @param {{ tokensPerSecond?: number, latencyMs?: number, concurrency?: number }} config
 */
export function startFlow(edgeId, config = {}) {
  const { tokensPerSecond = 50, latencyMs = 300, concurrency = 3 } = config;
  const { speed, color } = metricsToVisual(tokensPerSecond, latencyMs);
  const particles = Math.min(Math.max(concurrency, 1), 8);
  setFlow(edgeId, { active: true, speed, color, particles });
}

/**
 * Stop flow on a specific edge.
 * @param {string} edgeId
 */
export function stopFlow(edgeId) {
  removeFlow(edgeId);
}

/**
 * Stop all flows.
 */
export function stopAllFlows() {
  clearFlows();
}

/**
 * Simulate a benchmark visualization across edges in sequence.
 * Lights up edges in phases matching PULSE loop phases.
 * @param {{ phases?: string[] }} manifest
 * @param {Array<{ id: string, data?: any }>} edges
 * @returns {() => void} cleanup function to stop the simulation
 */
export function simulateBenchmark(manifest, edges) {
  const phases = manifest?.phases || [
    "retrieve",
    "route",
    "act",
    "learn",
    "consolidate",
  ];
  const phaseColors = {
    retrieve: { tokensPerSecond: 80, latencyMs: 150 },
    route: { tokensPerSecond: 120, latencyMs: 100 },
    act: { tokensPerSecond: 60, latencyMs: 400 },
    learn: { tokensPerSecond: 40, latencyMs: 600 },
    consolidate: { tokensPerSecond: 30, latencyMs: 800 },
  };

  let cancelled = false;
  const edgesPerPhase = Math.max(1, Math.ceil(edges.length / phases.length));

  phases.forEach((phase, phaseIdx) => {
    const phaseEdges = edges.slice(
      phaseIdx * edgesPerPhase,
      (phaseIdx + 1) * edgesPerPhase,
    );
    const config = phaseColors[phase] || { tokensPerSecond: 50, latencyMs: 300 };

    setTimeout(() => {
      if (cancelled) return;
      for (const edge of phaseEdges) {
        startFlow(edge.id, { ...config, concurrency: 3 });
      }
    }, phaseIdx * 1200);
  });

  // Auto-stop after all phases complete
  const totalDuration = phases.length * 1200 + 4000;
  const stopTimer = setTimeout(() => {
    if (!cancelled) clearFlows();
  }, totalDuration);

  return () => {
    cancelled = true;
    clearTimeout(stopTimer);
    clearFlows();
  };
}
