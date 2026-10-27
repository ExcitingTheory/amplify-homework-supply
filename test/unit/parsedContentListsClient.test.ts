import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONCEPT_FIELDS,
  QUESTION_FIELDS,
  SUMMARY_FIELDS,
  VOCABULARY_FIELDS,
  pickEntries,
  toEntryList,
} from "../../src/utils/parsedContentLists";

const schemaSource = readFileSync(
  resolve(__dirname, "../../amplify/data/resource.ts"),
  "utf8",
);

function declaredFields(typeName: string): string[] {
  const start = schemaSource.indexOf(`const ${typeName} = a.customType({`);
  expect(start, `${typeName} not found in schema`).toBeGreaterThan(-1);
  const body = schemaSource.slice(start, schemaSource.indexOf("});", start));
  return [...body.matchAll(/^\s{2}(\w+):/gm)].map((match) => match[1]);
}

describe("client ParsedContent field lists", () => {
  it.each([
    [VOCABULARY_FIELDS, "VocabularyEntry"],
    [SUMMARY_FIELDS, "SummaryEntry"],
    [CONCEPT_FIELDS, "ConceptEntry"],
    [QUESTION_FIELDS, "QuestionEntry"],
  ] as const)("%j matches the schema type %s", (fields, typeName) => {
    expect([...fields].sort()).toEqual(declaredFields(typeName).sort());
  });
});

describe("toEntryList", () => {
  it("reads typed arrays and legacy JSON strings, and never throws", () => {
    expect(toEntryList([{ word: "a" }, null])).toEqual([{ word: "a" }]);
    expect(toEntryList('[{"word":"a"}]')).toEqual([{ word: "a" }]);
    expect(toEntryList("{bad")).toEqual([]);
    expect(toEntryList(undefined)).toEqual([]);
  });
});

describe("pickEntries", () => {
  it("keeps only declared, non-null fields so the typed input accepts the write", () => {
    expect(
      pickEntries(
        [
          { word: "a", definition: null, page: 2, documentID: "d", filename: "f" },
          null,
          "text",
        ],
        VOCABULARY_FIELDS,
      ),
    ).toEqual([{ word: "a", page: 2 }]);
  });
});
