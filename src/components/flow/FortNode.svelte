<script>
  import { Handle, Position } from "@xyflow/svelte";
  import { isOverlayActive } from "$lib/stores/overlays.svelte.js";
  import { thermalStyle, topologyStyle, assemblyStyle, assemblyTrustGlow } from "$lib/overlayEffects.js";
  let { data } = $props();

  let thermal = $derived(isOverlayActive("thermal") ? thermalStyle(0.5) : null);
  let topo = $derived(isOverlayActive("topology") ? topologyStyle(data, "fort") : null);
  let assembly = $derived(isOverlayActive("assembly") ? assemblyStyle(data) : null);

  let overlayGlow = $derived(
    assembly ? assemblyTrustGlow(assembly.trustScore) : thermal?.glow ?? topo?.glow ?? "none"
  );
  let overlayBorder = $derived(assembly?.border ?? topo?.border ?? data.color + "40");
</script>

<div class="fort-node" style="border-color: {overlayBorder}; box-shadow: {overlayGlow};">
  <div class="fort-rune" style="color: {data.color};">{data.rune}</div>
  <div class="fort-label">{data.label}</div>
  <div class="fort-role">{data.role}</div>
  {#if assembly}
    <div class="assembly-badges">
      <span class="assembly-spec" title="Spec version">v{assembly.specVersion}</span>
      <span class="assembly-status" style="color: {assembly.border};">{assembly.buildStatus}</span>
    </div>
    {#if assembly.trustScore > 0}
      <div class="assembly-trust" style="color: {assembly.trustScore > 80 ? '#6ac48c' : assembly.trustScore > 50 ? '#e8a84c' : '#c4956a'};">
        trust: {assembly.trustScore}
      </div>
    {/if}
  {/if}
  {#if data.repoMeta}
    <div class="github-badges">
      {#if data.repoMeta.branch}
        <span class="gh-branch">{data.repoMeta.branch}</span>
      {/if}
      {#if data.repoMeta.prCount != null}
        <span class="gh-prs">{data.repoMeta.prCount} PRs</span>
      {/if}
      {#if data.repoMeta.ciStatus}
        <span class="gh-ci" class:passing={data.repoMeta.ciStatus === 'passing'} class:failing={data.repoMeta.ciStatus === 'failing'} class:running={data.repoMeta.ciStatus === 'running'}>{data.repoMeta.ciStatus}</span>
      {/if}
    </div>
  {/if}
</div>
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Bottom} id="bottom" />
<Handle type="target" position={Position.Left} id="left" />
<Handle type="source" position={Position.Right} id="right" />

<style>
  .fort-node {
    background: #0e0f14;
    border: 1px solid;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    min-width: 130px;
    text-align: center;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  .fort-rune {
    font-size: 1.2rem;
    margin-bottom: 0.25rem;
  }
  .fort-label {
    font-family: "Cinzel", serif;
    font-size: 0.85rem;
    font-weight: 500;
    color: #e4e2dc;
    margin-bottom: 0.15rem;
  }
  .fort-role {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
    letter-spacing: 0.04em;
  }

  /* Assembly overlay badges */
  .assembly-badges {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    margin-top: 0.35rem;
  }
  .assembly-spec {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    font-weight: 600;
    color: #4a9ade;
    padding: 0.1rem 0.3rem;
    border: 1px solid rgba(74, 154, 222, 0.3);
    border-radius: 3px;
  }
  .assembly-status {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .assembly-trust {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    text-align: center;
    margin-top: 0.2rem;
  }

  /* GitHub badges */
  .github-badges {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    margin-top: 0.3rem;
    flex-wrap: wrap;
  }
  .gh-branch, .gh-prs, .gh-ci {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.45rem;
    padding: 0.08rem 0.25rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 3px;
    color: #7a7770;
  }
  .gh-ci.passing { color: #6ac48c; border-color: rgba(106, 196, 140, 0.3); }
  .gh-ci.failing { color: #e85a5a; border-color: rgba(232, 90, 90, 0.3); }
  .gh-ci.running { color: #e8a84c; border-color: rgba(232, 168, 76, 0.3); }
</style>
