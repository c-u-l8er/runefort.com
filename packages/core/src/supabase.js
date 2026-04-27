// @ts-check
// supabase.js — auth + cloud sync against the shared ampersand-supabase
// instance. Operates on the rune.* schema (see ampersand-supabase/migrations
// 092-095).
//
// CONFIG: the host page must set `window.RUNEFORT_SUPABASE` before this
// module is imported, e.g.:
//
//   <script>
//     window.RUNEFORT_SUPABASE = {
//       url: "http://127.0.0.1:54321",
//       anonKey: "<your-anon-key>",
//     };
//   </script>
//
// If config is missing, sync/auth APIs throw a descriptive error and the
// rest of the runtime continues to work in local-only mode.

import { fortStore, entityStore, threadStore } from "./runtime.js";

const SUPABASE_ESM = "https://esm.sh/@supabase/supabase-js@2.45.4";

/** @type {any} */
let _client = null;
let _initPromise = null;

function getConfig() {
  /** @type {any} */
  const cfg = (typeof window !== "undefined" && window.RUNEFORT_SUPABASE) || null;
  if (!cfg || !cfg.url || !cfg.anonKey) return null;
  return cfg;
}

/**
 * Lazily build the supabase-js client. Returns null if config is missing,
 * so callers can short-circuit cleanly.
 * @returns {Promise<any|null>}
 */
export async function getSupabase() {
  if (_client) return _client;
  const cfg = getConfig();
  if (!cfg) return null;
  if (!_initPromise) {
    _initPromise = import(/* @vite-ignore */ SUPABASE_ESM).then((mod) => {
      _client = mod.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      });
      return _client;
    });
  }
  return _initPromise;
}

/** @returns {boolean} */
export function isSupabaseConfigured() {
  return !!getConfig();
}

// ─── Auth ──────────────────────────────────────────────────────────────
//
// Mirrors the v2 / bendscript pattern: email+password, magic-link, OAuth,
// and password reset. Supabase's `detectSessionInUrl: true` (default) picks
// up the post-redirect hash params automatically, so no callback page is
// required for this static-HTML host.

function buildRedirectUrl() {
  if (typeof window === "undefined") return undefined;
  return window.location.origin + window.location.pathname + window.location.search;
}

/**
 * Sign in with email + password.
 * @param {string} email
 * @param {string} password
 */
export async function signIn(email, password) {
  const sb = await getSupabase();
  if (!sb) throw new Error("Supabase is not configured");
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/**
 * Create an account with email + password. Supabase will email a
 * confirmation link if confirmations are enabled in the project.
 * @param {string} email
 * @param {string} password
 */
export async function signUp(email, password) {
  const sb = await getSupabase();
  if (!sb) throw new Error("Supabase is not configured");
  const { error } = await sb.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: buildRedirectUrl() },
  });
  if (error) throw error;
}

/**
 * Send a magic link OTP. The link signs the user in (creating an account on
 * first click).
 * @param {string} email
 */
export async function signInWithMagicLink(email) {
  const sb = await getSupabase();
  if (!sb) throw new Error("Supabase is not configured");
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: buildRedirectUrl() },
  });
  if (error) throw error;
}

/**
 * Start an OAuth flow. Browser navigates away on success.
 * @param {"google" | "github"} provider
 */
export async function signInWithProvider(provider) {
  const sb = await getSupabase();
  if (!sb) throw new Error("Supabase is not configured");
  const { error } = await sb.auth.signInWithOAuth({
    provider,
    options: { redirectTo: buildRedirectUrl() },
  });
  if (error) throw error;
}

/**
 * Send a password-reset email.
 * @param {string} email
 */
export async function resetPasswordForEmail(email) {
  const sb = await getSupabase();
  if (!sb) throw new Error("Supabase is not configured");
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: buildRedirectUrl(),
  });
  if (error) throw error;
}

