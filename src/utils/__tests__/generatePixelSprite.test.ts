import { describe, it, expect } from 'vitest'
import { generateSpriteData, renderSpriteSvg, generatePixelSpriteSvg } from '../generatePixelSprite'

describe('generatePixelSprite', () => {
  it('generates deterministic sprite from seed', () => {
    const a = generatePixelSpriteSvg('test-seed', 1)
    const b = generatePixelSpriteSvg('test-seed', 1)
    expect(a).toBe(b)
  })

  it('produces different sprites for different seeds', () => {
    const a = generatePixelSpriteSvg('alice', 3)
    const b = generatePixelSpriteSvg('bob', 3)
    expect(a).not.toBe(b)
  })

  it('produces different sprites for different stages', () => {
    const a = generatePixelSpriteSvg('same-seed', 1)
    const b = generatePixelSpriteSvg('same-seed', 3)
    expect(a).not.toBe(b)
  })

  it('grid size grows with stage', () => {
    const s1 = generateSpriteData({ seed: 'test', stage: 1 })
    const s5 = generateSpriteData({ seed: 'test', stage: 5 })
    expect(s5.halfWidth).toBeGreaterThan(s1.halfWidth)
    expect(s5.height).toBeGreaterThan(s1.height)
  })

  it('palette has more colors at higher stages', () => {
    const s1 = generateSpriteData({ seed: 'test', stage: 1 })
    const s5 = generateSpriteData({ seed: 'test', stage: 5 })
    expect(s5.palette.length).toBeGreaterThan(s1.palette.length)
  })

  it('generates valid SVG string', () => {
    const svg = generatePixelSpriteSvg('test', 3, 4)
    expect(svg).toContain('<svg')
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svg).toContain('<rect')
    expect(svg).toContain('</svg>')
  })

  it('clamps stage to 1-5 range', () => {
    const low = generateSpriteData({ seed: 'test', stage: -1 })
    const high = generateSpriteData({ seed: 'test', stage: 99 })
    expect(low.halfWidth).toBe(4) // stage 1: 3 + 1
    expect(high.halfWidth).toBe(8) // stage 5: 3 + 5
  })

  it('renders symmetric sprite (mirrored rects)', () => {
    const svg = generatePixelSpriteSvg('symmetric-test', 2, 4)
    // Count rect elements — should be even (each body cell generates 2 rects: left + mirror)
    const rectCount = (svg.match(/<rect/g) || []).length
    expect(rectCount % 2).toBe(0)
  })
})
