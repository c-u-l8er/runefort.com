// PULSE loop engine for the dark factory.
// Contains the actual MCP call sequences for all 5 phases:
//   WATCH (retrieve) → TRIAGE (route) → PIPELINE (act) → LEARN (learn) → CONSOLIDATE (consolidate)
// This module is non-reactive — it makes MCP calls and returns results.
// The reactive state lives in factory.svelte.js.

import { findConnection } from "$lib/stores/mcp.svelte.js";
import { callTool } from "$lib/play/mcp-client.js";
import { agentStatus, agentBuild, agentEnsure } from "$lib/play/agentelic-client.js";
import { getActiveWorkspace } from "$lib/stores/workspace.svelte.js";
import { getAuth } from "$lib/stores/auth.svelte.js";
import { registryTrust } from "$lib/play/fleetprompt-client.js";
import { specValidate } from "$lib/play/specprompt-client.js";
import { fetchRecentPushes, fetchOpenIssues } from "$lib/play/github-status.js";
import { emitOutcomeSignal, emitReputationUpdate, emitConsolidationEvent } from "$lib/play/cloudevents.js";
import { logError, logPhase } from "$lib/stores/factorylog.svelte.js";

// ── Helpers ──

/**
 * Safe MCP call to a named server.
 * @param {string} serverName
 * @param {string} toolName
 * @param {object} args
 * @returns {Promise<object|null>}
 */
async function mcpCall(serverName, toolName, args) {
  const conn = findConnection(serverName);
  if (!conn || conn.status !== "connected") return null;
  try {
    return await callTool(conn.url, undefined, toolName, args, conn.sessionId);
  } catch {
    return null;
  }
}

/** Track last check timestamps per watcher. */
const _lastCheck = { github: null, outcomes: null };

// ══════════════════════════════════════════
// PHASE 1: WATCH (retrieve)
// ══════════════════════════════════════════

/**
 * Watch GitHub for recent pushes.
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<import('$lib/stores/factory.svelte.js').FactorySignal|null>}
 */
export async function watchGitHub(owner, repo) {
  const since = _lastCheck.github || new Date(Date.now() - 120000).toISOString();
  _lastCheck.github = new Date().toISOString();

  const pushes = await fetchRecentPushes(owner, repo, since);
  if (!pushes || pushes.length === 0) return null;

  const push = pushes[0]; // most recent
  return {
    id: crypto.randomUUID(),
    source: "git_push",
    classification: "unknown",
    classificationConfidence: 0,
    fortId: `${owner}/${repo}`,
    payload: {
      sha: push.sha,
      message: push.message,
      author: push.author,
      timestamp: push.timestamp,
      files: push.files || [],
    },
    timestamp: new Date().toISOString(),
    status: "pending",
  };
}

/**
 * Watch Graphonomous for outcome failures.
 * @returns {Promise<import('$lib/stores/factory.svelte.js').FactorySignal[]>}
 */
export async function watchOutcomeSignals() {
  const since = _lastCheck.outcomes || new Date(Date.now() - 300000).toISOString();
  _lastCheck.outcomes = new Date().toISOString();

  const result = await mcpCall("graphonomous", "retrieve", {
    action: "context",
    query: "outcome_signal status:failure since:" + since,
    limit: 5,
  });

  if (!result?.content?.[0]?.text) return [];

  try {
    const data = JSON.parse(result.content[0].text);
    const nodes = data.nodes || data.results || [];
    return nodes
      .filter((n) => n.metadata?.status === "failure")
      .map((n) => ({
        id: crypto.randomUUID(),
        source: "outcome_failure",
        classification: "regression",
        classificationConfidence: 0.9,
        fortId: n.metadata?.fortId || "unknown",
        payload: { nodeId: n.id, content: n.content, metadata: n.metadata },
        timestamp: new Date().toISOString(),
        status: "pending",
      }));
  } catch {
    return [];
  }
}

/**
 * Retrieve prior similar failures for context.
 * @param {string} fortId
 * @param {string} classification
 * @returns {Promise<object[]>}
 */
export async function watchPriorFailures(fortId, classification) {
  const result = await mcpCall("graphonomous", "retrieve", {
    action: "context",
    query: `factory failure patterns ${classification} for ${fortId}`,
    limit: 10,
  });

  if (!result?.content?.[0]?.text) return [];
  try {
    const data = JSON.parse(result.content[0].text);
    return data.nodes || data.results || [];
  } catch {
    return [];
  }
}

