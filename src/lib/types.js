/**
 * RuneFort type definitions (JSDoc)
 *
 * @typedef {'idle' | 'active' | 'pulsing' | 'sealed' | 'alert'} TileState
 *
 * @typedef {Object} TileData
 * @property {string} id
 * @property {string} label
 * @property {TileState} state
 * @property {number} activity - 0.0-1.0
 * @property {string} [rune] - Elder Futhark glyph
 * @property {number} [elevation] - 0 = ground
 *
 * @typedef {'structure' | 'flow' | 'thermal' | 'temporal' | 'diagnostic' | 'rune' | 'confidence' | 'topology'} OverlayKey
 *
 * @typedef {Object} Overlay
 * @property {OverlayKey} key
 * @property {string} label
 * @property {string} shortcut - keyboard key
 * @property {boolean} active
 *
 * @typedef {Object} FortLayout
 * @property {string} loop_id
 * @property {number} zoom_level
 * @property {import('@xyflow/svelte').Node[]} nodes
 * @property {import('@xyflow/svelte').Edge[]} edges
 *
 * @typedef {Object} SavedFort
 * @property {string} id
 * @property {string} workspace_id
 * @property {string} loop_id
 * @property {string} name
 * @property {FortLayout} layout
 * @property {Record<string, boolean>} overlays
 * @property {number} zoom_level
 * @property {string} created_at
 * @property {string} updated_at
 */

export {};
