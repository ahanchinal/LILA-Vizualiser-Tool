import LayerToggles from '../filters/LayerToggles.jsx'
import Legend from '../ui/Legend.jsx'

export default function RightPanel() {
  return (
    <aside style={styles.panel}>
      {/* UE5 "Details" panel header */}
      <div style={styles.panelHead}>
        <span style={styles.panelTitle}>Details</span>
      </div>
      <div className="lila-scroll" style={styles.scrollable}>
        <LayerToggles />
        <div style={styles.legendWrap}>
          <Legend />
        </div>
      </div>
    </aside>
  )
}

const styles = {
  panel: {
    width:         210,
    minWidth:      210,
    height:        '100%',
    background:    '#16171a',
    borderLeft:    '1px solid #2a2b30',
    display:       'flex',
    flexDirection: 'column',
    overflow:      'hidden',
    position:      'relative',
    zIndex:        5,
  },
  panelHead: {
    height:        30,
    minHeight:     30,
    flexShrink:    0,
    display:       'flex',
    alignItems:    'center',
    padding:       '0 10px',
    background:    '#1e1f23',
    borderBottom:  '1px solid #2a2b30',
  },
  panelTitle: {
    fontFamily:    "'Barlow Condensed', 'Barlow', sans-serif",
    fontSize:      12,
    fontWeight:    600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color:         '#9a9ea8',
  },
  scrollable: {
    flex:          1,
    overflowY:     'auto',
    display:       'flex',
    flexDirection: 'column',
  },
  legendWrap: {
    padding:      '10px 12px',
    borderTop:    '1px solid #222326',
  },
}
