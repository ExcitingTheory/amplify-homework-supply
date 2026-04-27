/**
 * AIRouter — Transparent routing between cloud AI (GPT-4o) and on-device AI.
 *
 * Students don't need to think about connectivity. The router seamlessly
 * picks the best available backend:
 * 1. Online → cloud GPT-4o via existing Lambda/Vercel AI SDK
 * 2. Offline + on-device model available → OfflineChatEngine
 * 3. Offline + no model → heuristic fallback or graceful message
 */

import {
  offlineChatEngine,
  gradeAnswerHeuristic,
  type ChatMessage,
  type OfflineChatContext,
  type GradeResult,
} from './OfflineChatEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GradeParams {
  studentAnswer: string;
  expectedAnswer: string;
  prompt: string;
  type: 'definition' | 'shortAnswer' | 'word';
}

export interface AIRouterConfig {
  /** Force offline mode even when online (for testing) */
  preferOffline?: boolean;
}

// ── Router ────────────────────────────────────────────────────────────────────

class AIRouterImpl {
  private config: AIRouterConfig = {};

  configure(config: AIRouterConfig): void {
    this.config = config;
  }

  /**
   * Which backend will be used for the next request?
   */
  async getCurrentBackend(): Promise<'cloud' | 'on-device' | 'heuristic' | 'unavailable'> {
    if (this.isOnline() && !this.config.preferOffline) {
      return 'cloud';
    }
    if (await offlineChatEngine.isAvailable()) {
      return 'on-device';
    }
    return 'heuristic';
  }

  /**
   * Generate a streaming chat response, routing to the best available backend.
   *
   * For cloud chat, the caller should use their existing useChat / chatStream
   * integration. This generator is specifically for the offline path.
   */
  async *chat(
    messages: ChatMessage[],
    context: OfflineChatContext,
  ): AsyncGenerator<string> {
    if (this.isOnline() && !this.config.preferOffline) {
      // Caller should use the cloud chat path (useChat hook / chatStream).
      // This shouldn't normally be called when online, but provide a message
      // in case it is.
      yield 'Please use the online chat — you are connected to the internet.';
      return;
    }

    if (await offlineChatEngine.isAvailable()) {
      yield* offlineChatEngine.chat(messages, context);
      return;
    }

    yield "I'm currently offline and the AI model isn't available. Your work is being saved locally and will sync when you reconnect.";
  }

  /**
   * Grade a student answer, routing to cloud or on-device AI.
   */
  async gradeAnswer(params: GradeParams): Promise<GradeResult> {
    // Online → defer to cloud (caller handles the Lambda call)
    // This is only called when we need on-device grading
    if (await offlineChatEngine.isAvailable()) {
      return offlineChatEngine.gradeAnswer(params);
    }

    // Heuristic fallback — always available, no model needed
    return gradeAnswerHeuristic(params.expectedAnswer, params.studentAnswer);
  }

  /**
   * Check if the browser reports online connectivity.
   */
  private isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

export const aiRouter = new AIRouterImpl();
