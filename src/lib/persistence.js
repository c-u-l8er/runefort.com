import { getSupabase } from "$lib/supabase.js";

function sb() {
  const client = getSupabase();
  if (!client) throw new Error("Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
  return client;
}

/**
 * Save a fort layout to rune.forts
 * @param {object} params
 * @param {string} params.workspace_id
 * @param {string} params.loop_id
 * @param {string} params.name
 * @param {object} params.layout
 * @param {Record<string, boolean>} params.overlays
 * @param {number} params.zoom_level
 * @returns {Promise<{id: string}>}
 */
export async function saveFort({ workspace_id, loop_id, name, layout, overlays, zoom_level }) {
  const { data, error } = await sb()
    .from("forts")
    .insert({ workspace_id, loop_id, name, layout, overlays, zoom_level })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update an existing fort
 * @param {string} id
 * @param {object} updates
 */
export async function updateFort(id, updates) {
  const { error } = await sb()
    .from("forts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Load a fort by ID
 * @param {string} id
 */
export async function loadFort(id) {
  const { data, error } = await sb()
    .from("forts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * List all forts for a workspace
 * @param {string} workspace_id
 */
export async function listForts(workspace_id) {
  const { data, error } = await sb()
    .from("forts")
    .select("id, name, loop_id, zoom_level, created_at, updated_at")
    .eq("workspace_id", workspace_id)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Delete a fort
 * @param {string} id
 */
export async function deleteFort(id) {
  const { error } = await sb().from("forts").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Save a view bookmark
 * @param {object} params
 * @param {string} params.fort_id
 * @param {string} params.name
 * @param {object} params.viewport
 */
export async function saveView({ fort_id, name, viewport }) {
  const { data, error } = await sb()
    .from("views")
    .insert({ fort_id, name, viewport })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

/**
 * List views for a fort
 * @param {string} fort_id
 */
export async function listViews(fort_id) {
  const { data, error } = await sb()
    .from("views")
    .select("*")
    .eq("fort_id", fort_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
