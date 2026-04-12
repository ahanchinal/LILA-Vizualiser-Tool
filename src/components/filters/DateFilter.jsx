import useStore from '../../store/useStore.js'

const DATE_LABELS = {
  February_10: 'Feb 10',
  February_11: 'Feb 11',
  February_12: 'Feb 12',
  February_13: 'Feb 13',
  February_14: 'Feb 14 (partial)',
}

export default function DateFilter() {
  const selectedDate   = useStore((s) => s.selectedDate)
  const setSelectedDate = useStore((s) => s.setSelectedDate)

  const dates = Object.keys(DATE_LABELS)

  return (
    <div>
      <div style={styles.label}>DATE</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button
          onClick={() => setSelectedDate(null)}
          style={{
            ...styles.dateBtn,
            background: !selectedDate ? '#1e3a5f' : 'transparent',
            color:      !selectedDate ? '#4a9eff' : '#8a9bb0',
            border:     !selectedDate ? '1px solid #4a9eff' : '1px solid transparent',
          }}
        >
          All dates
        </button>
        {dates.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDate(selectedDate === d ? null : d)}
            style={{
              ...styles.dateBtn,
              background: selectedDate === d ? '#1e3a5f' : 'transparent',
              color:      selectedDate === d ? '#4a9eff' : '#8a9bb0',
              border:     selectedDate === d ? '1px solid #4a9eff' : '1px solid transparent',
            }}
          >
            {DATE_LABELS[d]}
          </button>
        ))}
      </div>
    </div>
  )
}

const styles = {
  label: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#4a5568',
    marginBottom: 6,
  },
  dateBtn: {
    display:   'block',
    width:     '100%',
    textAlign: 'left',
    padding:   '5px 8px',
    borderRadius: 4,
    cursor:    'pointer',
    fontSize:  12,
    transition: 'all 0.1s',
  },
}
