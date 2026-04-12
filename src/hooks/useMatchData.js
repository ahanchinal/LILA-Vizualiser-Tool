import { useEffect } from 'react'
import useStore from '../store/useStore.js'

/**
 * Fetches index.json + heatmaps.json on mount.
 * Fetches the selected match JSON whenever selectedMatchId changes.
 */
export function useMatchData() {
  const {
    selectedMatchId,
    compareMatchId,
    setMatchList,
    setHeatmapData,
    setMatchData,
    setIsLoadingMatch,
    setCompareMatchData,
    setIsLoadingCompare,
  } = useStore()

  // Load index + heatmaps once on mount
  useEffect(() => {
    Promise.all([
      fetch('/data/index.json').then((r) => r.json()),
      fetch('/data/heatmaps.json').then((r) => r.json()),
    ]).then(([index, heatmaps]) => {
      setMatchList(index.matches)
      setHeatmapData(heatmaps)
    }).catch((err) => {
      console.error('Failed to load index or heatmaps:', err)
    })
  }, [])

  // Load match data when selection changes
  useEffect(() => {
    if (!selectedMatchId) {
      setMatchData(null)
      return
    }
    setIsLoadingMatch(true)
    fetch(`/data/match/${selectedMatchId}.json`)
      .then((r) => r.json())
      .then((data) => { setMatchData(data); setIsLoadingMatch(false) })
      .catch((err) => { console.error('Failed to load match:', selectedMatchId, err); setIsLoadingMatch(false) })
  }, [selectedMatchId])

  // Load comparison match when compareMatchId changes
  useEffect(() => {
    if (!compareMatchId) {
      setCompareMatchData(null)
      return
    }
    setIsLoadingCompare(true)
    fetch(`/data/match/${compareMatchId}.json`)
      .then((r) => r.json())
      .then((data) => { setCompareMatchData(data); setIsLoadingCompare(false) })
      .catch((err) => { console.error('Failed to load compare match:', compareMatchId, err); setIsLoadingCompare(false) })
  }, [compareMatchId])
}
