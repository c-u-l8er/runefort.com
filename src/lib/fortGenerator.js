/**
 * Fort Generator — transforms PULSE manifests into Svelte Flow nodes/edges
 * at each of the 5 zoom levels (L0 District → L4 Rune).
 */

// ── Rune mappings ──
const PHASE_RUNES = {
  retrieve: "ᚲ", route: "ᚨ", act: "ᚠ", learn: "ᛃ", consolidate: "ᛞ",
  deliberate: "ᚱ", observe: "ᛉ", diagnose: "ᛉ", compose: "ᛜ",
  reflect: "ᛞ", interact: "ᚠ",
};

const PHASE_COLORS = {
  retrieve: "#e8a84c", route: "#8a9a9e", act: "#6ac48c",
  learn: "#c4956a", consolidate: "#5b6a8a", deliberate: "#e85a5a",
  observe: "#e85a5a", diagnose: "#e85a5a", compose: "#e8a84c",
  reflect: "#5b6a8a", interact: "#6ac48c",
};

const NODE_TYPES_BY_ROOM = {
  retrieve: ["semantic", "procedural", "episodic"],
  route: ["causal", "outcome"],
  act: ["semantic", "procedural"],
  learn: ["outcome", "temporal"],
  consolidate: ["semantic", "episodic"],
};

const TIMESCALES = ["fast", "medium", "slow", "glacial"];

function e(edge) {
  return { sourceHandle: "bottom", targetHandle: "top", ...edge };
}

