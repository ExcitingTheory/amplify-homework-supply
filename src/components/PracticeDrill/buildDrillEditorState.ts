/**
 * @fileoverview buildDrillEditorState — Converts PracticeDrillBlock[] into
 * a Lexical editor state JSON structure suitable for the stripped-down
 * PracticeDrillWorkbook. Embeds audio metadata into block nodes.
 */

// ============================================================================
// Types
// ============================================================================

interface PracticeDrillBlock {
  type: 'quiz' | 'answer' | 'meaning-association' | 'custom-answer'
  instruction: string
  documentRef?: { filename: string; page: number | string }
  choices?: { choice: string; correct: boolean }[]
  expectedAnswer?: string
  pairs?: { term: string; definition: string }[]
  hint?: string
  sourceItemId: string
  sourceType: string
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

// ============================================================================
// Lexical node builders
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

function headingNode(text: string, tag: string = 'h3') {
  return {
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'heading',
    version: 1,
    tag,
  }
}

/**
 * Build a quiz node from a PracticeDrillBlock.
 */
function buildQuizNode(block: PracticeDrillBlock, index: number) {
  return {
    type: 'quiz',
    version: 1,
    question: block.instruction,
    choices: (block.choices || []).map((c) => ({
      text: c.choice,
      correct: c.correct,
    })),
    // Custom metadata for audio + pronunciation
    __drillMeta: {
      blockIndex: index,
      sourceItemId: block.sourceItemId,
      audio: block.audio,
      pronunciation: block.pronunciation,
    },
  }
}

/**
 * Build an answer node from a PracticeDrillBlock.
 */
function buildAnswerNode(block: PracticeDrillBlock, index: number) {
  return {
    type: 'answer',
    version: 1,
    question: block.instruction,
    expectedAnswer: block.expectedAnswer || '',
    hint: block.hint,
    __drillMeta: {
      blockIndex: index,
      sourceItemId: block.sourceItemId,
      audio: block.audio,
      pronunciation: block.pronunciation,
    },
  }
}

/**
 * Build a meaning-association node from a PracticeDrillBlock.
 */
function buildMeaningAssociationNode(block: PracticeDrillBlock, index: number) {
  return {
    type: 'meaning-association',
    version: 1,
    instruction: block.instruction,
    pairs: (block.pairs || []).map((p) => ({
      term: p.term,
      definition: p.definition,
    })),
    __drillMeta: {
      blockIndex: index,
      sourceItemId: block.sourceItemId,
      audio: block.audio,
      pronunciation: block.pronunciation,
    },
  }
}

/**
 * Build a custom-answer node from a PracticeDrillBlock.
 */
function buildCustomAnswerNode(block: PracticeDrillBlock, index: number) {
  return {
    type: 'custom-answer',
    version: 1,
    question: block.instruction,
    expectedAnswer: block.expectedAnswer || '',
    hint: block.hint,
    __drillMeta: {
      blockIndex: index,
      sourceItemId: block.sourceItemId,
      audio: block.audio,
      pronunciation: block.pronunciation,
    },
  }
}

// ============================================================================
// Main builder
// ============================================================================

/**
 * Build a Lexical editor state JSON from PracticeDrillBlock[].
 *
 * The resulting structure has: instruction paragraph → graded block node,
 * separated by horizontal rules. Document references are shown as badges
 * above the block.
 */
export function buildDrillEditorState(blocks: PracticeDrillBlock[]): any {
  const children: any[] = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    // Add document reference if present
    if (block.documentRef) {
      children.push(
        paragraphNode([
          textNode(`📄 Ref: ${block.documentRef.filename}, p. ${block.documentRef.page}`),
        ]),
      )
    }

    // Add the graded block node
    switch (block.type) {
      case 'quiz':
        children.push(buildQuizNode(block, i))
        break
      case 'answer':
        children.push(buildAnswerNode(block, i))
        break
      case 'meaning-association':
        children.push(buildMeaningAssociationNode(block, i))
        break
      case 'custom-answer':
        children.push(buildCustomAnswerNode(block, i))
        break
      default:
        // Fallback: render as answer block
        children.push(buildAnswerNode(block, i))
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
