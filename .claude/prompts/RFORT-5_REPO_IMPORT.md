# RFort-5: Repo Import → Fort Generator

## Goal
Let users paste a GitHub repo URL and generate a fort layout from the repository structure. Directories become rooms, files become tiles, imports/exports become edges. This is the "bring your own codebase" feature.

## Prerequisites
- RFort-1 (BYOK) — not strictly required but enhances with LLM-powered analysis
- Core fort generator (`src/lib/fortGenerator.js`) already exists with `generateFortFromManifest()`

## Files to Create

### `src/lib/play/repoImport.js`
GitHub API client (no auth needed for public repos):

```js
// Fetch repo tree (recursive)
export async function fetchRepoTree(owner, repo, branch = 'main') {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  );
  const data = await res.json();
  return data.tree; // [{ path, type: 'blob'|'tree', size }]
}

// Parse GitHub URL → { owner, repo }
export function parseGitHubUrl(url) {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  return m ? { owner: m[1], repo: m[2].replace(/\.git$/, '') } : null;
}

// Convert repo tree → fort layout (Svelte Flow nodes + edges)
export function repoToFort(repoName, tree) {
  // Group files by directory
  // Top-level dirs → L1 rooms
  // Files → L2 tiles within rooms
  // Detect relationships:
  //   - package.json deps → edges between rooms
  //   - import statements (if file content available) → edges
  //   - Same-extension files in different dirs → weak edges
  // Return { nodes, edges, manifest } compatible with fort store
}
```

**Mapping rules:**
| Git concept | Fort concept | Level |
|---|---|---|
| Repository | Fort (L1 Campus) | L1 |
| Top-level directory | Room | L2 |
| Subdirectory | Nested room cluster | L2 |
| Source file | Tile | L3 |
| `package.json` / `mix.exs` / `Cargo.toml` | Gate node (entry point) | L2 |
| Import/require between dirs | Hall (corridor edge) | L2 |
| External dependency | Bridge edge (outgoing) | L1 |
| README / docs | Tower (observation) | L2 |
| Config files | Wall (policy) | L2 |

### `src/components/app/RepoImportModal.svelte`
Modal with:
- GitHub URL input field
- Branch selector (default: main)
- "Import" button
- Loading state with progress (fetching tree...)
- Error display (invalid URL, API rate limit, repo not found)
- Preview: show directory count, file count before generating

On import success: call `fortStore.loadImportedFort(nodes, edges, repoName)`

### Fort store addition
Add to `src/lib/stores/fort.svelte.js`:
```js
export function loadImportedFort(nodes, edges, name) {
  // Set fort state from imported data
  // Start at L1 (campus) showing the repo overview
}
```

## Integration Point
Add a "Import Repo" button to the `/app` toolbar (folder/download icon). Opens RepoImportModal.

## Constraints
- GitHub API rate limit: 60 req/hour unauthenticated. The recursive tree endpoint is 1 request, so this is fine for demos.
- Max 10,000 files (GitHub API limit for recursive tree)
- No file content fetching in v1 — just structure. Content-based analysis (imports, deps) can come later with BYOK-powered analysis.
- Generate deterministic node IDs from file paths so re-importing the same repo produces the same layout
- Rune assignment: hash file path to assign Elder Futhark rune (same deterministic hash as existing fortGenerator)
