import { useRef, useCallback, useEffect, useState } from 'react'
import DeckGL from '@deck.gl/react'
import { OrthographicView } from '@deck.gl/core'
import { BitmapLayer } from '@deck.gl/layers'
import useStore from '../../store/useStore.js'
import { MINIMAP_PATHS } from '../../constants/maps.js'
import { useLayerBuilder } from './DeckLayers.jsx'
import MatchSummaryCard from '../ui/MatchSummaryCard.jsx'
import CompareBar from '../ui/CompareBar.jsx'

const INITIAL_VIEW_STATE = {
  target:  [512, 512, 0],
  zoom:    -0.45,
  minZoom: -2,
  maxZoom:  4,
}

const VIEW = new OrthographicView({ id: 'ortho', controller: true })

function useMinimapTexture(src, greyscale) {
  const [texture, setTexture] = useState(null)
  const cacheRef = useRef({})

  useEffect(() => {
    let cancelled = false

    const applyGrey = (img) => {
      if (!greyscale) return img
      const c = document.createElement('canvas')
      c.width = img.naturalWidth || img.width
      c.height = img.naturalHeight || img.height
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const id = ctx.getImageData(0, 0, c.width, c.height)
      const d = id.data
      for (let i = 0; i < d.length; i += 4) {
        const v = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114
        d[i] = d[i + 1] = d[i + 2] = v
      }
      ctx.putImageData(id, 0, 0)
      return c
    }

    if (cacheRef.current[src]) {
      if (!cancelled) setTexture(applyGrey(cacheRef.current[src]))
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      cacheRef.current[src] = img
      if (!cancelled) setTexture(applyGrey(img))
    }
    img.src = src
    return () => { cancelled = true }
  }, [src, greyscale])

  return texture
}

