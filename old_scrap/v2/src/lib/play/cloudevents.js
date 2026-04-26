// CloudEvents v1 envelope builder for PULSE cross-loop tokens.
// Used by factory-loop.js to emit typed signals between loops.

/**
 * Create a CloudEvents v1 envelope.
 * @param {string} type - e.g. "org.pulse.outcome_signal"
 * @param {string} source - e.g. "runefort.dark_factory"
 * @param {object} data
 * @returns {object} CloudEvents v1 envelope
 */
export function createCloudEvent(type, source, data) {
  return {
    specversion: "1.0",
    id: crypto.randomUUID(),
    type,
    source,
    time: new Date().toISOString(),
    datacontenttype: "application/json",
    data,
  };
}

const SOURCE = "runefort.dark_factory";

/**
 * Emit an OutcomeSignal token.
 * @param {'success'|'partial_success'|'failure'|'timeout'} status
 * @param {string[]} causalParents - node/run IDs that informed this outcome
 * @param {object} [evidence]
 * @returns {object} CloudEvent
 */
export function emitOutcomeSignal(status, causalParents, evidence = {}) {
  return createCloudEvent("org.pulse.outcome_signal", SOURCE, {
    status,
    causal_parents: causalParents,
    evidence,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit a ReputationUpdate token.
 * @param {string} participantId
 * @param {number} delta - positive or negative reputation change
 * @param {object} evidence
 * @returns {object} CloudEvent
 */
export function emitReputationUpdate(participantId, delta, evidence) {
  return createCloudEvent("org.pulse.reputation_update", SOURCE, {
    participant_id: participantId,
    delta,
    evidence,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit a ConsolidationEvent token.
 * @param {string[]} mergedIds
 * @param {string[]} prunedIds
 * @param {string[]} promotedIds
 * @returns {object} CloudEvent
 */
export function emitConsolidationEvent(mergedIds, prunedIds, promotedIds) {
  return createCloudEvent("org.pulse.consolidation_event", SOURCE, {
    merged_node_ids: mergedIds,
    pruned_node_ids: prunedIds,
    promoted_node_ids: promotedIds,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit a TopologyContext token.
 * @param {object} sccAnalysis
 * @param {number} kappaValue
 * @param {string} routingDecision
 * @returns {object} CloudEvent
 */
export function emitTopologyContext(sccAnalysis, kappaValue, routingDecision) {
  return createCloudEvent("org.pulse.topology_context", SOURCE, {
    scc_analysis: sccAnalysis,
    kappa_value: kappaValue,
    routing_decision: routingDecision,
  });
}

/**
 * Emit a DeliberationResult token.
 * @param {string} verdict
 * @param {object[]} evidenceChain
 * @param {string} [consensusTimestamp]
 * @returns {object} CloudEvent
 */
export function emitDeliberationResult(verdict, evidenceChain, consensusTimestamp) {
  return createCloudEvent("org.pulse.deliberation_result", SOURCE, {
    verdict,
    evidence_chain: evidenceChain,
    consensus_timestamp: consensusTimestamp || new Date().toISOString(),
  });
}
