import { describe, it, expect } from 'vitest'
import { parseNailedItResponse, isNailedIt } from '../../utils/nailedItParser'

describe('nailedItParser', () => {
  describe('parseNailedItResponse', () => {
    it('parses a valid JSON envelope with nailedIt: true', () => {
      const response = JSON.stringify({
        feedback: 'Excellent work on cell division.',
        nailedIt: true,
        nailedItReason: 'Exceptional depth of analysis',
        xpToAward: 20,
      })
      const result = parseNailedItResponse(response)
      expect(result.feedback).toBe('Excellent work on cell division.')
      expect(result.nailedIt).toBe(true)
      expect(result.nailedItReason).toBe('Exceptional depth of analysis')
      expect(result.xpToAward).toBe(20)
    })

    it('parses a valid JSON envelope with nailedIt: false', () => {
      const response = JSON.stringify({
        feedback: 'Good attempt but needs more detail.',
        nailedIt: false,
        nailedItReason: null,
      })
      const result = parseNailedItResponse(response)
      expect(result.feedback).toBe('Good attempt but needs more detail.')
      expect(result.nailedIt).toBe(false)
      expect(result.nailedItReason).toBeNull()
      expect(result.xpToAward).toBe(0)
    })

    it('handles malformed JSON gracefully (fallback to plain text)', () => {
      const response = '{ invalid json }'
      const result = parseNailedItResponse(response)
      expect(result.feedback).toBe('{ invalid json }')
      expect(result.nailedIt).toBe(false)
      expect(result.xpToAward).toBe(0)
    })

    it('handles plain text feedback (not JSON)', () => {
      const response = 'Good work! Keep improving your analysis.'
      const result = parseNailedItResponse(response)
      expect(result.feedback).toBe(response)
      expect(result.nailedIt).toBe(false)
      expect(result.nailedItReason).toBeNull()
    })

    it('returns empty feedback for empty string', () => {
      const result = parseNailedItResponse('')
      expect(result.feedback).toBe('')
      expect(result.nailedIt).toBe(false)
    })

    it('returns plain text for JSON without feedback field', () => {
      const response = JSON.stringify({ text: 'some text', nailedIt: true })
      const result = parseNailedItResponse(response)
      // Missing 'feedback' field — treated as plain text
      expect(result.feedback).toBe(response)
      expect(result.nailedIt).toBe(false)
    })

    it('ignores nailedItReason when nailedIt is false', () => {
      const response = JSON.stringify({
        feedback: 'Needs work.',
        nailedIt: false,
        nailedItReason: 'This should be ignored',
      })
      const result = parseNailedItResponse(response)
      expect(result.nailedItReason).toBeNull()
    })

    it('awards 0 XP when nailedIt is false', () => {
      const response = JSON.stringify({
        feedback: 'Try again.',
        nailedIt: false,
      })
      const result = parseNailedItResponse(response)
      expect(result.xpToAward).toBe(0)
    })

    it('awards 20 XP when nailedIt is true', () => {
      const response = JSON.stringify({
        feedback: 'Perfect!',
        nailedIt: true,
        nailedItReason: 'Flawless',
      })
      const result = parseNailedItResponse(response)
      expect(result.xpToAward).toBe(20)
    })
  })

  describe('isNailedIt', () => {
    it('returns true for nailed it result', () => {
      expect(isNailedIt({
        feedback: 'Great!',
        nailedIt: true,
        nailedItReason: 'Perfect',
        xpToAward: 20,
      })).toBe(true)
    })

    it('returns false for non-nailed-it result', () => {
      expect(isNailedIt({
        feedback: 'Needs work.',
        nailedIt: false,
        nailedItReason: null,
        xpToAward: 0,
      })).toBe(false)
    })
  })
})
