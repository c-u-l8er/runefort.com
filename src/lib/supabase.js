import { createClient } from "@supabase/supabase-js";

/** @type {any} */
let _supabase = null;
/** @type {any} */
let _ampDb = null;

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

/** Lazily create amp.* schema client */
export function getAmpDb() {
  if (!_ampDb) {
    const key = getKey();
    if (!key) return null;
    _ampDb = createClient(getUrl(), key, {
      db: { schema: "amp" },
      auth: { persistSession: true },
    });
  }
  return _ampDb;
}

/** Whether Supabase is actually configured */
export function isConfigured() {
  return typeof window !== "undefined" && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
}
