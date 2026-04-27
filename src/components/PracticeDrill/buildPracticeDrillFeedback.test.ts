/**
 * @fileoverview Tests for buildPracticeDrillFeedback — verifies feedback
 * data construction and markdown generation from practice session results.
 */

import { describe, it, expect } from 'vitest'
import {
  buildFeedbackData,
  buildFeedbackMarkdown,
  type PracticeSessionData,
  type GeneratedBlock,
} from './buildPracticeDrillFeedback'

describe('buildFeedbackData', () => {
  const baseBlocks: GeneratedBlock[] = [
    {
      type: 'quiz',
      instruction: 'What is the powerhouse of the cell?',
      sourceType: 'vocabulary',
      sourceItemId: 'word-1',
      expectedAnswer: 'mitochondria',
    },
    {
      type: 'answer',
      instruction: 'Describe the process of osmosis.',
      sourceType: 'text',
      sourceItemId: 'block-2',
      expectedAnswer: 'Movement of water through a semipermeable membrane',
    },
    {
      type: 'meaning-association',
      instruction: 'Match the terms to their definitions.',
      sourceType: 'question',
      sourceItemId: 'q-3',
    },
  ]

  const baseSessionData: PracticeSessionData = {
    'word-1': { complete: true, accuracy: 100, userAnswer: 'mitochondria' },
    'block-2': { complete: true, accuracy: 55, userAnswer: 'water moving' },
    'q-3': { complete: true, accuracy: 80 },
  }

  const sourcesEnabled = {
    vocabulary: true,
    questions: true,
    text: true,
    documents: false,
  }

  it('computes overall accuracy as average of block accuracies', () => {
    const feedback = buildFeedbackData(
      baseSessionData,
      baseBlocks,
      'Biology 101',
      'mixed',
      sourcesEnabled,
    )
    // (100 + 55 + 80) / 3 = 78.33 → 78
    expect(feedback.overallAccuracy).toBe(78)
  })

  it('identifies weak areas (< 70%)', () => {
    const feedback = buildFeedbackData(
      baseSessionData,
      baseBlocks,
      'Biology 101',
      'mixed',
      sourcesEnabled,
    )
    expect(feedback.weakAreas).toHaveLength(1)
    expect(feedback.weakAreas[0]).toContain('Describe the process')
  })

  it('identifies strong areas (>= 90%)', () => {
    const feedback = buildFeedbackData(
      baseSessionData,
      baseBlocks,
      'Biology 101',
      'mixed',
      sourcesEnabled,
    )
    expect(feedback.strongAreas).toHaveLength(1)
    expect(feedback.strongAreas[0]).toContain('powerhouse')
  })

  it('computes per-source breakdown', () => {
    const feedback = buildFeedbackData(
      baseSessionData,
      baseBlocks,
      'Biology 101',
      'mixed',
      sourcesEnabled,
    )
    expect(feedback.blockBreakdown.vocabulary).toBe(100)
    expect(feedback.blockBreakdown.text).toBe(55)
    expect(feedback.blockBreakdown.question).toBe(80)
  })

  it('includes enabled sources', () => {
    const feedback = buildFeedbackData(
      baseSessionData,
      baseBlocks,
      'Biology 101',
      'mixed',
      sourcesEnabled,
    )
    expect(feedback.sourcesUsed).toContain('vocabulary')
    expect(feedback.sourcesUsed).toContain('questions')
    expect(feedback.sourcesUsed).toContain('text')
    expect(feedback.sourcesUsed).not.toContain('documents')
  })

  it('returns 0 accuracy when no blocks match', () => {
    const feedback = buildFeedbackData({}, baseBlocks, 'Test', 'mixed', sourcesEnabled)
    expect(feedback.overallAccuracy).toBe(0)
    expect(feedback.blockResults).toHaveLength(0)
  })

  it('includes timestamp', () => {
    const feedback = buildFeedbackData(
      baseSessionData,
      baseBlocks,
      'Biology 101',
      'mixed',
      sourcesEnabled,
    )
    expect(feedback.timestamp).toBeTruthy()
    expect(new Date(feedback.timestamp).getTime()).not.toBeNaN()
  })
})

describe('buildFeedbackMarkdown', () => {
  it('generates markdown with accuracy and sources', () => {
    const md = buildFeedbackMarkdown({
      unitName: 'Biology 101',
      drillType: 'mixed',
      overallAccuracy: 78,
      blockResults: [
        {
          blockId: 'b1',
          blockType: 'quiz',
          sourceType: 'vocabulary',
          concept: 'mitochondria',
          accuracy: 100,
          userAnswer: 'mitochondria',
          expectedAnswer: 'mitochondria',
          wasCorrect: true,
        },
      ],
      weakAreas: ['osmosis'],
      strongAreas: ['mitochondria'],
      sourcesUsed: ['vocabulary', 'text'],
      blockBreakdown: { vocabulary: 100, text: 55 },
      timestamp: '2026-04-17T14:30:00Z',
    })

    expect(md).toContain('mixed')
    expect(md).toContain('78%')
    expect(md).toContain('vocabulary, text')
    expect(md).toContain('osmosis')
    expect(md).toContain('mitochondria')
  })

  it('handles all-strong performance', () => {
    const md = buildFeedbackMarkdown({
      unitName: 'Easy Unit',
      drillType: 'vocabulary',
      overallAccuracy: 95,
      blockResults: [],
      weakAreas: [],
      strongAreas: ['everything'],
      sourcesUsed: ['vocabulary'],
      blockBreakdown: { vocabulary: 95 },
      timestamp: '2026-04-17T14:30:00Z',
    })

    expect(md).toContain('Excellent performance')
  })

  it('handles all-weak performance', () => {
    const md = buildFeedbackMarkdown({
      unitName: 'Hard Unit',
      drillType: 'comprehension',
      overallAccuracy: 35,
      blockResults: [],
      weakAreas: ['topic1', 'topic2'],
      strongAreas: [],
      sourcesUsed: ['text'],
      blockBreakdown: { text: 35 },
      timestamp: '2026-04-17T14:30:00Z',
    })

    expect(md).toContain('needs more practice')
    expect(md).toContain('2 concept(s)')
  })
})