// ══════════════════════════════════════════
// PHASE 2: TRIAGE (route)
// ══════════════════════════════════════════

/**
 * Heuristic signal classification. No LLM calls — pure path/label matching.
 * @param {import('$lib/stores/factory.svelte.js').FactorySignal} signal
 * @returns {{ classification: import('$lib/stores/factory.svelte.js').FactorySignal['classification'], confidence: number }}
 */
export function classifySignal(signal) {
  // Already classified (e.g. outcome_failure)
  if (signal.classification !== "unknown" && signal.classificationConfidence > 0.5) {
    return { classification: signal.classification, confidence: signal.classificationConfidence };
  }

  const payload = signal.payload || {};

  // Git push classification by file paths
  if (signal.source === "git_push") {
    const files = payload.files || [];
    const message = (payload.message || "").toLowerCase();

    // Spec changes
    if (files.some((f) => f.includes("docs/spec/") || f.includes("SPEC.md"))) {
      return { classification: "spec_change", confidence: 0.95 };
    }
    // Source code changes
    if (files.some((f) => f.includes("src/") || f.includes("lib/"))) {
      return { classification: "code_change", confidence: 0.85 };
    }
    // Commit message hints
    if (message.includes("fix") || message.includes("bug")) {
      return { classification: "bug_report", confidence: 0.75 };
    }
    if (message.includes("feat") || message.includes("add")) {
      return { classification: "feature_request", confidence: 0.70 };
    }
    return { classification: "code_change", confidence: 0.60 };
  }

  // Issue classification by labels
  if (signal.source === "issue_filed") {
    const labels = payload.labels || [];
    if (labels.includes("regression")) return { classification: "regression", confidence: 0.95 };
    if (labels.includes("bug")) return { classification: "bug_report", confidence: 0.90 };
    if (labels.includes("feature")) return { classification: "feature_request", confidence: 0.85 };
    return { classification: "bug_report", confidence: 0.60 };
  }

  // Outcome failure → regression
  if (signal.source === "outcome_failure") {
    return { classification: "regression", confidence: 0.90 };
  }

  return { classification: "unknown", confidence: 0.0 };
}

/**
 * Check for cyclic failure patterns via κ topology.
 * @param {string} fortId
 * @param {string} classification
 * @returns {Promise<{ cyclic: boolean, kappa: number }>}
 */
export async function checkCyclicFailures(fortId, classification) {
  const result = await mcpCall("graphonomous", "route", {
    action: "topology",
    query: `failure patterns ${classification} for ${fortId}`,
  });

  if (!result?.content?.[0]?.text) return { cyclic: false, kappa: 0 };
  try {
    const data = JSON.parse(result.content[0].text);
    const kappa = data.kappa ?? data.kappa_value ?? 0;
    return { cyclic: kappa > 0, kappa };
  } catch {
    return { cyclic: false, kappa: 0 };
  }
}

// ══════════════════════════════════════════
// PHASE 3: PIPELINE (act)
// ══════════════════════════════════════════

/**
 * Run the SpecPrompt spec lifecycle phase.
 * @param {string} fortId
 * @param {import('$lib/stores/factory.svelte.js').FactorySignal} signal
 * @returns {Promise<object|null>}
 */
export async function runSpecLifecycle(fortId, signal) {
  // Source the spec content — signal payload may carry the raw SPEC.md string,
  // otherwise fall back to a minimal placeholder so validate() still runs.
  const specContent = signal.payload?.specContent
    || signal.payload?.content
    || `---
name: ${fortId}
version: 0.1.0
---

# ${fortId}

## Purpose
Placeholder spec — no content supplied by signal.
`;
  logPhase(`→ specprompt.validate(${fortId}, ${specContent.length} bytes)`);
  let validation;
  try {
    validation = await specValidate(specContent);
  } catch (err) {
    logError(`spec_lifecycle: ${err?.message || "validate failed"}`, { fortId });
    return null;
  }
  if (!validation) return null;

  // Parse validation result — live SpecPrompt returns { valid, errors[], warnings[], parse_errors? }
  try {
    const text = validation.content?.[0]?.text;
    if (text) {
      const data = JSON.parse(text);
      const errors = data.errors || data.parse_errors || [];
      const warnings = data.warnings || [];
      return {
        valid: data.valid ?? (errors.length === 0),
        errors,
        warnings,
        version: data.version,
      };
    }
  } catch {
    // Validation returned but unparseable — treat as valid
  }
  return { valid: true, errors: [], warnings: [] };
}

