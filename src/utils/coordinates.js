import { MAP_CONFIG } from '../constants/maps.js'

/**
 * Convert world (x, z) coordinates to minimap pixel coordinates.
 * Minimap images are 1024x1024. Y axis is flipped (image origin = top-left).
 */
export function worldToPixel(x, z, mapId) {
  const cfg = MAP_CONFIG[mapId]
  if (!cfg) return [512, 512]
  const u = (x - cfg.originX) / cfg.scale
  const v = (z - cfg.originZ) / cfg.scale
  const px = Math.round(Math.max(0, Math.min(1024, u * 1024)))
  const py = Math.round(Math.max(0, Math.min(1024, (1 - v) * 1024)))
  return [px, py]
}
