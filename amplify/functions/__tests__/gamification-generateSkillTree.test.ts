/**
 * Unit tests for the gamification handler — generateSkillTree operation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Amplify
vi.mock('aws-amplify', () => ({
  Amplify: { configure: vi.fn() },
}))

vi.mock('@aws-sdk/credential-providers', () => ({
  fromEnv: vi.fn(() => vi.fn().mockResolvedValue({
    accessKeyId: 'test',
    secretAccessKey: 'test',
  })),
}))

const mockGraphql = vi.fn()
vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({ graphql: mockGraphql }),
}))

// Mock openai
const mockCreate = vi.fn()
vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = { completions: { create: mockCreate } }
  },
}))

describe('gamification handler — generateSkillTree', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGraphql.mockReset()
    mockCreate.mockReset()
    process.env.API_ENDPOINT = 'http://localhost/graphql'
    process.env.AWS_REGION = 'us-east-1'
    process.env.OPENAI_API_KEY = 'test-key'
  })

  it('extracts skills from unit content and creates Skill records', async () => {
    const { handler } = await import('../gamification/handler')

    const lexicalData = {
      root: {
        children: [
          { type: 'paragraph', children: [{ text: 'Photosynthesis is the process by which plants convert sunlight into energy.' }] },
          { type: 'paragraph', children: [{ text: 'The chloroplast is the organelle where photosynthesis occurs.' }] },
        ],
      },
    }

    mockGraphql
      // GET_UNIT
      .mockResolvedValueOnce({
        data: {
          getUnit: {
            id: 'unit-1',
            name: 'Photosynthesis',
            description: 'Learn about how plants make food',
            data: JSON.stringify(lexicalData),
          },
        },
      })
      // LIST_UNIT_WORDS
      .mockResolvedValueOnce({
        data: {
          listUnitWordByUnitID: {
            items: [
              { word: { id: 'w1', word: 'chloroplast', phonetic: null, definition: 'organelle for photosynthesis' } },
              { word: { id: 'w2', word: 'glucose', phonetic: null, definition: 'simple sugar' } },
            ],
          },
        },
      })
      // LIST_QUESTION_UNITS
      .mockResolvedValueOnce({
        data: {
          listQuestionUnitByUnitID: {
            items: [
              { question: { id: 'q1', question: 'What is the role of chlorophyll?', answer: 'Absorbs light' } },
            ],
          },
        },
      })
      // LIST_UNIT_DOCUMENTS
      .mockResolvedValueOnce({
        data: {
          listUnitDocumentByUnitID: {
            items: [
              {
                document: {
                  id: 'd1',
                  parsedContents: {
                    items: [
                      { id: 'pc1', objectivesJSON: JSON.stringify([{ objective: 'Explain the process of photosynthesis', bloom_level: 'comprehension' }]) },
                    ],
                  },
                },
              },
            ],
          },
        },
      })
      // LIST_SKILLS_BY_COHORT (existing — none)
      .mockResolvedValueOnce({
        data: { listSkillByCohort: { items: [] } },
      })
      // CREATE_SKILL #1
      .mockResolvedValueOnce({
        data: {
          createSkill: { id: 'skill-new-1', title: 'Identify plant organelles', description: 'Recognize chloroplasts', prerequisites: '[]', xpReward: 25, cohortId: 'unit-unit-1', _version: 1 },
        },
      })
      // CREATE_SKILL #2
      .mockResolvedValueOnce({
        data: {
          createSkill: { id: 'skill-new-2', title: 'Explain photosynthesis steps', description: 'Light and dark reactions', prerequisites: '[]', xpReward: 50, cohortId: 'unit-unit-1', _version: 1 },
        },
      })
      // UPDATE_SKILL #2 (set prerequisite to #1)
      .mockResolvedValueOnce({
        data: {
          updateSkill: { id: 'skill-new-2', prerequisites: '["skill-new-1"]', _version: 2 },
        },
      })

    // GPT-4o response
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            skills: [
              { title: 'Identify plant organelles', description: 'Recognize chloroplasts', prerequisites: [], xpReward: 25 },
              { title: 'Explain photosynthesis steps', description: 'Light and dark reactions', prerequisites: ['Identify plant organelles'], xpReward: 50 },
            ],
          }),
        },
      }],
    })

    const result = await handler(
      {
        fieldName: 'generateSkillTree',
        arguments: { unitID: 'unit-1' },
        identity: { sub: 'instructor-1' },
      },
      {} as any,
      vi.fn(),
    )

    expect(result).toEqual(
      expect.objectContaining({
        generated: true,
        unitID: 'unit-1',
        cohortId: 'unit-unit-1',
        skillCount: 2,
      }),
    )
    expect(result.skills).toHaveLength(2)
    expect(result.skills[0].title).toBe('Identify plant organelles')
    expect(result.skills[1].prerequisites).toEqual(['skill-new-1'])

    // Verify GPT-4o was called
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
      }),
    )
  })

  it('throws when unit is not found', async () => {
    const { handler } = await import('../gamification/handler')

    mockGraphql.mockResolvedValueOnce({
      data: { getUnit: null },
    })

    await expect(
      handler(
        { fieldName: 'generateSkillTree', arguments: { unitID: 'nonexistent' }, identity: {} },
        {} as any,
        vi.fn(),
      ),
    ).rejects.toThrow('Unit not found: nonexistent')
  })

  it('handles unit with no content gracefully', async () => {
    const { handler } = await import('../gamification/handler')

    mockGraphql
      .mockResolvedValueOnce({
        data: { getUnit: { id: 'unit-2', name: 'Empty Unit', description: null, data: null } },
      })
      .mockResolvedValueOnce({ data: { listUnitWordByUnitID: { items: [] } } })
      .mockResolvedValueOnce({ data: { listQuestionUnitByUnitID: { items: [] } } })
      .mockResolvedValueOnce({ data: { listUnitDocumentByUnitID: { items: [] } } })
      .mockResolvedValueOnce({ data: { listSkillByCohort: { items: [] } } })

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ skills: [] }) } }],
    })

    const result = await handler(
      { fieldName: 'generateSkillTree', arguments: { unitID: 'unit-2' }, identity: {} },
      {} as any,
      vi.fn(),
    )

    expect(result).toEqual(
      expect.objectContaining({
        generated: false,
        reason: 'No skills extracted from content',
      }),
    )
  })

  it('cleans up existing skills before creating new ones', async () => {
    const { handler } = await import('../gamification/handler')

    mockGraphql
      .mockResolvedValueOnce({
        data: { getUnit: { id: 'unit-3', name: 'Grammar', description: null, data: '{"root":{"children":[{"children":[{"text":"Nouns and verbs"}]}]}}' } },
      })
      .mockResolvedValueOnce({ data: { listUnitWordByUnitID: { items: [] } } })
      .mockResolvedValueOnce({ data: { listQuestionUnitByUnitID: { items: [] } } })
      .mockResolvedValueOnce({ data: { listUnitDocumentByUnitID: { items: [] } } })
      // Existing skills to delete
      .mockResolvedValueOnce({
        data: { listSkillByCohort: { items: [{ id: 'old-1', _version: 1 }, { id: 'old-2', _version: 2 }] } },
      })
      // DELETE old-1
      .mockResolvedValueOnce({ data: { deleteSkill: { id: 'old-1' } } })
      // DELETE old-2
      .mockResolvedValueOnce({ data: { deleteSkill: { id: 'old-2' } } })
      // CREATE new skill
      .mockResolvedValueOnce({
        data: { createSkill: { id: 'new-1', title: 'Identify nouns', description: 'Find nouns in sentences', prerequisites: '[]', xpReward: 20, cohortId: 'my-cohort', _version: 1 } },
      })

    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            skills: [{ title: 'Identify nouns', description: 'Find nouns in sentences', prerequisites: [], xpReward: 20 }],
          }),
        },
      }],
    })

    const result = await handler(
      { fieldName: 'generateSkillTree', arguments: { unitID: 'unit-3', cohortId: 'my-cohort' }, identity: {} },
      {} as any,
      vi.fn(),
    )

    expect(result.generated).toBe(true)
    expect(result.cohortId).toBe('my-cohort')
    expect(result.skillCount).toBe(1)

    // Verify delete was called for both old skills
    const deleteCalls = mockGraphql.mock.calls.filter((c: any) =>
      c[0]?.query?.includes('deleteSkill'),
    )
    expect(deleteCalls).toHaveLength(2)
  })

  it('uses custom cohortId when provided', async () => {
    const { handler } = await import('../gamification/handler')

    mockGraphql
      .mockResolvedValueOnce({
        data: { getUnit: { id: 'unit-4', name: 'Test', description: null, data: '{"root":{"children":[{"children":[{"text":"Some content"}]}]}}' } },
      })
      .mockResolvedValueOnce({ data: { listUnitWordByUnitID: { items: [] } } })
      .mockResolvedValueOnce({ data: { listQuestionUnitByUnitID: { items: [] } } })
      .mockResolvedValueOnce({ data: { listUnitDocumentByUnitID: { items: [] } } })
      .mockResolvedValueOnce({ data: { listSkillByCohort: { items: [] } } })
      .mockResolvedValueOnce({
        data: { createSkill: { id: 's1', title: 'Skill 1', description: 'desc', prerequisites: '[]', xpReward: 30, cohortId: 'cohort-abc', _version: 1 } },
      })

    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: { content: JSON.stringify({ skills: [{ title: 'Skill 1', description: 'desc', prerequisites: [], xpReward: 30 }] }) },
      }],
    })

    const result = await handler(
      { fieldName: 'generateSkillTree', arguments: { unitID: 'unit-4', cohortId: 'cohort-abc' }, identity: {} },
      {} as any,
      vi.fn(),
    )

    expect(result.cohortId).toBe('cohort-abc')
  })
})

describe('extractTextFromLexicalJSON (internal)', () => {
  // We test the text extraction via the full handler flow,
  // verifying through the GPT prompt content

  beforeEach(() => {
    vi.resetModules()
    mockGraphql.mockReset()
    mockCreate.mockReset()
    process.env.API_ENDPOINT = 'http://localhost/graphql'
    process.env.AWS_REGION = 'us-east-1'
    process.env.OPENAI_API_KEY = 'test-key'
  })

  it('handles nested lexical nodes', async () => {
    const { handler } = await import('../gamification/handler')

    const complexLexical = {
      root: {
        children: [
          {
            type: 'heading',
            children: [{ text: 'Cell Biology' }],
          },
          {
            type: 'paragraph',
            children: [
              { text: 'Cells are the basic unit of life. ' },
              { text: 'They contain organelles.' },
            ],
          },
          {
            type: 'list',
            children: [
              { type: 'listitem', children: [{ text: 'Nucleus' }] },
              { type: 'listitem', children: [{ text: 'Mitochondria' }] },
            ],
          },
          {
            type: 'quiz',
            prompt: 'What is the powerhouse of the cell?',
            answer: 'Mitochondria',
            children: [],
          },
        ],
      },
    }

    mockGraphql
      .mockResolvedValueOnce({
        data: { getUnit: { id: 'unit-5', name: 'Cells', description: null, data: JSON.stringify(complexLexical) } },
      })
      .mockResolvedValueOnce({ data: { listUnitWordByUnitID: { items: [] } } })
      .mockResolvedValueOnce({ data: { listQuestionUnitByUnitID: { items: [] } } })
      .mockResolvedValueOnce({ data: { listUnitDocumentByUnitID: { items: [] } } })
      .mockResolvedValueOnce({ data: { listSkillByCohort: { items: [] } } })

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ skills: [] }) } }],
    })

    await handler(
      { fieldName: 'generateSkillTree', arguments: { unitID: 'unit-5' }, identity: {} },
      {} as any,
      vi.fn(),
    )

    // Verify the prompt sent to GPT-4o contains extracted text
    const promptMessages = mockCreate.mock.calls[0][0].messages
    const userMessage = promptMessages.find((m: any) => m.role === 'user')
    expect(userMessage.content).toContain('Cell Biology')
    expect(userMessage.content).toContain('Cells are the basic unit of life')
    expect(userMessage.content).toContain('Nucleus')
    expect(userMessage.content).toContain('Mitochondria')
    expect(userMessage.content).toContain('What is the powerhouse of the cell?')
  })
})
