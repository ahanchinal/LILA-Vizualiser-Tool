import { useState, useCallback } from 'react'
import MatchFilter from '../filters/MatchFilter.jsx'

const MIN_WIDTH = 240
const MAX_WIDTH = 480
const DEFAULT_WIDTH = 260

export default function Sidebar() {
  const [width, setWidth] = useState(DEFAULT_WIDTH)

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = width
    const onMove = (mv) => {
      const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startW + mv.clientX - startX))
      setWidth(next)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [width])

  return (
    <aside style={{ ...styles.sidebar, width, minWidth: width, maxWidth: width }}>
      <MatchFilter />
      <div onMouseDown={onMouseDown} title="Drag to resize" style={styles.resizeHandle} />
    </aside>
  )
}

const styles = {
  sidebar: {
    height:        '100%',
    background:    '#16171a',
    borderRight:   '1px solid #2a2b30',
    display:       'flex',
    flexDirection: 'column',
    overflow:      'hidden',
    position:      'relative',
    zIndex:        5,
    flexShrink:    0,
    flexGrow:      0,
  },
  resizeHandle: {
    position:   'absolute',
    top:        0,
    right:      0,
    width:      5,
    height:     '100%',
    cursor:     'col-resize',
    zIndex:     10,
    background: 'transparent',
  },
}
