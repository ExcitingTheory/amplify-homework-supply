/**
 * @fileoverview buildPracticeDrillFeedback — Generates a markdown summary of
 * practice drill results for appending to StudentMemory via upsertStudentMemory.
 * Also produces structured data for InstructorInsight records.
 */

// ============================================================================
// Types
// ============================================================================

export interface BlockResult {
  blockId: string
  blockType: string
  sourceType: 'vocabulary' | 'question' | 'text' | 'document'
  concept: string
  accuracy: number
  userAnswer: string
  expectedAnswer: string
  wasCorrect: boolean
}

export interface PracticeDrillFeedbackData {
  unitName: string
  drillType: string
  overallAccuracy: number
  blockResults: BlockResult[]
  weakAreas: string[]
  strongAreas: string[]
  sourcesUsed: string[]
  blockBreakdown: Record<string, number>
  timestamp: string
}

export interface PracticeSessionData {
  [blockId: string]: {
    complete: boolean
    accuracy: number
    userAnswer?: string
  }
}

export interface GeneratedBlock {
  type: string
  instruction: string
  sourceType?: 'vocabulary' | 'question' | 'text' | 'document'
  sourceItemId?: string
  expectedAnswer?: string
  choices?: { choice: string; correct: boolean }[]
  pairs?: { term: string; definition: string }[]
}

// ============================================================================
// Feedback Builder
// ============================================================================

const WEAK_THRESHOLD = 70
const STRONG_THRESHOLD = 90

/**
 * Build structured feedback data from a completed practice session.
 */
export function buildFeedbackData(
  sessionData: PracticeSessionData,
  generatedContent: GeneratedBlock[],
  unitName: string,
  drillType: string,
  sourcesEnabled: Record<string, boolean>,
): PracticeDrillFeedbackData {
  const blockResults: BlockResult[] = []
  const sourceAccuracies: Record<string, number[]> = {}

  for (const block of generatedContent) {
    const blockId = block.sourceItemId || block.instruction.slice(0, 20)
    const result = sessionData[blockId]
    if (!result) continue

    const sourceType = block.sourceType || 'text'
    const accuracy = result.accuracy ?? 0
    const wasCorrect = accuracy >= STRONG_THRESHOLD

    // Derive the concept label from instruction text (first ~60 chars)
    const concept = block.instruction.length > 60
      ? block.instruction.slice(0, 57) + '...'
      : block.instruction

    blockResults.push({
      blockId,
      blockType: block.type,
      sourceType,
      concept,
      accuracy,
      userAnswer: result.userAnswer ?? '',
      expectedAnswer: block.expectedAnswer ?? '',
      wasCorrect,
    })

    if (!sourceAccuracies[sourceType]) sourceAccuracies[sourceType] = []
    sourceAccuracies[sourceType].push(accuracy)
  }

  // Compute per-source average accuracy
  const blockBreakdown: Record<string, number> = {}
  for (const [source, accuracies] of Object.entries(sourceAccuracies)) {
    const avg = accuracies.reduce((s, v) => s + v, 0) / accuracies.length
    blockBreakdown[source] = Math.round(avg)
  }

  // Identify weak and strong areas
  const weakAreas = blockResults
    .filter((r) => r.accuracy < WEAK_THRESHOLD)
    .map((r) => r.concept)
  const strongAreas = blockResults
    .filter((r) => r.accuracy >= STRONG_THRESHOLD)
    .map((r) => r.concept)

  // Overall accuracy
  const allAccuracies = blockResults.map((r) => r.accuracy)
  const overallAccuracy =
    allAccuracies.length > 0
      ? Math.round(allAccuracies.reduce((s, v) => s + v, 0) / allAccuracies.length)
      : 0

  // Sources used (from the enabled config)
  const sourcesUsed = Object.entries(sourcesEnabled)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key)

  return {
    unitName,
    drillType,
    overallAccuracy,
    blockResults,
    weakAreas,
    strongAreas,
    sourcesUsed,
    blockBreakdown,
    timestamp: new Date().toISOString(),
  }
}

// ============================================================================
// Markdown Builder (for StudentMemory)
// ============================================================================

/**
 * Build a markdown string to append to StudentMemory.memoryMarkdown
 * via the existing upsertStudentMemory mutation.
 */
export function buildFeedbackMarkdown(feedback: PracticeDrillFeedbackData): string {
  const lines: string[] = []

  lines.push(
    `- **Type**: ${feedback.drillType} | **Accuracy**: ${feedback.overallAccuracy}% | **Blocks**: ${feedback.blockResults.length}`,
  )
  lines.push(`- **Sources**: ${feedback.sourcesUsed.join(', ')}`)

  if (feedback.weakAreas.length > 0) {
    lines.push(`- **Weak areas**: ${feedback.weakAreas.slice(0, 5).join(', ')}`)
  }
  if (feedback.strongAreas.length > 0) {
    lines.push(`- **Strong areas**: ${feedback.strongAreas.slice(0, 5).join(', ')}`)
  }

  // Source breakdown
  const breakdownParts = Object.entries(feedback.blockBreakdown)
    .map(([source, avg]) => `${source}: ${avg}%`)
    .join(', ')
  if (breakdownParts) {
    lines.push(`- **By source**: ${breakdownParts}`)
  }

  // AI tutor note
  if (feedback.weakAreas.length > 0 && feedback.strongAreas.length > 0) {
    lines.push(
      `- **Note**: Student struggles with ${feedback.weakAreas.length} concept(s) but excels at ${feedback.strongAreas.length} concept(s).`,
    )
  } else if (feedback.weakAreas.length > 0) {
    lines.push(
      `- **Note**: Student needs more practice on ${feedback.weakAreas.length} concept(s).`,
    )
  } else if (feedback.overallAccuracy >= 90) {
    lines.push(`- **Note**: Excellent performance across all concepts.`)
  }

  return lines.join('\n')
}
