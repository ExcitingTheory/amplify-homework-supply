import type { Context } from "aws-lambda";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  s3: vi.fn(),
  graphql: vi.fn(),
  completion: vi.fn(),
  saveChunks: vi.fn(),
  extract: vi.fn(),
  nativeSelection: vi.fn(),
}));
vi.mock("aws-amplify", () => ({ Amplify: { configure: vi.fn() } }));
vi.mock("aws-amplify/data", () => ({ generateClient: () => ({ graphql: mocks.graphql }) }));
vi.mock("@aws-sdk/client-sfn", () => ({
  SFNClient: class {}, DescribeMapRunCommand: vi.fn(), ListMapRunsCommand: vi.fn(),
}));
vi.mock("@aws-sdk/client-ssm", () => ({ SSMClient: class {}, GetParameterCommand: vi.fn() }));
vi.mock("@aws-sdk/client-lambda", () => ({ LambdaClient: class {}, InvokeCommand: vi.fn() }));
vi.mock("@aws-sdk/client-s3", async (importOriginal) => ({
  ...await importOriginal<typeof import("@aws-sdk/client-s3")>(),
  S3Client: class { send = mocks.s3; },
}));
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: mocks.completion } };
    moderations = { create: vi.fn() };
  },
}));
vi.mock("../documentAnalysis/formatRegistry", () => ({ extractByFormat: mocks.extract }));
vi.mock("../shared/parsedContentChunks", () => ({ saveParsedContentChunks: mocks.saveChunks }));
vi.mock("../documentAnalysisWorkflow/providerRateLimiter", async (importOriginal) => ({
  ...await importOriginal<typeof import("../documentAnalysisWorkflow/providerRateLimiter")>(),
  DynamoProviderRateLimitStore: class {},
  withProviderRateLimit: ({ execute }: { execute: () => Promise<unknown> }) => execute(),
}));

import { handler } from "../documentAnalysisWorkflow/handler";
import { selectVocabulary } from "../documentAnalysis/vocabularySelection";
vi.mock("../documentAnalysis/nativeVocabulary", () => ({
  resolveVocabularyLanguage: () => "es",
  selectNativeVocabulary: mocks.nativeSelection,
}));

const event = {
  documentId: "doc-1", fileId: "file-1", runId: "run-1", identityId: "owner-1",
  profile: "exhaustive", baseKey: "run", resultKey: "page-result", inputKey: "page-input",
};
const page = { pageNumber: 1, text: "Cytology is the study of cells." };
const question = {
  prompt: "What does cytology study?", subject: "Cytology", field: "definition",
  answer: "the study of cells", sourceText: page.text, page: 1, accept: [],
};
const vocabulary = { word: "Cytology", definition: "the study of plants", context: "Definition on page 1", page: 1 };
const coverageWarning = expect.stringContaining("evidence coverage, not complete fact recall");
const pageResult = () => ({
  page: 1, questionsJSON: [question], vocabularyJSON: [vocabulary],
  summariesJSON: [], objectivesJSON: [], conceptsJSON: [], suspect: [],
  reviewWarnings: ["Check every vocabulary definition against its quoted context"],
  uncoveredLines: ["Review a source line"],
  verification: {
    supported: 1, unsupported: 1, omissions: ["Cell structure"],
    verdicts: [
      { index: 0, supported: true },
      { index: 1, supported: false, reason: "Definition does not match the source" },
    ],
  },
});
const objects = new Map<string, unknown>();
let document: Record<string, unknown>;
let fileSettings: unknown;
let existingWords: Array<Record<string, unknown>>;
let existingQuestions: Array<Record<string, unknown>>;
let fileSettingsErrors: Array<{ message: string }>;
let platformLlmEnabled: boolean;
let userLlmOverride: boolean | null;

async function run(workflowMode: string, extra = {}) {
  return handler({ ...event, workflowMode, ...extra }, {} as Context, vi.fn());
}

