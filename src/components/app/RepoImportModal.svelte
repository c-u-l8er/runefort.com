<script>
  import { parseGitHubUrl, fetchRepoTree, repoToFort, getRepoStats } from "$lib/play/repoImport.js";
  import { loadImportedFort } from "$lib/stores/fort.svelte.js";

  let { open = false, onclose } = $props();

  let url = $state("");
  let branch = $state("main");
  let loading = $state(false);
  let error = $state("");
  /** @type {{ fileCount: number, dirCount: number, topDirs: string[], languages: string[] } | null} */
  let preview = $state(null);
  /** @type {Array<{ path: string, type: string, size?: number }> | null} */
  let tree = $state(null);

  function reset() {
    url = "";
    branch = "main";
    loading = false;
    error = "";
    preview = null;
    tree = null;
  }

  async function handleFetch() {
    error = "";
    preview = null;
    tree = null;

    const parsed = parseGitHubUrl(url.trim());
    if (!parsed) {
      error = "Invalid GitHub URL. Expected: https://github.com/owner/repo";
      return;
    }

    loading = true;
    try {
      const result = await fetchRepoTree(parsed.owner, parsed.repo, branch);
      if (!result.length) {
        error = `No files found in ${parsed.owner}/${parsed.repo} (branch: ${branch})`;
        return;
      }
      tree = result;
      preview = getRepoStats(result);
    } catch (e) {
      error = e.message || "Failed to fetch repository";
    } finally {
      loading = false;
    }
  }

  function handleImport() {
    if (!tree) return;
    const parsed = parseGitHubUrl(url.trim());
    if (!parsed) return;

    const repoName = `${parsed.owner}/${parsed.repo}`;
    const { nodes, edges, manifest } = repoToFort(parsed.repo, tree);
    loadImportedFort(nodes, edges, repoName, manifest);
    reset();
    onclose();
  }

  function handleKeydown(e) {
    if (e.key === "Escape") onclose();
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      if (preview && tree) handleImport();
      else handleFetch();
    }
  }

  function handleClose() {
    reset();
    onclose();
  }
</script>

{#if open}
  <div class="modal-backdrop" onclick={handleClose}>
    <div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-label="Import GitHub Repository">
      <button class="modal-close" onclick={handleClose}>&times;</button>
      <div class="modal-header">
        <span class="modal-rune">&#5765;</span>
        <h3>Import Repository</h3>
        <p class="modal-sub">Convert a GitHub repo into a navigable fort</p>
      </div>

      <div class="modal-body">
        <label class="field">
          <span class="field-label">GitHub URL</span>
          <input
            type="text"
            placeholder="https://github.com/owner/repo"
            bind:value={url}
            onkeydown={handleKeydown}
            disabled={loading}
          />
        </label>

        <label class="field">
          <span class="field-label">Branch</span>
          <input
            type="text"
            placeholder="main"
            bind:value={branch}
            onkeydown={handleKeydown}
            disabled={loading}
          />
        </label>

        {#if error}
          <p class="error">{error}</p>
        {/if}

        {#if loading}
          <div class="loading">
            <span class="loading-rune">&#5765;</span>
            <span>Fetching tree...</span>
          </div>
        {/if}

        {#if preview}
          <div class="preview">
            <div class="preview-header">Preview</div>
            <div class="preview-row">
              <span class="preview-label">Files</span>
              <span class="preview-value">{preview.fileCount.toLocaleString()}</span>
            </div>
            <div class="preview-row">
              <span class="preview-label">Directories</span>
              <span class="preview-value">{preview.dirCount.toLocaleString()}</span>
            </div>
            <div class="preview-row">
              <span class="preview-label">Top dirs</span>
              <span class="preview-value preview-dirs">{preview.topDirs.slice(0, 8).join(", ")}{preview.topDirs.length > 8 ? "..." : ""}</span>
            </div>
            {#if preview.languages.length > 0}
              <div class="preview-row">
                <span class="preview-label">Languages</span>
                <span class="preview-value">{preview.languages.map(l => `.${l}`).join(" ")}</span>
              </div>
            {/if}
          </div>
        {/if}

        <p class="hint">Public repos only. Uses 1 API request (60/hr limit). No file contents fetched.</p>
      </div>

      <div class="modal-footer">
        <button class="btn secondary" onclick={handleClose}>Cancel</button>
        {#if preview && tree}
          <button class="btn primary" onclick={handleImport}>Generate Fort</button>
        {:else}
          <button class="btn primary" onclick={handleFetch} disabled={loading || !url.trim()}>
            {loading ? "Fetching..." : "Fetch Repo"}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal {
    background: #0e0f14;
    border: 1px solid rgba(232, 168, 76, 0.2);
    border-radius: 12px;
    padding: 2rem;
    width: 440px;
    max-width: 90vw;
    position: relative;
  }
  .modal-close {
    position: absolute;
    top: 0.75rem;
    right: 1rem;
    background: transparent;
    border: none;
    color: #7a7770;
    font-size: 1.4rem;
    cursor: pointer;
  }
  .modal-close:hover { color: #e4e2dc; }
  .modal-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }
  .modal-rune {
    font-size: 2rem;
    color: #e8a84c;
    display: block;
    margin-bottom: 0.5rem;
  }
  .modal-header h3 {
    font-family: "Cinzel", serif;
    font-size: 1.2rem;
    font-weight: 500;
    color: #e4e2dc;
    margin-bottom: 0.25rem;
  }
  .modal-sub {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    color: #7a7770;
  }
  .modal-body {
    margin-bottom: 1.5rem;
  }
  .field {
    display: block;
    margin-bottom: 0.75rem;
  }
  .field-label {
    display: block;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    font-weight: 600;
    color: #8a9a9e;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 0.35rem;
  }
  input {
    width: 100%;
    background: #15161d;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 0.65rem 0.75rem;
    color: #e4e2dc;
    font-family: "IBM Plex Sans", sans-serif;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
  }
  input:focus { border-color: rgba(232, 168, 76, 0.4); }
  input::placeholder { color: #44423d; }
  input:disabled { opacity: 0.5; }
  .error {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #e85a5a;
    margin: 0.5rem 0 0;
    padding: 0.4rem 0.6rem;
    background: rgba(232, 90, 90, 0.08);
    border: 1px solid rgba(232, 90, 90, 0.2);
    border-radius: 4px;
  }
  .loading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    color: #e8a84c;
    margin: 0.75rem 0;
  }
  .loading-rune {
    animation: spin 1.5s linear infinite;
    display: inline-block;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .preview {
    background: #15161d;
    border: 1px solid rgba(232, 168, 76, 0.15);
    border-radius: 8px;
    padding: 0.75rem;
    margin-top: 0.75rem;
  }
  .preview-header {
    font-family: "Cinzel", serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: #e8a84c;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .preview-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.2rem 0;
  }
  .preview-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.55rem;
    color: #7a7770;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }
  .preview-value {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #e4e2dc;
    text-align: right;
  }
  .preview-dirs {
    font-size: 0.55rem;
    color: #8a9a9e;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hint {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
    margin: 0.75rem 0 0;
  }
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  .btn {
    padding: 0.6rem 1.25rem;
    border-radius: 6px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  .btn.primary {
    background: #e8a84c;
    color: #09090d;
  }
  .btn.primary:hover { box-shadow: 0 4px 16px rgba(232, 168, 76, 0.3); }
  .btn.primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn.secondary {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #7a7770;
  }
  .btn.secondary:hover {
    color: #e4e2dc;
    border-color: rgba(255, 255, 255, 0.15);
  }
</style>
