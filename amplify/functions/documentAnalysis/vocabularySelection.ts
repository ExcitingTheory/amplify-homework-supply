import winkNLP, { type ItemToken, type ItsFunction } from "wink-nlp";
import englishModel from "wink-eng-lite-web-model";
import frequencies from "subtlex-word-frequencies";
import { sourceDefinitions } from "./vocabularyGlossary.js";

export interface VocabularySourcePage {
  pageNumber: number;
  text: string;
}

export interface VocabularyCandidate {
  term: string;
  lemma: string;
  page: number;
  sourceText: string;
  sourceDefinition?: string;
  documentCount: number;
  corpusCount?: number;
  frequencyPerMillion: number;
  score: number;
  reasons: string[];
}

export const VOCABULARY_SELECTOR_VERSION = "english-subtlex-v1";
const MAX_RANKED_TERMS = 40;
const MAX_FREQUENCY_PER_MILLION = 20;
const normalise = (value: string) => value.normalize("NFKC").toLowerCase().trim();

export type VocabularySelection = "llm" | "hybrid-en" | "hybrid-native";

export function isHybridVocabulary(mode: VocabularySelection | undefined): boolean {
  return mode === "hybrid-en" || mode === "hybrid-native";
}

export function resolveVocabularySelection(settings: unknown): VocabularySelection {
  if (settings === "") return "llm";
  const parsed: unknown = typeof settings === "string" ? JSON.parse(settings) : settings;
  if (!parsed || typeof parsed !== "object" || !("vocabularySelection" in parsed)) return "llm";
  if (parsed.vocabularySelection === "hybrid-en") return "hybrid-en";
  if (parsed.vocabularySelection === "hybrid-native") return "hybrid-native";
  if (parsed.vocabularySelection === "llm" || parsed.vocabularySelection == null) return "llm";
  throw new Error(`Unsupported vocabularySelection: ${String(parsed.vocabularySelection)}`);
}

let nlp: ReturnType<typeof winkNLP> | undefined;
let corpus: { counts: Map<string, number>; total: number } | undefined;

function resources() {
  nlp ??= winkNLP(englishModel);
  if (!corpus) {
    const counts = new Map<string, number>();
    let total = 0;
    for (const { word, count } of frequencies) {
      const key = normalise(word);
      counts.set(key, (counts.get(key) ?? 0) + count);
      total += count;
    }
    if (!total) throw new Error("SUBTLEX frequency corpus is empty");
    corpus = { counts, total };
  }
  return { nlp, corpus };
}

/** Source-defined terms are mandatory; ranked prose terms are a bounded supplement. */
export function selectVocabulary(pages: VocabularySourcePage[]): VocabularyCandidate[] {
  const { nlp, corpus } = resources();
  const { its } = nlp;
  const words = new Map<string, { term: string; page: number; sourceText: string; count: number }>();
  const glossary = new Map(sourceDefinitions(pages).map((entry) => [normalise(entry.term), entry]));
  for (const page of pages) {
    const doc = nlp.readDoc(page.text);
    doc.tokens().each((token: ItemToken) => {
      const surface = token.out();
      if (token.out(its.stopWordFlag) === true ||
          !["NOUN", "ADJ", "VERB"].includes(String(token.out(its.pos))) ||
          !/^[a-z][a-z'-]{2,}$/i.test(surface)) return;
      // wink-nlp 2.4.0's lemma declaration omits the cache argument in ItsFunction.
      const lemma = normalise(String(token.out(its.lemma as ItsFunction<string>)));
      const previous = words.get(lemma);
      if (previous) previous.count += 1;
      else words.set(lemma, {
        term: surface, page: page.pageNumber, sourceText: token.parentSentence().out(), count: 1,
      });
    });
  }

  const candidate = (
    term: string, lemma: string, page: number, sourceText: string, documentCount: number,
    reasons: string[], sourceDefinition?: string,
  ): VocabularyCandidate => {
    const corpusCount = corpus.counts.get(lemma) ?? 0;
    const frequencyPerMillion = corpusCount / corpus.total * 1_000_000;
    return {
      term, lemma, page, sourceText, documentCount, corpusCount, frequencyPerMillion,
      // Smoothed corpus surprisal, boosted by repeated use within this document.
      score: (1 + Math.log(Math.max(1, documentCount))) * -Math.log((corpusCount + 1) / (corpus.total + corpus.counts.size)),
      reasons: [...reasons, corpusCount
        ? frequencyPerMillion <= MAX_FREQUENCY_PER_MILLION ? "low-general-frequency" : "known-reference-frequency"
        : "absent-from-reference-corpus"],
      ...(sourceDefinition ? { sourceDefinition } : {}),
    };
  };
  const explicit = [...glossary.values()].map((entry) => {
    const lemma = nlp.readDoc(entry.term.toLowerCase()).tokens().out(its.lemma as ItsFunction<string>).join(" ").toLowerCase();
    const literalTerm = normalise(entry.term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const occurrences = pages.reduce((count, page) => count +
      [...normalise(page.text).matchAll(new RegExp(`(?<!\\p{L})${literalTerm}(?!\\p{L})`, "gu"))].length, 0);
    return candidate(entry.term, lemma, entry.page, entry.sourceText,
      Math.max(1, words.get(lemma)?.count ?? occurrences), ["explicit-source-definition"], entry.definition);
  });
  const explicitLemmas = new Set(explicit.map(({ lemma }) => lemma));
  const ranked = [...words]
    .filter(([lemma, entry]) => !explicitLemmas.has(lemma) && !glossary.has(normalise(entry.term)) &&
      entry.count >= 2 && (corpus.counts.get(lemma) ?? 0) / corpus.total * 1_000_000 <= MAX_FREQUENCY_PER_MILLION)
    .map(([lemma, entry]) => candidate(entry.term, lemma, entry.page, entry.sourceText, entry.count, ["repeated-in-document"]))
    .sort((a, b) => b.score - a.score || (a.lemma < b.lemma ? -1 : a.lemma > b.lemma ? 1 : 0))
    .slice(0, MAX_RANKED_TERMS);
  return [...explicit, ...ranked];
}
