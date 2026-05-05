/**
 * @fileoverview buildDrillEditorState — Converts PracticeDrillBlock[] into
 * a Lexical editor state JSON structure compatible with the existing Workbook
 * plugins (QuizPlugin, AnswerPlugin, MeaningAssociationPlugin, CustomAnswerPlugin).
 *
 * Each node is serialized in the exact format that the corresponding Lexical
 * node's importJSON expects so the standard workbook can render them.
 */

// ============================================================================
// Types
// ============================================================================

export interface PracticeDrillBlock {
  type: 'quiz' | 'answer' | 'meaning-association' | 'custom-answer'
  instruction: string
  documentRef?: { filename: string; page: number | string }
  choices?: { choice: string; correct: boolean }[]
  expectedAnswer?: string
  pairs?: { term: string; definition: string }[]
  hint?: string
  sourceItemId: string
  sourceType: string
  /** Array of Word IDs for meaning-association blocks */
  sourceItemIds?: string[]
  audio?: {
    instruction?: string
    expectedAnswer?: string
    choices?: Record<string, string>
    pairs?: Record<string, string>
    hint?: string
  }
  pronunciation?: {
    enabled: boolean
    targetText: string
    targetLanguage?: string
    audioKey?: string
    maxAttempts?: number
  }
}

/** Dictionary lookup — maps word ID → Word record */
interface WordMap {
  [id: string]: { id: string; phrase?: string; definition?: string } | undefined
}

// ============================================================================
// Lexical node builders — match existing importJSON formats
// ============================================================================

function textNode(text: string) {
  return {
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text,
    type: 'text',
    version: 1,
  }
}

function paragraphNode(children: any[]) {
  return {
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'paragraph',
    version: 1,
  }
}

/**
 * Build a quiz node — matches QuizNode.importJSON which reads `serializedNode.data`.
 * QuizComponent expects data as `[{ answer: string, correct: boolean }, ...]`.
 */
function buildQuizNode(block: PracticeDrillBlock) {
  return {
    type: 'quiz',
    version: 1,
    data: (block.choices || []).map((c) => ({
      answer: c.choice,
      correct: c.correct,
    })),
  }
}

/**
 * Build an answer node — matches AnswerNode.importJSON which reads
 * `serializedNode.wordIDs`, `.requestDefinition`, `.allowedInput`, `.promptMethod`.
 */
function buildAnswerNode(block: PracticeDrillBlock) {
  return {
    type: 'answer',
    version: 1,
    wordIDs: [block.sourceItemId],
    requestDefinition: true,
    allowedInput: {},
    promptMethod: [],
  }
}

/**
 * Build a meaning-association node — matches MeaningAssociationNode.importJSON
 * which reads `serializedNode.wordIDs`, `.enabledModes`.
 *
 * Uses `sourceItemIds` if available, otherwise falls back to resolving pair
 * terms against the provided dictionary.
 */
function buildMeaningAssociationNode(
  block: PracticeDrillBlock,
  dictionary?: WordMap,
) {
  let wordIDs: string[] = []

  if (block.sourceItemIds && block.sourceItemIds.length > 0) {
    // Use explicitly provided word IDs
    wordIDs = block.sourceItemIds
  } else if (dictionary && block.pairs) {
    // Resolve term text → word ID via dictionary lookup
    const phraseToId = new Map<string, string>()
    for (const [id, word] of Object.entries(dictionary)) {
      if (word?.phrase) {
        phraseToId.set(word.phrase.toLowerCase(), id)
      }
    }
    for (const pair of block.pairs) {
      const resolved = phraseToId.get(pair.term.toLowerCase())
      if (resolved) wordIDs.push(resolved)
    }
  }

  // Fallback: use sourceItemId if we couldn't resolve any IDs
  if (wordIDs.length === 0 && block.sourceItemId) {
    wordIDs = [block.sourceItemId]
  }

  return {
    type: 'meaning-association',
    version: 1,
    wordIDs,
    enabledModes: ['learn', 'easy', 'hard'],
  }
}

/**
 * Build a custom-answer node — matches CustomAnswerNode.importJSON which reads
 * `serializedNode.ids`, `.allowedInput`, `.promptMethod`.
 */
function buildCustomAnswerNode(block: PracticeDrillBlock) {
  return {
    type: 'custom-answer',
    version: 1,
    ids: [block.sourceItemId],
    promptMethod: [],
    allowedInput: [],
  }
}

// ============================================================================
// Main builder
// ============================================================================

/**
 * Build a Lexical editor state JSON from PracticeDrillBlock[].
 *
 * Produces node structures compatible with the existing Workbook Lexical
 * plugins so the standard graded components render and grade normally.
 *
 * @param blocks - AI-generated drill blocks
 * @param dictionary - Optional word map for resolving meaning-association IDs
 */
export function buildDrillEditorState(
  blocks: PracticeDrillBlock[],
  dictionary?: WordMap,
): any {
  const children: any[] = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    // Add instruction as a paragraph above the block
    if (block.instruction) {
      children.push(paragraphNode([textNode(block.instruction)]))
    }

    // Add document reference if present
    if (block.documentRef) {
      children.push(
        paragraphNode([
          textNode(`📄 ${block.documentRef.filename}, p. ${block.documentRef.page}`),
        ]),
      )
    }

    // Add the graded block node in the format the existing plugins expect
    switch (block.type) {
      case 'quiz':
        children.push(buildQuizNode(block))
        break
      case 'answer':
        children.push(buildAnswerNode(block))
        break
      case 'meaning-association':
        children.push(buildMeaningAssociationNode(block, dictionary))
        break
      case 'custom-answer':
        children.push(buildCustomAnswerNode(block))
        break
      default:
        // Fallback: render as answer block
        children.push(buildAnswerNode(block))
    }

    // Add separator between blocks (not after last)
    if (i < blocks.length - 1) {
      children.push({
        type: 'horizontalrule',
        version: 1,
      })
    }
  }

  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

/**
 * Extract block metadata from a built editor state for mapping
 * block index → audio/pronunciation data.
 */
export function extractDrillMetadata(blocks: PracticeDrillBlock[]): Map<number, PracticeDrillBlock> {
  return new Map(blocks.map((block, i) => [i, block]))
}
