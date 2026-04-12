import Sidebar from './Sidebar.jsx'
import RightPanel from './RightPanel.jsx'
import MapView from '../map/MapView.jsx'
import MapSelector from '../map/MapSelector.jsx'
import TimelineBar from '../timeline/TimelineBar.jsx'
import Tooltip from '../ui/Tooltip.jsx'
import useStore from '../../store/useStore.js'

export default function AppShell() {
  const isLoadingMatch = useStore((s) => s.isLoadingMatch)

  return (
    <div style={styles.shell}>
      {/* Header — UE5 "Engine" topbar */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoText}>LILA <span style={{ color: '#f5a623' }}>BLACK</span></span>
          <span style={styles.logoSub}>Player Journey Visualizer</span>
        </div>

        {/* Map selector — centered */}
        <div style={styles.mapSelectorCenter}>
          <MapSelector />
        </div>

        {isLoadingMatch && (
          <div style={styles.loadingBadge}>Loading match…</div>
        )}
      </header>

      {/* Body */}
      <div style={styles.body}>
        <Sidebar />
        <main style={styles.main}>
          <MapView />
        </main>
        <RightPanel />
      </div>

      {/* Timeline */}
      <TimelineBar />

      {/* Tooltip */}
      <Tooltip />
    </div>
  )
}

const styles = {
  shell: {
    width:         '100%',
    height:        '100%',
    display:       'flex',
    flexDirection: 'column',
    background:    '#1a1b1e',
    color:         '#c8cdd6',
    fontFamily:    "'Inter', 'Segoe UI', system-ui, sans-serif",
    overflow:      'hidden',
  },
  header: {
    height:       46,
    minHeight:    46,
    display:      'flex',
    alignItems:   'center',
    padding:      '0 12px',
    background:   '#1a1b1e',
    borderBottom: '1px solid #2a2b30',
    flexShrink:   0,
    position:     'relative',
    zIndex:       10,
  },
  logo: {
    display:      'flex',
    alignItems:   'baseline',
    gap:          10,
    paddingRight: 16,
    borderRight:  '1px solid #2a2b30',
  },
  logoText: {
    fontFamily:    "'Barlow Condensed', 'Barlow', sans-serif",
    fontSize:      16,
    fontWeight:    700,
    letterSpacing: '0.12em',
    color:         '#ffffff',
    textTransform: 'uppercase',
  },
  logoSub: {
    fontFamily:    "'Barlow Condensed', 'Barlow', sans-serif",
    fontSize:      10,
    color:         '#3a3e4a',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  mapSelectorCenter: {
    position:  'absolute',
    left:      '50%',
    transform: 'translateX(-50%)',
    display:   'flex',
    alignItems: 'center',
  },
  loadingBadge: {
    marginLeft:   'auto',
    fontSize:     11,
    fontFamily:   "'Barlow Condensed', sans-serif",
    letterSpacing: '0.06em',
    color:        '#f5a623',
    background:   '#2a1e0844',
    padding:      '3px 10px',
    borderRadius: 3,
    border:       '1px solid #3a2a0844',
  },
  body: {
    flex:     1,
    display:  'flex',
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
    zIndex:   1,
  },
  main: {
    flex:     1,
    position: 'relative',
    overflow: 'hidden',
    zIndex:   1,
  },
}
