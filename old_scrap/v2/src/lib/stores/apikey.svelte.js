// Svelte 5 rune store for OpenRouter API key.

import { loadApiKey, saveApiKey, clearApiKey } from "$lib/play/storage.js";

let _key = $state(null);

export function getApiKey() {
  return _key;
}

export function initApiKey() {
  _key = loadApiKey() || null;
}

export function setApiKey(k) {
  _key = k;
  saveApiKey(k);
}

export function removeApiKey() {
  _key = null;
  clearApiKey();
}

export function hasApiKey() {
  return !!_key;
}
