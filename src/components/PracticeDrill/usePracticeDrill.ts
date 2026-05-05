/**
 * @fileoverview usePracticeDrill — Core hook for managing a practice drill
 * session lifecycle: generation, state tracking, saving, and XP award.
 */

import { useState, useCallback, useRef } from "react";
import { getAmplifyClient } from "../../utils/amplifyClient";
import {
  calculateDrillXP,
  calculateAccuracyBonus,
} from "../../utils/practiceXPCalculator";
import {
  buildFeedbackData,
  buildFeedbackMarkdown,
} from "./buildPracticeDrillFeedback";
import { updateUnitMemoryAndRebuild } from "../../utils/gamificationActions";
import type { DrillConfig } from "./PracticeDrillConfigPopup";

// ============================================================================
// Types
// ============================================================================

interface PracticeDrillBlock {
  type: string;
  instruction: string;
  sourceItemId: string;
  sourceType: string;
  expectedAnswer?: string;
  choices?: { choice: string; correct: boolean }[];
  pairs?: { term: string; definition: string }[];
  hint?: string;
  audio?: Record<string, any>;
  pronunciation?: {
    enabled: boolean;
    targetText: string;
    targetLanguage?: string;
    maxAttempts?: number;
  };
  documentRef?: { filename: string; page: number | string };
}

interface BlockAnswer {
  complete: boolean;
  accuracy: number;
  userAnswer?: string;
  pronunciation?: {
    bestScore: number;
    attempts: number;
    feedback: string;
    audioUrl?: string;
  };
}

interface SessionState {
  id: string | null;
  blocks: PracticeDrillBlock[];
  answers: Record<string, BlockAnswer>;
  accuracy: number;
  blocksCompleted: number;
  complete: boolean;
  xpAwarded: number;
  metadata?: Record<string, any>;
}

interface UsePracticeDrillReturn {
  /** Current session state */
  session: SessionState;
  /** Whether drill is being generated */
  generating: boolean;
  /** Whether drill is being saved */
  saving: boolean;
  /** Error message if any */
  error: string | null;
  /** Generate a new drill from the config */
  generateDrill: (unitId: string, config: DrillConfig) => Promise<void>;
  /** Submit an answer for a block */
  submitAnswer: (blockId: string, answer: BlockAnswer) => void;
  /** Mark session as complete and award XP */
  completeDrill: () => Promise<void>;
  /** Reset session */
  reset: () => void;
}

// ============================================================================
// Initial state
// ============================================================================

const INITIAL_SESSION: SessionState = {
  id: null,
  blocks: [],
  answers: {},
  accuracy: 0,
  blocksCompleted: 0,
  complete: false,
  xpAwarded: 0,
};

// ============================================================================
// Hook
// ============================================================================

