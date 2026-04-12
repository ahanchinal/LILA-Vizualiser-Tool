import { useMemo } from 'react'
import useStore from '../../store/useStore.js'
import { KILL_CODES, DEATH_CODES, LOOT_CODES, STORM_CODES } from '../../constants/maps.js'

function getCategory(code) {
  if (KILL_CODES.has(code))  return 'kill'
  if (STORM_CODES.has(code)) return 'storm'
  if (DEATH_CODES.has(code)) return 'death'
  if (LOOT_CODES.has(code))  return 'loot'
  return null
}

const PRIMARY_LANES = [
  { key: 'kill',  label: 'Kills',  color: '#ff8c50' },
  { key: 'death', label: 'Deaths', color: '#dc5090' },
  { key: 'loot',  label: 'Loot',   color: '#00dcb4' },
]

const COMPARE_LANES = [
  { key: 'kill',  label: 'Kills',  color: 'rgba(255,220,60,0.9)'  },
  { key: 'death', label: 'Deaths', color: 'rgba(180,100,255,0.9)' },
  { key: 'loot',  label: 'Loot',   color: 'rgba(60,255,160,0.9)'  },
]

function extractPips(matchData, matchDuration) {
  const result = { kill: [], death: [], loot: [] }
  if (!matchData || matchDuration <= 0) return result
  for (const player of matchData.players) {
    for (const ev of player.events) {
      const cat = getCategory(ev.e)
      if (!cat) continue
      const lane = cat === 'storm' ? 'death' : cat
      result[lane].push({
        pct:   (ev.t / matchDuration) * 100,
        t:     ev.t,
        key:   `${player.user_id}-${ev.t}-${ev.e}`,
        storm: cat === 'storm',
      })
    }
  }
  return result
}

function TrackGroup({ lanes, pips, currentTime, matchDuration, accentColor, groupLabel, setTooltip }) {
  return (
    <div style={{ borderTop: `1px solid ${accentColor}22` }}>
      {/* Group header bar */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        5,
        height:     14,
        paddingLeft: 8,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
        <span style={{
          fontFamily:    "'Barlow Condensed', sans-serif",
          fontSize:      8, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color:         accentColor,
        }}>
          {groupLabel}
        </span>
      </div>

      {lanes.map((lane) => (
        <div key={lane.key} style={styles.lane}>
          <div style={styles.laneLabel}>{lane.label}</div>
          <div style={styles.laneTrack}>
            <div style={{
              ...styles.playhead,
              left: `${matchDuration > 0 ? (currentTime / matchDuration) * 100 : 0}%`,
              background: `${accentColor}44`,
            }} />
            {pips[lane.key].map((pip) => (
              <div
                key={pip.key}
                style={{
                  ...styles.pip,
                  left:       `${pip.pct}%`,
                  background: pip.storm
                    ? (accentColor === '#f5a623' ? '#508cff' : 'rgba(160,220,255,0.9)')
                    : lane.color,
                  opacity:    pip.t <= currentTime ? 1 : 0.2,
                }}
                onMouseEnter={(e) => setTooltip({
                  x: e.clientX, y: e.clientY,
                  content: `${groupLabel} · ${pip.storm ? 'Storm death' : lane.label}\n${(pip.t / 1000).toFixed(2)}s`,
                })}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function EventMarkers() {
  const matchData        = useStore((s) => s.matchData)
  const compareMatchData = useStore((s) => s.compareMatchData)
  const matchDuration    = useStore((s) => s.matchDuration)
  const currentTime      = useStore((s) => s.currentTime)
  const setTooltip       = useStore((s) => s.setTooltip)

  const primaryPips = useMemo(
    () => extractPips(matchData, matchDuration),
    [matchData, matchDuration]
  )

  const comparePips = useMemo(
    () => extractPips(compareMatchData, matchDuration),
    [compareMatchData, matchDuration]
  )

  if (!matchData) return <div style={styles.empty} />

  return (
    <div style={styles.wrapper}>
      <TrackGroup
        lanes={PRIMARY_LANES}
        pips={primaryPips}
        currentTime={currentTime}
        matchDuration={matchDuration}
        accentColor="#f5a623"
        groupLabel="Primary"
        setTooltip={setTooltip}
      />
      {compareMatchData && (
        <TrackGroup
          lanes={COMPARE_LANES}
          pips={comparePips}
          currentTime={currentTime}
          matchDuration={matchDuration}
          accentColor="#00dcc8"
          groupLabel="Compare"
          setTooltip={setTooltip}
        />
      )}
    </div>
  )
}

const styles = {
  wrapper: {
    background:   '#131418',
    borderBottom: '1px solid #2a2b30',
    flexShrink:   0,
  },
  lane: {
    display:    'flex',
    alignItems: 'center',
    height:     14,
  },
  laneLabel: {
    width:         42,
    flexShrink:    0,
    fontFamily:    "'Barlow Condensed', 'Barlow', sans-serif",
    fontSize:      8,
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         '#5a5e6a',
    textAlign:     'right',
    paddingRight:  7,
  },
  laneTrack: {
    flex:       1,
    height:     '100%',
    position:   'relative',
    borderLeft: '1px solid #222326',
  },
  playhead: {
    position:      'absolute',
    top:           0,
    width:         1,
    height:        '100%',
    transform:     'translateX(-50%)',
    pointerEvents: 'none',
    zIndex:        1,
  },
  pip: {
    position:     'absolute',
    top:          '50%',
    transform:    'translate(-50%, -50%)',
    width:        5,
    height:       5,
    borderRadius: '50%',
    transition:   'opacity 0.1s',
    zIndex:       2,
  },
  empty: {
    height:      45,
    background:  '#131418',
    borderBottom: '1px solid #2a2b30',
  },
}
