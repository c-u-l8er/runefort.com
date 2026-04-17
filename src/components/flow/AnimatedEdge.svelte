<script>
  import { BaseEdge, getSmoothStepPath } from "@xyflow/svelte";
  import { getFlows } from "$lib/stores/tokenflow.svelte.js";

  let {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    label,
    labelStyle,
    markerEnd,
    markerStart,
    style,
    interactionWidth,
    data,
    ...rest
  } = $props();

  const flows = getFlows();

  // Smoothstep = orthogonal segments with rounded corners. Much less likely
  // to cross through unrelated tiles than the previous bezier because the
  // path hugs the source side first, then runs along one axis to the target.
  let [edgePath, labelX, labelY] = $derived(
    getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      borderRadius: 8,
    }),
  );

  let flow = $derived(flows[id]);
  let isActive = $derived(flow?.active ?? false);
  let flowColor = $derived(flow?.color ?? "#e8a84c");
  let flowSpeed = $derived(flow?.speed ?? 0.5);
  let particleCount = $derived(flow?.particles ?? 3);

  // Particle animation state
  let particles = $state([]);
  let rafId = $state(null);

  // A hidden path element bound below gives us getTotalLength/getPointAtLength
  // so particles follow the *actual* smoothstep route instead of a straight
  // chord. Reinitialized whenever `edgePath` changes.
  /** @type {SVGPathElement | null} */
  let measurePath = $state(null);
  let pathLength = $derived.by(() => {
    if (!measurePath) return 0;
    // Re-read whenever edgePath changes so the getter stays reactive.
    void edgePath;
    try { return measurePath.getTotalLength(); } catch { return 0; }
  });

  function getPointAtProgress(progress) {
    if (measurePath && pathLength > 0) {
      try {
        const p = measurePath.getPointAtLength(progress * pathLength);
        return { x: p.x, y: p.y };
      } catch {
        // fall through to straight-line fallback
      }
    }
    // Fallback: linear interpolation between endpoints if the path ref isn't
    // ready yet (first paint before the hidden <path> has mounted).
    return {
      x: sourceX + (targetX - sourceX) * progress,
      y: sourceY + (targetY - sourceY) * progress,
    };
  }

  $effect(() => {
    if (!isActive) {
      particles = [];
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      return;
    }

    // Initialize particles with staggered progress
    const count = Math.min(particleCount, 8);
    const initial = [];
    for (let i = 0; i < count; i++) {
      initial.push({
        progress: i / count,
        size: 3 + Math.random() * 2,
      });
    }
    particles = initial;

    let lastTime = performance.now();

    function animate(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Speed maps: 0 = very slow, 1 = very fast
      const baseRate = 0.15 + flowSpeed * 0.85;

      for (let i = 0; i < particles.length; i++) {
        particles[i].progress += baseRate * dt;
        if (particles[i].progress >= 1) {
          particles[i].progress -= 1;
        }
      }

      // Trigger reactivity
      particles = particles;
      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  });
</script>

<defs>
  <filter id="particle-glow-{id}" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
    <feMerge>
      <feMergeNode in="blur" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
</defs>

<!-- Hidden geometry-only copy of the edge path. Lets us sample real points
     along the smoothstep route for particle animation without affecting the
     visible BaseEdge render. -->
<path
  bind:this={measurePath}
  d={edgePath}
  fill="none"
  stroke="none"
  style="pointer-events: none;"
/>

{#if isActive}
  <!-- Active edge: colored stroke -->
  <BaseEdge
    {id}
    path={edgePath}
    {labelX}
    {labelY}
    {label}
    {labelStyle}
    {markerStart}
    {markerEnd}
    {interactionWidth}
    style="stroke: {flowColor}; stroke-width: 2; stroke-opacity: 0.6;"
  />
{:else}
  <!-- Default edge -->
  <BaseEdge
    {id}
    path={edgePath}
    {labelX}
    {labelY}
    {label}
    {labelStyle}
    {markerStart}
    {markerEnd}
    {interactionWidth}
    {style}
  />
{/if}

{#each particles as p}
  {@const pos = getPointAtProgress(p.progress)}
  <circle
    cx={pos.x}
    cy={pos.y}
    r={p.size}
    fill={flowColor}
    opacity={0.85}
    filter="url(#particle-glow-{id})"
  />
{/each}
