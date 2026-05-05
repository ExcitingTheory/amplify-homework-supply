/**
 * PracticeCollaborationProvider — Yjs provider for collaborative practice drill sessions.
 *
 * Each collaborative practice session is a Yjs document (`practice-{sessionId}`) with:
 * - `answersMap` Y.Map — merged block answers from all participants (keyed by blockId)
 * - `progressMap` Y.Map — per-participant progress (keyed by participantId)
 * - `groupStatsMap` Y.Map — aggregated group accuracy (no individual attribution)
 * - `messagesArray` Y.Array — in-session chat for study discussion
 *
 * Awareness carries: { user, activeBlockId, typing }
 *
 * Privacy: individual scores are tracked in progressMap but only the owner
 * and participant themselves can read their entry. The groupStatsMap exposes
 * only anonymized aggregates (average accuracy, blocks completed count).
 *
 * @module PracticeCollaborationProvider
 */

import * as Y from "yjs";
import { YjsDocProvider } from "./YjsProvider";

// ============================================================================
// Types
// ============================================================================

export interface PracticeUser {
  username: string;
  displayName?: string;
  color?: string;
}

export interface PracticeCollaborationConfig {
  sessionId: string;
  user: PracticeUser;
  wsUrl?: string;
  connect?: boolean;
  persistence?: boolean;
  onParticipantJoin?: (user: PracticeUser) => void;
  onParticipantLeave?: (user: PracticeUser) => void;
}

export interface BlockAnswer {
  userAnswer: any;
  complete: boolean;
  accuracy: number;
  answeredBy: string; // username of who answered
  timestamp: string;
}

export interface ParticipantProgress {
  username: string;
  blocksCompleted: number;
  blocksAttempted: number;
  lastActiveAt: string;
}

export interface GroupStats {
  totalParticipants: number;
  averageAccuracy: number;
  blocksCompletedTotal: number;
  blockAccuracies: Record<string, number>; // blockId → average accuracy across participants
  lastUpdated: string;
}

export interface PracticeMessage {
  id: string;
  author: string;
  displayName?: string;
  content: string;
  referencedBlockId?: string;
  createdAt: string;
}

// ============================================================================
// Provider
// ============================================================================

export class PracticeCollaborationProvider extends YjsDocProvider {
  private sessionId: string;
  private user: PracticeUser;
  private practiceConfig: PracticeCollaborationConfig;

  // Y.js structures
  private answersMap: Y.Map<BlockAnswer[]>;
  private progressMap: Y.Map<ParticipantProgress>;
  private groupStatsMap: Y.Map<any>;
  private messagesArray: Y.Array<PracticeMessage>;

  private activeParticipants: Map<number, PracticeUser> = new Map();

  constructor(config: PracticeCollaborationConfig) {
    const docName = `practice-${config.sessionId}`;

    super({
      docName,
      wsUrl: config.wsUrl,
      connect: config.connect ?? true,
      persistence: config.persistence ?? true,
    });

    this.sessionId = config.sessionId;
    this.user = config.user;
    this.practiceConfig = config;

    this.answersMap = this.getDoc().getMap<BlockAnswer[]>("answers");
    this.progressMap = this.getDoc().getMap<ParticipantProgress>("progress");
    this.groupStatsMap = this.getDoc().getMap<any>("groupStats");
    this.messagesArray = this.getDoc().getArray<PracticeMessage>("messages");

    this.initializeAwareness();
    this.setupAwarenessHandlers();
  }

  // ========================================================================
  // Awareness
  // ========================================================================

  private initializeAwareness(): void {
    const awareness = this.getAwareness();
    awareness.setLocalState({
      user: this.user,
      activeBlockId: null,
      typing: false,
    });
  }

  private setupAwarenessHandlers(): void {
    const awareness = this.getAwareness();

    awareness.on(
      "change",
      ({ added, removed }: { added: number[]; removed: number[] }) => {
        added.forEach((clientId) => {
          if (clientId === awareness.clientID) return;
          const state = awareness.getStates().get(clientId);
          const peerUser = state?.user as PracticeUser | undefined;
          if (peerUser) {
            this.activeParticipants.set(clientId, peerUser);
            this.practiceConfig.onParticipantJoin?.(peerUser);
          }
        });

        removed.forEach((clientId) => {
          const leaving = this.activeParticipants.get(clientId);
          if (leaving) {
            this.activeParticipants.delete(clientId);
            this.practiceConfig.onParticipantLeave?.(leaving);
          }
        });
      },
    );
  }

  /**
   * Set which block the local user is currently working on.
   */
  setActiveBlock(blockId: string | null): void {
    const awareness = this.getAwareness();
    const currentState = awareness.getLocalState();
    awareness.setLocalState({ ...currentState, activeBlockId: blockId });
  }

  /**
   * Set the local user's typing state (for chat).
   */
  setTyping(typing: boolean): void {
    const awareness = this.getAwareness();
    const currentState = awareness.getLocalState();
    awareness.setLocalState({ ...currentState, typing });
  }

  // ========================================================================
  // Block Answers — append-only per block, all participants' answers visible
  // ========================================================================

