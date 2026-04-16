// Svelte 5 rune store for dark factory orchestration loop.
// Manages the PULSE-native loop: watch → triage → pipeline → learn → consolidate.

import {
  watchGitHub, watchOutcomeSignals, classifySignal as classify,
  runSpecLifecycle, runBuildPipeline, runTrustScoring, runDeployGate,
  feedOutcome, runConsolidate,
} from "$lib/play/factory-loop.js";
import { trackFactorySignal, trackPipelineOutcome } from "$lib/play/session-learning.js";
import { logSignal, logTriage, logPipeline, logPhase, logLearn, logError, logInfo } from "$lib/stores/factorylog.svelte.js";

/**
 * @typedef {Object} FactorySignal
 * @property {string} id
 * @property {'git_push'|'outcome_failure'|'issue_filed'|'manual'} source
 * @property {'spec_change'|'code_change'|'bug_report'|'feature_request'|'regression'|'unknown'} classification
 * @property {number} classificationConfidence - 0.0-1.0
 * @property {string} fortId
 * @property {object} payload
 * @property {string} timestamp
 * @property {'pending'|'triaged'|'processing'|'dismissed'} status
 */

/**
 * @typedef {Object} PipelineRun
 * @property {string} id
 * @property {string} signalId
 * @property {string} fortId
 * @property {'spec_update'|'build'|'trust'|'deploy'|'complete'|'failed'} stage
 * @property {PipelinePhaseResult[]} phases
 * @property {string} startedAt
 * @property {string|null} completedAt
 * @property {object|null} outcome
 */

/**
 * @typedef {Object} PipelinePhaseResult
 * @property {'spec_lifecycle'|'build_pipeline'|'trust_scoring'|'deploy_gate'} phase
 * @property {'pending'|'running'|'succeeded'|'failed'|'skipped'} status
 * @property {object|null} result
 * @property {string|null} startedAt
 * @property {string|null} completedAt
 */

/**
 * @typedef {Object} FactoryConfig
 * @property {number} watchIntervalMs
 * @property {boolean} autoTriageEnabled
 * @property {number} deployThreshold - trust score 0-100
 * @property {number} maxConcurrentRuns
 */

/** @type {{ loopState: string, signalQueue: FactorySignal[], activeRuns: PipelineRun[], completedRuns: PipelineRun[], config: FactoryConfig }} */
let _state = $state({
  loopState: "idle",
  signalQueue: [],
  activeRuns: [],
  completedRuns: [],
  config: {
    watchIntervalMs: 60000,
    autoTriageEnabled: true,
    deployThreshold: 75,
    maxConcurrentRuns: 2,
  },
});

/** @type {number|null} */
let _watchInterval = null;

// ── Public API ──

export function getFactoryState() {
  return _state;
}

export function getFactoryConfig() {
  return _state.config;
}

/** @param {Partial<FactoryConfig>} updates */
export function updateConfig(updates) {
  _state.config = { ..._state.config, ...updates };
}

/**
 * Start the WATCH phase — poll for signals at configured interval.
 * @param {string} [owner] - GitHub owner for repo watching
 * @param {string} [repo] - GitHub repo for repo watching
 */
export function startWatching(owner, repo) {
  if (_watchInterval) return;
  _state.loopState = "watching";
  logInfo("Factory loop started — watching for signals");

  const tick = async () => {
    try {
      // WATCH: check GitHub for pushes
      if (owner && repo) {
        const gitSignal = await watchGitHub(owner, repo);
        if (gitSignal) ingestSignal(gitSignal);
      }

      // WATCH: check Graphonomous for outcome failures
      const outcomeSignals = await watchOutcomeSignals();
      for (const s of outcomeSignals) {
        ingestSignal(s);
      }

      // Auto-triage if enabled
      if (_state.config.autoTriageEnabled) {
        for (const s of _state.signalQueue) {
          if (s.status === "pending") {
            const { classification, confidence } = classify(s);
            triageSignal(s.id, classification, confidence);
          }
        }
      }

      // Auto-start pipelines for triaged signals
      for (const s of _state.signalQueue) {
        if (s.status === "triaged" && _state.activeRuns.length < _state.config.maxConcurrentRuns) {
          startPipelineRun(s.id);
        }
      }
    } catch {
      // Swallow errors in watch loop — keep running
    }
  };

  tick(); // immediate first run
  _watchInterval = setInterval(tick, _state.config.watchIntervalMs);
}