describe("document extraction human review", () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STORAGE_BUCKET", "test-bucket");
    vi.stubEnv("OPENAI_API_KEY", "test-only");
    vi.stubEnv("DOCUMENT_ANALYSIS_LIMITER_TABLE", "test-limiter");
    fileSettings = { vocabularySelection: "hybrid-en" };
    platformLlmEnabled = false;
    userLlmOverride = null;
    existingWords = [];
    existingQuestions = [];
    fileSettingsErrors = [];
    document = { id: event.documentId, _version: 1, owner: "owner-1", metadata: JSON.stringify({
      analysis: { runId: event.runId, state: "analyzing", moderation: { flagged: false } },
    }) };
    objects.clear();
    objects.set(event.inputKey, page);
    objects.set(event.resultKey, pageResult());
    mocks.s3.mockImplementation(async (command: { input: { Key: string; Body?: string } }) => {
      const { Key, Body } = command.input;
      if (Body !== undefined) {
        objects.set(Key, Key.endsWith(".txt") ? Body : JSON.parse(Body));
        return {};
      }
      if (!objects.has(Key)) throw Object.assign(new Error(`Missing ${Key}`), { name: "NoSuchKey" });
      return { Body: (async function* () { yield Buffer.from(JSON.stringify(objects.get(Key))); })() };
    });
    mocks.graphql.mockImplementation(async ({ query, variables }: {
      query: string; variables: { input?: Record<string, unknown>; owner?: string };
    }) => {
      if (query.includes("query GetDocument")) return { data: { getDocument: document } };
      if (query.includes("query GetVocabularySettings")) return { data: { getFile: {
        id: event.fileId, owner: "owner-1", settings: fileSettings,
      } }, errors: fileSettingsErrors };
      if (query.includes("query ListUserDocumentAnalysisSettings")) return {
        data: { listSettings: { items: userLlmOverride === null
          ? []
          : [{ _deleted: false, documentAnalysisLlmExtractionOverride: userLlmOverride }] } },
      };
      if (query.includes("mutation UpdateDocument")) {
        document = { ...document, ...variables.input };
        return { data: { updateDocument: document } };
      }
      if (query.includes("query ListOwnerWords")) return { data: { listWords: { items: existingWords } } };
      if (query.includes("query ListOwnerQuestions")) return { data: { listQuestions: { items: existingQuestions } } };
      if (query.includes("query ListAnalysisJobs")) return { data: { listAgentJobs: { items: [] } } };
      if (query.includes("mutation CreateAnalysisJob")) return { data: { createAgentJob: { id: "job-1" } } };
      if (query.includes("query ListPlatformSettings")) return {
        data: { listPlatformSettings: { items: [{ documentAnalysisLlmExtractionEnabled: platformLlmEnabled }] } },
      };
      throw new Error(`Unexpected GraphQL operation: ${query}`);
    });
    mocks.completion.mockResolvedValue({
      choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
        summariesJSON: [], objectivesJSON: [], conceptsJSON: [],
      }) } }],
    });
    mocks.saveChunks.mockResolvedValue({ chunkCount: 1, created: 1, updated: 0, removed: 0 });
    mocks.extract.mockResolvedValue({
      sourceFormat: "pdf", pages: [page], text: page.text, pageCount: 1,
    });
  });

  it("records the dictionary and question-bank records an entry already has, so importing links instead of duplicating", async () => {
    existingWords = [
      { id: "word-1", phrase: "cytology", definition: "the study of cells" },
      // A different sense of a term the document also defines.
      { id: "word-2", phrase: "Path", definition: "A road for walkers" },
    ];
    existingQuestions = [{ id: "question-1", prompt: question.prompt, answer: question.answer }];
    objects.set("run/aggregate.json", {
      questionsJSON: [question],
      vocabularyJSON: [
        { word: "Cytology", definition: "the study of cells", pages: [1] },
        { word: "Path", definition: "A Tree-line joining two Sephiroth", pages: [2] },
      ],
      summariesJSON: [], objectivesJSON: [], conceptsJSON: [],
      failedPages: [], totalPages: 1, done: 1, quality: {}, tokenUsageByModel: {},
    });

    await run("finalize", { aggregateKey: "run/aggregate.json" });

    const saved = mocks.saveChunks.mock.calls[0][1].content;
    expect(saved.vocabularyJSON).toEqual([
      // Same term and same sense, so it links to the existing Word.
      { word: "Cytology", definition: "the study of cells", pages: [1], wordID: "word-1" },
      // Same term but a different sense, so importing cannot overwrite it.
      { word: "Path", definition: "A Tree-line joining two Sephiroth", pages: [2] },
    ]);
    expect(saved.questionsJSON[0]).toMatchObject({ questionID: "question-1" });
  });

  it("precomputes one document-wide shortlist and stores selection reasons in private run artifacts", async () => {
    const pages = [
      { pageNumber: 1, text: "A membrane encloses the cell." },
      { pageNumber: 2, text: "The membranes regulate transport.\nCytology - The study of cells." },
    ];
    mocks.extract.mockResolvedValueOnce({ sourceFormat: "pdf", pages, text: pages.map(({ text }) => text).join("\n") });
    await run("prepare");
    const base = `private/${event.identityId}/documents/${event.documentId}/analysis/${event.runId}`;
    const candidates = selectVocabulary(pages);
    expect(objects.get(`${base}/vocabulary-selection.json`)).toEqual({
      version: "english-subtlex-v1", language: "en", candidates,
    });
    expect(objects.get(`${base}/pages/0001.json`)).toMatchObject({
      vocabularySelection: "hybrid-en",
      vocabularyCandidates: candidates.filter(({ page }) => page === 1),
    });
    expect(objects.get(`${base}/pages/0002.json`)).toMatchObject({
      vocabularyCandidates: candidates.filter(({ page }) => page === 2),
    });
  });

  it("defaults to NLP vocabulary selection when platform and user settings do not enable LLM extraction", async () => {
    fileSettings = undefined;
    await run("prepare");
    const base = `private/${event.identityId}/documents/${event.documentId}/analysis/${event.runId}`;
    const candidates = selectVocabulary([page]);
    expect(objects.get(`${base}/vocabulary-selection.json`)).toEqual({
      version: "english-subtlex-v1", language: "en", candidates,
    });
    expect(objects.get(`${base}/pages/0001.json`)).toMatchObject({
      vocabularySelection: "hybrid-en",
      llmExtractionEnabled: false,
      vocabularyCandidates: candidates,
    });
  });

  it("uses the platform default and honors a per-user LLM extraction override", async () => {
    fileSettings = undefined;
    platformLlmEnabled = true;
    await run("prepare");
    const base = `private/${event.identityId}/documents/${event.documentId}/analysis/${event.runId}`;
    expect(objects.get(`${base}/pages/0001.json`)).toMatchObject({
      vocabularySelection: "llm",
      llmExtractionEnabled: true,
    });

    objects.clear();
    userLlmOverride = false;
    await run("prepare");
    expect(objects.get(`${base}/pages/0001.json`)).toMatchObject({
      vocabularySelection: "hybrid-en",
      llmExtractionEnabled: false,
    });

    objects.clear();
    platformLlmEnabled = false;
    userLlmOverride = true;
    await run("prepare");
    expect(objects.get(`${base}/pages/0001.json`)).toMatchObject({
      vocabularySelection: "llm",
      llmExtractionEnabled: true,
    });
  });

  it("extracts explicit facts and verifies evidence without making LLM calls in NLP-only mode", async () => {
    const pageText = "Cytology — study of cells\nCell membrane — controls movement";
    objects.set(event.inputKey, {
      pageNumber: 1,
      text: pageText,
      llmExtractionEnabled: false,
      vocabularySelection: "hybrid-en",
      vocabularyCandidates: [{
        term: "Cytology",
        sourceDefinition: "study of cells",
        sourceText: "Cytology — study of cells",
        page: 1,
      }],
    });

    const extracted = await run("extract", { page: 1 });
    expect(extracted.questionsJSON).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subject: "Cytology",
        field: "definition",
        answer: "study of cells",
      }),
    ]));
    expect(extracted.vocabularyJSON).toEqual([
      expect.objectContaining({
        word: "Cytology",
        definition: "study of cells",
      }),
    ]);

    await run("verify", { page: 1 });
    expect(mocks.completion).not.toHaveBeenCalled();
    expect(objects.get(event.resultKey)).toMatchObject({
      llmExtractionEnabled: false,
      verification: { verifierModel: "deterministic-source-check" },
    });
  });

  it("retains structured direct facts and vocabulary alongside NLP-only page results", async () => {
    fileSettings = undefined;
    const labeledPage = { pageNumber: 1, text: "Cell: the basic unit of life" };
    mocks.extract.mockResolvedValueOnce({
      sourceFormat: "pdf",
      pages: [labeledPage],
      text: labeledPage.text,
      pageCount: 1,
    });

    await run("prepare");
    const pageInputKey = `private/${event.identityId}/documents/${event.documentId}/analysis/${event.runId}/pages/0001.json`;
    await run("extract", { page: 1, inputKey: pageInputKey });
    await run("verify", { page: 1, inputKey: pageInputKey });
    await run("writeResult");

    const directQuestion = {
      ...question,
      prompt: "Describe a cell.",
      answer: "the basic unit of life",
      sourceText: labeledPage.text,
    };
    const directVocabulary = {
      word: "Cell",
      definition: "the basic unit of life",
      context: labeledPage.text,
      page: 1,
    };
    objects.set("manifest", [{
      page: 1,
      inputKey: pageInputKey,
      resultKey: event.resultKey,
    }]);
    objects.set("direct", {
      questionsJSON: [directQuestion],
      vocabularyJSON: [directVocabulary],
    });

    await run("aggregate", { manifestKey: "manifest", directContentKey: "direct" });

    expect(objects.get("run/aggregate.json")).toMatchObject({
      questionsJSON: expect.arrayContaining([
        expect.objectContaining({ prompt: "What is Cell?" }),
        expect.objectContaining({ prompt: directQuestion.prompt }),
      ]),
      vocabularyJSON: [expect.objectContaining({ word: "Cell", definition: directVocabulary.definition })],
    });
  });

  it("uses document-wide native candidates and preserves language and chunk warnings on every page", async () => {
    fileSettings = { vocabularySelection: "hybrid-native", vocabularyLanguage: "es" };
    const pages = [{ pageNumber: 1, text: "La membrana regula el transporte." }, { pageNumber: 2, text: "La membrana protege." }];
    mocks.extract.mockResolvedValueOnce({ sourceFormat: "pdf", pages, text: pages.map(({ text }) => text).join("\n") });
    const candidates = [{
      term: "membrana", lemma: "membrana", page: 1, sourceText: pages[0].text,
      documentCount: 2, frequencyPerMillion: 1, score: 20, reasons: ["repeated-in-document"],
    }];
    mocks.nativeSelection.mockResolvedValueOnce({ candidates, reviewWarnings: ["Review oversized sentence splits."] });
    await run("prepare");
    const base = `private/${event.identityId}/documents/${event.documentId}/analysis/${event.runId}`;
    expect(mocks.nativeSelection).toHaveBeenCalledWith(pages, "es", base);
    expect(objects.get(`${base}/vocabulary-selection.json`)).toEqual({
      version: "stanza-wordfreq-v1", language: "es", candidates,
    });
    expect(objects.get(`${base}/pages/0001.json`)).toMatchObject({
      vocabularySelection: "hybrid-native", vocabularyLanguage: "es", vocabularyCandidates: candidates,
      vocabularyReviewWarnings: ["Review oversized sentence splits."],
    });
    expect(objects.get(`${base}/pages/0002.json`)).toMatchObject({ vocabularyCandidates: [] });
  });

  it("surfaces settings read failures instead of silently choosing a selector", async () => {
    fileSettingsErrors = [{ message: "Read failed" }];
    await expect(run("prepare")).rejects.toThrow("Unable to load vocabulary settings");
  });

  it("surfaces malformed file settings before writing page inputs", async () => {
    fileSettings = "{bad";
    await expect(run("prepare")).rejects.toThrow(SyntaxError);
    expect([...objects.keys()]).toEqual([event.inputKey, event.resultKey]);
  });

  it("uses the stored shortlist during extraction, and preserves it when repairing", async () => {
    const text = "Cytology - The study of cells.";
    const candidates = selectVocabulary([{ pageNumber: 1, text }]);
    objects.set(event.inputKey, { pageNumber: 1, text, vocabularySelection: "hybrid-en", vocabularyCandidates: candidates });
    // Cover the source line so this fixture exercises the shortlist, not independent fact gap filling.
    mocks.completion.mockResolvedValue({
      choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
        facts: [{ subject: "Cytology", field: "definition", answer: "The study of cells.", sourceText: text, page: 1, accept: [] }],
        vocabulary: [], checklist: {
          sourcePage: 1, factsReviewed: 1, vocabularyReviewed: 0,
          vocabularyEvidenceChecked: true, coverageReviewed: true, missingSourceLines: [],
        },
      }) } }],
    });
    await run("extract", { page: 1 });
    expect(objects.get(event.resultKey)).toMatchObject({
      vocabularySelection: "hybrid-en",
      vocabularyJSON: [{ word: "Cytology", definition: "The study of cells.", context: text, page: 1 }],
    });
    await run("repair");
    expect(objects.get(event.resultKey)).toMatchObject({
      repaired: true, vocabularyJSON: [{ word: "Cytology", definition: "The study of cells.", context: text, page: 1 }],
    });
  });

  it("allows verifier-supported hybrid definitions to paraphrase without weakening source-quote checks", async () => {
    objects.set(event.resultKey, {
      ...pageResult(), vocabularySelection: "hybrid-en", questionsJSON: [], reviewWarnings: [], uncoveredLines: [],
      vocabularyJSON: [{ word: "Cytology", definition: "The science of cells", context: page.text, page: 1 }],
      verification: { supported: 1, unsupported: 0, verdicts: [{ index: 0, supported: true }], omissions: [] },
    });
    await run("writeResult");
    expect(objects.get(event.resultKey)).toMatchObject({
      verifiedCandidateIndices: [0], reviewWarnings: [coverageWarning],
      evidenceCoverage: { totalUnits: 1, coveredUnits: 0 },
    });
    objects.set(event.resultKey, {
      ...pageResult(), vocabularySelection: "hybrid-en", questionsJSON: [], reviewWarnings: [], uncoveredLines: [],
      vocabularyJSON: [{ word: "Cytology", definition: "The science of cells", context: "Invented quote", page: 1 }],
      verification: { supported: 1, unsupported: 0, verdicts: [{ index: 0, supported: true }], omissions: [] },
    });
    await run("writeResult");
    expect(objects.get(event.resultKey)).toMatchObject({
      verifiedCandidateIndices: [], reviewWarnings: [expect.stringContaining("source_not_on_page"), coverageWarning],
    });
  });

  it.each([
    { definition: "", supported: true },
    { definition: "The science of cells", supported: false },
  ])("keeps incomplete or unsupported hybrid definitions editable but outside trusted synthesis (%j)", async ({ definition, supported }) => {
    const vocabularyJSON = [{ word: "Cytology", definition, context: page.text, page: 1 }];
    objects.set(event.resultKey, {
      ...pageResult(), vocabularySelection: "hybrid-en", questionsJSON: [], vocabularyJSON,
      reviewWarnings: [], uncoveredLines: [],
      verification: {
        supported: Number(supported), unsupported: Number(!supported),
        verdicts: [{ index: 0, supported }], omissions: [],
      },
    });
    await run("writeResult");
    expect(objects.get(event.resultKey)).toMatchObject({
      vocabularyJSON, verifiedCandidateIndices: [], reviewWarnings: [expect.any(String), coverageWarning],
    });
  });

  it("continues to require verbatim answers for facts in hybrid mode", async () => {
    objects.set(event.resultKey, {
      ...pageResult(), vocabularySelection: "hybrid-en", vocabularyJSON: [],
      questionsJSON: [{ ...question, answer: "The science of cells" }], reviewWarnings: [], uncoveredLines: [],
      verification: { supported: 1, unsupported: 0, verdicts: [{ index: 0, supported: true }], omissions: [] },
    });
    await run("writeResult");
    expect(objects.get(event.resultKey)).toMatchObject({
      verifiedCandidateIndices: [], reviewWarnings: [expect.stringContaining("answer_not_in_source"), coverageWarning],
    });
  });

  it("keeps a nonexact quotation editable but outside trusted synthesis even when the verifier accepts it", async () => {
    const candidate = { ...question, sourceText: "Cytology  is the study of cells." };
    objects.set(event.resultKey, {
      ...pageResult(), questionsJSON: [candidate], vocabularyJSON: [], reviewWarnings: [], uncoveredLines: [],
      verification: { supported: 1, unsupported: 0, verdicts: [{ index: 0, supported: true }], omissions: [] },
    });
    await run("writeResult");
    expect(objects.get(event.resultKey)).toMatchObject({
      questionsJSON: [candidate], verifiedCandidateIndices: [],
      reviewWarnings: [expect.stringContaining("unique exact source anchor"), coverageWarning],
    });
  });

  it("does not manufacture vision evidence from claim quotations when transcription is absent", async () => {
    objects.set("image", "mock-image");
    mocks.completion.mockResolvedValueOnce({
      choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
        facts: [question], vocabulary: [],
      }) } }],
    });
    await expect(run("vision", { imageKey: "image" })).rejects.toThrow("requires a page transcription");
    expect(objects.get(event.inputKey)).toEqual(page);
  });

  it("anchors visual claims to the separate transcription merged into the page", async () => {
    const visualText = "The membrane regulates transport.";
    objects.set("image", "mock-image");
    mocks.completion.mockResolvedValueOnce({
      choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
        pageText: visualText,
        facts: [{ subject: "Membrane", field: "regulates", answer: "transport",
          sourceText: visualText, page: 1, accept: [] }], vocabulary: [],
      }) } }],
    });
    await run("vision", { imageKey: "image" });
    const input = objects.get(event.inputKey) as { text: string };
    const result = objects.get(event.resultKey) as { questionsJSON: Array<Record<string, unknown>> };
    const visual = result.questionsJSON.at(-1)!;
    expect(visual).toMatchObject({
      questionType: "recall", subject: "Membrane", field: "regulates", answer: "transport",
      sourceStart: input.text.indexOf(visualText), sourceEnd: input.text.indexOf(visualText) + visualText.length,
      evidenceUnitId: expect.stringMatching(/^evidence-/),
    });
  });

  it("uses the same atomic extraction and anchoring path for workflow repair", async () => {
    mocks.completion.mockResolvedValueOnce({
      choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
        facts: [{ subject: "Cytology", field: "studies", answer: "cells", sourceText: page.text, page: 1, accept: [] }],
        vocabulary: [], checklist: { sourcePage: 1, factsReviewed: 1, vocabularyReviewed: 0,
          vocabularyEvidenceChecked: true, coverageReviewed: true, missingSourceLines: [] },
      }) } }],
    });
    await run("repair");
    const result = objects.get(event.resultKey) as Record<string, any>;
    expect(result.repaired).toBe(true);
    expect(result.questionsJSON).toContainEqual(expect.objectContaining({
      subject: "Cytology", field: "studies", answer: "cells",
      evidenceUnitId: expect.stringMatching(/^evidence-/), sourceStart: 0, sourceEnd: page.text.length,
    }));
    expect(mocks.completion).toHaveBeenCalledTimes(1);
  });

  it("persists a source-derived inventory and counts only independently verified anchored claims", async () => {
    const additionalText = "The membrane regulates transport.";
    objects.set(event.inputKey, { ...page, text: `${page.text}\n\n${additionalText}` });
    objects.set(event.resultKey, {
      ...pageResult(), reviewWarnings: [], uncoveredLines: [], vocabularyJSON: [],
      questionsJSON: [{ ...question, sourceStart: 999, sourceEnd: 1000, evidenceUnitId: "stale" }, {
        ...question, subject: "Membrane", field: "regulates", answer: "transport", sourceText: additionalText,
      }],
      verification: { supported: 1, unsupported: 1, omissions: [],
        verdicts: [{ index: 0, supported: true }, { index: 1, supported: false, reason: "Needs review" }] },
    });
    await run("writeResult");
    const result = objects.get(event.resultKey) as Record<string, any>;
    expect(result.verifiedCandidateIndices).toEqual([0]);
    expect(result.evidenceCoverage).toMatchObject({ totalUnits: 2, coveredUnits: 1 });
    expect(result.evidenceCoverage.units).toHaveLength(2);
    expect(result.evidenceCoverage.missingUnitIds).toEqual([result.evidenceCoverage.units[1].id]);
    expect(result.questionsJSON[0]).toMatchObject({
      evidenceUnitId: result.evidenceCoverage.units[0].id, sourceStart: 0, sourceEnd: page.text.length,
    });
    expect(result.reviewWarnings).toContainEqual(coverageWarning);
  });

  it("selects newly transcribed vision terms in code instead of admitting model-chosen vocabulary", async () => {
    const text = "Cytology - The study of cells.\nA membrane surrounds the cell. The membrane regulates transport.";
    const candidates = selectVocabulary([{ pageNumber: 1, text }]);
    objects.set(event.inputKey, { pageNumber: 1, text, vocabularySelection: "hybrid-en", vocabularyCandidates: candidates });
    const originalVocabulary = candidates.map((candidate) => ({
      word: candidate.term, definition: candidate.sourceDefinition ?? "A boundary controlling entry.",
      context: candidate.sourceText, page: 1,
    }));
    objects.set(event.resultKey, {
      ...pageResult(), vocabularySelection: "hybrid-en", vocabularyJSON: originalVocabulary,
    });
    objects.set("image", "mock-image");
    const visualText = "Mitosis - The division of a cell.";
    mocks.completion.mockResolvedValueOnce({
      choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
        pageText: visualText, facts: [], vocabulary: [{ term: "Invented", definition: "Not selected" }],
      }) } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    }).mockResolvedValueOnce({
      choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
        vocabularyJSON: [{ word: "Invented", definition: "Still not selected", page: 1 }],
        factsJSON: [], summariesJSON: [], objectivesJSON: [], conceptsJSON: [],
      }) } }],
      usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 },
    });
    await run("vision", { imageKey: "image" });
    expect(mocks.completion).toHaveBeenCalledTimes(2);
    expect(objects.get(event.inputKey)).toMatchObject({
      vocabularyCandidates: [...candidates, expect.objectContaining({ term: "Mitosis", sourceText: visualText })],
    });
    expect(objects.get(event.resultKey)).toMatchObject({
      vocabularyJSON: [
        ...originalVocabulary,
        { word: "Mitosis", definition: "The division of a cell.", context: visualText, page: 1 },
      ],
      usageByModel: { "gpt-4o": { promptTokens: 12, completionTokens: 6, totalTokens: 18 } },
    });
  });

  it("persists rejected candidates with reasons through aggregation and completion", async () => {
    const additional = { ...question, prompt: "What is cell biology?", subject: "Cell biology" };
    const extracted = pageResult();
    extracted.questionsJSON.push(additional);
    extracted.verification.verdicts = [
      { index: 0, supported: true }, { index: 1, supported: true },
      { index: 2, supported: false, reason: "Definition does not match the source" },
    ];
    objects.set(event.resultKey, extracted);
    await run("writeResult");
    expect(objects.get(event.resultKey)).toMatchObject({
      completed: true, questionsJSON: [question, additional], vocabularyJSON: [vocabulary],
      verifiedCandidateIndices: [0, 1],
      reviewWarnings: expect.arrayContaining([
        expect.stringContaining("Definition does not match the source"),
        expect.stringContaining("source_not_on_page"),
        "Review missing source coverage: Cell structure",
      ]),
    });
    objects.set("manifest", [{ page: 1, inputKey: event.inputKey, resultKey: event.resultKey }]);
    // A matched direct entry must not hide a different page candidate.
    objects.set("direct", { questionsJSON: [question] });
    await run("aggregate", { manifestKey: "manifest", directContentKey: "direct" });
    expect(objects.get("run/aggregate.json")).toMatchObject({
      questionsJSON: expect.arrayContaining([expect.objectContaining(question), expect.objectContaining(additional)]),
      vocabularyJSON: [vocabulary], failedPages: [],
      reviewWarnings: expect.arrayContaining([expect.stringContaining("Page 1: vocabulary")]),
    });
    expect(mocks.completion.mock.calls[0][0].messages[1].content).not.toContain("the study of plants");
    await run("finalize", { aggregateKey: "run/aggregate.json" });
    expect(mocks.saveChunks.mock.calls[0][1].content.vocabularyJSON).toEqual([{
      word: vocabulary.word, definition: vocabulary.definition, context: vocabulary.context, pages: [1],
    }]);
    expect(JSON.parse(String(document.metadata)).analysis).toMatchObject({
      reviewWarnings: expect.arrayContaining([expect.stringContaining("Page 1: vocabulary")]),
      reviewWarningCount: expect.any(Number), moderation: { flagged: false },
    });
    expect(document._version).toBe(2);
    expect(mocks.graphql).toHaveBeenCalledWith(expect.objectContaining({
      query: expect.stringContaining("condition: $condition"),
      variables: expect.objectContaining({
        condition: { _version: { eq: 1 } }, input: expect.objectContaining({ _version: 2 }),
      }),
    }));
    await expect(run("complete", { aggregateKey: "run/aggregate.json" })).resolves.toMatchObject({
      success: true, status: "completed",
    });
    expect(document.status).toBe("completed");
    expect(document._version).toBe(3);
  });

  it("does not warn for fully supported candidates", async () => {
    const result = pageResult();
    result.vocabularyJSON = [];
    result.reviewWarnings = [];
    result.uncoveredLines = [];
    result.verification = { supported: 1, unsupported: 0, omissions: [], verdicts: [{ index: 0, supported: true }] };
    objects.set(event.resultKey, result);
    await run("writeResult");
    expect(objects.get(event.resultKey)).toMatchObject({ completed: true, questionsJSON: [question], reviewWarnings: [] });
  });

  it("bounds warning metadata while retaining the full warnings in the aggregate artifact", async () => {
    const reviewWarnings = Array.from({ length: 51 }, (_, index) => `${index}: ${"x".repeat(900)}`);
    objects.set("run/aggregate.json", {
      questionsJSON: [], vocabularyJSON: [], summariesJSON: [], objectivesJSON: [], conceptsJSON: [],
      totalPages: 1, failedPages: [], done: 1, quality: {}, tokenUsageByModel: {}, reviewWarnings,
    });
    await run("finalize", { aggregateKey: "run/aggregate.json" });
    const analysis = JSON.parse(String(document.metadata)).analysis;
    expect(analysis.reviewWarnings).toHaveLength(50);
    expect(analysis.reviewWarnings.every((message: string) => message.length === 600)).toBe(true);
    expect(analysis.reviewWarningCount).toBe(51);
    expect(objects.get("run/aggregate.json")).toMatchObject({ reviewWarnings });
  });

  it("retains candidates missing verifier verdicts with warnings, never as verified inputs", async () => {
    const result = pageResult();
    result.verification.verdicts = [];
    objects.set(event.resultKey, result);
    await run("writeResult");
    expect(objects.get(event.resultKey)).toMatchObject({
      completed: true, questionsJSON: [question], vocabularyJSON: [vocabulary],
      verifiedCandidateIndices: [],
      verification: { supported: 0, unsupported: 2 },
      reviewWarnings: expect.arrayContaining([
        expect.stringContaining('question "Cytology" (definition): Verifier omitted this candidate'),
      ]),
    });
  });

  it.each([{ verdicts: [] }, { verdicts: [{ index: 0, supported: true }] }, { verdicts: undefined }])(
    "accepts incomplete verifier responses and persists missing-verdict warnings (%j)", async ({ verdicts }) => {
      mocks.completion.mockResolvedValueOnce({
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ verdicts, omissions: [] }) } }],
      });
      await run("verifyOpenAI");
      await run("writeResult");
      const supported = verdicts?.length ?? 0;
      expect(objects.get(event.resultKey)).toMatchObject({
        completed: true, questionsJSON: [question], vocabularyJSON: [vocabulary],
        verifiedCandidateIndices: supported ? [0] : [],
        verification: { supported, unsupported: 2 - supported },
        reviewWarnings: expect.arrayContaining([expect.stringContaining("Verifier omitted this candidate")]),
      });
    },
  );

  it("drops synthesized items with missing verdicts without failing aggregation", async () => {
    await run("writeResult");
    objects.set("manifest", [{ page: 1, inputKey: event.inputKey, resultKey: event.resultKey }]);
    mocks.completion
      .mockResolvedValueOnce({
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
          summariesJSON: [{ title: "Unverified summary", content: "Cells.", pageRange: "1" }],
        }) } }],
      })
      .mockResolvedValueOnce({
        choices: [{ finish_reason: "stop", message: { content: '{"verdicts":[]}' } }],
      });
    await run("aggregate", { manifestKey: "manifest" });
    expect(objects.get("run/aggregate.json")).toMatchObject({ summariesJSON: [], failedPages: [] });
  });

  it("still exposes storage failures", async () => {
    mocks.s3.mockRejectedValueOnce(new Error("S3 unavailable"));
    await expect(run("writeResult")).rejects.toThrow("S3 unavailable");
  });

  it("re-reads metadata on a version conflict instead of losing concurrent review information", async () => {
    objects.set("run/aggregate.json", { failedPages: [], totalPages: 1, done: 1, quality: {} });
    const original = mocks.graphql.getMockImplementation();
    if (!original) throw new Error("Missing GraphQL test implementation");
    let conflicted = false;
    mocks.graphql.mockImplementation(async (request) => {
      if (!conflicted && request.query.includes("mutation UpdateDocument")) {
        conflicted = true;
        const metadata = JSON.parse(String(document.metadata));
        document = { ...document, _version: 4, metadata: JSON.stringify({
          ...metadata, analysis: { ...metadata.analysis, reviewWarnings: ["Concurrent warning"] },
        }) };
        return { errors: [{ errorType: "ConditionalCheckFailedException", message: "The conditional request failed" }] };
      }
      return original(request);
    });
    await run("complete", { aggregateKey: "run/aggregate.json" });
    expect(document._version).toBe(5);
    expect(JSON.parse(String(document.metadata)).analysis.reviewWarnings).toEqual(["Concurrent warning"]);
  });

  it("does not overwrite a newer run after a write conflict", async () => {
    objects.set("run/aggregate.json", { failedPages: [], totalPages: 1, done: 1, quality: {} });
    const original = mocks.graphql.getMockImplementation();
    if (!original) throw new Error("Missing GraphQL test implementation");
    let writes = 0;
    mocks.graphql.mockImplementation(async (request) => {
      if (request.query.includes("mutation UpdateDocument")) {
        writes += 1;
        document = { ...document, _version: 4, status: "analyzing",
          metadata: JSON.stringify({ analysis: { runId: "new-run", state: "preparing" } }) };
        return { errors: [{ errorType: "ConditionalCheckFailedException", message: "The conditional request failed" }] };
      }
      return original(request);
    });
    await run("complete", { aggregateKey: "run/aggregate.json" });
    expect(writes).toBe(1);
    expect(document).toMatchObject({ _version: 4, status: "analyzing" });
    expect(JSON.parse(String(document.metadata)).analysis.runId).toBe("new-run");
  });

  it("still marks real failed pages as a failed exhaustive run", async () => {
    objects.set("run/aggregate.json", { failedPages: [2], totalPages: 2, done: 2, quality: {} });
    await expect(run("complete", { aggregateKey: "run/aggregate.json" })).resolves.toMatchObject({
      success: false, status: "failed",
    });
    expect(document.status).toBe("failed");
  });
});
