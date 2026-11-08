/**
 * Comparing written content the way the document analysis does.
 *
 * An instructor writing a question often restates one the question bank
 * already holds. These rules decide when two texts say the same thing, so that
 * near-duplicate can be pointed out before another copy is created.
 *
 * Mirrors `answersAreSimilar` and `answersConflict` in
 * amplify/functions/documentAnalysis/analysis.ts (no cross-boundary imports
 * between amplify/ and src/); test/unit/contentSimilarity.test.ts runs the
 * same cases against both.
 */
import { normaliseTerm } from "./termNormalisation";

/** Share of the longer text that must be unchanged for two texts to read alike. */
const SIMILARITY = 0.85;
/** Shortest text compared by wording; below this only an exact match counts. */
const MIN_FUZZY_LENGTH = 3;

function hasNegation(text: string): boolean {
  return /\b(?:not|no|never|none|neither|nor|without|cannot)\b|n't/i.test(text);
}

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function isOrderedSubsequence(shorter: string[], longer: string[]): boolean {
  let next = 0;
  for (const token of longer) {
    if (token === shorter[next]) next += 1;
  }
  return next === shorter.length;
}

/** Texts that differ on a number or on negation state different things. */
export function answersConflict(left: string, right: string): boolean {
  const numbers = (text: string) =>
    normaliseTerm(text)
      .split(" ")
      .filter((token) => /\d/.test(token))
      .join(" ");
  return numbers(left) !== numbers(right) || hasNegation(left) !== hasNegation(right);
}

/**
 * Whether two texts say the same thing, judged on their words rather than
 * their exact characters: case, punctuation and plurals are ignored, one may
 * be a fuller version of the other, and small wording differences are
 * tolerated. Word order matters, since reordering a statement can reverse it.
 */
export function answersAreSimilar(left: string, right: string): boolean {
  const leftTokens = normaliseTerm(left).split(" ").filter(Boolean);
  const rightTokens = normaliseTerm(right).split(" ").filter(Boolean);
  if (leftTokens.length === 0 || rightTokens.length === 0) return false;
  const leftText = leftTokens.join(" ");
  const rightText = rightTokens.join(" ");
  if (leftText === rightText) return true;

  if (answersConflict(left, right)) return false;
  if (Math.min(leftText.length, rightText.length) < MIN_FUZZY_LENGTH) return false;

  const [shorter, longer] =
    leftTokens.length <= rightTokens.length ? [leftTokens, rightTokens] : [rightTokens, leftTokens];
  if (isOrderedSubsequence(shorter, longer)) return true;

  const distance = editDistance(leftText, rightText);
  return 1 - distance / Math.max(leftText.length, rightText.length) >= SIMILARITY;
}
