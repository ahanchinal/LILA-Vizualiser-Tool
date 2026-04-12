import { useMemo, useCallback } from 'react'
import { ScatterplotLayer, BitmapLayer } from '@deck.gl/layers'
import { TripsLayer } from '@deck.gl/geo-layers'
import useStore from '../../store/useStore.js'
import { rasterizeHeatmap } from '../../utils/colorScale.js'
import {
  POSITION_CODES, KILL_CODES, DEATH_CODES, STORM_CODES, LOOT_CODES, BOT_COLOR, EVENT_DISPLAY,
} from '../../constants/maps.js'

// Large trail length so the entire path history is always visible as a persistent trail.
// TripsLayer fades waypoints older than (currentTime - trailLength); setting this to
// a large value means nothing fades — the full path from match start stays rendered.
const TRAIL_LENGTH = 999999

// ─────────────────────────────────────────────────────────────────────────────
// NOTE (performance): DeckLayers deliberately does NOT subscribe to
// `currentTime` from Zustand. Subscribing would cause a full re-render +
// useMemo recalculation on every rAF frame (60fps), which caused visible
// stutter. Instead, `buildLayers(t)` is a stable function returned by
// `useLayerBuilder()` that MapView calls imperatively via deck.setProps on
// every rAF tick. DeckLayers only re-renders when matchData or a layer toggle
// changes (infrequent).
//
// EDGE CASE — scrubbing while paused: when the user drags the scrubber,
// `isPlaying` is false so the rAF loop is stopped. MapView subscribes to
// the Zustand store and calls buildLayers + deck.setProps whenever
// `currentTime` changes AND `isPlaying` is false, keeping the map in sync
// with the scrubber position. See MapView.jsx `useEffect` labelled "scrub sync".
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pure function — builds the full layer array for a given time value.
 * Called imperatively from MapView's rAF loop and scrub handler.
 * No React, no hooks, no allocations beyond what deck.gl needs.
 */
// Compare match palette — teal family, distinct from all primary colors
export const CMP_HUMAN_COLOR  = [0, 220, 200, 200]   // teal (humans)
export const CMP_BOT_COLOR    = [160, 100, 255, 140]  // lavender (bots)
export const CMP_KILL_COLOR   = [255, 220, 60,  220] // yellow (kills)
export const CMP_DEATH_COLOR  = [180, 100, 255, 220] // violet (deaths)
export const CMP_LOOT_COLOR   = [60,  255, 160, 200] // mint (loot)
export const CMP_STORM_COLOR  = [160, 220, 255, 220] // ice blue (storm)

