// Starter Fort loader (spec §0.5, §9 Phase 0).
//
// First-time visitors to `/app` MUST NOT see an empty canvas. This module
// reads `static/starter.pulse.json`, seeds the fort store with 3 rooms + 2
// corridors + 1 wall, and drives a synthetic pulse — a token travels along
// the corridor, a room glows thermally, a consolidation ripple fires every
// ~15 s — all without needing an MCP server. Connecting Graphonomous/PRISM
// later swaps synthetic for live signals on the same fort.

import { getStarterManifest } from "./builtins.js";
import { getFort } from "$lib/stores/fort.svelte.js";
import { layoutCampus } from "./latticeLayout.js";
import { seedNodeGeometry } from "./nodeGeometry.js";

/** @type {ReturnType<typeof setInterval>|null} */
let _pulseInterval = null;
/** @type {ReturnType<typeof setInterval>|null} */
let _rippleInterval = null;

const ROOM_ACTIVITY_CYCLE_MS = 2000;
const RIPPLE_CYCLE_MS = 15000;

/**
 * Seed the fort store with the Starter Fort layout and start synthetic pulses.
 * Idempotent — safe to call twice; a second call restarts the pulses from the
 * current manifest.
 *
 * @returns {Promise<void>}
 */
export async function loadStarterFort() {
  const manifest = await getStarterManifest();
  const seed = manifest.starter_seed ?? { rooms: [], corridors: [], walls: [] };

  /** @type {any[]} */
  const nodes = [];
  /** @type {any[]} */
  const edges = [];

  // Rooms — positions get rewritten by layoutCampus below; seed at origin so
  // a hand-inspection of the node list stays readable.
  seed.rooms.forEach((/** @type {any} */ room) => {
    nodes.push(seedNodeGeometry({
      id: room.id,
      type: "room",
      position: { x: 0, y: 0 },
      data: {
        label: room.label,
        rune: room.kind === "retrieve" ? "ᚲ" : room.kind === "route" ? "ᚨ" : room.kind === "act" ? "ᚠ" : room.kind === "learn" ? "ᛃ" : room.kind === "consolidate" ? "ᛞ" : "·",
        kind: room.kind,
        state: "idle",
        activity: room.activity ?? 0.3,
        tileCount: 4,
      },
    }));
  });

  // Walls — id encodes the host room (`wall-<roomId>`) so layoutCampus can
  // pin each wall above its host without an explicit roomId field.
  seed.walls?.forEach((/** @type {any} */ wall) => {
    nodes.push(seedNodeGeometry({
      id: `wall-${wall.room}`,
      type: "wall",
      position: { x: 0, y: 0 },
      data: {
        label: "policy",
        rune: wall.rune,
        color: "rgba(91, 106, 138, 0.55)",
        note: wall.note,
        roomId: wall.room,
      },
    }));
  });

  // Clocktower — spec §6.2 cadence beacon. One per fort; layoutCampus will
  // center it above the room row. cadenceMs falls back to 1500 ms so the
  // beat and the livingFort.js TICK_MS stay in phase.
  const cadenceMs = manifest?.cadence?.target_ms ?? 1500;
  if (seed.rooms.length > 0) {
    nodes.push(seedNodeGeometry({
      id: "clocktower-starter",
      type: "clocktower",
      position: { x: 0, y: 0 },
      data: {
        label: "Cadence",
        tick: 0,
        phase: "retrieve",
        cadenceMs,
      },
    }));
  }

  // Goal seeds — spec §6.3. Three demo goals wake the GoalSeedNode and let
  // the Living Fort cycle through the five states (proposed → active →
  // completed/failed/blocked) so a cold user sees goal coverage move.
  const goalSeeds = [
    { id: "goal-ingest",   label: "Ingest repo",        detail: "scan /src", state: "active",   progress: 0.35 },
    { id: "goal-harden",   label: "Harden auth",        detail: "session ttl", state: "proposed" },
    { id: "goal-docs",     label: "Publish onboarding", detail: "first-run tour", state: "blocked", blockedBy: "legal review" },
  ];
  goalSeeds.forEach((g) => {
    nodes.push(seedNodeGeometry({
      id: g.id,
      type: "goalseed",
      position: { x: 0, y: 0 },
      data: {
        label: g.label,
        detail: g.detail,
        state: g.state,
        progress: g.progress,
        blockedBy: g.blockedBy,
      },
    }));
  });

  // Corridors — one animated edge per declared corridor
  seed.corridors?.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
    edges.push({
      id: `edge-${c.from}-${c.to}`,
      source: c.from,
      target: c.to,
      type: "animated",
      animated: true,
      data: { synthetic: true },
    });
  });

  // Arrange on a uniform lattice — rooms flow by PULSE kind, walls pin to
  // their host rooms, clocktower centers on the row, goals drop below.
  layoutCampus({ nodes, edges });

  const fort = getFort();
  fort.zoomLevel = 1;
  fort.activeFortId = "starter";
  fort.activeRoomId = null;
  fort.activeNodeId = null;
  fort.nodes = nodes;
  fort.edges = edges;
  fort.manifest = manifest;
  fort.savedFortId = null;
  fort.fortName = "Starter Fort";
  fort.dirty = false;

  startSyntheticPulses(seed);
}

