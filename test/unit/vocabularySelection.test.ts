import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { analyzePages } from "../../amplify/functions/documentAnalysis/analysis";
import { resolveVocabularySelection, selectVocabulary } from "../../amplify/functions/documentAnalysis/vocabularySelection";

describe("deterministic English vocabulary selection", () => {
  it("preserves every explicit biology definition, including multiword terms and numbered explanations", () => {
    const text = readFileSync("test/mocks/biology-cell-structure.md", "utf8");
    const candidates = selectVocabulary([{ pageNumber: 1, text }]);
    const expected = [...text.matchAll(/^\*\*([^*]+)\*\*(?:\s+\(singular:[^)]+\))?\s+-\s+/gm)]
      .map((match) => match[1]);
    expect(expected).toHaveLength(45);
    expect(candidates.filter(({ sourceDefinition }) => sourceDefinition).map(({ term }) => term)).toEqual(expected);
    expect(candidates.find(({ term }) => term === "Cell Theory")?.sourceDefinition).toContain("3. All cells arise");
    expect(candidates.length).toBeLessThanOrEqual(expected.length + 40);
    expect(candidates.every(({ sourceText }) => text.includes(sourceText))).toBe(true);
    expect(selectVocabulary([{ pageNumber: 1, text }])).toEqual(candidates);
  });
  it("keeps a single explicit definition even for a frequent word, without interpreting chapter headings as terms", () => {
    const selected = selectVocabulary([{ pageNumber: 3, text: "Chapter 1 - Introduction\n**Water** - A liquid needed for life." }]);
    expect(selected).toEqual([expect.objectContaining({
      term: "Water", page: 3, sourceDefinition: "A liquid needed for life.",
      reasons: expect.arrayContaining(["explicit-source-definition"]),
    })]);
  });
  it("lemmatizes inflections and ranks repeated rare terms above common prose without selecting stop words or numbers", () => {
    const selected = selectVocabulary([{ pageNumber: 7,
      text: "The membranes surround a cell. A membrane regulates transport. The membranes contain proteins. The people have things. The people have things. 12345.",
    }]);
    const membrane = selected.find(({ lemma }) => lemma === "membrane");
    expect(membrane).toMatchObject({
      page: 7, documentCount: 3, corpusCount: expect.any(Number),
      reasons: expect.arrayContaining(["repeated-in-document", "low-general-frequency"]),
    });
    expect(membrane!.frequencyPerMillion).toBeLessThanOrEqual(20);
    expect(membrane!.score).toBeGreaterThan(0);
    expect(selected.map(({ lemma }) => lemma)).not.toEqual(expect.arrayContaining(["the", "people", "12345"]));
  });
  it("reports an absent corpus term explicitly, not as measured zero-frequency proof of difficulty", () => {
    const selected = selectVocabulary([{ pageNumber: 1, text: "The zorbomembranes move. The zorbomembranes move." }]);
    expect(selected.find(({ term }) => term === "zorbomembranes")).toMatchObject({
      corpusCount: 0, reasons: expect.arrayContaining(["absent-from-reference-corpus"]),
    });
  });
  it("counts repetitions across pages and retains the original source/page", () => {
    const pages = [
      { pageNumber: 2, text: "A membrane encloses the cell." },
      { pageNumber: 5, text: "The membranes regulate transport." },
    ];
    expect(selectVocabulary(pages).find(({ lemma }) => lemma === "membrane")).toMatchObject({
      page: 2, sourceText: pages[0].text, documentCount: 2,
    });
  });
  it("does not cap mandatory glossary terms", () => {
    const text = Array.from({ length: 60 }, (_, index) =>
      `${"Z".repeat(index + 1)} - A source definition.`).join("\n");
    expect(selectVocabulary([{ pageNumber: 1, text }]).filter(({ sourceDefinition }) => sourceDefinition)).toHaveLength(60);
  });
  it.each([undefined, null, "", {}, { other: true }, '{"analysisProfile":"exhaustive"}'])(
    "keeps existing multilingual mode unless explicitly opted in (%j)", (settings) => {
      expect(resolveVocabularySelection(settings)).toBe("llm");
    },
  );
  it("accepts only the explicit supported setting", () => {
    expect(resolveVocabularySelection('{"vocabularySelection":"hybrid-en"}')).toBe("hybrid-en");
    expect(() => resolveVocabularySelection({ vocabularySelection: "automatic" })).toThrow("Unsupported");
    expect(() => resolveVocabularySelection("{bad")).toThrow();
  });
});