function buildCompareTrips(compareMatchData, showHumans, showBots, showPaths,
                           showKillMarkers, showDeathMarkers, showLootMarkers, showStormMarkers,
                           setTooltip, getCursorPos, t) {
  const layers = []
  if (!compareMatchData) return layers

  const botTrips   = []
  const humanTrips = []
  const dots       = []
  const kills      = []
  const deaths     = []
  const loots      = []
  const storms     = []

  for (const player of compareMatchData.players) {
    const isHuman = player.player_type === 'human'

    if (showPaths) {
      if ((isHuman && showHumans) || (!isHuman && showBots)) {
        const allPathEvents = player.events.filter((e) => POSITION_CODES.has(e.e))
        if (allPathEvents.length >= 2) {
          const trip = {
            path:       allPathEvents.map((e) => [e.px, e.py]),
            timestamps: allPathEvents.map((e) => e.t),
            color:      isHuman ? CMP_HUMAN_COLOR : CMP_BOT_COLOR,
            width:      isHuman ? 2 : 1.5,
          }
          if (isHuman) humanTrips.push(trip)
          else         botTrips.push(trip)
        }
        const pastPos = allPathEvents.filter((e) => e.t <= t)
        const last    = pastPos[pastPos.length - 1]
        if (last) dots.push({ position: [last.px, last.py], isHuman })
      }
    }

    for (const ev of player.events) {
      if (ev.t > t) continue
      const base = { position: [ev.px, ev.py], t: ev.t }
      if (KILL_CODES.has(ev.e))       kills.push(base)
      else if (STORM_CODES.has(ev.e)) storms.push(base)
      else if (DEATH_CODES.has(ev.e)) deaths.push(base)
      else if (LOOT_CODES.has(ev.e))  loots.push(base)
    }
  }

  if (showPaths) {
    if (botTrips.length > 0) layers.push(new TripsLayer({
      id: 'cmp-bot-trips', data: botTrips,
      getPath: (d) => d.path, getTimestamps: (d) => d.timestamps,
      getColor: (d) => d.color, getWidth: (d) => d.width,
      currentTime: t, trailLength: TRAIL_LENGTH,
      widthMinPixels: 1, widthUnits: 'pixels', coordinateSystem: 1,
    }))
    if (humanTrips.length > 0) layers.push(new TripsLayer({
      id: 'cmp-human-trips', data: humanTrips,
      getPath: (d) => d.path, getTimestamps: (d) => d.timestamps,
      getColor: (d) => d.color, getWidth: (d) => d.width,
      currentTime: t, trailLength: TRAIL_LENGTH,
      widthMinPixels: 2, widthUnits: 'pixels', coordinateSystem: 1,
    }))
    if (dots.length > 0) layers.push(new ScatterplotLayer({
      id: 'cmp-dots', data: dots,
      getPosition: (d) => d.position,
      getFillColor: (d) => d.isHuman ? CMP_HUMAN_COLOR : CMP_BOT_COLOR,
      getLineColor: [255, 255, 255, 130], getRadius: (d) => d.isHuman ? 8 : 5,
      radiusUnits: 'pixels', stroked: true, lineWidthMinPixels: 1,
      coordinateSystem: 1,
    }))
  }

  if (showKillMarkers && kills.length > 0) layers.push(new ScatterplotLayer({
    id: 'cmp-kills', data: kills,
    getPosition: (d) => d.position,
    getFillColor: CMP_KILL_COLOR, getLineColor: [255,255,255,100], getRadius: 7,
    radiusUnits: 'pixels', stroked: true, lineWidthMinPixels: 1.5, coordinateSystem: 1,
    pickable: true,
    onHover: ({ object }) => {
      if (object) setTooltip({ ...getCursorPos(), content: `Compare · Kill\n${(object.t/1000).toFixed(1)}s` })
      else setTooltip(null)
    },
  }))
  if (showDeathMarkers && deaths.length > 0) layers.push(new ScatterplotLayer({
    id: 'cmp-deaths', data: deaths,
    getPosition: (d) => d.position,
    getFillColor: CMP_DEATH_COLOR, getLineColor: [255,255,255,100], getRadius: 7,
    radiusUnits: 'pixels', stroked: true, lineWidthMinPixels: 1.5, coordinateSystem: 1,
    pickable: true,
    onHover: ({ object }) => {
      if (object) setTooltip({ ...getCursorPos(), content: `Compare · Death\n${(object.t/1000).toFixed(1)}s` })
      else setTooltip(null)
    },
  }))
  if (showLootMarkers && loots.length > 0) layers.push(new ScatterplotLayer({
    id: 'cmp-loot', data: loots,
    getPosition: (d) => d.position,
    getFillColor: CMP_LOOT_COLOR, getLineColor: [255,255,255,100], getRadius: 5,
    radiusUnits: 'pixels', stroked: true, lineWidthMinPixels: 1, coordinateSystem: 1,
  }))
  if (showStormMarkers && storms.length > 0) layers.push(new ScatterplotLayer({
    id: 'cmp-storm', data: storms,
    getPosition: (d) => d.position,
    getFillColor: [0,0,0,0], getLineColor: CMP_STORM_COLOR, getRadius: 10,
    radiusUnits: 'pixels', stroked: true, lineWidthMinPixels: 2, coordinateSystem: 1,
  }))

  return layers
}

