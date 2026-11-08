/**
 * Finding a question the instructor has already written.
 *
 * Applies the rules the document analysis uses, so a question the browser
 * flags as a near-duplicate is one the analysis would have matched too.
 */
import { answersAreSimilar, answersConflict } from "./contentSimilarity";
import { normaliseTerm } from "./termNormalisation";

export interface BankQuestion {
  id: string;
  prompt?: string | null;
  answer?: string | null;
  deletedAt?: string | null;
}

export type SimilarQuestionKind = "duplicate" | "variation" | "conflict";

export interface SimilarQuestion {
  question: BankQuestion;
  /**
   * - duplicate: the same question with the same answer.
   * - variation: the same question worded differently, or a reworded answer.
   * - conflict: the same question answered differently, which is worth seeing
   *   before a second, contradictory copy is written.
   */
  kind: SimilarQuestionKind;
}

const text = (value: string | null | undefined) => (typeof value === "string" ? value : "");

/**
 * Questions already in the bank that the given draft restates, most alike
 * first. A draft with no prompt matches nothing.
 *
 * `exceptId` leaves out the question being edited, so editing its own wording
 * does not report it against itself.
 */
export function findSimilarQuestions(
  draft: { prompt?: string | null; answer?: string | null },
  bank: BankQuestion[],
  { exceptId, limit = 3 }: { exceptId?: string; limit?: number } = {},
): SimilarQuestion[] {
  const prompt = text(draft.prompt).trim();
  if (!prompt) return [];
  const answer = text(draft.answer);
  const normalisedPrompt = normaliseTerm(prompt);
  if (!normalisedPrompt) return [];

  const matches: SimilarQuestion[] = [];
  for (const question of bank) {
    if (question.deletedAt != null || question.id === exceptId) continue;
    const existingPrompt = text(question.prompt);
    if (!existingPrompt) continue;
    const samePrompt = normaliseTerm(existingPrompt) === normalisedPrompt;
    if (!samePrompt && !answersAreSimilar(prompt, existingPrompt)) continue;

    const existingAnswer = text(question.answer);
    let kind: SimilarQuestionKind;
    if (!answer || !existingAnswer) {
      kind = samePrompt ? "duplicate" : "variation";
    } else if (answersConflict(answer, existingAnswer)) {
      kind = "conflict";
    } else if (samePrompt && normaliseTerm(answer) === normaliseTerm(existingAnswer)) {
      kind = "duplicate";
    } else if (answersAreSimilar(answer, existingAnswer)) {
      kind = samePrompt ? "duplicate" : "variation";
    } else {
      kind = "conflict";
    }
    matches.push({ question, kind });
  }

  const rank: Record<SimilarQuestionKind, number> = { duplicate: 0, conflict: 1, variation: 2 };
  return matches.sort((a, b) => rank[a.kind] - rank[b.kind]).slice(0, limit);
}
