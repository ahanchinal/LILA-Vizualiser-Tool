import { useMemo } from 'react'
import useStore from '../../store/useStore.js'
import { STORM_CODES, LOOT_CODES } from '../../constants/maps.js'

const DATE_LABELS = {
  February_10: 'Feb 10', February_11: 'Feb 11', February_12: 'Feb 12',
  February_13: 'Feb 13', February_14: 'Feb 14',
}

export default function MatchSummaryCard() {
  const matchData = useStore((s) => s.matchData)

  const stats = useMemo(() => {
    if (!matchData) return null
    let humanKills = 0, botKills = 0
    let humanDeaths = 0, botDeaths = 0
    let stormDeaths = 0, lootCount = 0

    for (const player of matchData.players) {
      for (const ev of player.events) {
        if (ev.e === 'K')               humanKills++
        else if (ev.e === 'BK')         botKills++
        else if (STORM_CODES.has(ev.e)) stormDeaths++
        else if (ev.e === 'D')          humanDeaths++
        else if (ev.e === 'BD')         botDeaths++
        else if (LOOT_CODES.has(ev.e))  lootCount++
      }
    }
    return { humanKills, botKills, humanDeaths, botDeaths, stormDeaths, lootCount }
  }, [matchData])

  if (!matchData || !stats) return null

  const durSec = (matchData.duration_ms / 1000).toFixed(1)

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>Session Details</span>
        <span style={styles.headerDate}>{DATE_LABELS[matchData.date] ?? matchData.date}</span>
      </div>

      {/* Match ID */}
      <div style={styles.matchId}>{matchData.match_id}</div>

      <div style={styles.divider} />

      {/* Core stats */}
      <Row label="Map"      value={matchData.map}  valueColor="#c8cdd6" />
      <Row label="Duration" value={`${durSec}s`}   valueColor="#f5a623" />

      <div style={styles.divider} />

      <Row label="Humans"  value={matchData.human_count} valueColor="#c8d870" />
      <Row label="Bots"    value={matchData.bot_count}   valueColor="#5a9acc" />

      <div style={styles.divider} />

      <Row label="Human kills"   value={stats.humanKills}  valueColor={stats.humanKills  > 0 ? '#ff8c50' : '#6a6e7a'} />
      <Row label="Bot kills"    value={stats.botKills}    valueColor={stats.botKills    > 0 ? '#cc6030' : '#6a6e7a'} />
      <Row label="Human deaths"  value={stats.humanDeaths} valueColor={stats.humanDeaths > 0 ? '#dc5090' : '#6a6e7a'} />
      <Row label="Bot deaths"   value={stats.botDeaths}   valueColor={stats.botDeaths   > 0 ? '#9a3060' : '#6a6e7a'} />
      <Row label="Storm deaths" value={stats.stormDeaths} valueColor={stats.stormDeaths > 0 ? '#508cff' : '#6a6e7a'} />
      <Row label="Loot"         value={stats.lootCount}   valueColor={stats.lootCount   > 0 ? '#00dcb4' : '#6a6e7a'} />
    </div>
  )
}

function Row({ label, value, valueColor }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={{ ...styles.rowValue, color: valueColor }}>{value}</span>
    </div>
  )
}

const styles = {
  card: {
    position:       'absolute',
    top:            14,
    left:           14,
    width:          240,
    background:     '#1e1f23f0',
    border:         '1px solid #2a2b30',
    borderTop:      '2px solid #f5a623',
    borderRadius:   3,
    padding:        '10px 12px',
    display:        'flex',
    flexDirection:  'column',
    gap:            4,
    zIndex:         10,
    backdropFilter: 'blur(8px)',
    pointerEvents:  'none',
  },
  header: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   1,
  },
  headerTitle: {
    fontFamily:    "'Barlow Condensed', 'Barlow', sans-serif",
    fontSize:      10,
    fontWeight:    600,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color:         '#9a9ea8',
  },
  headerDate: {
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontSize:   10,
    color:      '#7a7e8a',
  },
  matchId: {
    fontFamily:   "'Inter', 'Segoe UI', sans-serif",
    fontSize:     10,
    color:        '#7a7e8a',
    wordBreak:    'break-all',
    lineHeight:   1.5,
  },
  divider: {
    height:     1,
    background: '#2a2b30',
    margin:     '3px 0',
  },
  row: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'baseline',
  },
  rowLabel: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    fontSize:   11,
    color:      '#8a8e98',
  },
  rowValue: {
    fontFamily: "'Barlow Condensed', 'Barlow', sans-serif",
    fontSize:   15,
    fontWeight: 600,
    lineHeight: 1,
  },
}