describe("hybrid shortlist enrichment", () => {
  const text = "Cytology - The study of cells.\nA membrane surrounds a cell. A membrane controls transport.";
  const candidates = selectVocabulary([{ pageNumber: 1, text }]);
  const completion = (vocabularyJSON: unknown[]) => ({
    choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
      vocabularyJSON, factsJSON: [], summariesJSON: [], objectivesJSON: [], conceptsJSON: [],
    }) } }],
  });
  it("enriches a native shortlist in its source language without invoking English selection", async () => {
    const create = vi.fn().mockResolvedValue(completion([
      { word: "membrana", definition: "Una capa que controla el transporte.", page: 1 },
    ]));
    const sourceText = "La membrana regula el transporte.";
    const result = await analyzePages({ chat: { completions: { create } } },
      [{ pageNumber: 1, text: sourceText }], "file-1", "doc-1", {
        vocabularySelection: "hybrid-native", vocabularyLanguage: "es",
        vocabularyCandidates: [{
          term: "membrana", lemma: "membrana", page: 1, sourceText,
          documentCount: 2, frequencyPerMillion: 1, score: 20, reasons: ["repeated-in-document"],
        }],
      });
    expect(result.vocabularyJSON).toEqual([{
      word: "membrana", definition: "Una capa que controla el transporte.", page: 1, context: sourceText,
    }]);
    expect(create.mock.calls[0][0].messages[0].content).toContain("definition in es");
  });
  it("never substitutes English NLP when the native shortlist is missing", async () => {
    const create = vi.fn();
    await expect(analyzePages({ chat: { completions: { create } } },
      [{ pageNumber: 1, text }], "file-1", "doc-1", {
        vocabularySelection: "hybrid-native", vocabularyLanguage: "es",
      })).rejects.toThrow("precomputed document-wide shortlist");
    expect(create).not.toHaveBeenCalled();
  });
  it("uses only deterministic terms, restores omitted glossary definitions, and grounds generated entries in source quotes", async () => {
    const create = vi.fn().mockResolvedValue(completion([
      { word: "membrane", definition: "A boundary controlling what enters a cell.", context: "invented context", page: 1 },
      { word: "Invented", definition: "Not selected", page: 1 },
    ]));
    const result = await analyzePages({ chat: { completions: { create } } },
      [{ pageNumber: 1, text }], "file-1", "doc-1", { vocabularySelection: "hybrid-en" });
    expect(result.vocabularyJSON.map(({ word }) => word)).toEqual(candidates.map(({ term }) => term));
    expect(result.vocabularyJSON).toContainEqual({
      word: "Cytology", definition: "The study of cells.", context: "Cytology - The study of cells.", page: 1,
    });
    expect(result.vocabularyJSON.find(({ word }) => word === "membrane")).toMatchObject({
      definition: "A boundary controlling what enters a cell.", context: candidates.find(({ lemma }) => lemma === "membrane")!.sourceText,
    });
    expect(create.mock.calls[0][0].messages[0].content).toContain("Vocabulary selection is already complete in deterministic code");
    expect(create).toHaveBeenCalledOnce();
  });
  it("retains omitted ranked terms for human editing with explicit missing-definition warnings", async () => {
    const create = vi.fn().mockResolvedValue(completion([]));
    const result = await analyzePages({ chat: { completions: { create } } },
      [{ pageNumber: 1, text }], "file-1", "doc-1", { vocabularySelection: "hybrid-en" });
    expect(result.vocabularyJSON.find(({ word }) => word === "membrane")?.definition).toBe("");
    expect(result.reviewWarnings).toContainEqual({ page: 1, message: expect.stringContaining('Vocabulary "membrane" needs a human-written definition') });
  });
  it("honors a precomputed document shortlist, even when empty, instead of reselecting independently per page", async () => {
    const create = vi.fn().mockResolvedValue(completion([{ word: "Cytology", definition: "Cells", page: 1 }]));
    const result = await analyzePages({ chat: { completions: { create } } },
      [{ pageNumber: 1, text }], "file-1", "doc-1", { vocabularySelection: "hybrid-en", vocabularyCandidates: [] });
    expect(result.vocabularyJSON).toEqual([]);
  });
});
