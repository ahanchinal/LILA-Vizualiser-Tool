import { HEATMAP_COLORS } from '../constants/maps.js'

/**
 * Rasterize a flat 32x32 heatmap grid into a 1024x1024 canvas
 * using smooth radial gradients per cell (Gaussian-style glow).
 * Each non-zero cell renders as a soft circular bloom that blends
 * naturally with neighbours — no hard grid edges.
 *
 * @param {number[]} grid   - 1024 integers (32×32, row-major)
 * @param {string}   mode   - 'traffic' | 'kills' | 'deaths'
 * @returns {HTMLCanvasElement}
 */
export function rasterizeHeatmap(grid, mode) {
  const GRID_SIZE = 32
  const CELL_SIZE = 1024 / GRID_SIZE   // 32px per cell
  const RADIUS    = CELL_SIZE * 1.6    // glow spreads ~1.6 cells in each direction
  const ramp = HEATMAP_COLORS[mode] || HEATMAP_COLORS.traffic

  const maxVal = Math.max(...grid, 1)

  const canvas = document.createElement('canvas')
  canvas.width  = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  // Additive blending makes overlapping hotspots accumulate brightness
  ctx.globalCompositeOperation = 'lighter'

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const val = grid[row * GRID_SIZE + col]
      if (val === 0) continue

      const t     = Math.pow(val / maxVal, 0.55)   // sqrt-ish scale
      const cx    = col * CELL_SIZE + CELL_SIZE / 2
      const cy    = row * CELL_SIZE + CELL_SIZE / 2

      const [r, g, b] = interpolateColor(ramp, t)
      const peakAlpha = Math.round(30 + t * 110)   // 30–140; additive blending compounds

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, RADIUS)
      grad.addColorStop(0,   `rgba(${r},${g},${b},${(peakAlpha / 255).toFixed(3)})`)
      grad.addColorStop(0.4, `rgba(${r},${g},${b},${(peakAlpha * 0.5 / 255).toFixed(3)})`)
      grad.addColorStop(1,   `rgba(${r},${g},${b},0)`)

      ctx.fillStyle = grad
      // Draw a square large enough to cover the full gradient extent
      const extent = RADIUS
      ctx.fillRect(cx - extent, cy - extent, extent * 2, extent * 2)
    }
  }

  return canvas
}

function interpolateColor(ramp, t) {
  const n = ramp.length - 1
  const idx = Math.min(Math.floor(t * n), n - 1)
  const frac = t * n - idx
  const c0 = ramp[idx]
  const c1 = ramp[idx + 1] || ramp[n]
  return [
    Math.round(c0[0] + (c1[0] - c0[0]) * frac),
    Math.round(c0[1] + (c1[1] - c0[1]) * frac),
    Math.round(c0[2] + (c1[2] - c0[2]) * frac),
  ]
}
