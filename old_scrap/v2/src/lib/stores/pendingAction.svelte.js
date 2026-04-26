// Tiny cross-auth-flow action stash. Magic-link sign-in bounces the user
// through /auth/callback, so any in-memory pending state would be lost.
// localStorage survives the round-trip.
//
// Supported action shapes:
//   { type: "add_manifest", manifest: object, source?: string }
//   { type: "create_workspace", name: string, templateId: string }

const KEY = "runefort.pending_action";

/** @param {object} action */
export function setPendingAction(action) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(action));
  } catch {
    // quota / serialization failure — silently ignore, the feature degrades to
    // in-session only
  }
}

/** @returns {any | null} */
export function getPendingAction() {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function clearPendingAction() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
}
