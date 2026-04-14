# RFort-1: BYOK Modal + OpenRouter Key Storage

## Goal
Port BendScript's BYOK pattern to RuneFort. Users bring their own OpenRouter API key to power the chat and token flow features.

## Reference Implementation
Copy patterns from `bendscript.com/src/lib/play/storage.js` and `bendscript.com/src/components/play/ApiKeyModal.svelte`.

## Files to Create

### `src/lib/play/storage.js`
localStorage persistence with 30-day TTL. Functions:
- `saveApiKey(key)` / `loadApiKey()` / `clearApiKey()`
- `saveMcpConnections(conns)` / `loadMcpConnections()`
- `savePlayState(state)` / `loadPlayState()`

Key: `runefort_play_openrouter_key`

### `src/components/app/ApiKeyModal.svelte`
Svelte 5 runes. Props-based (`open`, `onclose`, `onsave`).
- Password input for OpenRouter API key
- "Get a key" link to `https://openrouter.ai/keys`
- Amber/dark theme matching existing RuneFort UI (see `AuthModal.svelte` for style reference)
- On save: call `saveApiKey()`, emit `onsave` with the key

### `src/lib/play/openrouter.js`
Client-side OpenRouter caller:
```js
export async function callOpenRouter(apiKey, messages, tools, model) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://runefort.com',
      'X-Title': 'RuneFort'
    },
    body: JSON.stringify({ model, messages, tools, max_tokens: 4096 })
  });
  return res.json();
}
```
Default model: `qwen/qwen3-235b-a22b` (free on OpenRouter).

### `src/lib/stores/apikey.svelte.js`
Svelte 5 rune store wrapping storage:
```js
let _key = $state(null);
export function getApiKey() { return _key; }
export function initApiKey() { _key = loadApiKey(); }
export function setApiKey(k) { _key = k; saveApiKey(k); }
export function removeApiKey() { _key = null; clearApiKey(); }
export function hasApiKey() { return !!_key; }
```

## Integration Point
Add a key icon button to the `/app` toolbar (next to save button). Opens `ApiKeyModal`. Show a green dot indicator when a key is set.

## Constraints
- No server-side key storage — localStorage only
- Svelte 5 runes (`$state`, `$props`, `$effect`) — no legacy stores
- Match RuneFort's dark amber aesthetic (bg-zinc-900, amber-400 accents)
- `export const ssr = false` already set on `/app` route
