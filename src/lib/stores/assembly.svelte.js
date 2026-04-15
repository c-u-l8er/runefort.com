// Svelte 5 rune store for dark factory assembly pipeline data.
// Manages per-fort pipeline status fetched from Agentelic and FleetPrompt MCP.

import { agentStatus } from "$lib/play/agentelic-client.js";
import { registryTrust } from "$lib/play/fleetprompt-client.js";

/**
 * @typedef {Object} Build
 * @property {string} id
 * @property {'succeeded'|'failed'|'pending'|'running'} status
 * @property {string} version
 * @property {number} duration - ms
 * @property {string} timestamp - ISO string
 * @property {TestResult[]} testResults
 */

/**
 * @typedef {Object} TestResult
 * @property {string} id
 * @property {string} name
 * @property {boolean} passed
 * @property {string} [given]
 * @property {string} [expected]
 * @property {string} [actual]
 * @property {string[]} [assertions]
 */

/**
 * @typedef {Object} PipelineData
 * @property {Build[]} builds
 * @property {string} deployStage - none|staging|canary|production
 * @property {string} specVersion
 * @property {number} trustScore - 0-100
 * @property {string} buildStatus - current build status
 */

/** @type {Map<string, PipelineData>} */
let _pipelines = $state(new Map());

/** @type {Map<string, number>} polling interval IDs */
const _pollIntervals = new Map();

export function getPipelines() {
  return _pipelines;
}

/**
 * Get pipeline data for a specific fort.
 * @param {string} fortId
 * @returns {PipelineData | undefined}
 */
export function getPipelineData(fortId) {
  return _pipelines.get(fortId);
}

/**
 * Fetch pipeline status from MCP servers and update the store.
 * Falls back to synthetic data if MCP servers are not connected.
 * @param {string} fortId
 * @param {string} [agentId] - agent ID to query, defaults to fortId
 */
export async function fetchPipelineStatus(fortId, agentId) {
  const aid = agentId || fortId;

  // Try real MCP data first
  const [statusResult, trustResult] = await Promise.all([
    agentStatus(aid),
    registryTrust(aid),
  ]);

  if (statusResult) {
    // Real data from MCP
    const content = statusResult.content?.[0]?.text;
    const data = content ? JSON.parse(content) : statusResult;
    const pipeline = {
      builds: (data.builds || []).map((b) => ({
        id: b.id || crypto.randomUUID(),
        status: b.status || "pending",
        version: b.version || "0.0.0",
        duration: b.duration || 0,
        timestamp: b.timestamp || new Date().toISOString(),
        testResults: (b.test_results || []).map((t) => ({
          id: t.id || crypto.randomUUID(),
          name: t.name || "unnamed",
          passed: t.passed ?? true,
          given: t.given,
          expected: t.expected,
          actual: t.actual,
          assertions: t.assertions,
        })),
      })),
      deployStage: data.deploy_stage || "none",
      specVersion: data.spec_version || "0.0.0",
      trustScore: trustResult?.content?.[0]?.text
        ? JSON.parse(trustResult.content[0].text).score ?? 0
        : 0,
      buildStatus: data.build_status || "unknown",
    };
    _pipelines.set(fortId, pipeline);
    return;
  }

  // Synthetic fallback for demo/offline mode
  if (!_pipelines.has(fortId)) {
    _pipelines.set(fortId, generateSyntheticPipeline(fortId));
  }
}

/**
 * Start polling pipeline status at an interval.
 * @param {string} fortId
 * @param {number} intervalMs - default 30000
 */
export function pollPipelineStatus(fortId, intervalMs = 30000) {
  stopPolling(fortId);
  fetchPipelineStatus(fortId);
  const id = setInterval(() => fetchPipelineStatus(fortId), intervalMs);
  _pollIntervals.set(fortId, id);
}

/**
 * Stop polling for a fort.
 * @param {string} fortId
 */
export function stopPolling(fortId) {
  const id = _pollIntervals.get(fortId);
  if (id) {
    clearInterval(id);
    _pollIntervals.delete(fortId);
  }
}

/** Stop all polling */
export function stopAllPolling() {
  for (const [fortId] of _pollIntervals) {
    stopPolling(fortId);
  }
}

// ── Synthetic data generator for demo mode ──

function _hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const BUILD_STATUSES = ["succeeded", "succeeded", "succeeded", "failed", "succeeded"];
const DEPLOY_STAGES = ["none", "staging", "canary", "production"];
const TEST_NAMES = [
  "spec compliance", "schema validation", "API contract", "auth flow",
  "data integrity", "error handling", "performance threshold",
];

/**
 * Generate synthetic pipeline data for a fort.
 * @param {string} fortId
 * @returns {PipelineData}
 */
function generateSyntheticPipeline(fortId) {
  const h = _hash(fortId);
  const buildCount = 3 + (h % 5);
  const builds = [];

  for (let i = 0; i < buildCount; i++) {
    const bh = _hash(fortId + "_build_" + i);
    const status = BUILD_STATUSES[bh % BUILD_STATUSES.length];
    const testCount = 3 + (bh % 5);
    const testResults = [];

    for (let j = 0; j < testCount; j++) {
      const th = _hash(fortId + "_test_" + i + "_" + j);
      testResults.push({
        id: `test-${i}-${j}`,
        name: TEST_NAMES[th % TEST_NAMES.length],
        passed: status === "succeeded" ? true : th % 3 !== 0,
        given: `input scenario ${j + 1}`,
        expected: `expected output ${j + 1}`,
        actual: status === "succeeded" || th % 3 !== 0
          ? `expected output ${j + 1}`
          : `unexpected result ${j + 1}`,
        assertions: [`assert_eq(result, expected)`, `assert_valid(schema)`],
      });
    }

    builds.push({
      id: `build-${fortId}-${i}`,
      status,
      version: `0.${buildCount - i}.${bh % 10}`,
      duration: 5000 + (bh % 55000),
      timestamp: new Date(Date.now() - (buildCount - i) * 86400000).toISOString(),
      testResults,
    });
  }

  return {
    builds,
    deployStage: DEPLOY_STAGES[h % DEPLOY_STAGES.length],
    specVersion: `0.${1 + (h % 5)}.${h % 10}`,
    trustScore: 40 + (h % 60),
    buildStatus: builds[0]?.status || "unknown",
  };
}
