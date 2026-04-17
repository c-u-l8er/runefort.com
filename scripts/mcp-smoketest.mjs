#!/usr/bin/env node
// MCP smoketest — spec §9 Phase 6 pre-req.
//
// Exercises every MCP tool the Dark Factory Control Room depends on and
// prints a shape diff against the expected schema. A non-zero exit means
// one or more clients drifted and the UI wiring in `assembly.svelte.js` /
// `session-learning.js` must be fixed before the next control-room change.
//
// Usage:
//   AGENTELIC_URL=http://localhost:4001/mcp \
//   FLEETPROMPT_URL=http://localhost:4002/mcp \
//   SPECPROMPT_URL=http://localhost:4003/mcp \
//   GRAPHONOMOUS_URL=http://localhost:4004/mcp \
//   PRISM_URL=http://localhost:4005/mcp \
//   node scripts/mcp-smoketest.mjs
//
// Any URL that is unset is skipped with a WARN line; the script only exits
// non-zero if a *called* tool drifts.

const CASES = [
  {
    server: "agentelic",
    envVar: "AGENTELIC_URL",
    calls: [
      {
        tool: "agent_status",
        args: { agent_id: "smoketest-agent" },
        expectKeys: ["agent_id", "build_status"],
      },
      {
        tool: "agent_build",
        args: { agent_id: "smoketest-agent" },
        // agent_build may synchronously return build_id OR queue_id
        expectOneOfKeys: [["build_id"], ["queue_id"], ["status"]],
      },
    ],
  },
  {
    server: "fleetprompt",
    envVar: "FLEETPROMPT_URL",
    calls: [
      {
        tool: "registry_trust",
        args: { fleet_id: "smoketest-fleet" },
        expectKeys: ["trust_score"],
      },
      {
        tool: "registry_search",
        args: { query: "router" },
        expectKeys: ["results"],
      },
    ],
  },
  {
    server: "specprompt",
    envVar: "SPECPROMPT_URL",
    calls: [
      {
        tool: "validate",
        args: { spec_content: '{"name":"smoketest","version":"0.0.0"}' },
        expectKeys: ["valid"],
      },
    ],
  },
  {
    server: "graphonomous",
    envVar: "GRAPHONOMOUS_URL",
    calls: [
      {
        tool: "retrieve",
        args: { action: "context", query: "smoketest" },
        expectKeys: ["context"],
      },
      {
        tool: "consolidate",
        args: { action: "stats" },
        expectKeys: ["node_count"],
      },
      {
        tool: "act",
        args: { action: "list_goals" },
        expectKeys: ["goals"],
      },
    ],
  },
  {
    server: "prism",
    envVar: "PRISM_URL",
    calls: [
      {
        tool: "observe",
        args: { action: "latest_judgments", limit: 1 },
        expectKeys: ["judgments"],
      },
    ],
  },
];

let errors = 0;
let skipped = 0;
let ok = 0;

/**
 * POST a JSON-RPC call to an MCP HTTP endpoint.
 * Supports both direct streamable-HTTP MCP and proxied-through-SvelteKit.
 */
async function rpc(serverUrl, method, params, id = 1) {
  const res = await fetch(serverUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  const text = await res.text();
  // Streamable HTTP servers may return SSE; extract the data frame if so.
  if (text.startsWith("event:") || text.includes("\ndata: ")) {
    const m = text.match(/data:\s*(\{.*\})/);
    if (!m) throw new Error(`Could not parse SSE frame: ${text.slice(0, 200)}`);
    return JSON.parse(m[1]);
  }
  return JSON.parse(text);
}

async function initSession(serverUrl) {
  const init = await rpc(serverUrl, "initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "runefort-smoketest", version: "0.1.0" },
  });
  if (init.error) throw new Error(`initialize failed: ${init.error.message}`);
  // notifications/initialized — fire-and-forget
  try {
    await fetch(serverUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }),
    });
  } catch { /* non-fatal */ }
}

function shapeCheck(result, call) {
  const keysPresent = result && typeof result === "object" ? Object.keys(result) : [];
  if (call.expectKeys) {
    const missing = call.expectKeys.filter((k) => !keysPresent.includes(k));
    if (missing.length === 0) return { ok: true };
    return { ok: false, reason: `missing keys: ${missing.join(", ")}`, keysPresent };
  }
  if (call.expectOneOfKeys) {
    for (const variant of call.expectOneOfKeys) {
      if (variant.every((k) => keysPresent.includes(k))) return { ok: true };
    }
    return {
      ok: false,
      reason: `none of the key variants matched: ${JSON.stringify(call.expectOneOfKeys)}`,
      keysPresent,
    };
  }
  return { ok: true };
}

for (const { server, envVar, calls } of CASES) {
  const url = process.env[envVar];
  if (!url) {
    console.log(`[WARN ] ${server}: ${envVar} not set — skipping`);
    skipped += calls.length;
    continue;
  }
  try {
    await initSession(url);
    for (const call of calls) {
      let idCounter = 100;
      try {
        const out = await rpc(url, "tools/call", { name: call.tool, arguments: call.args }, ++idCounter);
        if (out.error) {
          console.log(`[FAIL ] ${server}.${call.tool} — RPC error: ${out.error.message}`);
          errors++;
          continue;
        }
        // MCP tools/call wraps results in { content: [...] } but many servers
        // also return a structured payload in `structuredContent` or as the
        // sole JSON item in `content`.
        const result = out.result?.structuredContent
          ?? out.result
          ?? out;
        const shape = shapeCheck(result, call);
        if (shape.ok) {
          console.log(`[ OK  ] ${server}.${call.tool}`);
          ok++;
        } else {
          console.log(`[FAIL ] ${server}.${call.tool} — ${shape.reason}`);
          console.log(`         keys present: [${(shape.keysPresent || []).join(", ")}]`);
          errors++;
        }
      } catch (err) {
        console.log(`[FAIL ] ${server}.${call.tool} — ${err.message}`);
        errors++;
      }
    }
  } catch (err) {
    console.log(`[FAIL ] ${server} initialize — ${err.message}`);
    errors += calls.length;
  }
}

console.log(`\n${ok} OK · ${errors} failed · ${skipped} skipped`);
process.exit(errors > 0 ? 1 : 0);
