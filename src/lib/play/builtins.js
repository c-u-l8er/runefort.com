// Built-in tool definitions + executor for RuneFort chat.
// These tools operate on fort/overlay stores directly.

import { BUILTIN_TOOLS } from "./tools.js";
import { startFlow, stopAllFlows, simulateBenchmark } from "./tokenflow.js";

/**
 * Execute a built-in RuneFort tool.
 * @param {string} name - Tool name
 * @param {object} args - Tool arguments
 * @param {object} ctx - Context: { fortState, fortActions, overlayActions }
 * @returns {string} JSON string result
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

    default:
      return JSON.stringify({ error: `Unknown built-in tool: ${name}` });
  }
}

export { BUILTIN_TOOLS };