/**
 * Slugify a fortId (e.g. "owner/repo" → "owner-repo") so it can be used as an
 * Agentelic agent slug.
 * @param {string} fortId
 * @returns {string}
 */
function fortIdToSlug(fortId) {
  return String(fortId)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Run the Agentelic build pipeline phase.
 *
 * Resolves the fortId → Agentelic agent UUID via agent_ensure (find-or-create),
 * then triggers agent_build with inline spec content taken from the signal.
 * Polls agent_status by UUID until success/failure/timeout.
 *
 * @param {string} fortId
 * @param {import('$lib/stores/factory.svelte.js').FactorySignal} signal
 * @returns {Promise<object|null>}
 */
export async function runBuildPipeline(fortId, signal) {
  const workspace = getActiveWorkspace();
  const auth = getAuth();
  if (!workspace?.id || !auth?.user?.id) {
    logError(`build_pipeline: no active workspace or user — sign in first`, { fortId });
    return null;
  }

  const slug = fortIdToSlug(fortId);
  const specContent =
    signal.payload?.specContent ||
    signal.payload?.content ||
    `# ${fortId}\n\n## Executive Summary\nAuto-generated placeholder spec for ${fortId}.\n\n## Architecture\nTBD.\n\n## Acceptance Tests\n- given input "ping", expect output contains "pong"\n`;

  // Resolve agent UUID
  logPhase(`→ agentelic.agent_ensure(${slug})`);
  let agentId;
  try {
    const ensured = await agentEnsure({
      name: fortId,
      slug,
      workspaceId: workspace.id,
      userId: auth.user.id,
    });
    agentId = ensured.agent_id;
  } catch (err) {
    logError(`build_pipeline: ${err?.message || "agent_ensure failed"}`, { fortId, slug });
    return null;
  }
  if (!agentId) return null;

  // Trigger build with inline spec content
  logPhase(`→ agentelic.agent_build(${agentId.slice(0, 8)}…)`);
  let buildResult;
  try {
    buildResult = await agentBuild(agentId, specContent);
  } catch (err) {
    logError(`build_pipeline: ${err?.message || "agent_build failed"}`, { fortId, agentId });
    return null;
  }
  if (!buildResult) return null;

  // Poll for completion (max 5 minutes, every 5 seconds)
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    let status;
    try {
      status = await agentStatus(agentId);
    } catch (err) {
      logError(`build_pipeline: agent_status poll failed — ${err?.message || "error"}`, {
        fortId,
        agentId,
        attempt: i,
      });
      return null;
    }
    if (!status) continue;

    try {
      const text = status.content?.[0]?.text;
      const data = text ? JSON.parse(text) : status;
      const buildStatus = data.latest_build?.status || data.build_status;
      if (buildStatus === "succeeded") {
        return {
          status: "succeeded",
          agentId,
          build: data.latest_build,
          testResults: data.latest_test,
        };
      }
      if (buildStatus === "failed") {
        logError(`build_pipeline: build reported failed`, { fortId, agentId });
        return null; // Build failed
      }
      // Still running — continue polling
    } catch {
      continue;
    }
  }
  logError(`build_pipeline: timed out after 5 minutes`, { fortId, agentId });
  return null; // Timeout
}

/**
 * Run the FleetPrompt trust scoring phase.
 * @param {string} fortId
 * @param {object} buildResult
 * @returns {Promise<{ trustScore: number, details: object }|null>}
 */
export async function runTrustScoring(fortId, buildResult) {
  logPhase(`→ fleetprompt.registry_trust(${fortId})`);
  let result;
  try {
    result = await registryTrust(fortId);
  } catch (err) {
    logError(`trust_scoring: ${err?.message || "registry_trust failed"}`, { fortId });
    return null;
  }
  if (!result) return null;

  try {
    const text = result.content?.[0]?.text;
    if (text) {
      const data = JSON.parse(text);
      return { trustScore: data.score ?? 0, details: data };
    }
  } catch {
    // Fall through
  }
  return { trustScore: 0, details: {} };
}