export function usePracticeDrill(
  unitName: string = "",
): UsePracticeDrillReturn {
  const [session, setSession] = useState<SessionState>(INITIAL_SESSION);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const generateDrill = useCallback(
    async (unitId: string, config: DrillConfig) => {
      setGenerating(true);
      setError(null);

      try {
        const client = getAmplifyClient();

        // Call the Lambda mutation
        const { data, errors } = await client.mutations.generatePracticeDrill({
          unitId,
          drillType: config.drillType.toUpperCase(),
          count: config.count,
          sourcesEnabled: JSON.stringify(config.sources),
        });

        if (errors && errors.length > 0) {
          throw new Error(
            errors[0]?.message || "Failed to generate practice drill",
          );
        }

        const result = typeof data === "string" ? JSON.parse(data) : data;
        const blocks: PracticeDrillBlock[] = result.blocks || [];

        // Create PracticeSession record
        const { data: sessionRecord, errors: sessionErrors } =
          await client.models.PracticeSession.create({
            unitID: unitId,
            drillType: config.drillType.toUpperCase() as
              | "MIXED"
              | "VOCABULARY"
              | "COMPREHENSION"
              | "REVIEW",
            blockCount: blocks.length,
            blocksCompleted: 0,
            complete: false,
            xpAwarded: 0,
            generatedContent: JSON.stringify(blocks),
            sourcesEnabled: config.sources as any,
            data: JSON.stringify({}),
          });

        if (sessionErrors && sessionErrors.length > 0) {
          console.error(
            "[usePracticeDrill] Failed to create session record:",
            sessionErrors,
          );
        }

        const sessionId = sessionRecord?.id || `local-${Date.now()}`;
        sessionIdRef.current = sessionId;

        setSession({
          id: sessionId,
          blocks,
          answers: {},
          accuracy: 0,
          blocksCompleted: 0,
          complete: false,
          xpAwarded: 0,
          metadata: result.metadata,
        });
      } catch (err: any) {
        console.error("[usePracticeDrill] Generation error:", err);
        setError(err.message || "Failed to generate drill");
      } finally {
        setGenerating(false);
      }
    },
    [],
  );

  const submitAnswer = useCallback(
    (blockId: string, answer: BlockAnswer) => {
      setSession((prev) => {
        const newAnswers = { ...prev.answers, [blockId]: answer };
        const completed = Object.values(newAnswers).filter(
          (a) => a.complete,
        ).length;
        const accuracies = Object.values(newAnswers)
          .filter((a) => a.complete)
          .map((a) => a.accuracy);
        const avgAccuracy =
          accuracies.length > 0
            ? Math.round(
                accuracies.reduce((s, v) => s + v, 0) / accuracies.length,
              )
            : 0;

        return {
          ...prev,
          answers: newAnswers,
          blocksCompleted: completed,
          accuracy: avgAccuracy,
        };
      });

      // Persist to DynamoDB (fire and forget)
      if (sessionIdRef.current) {
        const client = getAmplifyClient();
        client.models.PracticeSession.update({
          id: sessionIdRef.current,
          data: JSON.stringify({ ...session.answers, [blockId]: answer }),
          blocksCompleted:
            Object.values(session.answers).filter((a) => a.complete).length + 1,
        }).catch((err: any) =>
          console.error("[usePracticeDrill] Save error:", err),
        );
      }
    },
    [session.answers],
  );

  const completeDrill = useCallback(async () => {
    setSaving(true);
    try {
      const client = getAmplifyClient();

      // Calculate XP (we'd need sessionsCompletedToday from server, approximate with 0 for now)
      const drillXP = calculateDrillXP(0);
      const accuracyBonus = calculateAccuracyBonus(session.accuracy);
      const totalXP = drillXP + accuracyBonus;

      // Update PracticeSession
      if (sessionIdRef.current) {
        await client.models.PracticeSession.update({
          id: sessionIdRef.current,
          complete: true,
          accuracy: session.accuracy,
          blocksCompleted: session.blocksCompleted,
          xpAwarded: totalXP,
          data: JSON.stringify(session.answers),
        });
      }

      // Create Grade record for this practice attempt
      const unitId = session.metadata?.unitId || "";
      let attemptNumber = 1;
      if (sessionIdRef.current) {
        try {
          const { data: existingGrades } =
            await client.models.Grade.listGradeByPracticeSessionID({
              practiceSessionID: sessionIdRef.current,
            });
          attemptNumber = (existingGrades?.length || 0) + 1;
        } catch (err) {
          console.error(
            "[usePracticeDrill] Failed to count existing attempts:",
            err,
          );
        }
      }

      try {
        await client.models.Grade.create({
          unitID: unitId,
          practiceSessionID: sessionIdRef.current || undefined,
          attempt: attemptNumber,
          data: JSON.stringify(session.answers),
          accuracy: session.accuracy,
          complete: true,
          percentComplete: 100,
        });
      } catch (err) {
        console.error("[usePracticeDrill] Grade creation error:", err);
      }

      // Build and send student memory feedback
      const feedbackData = buildFeedbackData(
        session.answers as any,
        session.blocks as any,
        unitName,
        session.metadata?.drillType || "mixed",
        session.metadata?.sourcesEnabled || {},
      );
      const feedbackMarkdown = buildFeedbackMarkdown(feedbackData);

      // Write insight fields directly onto PracticeSession (InstructorInsight model removed)
      try {
        if (sessionIdRef.current) {
          await client.models.PracticeSession.update({
            id: sessionIdRef.current,
            insightStudentId: "", // filled by owner auth
            weakAreas: feedbackData.weakAreas || [],
            strongAreas: feedbackData.strongAreas || [],
            sourcesUsedList: feedbackData.sourcesUsed || [],
            blockBreakdown: feedbackData.blockBreakdown || {},
            insightTimestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error(
          "[usePracticeDrill] PracticeSession insight update error:",
          err,
        );
      }

      // Update per-unit learning memory and rebuild central profile (fire-and-forget)
      if (unitId) {
        updateUnitMemoryAndRebuild(
          "", // studentId filled server-side via owner auth
          unitId,
          session.accuracy,
          feedbackData.weakAreas,
          feedbackData.strongAreas,
          {
            accuracyBySource: feedbackData.blockBreakdown,
            sourceType: session.metadata?.drillType || "practice",
          },
        ).catch((err: any) =>
          console.error(
            "[usePracticeDrill] updateUnitMemoryAndRebuild error:",
            err,
          ),
        );
      }

      setSession((prev) => ({
        ...prev,
        complete: true,
        xpAwarded: totalXP,
      }));
    } catch (err: any) {
      console.error("[usePracticeDrill] Completion error:", err);
      setError(err.message || "Failed to complete drill");
    } finally {
      setSaving(false);
    }
  }, [session, unitName]);

  const reset = useCallback(() => {
    setSession(INITIAL_SESSION);
    sessionIdRef.current = null;
    setError(null);
  }, []);

  return {
    session,
    generating,
    saving,
    error,
    generateDrill,
    submitAnswer,
    completeDrill,
    reset,
  };
}
