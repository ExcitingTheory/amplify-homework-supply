/**
 * AI mention parser for peer review chat rooms.
 *
 * Detects `@AI` mentions in chat messages and extracts the question text.
 * Case-insensitive. Handles @AI at start, middle, or end of message.
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

/**
 * Pattern that matches @AI (case-insensitive) followed by optional text.
 * Captures the text after @AI as the question.
 */
const AI_MENTION_PATTERN = /@ai\b\s*/gi

/**
 * Check if a message contains an @AI mention.
 */
export function hasAIMention(message: string): boolean {
  if (!message) return false
  return AI_MENTION_PATTERN.test(message.replace(AI_MENTION_PATTERN, '@AI'))
    ? true
    : /@ai\b/i.test(message)
}

/**
 * Extract the question text following an @AI mention.
 *
 * If @AI appears multiple times, concatenates all question parts.
 * If @AI has no text after it, returns an empty string.
 *
 * Examples:
 * - "@AI what about this?" → "what about this?"
 * - "Hey @AI can you explain?" → "can you explain?"
 * - "Check @AI this part and @AI that part" → "this part and that part"
 * - "@AI" → ""
 */
export function extractAIQuestion(message: string): string {
  if (!message) return ''

  // Replace @AI mentions and capture remaining text
  const cleaned = message
    .replace(/@ai\b\s*/gi, '')
    .trim()

  return cleaned
}

/**
 * Parse a message for @AI mentions and extract the question.
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
