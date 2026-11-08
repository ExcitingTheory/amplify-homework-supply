import { describe, expect, it } from "vitest";
import fixture from "../../fixtures/thoth/nlp-extraction-exercise.json";
import {
  analyzePageWithoutLLM,
  type AnalysisPage,
} from "../../../amplify/functions/documentAnalysis/analysis";
import { selectVocabulary } from "../../../amplify/functions/documentAnalysis/vocabularySelection";
import { scoreExtraction } from "../../integration/thoth/scoreExtraction";
import { buildThothNlpGroundTruth } from "../../../scripts/thoth/nlpExtractionFixture";

describe("Thoth NLP extraction exercise", () => {
  it("extracts its labeled facts and explicit glossary terms without an LLM", () => {
    const page: AnalysisPage = { pageNumber: 1, text: fixture.lines.join("\n") };
    const result = analyzePageWithoutLLM(page, selectVocabulary([page]));
    const report = scoreExtraction(
      buildThothNlpGroundTruth(fixture, "fixture-sha256"),
      {
        questions: result.questionsJSON.map(
          ({ prompt, answer, subject, field, sourceText, page }) => ({
            prompt,
            answer,
            subject,
            field,
            sourceText,
            page,
          }),
        ),
        words: result.vocabularyJSON.map(({ word, definition, page }) => ({
          word,
          definition,
          page,
        })),
      },
    );

    expect(report).toMatchObject({
      factRecall: 1,
      vocabRecall: 1,
      pageCoverage: { missing: [] },
      missingFacts: [],
      missingVocab: [],
    });
    for (const { term, definition } of fixture.vocabulary) {
      expect(result.vocabularyJSON).toContainEqual(
        expect.objectContaining({ word: term, definition }),
      );
    }
  });
});
