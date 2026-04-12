import useStore from '../../store/useStore.js'
import { MAP_NAMES, MAP_LABELS } from '../../constants/maps.js'

export default function MapSelector() {
  const selectedMap    = useStore((s) => s.selectedMap)
  const setSelectedMap = useStore((s) => s.setSelectedMap)

  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {MAP_NAMES.map((name) => {
        const active = selectedMap === name
        return (
          <button
            key={name}
            onClick={() => setSelectedMap(name)}
            style={{
              padding:       '6px 16px',
              borderRadius:  3,
              border:        'none',
              background:    active ? '#2a2b30' : 'transparent',
              color:         active ? '#f5a623' : '#5a5e6a',
              cursor:        'pointer',
              fontFamily:    "'Barlow Condensed', 'Barlow', sans-serif",
              fontSize:      11,
              fontWeight:    600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              transition:    'all 0.12s',
              whiteSpace:    'nowrap',
            }}
          >
            {MAP_LABELS[name]}
          </button>
        )
      })}
    </div>
  )
}
