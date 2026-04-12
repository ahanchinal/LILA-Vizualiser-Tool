import { useState, useEffect, useCallback, useRef } from 'react'

const STEPS = [
  {
    target:    'tour-map-selector',
    title:     'Map Selector',
    body:      'Choose which map to explore — <strong>AmbroseValley</strong>, <strong>GrandRift</strong>, or <strong>Lockdown</strong>. Switching maps reloads the session list and scopes all data to that map.',
    placement: 'below-center',
  },
  {
    target:    'tour-session-outliner',
    title:     'Session Outliner',
    body:      'Every recorded match appears here. Each card shows <strong>duration</strong>, session ID, and a stat grid: humans, bots, kills, deaths.<br><br>Click a card to load it onto the map. The <strong style="color:#f5a623">amber bar</strong> on the left marks the active session.',
    placement: 'right',
  },
  {
    target:    'tour-date-filter',
    title:     'Date Filter',
    body:      'Narrow sessions to a specific recording day — <strong>Feb 10–14</strong>. The count badge updates live. Hit <strong>All</strong> to see every session across the full 5-day window.',
    placement: 'right',
  },
  {
    target:    'tour-filters',
    title:     'Advanced Filters',
    body:      'Click <strong>Filters</strong> to open a drawer with range sliders for <strong>duration</strong>, <strong>kills</strong>, and <strong>deaths</strong>, a <strong>player type</strong> toggle (all / humans only / bots only), and a <strong>session ID</strong> search.',
    placement: 'right',
  },
  {
    target:    'tour-map-canvas',
    title:     'Map Canvas',
    body:      '<strong style="color:#c8d870">Green</strong> = human paths · <strong style="color:#5a9acc">Blue</strong> = bot paths · <strong style="color:#ff8c50">Orange</strong> = kills · <strong style="color:#dc5090">Pink</strong> = deaths · <strong style="color:#00dcb4">Teal</strong> = loot · <strong style="color:#508cff">Rings</strong> = storm deaths.<br><br>Scroll to zoom, drag to pan. The <strong>Session Details</strong> card top-left shows a full stat breakdown.',
    placement: 'left',
  },
  {
    target:    'tour-timeline',
    title:     'Timeline & Playback',
    body:      'Press <strong>▶ Play</strong> or hit <strong>Space</strong> to animate the match. Drag the scrubber to jump to any moment. Choose speeds from <strong>0.5× to 16×</strong>.<br><br>The <strong>swimlanes</strong> above show when kills, deaths, and loot occurred — bright pips have happened, faded pips are still to come.',
    placement: 'above-center',
  },
  {
    target:    'tour-heatmap',
    title:     'Heatmap Overlays',
    body:      'Aggregate data across <strong>all sessions</strong> for the map into a colour overlay. Three modes:<br><br><strong>Traffic</strong> — where players spend time<br><strong>Kills</strong> — combat hotspots<br><strong>Deaths</strong> — where players die<br><br>Hover any cell to see the exact intensity reading.',
    placement: 'left',
  },
  {
    target:    'tour-layers',
    title:     'Layer Controls & Compare',
    body:      'Toggle humans, bots, paths, and each event type on or off to reduce noise.<br><br>To compare two sessions: select a primary, then click <strong>+ CMP</strong> on any other card. The compare match renders in a <strong style="color:#00dcc8">teal palette</strong> with its own swimlane track below.',
    placement: 'left',
  },
]

const PAD = 8 // spotlight padding around target

function getRect(id) {
  const el = document.querySelector(`[data-tour="${id}"]`)
  return el ? el.getBoundingClientRect() : null
}

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)) }

