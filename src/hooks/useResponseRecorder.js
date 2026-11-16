import { useCallback, useEffect, useRef } from "react";
import { getAmplifyClient } from "../utils/amplifyClient";
import { addResponse } from "../utils/studentResponses";
import {
  fromGradeResponse,
  gradeResponseId,
  saveGradeResponse,
  toGradeResponseInput,
} from "../utils/gradeResponses";

/**
 * Saves what the student submitted for each question of one exercise block
 * as GradeResponse items (one typed item per question, see
 * amplify/data/resource.ts), separate from the grade's block data.
 *
 * Returns recordResponse(questionKey, record, { sameAttempt }), where record
 * comes from buildResponse(). Calls for the same question run in order, so a
 * recording saved before transcription and the transcript that follows land
 * on the same attempt. A new attempt moves the previous one into `history`.
 */
export function useResponseRecorder({ grade, blockKey }) {
  const gradeRef = useRef(grade);
  gradeRef.current = grade;
  // questionKey -> { record, exists } for answers saved in this session
  const savedRef = useRef(new Map());
  // questionKey -> promise of the last write, to keep writes in order
  const queueRef = useRef(new Map());

  const gradeId = grade?.id;
  useEffect(() => {
    savedRef.current = new Map();
    queueRef.current = new Map();
  }, [gradeId, blockKey]);

  return useCallback(
    (questionKey, record, options) => {
      const currentGrade = gradeRef.current;
      if (!currentGrade?.id || !blockKey || questionKey == null || !record) {
        return Promise.resolve();
      }
      const key = String(questionKey);
      const saved = savedRef.current;
      const previous = queueRef.current.get(key) || Promise.resolve();

      const write = previous
        .catch(() => {})
        .then(async () => {
          const client = getAmplifyClient();
          const id = gradeResponseId(currentGrade.id, blockKey, key);
          let entry = saved.get(key);
          if (!entry) {
            // First answer to this question in this session: pick up attempts
            // saved earlier (for example before a page reload).
            let existing = null;
            try {
              const { data } = await client.models.GradeResponse.get({ id });
              existing = data ?? null;
            } catch (error) {
              console.warn("[useResponseRecorder] Could not load earlier answer:", error);
            }
            entry = {
              record: existing ? fromGradeResponse(existing) : null,
              exists: !!existing,
            };
          }
          const merged = addResponse(
            entry.record ? { [key]: entry.record } : {},
            key,
            record,
            options,
          )[key];
          await saveGradeResponse(client, {
            id,
            input: toGradeResponseInput(merged, {
              grade: currentGrade,
              blockKey,
              questionKey: key,
            }),
            exists: entry.exists,
          });
          saved.set(key, { record: merged, exists: true });
        });

      queueRef.current.set(key, write);
      return write.catch((error) => {
        console.error("[useResponseRecorder] Saving the answer failed:", error);
      });
    },
    [blockKey],
  );
}
