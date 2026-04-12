import { useEffect, useRef } from 'react'
import useStore from '../store/useStore.js'

/**
 * Drives the match timeline playback using requestAnimationFrame.
 * Uses refs for all values read inside the rAF loop so the callback
 * always sees fresh state without needing to re-subscribe on every render.
 */
export function usePlayback() {
  const rafRef      = useRef(null)
  const lastWallRef = useRef(null)

  const currentTimeRef   = useRef(0)
  const matchDurationRef = useRef(0)
  const playbackSpeedRef = useRef(0.5)

  const isPlaying      = useStore((s) => s.isPlaying)
  const setCurrentTime = useStore((s) => s.setCurrentTime)
  const setIsPlaying   = useStore((s) => s.setIsPlaying)

  // Keep refs in sync with store — single-arg subscribe works in Zustand v4
  useEffect(() => {
    return useStore.subscribe((state) => {
      currentTimeRef.current   = state.currentTime
      matchDurationRef.current = state.matchDuration
      playbackSpeedRef.current = state.playbackSpeed
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
        const delta = (wallTime - lastWallRef.current) * playbackSpeedRef.current
        const next  = currentTimeRef.current + delta
        if (next >= matchDurationRef.current) {
          currentTimeRef.current = matchDurationRef.current
          setCurrentTime(matchDurationRef.current)
          setIsPlaying(false)
          lastWallRef.current = null
          return
        }
        // Update the ref immediately so the next frame uses the correct value
        // even if the React state update hasn't flushed yet
        currentTimeRef.current = next
        setCurrentTime(next)
      }
      lastWallRef.current = wallTime
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastWallRef.current = null
    }
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps
}
