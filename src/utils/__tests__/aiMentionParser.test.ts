import { describe, it, expect } from 'vitest'
import {
  hasAIMention,
  extractAIQuestion,
  parseAIMention,
} from '../../utils/aiMentionParser'

describe('aiMentionParser', () => {
  describe('hasAIMention', () => {
    it('detects @AI at start of message', () => {
      expect(hasAIMention('@AI what about this?')).toBe(true)
    })

    it('detects @AI in middle of message', () => {
      expect(hasAIMention('Hey @AI can you explain?')).toBe(true)
    })

    it('detects @AI at end of message', () => {
      expect(hasAIMention('Help me @AI')).toBe(true)
    })

    it('is case-insensitive (@ai)', () => {
      expect(hasAIMention('@ai what is this?')).toBe(true)
    })

    it('is case-insensitive (@Ai)', () => {
      expect(hasAIMention('@Ai help me')).toBe(true)
    })

    it('returns false for messages without @AI', () => {
      expect(hasAIMention('just a normal message')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(hasAIMention('')).toBe(false)
    })

    it('does not match @AIDE or @AIRPLANE (word boundary)', () => {
      expect(hasAIMention('@AIDE help me')).toBe(false)
    })
  })

  describe('extractAIQuestion', () => {
    it('extracts text after @AI at start', () => {
      expect(extractAIQuestion('@AI what about this?')).toBe('what about this?')
    })

    it('extracts text after @AI in middle', () => {
      expect(extractAIQuestion('Hey @AI can you explain?')).toBe('Hey can you explain?')
    })

    it('handles @AI at end with no question', () => {
      expect(extractAIQuestion('@AI')).toBe('')
    })

    it('handles @ai lowercase', () => {
      expect(extractAIQuestion('@ai what is this?')).toBe('what is this?')
    })

    it('strips multiple @AI mentions', () => {
      const result = extractAIQuestion('Check @AI this part and @AI that part')
      expect(result).toBe('Check this part and that part')
    })

    it('returns empty for empty input', () => {
      expect(extractAIQuestion('')).toBe('')
    })
  })

  describe('parseAIMention', () => {
    it('returns full result for a message with @AI', () => {
      const result = parseAIMention('@AI what about this?')
      expect(result.hasAIMention).toBe(true)
      expect(result.question).toBe('what about this?')
      expect(result.originalMessage).toBe('@AI what about this?')
    })

    it('returns no mention for a normal message', () => {
      const result = parseAIMention('just chatting')
      expect(result.hasAIMention).toBe(false)
      expect(result.question).toBe('')
      expect(result.originalMessage).toBe('just chatting')
    })
  })
})
