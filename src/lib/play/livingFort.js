// Living Fort — synthetic lifecycle driver (spec §6.1).
//
// Cycles the 11 structural dynamics of §6.1 on any fort whose nodes support
// them. Runs as a fallback when MCP telemetry is disconnected so the fort
// is never visually still in demo mode; flipping `useTelemetry: true` later
// will make this module yield to the telemetry store without changing the
// node component contracts.
//
// Behaviors driven here:
//   1.  room brightens (activity ↑)
//   2.  room dims (activity ↓)
//   3.  room seals (state="sealed")
//   4.  room grows (lifecycle="growing", 600ms transient)
//   5.  room shrinks (lifecycle="shrinking", 600ms transient)
//   6.  corridor pulses on κ>0 (hall.kappa toggles)
//   7.  wall thickens (wall.tileMultiplier → 2..3)
//   8.  wall thins (wall.tileMultiplier → 1)
//   9.  gate open/close (gate.gateState flip)
//   10. tower fires (tower.state="alert" burst)
//   11. bridge token transit (bridge.tokenInFlight flag)
//
// Performance budget: one 1.5s interval, ≤ 8 mutations per tick.

import { getFort } from "$lib/stores/fort.svelte.js";
import { CONSOLIDATION_DURATION } from "$lib/overlayEffects.js";

/** Canonical PULSE phase kinds; the clocktower rotates through these. */
const PHASE_KINDS = /** @type {const} */ (["retrieve", "route", "act", "learn", "consolidate"]);

/** Consolidation event kinds (spec §6.2). */
const CONSOLIDATION_KINDS = /** @type {const} */ ([
  "decay", "prune", "merge", "strengthen", "promote", "abstract",
]);

/** @type {ReturnType<typeof setInterval>|null} */
let _tick = null;
/** @type {MediaQueryList | null} */
let _mq = null;
/** @type {((e: MediaQueryListEvent) => void) | null} */
let _mqHandler = null;
let _step = 0;

const TICK_MS = 1500;

/** Start the living-fort synthetic driver. Idempotent. */
export function startLivingFort() {
  stopLivingFort();
  _mq = typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
  if (_mq?.matches) {
    // In reduced-motion, run a single pass so rooms reach terminal states,
    // then stop — no continuous animation.
    drive();
    return;
  }
  _mqHandler = (/** @type {MediaQueryListEvent} */ e) => {
    if (e.matches) stopLivingFort();
  };
  _mq?.addEventListener?.("change", _mqHandler);
  drive(); // initial tick so first render shows something live
  _tick = setInterval(drive, TICK_MS);
}

/** Stop the synthetic driver. Safe to call when none is running. */
export function stopLivingFort() {
  if (_tick) { clearInterval(_tick); _tick = null; }
  if (_mq && _mqHandler) _mq.removeEventListener?.("change", _mqHandler);
  _mqHandler = null;
  _step = 0;
}

