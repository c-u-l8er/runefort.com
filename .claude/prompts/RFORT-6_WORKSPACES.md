# RFort-6: Workspace Switcher + Supabase Persistence

## Goal
Connect RuneFort to the shared Supabase workspace system (`amp.workspaces`). Each workspace has its own district of forts. Switching workspace reloads the fort view from Supabase.

## Prerequisites
- RFort-1 (BYOK) — not required
- Auth system already exists (`src/lib/stores/auth.svelte.js`, `src/components/app/AuthModal.svelte`)
- Supabase client exists (`src/lib/supabase.js`) targeting `rune` schema
- Persistence layer exists (`src/lib/persistence.js`) with CRUD for `rune.forts` and `rune.views`
- Migrations exist: `ampersand-supabase/migrations/090_rune_schema.sql` (forts, views, bridges, districts tables), `091_rune_rls.sql` (RLS policies using `amp.is_workspace_member()`)

## Files to Create

### `src/lib/play/workspaces.js`
Workspace loader using Supabase:
```js
import { getSupabase } from '$lib/supabase.js';

// List workspaces the user is a member of
export async function listWorkspaces() {
  const sb = getSupabase();
  if (!sb) return [];
  // Query amp.workspaces via amp schema (need a second client or RPC)
  // Alternatively, query rune.forts grouped by workspace_id
  const { data } = await sb.rpc('list_my_workspaces');
  return data || [];
}

// Load all forts for a workspace
export async function loadWorkspaceForts(workspaceId) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from('forts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false });
  return data || [];
}

// Load all districts for a workspace
export async function loadWorkspaceDistricts(workspaceId) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from('districts')
    .select('*, forts(*)')
    .eq('workspace_id', workspaceId);
  return data || [];
}
```

### `src/lib/stores/workspace.svelte.js`
Svelte 5 rune store:
```js
let _workspaces = $state([]);
let _activeWorkspace = $state(null);
let _forts = $state([]);

export function getWorkspaces() { return _workspaces; }
export function getActiveWorkspace() { return _activeWorkspace; }
export function getWorkspaceForts() { return _forts; }

export async function initWorkspaces() {
  _workspaces = await listWorkspaces();
  if (_workspaces.length > 0) {
    await switchWorkspace(_workspaces[0].id);
  }
}

export async function switchWorkspace(workspaceId) {
  _activeWorkspace = _workspaces.find(w => w.id === workspaceId);
  _forts = await loadWorkspaceForts(workspaceId);
  // Trigger fort store to rebuild district from workspace forts
}
```

### `src/components/app/WorkspaceSwitcher.svelte`
Dropdown in the toolbar:
- Shows current workspace name
- Dropdown lists all workspaces with fort counts
- "Demo" option always available (loads demo manifests, no auth required)
- Switching workspace triggers `switchWorkspace()` which reloads forts

### Supabase RPC (migration)
If `amp.list_my_workspaces()` doesn't exist yet, create:
`ampersand-supabase/migrations/092_rune_workspace_rpc.sql`:
```sql
-- RPC to list workspaces the current user is a member of
-- This may already exist in amp schema; check first
CREATE OR REPLACE FUNCTION rune.list_my_workspaces()
RETURNS TABLE (id uuid, name text, slug text, fort_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT w.id, w.name, w.slug, COUNT(f.id) as fort_count
  FROM amp.workspaces w
  JOIN amp.members m ON m.workspace_id = w.id
  LEFT JOIN rune.forts f ON f.workspace_id = w.id
  WHERE m.user_id = auth.uid()
  GROUP BY w.id, w.name, w.slug
  ORDER BY w.name;
$$;

GRANT EXECUTE ON FUNCTION rune.list_my_workspaces() TO authenticated;
```

## Integration Points

1. **Toolbar**: Replace static "RuneFort" brand text with `WorkspaceSwitcher` dropdown when authenticated
2. **Auth flow**: After sign-in, call `initWorkspaces()` to load the user's workspaces
3. **Fort store**: Add `loadWorkspaceDistrict(forts)` that converts saved forts into an L0 district view
4. **Save flow**: When saving a fort, include `workspace_id` from active workspace
5. **BlueprintList**: Filter by active workspace

## Constraints
- Unauthenticated users see demo forts only (the existing DEMO_MANIFESTS)
- Workspace data comes from `amp.workspaces` + `amp.members` (shared schema)
- Fort data comes from `rune.forts` (product schema)
- RLS already handles access control — no client-side filtering needed
- Check if `amp.list_my_workspaces()` or equivalent already exists before creating migration
