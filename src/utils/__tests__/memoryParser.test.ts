import { describe, it, expect } from 'vitest'
import {
  parseMemoryMarkdown,
  trimFeedbackHistory,
  appendFeedbackEntry,
  extractNailedItMoments,
  estimateSize,
  trimToFitSizeCap,
  createInitialMemory,
} from '../../utils/memoryParser'

const SAMPLE_MEMORY = `# Student Memory: Alice Johnson
Last Updated: 2026-04-10T12:00:00Z

## Learning Profile
- Cohort: Biology 101
- Current Level: Practitioner (Level 3)
- Assignments Completed: 7 of 12
- Average Revision Rate: 2.1 revisions per submission

## Demonstrated Strengths
- Strong conceptual understanding of cell biology
- Consistent use of examples when explaining abstract ideas

## Recurring Mistakes
- Tends to conflate mitosis with meiosis
- Frequently forgets to address edge cases

## Recent Feedback History (Last 10 Interactions)
- HW7, Block 3: Correctly identified the core issue but explanation was unclear.
- HW6, Block 1: Conflated mitosis with meiosis again.
- HW5, Block 2: Excellent response — marked Nailed It.
- HW4, Block 4: Missed edge case. Revised after prompt.
- HW3, Block 2: Strong answer, no revision needed.

## Nailed It Moments
- HW5 Block 2: Exceptional analysis of cell division
- HW3 Block 5: Clear, well-structured response

## Notes for AI Tutor
- This student responds well to Socratic questioning.
- Prefers concise feedback.
`

describe('memoryParser', () => {
  describe('parseMemoryMarkdown', () => {
    it('parses all sections from a well-formed document', () => {
      const sections = parseMemoryMarkdown(SAMPLE_MEMORY)
      expect(sections.learningProfile).toContain('Biology 101')
      expect(sections.demonstratedStrengths).toContain('cell biology')
      expect(sections.recurringMistakes).toContain('mitosis')
      expect(sections.recentFeedbackHistory).toHaveLength(5)
      expect(sections.nailedItMoments).toHaveLength(2)
      expect(sections.aiTutorNotes).toContain('Socratic')
    })

    it('returns empty sections for null input', () => {
      const sections = parseMemoryMarkdown(null)
      expect(sections.learningProfile).toBe('')
      expect(sections.recentFeedbackHistory).toEqual([])
    })

    it('returns empty sections for empty string', () => {
      const sections = parseMemoryMarkdown('')
      expect(sections.learningProfile).toBe('')
    })

    it('handles missing sections gracefully', () => {
      const partial = `# Minimal Memory
## Learning Profile
- Level: 1
`
      const sections = parseMemoryMarkdown(partial)
      expect(sections.learningProfile).toContain('Level: 1')
      expect(sections.demonstratedStrengths).toBe('')
      expect(sections.recentFeedbackHistory).toEqual([])
    })
  })

  describe('trimFeedbackHistory', () => {
    it('returns entries unchanged when under limit', () => {
      const entries = ['entry1', 'entry2', 'entry3']
      expect(trimFeedbackHistory(entries, 5)).toEqual(entries)
    })

    it('trims to last N entries', () => {
      const entries = ['a', 'b', 'c', 'd', 'e']
      const result = trimFeedbackHistory(entries, 3)
      expect(result).toEqual(['c', 'd', 'e'])
    })

    it('returns entries unchanged when exactly at limit', () => {
      const entries = ['a', 'b', 'c']
      expect(trimFeedbackHistory(entries, 3)).toEqual(entries)
    })
  })

  describe('appendFeedbackEntry', () => {
    it('appends an entry to the feedback history section', () => {
      const result = appendFeedbackEntry(SAMPLE_MEMORY, {
        assignment: 'HW8',
        block: 'Block 1',
        summary: 'Great improvement on cell division.',
      })
      expect(result).toContain('HW8, Block 1: Great improvement on cell division.')
    })

    it('creates the section if missing', () => {
      const minimal = '# Memory\n## Learning Profile\n- Level 1'
      const result = appendFeedbackEntry(minimal, {
        assignment: 'HW1',
        block: 'Block 1',
        summary: 'First submission.',
      })
      expect(result).toContain('## Recent Feedback History')
      expect(result).toContain('HW1, Block 1: First submission.')
    })
  })

  describe('extractNailedItMoments', () => {
    it('extracts nailed it moments from the document', () => {
      const moments = extractNailedItMoments(SAMPLE_MEMORY)
      expect(moments).toHaveLength(2)
      expect(moments[0]).toContain('HW5 Block 2')
    })

    it('returns empty array for null input', () => {
      expect(extractNailedItMoments(null)).toEqual([])
    })
  })

  describe('estimateSize', () => {
    it('returns byte size of a string', () => {
      expect(estimateSize('hello')).toBe(5)
    })

    it('counts multi-byte characters correctly', () => {
      // '日' is 3 bytes in UTF-8
      expect(estimateSize('日')).toBe(3)
    })
  })

  describe('trimToFitSizeCap', () => {
    it('returns unchanged if under cap', () => {
      const result = trimToFitSizeCap(SAMPLE_MEMORY, 10000)
      expect(result).toBe(SAMPLE_MEMORY)
    })

    it('trims feedback history to fit under a tight cap', () => {
      const result = trimToFitSizeCap(SAMPLE_MEMORY, 800)
      const sections = parseMemoryMarkdown(result)
      // Should have fewer history entries
      expect(sections.recentFeedbackHistory.length).toBeLessThan(5)
    })
  })

  describe('createInitialMemory', () => {
    it('creates a valid memory document for a new student', () => {
      const memory = createInitialMemory('Bob Smith', 'Math 201')
      expect(memory).toContain('# Student Memory: Bob Smith')
      expect(memory).toContain('Math 201')
      expect(memory).toContain('Beginner (Level 1)')
      expect(memory).toContain('## Recent Feedback History')
    })

    it('defaults to Unassigned when no cohort provided', () => {
      const memory = createInitialMemory('Jane Doe')
      expect(memory).toContain('Unassigned')
    })
  })
})