/** Stop the WATCH phase */
export function stopWatching() {
  if (_watchInterval) {
    clearInterval(_watchInterval);
    _watchInterval = null;
  }
  _state.loopState = "idle";
}

/**
 * Ingest a signal into the queue.
 * @param {FactorySignal} signal
 */
export function ingestSignal(signal) {
  // Dedup by source + fortId + recent timestamp
  const isDupe = _state.signalQueue.some(
    (s) => s.source === signal.source && s.fortId === signal.fortId &&
      Math.abs(new Date(s.timestamp).getTime() - new Date(signal.timestamp).getTime()) < 30000
  );
  if (isDupe) return;

  _state.signalQueue = [..._state.signalQueue, signal];
  logSignal(`Ingested: ${signal.source} → ${signal.classification} (${signal.fortId})`, { id: signal.id, confidence: signal.classificationConfidence });
  trackFactorySignal(signal);
}

/**
 * Triage a signal — classify and mark ready.
 * @param {string} signalId
 * @param {string} classification
 * @param {number} [confidence]
 */
export function triageSignal(signalId, classification, confidence = 0.9) {
  _state.signalQueue = _state.signalQueue.map((s) =>
    s.id === signalId
      ? { ...s, classification, classificationConfidence: confidence, status: "triaged" }
      : s
  );
  logTriage(`Triaged: ${classification} (confidence: ${confidence.toFixed(2)})`, { signalId });
}

/**
 * Kick off the pipeline for a triaged signal.
 * @param {string} signalId
 */
export async function startPipelineRun(signalId) {
  const signal = _state.signalQueue.find((s) => s.id === signalId);
  if (!signal || signal.status !== "triaged") return;

  // Mark signal as processing
  _state.signalQueue = _state.signalQueue.map((s) =>
    s.id === signalId ? { ...s, status: "processing" } : s
  );

  /** @type {PipelineRun} */
  const run = {
    id: crypto.randomUUID(),
    signalId,
    fortId: signal.fortId,
    stage: "spec_update",
    phases: [
      { phase: "spec_lifecycle", status: "pending", result: null, startedAt: null, completedAt: null },
      { phase: "build_pipeline", status: "pending", result: null, startedAt: null, completedAt: null },
      { phase: "trust_scoring", status: "pending", result: null, startedAt: null, completedAt: null },
      { phase: "deploy_gate", status: "pending", result: null, startedAt: null, completedAt: null },
    ],
    startedAt: new Date().toISOString(),
    completedAt: null,
    outcome: null,
  };

  _state.activeRuns = [..._state.activeRuns, run];
  _state.loopState = "running";
  logPipeline(`Pipeline started: ${signal.fortId} (${signal.classification})`, { runId: run.id, signalId });

  // Execute pipeline phases sequentially
  try {
    await executePipeline(run, signal);
  } catch (err) {
    logError(`Pipeline error: ${err?.message || "unknown"}`, { runId: run.id });
    failRun(run.id, err?.message || "Pipeline error");
  }
}

/**
 * Execute the pipeline phases for a run.
 * @param {PipelineRun} run
 * @param {FactorySignal} signal
 */
