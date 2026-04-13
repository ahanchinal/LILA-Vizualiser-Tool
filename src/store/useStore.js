import { create } from 'zustand'

const useStore = create((set) => ({
  // ── Filters ──────────────────────────────────────────────────────────────
  selectedMap:     'AmbroseValley',
  selectedDate:    null,   // null = all dates
  selectedMatchId: null,

  // ── Layer toggles ─────────────────────────────────────────────────────────
  showHumans:       true,
  showBots:         true,
  showPaths:        true,
  showKillMarkers:  true,
  showDeathMarkers: true,
  showLootMarkers:  true,
  showStormMarkers: true,
  heatmapMode:      null,  // null | 'traffic' | 'kills' | 'deaths'
  mapGreyscale:     false, // desaturate minimap when heatmap is active

  // ── Playback ──────────────────────────────────────────────────────────────
  currentTime:   0,
  isPlaying:     false,
  playbackSpeed: 1,  // 0.5 | 1 | 2 | 4 | 8 | 16
  matchDuration: 0,

  // ── Data ──────────────────────────────────────────────────────────────────
  matchList:          [],    // array of match summary objects from index.json
  heatmapData:        null,  // { AmbroseValley: { traffic, kills, deaths }, ... }
  matchData:          null,  // currently loaded match { players: [...] }
  isLoadingMatch:     false,
  compareMatchId:     null,  // second match being compared
  compareMatchData:   null,  // loaded data for comparison match
  isLoadingCompare:   false,

  // ── Tooltip ───────────────────────────────────────────────────────────────
  tooltip:   null,      // { x, y, content } screen-space
  cursorPos: { x: 0, y: 0 }, // page-level mouse coords, updated by MapView

  // ── Actions ───────────────────────────────────────────────────────────────
  setSelectedMap: (map) => set({
    selectedMap: map,
    selectedMatchId: null,
    matchData: null,
    compareMatchId: null,
    compareMatchData: null,
    currentTime: 0,
    isPlaying: false,
    matchDuration: 0,
  }),

  setSelectedDate: (date) => set({
    selectedDate: date,
  }),

  setSelectedMatchId: (id) => set({
    selectedMatchId: id,
    currentTime: 0,
    isPlaying: false,
    matchDuration: 0,
    matchData: null,
  }),

  setMatchList:      (list) => set({ matchList: list }),
  setHeatmapData:    (data) => set({ heatmapData: data }),

  setMatchData: (data) => set({
    matchData: data,
    matchDuration: data?.duration_ms ?? 0,
    currentTime: 0,
    isPlaying: false,
  }),

  setIsLoadingMatch: (v) => set({ isLoadingMatch: v }),

  setCompareMatchId:   (id) => set({ compareMatchId: id, compareMatchData: null }),
  setCompareMatchData: (data) => set({ compareMatchData: data }),
  setIsLoadingCompare: (v) => set({ isLoadingCompare: v }),
  clearCompare: () => set({ compareMatchId: null, compareMatchData: null }),

  setCurrentTime:   (t)    => set({ currentTime: t }),
  setIsPlaying:     (v)    => set({ isPlaying: v }),
  setPlaybackSpeed: (s)    => set({ playbackSpeed: s }),
  setMatchDuration: (d)    => set({ matchDuration: d }),

  setShowHumans:       (v) => set({ showHumans: v }),
  setShowBots:         (v) => set({ showBots: v }),
  setShowPaths:        (v) => set({ showPaths: v }),
  setShowKillMarkers:  (v) => set({ showKillMarkers: v }),
  setShowDeathMarkers: (v) => set({ showDeathMarkers: v }),
  setShowLootMarkers:  (v) => set({ showLootMarkers: v }),
  setShowStormMarkers: (v) => set({ showStormMarkers: v }),
  setHeatmapMode:      (m) => set((s) => ({ heatmapMode: m, mapGreyscale: m ? s.mapGreyscale : false })),
  setMapGreyscale:     (v) => set({ mapGreyscale: v }),

  setTooltip:   (tooltip) => set({ tooltip }),
  setCursorPos: (pos)     => set({ cursorPos: pos }),
}))

export default useStore
