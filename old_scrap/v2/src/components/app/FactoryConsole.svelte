<script>
  import {
    getLogEntries, isLogOpen, toggleLogOpen, getAutoScroll,
    toggleAutoScroll, getFilter, toggleFilter, clearLog,
  } from "$lib/stores/factorylog.svelte.js";

  const entries = $derived(getLogEntries());
  const filter = $derived(getFilter());
  const filteredEntries = $derived(entries.filter((e) => filter.has(e.level)));

  let scrollContainer = $state(null);
  let expandedId = $state(null);

  $effect(() => {
    if (getAutoScroll() && scrollContainer && filteredEntries.length) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  const LEVEL_COLORS = {
    signal: "#4a9ade",
    triage: "#8a9a9e",
    pipeline: "#e8a84c",
    phase: "#c4956a",
    learn: "#6ac48c",
    consolidate: "#5b6a8a",
    error: "#e85a5a",
    info: "#44423d",
  };

  const LEVEL_LABELS = {
    signal: "SIG",
    triage: "TRI",
    pipeline: "PIP",
    phase: "PHS",
    learn: "LRN",
    consolidate: "CON",
    error: "ERR",
    info: "INF",
  };

  function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function toggleDetail(id) {
    expandedId = expandedId === id ? null : id;
  }
</script>

{#if isLogOpen()}
  <div class="factory-console">
    <!-- Header bar -->
    <div class="console-header">
      <button class="console-toggle" onclick={toggleLogOpen} title="Collapse">
        <span class="chevron">&#x25BC;</span>
      </button>
      <span class="console-title">Factory Console</span>
      <span class="entry-count">{filteredEntries.length}</span>

      <!-- Level filters -->
      <div class="filters">
        {#each Object.entries(LEVEL_LABELS) as [level, label]}
          <button
            class="filter-btn"
            class:active={filter.has(level)}
            style="--level-color: {LEVEL_COLORS[level]};"
            onclick={() => toggleFilter(level)}
            title={level}
          >
            {label}
          </button>
        {/each}
      </div>

      <div class="console-actions">
        <button class="action-btn" class:active={getAutoScroll()} onclick={toggleAutoScroll} title="Auto-scroll">
          &#x21E9;
        </button>
        <button class="action-btn" onclick={clearLog} title="Clear">
          &#x2715;
        </button>
      </div>
    </div>

    <!-- Log entries -->
    <div class="console-body" bind:this={scrollContainer}>
      {#if filteredEntries.length === 0}
        <div class="empty-log">No log entries. Generate signals or start watching to see activity.</div>
      {:else}
        {#each filteredEntries as entry}
          <div class="log-row" class:has-detail={entry.detail} onclick={() => entry.detail && toggleDetail(entry.id)}>
            <span class="log-time">{formatTime(entry.timestamp)}</span>
            <span class="log-level" style="color: {LEVEL_COLORS[entry.level]};">
              {LEVEL_LABELS[entry.level] || entry.level}
            </span>
            <span class="log-msg">{entry.message}</span>
            {#if entry.detail}
              <span class="detail-indicator">{expandedId === entry.id ? "▾" : "▸"}</span>
            {/if}
          </div>
          {#if expandedId === entry.id && entry.detail}
            <div class="log-detail">
              <pre>{JSON.stringify(entry.detail, null, 2)}</pre>
            </div>
          {/if}
        {/each}
      {/if}
    </div>
  </div>
{:else}
  <!-- Collapsed tab -->
  <button class="console-tab" onclick={toggleLogOpen}>
    <span class="chevron">&#x25B2;</span>
    <span>Console</span>
    {#if entries.length > 0}
      <span class="tab-count">{entries.length}</span>
    {/if}
  </button>
{/if}

<style>
  .factory-console {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 220px;
    background: rgba(9, 9, 13, 0.98);
    border-top: 1px solid rgba(232, 168, 76, 0.2);
    z-index: 200;
    display: flex;
    flex-direction: column;
    font-family: "JetBrains Mono", monospace;
  }

  .console-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.75rem;
    background: rgba(14, 15, 20, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    flex-shrink: 0;
  }
  .console-toggle {
    background: none;
    border: none;
    color: #44423d;
    cursor: pointer;
    font-size: 0.6rem;
    padding: 0.1rem 0.3rem;
  }
  .console-toggle:hover { color: #e8a84c; }
  .chevron { font-size: 0.55rem; }

  .console-title {
    font-size: 0.55rem;
    font-weight: 700;
    color: #7a7770;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .entry-count {
    font-size: 0.45rem;
    color: #44423d;
    background: rgba(255, 255, 255, 0.04);
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
  }

  .filters {
    display: flex;
    gap: 0.15rem;
    margin-left: auto;
  }
  .filter-btn {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 3px;
    color: #33322e;
    font-family: inherit;
    font-size: 0.4rem;
    font-weight: 700;
    padding: 0.1rem 0.3rem;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.03em;
  }
  .filter-btn.active {
    color: var(--level-color);
    border-color: var(--level-color);
    background: color-mix(in srgb, var(--level-color) 10%, transparent);
  }
  .filter-btn:hover { color: #7a7770; }

  .console-actions {
    display: flex;
    gap: 0.2rem;
  }
  .action-btn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 3px;
    color: #44423d;
    font-size: 0.55rem;
    padding: 0.1rem 0.3rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .action-btn:hover { color: #e4e2dc; }
  .action-btn.active { color: #e8a84c; border-color: rgba(232, 168, 76, 0.3); }

  .console-body {
    flex: 1;
    overflow-y: auto;
    padding: 0.2rem 0;
    scrollbar-width: thin;
    scrollbar-color: #33322e #09090d;
  }

  .empty-log {
    padding: 1rem;
    color: #33322e;
    font-size: 0.5rem;
    font-style: italic;
    text-align: center;
  }

  .log-row {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    padding: 0.12rem 0.75rem;
    font-size: 0.5rem;
    line-height: 1.4;
    transition: background 0.1s;
  }
  .log-row:hover { background: rgba(255, 255, 255, 0.02); }
  .log-row.has-detail { cursor: pointer; }

  .log-time {
    color: #33322e;
    font-size: 0.45rem;
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 55px;
  }
  .log-level {
    font-size: 0.4rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 24px;
  }
  .log-msg {
    color: #b0ada6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
  .detail-indicator {
    color: #44423d;
    font-size: 0.45rem;
    flex-shrink: 0;
  }

  .log-detail {
    padding: 0.2rem 0.75rem 0.2rem 6rem;
    background: rgba(255, 255, 255, 0.01);
    border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  }
  .log-detail pre {
    font-family: inherit;
    font-size: 0.4rem;
    color: #5a5850;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }

  /* Collapsed tab */
  .console-tab {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(14, 15, 20, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    color: #7a7770;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.5rem;
    font-weight: 600;
    padding: 0.3rem 0.8rem;
    cursor: pointer;
    z-index: 200;
    transition: all 0.2s;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .console-tab:hover {
    color: #e8a84c;
    border-color: rgba(232, 168, 76, 0.3);
  }
  .tab-count {
    font-size: 0.4rem;
    background: rgba(232, 168, 76, 0.2);
    color: #e8a84c;
    padding: 0.05rem 0.3rem;
    border-radius: 3px;
  }
</style>
