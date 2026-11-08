import type { ThothGroundTruth } from "../../test/integration/thoth/scoreExtraction";

export interface ThothNlpExerciseFixture {
  filename: string;
  lines: string[];
  facts: Array<{ field: string; value: string }>;
  vocabulary: Array<{ term: string; definition: string }>;
}

export function buildThothNlpGroundTruth(
  fixture: ThothNlpExerciseFixture,
  sourceSha256: string,
): ThothGroundTruth {
  const labelCard = {
    key: "nlp-explicit-labels",
    group: "reference" as const,
    frontPage: 1,
    backPage: 1,
    title: "Document",
    subtitle: "NLP extraction exercise",
    facts: fixture.facts.map(({ field, value }) => ({
      field,
      value,
      required: true,
    })),
  };
  const vocabularyCards = fixture.vocabulary.map(({ term, definition }, index) => ({
    key: `nlp-vocabulary-${index + 1}`,
    group: "reference" as const,
    frontPage: 1,
    backPage: 1,
    title: term,
    subtitle: "NLP glossary term",
    facts: [{ field: "definition", value: definition, required: true }],
  }));
  const cards = [labelCard, ...vocabularyCards];

  return {
    source: {
      filename: fixture.filename,
      pages: 1,
      sha256: sourceSha256,
    },
    cards,
    vocabulary: fixture.vocabulary.map(({ term, definition }) => ({
      term,
      set: "glossary",
      definition,
    })),
    pageIndex: { 1: cards.map(({ key }) => key) },
  };
}
