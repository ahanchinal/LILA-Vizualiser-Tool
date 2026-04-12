import useStore from '../../store/useStore.js'
import { CMP_HUMAN_COLOR, CMP_BOT_COLOR, CMP_KILL_COLOR, CMP_DEATH_COLOR, CMP_LOOT_COLOR, CMP_STORM_COLOR } from '../map/DeckLayers.jsx'

function rgba([r, g, b, a]) { return `rgba(${r},${g},${b},${((a ?? 255) / 255).toFixed(2)})` }

const PLAYER_LAYERS = [
  { key: 'showHumans', setter: 'setShowHumans', color: '#c8d870', label: 'Humans', circle: true  },
  { key: 'showBots',   setter: 'setShowBots',   color: '#5a9acc', label: 'Bots',   circle: true  },
  { key: 'showPaths',  setter: 'setShowPaths',  color: '#6a8aaa', label: 'Paths',  line: true },
]
const EVENT_LAYERS = [
  { key: 'showKillMarkers',  setter: 'setShowKillMarkers',  color: '#ff8c50', label: 'Kills'  },
  { key: 'showDeathMarkers', setter: 'setShowDeathMarkers', color: '#dc5090', label: 'Deaths' },
  { key: 'showLootMarkers',  setter: 'setShowLootMarkers',  color: '#00dcb4', label: 'Loot'   },
  { key: 'showStormMarkers', setter: 'setShowStormMarkers', color: '#508cff', label: 'Storm Deaths', ring: true },
]
const HEATMAPS = [
  { mode: 'traffic', label: 'Traffic' },
  { mode: 'kills',   label: 'Kills'   },
  { mode: 'deaths',  label: 'Deaths'  },
]

// Compare palette — derived from DeckLayers exports so they always stay in sync
const CMP_PLAYER_LAYERS = [
  { key: 'showHumans', setter: 'setShowHumans', color: rgba(CMP_HUMAN_COLOR), label: 'Humans', circle: true },
  { key: 'showBots',   setter: 'setShowBots',   color: rgba(CMP_BOT_COLOR),   label: 'Bots',   circle: true },
  { key: 'showPaths',  setter: 'setShowPaths',  color: rgba(CMP_HUMAN_COLOR), label: 'Paths',  line: true   },
]
const CMP_EVENT_LAYERS = [
  { key: 'showKillMarkers',  setter: 'setShowKillMarkers',  color: rgba(CMP_KILL_COLOR),  label: 'Kills'  },
  { key: 'showDeathMarkers', setter: 'setShowDeathMarkers', color: rgba(CMP_DEATH_COLOR), label: 'Deaths' },
  { key: 'showLootMarkers',  setter: 'setShowLootMarkers',  color: rgba(CMP_LOOT_COLOR),  label: 'Loot'   },
  { key: 'showStormMarkers', setter: 'setShowStormMarkers', color: rgba(CMP_STORM_COLOR), label: 'Storm Deaths', ring: true },
]