export default function MapView() {
  const selectedMap     = useStore((s) => s.selectedMap)
  const setTooltip      = useStore((s) => s.setTooltip)
  const setCursorPos    = useStore((s) => s.setCursorPos)
  const heatmapMode     = useStore((s) => s.heatmapMode)
  const mapGreyscale    = useStore((s) => s.mapGreyscale)
  const setMapGreyscale = useStore((s) => s.setMapGreyscale)

  const deckRef        = useRef(null)
  const viewStateRef   = useRef(INITIAL_VIEW_STATE)
  const minimapRef     = useRef(null)  // latest minimap BitmapLayer

  const buildLayersAt  = useLayerBuilder()
  const buildRef       = useRef(buildLayersAt)
  buildRef.current     = buildLayersAt  // always current, no stale closure

  // ── Push a full layer list to Deck.gl imperatively ────────────────────────
  const pushLayers = useCallback((t) => {
    const deck = deckRef.current?.deck
    if (!deck) return
    const data = buildRef.current(t)
    deck.setProps({ layers: [minimapRef.current, ...data].filter(Boolean) })
  }, [])

  // ── Scrub sync (edge case) ────────────────────────────────────────────────
  // When isPlaying is false and currentTime changes (user scrubbing), the rAF
  // loop is stopped so we must push layers manually. See DeckLayers.jsx note.
  useEffect(() => {
    return useStore.subscribe((state) => {
      if (!state.isPlaying) {
        pushLayers(state.currentTime)
      }
    })
  }, [pushLayers])

  // ── Playback rAF loop — owned here, writes to store for scrubber UI ───────
  const rafRef         = useRef(null)
  const lastWallRef    = useRef(null)
  const currentTimeRef = useRef(0)
  const durationRef    = useRef(0)
  const speedRef       = useRef(0.5)

  const isPlaying      = useStore((s) => s.isPlaying)
  const setCurrentTime = useStore((s) => s.setCurrentTime)
  const setIsPlaying   = useStore((s) => s.setIsPlaying)

  // Keep playback refs in sync — only overwrites currentTimeRef when NOT playing
  // (during playback the rAF loop is the sole owner of currentTimeRef)
  useEffect(() => {
    return useStore.subscribe((state) => {
      if (!state.isPlaying) currentTimeRef.current = state.currentTime
      durationRef.current = state.matchDuration
      speedRef.current    = state.playbackSpeed
    })
  }, [])

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastWallRef.current = null
      return
    }

    const tick = (wallTime) => {
      if (lastWallRef.current !== null) {
        if (durationRef.current <= 0) {
          lastWallRef.current = wallTime
          rafRef.current = requestAnimationFrame(tick)
          return
        }

        const delta = (wallTime - lastWallRef.current) * speedRef.current
        const next  = currentTimeRef.current + delta

        if (next >= durationRef.current) {
          currentTimeRef.current = durationRef.current
          setCurrentTime(durationRef.current)
          setIsPlaying(false)
          pushLayers(durationRef.current)
          lastWallRef.current = null
          return
        }

        currentTimeRef.current = next
        setCurrentTime(next)   // keeps scrubber + EventMarkers in sync
        pushLayers(next)       // updates map layers without triggering React render
      }

      lastWallRef.current = wallTime
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastWallRef.current = null
    }
  }, [isPlaying, pushLayers, setCurrentTime, setIsPlaying])

  // ── Minimap texture ───────────────────────────────────────────────────────
  const minimapSrc     = MINIMAP_PATHS[selectedMap]
  const minimapTexture = useMinimapTexture(minimapSrc, mapGreyscale)

  const minimapLayer = minimapTexture ? new BitmapLayer({
    id:     `minimap-${selectedMap}-${mapGreyscale ? 'grey' : 'color'}`,
    bounds: [0, 1024, 1024, 0],
    image:  minimapTexture,
    opacity: 1,
    coordinateSystem: 1,
  }) : null

  minimapRef.current = minimapLayer

  // ── Zoom helpers ──────────────────────────────────────────────────────────
  const adjustZoom = useCallback((delta) => {
    const deck = deckRef.current?.deck
    if (!deck) return
    const vs   = viewStateRef.current
    const next = { ...vs, zoom: Math.max(INITIAL_VIEW_STATE.minZoom, Math.min(INITIAL_VIEW_STATE.maxZoom, vs.zoom + delta)) }
    viewStateRef.current = next
    deck.setProps({ initialViewState: next })
  }, [])

  const handleWheel = useCallback((e) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    adjustZoom(e.deltaY < 0 ? 0.3 : -0.3)
  }, [adjustZoom])

  // Initial layer render when buildLayersAt changes (match load / toggle)
  // This is the only React-driven layer update path
  const currentTime = useStore((s) => s.currentTime)
  const initialLayers = [minimapLayer, ...buildLayersAt(currentTime)].filter(Boolean)

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#141518' }}
      onWheel={handleWheel}
      onMouseMove={(e) => setCursorPos({ x: e.clientX, y: e.clientY })}
    >
      <DeckGL
        ref={deckRef}
        views={VIEW}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={initialLayers}
        style={{ width: '100%', height: '100%' }}
        onViewStateChange={({ viewState }) => { viewStateRef.current = viewState }}
        onHover={({ object }) => { if (!object) setTooltip(null) }}
        getCursor={({ isDragging }) => isDragging ? 'grabbing' : 'crosshair'}
      />

      <div style={styles.zoomControls}>
        <button style={styles.zoomBtn} onClick={() => adjustZoom(0.5)} title="Zoom in">+</button>
        <button style={styles.zoomBtn} onClick={() => adjustZoom(-0.5)} title="Zoom out">−</button>
      </div>

      {heatmapMode && (
        <button
          onClick={() => setMapGreyscale(!mapGreyscale)}
          title={mapGreyscale ? 'Restore map colour' : 'Greyscale map for heatmap contrast'}
          style={{
            ...styles.greyBtn,
            background:  mapGreyscale ? '#2a1e0888' : '#1a1b1eee',
            borderColor: mapGreyscale ? '#f5a623'   : '#2a2b30',
            color:       mapGreyscale ? '#f5a623'   : '#6a6e7a',
          }}
        >
          ◑ {mapGreyscale ? 'Colour' : 'Greyscale'}
        </button>
      )}

      <MatchSummaryCard />
      <CompareBar />
    </div>
  )
}

const styles = {
  zoomControls: {
    position: 'absolute', bottom: 16, right: 16,
    display: 'flex', flexDirection: 'column', gap: 2, zIndex: 10,
  },
  zoomBtn: {
    width: 28, height: 28, borderRadius: 3,
    border: '1px solid #2a2b30', background: '#1a1b1eee',
    color: '#6a6e7a', fontSize: 16, lineHeight: 1, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  greyBtn: {
    position: 'absolute', top: 14, right: 14,
    padding: '5px 10px', borderRadius: 3, border: '1px solid',
    cursor: 'pointer', fontSize: 11, fontWeight: 600,
    fontFamily: "'Barlow Condensed', 'Barlow', sans-serif",
    letterSpacing: '0.06em', textTransform: 'uppercase',
    backdropFilter: 'blur(4px)',
    zIndex: 10, transition: 'all 0.15s',
  },
}
