import { useCallback, useEffect, useRef } from "react";
import { getAmplifyClient } from "../utils/amplifyClient";
import { addResponse } from "../utils/studentResponses";
import {
  fromGradeResponse,
  gradeResponseId,
  loadGradeResponse,
  toGradeResponseInput,
} from "../utils/gradeResponses";

/**
 * Saves what the student submitted for each question of one exercise block
 * as GradeResponse items (one typed item per question, see
 * amplify/data/resource.ts), separate from the grade's block data.
 *
 * Returns recordResponse(questionKey, record, { sameAttempt, attemptId }).
 * A matching attempt ID lets transcription update only its own recording.
 */
export function useResponseRecorder({ grade, blockKey, createGrade }) {
  const gradeRef = useRef(grade);
  gradeRef.current = grade;
  const resolvedGradeRef = useRef(grade?.id ? grade : null);
  const previousGradeIdRef = useRef(grade?.id);
  const previousBlockKeyRef = useRef(blockKey);
  // questionKey -> response record loaded or saved in this session
  const savedRef = useRef(new Map());
  // questionKey -> promise of the last write, to keep writes in order
  const queueRef = useRef(new Map());

  const gradeId = grade?.id;
  useEffect(() => {
    if (gradeId && resolvedGradeRef.current?.id === gradeId) {
      resolvedGradeRef.current = grade;
    } else if (
      gradeId !== previousGradeIdRef.current ||
      blockKey !== previousBlockKeyRef.current
    ) {
      savedRef.current = new Map();
      queueRef.current = new Map();
      resolvedGradeRef.current = gradeId ? grade : null;
    }
    previousGradeIdRef.current = gradeId;
    previousBlockKeyRef.current = blockKey;
  }, [grade, gradeId, blockKey]);

  const ensureGrade = useCallback(async () => {
    const currentGrade = gradeRef.current;
    if (currentGrade?.id) {
      resolvedGradeRef.current = currentGrade;
      return currentGrade;
    }
    if (resolvedGradeRef.current?.id) return resolvedGradeRef.current;
    if (typeof createGrade !== "function") {
      throw new Error("Cannot save a student response before its grade exists");
    }
    const created = await createGrade(0, false, undefined, false);
    if (!created?.id) {
      throw new Error("Creating a grade for the student response failed");
    }
    resolvedGradeRef.current = created;
    return created;
  }, [createGrade]);

  return useCallback(
    (questionKey, record, options) => {
      if (!blockKey || questionKey == null || !record) {
        return Promise.resolve();
      }
      const key = String(questionKey);
      const saved = savedRef.current;
      const previous = queueRef.current.get(key) || Promise.resolve();

      const write = previous
        .catch(() => {})
        .then(async () => {
          const currentGrade = await ensureGrade();
          const client = getAmplifyClient();
          const id = gradeResponseId(currentGrade.id, blockKey, key);
          let entry = saved.get(key);
          if (!entry) {
            const existing = await loadGradeResponse(client, id);
            entry = {
              record: existing ? fromGradeResponse(existing) : null,
            };
          }
          const merged = addResponse(
            entry.record ? { [key]: entry.record } : {},
            key,
            record,
            options,
          )[key];
          const { data, errors } = await client.mutations.saveStudentResponse({
            gradeId: currentGrade.id,
            blockKey,
            questionKey: key,
            response: toGradeResponseInput(merged, {
              grade: currentGrade,
              blockKey,
              questionKey: key,
            }),
          });
          if (errors?.length || data !== true) {
            throw new Error(
              errors?.[0]?.message || "Saving the student response failed",
            );
          }
          saved.set(key, { record: merged });
        });

      queueRef.current.set(key, write);
      return write.catch((error) => {
        console.error("[useResponseRecorder] Saving the answer failed:", error);
      });
    },
    [blockKey, ensureGrade],
  );
}
