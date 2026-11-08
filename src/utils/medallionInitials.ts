const MAX_WORDS_SCANNED = 5;
const MAX_LETTERS = 2;
const ALPHANUMERIC = /[\p{L}\p{N}]/u;

/**
 * Builds the 1–2 letter charge shown on medallions (crests, avatars, pills).
 *
 * Only the first five whitespace-separated tokens are considered. Tokens made
 * purely of punctuation (e.g. "&", "-") are kept as-is but do not count toward
 * the two uppercase letters, so "Cats & Dogs" becomes "C&D".
 */
export function getMedallionInitials(name: string): string {
  const tokens = name.trim().split(/\s+/).slice(0, MAX_WORDS_SCANNED);
  let letters = 0;
  let result = "";

  for (const token of tokens) {
    const letter = token.match(ALPHANUMERIC)?.[0];
    if (!letter) {
      result += token;
    } else if (letters < MAX_LETTERS) {
      result += letter.toUpperCase();
      letters += 1;
    }
  }

  return result;
}