function drive() {
  const fort = getFort();
  if (!fort?.nodes?.length) return;

  // `fort.nodes` is $state.raw — individual `.data = {...}` mutations don't
  // fire the array signal. Mutate in place through this tick, then reassign
  // the array at the end so Svelte Flow re-runs adoptUserNodes + visible.
  const nodes = fort.nodes;
  const rooms = nodes.filter((/** @type {any} */ n) => n.type === "room");
  const halls = nodes.filter((/** @type {any} */ n) => n.type === "hall");
  const walls = nodes.filter((/** @type {any} */ n) => n.type === "wall");
  const gates = nodes.filter((/** @type {any} */ n) => n.type === "gate");
  const towers = nodes.filter((/** @type {any} */ n) => n.type === "tower");
  const bridges = nodes.filter(
    (/** @type {any} */ n) => n.type === "bridge" || n.type === "b2bopaque"
  );

  _step += 1;

  // Rooms — rotate active / pulsing / idle. Every 8th tick, seal the oldest
  // and grow a fresh one. Shrinks fire on consolidation cadence (every 12th).
  if (rooms.length > 0) {
    const activeIdx = _step % rooms.length;
    rooms.forEach((/** @type {any} */ room, /** @type {number} */ i) => {
      const prevState = room.data.state;
      const prevLifecycle = room.data.lifecycle;
      if (i === activeIdx) {
        room.data.state = "active";
        room.data.activity = 0.9;
      } else if (i === (activeIdx + 1) % rooms.length) {
        room.data.state = "pulsing";
        room.data.activity = 0.55;
      } else {
        room.data.state = room.data.state === "sealed" ? "sealed" : "idle";
        room.data.activity = room.data.state === "sealed" ? 0.05 : 0.2;
      }
      // Clear transient lifecycle once the growth/shrink anim cycle is done
      if (prevLifecycle && _step % 3 === 0) {
        room.data.lifecycle = undefined;
      }
      if (prevState !== room.data.state || prevLifecycle !== room.data.lifecycle) {
        // Svelte 5 reactivity on nested $state needs a touch; reassigning the
        // object ensures downstream $derived fire.
        room.data = { ...room.data };
      }
    });
    // Seal cycle: every 8 ticks, pick a room to seal and one previously sealed to revive
    if (_step % 8 === 0 && rooms.length >= 3) {
      const toSeal = rooms[_step % rooms.length];
      toSeal.data = { ...toSeal.data, state: "sealed", activity: 0.05, tileCount: 0 };
    }
    if (_step % 8 === 4) {
      const sealed = rooms.find((/** @type {any} */ r) => r.data.state === "sealed");
      if (sealed) sealed.data = { ...sealed.data, state: "active", activity: 0.7, tileCount: 4, lifecycle: "growing" };
    }
    // Shrink cycle: consolidation every 12 ticks
    if (_step % 12 === 0) {
      const victim = rooms[(_step + 1) % rooms.length];
      if (victim.data.state !== "sealed") {
        victim.data = { ...victim.data, lifecycle: "shrinking" };
      }
    }
  }

  // Halls — κ toggle every 6 ticks
  halls.forEach((/** @type {any} */ hall, /** @type {number} */ i) => {
    const shouldPulse = Math.floor(_step / 6) % (i + 2) === 0;
    hall.data = { ...hall.data, kappa: shouldPulse ? 1 : 0 };
  });

  // Walls — multiplier oscillates 1 → 2 → 3 → 2 → 1
  walls.forEach((/** @type {any} */ wall, /** @type {number} */ i) => {
    const phase = (_step + i) % 8;
    const multiplier = phase < 2 ? 1 : phase < 4 ? 2 : phase < 5 ? 3 : phase < 7 ? 2 : 1;
    wall.data = { ...wall.data, tileMultiplier: multiplier };
  });

  // Gates — alternate open / closed every 4 ticks
  gates.forEach((/** @type {any} */ gate, /** @type {number} */ i) => {
    const closed = Math.floor((_step + i) / 4) % 3 === 0;
    gate.data = { ...gate.data, gateState: closed ? "closed" : "open" };
  });

  // Towers — flash alert every 10 ticks, clear after 2 ticks
  towers.forEach((/** @type {any} */ tower, /** @type {number} */ i) => {
    const alertCycle = (_step + i) % 10;
    const alert = alertCycle === 0 || alertCycle === 1;
    tower.data = { ...tower.data, state: alert ? "alert" : "idle" };
  });

  // Bridges — token transit for ~3 ticks, then rest
  bridges.forEach((/** @type {any} */ bridge, /** @type {number} */ i) => {
    const phase = (_step + i * 2) % 6;
    bridge.data = { ...bridge.data, tokenInFlight: phase < 3 };
  });

  // Goal seeds (spec §6.3) — advance `active` goals' progress; on 100% flip
  // one of the outcome states (completed / failed / blocked) by rotation so
  // the five-state palette surfaces over ~90s without telemetry. Proposed
  // goals promote to active on a slower cadence (every 16 ticks / 24s).
  const goals = fort.nodes.filter((/** @type {any} */ n) => n.type === "goalseed");
  goals.forEach((/** @type {any} */ g, /** @type {number} */ i) => {
    const s = g.data.state ?? "proposed";
    if (s === "active") {
      const p = (g.data.progress ?? 0) + 0.06;
      if (p >= 1) {
        // Terminal state rotates across runs: completed → failed → blocked → completed …
        const terminals = /** @type {const} */ (["completed", "failed", "blocked"]);
        const next = terminals[(Math.floor(_step / 4) + i) % terminals.length];
        g.data = {
          ...g.data,
          progress: 1,
          state: next,
          blockedBy: next === "blocked" ? (g.data.blockedBy ?? "policy review") : undefined,
        };
      } else {
        g.data = { ...g.data, progress: p };
      }
    } else if (s === "proposed" && _step > 0 && (_step + i) % 16 === 0) {
      g.data = { ...g.data, state: "active", progress: 0.05 };
    } else if ((s === "completed" || s === "failed" || s === "blocked") && (_step + i) % 20 === 0) {
      // Recycle terminal goals back to proposed so the demo keeps moving
      g.data = { ...g.data, state: "proposed", progress: 0 };
    }
  });

  // Clocktowers (spec §6.2) — rotate through the 5 PULSE phase kinds; one
  // beat per tick. The ClockTowerNode keys a chime animation to `tick` so
  // each bump re-fires the flash.
  const clocktowers = fort.nodes.filter((/** @type {any} */ n) => n.type === "clocktower");
  clocktowers.forEach((/** @type {any} */ ct) => {
    const nextTick = (ct.data.tick ?? 0) + 1;
    ct.data = {
      ...ct.data,
      tick: nextTick,
      phase: PHASE_KINDS[nextTick % PHASE_KINDS.length],
    };
  });

  // Consolidation events (spec §6.2) — every 7 ticks fire one of the six
  // keyframes on a non-sealed room. Kind rotates so all six surface over
  // ~42 ticks (~63 s). Clears the transient after its animation duration.
  if (rooms.length > 0 && _step > 0 && _step % 7 === 0) {
    const kind = CONSOLIDATION_KINDS[(_step / 7) % CONSOLIDATION_KINDS.length];
    const pool = rooms.filter((/** @type {any} */ r) => r.data.state !== "sealed");
    const target = pool[_step % pool.length] ?? pool[0];
    if (target) {
      target.data = { ...target.data, consolidationEvent: kind };
      const targetId = target.id;
      setTimeout(() => {
        const current = fort.nodes.find((/** @type {any} */ n) => n.id === targetId);
        if (current && current.data.consolidationEvent === kind) {
          // Same shallow-clone pattern as drive(): new node ref so adoptUserNodes
          // picks up the cleared consolidationEvent.
          fort.nodes = fort.nodes.map((/** @type {any} */ n) =>
            n.id === targetId ? { ...n, data: { ...n.data, consolidationEvent: undefined } } : n
          );
        }
      }, CONSOLIDATION_DURATION[kind] + 100);
    }
  }

  // Reassign the array so the $state.raw signal fires AND shallow-clone every
  // node so Svelte Flow's `adoptUserNodes` checkEquality (`userNode ===
  // internalNode.internals.userNode`) fails and .data mutations are picked up.
  fort.nodes = nodes.map((/** @type {any} */ n) => ({ ...n }));
}
