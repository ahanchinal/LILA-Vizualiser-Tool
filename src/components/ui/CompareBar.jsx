import useStore from '../../store/useStore.js'

export default function CompareBar() {
  const selectedMatchId  = useStore((s) => s.selectedMatchId)
  const compareMatchId   = useStore((s) => s.compareMatchId)
  const matchData        = useStore((s) => s.matchData)
  const compareMatchData = useStore((s) => s.compareMatchData)
  const isLoadingCompare = useStore((s) => s.isLoadingCompare)
  const clearCompare     = useStore((s) => s.clearCompare)

  if (!selectedMatchId || !compareMatchId) return null

  const durA = matchData        ? (matchData.duration_ms        / 1000).toFixed(1) : '…'
  const durB = compareMatchData ? (compareMatchData.duration_ms / 1000).toFixed(1) : '…'

  return (
    <div style={styles.bar}>
      <Slot
        label="Primary"
        matchId={selectedMatchId}
        duration={durA}
        accentColor="#f5a623"
      />
      <div style={styles.sep}>vs</div>
      <Slot
        label="Compare"
        matchId={isLoadingCompare ? 'Loading…' : compareMatchId}
        duration={durB}
        accentColor="#00dcc8"
      />
      <div onClick={clearCompare} style={styles.clearBtn} title="Remove comparison">✕</div>
    </div>
  )
}

function Slot({ label, matchId, duration, accentColor }) {
  return (
    <div style={styles.slot}>
      <div style={{ ...styles.dot, background: accentColor }} />
      <div style={styles.slotInfo}>
        <span style={styles.slotLabel}>{label}</span>
        <span style={styles.slotId}>{matchId}</span>
      </div>
      <span style={{ ...styles.dur, color: accentColor }}>{duration}s</span>
    </div>
  )
}

const styles = {
  bar: {
    position:       'absolute',
    bottom:         14,
    left:           '50%',
    transform:      'translateX(-50%)',
    display:        'flex',
    alignItems:     'center',
    background:     '#1e1f23f0',
    border:         '1px solid #2a2b30',
    borderRadius:   3,
    backdropFilter: 'blur(8px)',
    zIndex:         10,
    pointerEvents:  'auto',
    overflow:       'hidden',
    whiteSpace:     'nowrap',
  },
  slot: {
    display:    'flex',
    alignItems: 'center',
    gap:        10,
    padding:    '8px 14px',
  },
  dot: {
    width:        8,
    height:       8,
    borderRadius: '50%',
    flexShrink:   0,
  },
  slotInfo: {
    display:       'flex',
    flexDirection: 'column',
    gap:           3,
  },
  slotLabel: {
    fontFamily:    "'Barlow Condensed', 'Barlow', sans-serif",
    fontSize:      9,
    fontWeight:    600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color:         '#5a5e6a',
  },
  slotId: {
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontSize:   10,
    color:      '#9a9ea8',
    letterSpacing: '0.02em',
  },
  dur: {
    fontFamily: "'Barlow Condensed', 'Barlow', sans-serif",
    fontSize:   16,
    fontWeight: 600,
    lineHeight: 1,
    marginLeft: 6,
    flexShrink: 0,
  },
  sep: {
    fontFamily:    "'Barlow Condensed', 'Barlow', sans-serif",
    fontSize:      10,
    fontWeight:    700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         '#4a4e5a',
    padding:       '0 12px',
    borderLeft:    '1px solid #2a2b30',
    borderRight:   '1px solid #2a2b30',
    alignSelf:     'stretch',
    display:       'flex',
    alignItems:    'center',
  },
  clearBtn: {
    padding:        '0 14px',
    alignSelf:      'stretch',
    display:        'flex',
    alignItems:     'center',
    fontSize:       13,
    color:          '#5a5e6a',
    cursor:         'pointer',
    borderLeft:     '1px solid #2a2b30',
    transition:     'color 0.1s',
    userSelect:     'none',
  },
}