function buildLayers(t, {
  matchData, compareMatchData, heatmapLayer, heatmapTooltipLayer,
  showHumans, showBots, showPaths,
  showKillMarkers, showDeathMarkers, showLootMarkers, showStormMarkers,
  setTooltip, getCursorPos,
}) {
  const layers = []

  if (heatmapLayer) layers.push(heatmapLayer)
  if (heatmapTooltipLayer) layers.push(heatmapTooltipLayer)

  // Comparison match rendered underneath primary
  layers.push(...buildCompareTrips(
    compareMatchData, showHumans, showBots, showPaths,
    showKillMarkers, showDeathMarkers, showLootMarkers, showStormMarkers,
    setTooltip, getCursorPos, t
  ))

  if (!matchData) return layers

  const botTrips      = []
  const humanTrips    = []
  const currentPositions = []
  const killPoints   = []
  const deathPoints  = []
  const lootPoints   = []
  const stormPoints  = []

  for (const player of matchData.players) {
    const isHuman     = player.player_type === 'human'
    const playerColor = isHuman ? player.color : BOT_COLOR

    // Full position events — TripsLayer manages its own time window internally.
    // Do NOT pre-filter to t here; TripsLayer needs future waypoints to interpolate.
    const allPathEvents = player.events.filter((e) => POSITION_CODES.has(e.e))

    if (allPathEvents.length >= 2) {
      const trip = {
        path:       allPathEvents.map((e) => [e.px, e.py]),
        timestamps: allPathEvents.map((e) => e.t),
        color:      [...playerColor, isHuman ? 220 : 140],
        width:      isHuman ? 2 : 1.5,
        playerId:   player.user_id,
      }
      if (isHuman) humanTrips.push(trip)
      else         botTrips.push(trip)
    }

    // Current dot position: last position event at or before t
    const pastPathEvents = allPathEvents.filter((e) => e.t <= t)
    const lastPos = pastPathEvents[pastPathEvents.length - 1]
    if (lastPos) {
      currentPositions.push({
        position: [lastPos.px, lastPos.py],
        color:    playerColor,
        isHuman,
        radius:   isHuman ? 8 : 5,
        playerId: player.user_id,
      })
    }

    // Event markers: only show events that have already happened
    for (const ev of player.events) {
      if (ev.t > t) continue
      const base = { position: [ev.px, ev.py], t: ev.t, playerId: player.user_id, playerType: player.player_type, eventCode: ev.e }
      if (KILL_CODES.has(ev.e))       killPoints.push(base)
      else if (STORM_CODES.has(ev.e)) stormPoints.push(base)
      else if (DEATH_CODES.has(ev.e)) deathPoints.push(base)
      else if (LOOT_CODES.has(ev.e))  lootPoints.push(base)
    }
  }

  if (showBots && showPaths && botTrips.length > 0) {
    layers.push(new TripsLayer({
      id:             'bot-trips',
      data:           botTrips,
      getPath:        (d) => d.path,
      getTimestamps:  (d) => d.timestamps,
      getColor:       (d) => d.color,
      getWidth:       (d) => d.width,
      currentTime:    t,
      trailLength:    TRAIL_LENGTH,
      widthMinPixels: 1,
      widthUnits:     'pixels',
      coordinateSystem: 1,
    }))
  }

  if (showHumans && showPaths && humanTrips.length > 0) {
    layers.push(new TripsLayer({
      id:             'human-trips',
      data:           humanTrips,
      getPath:        (d) => d.path,
      getTimestamps:  (d) => d.timestamps,
      getColor:       (d) => d.color,
      getWidth:       (d) => d.width,
      currentTime:    t,
      trailLength:    TRAIL_LENGTH,
      widthMinPixels: 2,
      widthUnits:     'pixels',
      coordinateSystem: 1,
    }))
  }

  const visibleDots = currentPositions.filter(
    (d) => (d.isHuman && showHumans) || (!d.isHuman && showBots)
  )
  if (visibleDots.length > 0) {
    layers.push(new ScatterplotLayer({
      id: 'current-positions', data: visibleDots,
      getPosition: (d) => d.position, getFillColor: (d) => d.color,
      getLineColor: [255, 255, 255, 200], getRadius: (d) => d.radius,
      radiusUnits: 'pixels', stroked: true, lineWidthMinPixels: 1,
      coordinateSystem: 1, pickable: true,
      onHover: ({ object }) => {
        if (object) setTooltip({ ...getCursorPos(), content: `${object.isHuman ? '👤 Human' : '🤖 Bot'}\n${object.playerId.slice(0, 16)}...` })
        else setTooltip(null)
      },
    }))
  }

  if (showLootMarkers && lootPoints.length > 0) {
    const c = EVENT_DISPLAY.L.color
    layers.push(new ScatterplotLayer({
      id: 'loot-markers', data: lootPoints,
      getPosition: (d) => d.position,
      getFillColor: [...c, 200], getLineColor: [...c, 255], getRadius: 5,
      radiusUnits: 'pixels', stroked: true, lineWidthMinPixels: 1,
      coordinateSystem: 1, pickable: true,
      onHover: ({ object }) => {
        if (object) setTooltip({ ...getCursorPos(), content: `Loot\n${object.playerType} · ${(object.t/1000).toFixed(1)}s` })
        else setTooltip(null)
      },
    }))
  }

  if (showKillMarkers && killPoints.length > 0) {
    layers.push(new ScatterplotLayer({
      id: 'kill-markers', data: killPoints,
      getPosition: (d) => d.position,
      getFillColor: (d) => [...EVENT_DISPLAY[d.eventCode].color, 220],
      getLineColor: [255, 255, 255, 160], getRadius: 7,
      radiusUnits: 'pixels', stroked: true, lineWidthMinPixels: 1.5,
      coordinateSystem: 1, pickable: true,
      onHover: ({ object }) => {
        if (object) setTooltip({ ...getCursorPos(), content: `${EVENT_DISPLAY[object.eventCode].label}\n${object.playerType} · ${(object.t/1000).toFixed(1)}s` })
        else setTooltip(null)
      },
    }))
  }

  if (showDeathMarkers && deathPoints.length > 0) {
    layers.push(new ScatterplotLayer({
      id: 'death-markers', data: deathPoints,
      getPosition: (d) => d.position,
      getFillColor: (d) => [...EVENT_DISPLAY[d.eventCode].color, 220],
      getLineColor: [255, 255, 255, 160], getRadius: 7,
      radiusUnits: 'pixels', stroked: true, lineWidthMinPixels: 1.5,
      coordinateSystem: 1, pickable: true,
      onHover: ({ object }) => {
        if (object) setTooltip({ ...getCursorPos(), content: `${EVENT_DISPLAY[object.eventCode].label}\n${object.playerType} · ${(object.t/1000).toFixed(1)}s` })
        else setTooltip(null)
      },
    }))
  }

  if (showStormMarkers && stormPoints.length > 0) {
    layers.push(new ScatterplotLayer({
      id: 'storm-markers', data: stormPoints,
      getPosition: (d) => d.position,
      getFillColor: [80, 140, 255, 0], getLineColor: [80, 200, 255, 255],
      getRadius: 10, radiusUnits: 'pixels', stroked: true,
      lineWidthMinPixels: 2, coordinateSystem: 1,
    }))
  }

  return layers
}

