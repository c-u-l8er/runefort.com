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

/** @param {string} email @param {string} password */
export async function signUp(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  auth.showModal = false;
}

/** @param {string} email @param {string} password */
export async function signIn(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  auth.showModal = false;
}

export async function signOut() {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
  auth.user = null;
}
