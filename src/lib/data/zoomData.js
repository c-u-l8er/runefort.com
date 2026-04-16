// Svelte Flow node/edge definitions for each zoom level (L0–L4)

export const levels = [
  { id: 0, code: "L0", name: "District", desc: "Multiple forts on a shared landscape. The full ecosystem at a glance." },
  { id: 1, code: "L1", name: "Campus",   desc: "Single fort. All wings and zones visible. Room labels from phases." },
  { id: 2, code: "L2", name: "Wing",     desc: "Rooms within a zone. Connections between them. Node clusters and edge topology." },
  { id: 3, code: "L3", name: "Room",     desc: "Individual nodes, edges, confidence values. The data breathing inside." },
  { id: 4, code: "L4", name: "Rune",     desc: "Single operation. The dark code inside a wall. Causal provenance, config." },
];

export const viewerTitles = [
  "L0 — District View",
  "L1 — Campus View",
  "L2 — Wing View",
  "L3 — Room View",
  "L4 — Rune View",
];

export const dataTitles = [
  "District Manifest",
  "PULSE Loop Manifest",
  "Wing Topology",
  "Room Node Graph",
  "Operation Trace",
];

// Default handle IDs for edges (top = target, bottom = source)
function e(edge) {
  return { sourceHandle: "bottom", targetHandle: "top", ...edge };
}

// ── L0: District ──
export const L0 = {
  nodes: [
    { id: "shared-ground", type: "gate", position: { x: 320, y: 260 }, data: { label: "amp.*", detail: "Shared identity layer" } },
    { id: "prism", type: "fort", position: { x: 320, y: 10 }, data: { label: "PRISM", rune: "ᛉ", role: "Watchtower Complex", color: "#e85a5a" } },
    { id: "graphonomous", type: "fort", position: { x: 20, y: 120 }, data: { label: "Graphonomous", rune: "ᚲ", role: "Memory Substrate", color: "#e8a84c" } },
    { id: "delegatic", type: "fort", position: { x: 220, y: 120 }, data: { label: "Delegatic", rune: "ᛏ", role: "Governance", color: "#8a9a9e" } },
    { id: "ticktickclock", type: "fort", position: { x: 440, y: 120 }, data: { label: "TickTickClock", rune: "ᛚ", role: "Temporal", color: "#5b6a8a" } },
    { id: "agentromatic", type: "fort", position: { x: 640, y: 120 }, data: { label: "AgenTroMatic", rune: "ᚹ", role: "Orchestration", color: "#c4956a" } },
    { id: "webhost", type: "fort", position: { x: 20, y: 380 }, data: { label: "WebHost", rune: "ᚠ", role: "Hosting", color: "#6ac48c" } },
    { id: "agentelic", type: "fort", position: { x: 220, y: 380 }, data: { label: "Agentelic", rune: "ᛜ", role: "Build Pipeline", color: "#e8a84c" } },
    { id: "fleetprompt", type: "fort", position: { x: 440, y: 380 }, data: { label: "FleetPrompt", rune: "ᚷ", role: "Marketplace", color: "#c4956a" } },
    { id: "bendscript", type: "fort", position: { x: 640, y: 380 }, data: { label: "BendScript", rune: "ᛊ", role: "Knowledge Editor", color: "#5b6a8a" } },
  ],
  edges: [
    e({ id: "e-graph-prism", source: "graphonomous", target: "prism", label: "OutcomeSignal", animated: true }),
    e({ id: "e-agentro-prism", source: "agentromatic", target: "prism", label: "OutcomeSignal", animated: true }),
    e({ id: "e-agentelic-webhost", source: "agentelic", target: "webhost", label: "Deploy", sourceHandle: "left-source", targetHandle: "right" }),
    e({ id: "e-agentelic-fleet", source: "agentelic", target: "fleetprompt", label: "AgentPublish", sourceHandle: "right" }),
    e({ id: "e-delegatic-all", source: "delegatic", target: "shared-ground", label: "PolicyEnforcement", animated: true }),
    e({ id: "e-prism-fleet", source: "prism", target: "fleetprompt", label: "ReputationUpdate" }),
  ],
};

