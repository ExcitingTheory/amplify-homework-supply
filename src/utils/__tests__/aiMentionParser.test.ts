import { describe, it, expect } from 'vitest'
import {
  AI_MENTION_HANDLE,
  hasAIMention,
  extractAIQuestion,
  parseAIMention,
} from '../../utils/aiMentionParser'

describe('aiMentionParser', () => {
  it('exposes the handle the UI tells people to type', () => {
    expect(AI_MENTION_HANDLE).toBe('@kai')
  })

  describe('hasAIMention', () => {
    it('detects @kai at start of message', () => {
      expect(hasAIMention('@kai what about this?')).toBe(true)
    })

    it('detects @kai in middle of message', () => {
      expect(hasAIMention('Hey @kai can you explain?')).toBe(true)
    })

    it('detects @kai at end of message', () => {
      expect(hasAIMention('Help me @kai')).toBe(true)
    })

    it('is case-insensitive (@KAI)', () => {
      expect(hasAIMention('@KAI what is this?')).toBe(true)
    })

    it('is case-insensitive (@Kai)', () => {
      expect(hasAIMention('@Kai help me')).toBe(true)
    })

    it('returns false for messages without @kai', () => {
      expect(hasAIMention('just a normal message')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(hasAIMention('')).toBe(false)
    })

    it('no longer treats @AI as a mention', () => {
      expect(hasAIMention('@AI what about this?')).toBe(false)
      expect(hasAIMention('Hey @ai can you explain?')).toBe(false)
    })

    it('ignores email addresses and handles that merely start with kai', () => {
      expect(hasAIMention('write to bob@kai.com')).toBe(false)
      expect(hasAIMention('thanks @kaitlyn')).toBe(false)
    })

    it('detects @kai next to punctuation', () => {
      expect(hasAIMention('Ask @kai, please')).toBe(true)
      expect(hasAIMention('(@kai?)')).toBe(true)
    })

    it('gives the same answer when called repeatedly', () => {
      expect(hasAIMention('@kai hi')).toBe(true)
      expect(hasAIMention('@kai hi')).toBe(true)
      expect(hasAIMention('@kai hi')).toBe(true)
    })

    it('does not match @KAISER or @KAIROS (word boundary)', () => {
      expect(hasAIMention('@KAISER help me')).toBe(false)
    })
  })

  describe('extractAIQuestion', () => {
    it('extracts text after @kai at start', () => {
      expect(extractAIQuestion('@kai what about this?')).toBe('what about this?')
    })

    it('extracts text after @kai in middle', () => {
      expect(extractAIQuestion('Hey @kai can you explain?')).toBe('Hey can you explain?')
    })

    it('handles @kai at end with no question', () => {
      expect(extractAIQuestion('@kai')).toBe('')
    })

    it('handles @KAI uppercase', () => {
      expect(extractAIQuestion('@KAI what is this?')).toBe('what is this?')
    })

    it('strips multiple @kai mentions', () => {
      const result = extractAIQuestion('Check @kai this part and @kai that part')
      expect(result).toBe('Check this part and that part')
    })

    it('returns empty for empty input', () => {
      expect(extractAIQuestion('')).toBe('')
    })

    it('leaves email addresses intact', () => {
      expect(extractAIQuestion('@kai email bob@kai.com')).toBe('email bob@kai.com')
    })
  })

  describe('parseAIMention', () => {
    it('returns full result for a message with @kai', () => {
      const result = parseAIMention('@kai what about this?')
      expect(result.hasAIMention).toBe(true)
      expect(result.question).toBe('what about this?')
      expect(result.originalMessage).toBe('@kai what about this?')
    })

    it('returns no mention for a normal message', () => {
      const result = parseAIMention('just chatting')
      expect(result.hasAIMention).toBe(false)
      expect(result.question).toBe('')
      expect(result.originalMessage).toBe('just chatting')
    })
  })
})
