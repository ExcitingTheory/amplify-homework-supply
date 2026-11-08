/**
 * Term normalisation for matching words and phrases that differ only in
 * presentation: case, Latin diacritics, punctuation, spacing and plurals.
 *
 * Mirrors `normaliseTerm` in amplify/functions/documentAnalysis/analysis.ts
 * (no cross-boundary imports between amplify/ and src/);
 * test/unit/termNormalisation.test.ts runs the same cases against both.
 */

export const IRREGULAR_PLURALS: Readonly<Record<string, string>> = {
  children: "child",
  people: "person",
  men: "man",
  women: "woman",
  mice: "mouse",
  feet: "foot",
  teeth: "tooth",
  geese: "goose",
  criteria: "criterion",
  phenomena: "phenomenon",
  analyses: "analysis",
  hypotheses: "hypothesis",
  theses: "thesis",
};

/** Words whose trailing "s" is part of the singular. */
const INVARIANT = new Set(["news", "series", "species", "means"]);

export function normaliseTerm(term: string): string {
  // Only Latin diacritics are folded away; combining marks in other scripts
  // (e.g. Japanese dakuten) are part of the letters and must survive.
  const normalized = term
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized
    .split(" ")
    .map((token) => {
      if (Object.hasOwn(IRREGULAR_PLURALS, token)) {
        return IRREGULAR_PLURALS[token];
      }
      if (INVARIANT.has(token) || token.length < 4) return token;
      if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
      if (/(ches|shes|sses|xes|zes)$/.test(token)) return token.slice(0, -2);
      if (token.endsWith("s") && !/(ss|us|is)$/.test(token)) {
        return token.slice(0, -1);
      }
      return token;
    })
    .join(" ");
}