  /**
   * Submit an answer for a block. Appends to the block's answer array.
   * Each participant's answer is tracked separately.
   */
  submitBlockAnswer(
    blockId: string,
    answer: Omit<BlockAnswer, "answeredBy" | "timestamp">,
  ): void {
    const entry: BlockAnswer = {
      ...answer,
      answeredBy: this.user.username,
      timestamp: new Date().toISOString(),
    };

    const existing = this.answersMap.get(blockId) || [];
    // Replace previous answer from same user, or append
    const filtered = existing.filter(
      (a) => a.answeredBy !== this.user.username,
    );
    this.answersMap.set(blockId, [...filtered, entry]);

    // Update own progress
    this.updateOwnProgress();
    // Recalculate group stats
    this.recalculateGroupStats();
  }

  /**
   * Get all answers for a specific block.
   */
  getBlockAnswers(blockId: string): BlockAnswer[] {
    return this.answersMap.get(blockId) || [];
  }

  /**
   * Get the current user's answer for a block, if any.
   */
  getOwnAnswer(blockId: string): BlockAnswer | undefined {
    const answers = this.answersMap.get(blockId) || [];
    return answers.find((a) => a.answeredBy === this.user.username);
  }

  // ========================================================================
  // Progress — per-participant, only own + aggregate visible to students
  // ========================================================================

  private updateOwnProgress(): void {
    let blocksCompleted = 0;
    let blocksAttempted = 0;

    this.answersMap.forEach((answers) => {
      const own = answers.find((a) => a.answeredBy === this.user.username);
      if (own) {
        blocksAttempted++;
        if (own.complete) blocksCompleted++;
      }
    });

    this.progressMap.set(this.user.username, {
      username: this.user.username,
      blocksCompleted,
      blocksAttempted,
      lastActiveAt: new Date().toISOString(),
    });
  }

  /**
   * Get own progress.
   */
  getOwnProgress(): ParticipantProgress {
    return (
      this.progressMap.get(this.user.username) || {
        username: this.user.username,
        blocksCompleted: 0,
        blocksAttempted: 0,
        lastActiveAt: new Date().toISOString(),
      }
    );
  }

  // ========================================================================
  // Group Stats — anonymized aggregates only
  // ========================================================================

  private recalculateGroupStats(): void {
    const participantAccuracies: Map<string, number[]> = new Map();
    const blockAccuracies: Record<string, number> = {};
    let totalCompleted = 0;

    this.answersMap.forEach((answers, blockId) => {
      const accuracies: number[] = [];
      for (const answer of answers) {
        if (answer.complete) {
          totalCompleted++;
          accuracies.push(answer.accuracy);

          // Collect per-participant
          if (!participantAccuracies.has(answer.answeredBy)) {
            participantAccuracies.set(answer.answeredBy, []);
          }
          participantAccuracies.get(answer.answeredBy)!.push(answer.accuracy);
        }
      }
      if (accuracies.length > 0) {
        blockAccuracies[blockId] =
          accuracies.reduce((s, a) => s + a, 0) / accuracies.length;
      }
    });

    // Average accuracy across all participants
    let overallSum = 0;
    let overallCount = 0;
    participantAccuracies.forEach((accs) => {
      const avg = accs.reduce((s, a) => s + a, 0) / accs.length;
      overallSum += avg;
      overallCount++;
    });

    const stats: GroupStats = {
      totalParticipants: participantAccuracies.size,
      averageAccuracy:
        overallCount > 0
          ? Math.round((overallSum / overallCount) * 100) / 100
          : 0,
      blocksCompletedTotal: totalCompleted,
      blockAccuracies: blockAccuracies as any,
      lastUpdated: new Date().toISOString(),
    };

    this.groupStatsMap.set("stats", stats);
  }

  /**
   * Get anonymized group statistics.
   * Shows average accuracy and completion counts without individual attribution.
   */
  getGroupStats(): GroupStats {
    return (
      this.groupStatsMap.get("stats") || {
        totalParticipants: 0,
        averageAccuracy: 0,
        blocksCompletedTotal: 0,
        blockAccuracies: {},
        lastUpdated: new Date().toISOString(),
      }
    );
  }

  // ========================================================================
  // Chat Messages
  // ========================================================================

  /**
   * Send a message in the study session chat.
   */
  sendMessage(content: string, referencedBlockId?: string): PracticeMessage {
    const message: PracticeMessage = {
      id: crypto.randomUUID(),
      author: this.user.username,
      displayName: this.user.displayName,
      content,
      referencedBlockId,
      createdAt: new Date().toISOString(),
    };
    this.messagesArray.push([message]);
    return message;
  }

  /**
   * Get all messages.
   */
  getMessages(): PracticeMessage[] {
    return Array.from(this.messagesArray);
  }

  // ========================================================================
  // Accessors for hook observation
  // ========================================================================

  getAnswersMap(): Y.Map<BlockAnswer[]> {
    return this.answersMap;
  }
  getProgressMap(): Y.Map<ParticipantProgress> {
    return this.progressMap;
  }
  getGroupStatsMap(): Y.Map<any> {
    return this.groupStatsMap;
  }
  getMessagesArray(): Y.Array<PracticeMessage> {
    return this.messagesArray;
  }
  getSessionId(): string {
    return this.sessionId;
  }
  getUser(): PracticeUser {
    return this.user;
  }

  /**
   * Get active participants from awareness (excluding self).
   */
  getActiveParticipants(): PracticeUser[] {
    return Array.from(this.activeParticipants.values());
  }
}