/** Pseudo-random seeded by string */
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ── Demo PULSE manifests for each ecosystem fort ──
export const DEMO_MANIFESTS = {
  graphonomous: {
    loop_id: "graphonomous.memory_loop",
    label: "Graphonomous", rune: "ᚲ", color: "#e8a84c",
    role: "Memory Substrate", schema: "(sqlite)",
    phases: [
      { id: "retrieve_context", kind: "retrieve", timeout_ms: 5000 },
      { id: "route_topology", kind: "route", timeout_ms: 1000 },
      { id: "act_mutate", kind: "act", timeout_ms: 3000 },
      { id: "learn_outcome", kind: "learn", timeout_ms: 2000 },
      { id: "consolidate_idle", kind: "consolidate", timeout_ms: 30000 },
    ],
    hasKappaGate: true,
  },
  delegatic: {
    loop_id: "delegatic.governance",
    label: "Delegatic", rune: "ᛏ", color: "#8a9a9e",
    role: "Governance", schema: "govern.*",
    phases: [
      { id: "retrieve_policy", kind: "retrieve", timeout_ms: 3000 },
      { id: "route_decision", kind: "route", timeout_ms: 500 },
      { id: "act_enforce", kind: "act", timeout_ms: 2000 },
      { id: "learn_drift", kind: "learn", timeout_ms: 5000 },
      { id: "consolidate_audit", kind: "consolidate", timeout_ms: 15000 },
    ],
    hasKappaGate: false,
  },
  ticktickclock: {
    loop_id: "ticktickclock.temporal_learning",
    label: "TickTickClock", rune: "ᛚ", color: "#5b6a8a",
    role: "Temporal", schema: "temporal.*",
    phases: [
      { id: "retrieve_stream", kind: "retrieve", timeout_ms: 2000 },
      { id: "route_engine", kind: "route", timeout_ms: 300 },
      { id: "act_process", kind: "act", timeout_ms: 1000 },
      { id: "learn_consolidate", kind: "learn", timeout_ms: 5000 },
      { id: "consolidate_promote", kind: "consolidate", timeout_ms: 20000 },
    ],
    hasKappaGate: false,
  },
  webhost: {
    loop_id: "webhost.deploy_invoke",
    label: "WebHost", rune: "ᚠ", color: "#6ac48c",
    role: "Hosting", schema: "webhost.*",
    phases: [
      { id: "retrieve_deployment", kind: "retrieve", timeout_ms: 3000 },
      { id: "route_runtime", kind: "route", timeout_ms: 500 },
      { id: "act_invoke", kind: "act", timeout_ms: 5000 },
      { id: "learn_telemetry", kind: "learn", timeout_ms: 2000 },
      { id: "consolidate_billing", kind: "consolidate", timeout_ms: 30000 },
    ],
    hasKappaGate: false,
  },
  agentelic: {
    loop_id: "agentelic.build_pipeline",
    label: "Agentelic", rune: "ᛜ", color: "#e8a84c",
    role: "Build Pipeline", schema: "agentelic.*",
    phases: [
      { id: "retrieve_spec", kind: "retrieve", timeout_ms: 3000 },
      { id: "route_pipeline", kind: "route", timeout_ms: 500 },
      { id: "act_build", kind: "act", timeout_ms: 10000 },
      { id: "learn_build", kind: "learn", timeout_ms: 3000 },
      { id: "consolidate_artifacts", kind: "consolidate", timeout_ms: 10000 },
    ],
    hasKappaGate: false,
  },
  agentromatic: {
    loop_id: "agentromatic.deliberation",
    label: "AgenTroMatic", rune: "ᚹ", color: "#c4956a",
    role: "Orchestration", schema: "orchestrate.*",
    phases: [
      { id: "bidding", kind: "retrieve", timeout_ms: 5000 },
      { id: "overlap_analysis", kind: "route", timeout_ms: 2000 },
      { id: "negotiation", kind: "deliberate", timeout_ms: 10000 },
      { id: "election", kind: "route", timeout_ms: 3000 },
      { id: "execution", kind: "act", timeout_ms: 15000 },
      { id: "consensus_commit", kind: "act", timeout_ms: 5000 },
      { id: "learn_reputation", kind: "learn", timeout_ms: 3000 },
    ],
    hasKappaGate: false,
  },
  fleetprompt: {
    loop_id: "fleetprompt.marketplace",
    label: "FleetPrompt", rune: "ᚷ", color: "#c4956a",
    role: "Marketplace", schema: "fleet.*",
    phases: [
      { id: "retrieve_manifest", kind: "retrieve", timeout_ms: 3000 },
      { id: "route_discovery", kind: "route", timeout_ms: 1000 },
      { id: "act_install", kind: "act", timeout_ms: 5000 },
      { id: "learn_trust", kind: "learn", timeout_ms: 2000 },
      { id: "consolidate_registry", kind: "consolidate", timeout_ms: 15000 },
    ],
    hasKappaGate: false,
  },
  bendscript: {
    loop_id: "bendscript.knowledge_edit",
    label: "BendScript", rune: "ᛊ", color: "#5b6a8a",
    role: "Knowledge Editor", schema: "kag.*",
    phases: [
      { id: "retrieve_graph", kind: "retrieve", timeout_ms: 3000 },
      { id: "route_synthesis", kind: "route", timeout_ms: 500 },
      { id: "act_compose", kind: "act", timeout_ms: 5000 },
      { id: "learn_topology", kind: "learn", timeout_ms: 3000 },
      { id: "consolidate_export", kind: "consolidate", timeout_ms: 10000 },
    ],
    hasKappaGate: false,
  },
  prism: {
    loop_id: "prism.benchmark",
    label: "PRISM", rune: "ᛉ", color: "#e85a5a",
    role: "Watchtower Complex", schema: "(implicit)",
    phases: [
      { id: "compose", kind: "compose", timeout_ms: 10000 },
      { id: "interact", kind: "interact", timeout_ms: 60000 },
      { id: "observe", kind: "observe", timeout_ms: 15000 },
      { id: "reflect", kind: "reflect", timeout_ms: 10000 },
      { id: "diagnose", kind: "diagnose", timeout_ms: 5000 },
    ],
    hasKappaGate: false,
  },
  geofleetic: {
    loop_id: "geofleetic.fleet_learning",
    label: "GeoFleetic", rune: "ᚢ", color: "#6ac48c",
    role: "Spatial Intelligence", schema: "geo.*",
    phases: [
      { id: "retrieve_twin", kind: "retrieve", timeout_ms: 3000 },
      { id: "route_optimizer", kind: "route", timeout_ms: 2000 },
      { id: "act_move", kind: "act", timeout_ms: 5000 },
      { id: "learn_federated", kind: "learn", timeout_ms: 10000 },
      { id: "consolidate_routes", kind: "consolidate", timeout_ms: 15000 },
    ],
    hasKappaGate: false,
  },
};

