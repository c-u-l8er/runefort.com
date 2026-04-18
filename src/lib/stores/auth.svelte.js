import { getSupabase } from "$lib/supabase.js";
import { initWorkspaces, clearWorkspaces } from "$lib/stores/workspace.svelte.js";

/** @type {{ user: any, loading: boolean, showModal: boolean }} */
let auth = $state({ user: null, loading: true, showModal: false });

export function getAuth() {
  return auth;
}

export function openAuthModal() {
  auth.showModal = true;
}

export function closeAuthModal() {
  auth.showModal = false;
}

/**
 * Sync the workspace store to the current auth user.
 * Called on every auth state change so workspaces re-initialize after
 * sign-in and clear on sign-out.
 * @param {any} user
 */
function syncWorkspacesForUser(user) {
  if (user) {
    initWorkspaces()
      .then(() => runPendingActionIfAny())
      .catch((err) => {
        console.warn("initWorkspaces failed:", err);
      });
  } else {
    clearWorkspaces();
  }
}

/**
 * Replay any user action that was stashed while the user was signed out
 * (e.g. "paste manifest JSON" → AuthModal → magic link → back here).
 * Dynamic imports break a would-be cycle: manifestImport.js imports auth.
 */
async function runPendingActionIfAny() {
  try {
    const { getPendingAction, clearPendingAction } = await import(
      "$lib/stores/pendingAction.svelte.js"
    );
    const pending = getPendingAction();
    if (!pending) return;
    clearPendingAction();
    if (pending.type === "add_manifest" && pending.manifest) {
      const { addManifestToActiveWorkspace } = await import("$lib/play/manifestImport.js");
      await addManifestToActiveWorkspace(pending.manifest, {
        source: pending.source ?? "resume",
      });
    } else if (pending.type === "create_workspace" && pending.name) {
      const { findTemplate } = await import("$lib/templates/workspaceTemplates.js");
      const template = pending.templateId ? findTemplate(pending.templateId) : null;
      await initWorkspaces(); // ensure we have the list before creating
      const { createAndSelectWorkspace } = await import("$lib/stores/workspace.svelte.js");
      await createAndSelectWorkspace(pending.name, { template });
    }
  } catch (err) {
    console.warn("pending action replay failed:", err);
  }
}

export async function initAuth() {
  const sb = getSupabase();
  if (!sb) {
    auth.loading = false;
    return;
  }
  const { data } = await sb.auth.getSession();
  auth.user = data.session?.user ?? null;
  auth.loading = false;
  syncWorkspacesForUser(auth.user);

  sb.auth.onAuthStateChange((_event, session) => {
    const nextUser = session?.user ?? null;
    const changed = auth.user?.id !== nextUser?.id;
    auth.user = nextUser;
    if (changed) syncWorkspacesForUser(nextUser);
  });
}

/** @param {string} [redirectTo] */
function buildCallbackUrl(redirectTo) {
  if (typeof window === "undefined") return "";
  const base = window.location.origin;
  const params = new URLSearchParams();
  if (redirectTo) params.set("redirectTo", redirectTo);
  const qs = params.toString();
  return `${base}/auth/callback${qs ? `?${qs}` : ""}`;
}

/** @param {string} email @param {string} password */
export async function signUp(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const emailRedirectTo = buildCallbackUrl();
  const { error } = await sb.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });
  if (error) throw error;
}

/** @param {string} email @param {string} password */
export async function signIn(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  auth.showModal = false;
}

/** @param {string} email */
export async function signInWithMagicLink(email) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const emailRedirectTo = buildCallbackUrl();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo },
  });
  if (error) throw error;
}

/** @param {"github" | "google"} provider */
export async function signInWithProvider(provider) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const redirectTo = buildCallbackUrl();
  const { error } = await sb.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  if (error) throw error;
}

/** @param {string} email */
export async function resetPasswordForEmail(email) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const redirectTo = buildCallbackUrl("update-password");
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

/** @param {string} password */
export async function updatePassword(password) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
  auth.user = null;
}
