/**
 * Nailed It parser — extracts AI feedback envelope containing the nailedIt flag,
 * reason text, and XP award from AI responses.
 *
 * AI responses are expected in a JSON envelope format:
 * ```json
 * {
 *   "feedback": "Your analysis is excellent...",
 *   "nailedIt": true,
 *   "nailedItReason": "Exceptional depth of analysis on photosynthesis",
 *   "xpToAward": 20
 * }
 * ```
 *
 * @module nailedItParser
 */

// ============================================================================
// Types
// ============================================================================

export interface NailedItResult {
  feedback: string
  nailedIt: boolean
  nailedItReason: string | null
  xpToAward: number
}

// ============================================================================
// Constants
// ============================================================================

const NAILED_IT_XP = 20

// ============================================================================
// Parser Functions
// ============================================================================

/**
 * Parse the AI response envelope to extract feedback and nailedIt status.
 *
 * Supports two formats:
 * 1. Full JSON envelope: `{"feedback": "...", "nailedIt": true, ...}`
 * 2. Code-fenced block at end of text response:
 *    ```nailed-it
 *    {"nailedIt": true, "nailedItReason": "...", "xpToAward": 50}
 *    ```
 *
 * If no nailed-it signal is found, returns plain feedback with nailedIt = false.
 */
export function parseNailedItResponse(response: string): NailedItResult {
  const fallback: NailedItResult = {
    feedback: response,
    nailedIt: false,
    nailedItReason: null,
    xpToAward: 0,
  }

  if (!response || response.trim() === '') {
    return { ...fallback, feedback: '' }
  }

  const trimmed = response.trim()

  // Format 2: Code-fenced block — ```nailed-it ... ```
  const fenceMatch = trimmed.match(/```nailed-it\s*\n([\s\S]*?)\n\s*```/)
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim())
      const nailedIt = parsed.nailedIt === true
      // Extract the text before the code fence as feedback
      const feedbackText = trimmed.slice(0, trimmed.indexOf('```nailed-it')).trim()
      return {
        feedback: feedbackText || response,
        nailedIt,
        nailedItReason: nailedIt && typeof parsed.nailedItReason === 'string'
          ? parsed.nailedItReason
          : null,
        xpToAward: nailedIt ? NAILED_IT_XP : 0,
      }
    } catch {
      // Invalid JSON in fence — treat as plain text
      return fallback
    }
  }

  // Format 1: Full JSON envelope
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)

      if (typeof parsed.feedback !== 'string') {
        return fallback
      }

      const nailedIt = parsed.nailedIt === true
      return {
        feedback: parsed.feedback,
        nailedIt,
        nailedItReason: nailedIt && typeof parsed.nailedItReason === 'string'
          ? parsed.nailedItReason
          : null,
        xpToAward: nailedIt ? NAILED_IT_XP : 0,
      }
    } catch {
      // Invalid JSON — treat as plain text
      return fallback
    }
  }

  // Not JSON — plain text feedback
  return fallback
}

/**
 * Check if a parsed result qualifies as a "Nailed It" block.
 */
export function isNailedIt(result: NailedItResult): boolean {
  return result.nailedIt === true
}