// ── L0: District Generator ──
function generateDistrict() {
  const fortIds = Object.keys(DEMO_MANIFESTS);
  const cols = 4;
  const xSpacing = 220;
  const ySpacing = 180;

  const nodes = [
    {
      id: "shared-ground",
      type: "gate",
      position: { x: cols * xSpacing / 2 - 60, y: -30 },
      data: { label: "amp.*", detail: "Shared identity · workspaces · entitlements" },
    },
    {
      id: "bedrock",
      type: "gate",
      position: { x: cols * xSpacing / 2 - 60, y: Math.ceil(fortIds.length / cols) * ySpacing + 80 },
      data: { label: "OpenSentience", detail: "OS-001 through OS-010 · bedrock protocols" },
    },
  ];

  fortIds.forEach((id, i) => {
    const m = DEMO_MANIFESTS[id];
    const col = i % cols;
    const row = Math.floor(i / cols);
    nodes.push({
      id,
      type: "fort",
      position: { x: col * xSpacing + 20, y: row * ySpacing + 70 },
      data: {
        label: m.label,
        rune: m.rune,
        role: m.role,
        color: m.color,
      },
    });
  });

  const edges = [
    e({ id: "e-graph-prism", source: "graphonomous", target: "prism", label: "OutcomeSignal", animated: true }),
    e({ id: "e-agentro-prism", source: "agentromatic", target: "prism", label: "OutcomeSignal", animated: true }),
    e({ id: "e-agentelic-webhost", source: "agentelic", target: "webhost", label: "Deploy", sourceHandle: "right", targetHandle: "left" }),
    e({ id: "e-agentelic-fleet", source: "agentelic", target: "fleetprompt", label: "AgentPublish", sourceHandle: "right", targetHandle: "left" }),
    e({ id: "e-delegatic-ground", source: "delegatic", target: "shared-ground", label: "PolicyEnforcement", animated: true }),
    e({ id: "e-prism-fleet", source: "prism", target: "fleetprompt", label: "ReputationUpdate" }),
    e({ id: "e-ttc-webhost", source: "ticktickclock", target: "webhost", label: "SLA", sourceHandle: "left", targetHandle: "right" }),
    e({ id: "e-geo-graph", source: "geofleetic", target: "graphonomous", label: "Patterns", sourceHandle: "left", targetHandle: "right" }),
  ];

  return { nodes, edges };
}

// ── L1: Campus Generator ──
function generateCampus(manifest) {
  const nodes = [];
  const edges = [];
  const xStart = 80;
  const ySpacing = 160;
  const xSpacing = 340;
  let prevId = null;

  manifest.phases.forEach((phase, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = xStart + col * xSpacing;
    const y = 40 + row * ySpacing;
    const activity = 0.3 + (hash(phase.id) % 70) / 100;
    const state = activity > 0.7 ? "active" : activity > 0.4 ? "pulsing" : "idle";

    nodes.push({
      id: phase.id,
      type: "room",
      position: { x, y },
      data: {
        label: phase.id.replace(/_/g, " "),
        rune: PHASE_RUNES[phase.kind] || "ᚠ",
        kind: phase.kind,
        timeout: phase.timeout_ms,
        state,
        activity,
      },
    });

    if (prevId) {
      edges.push(
        e({
          id: `e-${prevId}-${phase.id}`,
          source: prevId,
          target: phase.id,
          animated: true,
          sourceHandle: col === 0 ? "right" : "bottom",
          targetHandle: col === 0 ? "left" : "top",
        })
      );
    }
    prevId = phase.id;
  });

  // Add kappa gate for systems that have it
  if (manifest.hasKappaGate) {
    const routePhase = manifest.phases.find((p) => p.kind === "route");
    const actPhase = manifest.phases.find((p) => p.kind === "act");
    if (routePhase && actPhase) {
      const routeNode = nodes.find((n) => n.id === routePhase.id);
      if (routeNode) {
        nodes.push({
          id: "kappa-gate",
          type: "gate",
          position: { x: routeNode.position.x + 170, y: routeNode.position.y + 80 },
          data: { label: "κ gate", detail: "κ=0 → act · κ>0 → deliberate" },
        });
        edges.push(
          e({ id: "e-route-kgate", source: routePhase.id, target: "kappa-gate" }),
          e({ id: "e-kgate-act", source: "kappa-gate", target: actPhase.id, label: "κ=0" })
        );
      }
    }
  }

  return { nodes, edges };
}

