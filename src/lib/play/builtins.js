// Built-in tool definitions + executor for RuneFort chat.
// These tools operate on fort/overlay stores directly.

import { BUILTIN_TOOLS } from "./tools.js";
import { startFlow, stopAllFlows, simulateBenchmark } from "./tokenflow.js";
import { triggerBuildForFort } from "./factory-loop.js";
import { spawnTeam } from "$lib/stores/chat.svelte.js";
import { initWorkspaces, switchWorkspace } from "$lib/stores/workspace.svelte.js";

// ── Canonical manifest loaders ──
// Convention: all `*.pulse.json` and `*.ampersand.json` live in `static/` and
// are served at the site root. Helpers centralize the fetch so components
// don't hard-code paths. See `static/MANIFESTS.md`.

/** @type {Record<string, Promise<any>>} */
const _manifestCache = {};

/**
 * Fetch and parse a JSON manifest from `static/`, cached per path.
 * @param {string} path - site-root path, e.g. "/starter.pulse.json"
 * @returns {Promise<any>}
 */
function loadManifest(path) {
  if (_manifestCache[path]) return _manifestCache[path];
  _manifestCache[path] = fetch(path).then((r) => {
    if (!r.ok) throw new Error(`Failed to load manifest ${path}: ${r.status}`);
    return r.json();
  }).catch((err) => {
    // Evict cache on failure so the next call can retry.
    delete _manifestCache[path];
    throw err;
  });
  return _manifestCache[path];
}

/** Fetch the Starter Fort manifest (`/starter.pulse.json`). */
export function getStarterManifest() {
  return loadManifest("/starter.pulse.json");
}

/** Fetch the spatial-render loop manifest (`/runefort.spatial_render.pulse.json`). */
export function getSpatialRenderManifest() {
  return loadManifest("/runefort.spatial_render.pulse.json");
}

/** Fetch the dark-factory loop manifest (`/runefort.dark_factory.pulse.json`). */
export function getDarkFactoryManifest() {
  return loadManifest("/runefort.dark_factory.pulse.json");
}

/** Fetch the [&] capability bindings (`/runefort.ampersand.json`). */
export function getAmpersandManifest() {
  return loadManifest("/runefort.ampersand.json");
}

/**
 * Execute a built-in RuneFort tool.
 * @param {string} name - Tool name
 * @param {object} args - Tool arguments
 * @param {object} ctx - Context: { fortState, fortActions, overlayActions }
 * @returns {string | Promise<string>} JSON string result (async for tools
 *   that touch MCP servers — `trigger_build` returns a Promise; caller is
 *   already in an async context so this resolves transparently).
 */