async function executePipeline(run, signal) {
  // Phase 1: Spec lifecycle (only for spec_change signals)
  if (signal.classification === "spec_change") {
    updatePhase(run.id, "spec_lifecycle", "running");
    const specResult = await runSpecLifecycle(signal.fortId, signal);
    updatePhase(run.id, "spec_lifecycle", specResult ? "succeeded" : "failed", specResult);
    if (!specResult) { failRun(run.id, "Spec lifecycle failed"); return; }
  } else {
    updatePhase(run.id, "spec_lifecycle", "skipped");
  }

  // Phase 2: Build pipeline
  updateRunStage(run.id, "build");
  updatePhase(run.id, "build_pipeline", "running");
  const buildResult = await runBuildPipeline(signal.fortId, signal);
  updatePhase(run.id, "build_pipeline", buildResult ? "succeeded" : "failed", buildResult);
  if (!buildResult) { failRun(run.id, "Build failed"); return; }

  // Phase 3: Trust scoring
  updateRunStage(run.id, "trust");
  updatePhase(run.id, "trust_scoring", "running");
  const trustResult = await runTrustScoring(signal.fortId, buildResult);
  updatePhase(run.id, "trust_scoring", trustResult ? "succeeded" : "failed", trustResult);
  if (!trustResult) { failRun(run.id, "Trust scoring failed"); return; }

  // Phase 4: Deploy gate
  updateRunStage(run.id, "deploy");
  updatePhase(run.id, "deploy_gate", "running");
  const deployResult = await runDeployGate(signal.fortId, trustResult, _state.config.deployThreshold);
  updatePhase(run.id, "deploy_gate", deployResult?.approved ? "succeeded" : "failed", deployResult);

  // Complete the run
  completeRun(run.id, {
    status: deployResult?.approved ? "success" : "needs_approval",
    buildResult,
    trustResult,
    deployResult,
  });
}

/**
 * Update a phase within a run.
 * @param {string} runId
 * @param {string} phaseName
 * @param {string} status
 * @param {object} [result]
 */
function updatePhase(runId, phaseName, status, result = null) {
  if (status === "running") logPhase(`▶ ${phaseName}`, { runId });
  else if (status === "succeeded") logPhase(`✓ ${phaseName} succeeded`, { runId });
  else if (status === "failed") logPhase(`✗ ${phaseName} failed`, { runId });
  else if (status === "skipped") logPhase(`— ${phaseName} skipped`, { runId });
  _state.activeRuns = _state.activeRuns.map((r) => {
    if (r.id !== runId) return r;
    return {
      ...r,
      phases: r.phases.map((p) => {
        if (p.phase !== phaseName) return p;
        return {
          ...p,
          status,
          result,
          startedAt: p.startedAt || (status === "running" ? new Date().toISOString() : null),
          completedAt: status === "running" || status === "pending" ? null : new Date().toISOString(),
        };
      }),
    };
  });
}

/** @param {string} runId @param {string} stage */
function updateRunStage(runId, stage) {
  _state.activeRuns = _state.activeRuns.map((r) =>
    r.id === runId ? { ...r, stage } : r
  );
}

/** @param {string} runId @param {string} reason */
function failRun(runId, reason) {
  const run = _state.activeRuns.find((r) => r.id === runId);
  if (!run) return;
  const failed = { ...run, stage: "failed", completedAt: new Date().toISOString(), outcome: { status: "failure", reason } };
  logError(`Pipeline failed: ${run.fortId} — ${reason}`, { runId });
  _state.activeRuns = _state.activeRuns.filter((r) => r.id !== runId);
  _state.completedRuns = [failed, ..._state.completedRuns].slice(0, 50);
  if (_state.activeRuns.length === 0) _state.loopState = "watching";

  // LEARN phase — even failures feed back
  feedOutcome(failed).catch(() => {});
  trackPipelineOutcome(failed);
}

/**
 * @param {string} runId
 * @param {object} outcome
 */
function completeRun(runId, outcome) {
  const run = _state.activeRuns.find((r) => r.id === runId);
  if (!run) return;
  const completed = { ...run, stage: "complete", completedAt: new Date().toISOString(), outcome };
  logPipeline(`Pipeline complete: ${run.fortId} → ${outcome?.status || "done"}`, { runId });
  logLearn(`Feeding outcome to Graphonomous`, { runId, status: outcome?.status });
  _state.activeRuns = _state.activeRuns.filter((r) => r.id !== runId);
  _state.completedRuns = [completed, ..._state.completedRuns].slice(0, 50);
  if (_state.activeRuns.length === 0) _state.loopState = "watching";

  // LEARN phase
  feedOutcome(completed).catch(() => {});
  trackPipelineOutcome(completed);

  // Remove processed signal from queue
  _state.signalQueue = _state.signalQueue.filter((s) => s.id !== run.signalId);
}

