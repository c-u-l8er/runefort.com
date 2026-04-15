/**
 * GitHub repo import — fetches repo tree and converts to fort layout.
 * Uses GitHub API (unauthenticated, 60 req/hr limit).
 */

// ── Elder Futhark runes for deterministic assignment ──
const FUTHARK = [
  "ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ",
  "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛏ", "ᛒ", "ᛖ", "ᛗ",
  "ᛚ", "ᛜ", "ᛞ", "ᛟ",
];

const PHASE_COLORS = {
  src: "#e8a84c", lib: "#6ac48c", test: "#e85a5a", docs: "#5b6a8a",
  config: "#8a9a9e", assets: "#c4956a", scripts: "#e8a84c",
};

/** Deterministic hash from string */
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Parse a GitHub URL into owner/repo.
 * @param {string} url
 * @returns {{ owner: string, repo: string } | null}
 */
export function parseGitHubUrl(url) {
  const m = url.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
  return m ? { owner: m[1], repo: m[2].replace(/\.git$/, "") } : null;
}

/**
 * Fetch a repo's full tree via GitHub API (single request, recursive).
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 * @returns {Promise<Array<{ path: string, type: string, size?: number }>>}
 */
export async function fetchRepoTree(owner, repo, branch = "main") {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: { Accept: "application/vnd.github.v3+json" } }
  );
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Repository not found: ${owner}/${repo} (branch: ${branch})`);
    if (res.status === 403) throw new Error("GitHub API rate limit exceeded. Try again in a few minutes.");
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (data.truncated) {
    console.warn("Repository tree was truncated (>10,000 files). Some files may be missing.");
  }
  return data.tree || [];
}

// ── File classification ──

const GATE_FILES = new Set([
  "package.json", "mix.exs", "Cargo.toml", "go.mod", "pyproject.toml",
  "setup.py", "build.gradle", "pom.xml", "Gemfile", "composer.json",
]);

const CONFIG_PATTERNS = [
  /^\./, /config/i, /\.config\./i, /\.toml$/i, /\.yaml$/i, /\.yml$/i,
  /tsconfig/, /eslint/, /prettier/, /webpack/, /vite\.config/, /svelte\.config/,
];

const DOC_PATTERNS = [/readme/i, /changelog/i, /license/i, /contributing/i, /docs?\//i];

function classifyFile(path) {
  const name = path.split("/").pop() || "";
  if (GATE_FILES.has(name)) return "gate";
  if (DOC_PATTERNS.some((p) => p.test(path))) return "tower";
  if (CONFIG_PATTERNS.some((p) => p.test(name))) return "wall";
  return "tile";
}

function classifyDir(name) {
  const lower = name.toLowerCase();
  if (["src", "lib", "app", "packages", "internal", "cmd"].includes(lower)) return "src";
  if (["test", "tests", "spec", "specs", "__tests__", "e2e"].includes(lower)) return "test";
  if (["docs", "doc", "documentation", "wiki"].includes(lower)) return "docs";
  if (["scripts", "bin", "tools", "ci"].includes(lower)) return "scripts";
  if (["assets", "static", "public", "images", "media"].includes(lower)) return "assets";
  if (["config", "configs", ".github", ".vscode"].includes(lower)) return "config";
  return "lib";
}

/**
 * Convert a GitHub repo tree into Svelte Flow nodes + edges.
 * @param {string} repoName
 * @param {Array<{ path: string, type: string, size?: number }>} tree
 * @returns {{ nodes: object[], edges: object[], manifest: object }}
 */
export function repoToFort(repoName, tree) {
  // Group files by top-level directory
  /** @type {Map<string, Array<{ path: string, type: string, size?: number }>>} */
  const dirs = new Map();
  const rootFiles = [];

  for (const item of tree) {
    const parts = item.path.split("/");
    if (parts.length === 1) {
      rootFiles.push(item);
    } else {
      const topDir = parts[0];
      if (!dirs.has(topDir)) dirs.set(topDir, []);
      dirs.get(topDir).push(item);
    }
  }

  const nodes = [];
  const edges = [];
  const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(dirs.size + 1))));
  const xSpacing = 340;
  const ySpacing = 230;

  // Root files as a special room
  if (rootFiles.length > 0) {
    const id = `repo-root`;
    const h = hash(id);
    nodes.push({
      id,
      type: "room",
      position: { x: 20, y: 20 },
      data: {
        label: "/",
        rune: FUTHARK[h % FUTHARK.length],
        tileCount: rootFiles.length,
        kind: "config",
        state: "idle",
        activity: 0.3,
        confidence: 0.8,
      },
    });
  }

  // Top-level dirs as rooms
  let idx = 0;
  const dirNames = [...dirs.keys()].sort();
  for (const dirName of dirNames) {
    const files = dirs.get(dirName);
    const fileCount = files.filter((f) => f.type === "blob").length;
    const subdirCount = files.filter((f) => f.type === "tree").length;
    if (fileCount === 0 && subdirCount === 0) continue;

    const id = `dir-${dirName}`;
    const h = hash(id);
    const category = classifyDir(dirName);
    const col = (idx + 1) % cols;
    const row = Math.floor((idx + 1) / cols) + (rootFiles.length > 0 ? 1 : 0);
    const activity = Math.min(1, fileCount / 50);

    nodes.push({
      id,
      type: "room",
      position: { x: col * xSpacing + 20, y: row * ySpacing + 20 },
      data: {
        label: dirName,
        rune: FUTHARK[h % FUTHARK.length],
        tileCount: fileCount,
        kind: category,
        state: activity > 0.6 ? "active" : activity > 0.3 ? "pulsing" : "idle",
        activity: +activity.toFixed(2),
        confidence: +(0.5 + (h % 40) / 100).toFixed(2),
      },
    });

    // Check for gate files in this directory
    const hasGate = files.some((f) => {
      const name = f.path.split("/").pop();
      return GATE_FILES.has(name);
    });
    if (hasGate) {
      const gateId = `gate-${dirName}`;
      nodes.push({
        id: gateId,
        type: "gate",
        position: { x: col * xSpacing + 140, y: row * ySpacing + 160 },
        data: {
          label: `${dirName} entry`,
          detail: `${fileCount} files · ${subdirCount} dirs`,
        },
      });
      edges.push({
        id: `e-${id}-${gateId}`,
        source: id,
        target: gateId,
        sourceHandle: "bottom",
        targetHandle: "top",
      });
    }

    idx++;
  }

  // Detect relationships between directories
  const dirNodeIds = nodes.filter((n) => n.id.startsWith("dir-")).map((n) => n.id);

  // Connect dirs that share file extensions (weak structural edges)
  /** @type {Map<string, Set<string>>} */
  const extMap = new Map();
  for (const dirName of dirNames) {
    const files = dirs.get(dirName);
    for (const f of files) {
      if (f.type !== "blob") continue;
      const ext = (f.path.split(".").pop() || "").toLowerCase();
      if (!ext || ext.length > 6) continue;
      if (!extMap.has(ext)) extMap.set(ext, new Set());
      extMap.get(ext).add(`dir-${dirName}`);
    }
  }

  const addedEdges = new Set();
  for (const [ext, dirIds] of extMap) {
    const arr = [...dirIds].filter((id) => dirNodeIds.includes(id));
    if (arr.length < 2 || arr.length > 4) continue;
    // Only connect for significant extensions
    if (!["js", "ts", "jsx", "tsx", "svelte", "py", "ex", "exs", "rs", "go", "java", "rb"].includes(ext)) continue;
    for (let i = 0; i < arr.length - 1; i++) {
      const edgeKey = `${arr[i]}-${arr[i + 1]}`;
      if (addedEdges.has(edgeKey)) continue;
      addedEdges.add(edgeKey);
      edges.push({
        id: `e-ext-${ext}-${i}`,
        source: arr[i],
        target: arr[i + 1],
        label: `.${ext}`,
        sourceHandle: "right",
        targetHandle: "left",
        animated: false,
      });
    }
  }

  // Connect root to first src-like dir
  if (rootFiles.length > 0 && dirNodeIds.length > 0) {
    const srcDir = dirNodeIds.find((id) => {
      const name = id.replace("dir-", "");
      return ["src", "lib", "app", "packages"].includes(name.toLowerCase());
    }) || dirNodeIds[0];
    edges.push({
      id: "e-root-src",
      source: "repo-root",
      target: srcDir,
      sourceHandle: "bottom",
      targetHandle: "top",
      animated: true,
    });
  }

  // Build a minimal manifest for fort store compatibility
  const manifest = {
    loop_id: `repo.${repoName}`,
    label: repoName,
    rune: FUTHARK[hash(repoName) % FUTHARK.length],
    color: "#e8a84c",
    role: "Repository",
    schema: "(github)",
    phases: dirNames.slice(0, 5).map((name) => ({
      id: `dir-${name}`,
      kind: classifyDir(name) === "src" ? "act" : classifyDir(name) === "test" ? "observe" : "retrieve",
      timeout_ms: 5000,
    })),
    repoMeta: {
      totalFiles: tree.filter((t) => t.type === "blob").length,
      totalDirs: tree.filter((t) => t.type === "tree").length,
      topLevelDirs: dirNames.length,
      rootFiles: rootFiles.length,
    },
  };

  return { nodes, edges, manifest };
}

/**
 * Get repo stats without generating a full fort (for preview).
 * @param {Array<{ path: string, type: string, size?: number }>} tree
 * @returns {{ fileCount: number, dirCount: number, topDirs: string[], languages: string[] }}
 */
export function getRepoStats(tree) {
  const fileCount = tree.filter((t) => t.type === "blob").length;
  const dirCount = tree.filter((t) => t.type === "tree").length;
  const topDirs = [...new Set(tree.map((t) => t.path.split("/")[0]).filter(Boolean))].sort();

  const extCounts = new Map();
  for (const t of tree) {
    if (t.type !== "blob") continue;
    const ext = (t.path.split(".").pop() || "").toLowerCase();
    if (ext && ext.length <= 6) {
      extCounts.set(ext, (extCounts.get(ext) || 0) + 1);
    }
  }
  const languages = [...extCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ext]) => ext);

  return { fileCount, dirCount, topDirs, languages };
}