export function executeBuiltinTool(name, args, ctx) {
  const { fortState, fortActions, overlayActions } = ctx;

  switch (name) {
    case "navigate_fort": {
      const { action, level, nodeId, fortId } = args;
      if (action === "zoom_out") {
        fortActions.zoomOut();
        return JSON.stringify({ success: true, action: "zoomed_out", level: Math.max(0, fortState.zoomLevel - 1) });
      }
      if (action === "zoom_to_level" && level != null) {
        fortActions.setZoomLevel(level);
        return JSON.stringify({ success: true, action: "zoom_to_level", level });
      }
      if (action === "zoom_in") {
        if (fortId && fortState.zoomLevel === 0) {
          fortActions.zoomIntoFort(fortId);
          return JSON.stringify({ success: true, action: "zoomed_into_fort", fortId });
        }
        if (nodeId) {
          if (fortState.zoomLevel === 1) {
            fortActions.zoomIntoRoom(nodeId);
          } else if (fortState.zoomLevel === 2) {
            fortActions.zoomIntoNode(nodeId);
          } else if (fortState.zoomLevel === 3) {
            fortActions.zoomIntoRune(nodeId);
          }
          return JSON.stringify({ success: true, action: "zoomed_into_node", nodeId });
        }
      }
      return JSON.stringify({ error: "Invalid navigate_fort arguments" });
    }

    case "toggle_overlay": {
      const { overlay } = args;
      if (overlay && overlayActions.toggleOverlay) {
        overlayActions.toggleOverlay(overlay);
        return JSON.stringify({ success: true, overlay, toggled: true });
      }
      return JSON.stringify({ error: "Missing overlay argument" });
    }

    case "get_fort_info": {
      const activeOverlays = overlayActions.activeOverlayKeys
        ? Array.from(overlayActions.activeOverlayKeys())
        : [];
      return JSON.stringify({
        zoomLevel: fortState.zoomLevel,
        fortName: fortState.fortName,
        activeFortId: fortState.activeFortId,
        activeRoomId: fortState.activeRoomId,
        nodeCount: fortState.nodes.length,
        edgeCount: fortState.edges.length,
        activeOverlays,
      });
    }

    case "list_forts":
    case "list_nodes": {
      const nodes = fortState.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        label: n.data?.label || n.id,
      }));
      return JSON.stringify({ zoomLevel: fortState.zoomLevel, nodes });
    }

    case "save_blueprint": {
      return JSON.stringify({ error: "save_blueprint requires auth — use the Save button in the toolbar" });
    }

    case "start_benchmark": {
      const { edgeId, tokensPerSecond, latencyMs, concurrency } = args;
      const config = { tokensPerSecond, latencyMs, concurrency };
      if (edgeId) {
        startFlow(edgeId, config);
        return JSON.stringify({ success: true, action: "started_flow", edgeId });
      }
      // Animate all edges
      const cleanup = simulateBenchmark({}, fortState.edges);
      return JSON.stringify({
        success: true,
        action: "started_benchmark",
        edgeCount: fortState.edges.length,
      });
    }

    case "stop_benchmark": {
      stopAllFlows();
      return JSON.stringify({ success: true, action: "stopped_flows" });
    }

    case "spawn_team": {
      // Create a team of worker sessions bound to a shared fort context.
      // Doesn't switch the current session — the user explicitly picks a
      // member from the rail if they want to interact with one directly.
      const members = Array.isArray(args.members) ? args.members : [];
      if (members.length === 0) {
        return JSON.stringify({ error: "spawn_team requires at least one member" });
      }
      const fortContextId = args.fortId || fortState.activeFortId || fortState.fortName || null;
      try {
        const team = spawnTeam(members, { fortContextId });
        return JSON.stringify({
          success: true,
          action: "team_spawned",
          teamId: team.teamId,
          fortContextId,
          members: team.members,
        });
      } catch (err) {
        return JSON.stringify({ error: `spawn_team failed: ${err.message}` });
      }
    }

    case "trigger_build": {
      // Agent-driven R! — presses the dark-factory build pipeline from chat.
      // Resolves the target fort: explicit arg → current activeFortId →
      // current fortName. Errors surface as JSON so the LLM can course-correct
      // (vs. throwing, which would bubble up into the generic tool error
      // branch and show as "Request failed").
      const fortId = args.fortId || fortState.activeFortId || fortState.fortName;
      if (!fortId) {
        return JSON.stringify({
          error: "No fortId — pass one explicitly or zoom into a fort first.",
        });
      }
      // Fire-and-forget from the LLM's point of view. Consumers poll the
      // Factory panel for status. Returning immediately keeps the tool-call
      // round fast (agent_build itself blocks for several seconds when the
      // Agentelic template does real work).
      return triggerBuildForFort(fortId, args.spec).then(
        async (res) => {
          // Refresh the workspace switcher so the user can see (and switch to)
          // the workspace their build just ran against. ensureWorkspaceAndUser
          // may have auto-created a personal workspace via
          // public.ensure_user_workspace(); without this refresh, the
          // WorkspaceSwitcher dropdown stays empty and the user has no way to
          // navigate to the new fort.
          try {
            await initWorkspaces();
          } catch {
            // non-fatal — workspace refresh is a UX nicety, not a hard
            // requirement of the build itself.
          }
          return JSON.stringify({
            success: true,
            action: "build_triggered",
            fortId,
            agentId: res.agentId,
            build: res.build,
            hint: "Check the workspace switcher (top left) — your new workspace and fort should now be visible. Open the Factory panel to watch build progress.",
          });
        },
        (err) => JSON.stringify({ error: `trigger_build failed: ${err.message}` }),
      );
    }

    default:
      return JSON.stringify({ error: `Unknown built-in tool: ${name}` });
  }
}

export { BUILTIN_TOOLS };