export default function LayerToggles() {
  const store          = useStore()
  const { heatmapMode, setHeatmapMode } = store
  const compareMatchId = useStore((s) => s.compareMatchId)

  return (
    <div data-tour="tour-layers">
      {/* ── Primary session ── */}
      <PanelSection label="Primary" accent="#f5a623">
        <SubLabel>Players</SubLabel>
        {PLAYER_LAYERS.map(({ key, setter, color, label, circle, line }) => (
          <ToggleRow key={key} checked={store[key]} onChange={(v) => store[setter](v)} color={color} label={label} circle={circle} line={line} />
        ))}
        <SubLabel style={{ marginTop: 6 }}>Events</SubLabel>
        {EVENT_LAYERS.map(({ key, setter, color, label, ring }) => (
          <ToggleRow key={key} checked={store[key]} onChange={(v) => store[setter](v)} color={color} label={label} circle ring={ring} />
        ))}
      </PanelSection>

      {/* ── Compare session (dynamic) ── */}
      {compareMatchId && (
        <PanelSection label="Compare" accent="#00dcc8">
          <SubLabel>Players</SubLabel>
          {CMP_PLAYER_LAYERS.map(({ key, setter, color, label, circle, line }) => (
            <ToggleRow key={key} checked={store[key]} onChange={(v) => store[setter](v)} color={color} label={label} circle={circle} line={line} />
          ))}
          <SubLabel style={{ marginTop: 6 }}>Events</SubLabel>
          {CMP_EVENT_LAYERS.map(({ key, setter, color, label, ring }) => (
            <ToggleRow key={key} checked={store[key]} onChange={(v) => store[setter](v)} color={color} label={label} circle ring={ring} />
          ))}
        </PanelSection>
      )}

      {/* ── Heatmap ── */}
      <PanelSection label="Heatmap" dataTour="tour-heatmap">
        <div style={{ display: 'flex', gap: 4 }}>
          {HEATMAPS.map(({ mode, label }) => {
            const active = heatmapMode === mode
            return (
              <div
                key={mode}
                onClick={() => setHeatmapMode(active ? null : mode)}
                style={{
                  flex:          1,
                  padding:       '5px 0',
                  textAlign:     'center',
                  borderRadius:  3,
                  cursor:        'pointer',
                  background:    active ? '#2a2010' : 'transparent',
                  border:        `1px solid ${active ? '#f5a623' : '#2a2b30'}`,
                  transition:    'all 0.1s',
                  userSelect:    'none',
                }}
              >
                <span style={{
                  fontFamily:    "'Barlow Condensed', 'Barlow', sans-serif",
                  fontSize:      12,
                  fontWeight:    600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color:         active ? '#f5a623' : '#7a7e8a',
                  display:       'block',
                  textAlign:     'center',
                }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </PanelSection>
    </div>
  )
}

function PanelSection({ label, accent, children, dataTour }) {
  return (
    <div style={{ padding: '10px', borderBottom: '1px solid #222326' }} data-tour={dataTour}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {accent && <div style={{ width: 3, height: 10, borderRadius: 1, background: accent, flexShrink: 0 }} />}
        <span style={{
          fontFamily: "'Barlow Condensed', 'Barlow', sans-serif",
          fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#9a9ea8',
        }}>{label}</span>
      </div>
      {children}
    </div>
  )
}

function SubLabel({ children, style }) {
  return (
    <div style={{
      fontFamily: "'Barlow Condensed', 'Barlow', sans-serif",
      fontSize: 9, fontWeight: 600, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: '#5a5e6a',
      marginBottom: 4, ...style,
    }}>
      {children}
    </div>
  )
}

function ToggleRow({ checked, onChange, color, label, circle, line, ring }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 4px', borderRadius: 3, cursor: 'pointer',
        transition: 'background 0.1s', userSelect: 'none',
      }}
    >
      {line ? (
        <div style={{
          width: 14, height: 2, borderRadius: 1,
          background: checked ? color : '#5a5e6a',
          flexShrink: 0, transition: 'all 0.1s',
        }} />
      ) : ring ? (
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background:  'transparent',
          border:      `2px solid ${checked ? color : '#5a5e6a'}`,
          flexShrink:  0, transition: 'all 0.1s',
        }} />
      ) : (
        <div style={{
          width: 10, height: 10,
          borderRadius: circle ? '50%' : 2,
          background:   checked ? color : 'transparent',
          border:       `1.5px solid ${checked ? color : '#5a5e6a'}`,
          flexShrink:   0, transition: 'all 0.1s',
        }} />
      )}
      <span style={{ fontSize: 12, color: checked ? '#c8cdd6' : '#8a8e9a', flex: 1 }}>
        {label}
      </span>
      <div style={{
        width: 28, height: 14, borderRadius: 7,
        background: checked ? '#3a2a08' : '#222326',
        border: `1px solid ${checked ? '#f5a623' : '#2a2b30'}`,
        position: 'relative', flexShrink: 0, transition: 'all 0.15s',
      }}>
        <div style={{
          position: 'absolute', top: 2,
          left: checked ? 'auto' : 2, right: checked ? 2 : 'auto',
          width: 8, height: 8, borderRadius: '50%',
          background: checked ? '#f5a623' : '#3a3e4a',
          transition: 'all 0.15s',
        }} />
      </div>
    </div>
  )
}
