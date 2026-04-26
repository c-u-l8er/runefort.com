// @ts-check
// Editor handoff. Maps an `anchor` string ("lib/foo.ex:24" or "lib/foo.ex#L24")
// plus an `editor` identifier to a URL the OS knows how to open.

/**
 * Built-in editor URL builders. Each takes (path, line) and returns the URL.
 * Path is the anchor without the line suffix; line is a number or null.
 */
const BUILTIN = {
  vscode: (path, line) => `vscode://file/${path}${line ? `:${line}` : ""}`,
  cursor: (path, line) => `cursor://file/${path}${line ? `:${line}` : ""}`,
  zed:    (path, line) => `zed://file/${path}${line ? `:${line}` : ""}`,
  idea:   (path, line) => `idea://open?file=${encodeURIComponent(path)}${line ? `&line=${line}` : ""}`,
  file:   (path) => `file:///${path.replace(/^\/+/, "")}`,
  github: (path, line) => `https://github.com/${path}${line ? `#L${line}` : ""}`,
  // "browser" means the floor is paired with a <rune-editor> in the page.
  // No external URL is built; the editor handles the rune:open event.
  browser: () => null,
};

/**
 * Split an anchor into (path, line). Accepts:
 *   "lib/foo.ex"          -> { path: "lib/foo.ex", line: null }
 *   "lib/foo.ex:24"       -> { path: "lib/foo.ex", line: 24 }
 *   "lib/foo.ex#L24"      -> { path: "lib/foo.ex", line: 24 }
 *
 * @param {string} anchor
 * @returns {{ path: string, line: number | null }}
 */
export function parseAnchor(anchor) {
  if (typeof anchor !== "string" || !anchor) return { path: "", line: null };

  // "#L24" form
  const hashMatch = anchor.match(/^(.+?)#L(\d+)$/);
  if (hashMatch) return { path: hashMatch[1], line: parseInt(hashMatch[2], 10) };

  // ":24" form
  const colonMatch = anchor.match(/^(.+?):(\d+)$/);
  if (colonMatch) return { path: colonMatch[1], line: parseInt(colonMatch[2], 10) };

  return { path: anchor, line: null };
}

/**
 * Build a URL for the given editor identifier and anchor. Returns null if the
 * editor is unknown and not a URL template.
 *
 * Custom templates: pass the editor as a string containing "{path}" and/or
 * "{line}" placeholders, e.g. "https://my.repo/blob/main/{path}#L{line}".
 *
 * @param {string} editor
 * @param {string} anchor
 * @returns {string | null}
 */
export function buildUrl(editor, anchor) {
  const { path, line } = parseAnchor(anchor);
  if (!path) return null;

  const builder = BUILTIN[editor];
  if (builder) {
    const result = builder(path, line);
    return result; // may legitimately be null (e.g. editor="browser")
  }

  // Custom template
  if (typeof editor === "string" && editor.includes("{path}")) {
    return editor
      .replace(/\{path\}/g, encodeURIComponent(path))
      .replace(/\{line\}/g, line != null ? String(line) : "");
  }

  return null;
}
