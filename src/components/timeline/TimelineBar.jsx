import { useEffect } from 'react'
import useStore from '../../store/useStore.js'
import EventMarkers from './EventMarkers.jsx'

const SPEEDS = [0.5, 1, 2, 4, 8, 16]

export default function TimelineBar() {
  const currentTime     = useStore((s) => s.currentTime)
  const matchDuration   = useStore((s) => s.matchDuration)
  const isPlaying       = useStore((s) => s.isPlaying)
  const playbackSpeed   = useStore((s) => s.playbackSpeed)
  const matchData       = useStore((s) => s.matchData)
  const setCurrentTime  = useStore((s) => s.setCurrentTime)
  const setIsPlaying    = useStore((s) => s.setIsPlaying)
  const setPlaybackSpeed = useStore((s) => s.setPlaybackSpeed)

  const hasMatch = !!matchData

  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space') return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      e.preventDefault()
      if (!hasMatch) return
      const { currentTime, matchDuration, isPlaying, setCurrentTime, setIsPlaying } = useStore.getState()
      if (!isPlaying && currentTime >= matchDuration) setCurrentTime(0)
      setIsPlaying(!isPlaying)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasMatch])

  const handleScrub = (e) => {
    setCurrentTime(Number(e.target.value))
    if (isPlaying) setIsPlaying(false)
  }

  const handlePlay = () => {
    if (!hasMatch) return
    if (currentTime >= matchDuration) setCurrentTime(0)
    setIsPlaying(!isPlaying)
  }

  const progress = matchDuration > 0 ? (currentTime / matchDuration) * 100 : 0

  return (
    <div style={styles.wrapper}>
      {/* Swimlane event markers */}
      <EventMarkers />

      {/* Playback controls */}
      <div style={styles.controls}>

        {/* Play / Pause — amber UE5 button */}
        <button
          onClick={handlePlay}
          disabled={!hasMatch}
          style={{
            ...styles.playBtn,
            opacity:     hasMatch ? 1 : 0.3,
            color:       isPlaying ? '#f5a623' : '#f5a623',
            borderColor: '#3a2a08',
            background:  isPlaying ? '#2a1e08' : '#1e1a08',
          }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Speed buttons */}
        <div style={styles.speedGroup}>
          {SPEEDS.map((s) => {
            const active = playbackSpeed === s
            return (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                disabled={!hasMatch}
                style={{
                  ...styles.speedBtn,
                  background:  active ? '#222326' : 'transparent',
                  color:       active ? '#f5a623' : '#7a7e8a',
                  opacity:     hasMatch ? 1 : 0.3,
                }}
              >
                {s}×
              </button>
            )
          })}
        </div>

        {/* Scrubber — with amber energy track */}
        <div style={styles.scrubberWrapper}>
          {/* Progress fill */}
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          <input
            type="range"
            min={0}
            max={matchDuration || 1000}
            step={1}
            value={currentTime}
            onChange={handleScrub}
            disabled={!hasMatch}
            style={{
              ...styles.scrubber,
              accentColor: '#f5a623',
            }}
          />
        </div>

        {/* Time readout */}
        <div style={styles.timeDisplay}>
          {hasMatch ? (
            <>
              <span style={{ color: '#c8cdd6' }}>{(currentTime / 1000).toFixed(1)}s</span>
              <span style={{ color: '#7a7e8a' }}> / {(matchDuration / 1000).toFixed(1)}s</span>
            </>
          ) : (
            <span style={{ color: '#7a7e8a' }}>Select a session</span>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    background:    '#131418',
    borderTop:     '1px solid #2a2b30',
    display:       'flex',
    flexDirection: 'column',
    flexShrink:    0,
    position:      'relative',
    zIndex:        10,
  },
  controls: {
    height:     46,
    flexShrink: 0,
    display:    'flex',
    alignItems: 'center',
    gap:        10,
    padding:    '0 14px',
  },
  playBtn: {
    width:          30,
    height:         30,
    borderRadius:   3,
    border:         '1px solid',
    cursor:         'pointer',
    fontSize:       13,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    transition:     'all 0.1s',
  },
  speedGroup: {
    display:    'flex',
    gap:        1,
    flexShrink: 0,
  },
  speedBtn: {
    padding:       '4px 9px',
    borderRadius:  2,
    border:        'none',
    cursor:        'pointer',
    fontFamily:    "'Barlow Condensed', 'Barlow', sans-serif",
    fontSize:      11,
    letterSpacing: '0.04em',
    transition:    'all 0.1s',
  },
  scrubberWrapper: {
    flex:       1,
    position:   'relative',
    height:     20,
    display:    'flex',
    alignItems: 'center',
  },
  progressFill: {
    position:     'absolute',
    left:         0,
    top:          '50%',
    transform:    'translateY(-50%)',
    height:       3,
    background:   'linear-gradient(90deg, #3a2808, #f5a623)',
    borderRadius: 2,
    pointerEvents: 'none',
    zIndex:       0,
    transition:   'width 0.05s linear',
  },
  scrubber: {
    width:    '100%',
    position: 'relative',
    zIndex:   1,
    cursor:   'pointer',
    background: 'transparent',
  },
  timeDisplay: {
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontSize:   12,
    minWidth:   110,
    flexShrink: 0,
    textAlign:  'right',
  },
}
