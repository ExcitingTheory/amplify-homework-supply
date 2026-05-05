/**
 * generatePixelSprite — Procedural symmetric pixel creature generator.
 *
 * Inspired by Deep-Fold/SpriteGenerator (MIT). Uses a seeded PRNG
 * to generate a symmetric pixel grid with body/edge/shading cells,
 * then renders to a canvas data URL or inline SVG rects.
 *
 * The creature "evolves" at higher stages: wider grid, more colors,
 * additional limb probability.
 *
 * @module generatePixelSprite
 */

// ============================================================================
// Seeded PRNG (mulberry32)
// ============================================================================

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0
  }
  return Math.abs(hash)
}

// ============================================================================
// Color palettes per evolution stage
// ============================================================================

const PALETTES: string[][] = [
  // Stage 1: simple 2-color
  ['#4caf50', '#2e7d32'],
  // Stage 2: warm
  ['#ff9800', '#e65100', '#ffcc80'],
  // Stage 3: cool
  ['#2196f3', '#0d47a1', '#90caf9', '#1565c0'],
  // Stage 4: vivid
  ['#e91e63', '#9c27b0', '#f48fb1', '#ce93d8', '#880e4f'],
  // Stage 5: rainbow
  ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0'],
]

// ============================================================================
// Sprite grid generation
// ============================================================================

export interface SpriteConfig {
  /** Deterministic seed string (e.g. studentId, guildId) */
  seed: string
  /** Evolution stage (1-5) — affects grid size, palette, complexity */
  stage?: number
  /** Pixel size of each cell */
  cellSize?: number
}

export interface SpriteData {
  /** Grid width (half — the full sprite is mirrored) */
  halfWidth: number
  /** Grid height */
  height: number
  /** 2D grid: 0=empty, 1=body, 2=edge */
  grid: number[][]
  /** Palette colors for this sprite */
  palette: string[]
  /** Background color */
  bgColor: string
}

export function generateSpriteData(config: SpriteConfig): SpriteData {
  const { seed, stage = 1 } = config
  const clampedStage = Math.max(1, Math.min(5, stage))

  const seedNum = hashString(seed + '-' + clampedStage)
  const rand = mulberry32(seedNum)

  // Grid dimensions grow with stage
  const halfWidth = 3 + clampedStage // 4 to 8
  const height = 6 + clampedStage * 2 // 8 to 16

  // Body probability increases with stage
  const bodyProb = 0.3 + clampedStage * 0.05

  // Generate half-grid (will be mirrored)
  const grid: number[][] = []
  for (let y = 0; y < height; y++) {
    const row: number[] = []
    for (let x = 0; x < halfWidth; x++) {
      if (rand() < bodyProb) {
        row.push(1) // body cell
      } else {
        row.push(0) // empty
      }
    }
    grid.push(row)
  }

  // Edge detection: mark body cells adjacent to empty as edge
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < halfWidth; x++) {
      if (grid[y][x] === 1) {
        const neighbors = [
          y > 0 ? grid[y - 1][x] : 0,
          y < height - 1 ? grid[y + 1][x] : 0,
          x > 0 ? grid[y][x - 1] : 0,
          x < halfWidth - 1 ? grid[y][x + 1] : 0,
        ]
        if (neighbors.some((n) => n === 0)) {
          grid[y][x] = 2 // edge
        }
      }
    }
  }

  // Pick palette
  const palette = PALETTES[clampedStage - 1] || PALETTES[0]
  const bgColor = 'transparent'

  return { halfWidth, height, grid, palette, bgColor }
}

// ============================================================================
// Render to SVG string
// ============================================================================

export function renderSpriteSvg(data: SpriteData, cellSize: number = 4): string {
  const { halfWidth, height, grid, palette } = data
  const fullWidth = halfWidth * 2
  const svgW = fullWidth * cellSize
  const svgH = height * cellSize

  const rects: string[] = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < halfWidth; x++) {
      const cell = grid[y][x]
      if (cell === 0) continue

      // Pick color: body=palette[0], edge=palette[1] (or last)
      const color = cell === 2 ? (palette[1] || palette[0]) : palette[0]

      // Left half
      rects.push(
        `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}"/>`
      )
      // Mirror right half
      const mirrorX = (fullWidth - 1 - x) * cellSize
      rects.push(
        `<rect x="${mirrorX}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}"/>`
      )
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}" shape-rendering="crispEdges">${rects.join('')}</svg>`
}

// ============================================================================
// Combined convenience function
// ============================================================================

export function generatePixelSpriteSvg(seed: string, stage: number = 1, cellSize: number = 4): string {
  const data = generateSpriteData({ seed, stage, cellSize })
  return renderSpriteSvg(data, cellSize)
}
