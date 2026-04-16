import { getSupabase } from "$lib/supabase.js";

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

export async function initAuth() {
  const sb = getSupabase();
  if (!sb) {
    auth.loading = false;
    return;
  }
  const { data } = await sb.auth.getSession();
  auth.user = data.session?.user ?? null;
  auth.loading = false;

  sb.auth.onAuthStateChange((_event, session) => {
    auth.user = session?.user ?? null;
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
