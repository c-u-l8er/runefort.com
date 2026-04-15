<script>
  import { BaseEdge, getBezierPath } from "@xyflow/svelte";
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

  let [edgePath, labelX, labelY] = $derived(
    getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
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

  // Interpolate a point along a cubic bezier by sampling the SVG path
  function getPointAtProgress(progress) {
    // Lerp along the bezier using control point approximation
    const t = progress;
    // Simple quadratic bezier interpolation between source and target
    // with a control point offset for curvature
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    const cpX = midX;
    const cpY = sourceY; // control point at source height for downward curve feel

    const u = 1 - t;
    const x = u * u * sourceX + 2 * u * t * cpX + t * t * targetX;
    const y = u * u * sourceY + 2 * u * t * cpY + t * t * targetY;
    return { x, y };
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