// ── L2: Wing Generator ──
function generateWing(manifest, roomId) {
  const nodes = [];
  const edges = [];
  const phase = manifest?.phases?.find((p) => p.id === roomId);
  const kind = phase?.kind || "retrieve";
  const types = NODE_TYPES_BY_ROOM[kind] || ["semantic"];
  const roomCount = 3 + (hash(roomId || "default") % 3);

  for (let i = 0; i < roomCount; i++) {
    const nodeType = types[i % types.length];
    const id = `${kind}_${nodeType}_${i}`;
    const tileCount = 5 + (hash(id) % 40);
    const confidence = 0.4 + (hash(id + "c") % 55) / 100;
    const activity = 0.1 + (hash(id + "a") % 90) / 100;
    const state = activity > 0.75 ? "active" : activity > 0.4 ? "pulsing" : "idle";

    nodes.push({
      id,
      type: "room",
      position: { x: (i % 2) * 360 + 60, y: Math.floor(i / 2) * 230 + 30 },
      data: {
        label: id.replace(/_/g, " "),
        rune: PHASE_RUNES[kind] || "ᚲ",
        tileCount,
        confidence: +confidence.toFixed(2),
        activity: +activity.toFixed(2),
        state,
      },
    });
  }

  // Connect rooms
  for (let i = 0; i < nodes.length - 1; i++) {
    const weight = 0.3 + (hash(nodes[i].id + nodes[i + 1].id) % 60) / 100;
    edges.push(
      e({
        id: `e-wing-${i}`,
        source: nodes[i].id,
        target: nodes[i + 1].id,
        label: weight.toFixed(2),
        animated: weight > 0.7,
      })
    );
  }

  // Add a gate
  nodes.push({
    id: `${kind}_gate`,
    type: "gate",
    position: { x: 200, y: nodes.length * 100 + 60 },
    data: { label: `${kind} gate`, detail: `exit → next phase` },
  });
  edges.push(
    e({
      id: `e-wing-gate`,
      source: nodes[nodes.length - 2].id,
      target: `${kind}_gate`,
    })
  );

  return { nodes, edges };
}

// ── L3: Room Generator ──
function generateRoom(manifest, nodeId) {
  const nodes = [];
  const edges = [];
  const count = 3 + (hash(nodeId || "room") % 4);
  const contents = [
    "Core knowledge structure for spatial rendering",
    "Policy enforcement checkpoint for governance layer",
    "Parse PULSE manifest → generate skeleton → populate rooms",
    "Bridge token exchange protocol (CloudEvents v1)",
    "Timescale promotion: fast → medium → slow → glacial",
    "Confidence decay rate inversely proportional to access frequency",
    "SCC detection via Tarjan — κ routing on cyclicity",
  ];

  for (let i = 0; i < count; i++) {
    const id = `node_${hash(nodeId + "_n" + i).toString(16).padStart(5, "0").slice(-5)}_${i}`;
    const confidence = 0.3 + (hash(id) % 65) / 100;
    const accessCount = 1 + (hash(id + "ac") % 60);
    const tsIdx = hash(id + "ts") % TIMESCALES.length;

    nodes.push({
      id,
      type: "tile",
      position: { x: (i % 2) * 380 + 40, y: Math.floor(i / 2) * 200 + 20 },
      data: {
        label: id,
        nodeType: ["semantic", "procedural", "episodic", "causal"][i % 4],
        confidence: +confidence.toFixed(2),
        timescale: TIMESCALES[tsIdx],
        content: contents[i % contents.length],
        accessCount,
        decayRate: +(0.001 + (hash(id + "dr") % 20) / 1000).toFixed(3),
      },
    });
  }

  for (let i = 0; i < nodes.length - 1; i++) {
    const types = ["supports", "derived_from", "related", "causal", "contradicts"];
    const type = types[hash(nodes[i].id + nodes[i + 1].id) % types.length];
    const weight = 0.3 + (hash(nodes[i].id + nodes[i + 1].id + "w") % 65) / 100;
    edges.push(
      e({
        id: `e-room-${i}`,
        source: nodes[i].id,
        target: nodes[i + 1].id,
        label: `${type} (${weight.toFixed(2)})`,
        animated: type === "derived_from",
      })
    );
  }

  // Cross edges for richer graph
  if (nodes.length > 2) {
    edges.push(
      e({
        id: "e-room-cross",
        source: nodes[0].id,
        target: nodes[nodes.length - 1].id,
        label: "related (0.52)",
        sourceHandle: "right",
        targetHandle: "left",
      })
    );
  }

  return { nodes, edges };
}

