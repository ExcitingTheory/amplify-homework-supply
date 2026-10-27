/**
 * AI mention parser for peer review chat rooms.
 *
 * Detects `@kai` mentions in chat messages and extracts the question text.
 * Kai is the AI teaching assistant's name across the app. Case-insensitive;
 * handles @kai at the start, middle, or end of a message. `@kaiser` and
 * addresses like `bob@kai.com` are not mentions.
 *
 * @module aiMentionParser
 */

// ============================================================================
// Types
// ============================================================================

export interface AIMentionResult {
  hasAIMention: boolean
  question: string
  originalMessage: string
}

// ============================================================================
// Parser Functions
// ============================================================================

/** The handle people type to address the AI assistant. */
export const AI_MENTION_HANDLE = '@kai'

/** `@kai` as a whole word that does not follow a word character or dot. */
const MENTION_SOURCE = '(?<![\\w.])@kai\\b'

/**
 * Check if a message contains a @kai mention.
 */
export function hasAIMention(message: string): boolean {
  if (!message) return false
  return new RegExp(MENTION_SOURCE, 'i').test(message)
}

/**
 * Extract the question text around @kai mentions.
 *
 * If @kai appears multiple times, concatenates all question parts.
 * If @kai has no text with it, returns an empty string.
 *
 * Examples:
 * - "@kai what about this?" → "what about this?"
 * - "Hey @kai can you explain?" → "Hey can you explain?"
 * - "Check @kai this part and @kai that part" → "Check this part and that part"
 * - "@kai" → ""
 */
export function extractAIQuestion(message: string): string {
  if (!message) return ''

  return message
    .replace(new RegExp(`${MENTION_SOURCE}\\s*`, 'gi'), '')
    .trim()
}

/**
 * Parse a message for @kai mentions and extract the question.
 * This is the main entry point for the parser.
 */
export function parseAIMention(message: string): AIMentionResult {
  const mentioned = hasAIMention(message)
  return {
    hasAIMention: mentioned,
    question: mentioned ? extractAIQuestion(message) : '',
    originalMessage: message || '',
  }
}
