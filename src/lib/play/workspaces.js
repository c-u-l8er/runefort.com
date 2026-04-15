/**
 * Workspace loader — queries amp.workspaces + rune.forts via Supabase.
 */

import { getSupabase, getAmpDb } from "$lib/supabase.js";

/**
 * List workspaces the current user is a member of, with fort counts.
 * Uses the amp schema client to query workspaces + members directly
 * (RLS ensures only user's workspaces are returned).
 * @returns {Promise<Array<{ id: string, name: string, slug: string, fort_count: number }>>}
 */
export async function listWorkspaces() {
  const amp = getAmpDb();
  if (!amp) return [];

  // Query workspaces the user can see (RLS filters by membership)
  const { data: workspaces, error: wErr } = await amp
    .from("workspaces")
    .select("id, name, slug")
    .order("name");

  if (wErr || !workspaces) return [];

  // Get fort counts per workspace from rune schema
  const rune = getSupabase();
  if (!rune) return workspaces.map((w) => ({ ...w, fort_count: 0 }));

  const { data: forts } = await rune
    .from("forts")
    .select("workspace_id");

  const counts = new Map();
  for (const f of forts || []) {
    counts.set(f.workspace_id, (counts.get(f.workspace_id) || 0) + 1);
  }

  return workspaces.map((w) => ({
    ...w,
    fort_count: counts.get(w.id) || 0,
  }));
}

/**
 * Load all forts for a workspace.
 * @param {string} workspaceId
 * @returns {Promise<Array<any>>}
 */
export async function loadWorkspaceForts(workspaceId) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("forts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });
  if (error) return [];
  return data || [];
}

/**
 * Load all districts for a workspace.
 * @param {string} workspaceId
 * @returns {Promise<Array<any>>}
 */
export async function loadWorkspaceDistricts(workspaceId) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("districts")
    .select("*, forts(*)")
    .eq("workspace_id", workspaceId);
  if (error) return [];
  return data || [];
}
