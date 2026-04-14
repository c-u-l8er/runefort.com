# RuneFort Interactive Layer — Build Order

## Overview
Six prompts that transform RuneFort from a static fort visualizer into an interactive playground with BYOK chat, MCP tool connections, token flow animations, repo import, and workspace management.

## Dependency Graph
```
RFORT-1 (BYOK) ──────┐
                      ├── RFORT-3 (Chat) ── RFORT-4 (Token Flows)
RFORT-2 (MCP) ───────┘
RFORT-5 (Repo Import) ── standalone, uses fort generator
RFORT-6 (Workspaces) ── standalone, uses auth + supabase
```

## Recommended Session Plan

### Session A: Foundation (RFORT-1 + RFORT-2)
**Prompt**: "Build RFORT-1 and RFORT-2. Read `.claude/prompts/RFORT-1_BYOK.md` and `.claude/prompts/RFORT-2_MCP.md` for full specs. These are the foundation — BYOK key storage and MCP proxy/client. Port patterns from `bendscript.com/src/lib/play/` and `bendscript.com/src/routes/api/play/mcp-proxy/`. Verify: API key modal opens, key persists in localStorage, MCP proxy forwards to graphonomous-mcp.fly.dev, tool discovery returns tools."

### Session B: Chat (RFORT-3)
**Prompt**: "Build RFORT-3. Read `.claude/prompts/RFORT-3_CHAT.md` for full spec. Add the chat panel with tool-use loop. The chat should use the BYOK OpenRouter key (from RFORT-1), call MCP tools via the proxy (from RFORT-2), and execute built-in fort navigation tools that zoom/navigate the fort view. Verify: chat sends messages via OpenRouter, tool calls work (both MCP and built-in), fort navigation tools zoom the view."

### Session C: Token Flows (RFORT-4)
**Prompt**: "Build RFORT-4. Read `.claude/prompts/RFORT-4_TOKENFLOWS.md` for full spec. Add animated particles on Svelte Flow edges representing token throughput. Include a benchmark simulation mode that cascades flows through PULSE phases. Verify: particles animate along edges, speed/color respond to metrics, simulation runs through all phases."

### Session D: Repo Import (RFORT-5)
**Prompt**: "Build RFORT-5. Read `.claude/prompts/RFORT-5_REPO_IMPORT.md` for full spec. Add GitHub repo import that converts repository structure into a fort. Directories → rooms, files → tiles, package manifests → gates. Verify: paste a GitHub URL, import generates a navigable fort, zoom works on imported fort."

### Session E: Workspaces (RFORT-6)
**Prompt**: "Build RFORT-6. Read `.claude/prompts/RFORT-6_WORKSPACES.md` for full spec. Add workspace switching tied to amp.workspaces. Each workspace shows its own district of saved forts. Verify: workspace dropdown shows user's workspaces, switching reloads forts, demo mode works without auth."

## Context for All Sessions
- **Framework**: SvelteKit 2.x + Svelte 5 (runes: `$state`, `$props`, `$effect`)
- **Flow lib**: `@xyflow/svelte` v1.5.0
- **Style**: Dark theme, zinc-900 bg, amber-400 accents
- **SSR**: Disabled on `/app` route (`export const ssr = false`)
- **Supabase**: Lazy client via `getSupabase()` (returns null during SSR)
- **Existing code**: Marketing site + 5-level fort editor already built (see `src/` tree)
- **BendScript reference**: The `/play` implementation in `bendscript.com/` is the proven pattern to port from
