import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONCEPTS_SELECTION,
  OBJECTIVES_SELECTION,
  PENDING_MEDIA_SELECTION,
  QUESTIONS_SELECTION,
  SUMMARIES_SELECTION,
  VOCABULARY_SELECTION,
  toEntryList,
} from "../../../amplify/functions/shared/parsedContentLists";

const schemaSource = readFileSync(
  resolve(__dirname, "../../../amplify/data/resource.ts"),
  "utf8",
);

function declaredFields(typeName: string): string[] {
  const start = schemaSource.indexOf(`const ${typeName} = a.customType({`);
  expect(start, `${typeName} not found in schema`).toBeGreaterThan(-1);
  const body = schemaSource.slice(start, schemaSource.indexOf("});", start));
  return [...body.matchAll(/^\s{2}(\w+):/gm)].map((match) => match[1]);
}

const selectedFields = (selection: string) =>
  selection.slice(selection.indexOf("{") + 1, selection.indexOf("}")).trim().split(/\s+/);

describe("ParsedContent selections", () => {
  const cases: Array<[string, string]> = [
    [VOCABULARY_SELECTION, "VocabularyEntry"],
    [SUMMARIES_SELECTION, "SummaryEntry"],
    [OBJECTIVES_SELECTION, "ObjectiveEntry"],
    [CONCEPTS_SELECTION, "ConceptEntry"],
    [QUESTIONS_SELECTION, "QuestionEntry"],
    [PENDING_MEDIA_SELECTION, "PendingMediaEntry"],
  ];

  it.each(cases)("%s selects every field its entry type declares", (selection, typeName) => {
    expect(selectedFields(selection).sort()).toEqual(declaredFields(typeName).sort());
  });
});

describe("toEntryList", () => {
  it("returns typed arrays, parses JSON strings, and tolerates anything else", () => {
    expect(toEntryList([{ a: 1 }, null])).toEqual([{ a: 1 }]);
    expect(toEntryList('[{"a":1}]')).toEqual([{ a: 1 }]);
    expect(toEntryList("{bad")).toEqual([]);
    expect(toEntryList(null)).toEqual([]);
    expect(toEntryList({ a: 1 })).toEqual([]);
  });
});