// ── L1: Campus (Graphonomous fort) ──
export const L1 = {
  nodes: [
    { id: "retrieve", type: "room", position: { x: 80, y: 40 }, data: { label: "Retrieve", rune: "ᚲ", kind: "retrieve", timeout: 5000, state: "active" } },
    { id: "route", type: "room", position: { x: 420, y: 40 }, data: { label: "Route", rune: "ᚨ", kind: "route", timeout: 1000, state: "active" } },
    { id: "kappa-gate", type: "gate", position: { x: 280, y: 190 }, data: { label: "κ gate", detail: "κ=0 → act · κ>0 → deliberate" } },
    { id: "deliberate", type: "room", position: { x: 460, y: 190 }, data: { label: "Deliberate", rune: "ᚱ", kind: "deliberate", timeout: null, state: "idle" } },
    { id: "act", type: "room", position: { x: 80, y: 320 }, data: { label: "Act", rune: "ᚠ", kind: "act", timeout: 3000, state: "active" } },
    { id: "learn", type: "room", position: { x: 320, y: 420 }, data: { label: "Learn", rune: "ᛃ", kind: "learn", timeout: 2000, state: "active" } },
    { id: "consolidate", type: "room", position: { x: 560, y: 420 }, data: { label: "Consolidate", rune: "ᛞ", kind: "consolidate", timeout: 30000, state: "idle" } },
  ],
  edges: [
    e({ id: "e-ret-route", source: "retrieve", target: "route", sourceHandle: "right", targetHandle: "left", animated: true }),
    e({ id: "e-route-gate", source: "route", target: "kappa-gate" }),
    e({ id: "e-gate-act", source: "kappa-gate", target: "act", label: "κ=0", targetHandle: "top" }),
    e({ id: "e-gate-delib", source: "kappa-gate", target: "deliberate", label: "κ>0", sourceHandle: "right", targetHandle: "left" }),
    e({ id: "e-delib-act", source: "deliberate", target: "act" }),
    e({ id: "e-act-learn", source: "act", target: "learn", animated: true }),
    e({ id: "e-learn-consol", source: "learn", target: "consolidate", sourceHandle: "right", targetHandle: "left" }),
  ],
};

// ── L2: Wing (Retrieve wing detail) ──
export const L2 = {
  nodes: [
    { id: "semantic_memory", type: "room", position: { x: 60, y: 30 }, data: { label: "semantic_memory", rune: "ᚲ", tileCount: 42, confidence: 0.82, activity: 0.91, state: "active" } },
    { id: "causal_reasoning", type: "room", position: { x: 400, y: 30 }, data: { label: "causal_reasoning", rune: "ᚨ", tileCount: 18, confidence: 0.67, activity: 0.74, state: "pulsing" } },
    { id: "episodic_buffer", type: "room", position: { x: 60, y: 260 }, data: { label: "episodic_buffer", rune: "ᛃ", tileCount: 31, confidence: 0.55, activity: 0.23, state: "idle" } },
    { id: "goal_tracking", type: "room", position: { x: 400, y: 260 }, data: { label: "goal_tracking", rune: "ᛜ", tileCount: 8, confidence: 0.78, activity: 0.65, state: "active" } },
    { id: "kappa_gate", type: "gate", position: { x: 240, y: 430 }, data: { label: "κ gate", detail: "κ > 0 → deliberation corridor" } },
  ],
  edges: [
    e({ id: "e-sem-caus", source: "semantic_memory", target: "causal_reasoning", label: "0.88", sourceHandle: "right", targetHandle: "left", animated: true }),
    e({ id: "e-ep-sem", source: "episodic_buffer", target: "semantic_memory", label: "0.41" }),
    e({ id: "e-goal-caus", source: "goal_tracking", target: "causal_reasoning", label: "0.72" }),
    e({ id: "e-goal-sem", source: "goal_tracking", target: "semantic_memory", label: "0.65", sourceHandle: "left", targetHandle: "left" }),
    e({ id: "e-caus-gate", source: "causal_reasoning", target: "kappa_gate" }),
  ],
};

// ── L3: Room (semantic_memory detail) ──
export const L3 = {
  nodes: [
    { id: "node_a7f3c", type: "tile", position: { x: 40, y: 20 }, data: {
      label: "node_a7f3c", nodeType: "semantic", confidence: 0.94, timescale: "slow",
      content: "RuneFort renders PULSE loops as navigable forts",
      accessCount: 47, decayRate: 0.002
    }},
    { id: "node_b2e81", type: "tile", position: { x: 400, y: 20 }, data: {
      label: "node_b2e81", nodeType: "semantic", confidence: 0.71, timescale: "medium",
      content: "Dark factories need spatial observability for governance",
      accessCount: 12, decayRate: 0.01
    }},
    { id: "node_c9d44", type: "tile", position: { x: 220, y: 280 }, data: {
      label: "node_c9d44", nodeType: "procedural", confidence: 0.88, timescale: "slow",
      content: "Parse PULSE manifest → generate skeleton → populate rooms",
      accessCount: 33, decayRate: 0.003
    }},
  ],
  edges: [
    e({ id: "e-a-b", source: "node_a7f3c", target: "node_b2e81", label: "supports (0.76)", sourceHandle: "right", targetHandle: "left" }),
    e({ id: "e-a-c", source: "node_a7f3c", target: "node_c9d44", label: "derived_from (0.91)", animated: true }),
    e({ id: "e-b-c", source: "node_b2e81", target: "node_c9d44", label: "related (0.52)" }),
  ],
};