/**
 * Hook: returns a stable `buildLayersAt(t)` function.
 * Re-created only when matchData, heatmap, or toggle state changes —
 * NOT on every currentTime change.
 */
export function useLayerBuilder() {
  const matchData      = useStore((s) => s.matchData)
  const heatmapData    = useStore((s) => s.heatmapData)
  const selectedMap    = useStore((s) => s.selectedMap)
  const heatmapMode    = useStore((s) => s.heatmapMode)
  const showHumans     = useStore((s) => s.showHumans)
  const showBots       = useStore((s) => s.showBots)
  const showPaths      = useStore((s) => s.showPaths)
  const showKillMarkers  = useStore((s) => s.showKillMarkers)
  const showDeathMarkers = useStore((s) => s.showDeathMarkers)
  const showLootMarkers  = useStore((s) => s.showLootMarkers)
  const showStormMarkers = useStore((s) => s.showStormMarkers)
  const setTooltip   = useStore((s) => s.setTooltip)
  // Stable function — reads cursorPos imperatively at call time, no subscription needed
  const getCursorPos = useMemo(() => () => useStore.getState().cursorPos, [])

  const heatmapLayer = useMemo(() => {
    if (!heatmapMode || !heatmapData?.[selectedMap]) return null
    const grid = heatmapData[selectedMap][heatmapMode]
    if (!grid) return null
    const canvas = rasterizeHeatmap(grid, heatmapMode)
    return new BitmapLayer({
      id: 'heatmap', bounds: [0, 1024, 1024, 0],
      image: canvas, opacity: 0.65, coordinateSystem: 1,
    })
  }, [heatmapMode, heatmapData, selectedMap])

  const heatmapTooltipLayer = useMemo(() => {
    if (!heatmapMode || !heatmapData?.[selectedMap]) return null
    const grid = heatmapData[selectedMap][heatmapMode]
    if (!grid) return null
    const COLS = 32, CELL = 1024 / COLS
    const maxVal = Math.max(...grid, 1)
    const modeLabel = { traffic: 'Player traffic', kills: 'Kill density', deaths: 'Death density' }[heatmapMode]
    const points = grid
      .map((v, i) => {
        if (v === 0) return null
        const col = i % COLS
        const row = Math.floor(i / COLS)
        return { position: [col * CELL + CELL / 2, row * CELL + CELL / 2], value: v, pct: Math.round((v / maxVal) * 100) }
      })
      .filter(Boolean)
    return new ScatterplotLayer({
      id: 'heatmap-tooltip', data: points,
      getPosition: (d) => d.position,
      getFillColor: [0, 0, 0, 0], getLineColor: [0, 0, 0, 0],
      getRadius: CELL / 2, radiusUnits: 'common',
      coordinateSystem: 1, pickable: true,
      onHover: ({ object }) => {
        if (object) setTooltip({ ...getCursorPos(), content: `${modeLabel}\nIntensity: ${object.pct}% (${object.value} events)` })
        else setTooltip(null)
      },
    })
  }, [heatmapMode, heatmapData, selectedMap, setTooltip])

  // Stable context object — only changes when match/toggles change
  const compareMatchData = useStore((s) => s.compareMatchData)

  const ctx = useMemo(() => ({
    matchData, compareMatchData, heatmapLayer, heatmapTooltipLayer,
    showHumans, showBots, showPaths,
    showKillMarkers, showDeathMarkers, showLootMarkers, showStormMarkers,
    setTooltip, getCursorPos,
  }), [matchData, compareMatchData, heatmapLayer, heatmapTooltipLayer, showHumans, showBots, showPaths,
      showKillMarkers, showDeathMarkers, showLootMarkers, showStormMarkers, setTooltip, getCursorPos])

  // buildLayersAt is a stable callback that closes over ctx
  const buildLayersAt = useCallback(
    (t) => buildLayers(t, ctx),
    [ctx]
  )

  return buildLayersAt
}
