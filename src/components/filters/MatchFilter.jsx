import { useMemo, useState } from 'react'
import useStore from '../../store/useStore.js'

const DATE_LABELS = {
  February_10: 'Feb 10',
  February_11: 'Feb 11',
  February_12: 'Feb 12',
  February_13: 'Feb 13',
  February_14: 'Feb 14',
}
const DAYS_ORDER = ['February_10','February_11','February_12','February_13','February_14']

function computeRange(matchList, map, key) {
  const vals = matchList.filter(m => m.map === map).map(m => key === 'duration_s' ? m.duration_ms / 1000 : m[key])
  if (!vals.length) return [0, 1]
  return [Math.floor(Math.min(...vals)), Math.ceil(Math.max(...vals))]
}

export default function MatchFilter() {
  const matchList          = useStore((s) => s.matchList)
  const selectedMap        = useStore((s) => s.selectedMap)
  const selectedDate       = useStore((s) => s.selectedDate)
  const selectedMatchId    = useStore((s) => s.selectedMatchId)
  const compareMatchId     = useStore((s) => s.compareMatchId)
  const isLoadingMatch     = useStore((s) => s.isLoadingMatch)
  const isLoadingCompare   = useStore((s) => s.isLoadingCompare)
  const setSelectedDate    = useStore((s) => s.setSelectedDate)
  const setSelectedMatchId = useStore((s) => s.setSelectedMatchId)
  const setCompareMatchId  = useStore((s) => s.setCompareMatchId)
  const clearCompare       = useStore((s) => s.clearCompare)

  // Filter drawer open state
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Individual filter state
  const [durRange,    setDurRange]    = useState(null)
  const [killRange,   setKillRange]   = useState(null)
  const [deathRange,  setDeathRange]  = useState(null)
  const [idQuery,     setIdQuery]     = useState('')
  const [playerType,  setPlayerType]  = useState('all') // 'all' | 'humans' | 'bots'

  // Open/closed state for each range dropdown within drawer
  const [openRange, setOpenRange] = useState(null)

  const fullDurRange   = useMemo(() => computeRange(matchList, selectedMap, 'duration_s'),  [matchList, selectedMap])
  const fullKillRange  = useMemo(() => computeRange(matchList, selectedMap, 'kill_count'),  [matchList, selectedMap])
  const fullDeathRange = useMemo(() => computeRange(matchList, selectedMap, 'death_count'), [matchList, selectedMap])

  const activeDurRange   = durRange   ?? fullDurRange
  const activeKillRange  = killRange  ?? fullKillRange
  const activeDeathRange = deathRange ?? fullDeathRange

  const durActive   = durRange   && (durRange[0]   !== fullDurRange[0]   || durRange[1]   !== fullDurRange[1])
  const killActive  = killRange  && (killRange[0]  !== fullKillRange[0]  || killRange[1]  !== fullKillRange[1])
  const deathActive = deathRange && (deathRange[0] !== fullDeathRange[0] || deathRange[1] !== fullDeathRange[1])
  const idActive    = idQuery.trim().length > 0
  const playerActive = playerType !== 'all'

  const activeFilterCount = [durActive, killActive, deathActive, idActive, playerActive].filter(Boolean).length

  const grouped = useMemo(() => {
    const byDay = {}
    const [durMin, durMax]     = activeDurRange
    const [killMin, killMax]   = activeKillRange
    const [deathMin, deathMax] = activeDeathRange
    const q = idQuery.trim().toLowerCase()

    for (const m of matchList) {
      if (m.map !== selectedMap) continue
      const dur = m.duration_ms / 1000
      if (dur           < durMin   || dur           > durMax)   continue
      if (m.kill_count  < killMin  || m.kill_count  > killMax)  continue
      if (m.death_count < deathMin || m.death_count > deathMax) continue
      if (q && !m.match_id.toLowerCase().includes(q)) continue
      if (playerType === 'humans' && m.human_count === 0) continue
      if (playerType === 'bots'   && m.bot_count   === 0) continue
      if (!byDay[m.date]) byDay[m.date] = []
      byDay[m.date].push(m)
    }
    return byDay
  }, [matchList, selectedMap, activeDurRange, activeKillRange, activeDeathRange, idQuery, playerType])

  const visibleDays  = selectedDate ? [selectedDate] : DAYS_ORDER.filter(d => grouped[d]?.length > 0)
  const totalVisible = visibleDays.reduce((n, d) => n + (grouped[d]?.length ?? 0), 0)

  function clearAllFilters() {
    setDurRange(null); setKillRange(null); setDeathRange(null)
    setIdQuery(''); setPlayerType('all')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0, overflow:'hidden' }}>

      {/* Panel header */}
      <div style={styles.panelHead}>
        <span style={styles.panelTitle}>Session Outliner</span>
        <span style={styles.panelCount}>{totalVisible}</span>
        {/* Filter toggle button */}
        <div
          onClick={() => setDrawerOpen(o => !o)}
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            5,
            height:         20,
            padding:        '0 7px',
            borderRadius:   3,
            cursor:         'pointer',
            userSelect:     'none',
            border:         `1px solid ${drawerOpen || activeFilterCount > 0 ? '#f5a623' : '#2a2b30'}`,
            background:     drawerOpen ? '#2a1e06' : activeFilterCount > 0 ? '#2a1e06' : 'transparent',
            transition:     'all 0.1s',
          }}
        >
          <span style={{
            fontFamily:    "'Barlow Condensed', sans-serif",
            fontSize:      10, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: drawerOpen || activeFilterCount > 0 ? '#f5a623' : '#5a5e6a',
          }}>
            Filters
          </span>
          {activeFilterCount > 0 && (
            <span style={{
              fontFamily:   "'JetBrains Mono', monospace",
              fontSize:     9,
              color:        '#f5a623',
              background:   '#3a2a08',
              borderRadius: 2,
              padding:      '0 3px',
              lineHeight:   '14px',
            }}>
              {activeFilterCount}
            </span>
          )}
        </div>
      </div>

      {/* Date filter — permanent tab strip */}
      <div style={styles.dateRow}>
        {[{ key: null, label: 'All' }, ...DAYS_ORDER.filter(d => grouped[d]?.length > 0 || selectedDate === d).map(d => ({ key: d, label: DATE_LABELS[d] ?? d }))].map(({ key, label }) => {
          const active = selectedDate === key
          return (
            <div
              key={label}
              onClick={() => setSelectedDate(active ? null : key)}
              style={{
                ...styles.dateBtn,
                background: active ? '#222326' : 'transparent',
                color:      active ? '#f5a623' : '#7a7e8a',
              }}
            >
              {label}
            </div>
          )
        })}
      </div>

      {/* Filter drawer */}
      {drawerOpen && (
        <div style={styles.drawer}>

          {/* Players */}
          <DrawerSection label="Players">
            <div style={{ display: 'flex', gap: 3 }}>
              {[['all', 'All'], ['humans', 'Humans only'], ['bots', 'Bots only']].map(([val, lbl]) => {
                const active = playerType === val
                return (
                  <div
                    key={val}
                    onClick={() => setPlayerType(val)}
                    style={{
                      flex:          1,
                      padding:       '3px 0',
                      textAlign:     'center',
                      borderRadius:  2,
                      cursor:        'pointer',
                      userSelect:    'none',
                      border:        `1px solid ${active ? '#f5a623' : '#2a2b30'}`,
                      background:    active ? '#2a1e06' : 'transparent',
                      fontFamily:    "'Barlow Condensed', sans-serif",
                      fontSize:      10, fontWeight: 600,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color:         active ? '#f5a623' : '#7a7e8a',
                      transition:    'all 0.1s',
                    }}
                  >
                    {lbl}
                  </div>
                )
              })}
            </div>
          </DrawerSection>

          {/* Session ID */}
          <DrawerSection label="Session ID">
            <div style={styles.idSearchWrap}>
              <span style={styles.idSearchIcon}>⌕</span>
              <input
                type="text"
                value={idQuery}
                onChange={(e) => setIdQuery(e.target.value)}
                placeholder="Paste or type partial ID…"
                style={styles.idSearchInput}
                spellCheck={false}
              />
              {idQuery && (
                <span onClick={() => setIdQuery('')} style={styles.idSearchClear}>✕</span>
              )}
            </div>
          </DrawerSection>

          {/* Range filters */}
          <DrawerSection label="Ranges">
            <div style={{ display: 'flex', gap: 4 }}>
              <RangeFilter
                label="Dur"
                unit="s"
                fullRange={fullDurRange}
                value={activeDurRange}
                active={!!durActive}
                open={openRange === 'dur'}
                onToggle={() => setOpenRange(openRange === 'dur' ? null : 'dur')}
                onChange={setDurRange}
                onReset={() => setDurRange(null)}
              />
              <RangeFilter
                label="Kills"
                unit=""
                fullRange={fullKillRange}
                value={activeKillRange}
                active={!!killActive}
                open={openRange === 'kills'}
                onToggle={() => setOpenRange(openRange === 'kills' ? null : 'kills')}
                onChange={setKillRange}
                onReset={() => setKillRange(null)}
              />
              <RangeFilter
                label="Deaths"
                unit=""
                fullRange={fullDeathRange}
                value={activeDeathRange}
                active={!!deathActive}
                open={openRange === 'deaths'}
                onToggle={() => setOpenRange(openRange === 'deaths' ? null : 'deaths')}
                onChange={setDeathRange}
                onReset={() => setDeathRange(null)}
              />
            </div>
          </DrawerSection>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <div
              onClick={clearAllFilters}
              style={{
                margin:        '2px 0 0',
                padding:       '5px 0',
                textAlign:     'center',
                borderTop:     '1px solid #222326',
                cursor:        'pointer',
                userSelect:    'none',
                fontFamily:    "'Barlow Condensed', sans-serif",
                fontSize:      10, fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color:         '#5a5e6a',
              }}
            >
              Clear all filters
            </div>
          )}
        </div>
      )}

      {/* Match list */}
      <div className="lila-scroll" style={styles.matchList}>
        {totalVisible === 0 && (
          <div style={{ color: '#4a4e5a', fontSize: 12, textAlign: 'center', padding: '24px 0' }}>
            No sessions for this map
          </div>
        )}

        {visibleDays.map((day) =>
          (grouped[day] ?? []).map((m) => {
            const sel    = m.match_id === selectedMatchId
            const cmp    = m.match_id === compareMatchId
            const durSec = (m.duration_ms / 1000).toFixed(1)
            const canCmp = !!selectedMatchId && !sel

            return (
              <div
                key={m.match_id}
                onClick={() => !isLoadingMatch && setSelectedMatchId(sel ? null : m.match_id)}
                style={{
                  ...styles.card,
                  background:   sel ? '#1e2128' : cmp ? '#0e1e1a' : 'transparent',
                  borderBottom: '1px solid #1e1f23',
                  opacity:      (isLoadingMatch && sel) || (isLoadingCompare && cmp) ? 0.6 : 1,
                  cursor:       isLoadingMatch ? 'wait' : 'pointer',
                }}
              >
                {sel && <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'#f5a623' }} />}
                {cmp && <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'#00dcc8' }} />}

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 4 }}>
                  <span style={{
                    fontFamily: "'Barlow Condensed', 'Barlow', sans-serif",
                    fontSize: 17, fontWeight: 600, lineHeight: 1,
                    color: sel ? '#dde0e8' : cmp ? '#80e8d8' : '#b0b4be',
                  }}>
                    {durSec}s
                  </span>
                  <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
                    {canCmp && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          cmp ? clearCompare() : setCompareMatchId(m.match_id)
                        }}
                        title={cmp ? 'Remove from comparison' : 'Compare with primary session'}
                        style={{
                          fontSize: 10, lineHeight: '14px',
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                          padding: '1px 6px', borderRadius: 2, cursor: 'pointer',
                          border: `1px solid ${cmp ? '#00dcc8' : '#3a3e4a'}`,
                          color:  cmp ? '#00dcc8' : '#5a5e6a',
                          background: cmp ? '#0a2a26' : 'transparent',
                          userSelect: 'none',
                        }}
                      >
                        {cmp ? '× CMP' : '+ CMP'}
                      </div>
                    )}
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#7a7e8a' }}>
                      {DATE_LABELS[m.date] ?? m.date}
                    </span>
                  </div>
                </div>

                <div style={styles.matchId}>{m.match_id}</div>

                <div style={styles.statGrid}>
                  <StatCell label="Humans" value={m.human_count}  color={sel ? '#c8d870' : cmp ? '#80e8d8' : '#5a5e6a'} />
                  <StatCell label="Bots"   value={m.bot_count}    color={sel ? '#5a9acc' : cmp ? '#40b0c0' : '#5a5e6a'} />
                  <StatCell label="Kills"  value={m.kill_count}   color={m.kill_count  > 0 ? '#ff8c50' : '#3a3e4a'} />
                  <StatCell label="Deaths" value={m.death_count}  color={m.death_count > 0 ? '#dc5090' : '#3a3e4a'} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function DrawerSection({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontFamily:    "'Barlow Condensed', sans-serif",
        fontSize:      9, fontWeight: 600,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color:         '#5a5e6a', marginBottom: 5,
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function RangeFilter({ label, unit, fullRange, value, active, open, onToggle, onChange, onReset }) {
  const [min, max] = fullRange
  const [lo, hi]   = value
  const rangeSpan  = max - min || 1

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <div
        onClick={onToggle}
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            4,
          height:         22,
          borderRadius:   3,
          cursor:         'pointer',
          userSelect:     'none',
          border:         `1px solid ${active ? '#f5a623' : open ? '#3a3e4a' : '#2a2b30'}`,
          background:     active ? '#2a1e06' : open ? '#1e1f23' : 'transparent',
          transition:     'all 0.1s',
        }}
      >
        <span style={{
          fontFamily:    "'Barlow Condensed', sans-serif",
          fontSize:      11, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color:         active ? '#f5a623' : open ? '#c8cdd6' : '#7a7e8a',
        }}>
          {label}
        </span>
        {active && (
          <span
            onClick={(e) => { e.stopPropagation(); onReset() }}
            style={{ fontSize: 9, color: '#f5a623', lineHeight: 1 }}
          >✕</span>
        )}
      </div>

      {open && (
        <div style={{
          position:     'absolute',
          top:          '100%',
          left:         0,
          right:        0,
          marginTop:    3,
          background:   '#1a1b1e',
          border:       '1px solid #2a2b30',
          borderRadius: 3,
          padding:      '10px 10px 8px',
          zIndex:       200,
          boxShadow:    '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          <div style={{ position: 'relative', height: 4, background: '#2a2b30', borderRadius: 2, marginBottom: 10 }}>
            <div style={{
              position:     'absolute',
              left:         `${((lo - min) / rangeSpan) * 100}%`,
              right:        `${((max - hi) / rangeSpan) * 100}%`,
              top: 0, bottom: 0,
              background:   '#f5a623',
              borderRadius: 2,
            }} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={styles.sliderLabel}>Min</span>
              <span style={styles.sliderValue}>{lo}{unit}</span>
            </div>
            <input type="range" min={min} max={max} step={unit === 's' ? 0.1 : 1} value={lo}
              onChange={(e) => {
                const v = unit === 's' ? parseFloat(e.target.value) : parseInt(e.target.value)
                onChange([Math.min(v, hi), hi])
              }} style={styles.slider} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={styles.sliderLabel}>Max</span>
              <span style={styles.sliderValue}>{hi}{unit}</span>
            </div>
            <input type="range" min={min} max={max} step={unit === 's' ? 0.1 : 1} value={hi}
              onChange={(e) => {
                const v = unit === 's' ? parseFloat(e.target.value) : parseInt(e.target.value)
                onChange([lo, Math.max(v, lo)])
              }} style={styles.slider} />
          </div>
        </div>
      )}
    </div>
  )
}

function StatCell({ label, value, color }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 2, paddingTop: 4 }}>
      <span style={{
        fontFamily: "'Barlow Condensed', 'Barlow', sans-serif",
        fontSize: 16, fontWeight: 600, lineHeight: 1, color,
      }}>
        {value}
      </span>
      <span style={{ fontSize: 8, color: '#6a6e7a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

const styles = {
  panelHead: {
    height:       30,
    minHeight:    30,
    flexShrink:   0,
    display:      'flex',
    alignItems:   'center',
    padding:      '0 8px 0 10px',
    background:   '#1e1f23',
    borderBottom: '1px solid #2a2b30',
    gap:          8,
  },
  panelTitle: {
    fontFamily:    "'Barlow Condensed', 'Barlow', sans-serif",
    fontSize:      12, fontWeight: 600,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color:         '#9a9ea8', flex: 1,
  },
  panelCount: {
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontSize:   10, color: '#f5a623',
  },
  dateRow: {
    display:      'flex',
    flexShrink:   0,
    borderBottom: '1px solid #222326',
    background:   '#16171a',
  },
  dateBtn: {
    flex:          1,
    padding:       '7px 0',
    textAlign:     'center',
    fontFamily:    "'Barlow Condensed', 'Barlow', sans-serif",
    fontSize:      11,
    fontWeight:    600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor:        'pointer',
    borderRight:   '1px solid #222326',
    transition:    'all 0.1s',
    userSelect:    'none',
  },
  drawer: {
    background:   '#16171a',
    borderBottom: '1px solid #2a2b30',
    padding:      '10px 10px 6px',
    flexShrink:   0,
  },
  matchList: {
    flex:          1,
    overflowY:     'auto',
    display:       'flex',
    flexDirection: 'column',
    minHeight:     0,
  },
  card: {
    position:   'relative',
    padding:    '10px 10px 8px 13px',
    boxSizing:  'border-box',
    flexShrink: 0,
    overflow:   'hidden',
    transition: 'background 0.1s',
  },
  matchId: {
    fontFamily:   "'Inter', 'Segoe UI', sans-serif",
    fontSize:     10, color: '#7a7e8a',
    whiteSpace:   'nowrap', overflow: 'hidden',
    textOverflow: 'ellipsis', marginBottom: 7,
  },
  idSearchWrap: {
    display:      'flex', alignItems: 'center', gap: 6,
    padding:      '0 8px', height: 26,
    background:   '#111316', border: '1px solid #2a2b30',
    borderRadius: 3,
  },
  idSearchIcon:  { fontSize: 14, color: '#4a4e5a', lineHeight: 1, flexShrink: 0 },
  idSearchInput: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    fontSize: 10, fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#c8cdd6',
  },
  idSearchClear: { fontSize: 11, color: '#4a4e5a', cursor: 'pointer', flexShrink: 0, lineHeight: 1, userSelect: 'none' },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' },
  sliderLabel: {
    fontFamily:    "'Barlow Condensed', sans-serif",
    fontSize:      9, fontWeight: 600,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5a5e6a',
  },
  sliderValue: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#f5a623' },
  slider: {
    width: '100%', height: 2, appearance: 'none', WebkitAppearance: 'none',
    background: '#2a2b30', borderRadius: 1, outline: 'none', cursor: 'pointer',
  },
}
