import type { VocabularyCandidate, VocabularySourcePage } from "../documentAnalysis/vocabularySelection.js";

export const NATIVE_SELECTOR_VERSION = "stanza-wordfreq-v1";
export const NATIVE_LANGUAGES = ["es", "fr", "de", "pt", "it", "zh", "ja", "ar"] as const;
export type VocabularyLanguage = typeof NATIVE_LANGUAGES[number];
export const CHUNK_CHARACTERS = 12_000;

export function vocabularyLanguage(value: unknown): VocabularyLanguage {
  if (typeof value !== "string" || !NATIVE_LANGUAGES.some((language) => language === value)) {
    throw new Error("hybrid-native requires vocabularyLanguage: es, fr, de, pt, it, zh, ja, or ar");
  }
  return value as VocabularyLanguage;
}

export function* chunkVocabularyPage(page: VocabularySourcePage, language: string, limit = CHUNK_CHARACTERS) {
  if (!Number.isInteger(limit) || limit < 128) throw new Error("Vocabulary chunk limit must be at least 128 characters");
  const segmenter = new Intl.Segmenter(language, { granularity: "sentence" });
  let text = "";
  for (const { segment } of segmenter.segment(page.text)) {
    if (text.length + segment.length <= limit) {
      text += segment;
      continue;
    }
    if (text) yield { pageNumber: page.pageNumber, text, splitSentence: false };
    text = segment;
    while (text.length > limit) {
      let end = limit;
      const whitespace = text.lastIndexOf(" ", limit);
      if (whitespace >= limit / 2) end = whitespace + 1;
      if (/[\uD800-\uDBFF]/.test(text[end - 1])) end -= 1;
      yield { pageNumber: page.pageNumber, text: text.slice(0, end), splitSentence: true };
      text = text.slice(end);
    }
  }
  if (text) yield { pageNumber: page.pageNumber, text, splitSentence: false };
}

export function parseCandidates(value: unknown): VocabularyCandidate[] {
  if (!Array.isArray(value)) throw new Error("Native vocabulary worker returned no candidate array");
  return value.map((entry: unknown) => {
    if (!entry || typeof entry !== "object") throw new Error("Invalid native vocabulary candidate");
    const item = entry as Record<string, unknown>;
    for (const field of ["term", "lemma", "sourceText"] as const) {
      if (typeof item[field] !== "string" || !item[field].trim()) throw new Error(`Invalid vocabulary ${field}`);
    }
    for (const field of ["documentCount", "frequencyPerMillion", "score"] as const) {
      if (typeof item[field] !== "number" || !Number.isFinite(item[field]) || item[field] < 0) {
        throw new Error(`Invalid vocabulary ${field}`);
      }
    }
    if (!Number.isInteger(item.page) || Number(item.page) < 1 ||
        !Number.isInteger(item.documentCount) || Number(item.documentCount) < 1 ||
        !Array.isArray(item.reasons) || !item.reasons.every((reason: unknown) => typeof reason === "string") ||
        (item.sourceDefinition !== undefined && typeof item.sourceDefinition !== "string")) {
      throw new Error("Invalid native vocabulary provenance");
    }
    return {
      term: String(item.term), lemma: String(item.lemma), sourceText: String(item.sourceText),
      page: Number(item.page), documentCount: Number(item.documentCount),
      frequencyPerMillion: Number(item.frequencyPerMillion), score: Number(item.score),
      reasons: item.reasons,
      ...(typeof item.sourceDefinition === "string" ? { sourceDefinition: item.sourceDefinition } : {}),
    };
  });
}
