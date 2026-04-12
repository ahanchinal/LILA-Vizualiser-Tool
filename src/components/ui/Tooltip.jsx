import useStore from '../../store/useStore.js'

export default function Tooltip() {
  const tooltip = useStore((s) => s.tooltip)
  if (!tooltip) return null

  return (
    <div style={{
      position:     'fixed',
      left:         tooltip.x + 12,
      top:          tooltip.y - 8,
      background:   '#1a1d26ee',
      border:       '1px solid #2e3347',
      borderRadius: 6,
      padding:      '6px 10px',
      fontSize:     11,
      color:        '#c8d6e5',
      pointerEvents: 'none',
      zIndex:       9999,
      whiteSpace:   'pre-line',
      maxWidth:     200,
      lineHeight:   1.5,
      backdropFilter: 'blur(4px)',
    }}>
      {tooltip.content}
    </div>
  )
}