// ── L4: Rune (single operation trace) ──
export const L4 = {
  nodes: [
    { id: "rune-kaunan", type: "rune", position: { x: 150, y: 20 }, data: {
      rune: "ᚲ", runeName: "Kaunan", meaning: "torch / knowledge",
      operation: "retrieve_context", machine: "retrieve", kind: "retrieve",
      duration: "142ms", nodesReturned: 12, edgesReturned: 28,
      routing: "deliberate", reason: "κ=1 in scc_1"
    }},
    { id: "seq-retrieve", type: "gate", position: { x: 30, y: 340 }, data: { label: "ᚲ", detail: "retrieve" } },
    { id: "seq-route", type: "gate", position: { x: 200, y: 340 }, data: { label: "ᚨ", detail: "route" } },
    { id: "seq-deliberate", type: "gate", position: { x: 370, y: 340 }, data: { label: "ᚱ", detail: "deliberate" } },
    { id: "seq-act", type: "gate", position: { x: 540, y: 340 }, data: { label: "ᚠ", detail: "act" } },
  ],
  edges: [
    e({ id: "e-seq-1", source: "seq-retrieve", target: "seq-route", sourceHandle: "right", targetHandle: "left", animated: true }),
    e({ id: "e-seq-2", source: "seq-route", target: "seq-deliberate", sourceHandle: "right", targetHandle: "left", animated: true }),
    e({ id: "e-seq-3", source: "seq-deliberate", target: "seq-act", sourceHandle: "right", targetHandle: "left", animated: true }),
    e({ id: "e-rune-seq", source: "rune-kaunan", target: "seq-retrieve" }),
  ],
};

export const flowData = [L0, L1, L2, L3, L4];

