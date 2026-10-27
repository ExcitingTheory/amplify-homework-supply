/**
 * Unit, Grade, Word and Question each expose `moderation` as a typed object
 * (UnitModeration, GradeModeration, ...), so a mutation must select its
 * sub-fields. `flags` is AWSJSON and is sent and returned as a JSON string.
 * test/unit/typedLists/ checks these against ModerationInfo in
 * amplify/data/resource.ts.
 */
export const MODERATION_SELECTION = "moderation { status flags checkedAt }";

export interface ModerationResultInput {
  flagged: boolean;
  categories: unknown;
  categoryScores: unknown;
  model: string;
}

export interface ModerationFieldInput {
  status: "flagged" | "approved";
  flags: string | null;
  checkedAt: string;
}

/** Build the `moderation` input object: only declared fields, `flags` as an AWSJSON string. */
export function buildModerationField(
  result: ModerationResultInput,
  now: Date = new Date(),
): ModerationFieldInput {
  return {
    status: result.flagged ? "flagged" : "approved",
    flags: result.flagged
      ? JSON.stringify({
          categories: result.categories,
          categoryScores: result.categoryScores,
          model: result.model,
        })
      : null,
    checkedAt: now.toISOString(),
  };
}
