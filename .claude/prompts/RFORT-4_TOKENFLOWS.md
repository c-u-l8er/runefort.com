# RFort-4: Token Flow Animations on Edges

## Goal
Animate particles flowing along Svelte Flow edges to visualize token throughput. This replaces traditional benchmark dashboards with a spatial representation — you SEE tokens flowing through the fort architecture.

## Concept
- Each edge can have animated particles (small circles/dots) moving along its path
- Speed = tokens/second (faster = higher throughput)
- Color = latency (green = fast, amber = moderate, red = slow)
- Particle count = concurrent requests
- Bridge edges (cross-fort) show larger, more visible particles

## Files to Create

### `src/components/flow/AnimatedEdge.svelte`
Custom Svelte Flow edge component with SVG particle animation.

Uses `<BaseEdge>` from `@xyflow/svelte` for the path, then overlays animated circles:
```svelte
<script>
  let { id, sourceX, sourceY, targetX, targetY, data, ...rest } = $props();

  // data.flow = { active: bool, speed: 0-1, color: '#hex', particles: number }
  let particles = $state([]);

  $effect(() => {
    if (data?.flow?.active) {
      // Start animation loop with requestAnimationFrame
      // Each particle has a progress (0-1) along the edge path
      // Speed determines how fast progress increments
    }
  });
</script>

<BaseEdge {id} path={edgePath} {sourceX} {sourceY} {targetX} {targetY} {...rest} />
{#each particles as p}
  <circle cx={p.x} cy={p.y} r={p.size} fill={data.flow.color} opacity={0.8}>
    <animate ... />
  </circle>
{/each}
```

Use `getBezierPath()` from `@xyflow/svelte` to get the SVG path, then interpolate point positions along it.

### `src/lib/play/tokenflow.js`
Token flow simulation engine:
```js
// Start a flow on an edge
export function startFlow(edgeId, config) {
  // config: { tokensPerSecond, latencyMs, concurrency }
  // Maps to: speed, color, particle count
}

// Stop flow on an edge
export function stopFlow(edgeId) { ... }

// Start a full benchmark visualization
// Takes a PULSE manifest and animates tokens flowing through each phase
export function simulateBenchmark(manifest, edges) {
  // Phase 1 (retrieve): light up retrieve edges
  // Phase 2 (route): light up route edges
  // ... flows cascade through the fort
}

// Map metrics to visual params
function metricsToVisual(tokensPerSecond, latencyMs) {
  const speed = Math.min(tokensPerSecond / 100, 1);
  const color = latencyMs < 200 ? '#22c55e' : latencyMs < 1000 ? '#f59e0b' : '#ef4444';
  return { speed, color };
}
```

### `src/lib/stores/tokenflow.svelte.js`
Store tracking active flows:
```js
let _flows = $state({});  // edgeId → { active, speed, color, particles }
export function getFlows() { return _flows; }
export function setFlow(edgeId, flow) { _flows[edgeId] = flow; }
export function clearFlows() { _flows = {}; }
export function isFlowing() { return Object.values(_flows).some(f => f.active); }
```

## Integration Points

1. **Edge type registration** in `/app/+page.svelte`:
   ```js
   const edgeTypes = { animated: AnimatedEdge, default: AnimatedEdge };
   ```

2. **Flow data on edges**: The fort generator already creates edges. Add `data.flow` property when flows are active.

3. **Benchmark trigger**: Chat tool `start_benchmark` (add to builtins in RFort-3) or a toolbar button. Calls `simulateBenchmark()` which lights up edges in sequence.

4. **Live MCP flows**: When the chat calls an MCP tool, briefly animate the edge connecting that tool's server node to show the request/response.

## Visual Design
- Particles: 3-5px circles with slight glow (`filter: drop-shadow`)
- Default edge: static, gray
- Active flow: animated particles + edge color changes to match flow color
- Bridge edges: larger particles (6-8px), thicker edge stroke during flow
- Use CSS `@keyframes` or `requestAnimationFrame` — avoid heavy JS animation libs

## Constraints
- Must not tank performance — use `requestAnimationFrame`, not setInterval
- Max 50 concurrent animated particles across all edges
- Particle pooling: reuse particle objects instead of creating/destroying
- Clean up animations on component destroy (`$effect` cleanup)
- Works at all zoom levels (particles scale with zoom)