/** Dismiss a signal without processing. @param {string} signalId */
export function dismissSignal(signalId) {
  _state.signalQueue = _state.signalQueue.filter((s) => s.id !== signalId);
}

/**
 * Get active run for a specific fort (for overlay display).
 * @param {string} fortId
 * @returns {PipelineRun | undefined}
 */
export function getActiveRunForFort(fortId) {
  return _state.activeRuns.find((r) => r.fortId === fortId);
}

/**
 * Manually inject a signal (from UI or chat panel).
 * @param {string} fortId
 * @param {'spec_change'|'code_change'|'bug_report'|'regression'} classification
 * @param {object} [payload]
 */
export function manualSignal(fortId, classification, payload = {}) {
  ingestSignal({
    id: crypto.randomUUID(),
    source: "manual",
    classification,
    classificationConfidence: 1.0,
    fortId,
    payload,
    timestamp: new Date().toISOString(),
    status: "pending",
  });
}

// ── Synthetic signals for demo mode ──

function _hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const DEMO_CLASSIFICATIONS = ["spec_change", "code_change", "bug_report", "regression"];
const DEMO_SOURCES = ["git_push", "outcome_failure", "issue_filed"];

/**
 * Generate synthetic signals for demo mode.
 * @param {string} fortId
 * @param {number} [count]
 */
export function generateSyntheticSignals(fortId, count = 3) {
  for (let i = 0; i < count; i++) {
    const h = _hash(fortId + "_signal_" + i + Date.now());
    ingestSignal({
      id: crypto.randomUUID(),
      source: DEMO_SOURCES[h % DEMO_SOURCES.length],
      classification: DEMO_CLASSIFICATIONS[h % DEMO_CLASSIFICATIONS.length],
      classificationConfidence: 0.7 + (h % 30) / 100,
      fortId,
      payload: {
        ref: `refs/heads/main`,
        sha: h.toString(16).padStart(7, "0").slice(0, 7),
        message: `Demo signal ${i + 1} for ${fortId}`,
      },
      timestamp: new Date(Date.now() - (count - i) * 300000).toISOString(),
      status: "pending",
    });
  }
}

/**
 * Run a synthetic pipeline for demo mode (with delays).
 * @param {string} signalId
 */
export async function runSyntheticPipeline(signalId) {
  const signal = _state.signalQueue.find((s) => s.id === signalId);
  if (!signal) return;

  triageSignal(signalId, signal.classification, signal.classificationConfidence);
  await new Promise((r) => setTimeout(r, 500));

  const run = {
    id: crypto.randomUUID(),
    signalId,
    fortId: signal.fortId,
    stage: "spec_update",
    phases: [
      { phase: "spec_lifecycle", status: "pending", result: null, startedAt: null, completedAt: null },
      { phase: "build_pipeline", status: "pending", result: null, startedAt: null, completedAt: null },
      { phase: "trust_scoring", status: "pending", result: null, startedAt: null, completedAt: null },
      { phase: "deploy_gate", status: "pending", result: null, startedAt: null, completedAt: null },
    ],
    startedAt: new Date().toISOString(),
    completedAt: null,
    outcome: null,
  };

  _state.activeRuns = [..._state.activeRuns, run];
  _state.loopState = "running";
  _state.signalQueue = _state.signalQueue.map((s) =>
    s.id === signalId ? { ...s, status: "processing" } : s
  );

  const phases = ["spec_lifecycle", "build_pipeline", "trust_scoring", "deploy_gate"];
  const stages = ["spec_update", "build", "trust", "deploy"];

  for (let i = 0; i < phases.length; i++) {
    updateRunStage(run.id, stages[i]);
    updatePhase(run.id, phases[i], "running");
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
    updatePhase(run.id, phases[i], "succeeded", { synthetic: true });
  }

  completeRun(run.id, { status: "success", synthetic: true });
}