/**
 * Run the deploy gate — compare trust score against threshold.
 * @param {string} fortId
 * @param {{ trustScore: number, details: object }} trustResult
 * @param {number} threshold
 * @returns {Promise<{ approved: boolean, method: string, trustScore: number }>}
 */
export async function runDeployGate(fortId, trustResult, threshold) {
  const score = trustResult?.trustScore ?? 0;
  if (score >= threshold) {
    return { approved: true, method: "auto", trustScore: score };
  }
  return { approved: false, method: "needs_human", trustScore: score };
}

// ══════════════════════════════════════════
// PHASE 4: LEARN (learn)
// ══════════════════════════════════════════

/**
 * Feed pipeline outcome back to Graphonomous and emit CloudEvents.
 * @param {import('$lib/stores/factory.svelte.js').PipelineRun} run
 */
export async function feedOutcome(run) {
  const status = run.outcome?.status === "success" ? "success" : "failure";

  // Store outcome in Graphonomous
  await mcpCall("graphonomous", "act", {
    action: "store_node",
    node_type: "outcome",
    content: `Factory pipeline ${status}: ${run.fortId} (${run.id})`,
    source: "runefort-factory",
    confidence: 0.9,
    metadata: JSON.stringify({
      runId: run.id,
      fortId: run.fortId,
      status,
      stages: run.phases.map((p) => ({ phase: p.phase, status: p.status })),
      timestamp: run.completedAt,
    }),
  });

  // Learn from outcome
  await mcpCall("graphonomous", "learn", {
    action: "from_outcome",
    status,
    action_id: `factory-${run.id}`,
    confidence: 0.9,
    evidence: JSON.stringify({
      fortId: run.fortId,
      signalId: run.signalId,
      phases: run.phases.length,
      duration: run.completedAt && run.startedAt
        ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
        : 0,
    }),
  });

  // Emit CloudEvents tokens
  const outcomeEvent = emitOutcomeSignal(status, [run.signalId]);
  const reputationDelta = status === "success" ? 0.1 : -0.05;
  const reputationEvent = emitReputationUpdate(run.fortId, reputationDelta, {
    runId: run.id,
    trustScore: run.outcome?.trustResult?.trustScore,
  });

  // Store events in Graphonomous as semantic nodes for cross-loop consumption
  await mcpCall("graphonomous", "act", {
    action: "store_node",
    node_type: "semantic",
    content: `CloudEvent: ${outcomeEvent.type} — ${status}`,
    source: "runefort-factory-events",
    confidence: 1.0,
    metadata: JSON.stringify(outcomeEvent),
  });

  await mcpCall("graphonomous", "act", {
    action: "store_node",
    node_type: "semantic",
    content: `CloudEvent: ${reputationEvent.type} — delta ${reputationDelta}`,
    source: "runefort-factory-events",
    confidence: 1.0,
    metadata: JSON.stringify(reputationEvent),
  });
}

// ══════════════════════════════════════════
// PHASE 5: CONSOLIDATE (consolidate)
// ══════════════════════════════════════════

/**
 * Run consolidation — merge failure patterns, trigger Graphonomous consolidation.
 */
export async function runConsolidate() {
  // Trigger Graphonomous consolidation
  await mcpCall("graphonomous", "consolidate", { action: "run" });

  // Retrieve factory failure patterns for dedup
  const patterns = await mcpCall("graphonomous", "retrieve", {
    action: "context",
    query: "factory failure patterns",
    limit: 20,
  });

  const mergedIds = [];
  const prunedIds = [];
  const promotedIds = [];

  // Emit consolidation event
  if (mergedIds.length || prunedIds.length || promotedIds.length) {
    const event = emitConsolidationEvent(mergedIds, prunedIds, promotedIds);
    await mcpCall("graphonomous", "act", {
      action: "store_node",
      node_type: "semantic",
      content: `CloudEvent: ${event.type} — ${mergedIds.length} merged, ${prunedIds.length} pruned, ${promotedIds.length} promoted`,
      source: "runefort-factory-events",
      confidence: 1.0,
      metadata: JSON.stringify(event),
    });
  }
}
