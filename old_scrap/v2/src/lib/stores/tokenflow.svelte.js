// Svelte 5 rune store for token flow animation state.
// Uses object wrapper pattern for cross-component reactivity.

let flowState = $state({
  /** @type {Record<string, { active: boolean, speed: number, color: string, particles: number }>} */
  flows: {},
});

export function getFlows() {
  return flowState.flows;
}

/** @param {string} edgeId @param {{ active: boolean, speed: number, color: string, particles: number }} flow */
export function setFlow(edgeId, flow) {
  flowState.flows[edgeId] = flow;
}

export function removeFlow(edgeId) {
  delete flowState.flows[edgeId];
}

export function clearFlows() {
  flowState.flows = {};
}

export function isFlowing() {
  return Object.values(flowState.flows).some((f) => f.active);
}
