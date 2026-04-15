/**
 * GitHub live status — fetches branch, PR, commit, and CI info.
 * Uses GitHub API (unauthenticated, 60 req/hr rate limit).
 */

const API = "https://api.github.com";

/**
 * Fetch branch info and open PR count for a repo.
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<{ branch: string, prCount: number } | null>}
 */
export async function fetchBranchInfo(owner, repo) {
  try {
    const [repoRes, prRes] = await Promise.all([
      fetch(`${API}/repos/${owner}/${repo}`, { headers: { Accept: "application/vnd.github.v3+json" } }),
      fetch(`${API}/repos/${owner}/${repo}/pulls?state=open&per_page=1`, { headers: { Accept: "application/vnd.github.v3+json" } }),
    ]);
    if (!repoRes.ok) return null;
    const repoData = await repoRes.json();
    // PR count from Link header (efficient for large counts)
    let prCount = 0;
    if (prRes.ok) {
      const prs = await prRes.json();
      prCount = prs.length;
      // Check Link header for total count
      const link = prRes.headers.get("Link") || "";
      const lastMatch = link.match(/page=(\d+)>; rel="last"/);
      if (lastMatch) prCount = parseInt(lastMatch[1], 10);
    }
    return { branch: repoData.default_branch || "main", prCount };
  } catch {
    return null;
  }
}

/**
 * Fetch last commit info on a branch.
 * @param {string} owner
 * @param {string} repo
 * @param {string} [branch]
 * @returns {Promise<{ sha: string, message: string, timestamp: string, author: string } | null>}
 */
export async function fetchLastCommit(owner, repo, branch = "main") {
  try {
    const res = await fetch(`${API}/repos/${owner}/${repo}/commits/${branch}`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      sha: data.sha?.slice(0, 7) || "",
      message: data.commit?.message?.split("\n")[0] || "",
      timestamp: data.commit?.author?.date || "",
      author: data.commit?.author?.name || "",
    };
  } catch {
    return null;
  }
}

/**
 * Fetch CI/check status for a commit SHA.
 * @param {string} owner
 * @param {string} repo
 * @param {string} sha
 * @returns {Promise<{ status: 'passing'|'failing'|'running'|'unknown', checks: number } | null>}
 */
export async function fetchCIStatus(owner, repo, sha) {
  try {
    const res = await fetch(`${API}/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=100`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const runs = data.check_runs || [];
    if (runs.length === 0) return { status: "unknown", checks: 0 };
    const failed = runs.some((r) => r.conclusion === "failure");
    const inProgress = runs.some((r) => r.status === "in_progress" || r.status === "queued");
    let status = "passing";
    if (failed) status = "failing";
    else if (inProgress) status = "running";
    return { status, checks: runs.length };
  } catch {
    return null;
  }
}

/**
 * Fetch full repo status (branch, PRs, last commit, CI).
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<{ branch: string, prCount: number, lastCommit: string, ciStatus: string } | null>}
 */
export async function fetchRepoStatus(owner, repo) {
  const branchInfo = await fetchBranchInfo(owner, repo);
  if (!branchInfo) return null;

  const commit = await fetchLastCommit(owner, repo, branchInfo.branch);
  let ciStatus = "unknown";
  if (commit?.sha) {
    const ci = await fetchCIStatus(owner, repo, commit.sha);
    ciStatus = ci?.status || "unknown";
  }

  return {
    branch: branchInfo.branch,
    prCount: branchInfo.prCount,
    lastCommit: commit?.timestamp || "",
    ciStatus,
  };
}