export default function Tour() {
  const [phase, setPhase]     = useState('start') // 'start' | 'tour' | 'end' | 'done'
  const [step, setStep]       = useState(0)
  const [rect, setRect]       = useState(null)
  const [cardPos, setCardPos] = useState({ left: 0, top: 0 })
  const cardRef               = useRef(null)

  const computePositions = useCallback((stepIndex) => {
    const r = getRect(STEPS[stepIndex].target)
    if (!r) return
    setRect(r)
    // Card position computed after next paint so we have card dimensions
    requestAnimationFrame(() => {
      const card = cardRef.current
      if (!card) return
      const cw = card.offsetWidth  || 300
      const ch = card.offsetHeight || 220
      const vw = window.innerWidth
      const vh = window.innerHeight
      const { placement } = STEPS[stepIndex]
      let left, top

      if (placement === 'right')        { left = r.right  + 14;            top = r.top + r.height / 2 - ch / 2 }
      else if (placement === 'left')    { left = r.left   - cw - 14;       top = r.top + r.height / 2 - ch / 2 }
      else if (placement === 'below-center') { left = r.left + r.width / 2 - cw / 2; top = r.bottom + 14 }
      else if (placement === 'above-center') { left = r.left + r.width / 2 - cw / 2; top = r.top - ch - 14 }
      else { left = r.right + 14; top = r.top }

      setCardPos({
        left: clamp(left, 12, vw - cw - 12),
        top:  clamp(top,  12, vh - ch - 12),
      })
    })
  }, [])

  useEffect(() => {
    if (phase === 'tour') computePositions(step)
  }, [phase, step, computePositions])

  useEffect(() => {
    if (phase !== 'tour') return
    const onResize = () => computePositions(step)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [phase, step, computePositions])

  useEffect(() => {
    if (phase !== 'tour') return
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext()
      if (e.key === 'ArrowLeft')  handlePrev()
      if (e.key === 'Escape')     handleSkip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function handleStart() { setPhase('tour'); setStep(0) }
  function handleSkip()  { setPhase('done') }
  function handlePrev()  { if (step > 0) setStep(s => s - 1) }
  function handleNext()  {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else { setPhase('end') }
  }
  function handleEnd()     { setPhase('done') }
  function handleRestart() { setPhase('tour'); setStep(0) }

  if (phase === 'done') return null

  // Spotlight dimensions
  const spotX = rect ? rect.left - PAD : 0
  const spotY = rect ? rect.top  - PAD : 0
  const spotW = rect ? rect.width  + PAD * 2 : 0
  const spotH = rect ? rect.height + PAD * 2 : 0

  return (
    <>
      {/* ── START SCREEN ── */}
      {phase === 'start' && (
        <div style={s.fullScreen}>
          <div style={s.startCard}>
            <div style={s.startIcon}>🗺</div>
            <div style={s.startTitle}>Welcome to <span style={{ color: '#f5a623' }}>LILA BLACK</span></div>
            <div style={s.startSub}>Player Journey Visualizer</div>
            <div style={s.startDesc}>
              This tool lets you explore how players move through your maps — where they fight, die, loot, and which areas they never visit.
              <br /><br />
              This tour covers all key features in <strong style={{ color: '#c8cdd6' }}>under a minute</strong>.
            </div>
            <div style={s.stepPills}>
              {STEPS.map((st) => (
                <div key={st.target} style={s.stepPill}>{st.title}</div>
              ))}
            </div>
            <div style={s.startBtns}>
              <button style={s.btnPrimary} onClick={handleStart}>Start Tour</button>
              <button style={s.btnSecondary} onClick={handleSkip}>Skip</button>
            </div>
          </div>
        </div>
      )}

      {/* ── END SCREEN ── */}
      {phase === 'end' && (
        <div style={s.fullScreen}>
          <div style={s.startCard}>
            <div style={s.startIcon}>✓</div>
            <div style={s.startTitle}>You're <span style={{ color: '#f5a623' }}>ready</span></div>
            <div style={s.startSub}>Tour complete</div>
            <div style={s.startDesc}>
              Select a map, pick a session from the outliner, and start exploring.
              <br /><br />
              <strong style={{ color: '#c8cdd6' }}>Tip:</strong> Use the <strong style={{ color: '#c8cdd6' }}>Filters</strong> button to narrow sessions by duration, kill count, or player type.
            </div>
            <div style={s.startBtns}>
              <button style={s.btnPrimary} onClick={handleEnd}>Start Exploring</button>
              <button style={s.btnSecondary} onClick={handleRestart}>Replay Tour</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOUR OVERLAY ── */}
      {phase === 'tour' && (
        <div style={s.overlay}>
          {/* SVG spotlight mask */}
          <svg style={s.svg} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <mask id="tour-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect x={spotX} y={spotY} width={spotW} height={spotH} rx={4} fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#tour-mask)" />
            <rect x={spotX} y={spotY} width={spotW} height={spotH} rx={4}
              fill="none" stroke="#f5a623" strokeWidth="1.5" opacity="0.5" />
          </svg>

          {/* Tour card */}
          <div ref={cardRef} style={{ ...s.card, left: cardPos.left, top: cardPos.top }}>
            <div style={s.cardAccent} />
            <div style={s.cardBody}>
              <div style={s.stepBadge}>STEP {step + 1} OF {STEPS.length}</div>
              <div style={s.cardTitle}>{STEPS[step].title}</div>
              <div
                style={s.cardText}
                dangerouslySetInnerHTML={{ __html: STEPS[step].body }}
              />
            </div>
            <div style={s.cardFooter}>
              <span style={s.skipLink} onClick={handleSkip}>Skip tour</span>
              <div style={s.dots}>
                {STEPS.map((_, i) => (
                  <div key={i} style={{ ...s.dot, background: i === step ? '#f5a623' : '#2a2b30' }} />
                ))}
              </div>
              <div style={s.navBtns}>
                <button
                  style={{ ...s.navBtn, ...s.navBtnBack, visibility: step === 0 ? 'hidden' : 'visible' }}
                  onClick={handlePrev}
                >Back</button>
                <button style={{ ...s.navBtn, ...s.navBtnNext }} onClick={handleNext}>
                  {step === STEPS.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const s = {
  fullScreen: {
    position:       'fixed', inset: 0, zIndex: 2000,
    background:     'rgba(10,11,14,0.92)',
    display:        'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  startCard: {
    width:        420, background: '#1e1f23',
    border:       '1px solid #2a2b30', borderTop: '2px solid #f5a623',
    borderRadius: 6, padding: '32px 28px', textAlign: 'center',
  },
  startIcon:  { fontSize: 32, marginBottom: 14 },
  startTitle: {
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', marginBottom: 4,
  },
  startSub: {
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: '#f5a623',
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14,
  },
  startDesc: { fontSize: 13, color: '#8a8e9a', lineHeight: 1.7, marginBottom: 20 },
  stepPills: { display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginBottom: 22 },
  stepPill: {
    padding: '3px 8px', borderRadius: 2, border: '1px solid #2a2b30',
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5a5e6a',
  },
  startBtns: { display: 'flex', gap: 8, justifyContent: 'center' },
  btnPrimary: {
    padding: '9px 24px', background: '#f5a623', color: '#1a1b1e', border: 'none',
    borderRadius: 3, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13,
    fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
  },
  btnSecondary: {
    padding: '9px 24px', background: 'transparent', color: '#7a7e8a',
    border: '1px solid #2a2b30', borderRadius: 3,
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
  },

  overlay: { position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'all' },
  svg:     { position: 'absolute', inset: 0, width: '100%', height: '100%' },

  card: {
    position:     'absolute', width: 300,
    background:   '#1e1f23', border: '1px solid #2a2b30',
    borderRadius: 6, boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
    overflow:     'hidden', pointerEvents: 'all',
  },
  cardAccent: { height: 3, background: '#f5a623' },
  cardBody:   { padding: '14px 16px 10px' },
  stepBadge: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#f5a623',
    letterSpacing: '0.08em', marginBottom: 7,
  },
  cardTitle: {
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', marginBottom: 7,
  },
  cardText: { fontSize: 12, color: '#9a9ea8', lineHeight: 1.65 },
  cardFooter: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 16px', borderTop: '1px solid #222326', background: '#16171a',
  },
  skipLink: {
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 600,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4e5a', cursor: 'pointer',
  },
  dots:   { display: 'flex', gap: 5 },
  dot:    { width: 6, height: 6, borderRadius: '50%', transition: 'background 0.2s' },
  navBtns:    { display: 'flex', gap: 6 },
  navBtn: {
    height: 28, padding: '0 12px', borderRadius: 3, cursor: 'pointer',
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase', border: 'none',
  },
  navBtnBack: { background: 'transparent', border: '1px solid #2a2b30', color: '#7a7e8a' },
  navBtnNext: { background: '#f5a623', color: '#1a1b1e' },
}
