import useStore from '../../store/useStore.js'

const RAMPS = {
  traffic: { stops: ['#000050', '#0064c8', '#00dcc8', '#ffff00'], label: 'Player traffic', low: 'Low', high: 'High' },
  kills:   { stops: ['#500000', '#c80000', '#ff6400', '#ffff00'], label: 'Kill locations',  low: 'Few', high: 'Hotspot' },
  deaths:  { stops: ['#000050', '#500096', '#c800c8', '#ff64ff'], label: 'Death locations', low: 'Few', high: 'Hotspot' },
}

export default function Legend() {
  const heatmapMode = useStore((s) => s.heatmapMode)

  if (!heatmapMode) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <SectionLabel>{RAMPS[heatmapMode].label}</SectionLabel>
        <div style={{
          height: 8, borderRadius: 4,
          background: `linear-gradient(to right, ${RAMPS[heatmapMode].stops.join(', ')})`,
          border: '1px solid #2a2b30', marginBottom: 4,
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, color: '#9a9ea8' }}>{RAMPS[heatmapMode].low}</span>
          <span style={{ fontSize: 9, color: '#9a9ea8' }}>{RAMPS[heatmapMode].high}</span>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
      <span style={{
        fontFamily: "'Barlow Condensed', 'Barlow', sans-serif",
        fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: '#7a7e8a',
      }}>{children}</span>
    </div>
  )
}