// ── JSON panels (same data as old index.html) ──
export const jsonPanels = [
  `{
  "district": "runefort_ecosystem",
  "forts": [
    { "id": "graphonomous",  "loop": "graphonomous.memory_loop",      "schema": "(sqlite)" },
    { "id": "webhost",       "loop": "webhost.deploy_invoke",         "schema": "webhost.*" },
    { "id": "bendscript",    "loop": "bendscript.knowledge_edit",     "schema": "kag.*" },
    { "id": "agentromatic",  "loop": "agentromatic.deliberation",     "schema": "orchestrate.*" },
    { "id": "delegatic",     "loop": "delegatic.governance",          "schema": "govern.*" },
    { "id": "agentelic",     "loop": "agentelic.build_pipeline",      "schema": "agentelic.*" },
    { "id": "fleetprompt",   "loop": "fleetprompt.marketplace",       "schema": "fleet.*" },
    { "id": "geofleetic",    "loop": "geofleetic.fleet_learning",     "schema": "geo.*" },
    { "id": "ticktickclock", "loop": "ticktickclock.temporal_learning","schema": "temporal.*" }
  ],
  "shared_ground": {
    "schema": "amp.*",
    "tables": ["profiles", "workspaces", "members", "entitlements"]
  },
  "bridges": [
    { "from": "graphonomous",  "to": "prism",       "tokens": ["OutcomeSignal"] },
    { "from": "prism",         "to": "fleetprompt",  "tokens": ["ReputationUpdate"] },
    { "from": "agentromatic",  "to": "prism",        "tokens": ["OutcomeSignal"] },
    { "from": "deliberatic",   "to": "agentromatic", "tokens": ["DeliberationResult"] },
    { "from": "delegatic",     "to": "*",            "tokens": ["PolicyEnforcement"] },
    { "from": "agentelic",     "to": "fleetprompt",  "tokens": ["AgentPublish"] },
    { "from": "agentelic",     "to": "webhost",      "tokens": ["Deploy"] }
  ],
  "bedrock": "opensentience (OS-001 through OS-010)"
}`,
  `{
  "pulse_version": "0.1",
  "loop_id": "graphonomous.memory_loop",
  "version": "0.4.0",
  "description": "Continual learning memory loop — 5 phase machines",
  "phases": [
    { "id": "retrieve_context", "kind": "retrieve", "timeout_ms": 5000,
      "inputs": ["query", "workspace_id"], "outputs": ["context_nodes", "topology"] },
    { "id": "route_topology", "kind": "route", "timeout_ms": 1000,
      "inputs": ["context_nodes", "topology"], "outputs": ["routing_decision", "kappa_value"] },
    { "id": "act_mutate", "kind": "act", "timeout_ms": 3000,
      "inputs": ["routing_decision", "new_knowledge"], "outputs": ["stored_nodes", "updated_edges"] },
    { "id": "learn_outcome", "kind": "learn", "timeout_ms": 2000,
      "inputs": ["action_result", "outcome_signal"], "outputs": ["confidence_deltas", "belief_updates"] },
    { "id": "consolidate_idle", "kind": "consolidate", "timeout_ms": 30000,
      "inputs": ["graph_state", "decay_thresholds"], "outputs": ["merged_nodes", "pruned_nodes"] }
  ],
  "substrates": {
    "memory": "sqlite://graphonomous.db",
    "policy": "delegatic://workspace/{ws_id}",
    "time": "ticktickclock://workspace/{ws_id}"
  },
  "invariants": {
    "phase_atomicity": true, "feedback_immutability": true,
    "kappa_routing": true, "outcome_grounding": true
  }
}`,
  `{
  "wing": "retrieve",
  "fort": "graphonomous.memory_loop",
  "rooms": [
    { "id": "semantic_memory", "tile_count": 42, "node_types": ["semantic", "procedural"],
      "avg_confidence": 0.82, "activity": 0.91, "state": "active" },
    { "id": "causal_reasoning", "tile_count": 18, "node_types": ["causal", "outcome"],
      "avg_confidence": 0.67, "activity": 0.74, "state": "pulsing" },
    { "id": "episodic_buffer", "tile_count": 31, "node_types": ["episodic", "temporal"],
      "avg_confidence": 0.55, "activity": 0.23, "state": "idle" },
    { "id": "goal_tracking", "tile_count": 8, "node_types": ["goal"],
      "avg_confidence": 0.78, "activity": 0.65, "state": "active" }
  ],
  "corridors": [
    { "from": "semantic_memory", "to": "causal_reasoning", "weight": 0.88 },
    { "from": "episodic_buffer", "to": "semantic_memory", "weight": 0.41 },
    { "from": "goal_tracking", "to": "causal_reasoning", "weight": 0.72 }
  ],
  "gates": [
    { "id": "kappa_gate", "filter": "κ > 0 → deliberation_corridor", "state": "open" }
  ]
}`,
  `{
  "room": "semantic_memory",
  "nodes": [
    { "id": "node_a7f3c", "type": "semantic",
      "content": "RuneFort renders PULSE loops as navigable forts",
      "confidence": 0.94, "timescale": "slow", "access_count": 47 },
    { "id": "node_b2e81", "type": "semantic",
      "content": "Dark factories need spatial observability for governance",
      "confidence": 0.71, "timescale": "medium", "access_count": 12 },
    { "id": "node_c9d44", "type": "procedural",
      "content": "Parse PULSE manifest → generate skeleton → populate rooms",
      "confidence": 0.88, "timescale": "slow", "access_count": 33 }
  ],
  "edges": [
    { "from": "node_a7f3c", "to": "node_b2e81", "type": "supports", "weight": 0.76 },
    { "from": "node_a7f3c", "to": "node_c9d44", "type": "derived_from", "weight": 0.91 },
    { "from": "node_b2e81", "to": "node_c9d44", "type": "related", "weight": 0.52 }
  ],
  "metrics": { "total_nodes": 42, "avg_confidence": 0.82, "scc_count": 2, "kappa": 0 }
}`,
  `{
  "rune": "ᚲ", "rune_name": "Kaunan",
  "meaning": "torch / knowledge — illuminating what is known",
  "operation": "retrieve_context",
  "phase": { "id": "retrieve_context", "kind": "retrieve", "machine": "retrieve" },
  "invocation": {
    "tool": "graphonomous.retrieve", "action": "context",
    "params": { "query": "dark factory spatial observability", "max_nodes": 50, "min_confidence": 0.3 }
  },
  "execution": {
    "duration_ms": 142, "nodes_returned": 12, "edges_returned": 28,
    "topology": {
      "sccs": [
        { "id": "scc_0", "nodes": ["node_a7f3c", "node_b2e81"], "kappa": 0 },
        { "id": "scc_1", "nodes": ["node_d1f22", "node_e3a99", "node_f7b11"], "kappa": 1 }
      ],
      "routing": "deliberate",
      "reason": "κ=1 detected in scc_1 — cyclic belief requires deliberation"
    }
  },
  "causal_provenance": {
    "triggered_by": "user_query", "trace_id": "tr_2026-04-14_091200_a7f3c",
    "child_phases": ["route_topology"]
  },
  "rune_sequence": "ᚲ → ᚨ → ᚱ → ᚠ"
}`
];