export async function signOut() {
  const sb = await getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

export async function getSession() {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session || null;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Subscribe to auth state changes. Returns an unsubscribe function.
 * @param {(event: string, session: any) => void} cb
 */
export async function onAuthChange(cb) {
  const sb = await getSupabase();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange(cb);
  return () => data.subscription.unsubscribe();
}

// ─── Document assembly ─────────────────────────────────────────────────
// A fort's canonical "document" (the shape stored in rune.forts.document) is
// reconstructed from the entityStore by walking campus → buildings → floors
// → rooms.

/**
 * Build the canonical document JSON for a fort by walking its entityStore.
 * Returns null if the fort has no campus.
 * @param {string} fortId
 */
export function snapshotFortDocument(fortId) {
  const wasActive = fortStore.getActiveId();
  let switched = false;
  if (wasActive !== fortId) {
    fortStore.setActiveId(fortId);
    switched = true;
  }
  try {
    const entities = entityStore.list();
    const byType = (t) => entities.filter((e) => e.type === t);
    const campusEntity = byType("campus")[0];
    if (!campusEntity) return null;

    const findChildren = (type, parentId) =>
      entities
        .filter((e) => e.type === type && e.parent_id === parentId)
        .map((e) => e.json);

    const campus = { ...campusEntity.json };
    campus.buildings = byType("building")
      .filter((b) => b.parent_id === campusEntity.id)
      .map((b) => {
        const json = { ...b.json };
        json.floors = findChildren("floor", b.id).map((f) => {
          const fjson = { ...f };
          fjson.rooms = findChildren("room", f.id);
          return fjson;
        });
        return json;
      });

    const meta = fortStore.get(fortId);
    return {
      title: meta?.title || "Untitled fort",
      vocabulary: meta?.vocabulary || "core",
      campus,
    };
  } finally {
    if (switched && wasActive) fortStore.setActiveId(wasActive);
  }
}

/**
 * Inverse of snapshotFortDocument. Writes campus/buildings/floors/rooms into
 * the active fort's entityStore. Caller is responsible for setting the
 * active fort id first.
 * @param {any} doc
 */
function hydrateFortDocument(doc) {
  if (!doc?.campus) throw new Error("hydrateFortDocument: doc.campus required");
  entityStore.clearAll();
  const campus = doc.campus;
  const campusJson = { ...campus };
  delete campusJson.buildings;
  entityStore.put(campus.id, "campus", null, campusJson);
  for (const b of campus.buildings || []) {
    const bjson = { ...b };
    delete bjson.floors;
    entityStore.put(b.id, "building", campus.id, bjson);
    for (const f of b.floors || []) {
      const fjson = { ...f };
      delete fjson.rooms;
      entityStore.put(f.id, "floor", b.id, fjson);
      for (const r of f.rooms || []) {
        entityStore.put(r.id, "room", f.id, r);
      }
    }
  }
}

// ─── Cloud sync ────────────────────────────────────────────────────────

/**
 * Push a local fort to the cloud. Creates the row on first push, updates
 * via the optimistic-concurrency RPC on subsequent pushes.
 *
 * @param {string} fortId  local fort id
 * @returns {Promise<{ cloudId: string, version: number }>}
 */
export async function pushFort(fortId) {
  const sb = await getSupabase();
  if (!sb) throw new Error("Supabase is not configured");
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in to sync forts to the cloud");

  const meta = fortStore.get(fortId);
  if (!meta) throw new Error(`pushFort: unknown fort ${fortId}`);
  const doc = snapshotFortDocument(fortId);
  if (!doc) throw new Error(`pushFort: fort ${fortId} has no campus to push`);

  if (meta.cloudId) {
    // Update via RPC for optimistic concurrency.
    const { data, error } = await sb.rpc("update_fort", {
      target_fort_id: meta.cloudId,
      expected_version: meta.cloudVersion ?? 1,
      new_document: doc,
      new_title: meta.title,
    });
    if (error) {
      // SQLSTATE 40001 = stale write.
      if (error.code === "40001" || /stale write/i.test(error.message || "")) {
        const e = new Error("Cloud version is newer. Pull or fork to resolve.");
        /** @type {any} */ (e).code = "STALE_WRITE";
        throw e;
      }
      throw error;
    }
    fortStore.update(fortId, { cloudVersion: data });
    return { cloudId: meta.cloudId, version: data };
  } else {
    // First push: insert.
    const { data, error } = await sb
      .from("forts")
      .insert({
        owner_id: user.id,
        title: meta.title,
        vocabulary: meta.vocabulary,
        document: doc,
        visibility: "private",
        version: 1,
      })
      .select("id, version")
      .single();
    if (error) throw error;
    fortStore.update(fortId, { cloudId: data.id, cloudVersion: data.version });
    return { cloudId: data.id, version: data.version };
  }
}

/**
 * Pull a cloud fort into a local fort. If the local fort already has this
 * cloudId, updates in place; otherwise creates a new local fort.
 *
 * @param {string} cloudId
 * @returns {Promise<{ fortId: string, version: number }>}
 */
export async function pullFort(cloudId) {
  const sb = await getSupabase();
  if (!sb) throw new Error("Supabase is not configured");
  const { data, error } = await sb
    .from("forts")
    .select("id, title, vocabulary, document, version")
    .eq("id", cloudId)
    .single();
  if (error) throw error;

  // Find existing local fort linked to this cloud row, or create a new one.
  const existing = fortStore.list().find((f) => f.cloudId === cloudId);
  let localId;
  if (existing) {
    localId = existing.id;
    fortStore.update(localId, {
      title: data.title,
      vocabulary: data.vocabulary,
      cloudVersion: data.version,
    });
  } else {
    const meta = fortStore.create({
      title: data.title,
      vocabulary: data.vocabulary,
    });
    localId = meta.id;
    fortStore.update(localId, { cloudId: data.id, cloudVersion: data.version });
  }

  fortStore.setActiveId(localId);
  hydrateFortDocument(data.document);
  return { fortId: localId, version: data.version };
}

/**
 * List every fort visible to the current user (owner + workspace + public).
 * Used by the picker's "cloud" tab.
 */
export async function listCloudForts() {
  const sb = await getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("forts")
    .select("id, title, slug, visibility, version, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Anonymous read of a public fort by slug. Used by the public-fort URL
 * route. Returns null if not found or not public.
 *
 * @param {string} slug
 */
export async function loadPublicFort(slug) {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("forts")
    .select("id, title, vocabulary, document, version")
    .eq("slug", slug)
    .in("visibility", ["public", "unlisted"])
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/**
 * Fork a cloud fort via the server-side RPC (which copies the document into
 * a new row owned by the caller).
 *
 * @param {string} sourceCloudId
 */
export async function forkCloudFort(sourceCloudId) {
  const sb = await getSupabase();
  if (!sb) throw new Error("Supabase is not configured");
  const { data, error } = await sb.rpc("fork_fort", {
    source_fort_id: sourceCloudId,
  });
  if (error) throw error;
  // After fork, pull the new fort to bring it into local storage.
  return await pullFort(data);
}
