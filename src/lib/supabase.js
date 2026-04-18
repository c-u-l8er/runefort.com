import { createClient } from "@supabase/supabase-js";

/** @type {any} */
let _supabase = null;

function getUrl() {
  return (typeof window !== "undefined" && import.meta.env.VITE_SUPABASE_URL) || "http://localhost:54321";
}

function getKey() {
  return (typeof window !== "undefined" && import.meta.env.VITE_SUPABASE_ANON_KEY) || "";
}

/** Lazily create rune.* schema client */
export function getSupabase() {
  if (!_supabase) {
    const key = getKey();
    if (!key) return null;
    _supabase = createClient(getUrl(), key, {
      db: { schema: "rune" },
      auth: { persistSession: true },
    });
  }
  return _supabase;
}

/**
 * Access the amp.* schema via the same authenticated client used for rune.*.
 * Using a single client (instead of a second createClient) ensures the user's
 * JWT is attached to PostgREST requests so RLS on amp.workspaces sees the
 * signed-in user — otherwise the WorkspaceSwitcher stays empty after sign-in.
 */
export function getAmpDb() {
  const sb = getSupabase();
  return sb ? sb.schema("amp") : null;
}

/** Whether Supabase is actually configured */
export function isConfigured() {
  return typeof window !== "undefined" && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
}