/**
 * Drive synthetic activity: each room cycles through idle/active/pulsing so
 * the Thermal and Flow overlays have something to animate even when no MCP is
 * connected. Respects `prefers-reduced-motion` by running a single activity
 * sweep (no continuous pulse).
 * @param {any} seed
 */
function startSyntheticPulses(seed) {
  stopSyntheticPulses();

  /** @type {MediaQueryList | null} */
  const mq = typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
  const reducedMotion = mq?.matches === true;

  const fort = getFort();
  const roomIds = seed.rooms.map((/** @type {any} */ r) => r.id);
  if (roomIds.length === 0) return;

  // Ticker — sequentially flips each room to "active" / "pulsing" in turn.
  // `fort.nodes` is $state.raw, so reassign with a fresh array on every tick;
  // shallow-clone the mutated room nodes so Svelte Flow's structural-equality
  // check detects the change and re-runs dependent derivations.
  let step = 0;
  const tick = () => {
    const activeIdx = step % roomIds.length;
    fort.nodes = fort.nodes.map((n) => {
      if (!roomIds.includes(n.id)) return n;
      const i = roomIds.indexOf(n.id);
      const state = i === activeIdx ? "active" : i === (activeIdx + 1) % roomIds.length ? "pulsing" : "idle";
      const activity = i === activeIdx ? 0.9 : i === (activeIdx + 1) % roomIds.length ? 0.55 : 0.2;
      return { ...n, data: { ...n.data, state, activity } };
    });
    step += 1;
  };
  tick();

  if (!reducedMotion) {
    _pulseInterval = setInterval(tick, ROOM_ACTIVITY_CYCLE_MS);
    _rippleInterval = setInterval(() => {
      // Consolidation ripple — briefly brighten every room then fall back.
      fort.nodes = fort.nodes.map((n) => {
        if (!roomIds.includes(n.id)) return n;
        return { ...n, data: { ...n.data, state: "pulsing", activity: 1 } };
      });
      setTimeout(tick, 600);
    }, RIPPLE_CYCLE_MS);
  }
}

/** Stop both synthetic-pulse intervals. Safe to call when none are running. */
export function stopSyntheticPulses() {
  if (_pulseInterval) { clearInterval(_pulseInterval); _pulseInterval = null; }
  if (_rippleInterval) { clearInterval(_rippleInterval); _rippleInterval = null; }
}

/** Whether synthetic pulses are running right now. */
export function isSyntheticActive() {
  return _pulseInterval !== null;
}
