/**
 * Student memory document parser — parses and manipulates the markdown-formatted
 * per-student memory document that gets injected into AI system prompts.
 *
 * @module memoryParser
 */

// ============================================================================
// Types
// ============================================================================

export interface StudentMemorySections {
  learningProfile: string
  demonstratedStrengths: string
  recurringMistakes: string
  recentFeedbackHistory: string[]
  nailedItMoments: string[]
  aiTutorNotes: string
}

export interface FeedbackEntry {
  assignment: string
  block: string
  summary: string
}

// ============================================================================
// Constants
// ============================================================================

const MAX_RECENT_HISTORY = 10
const SOFT_SIZE_CAP = 4096 // 4KB

// ============================================================================
// Parser Functions
// ============================================================================

/**
 * Parse a student memory markdown document into structured sections.
 * Returns null values for missing sections.
 */
export function parseMemoryMarkdown(markdown: string | null | undefined): StudentMemorySections {
  const empty: StudentMemorySections = {
    learningProfile: '',
    demonstratedStrengths: '',
    recurringMistakes: '',
    recentFeedbackHistory: [],
    nailedItMoments: [],
    aiTutorNotes: '',
  }

  if (!markdown || markdown.trim() === '') return empty

  const sections: StudentMemorySections = { ...empty }

  const sectionMap: Record<string, keyof StudentMemorySections> = {
    'learning profile': 'learningProfile',
    'demonstrated strengths': 'demonstratedStrengths',
    'recurring mistakes': 'recurringMistakes',
    'recent feedback history': 'recentFeedbackHistory',
    'nailed it moments': 'nailedItMoments',
    'notes for ai tutor': 'aiTutorNotes',
  }

  /**
   * Normalize a heading name by stripping parenthetical suffixes,
   * e.g. "Recent Feedback History (Last 10 Interactions)" → "recent feedback history"
   */
  function normalizeHeading(name: string): string {
    return name.replace(/\s*\(.*\)\s*$/, '').toLowerCase().trim()
  }

  // Split by ## headings
  const headingRegex = /^## (.+)$/gm
  const headings: { name: string; start: number; end?: number }[] = []
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(markdown)) !== null) {
    if (headings.length > 0) {
      headings[headings.length - 1].end = match.index
    }
    headings.push({ name: match[1].trim(), start: match.index + match[0].length })
  }
  if (headings.length > 0) {
    headings[headings.length - 1].end = markdown.length
  }

  for (const heading of headings) {
    const key = sectionMap[normalizeHeading(heading.name)]
    if (!key) continue

    const content = markdown.slice(heading.start, heading.end).trim()

    if (key === 'recentFeedbackHistory' || key === 'nailedItMoments') {
      // Parse as list items
      const items = content
        .split('\n')
        .map((line) => line.replace(/^-\s*/, '').trim())
        .filter((line) => line.length > 0)
      sections[key] = items
    } else {
      sections[key] = content
    }
  }

  return sections
}

/**
 * Trim the recent feedback history to the last N entries.
 */
export function trimFeedbackHistory(
  entries: string[],
  maxEntries: number = MAX_RECENT_HISTORY,
): string[] {
  if (entries.length <= maxEntries) return entries
  return entries.slice(entries.length - maxEntries)
}

/**
 * Append a new feedback entry to the end of the history section.
 */
export function appendFeedbackEntry(
  markdown: string,
  entry: FeedbackEntry,
): string {
  const entryLine = `- ${entry.assignment}, ${entry.block}: ${entry.summary}`
  const sectionHeader = '## Recent Feedback History'

  const headerIndex = markdown.indexOf(sectionHeader)
  if (headerIndex === -1) {
    // Section doesn't exist — append it
    return markdown.trimEnd() + `\n\n${sectionHeader}\n${entryLine}\n`
  }

  // Find the next ## heading after the feedback section
  const afterHeader = headerIndex + sectionHeader.length
  const nextSectionMatch = markdown.slice(afterHeader).match(/\n## /)
  const insertPos = nextSectionMatch
    ? afterHeader + nextSectionMatch.index!
    : markdown.length

  // Insert entry just before the next section
  const beforeInsert = markdown.slice(0, insertPos).trimEnd()
  const afterInsert = markdown.slice(insertPos)

  return beforeInsert + '\n' + entryLine + afterInsert
}

/**
 * Extract "Nailed It" moments from the memory document.
 */
export function extractNailedItMoments(markdown: string | null | undefined): string[] {
  if (!markdown) return []
  const sections = parseMemoryMarkdown(markdown)
  return sections.nailedItMoments
}

/**
 * Estimate the byte size of a memory document.
 */
export function estimateSize(markdown: string): number {
  return new TextEncoder().encode(markdown).length
}

/**
 * Check if a memory document exceeds the soft size cap.
 * If so, trims the feedback history to fit.
 */
export function trimToFitSizeCap(
  markdown: string,
  cap: number = SOFT_SIZE_CAP,
): string {
  if (estimateSize(markdown) <= cap) return markdown

  const sections = parseMemoryMarkdown(markdown)
  let history = sections.recentFeedbackHistory

  // Progressively trim history until we fit
  while (history.length > 1) {
    history = history.slice(1) // Remove oldest entry

    // Rebuild the history section
    const sectionHeader = '## Recent Feedback History'
    const headerIndex = markdown.indexOf(sectionHeader)
    if (headerIndex === -1) break

    const afterHeader = headerIndex + sectionHeader.length
    const nextSectionMatch = markdown.slice(afterHeader).match(/\n## /)
    const sectionEnd = nextSectionMatch
      ? afterHeader + nextSectionMatch.index!
      : markdown.length

    const newHistoryContent = history.map((e) => `- ${e}`).join('\n')
    markdown =
      markdown.slice(0, headerIndex) +
      sectionHeader +
      '\n' +
      newHistoryContent +
      '\n' +
      markdown.slice(sectionEnd)

    if (estimateSize(markdown) <= cap) break
  }

  return markdown
}

/**
 * Create an initial memory document for a new student.
 */
export function createInitialMemory(studentName: string, cohortName?: string): string {
  return `# Student Memory: ${studentName}
Last Updated: ${new Date().toISOString()}

## Learning Profile
- Cohort: ${cohortName || 'Unassigned'}
- Current Level: Beginner (Level 1)
- Assignments Completed: 0
- Average Revision Rate: N/A

## Demonstrated Strengths
No data yet — this is the student's first session.

## Recurring Mistakes
No patterns detected yet.

## Recent Feedback History (Last ${MAX_RECENT_HISTORY} Interactions)

## Nailed It Moments

## Notes for AI Tutor
- New student — gather baseline data from first few submissions.
`
}
