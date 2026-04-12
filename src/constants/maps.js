// Map configuration — matches README exactly
export const MAP_CONFIG = {
  AmbroseValley: { scale: 900,  originX: -370, originZ: -473 },
  GrandRift:     { scale: 581,  originX: -290, originZ: -290 },
  Lockdown:      { scale: 1000, originX: -500, originZ: -500 },
}

export const MAP_NAMES = ['AmbroseValley', 'GrandRift', 'Lockdown']

export const MAP_LABELS = {
  AmbroseValley: 'Ambrose Valley',
  GrandRift:     'Grand Rift',
  Lockdown:      'Lockdown',
}

export const MINIMAP_PATHS = {
  AmbroseValley: '/minimaps/AmbroseValley_Minimap.png',
  GrandRift:     '/minimaps/GrandRift_Minimap.png',
  Lockdown:      '/minimaps/Lockdown_Minimap.jpg',
}

// Event codes used in match JSON files
export const EVENT_CODE = {
  P:  'Position',
  BP: 'BotPosition',
  K:  'Kill',
  D:  'Killed',
  BK: 'BotKill',
  BD: 'BotKilled',
  S:  'KilledByStorm',
  L:  'Loot',
}

// Which event codes are "position" (movement) vs "action" (combat/loot)
export const POSITION_CODES = new Set(['P', 'BP'])
export const ACTION_CODES    = new Set(['K', 'D', 'BK', 'BD', 'S', 'L'])
export const KILL_CODES      = new Set(['K', 'BK'])
export const DEATH_CODES     = new Set(['D', 'BD', 'S'])
export const STORM_CODES     = new Set(['S'])
export const LOOT_CODES      = new Set(['L'])

// Visual config for event types
// Colour rules: no two categories share the same hue family
//   Kills   → orange  (human: bright, bot: muted)
//   Deaths  → magenta (human: bright, bot: muted)
//   Storm   → blue    (sky/weather reads naturally)
//   Loot    → teal    (clearly distinct from all combat colours)
export const EVENT_DISPLAY = {
  K:  { label: 'Human Kill',     color: [255, 140,  0],  symbol: '✕' },
  D:  { label: 'Human Death',    color: [220,  50, 150], symbol: '✕' },
  BK: { label: 'Bot Kill',       color: [200, 100,  0],  symbol: '✕' },
  BD: { label: 'Bot Death',      color: [150,  40,  90], symbol: '✕' },
  S:  { label: 'Storm Death',    color: [80,  140, 255], symbol: '✕' },
  L:  { label: 'Loot',           color: [0,   220, 180], symbol: '◆' },
}

// 12-color palette for human players (matches pipeline)
export const HUMAN_COLORS = [
  [255, 200,  50],
  [80,  200, 255],
  [255, 100,  80],
  [100, 255, 150],
  [200,  80, 255],
  [255, 160,  30],
  [80,  255, 220],
  [255,  80, 180],
  [150, 200, 255],
  [255, 255, 100],
  [180, 255,  80],
  [255, 130, 130],
]

export const BOT_COLOR = [0, 210, 255]  // bright cyan — visible against yellow humans

// Heatmap color ramp (cool → hot): used in colorScale.js
export const HEATMAP_COLORS = {
  traffic: [[0, 0, 80], [0, 100, 200], [0, 220, 200], [255, 255, 0]],
  kills:   [[80, 0, 0], [200, 0, 0],   [255, 100, 0], [255, 255, 0]],
  deaths:  [[0, 0, 80], [80, 0, 150],  [200, 0, 200], [255, 100, 255]],
}