// ── L4: Rune Generator ──
function generateRune(manifest, nodeId) {
  const h = hash(nodeId || "rune");
  const kinds = Object.keys(PHASE_RUNES);
  const kind = kinds[h % kinds.length];
  const rune = PHASE_RUNES[kind];
  const runeNames = {
    "ᚲ": "Kaunan", "ᚨ": "Ansuz", "ᚠ": "Fehu", "ᛃ": "Jera", "ᛞ": "Dagaz",
    "ᛉ": "Algiz", "ᚱ": "Raidho", "ᛏ": "Tiwaz", "ᛊ": "Sowilo", "ᛈ": "Perthro",
    "ᛜ": "Ingwaz", "ᚹ": "Wunjo", "ᚢ": "Uruz", "ᚷ": "Gebo",
  };
  const meanings = {
    "ᚲ": "torch / knowledge", "ᚨ": "signal", "ᚠ": "wealth / store",
    "ᛃ": "harvest / cycle", "ᛞ": "dawn / breakthrough", "ᛉ": "protection",
    "ᚱ": "journey / path", "ᛏ": "justice", "ᛊ": "sun / time",
    "ᛈ": "mystery / chance", "ᛜ": "seed / potential", "ᚹ": "joy / harmony",
    "ᚢ": "strength", "ᚷ": "gift / exchange",
  };

  const duration = 20 + (h % 300);
  const nodesReturned = 2 + (h % 20);
  const edgesReturned = nodesReturned + (h % 30);
  const hasKappa = h % 3 === 0;

  const nodes = [
    {
      id: "rune-detail",
      type: "rune",
      position: { x: 150, y: 20 },
      data: {
        rune,
        runeName: runeNames[rune] || "Unknown",
        meaning: meanings[rune] || "hidden operation",
        operation: `${kind}_${nodeId || "op"}`,
        machine: kind,
        kind,
        duration: `${duration}ms`,
        nodesReturned,
        edgesReturned,
        routing: hasKappa ? "deliberate" : "direct",
        reason: hasKappa ? `κ=1 in scc_0` : "κ=0 — fast path",
      },
    },
  ];

  // Rune sequence
  const seq = hasKappa
    ? [
        { r: "ᚲ", d: "retrieve" },
        { r: "ᚨ", d: "route" },
        { r: "ᚱ", d: "deliberate" },
        { r: "ᚠ", d: "act" },
      ]
    : [
        { r: "ᚲ", d: "retrieve" },
        { r: "ᚨ", d: "route" },
        { r: "ᚠ", d: "act" },
        { r: "ᛃ", d: "learn" },
      ];

  seq.forEach((s, i) => {
    nodes.push({
      id: `seq-${i}`,
      type: "gate",
      position: { x: 30 + i * 170, y: 340 },
      data: { label: s.r, detail: s.d },
    });
  });

  const edges = [];
  for (let i = 0; i < seq.length - 1; i++) {
    edges.push(
      e({
        id: `e-seq-${i}`,
        source: `seq-${i}`,
        target: `seq-${i + 1}`,
        sourceHandle: "right",
        targetHandle: "left",
        animated: true,
      })
    );
  }
  edges.push(e({ id: "e-rune-seq", source: "rune-detail", target: "seq-0" }));

  return { nodes, edges };
}

/**
 * Main generator entry point
 * @param {'district' | 'campus' | 'wing' | 'room' | 'rune'} level
 * @param {object | null} manifest - PULSE manifest data
 * @param {string} [contextId] - fort/room/node ID for zoom context
 * @returns {{ nodes: object[], edges: object[] }}
 */
export function generateFortFromManifest(level, manifest, contextId) {
  switch (level) {
    case "district": return generateDistrict();
    case "campus": return generateCampus(manifest);
    case "wing": return generateWing(manifest, contextId);
    case "room": return generateRoom(manifest, contextId);
    case "rune": return generateRune(manifest, contextId);
    default: return { nodes: [], edges: [] };
  }
}
