import type { Handler } from "aws-lambda";
import {
  DescribeMapRunCommand,
  ListMapRunsCommand,
  SFNClient,
} from "@aws-sdk/client-sfn";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import OpenAI from "openai";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { type Schema } from "../../data/resource";
import { extractByFormat } from "../documentAnalysis/formatRegistry.js";
import {
  analyzePages,
  assertParsedContentPayloadSize,
  checkPageFacts,
  chunkItemsByJsonSize,
  filterVerifiedEntries,
  normaliseQuestionEntries,
  retainDirectQuestionsWithVerifiedMatches,
  retainDirectVocabularyWithVerifiedMatches,
  segmentTextIntoPages,
  type AnalysisPage,
  type ExhaustiveFact,
  type FactVerificationVerdict,
  type TokenUsage,
} from "../documentAnalysis/analysis.js";
import {
  DynamoProviderRateLimitStore,
  ProviderLimitError,
  estimateRequestTokens,
  readActualTokenUsage,
  resolveProviderLimits,
  withProviderRateLimit,
  type ModelProvider,
  type ProviderLimits,
} from "./providerRateLimiter.js";

Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: process.env.API_ENDPOINT || "",
        region: process.env.AWS_REGION || "us-east-1",
        defaultAuthMode: "iam",
      },
    },
  },
  {
    Auth: {
      credentialsProvider: {
        getCredentialsAndIdentityId: async () => ({
          credentials: await fromNodeProviderChain()(),
        }),
        clearCredentialsAndIdentityId: () => {},
      },
    },
  },
);

const s3Client = new S3Client();
const sfnClient = new SFNClient();
const ssmClient = new SSMClient();
let openaiInstance: OpenAI | null = null;
let dataClient: ReturnType<typeof generateClient<Schema>> | null = null;
let anthropicKeyPromise: Promise<string | undefined> | undefined;
let providerRateLimitStore: DynamoProviderRateLimitStore | undefined;
let cachedProviderSettings:
  | { settings: Record<string, unknown>; expiresAt: number }
  | undefined;

const LIST_PLATFORM_SETTINGS = /* GraphQL */ `
  query ListPlatformSettings($limit: Int) {
    listPlatformSettings(limit: $limit) {
      items {
        id
        _deleted
        documentAnalysisOpenAiRequestsPerMinute
        documentAnalysisOpenAiTokensPerMinute
        documentAnalysisOpenAiMaxConcurrentRequests
        documentAnalysisAnthropicRequestsPerMinute
        documentAnalysisAnthropicTokensPerMinute
        documentAnalysisAnthropicMaxConcurrentRequests
      }
    }
  }
`;

const GET_DOCUMENT = /* GraphQL */ `
  query GetDocument($id: ID!) {
    getDocument(id: $id) {
      id
      _version
      metadata
    }
  }
`;

const UPDATE_DOCUMENT = /* GraphQL */ `
  mutation UpdateDocument($input: UpdateDocumentInput!) {
    updateDocument(input: $input) {
      id
      _version
      status
      pageCount
      sourceFormat
      textExtractedAt
      metadata
    }
  }
`;

const CREATE_PARSED_CONTENT = /* GraphQL */ `
  mutation CreateParsedContent($input: CreateParsedContentInput!) {
    createParsedContent(input: $input) {
      id
      documentID
      fileID
      _version
    }
  }
`;

const LIST_ANALYSIS_JOBS = /* GraphQL */ `
  query ListAnalysisJobs($filter: ModelAgentJobFilterInput, $limit: Int) {
    listAgentJobs(filter: $filter, limit: $limit) {
      items { id _version status startedAt metadata }
    }
  }
`;

const CREATE_ANALYSIS_JOB = /* GraphQL */ `
  mutation CreateAnalysisJob($input: CreateAgentJobInput!) {
    createAgentJob(input: $input) { id _version }
  }
`;

const UPDATE_ANALYSIS_JOB = /* GraphQL */ `
  mutation UpdateAnalysisJob($input: UpdateAgentJobInput!) {
    updateAgentJob(input: $input) { id _version }
  }
`;

type WorkflowEvent = {
  workflowMode:
    | "prepare"
    | "extract"
    | "verify"
    | "verifyOpenAI"
    | "repair"
    | "vision"
    | "writeResult"
    | "progress"
    | "aggregate"
    | "moderate"
    | "finalize"
    | "complete"
    | "markFailed";
  runId: string;
  documentId: string;
  fileId: string;
  identityId: string;
  s3Key: string;
  profile: "standard" | "exhaustive";
  executionArn: string;
  manifestKey?: string;
  directContentKey?: string;
  pendingMediaKey?: string;
  baseKey?: string;
  totalPages?: number;
  page?: number;
  inputKey?: string;
  resultKey?: string;
  imageKey?: string;
  mapDone?: boolean;
  available?: boolean;
  aggregateKey?: string;
  moderation?: {
    flagged: boolean;
    categories: Record<string, boolean>;
    categoryScores: Record<string, number>;
    model: string;
    chunksChecked: number;
  };
  error?: { Error?: string; Cause?: string };
};

type PageInput = AnalysisPage & {
  prevTail: string;
  nextHead: string;
  sourceFormat: string;
  profile: "standard" | "exhaustive";
};

type PageResult = {
  page: number;
  completed?: boolean;
  questionsJSON: Array<Record<string, unknown>>;
  vocabularyJSON: unknown[];
  summariesJSON: unknown[];
  objectivesJSON: unknown[];
  conceptsJSON: unknown[];
  suspect: Array<{ fact: ExhaustiveFact; reasons: string[] }>;
  verification?: {
    supported: number;
    unsupported: number;
    omissions: string[];
    verifierModel: string;
    verdicts: FactVerificationVerdict[];
  };
  needsRepair?: boolean;
  repaired?: boolean;
  sparseText?: boolean;
  usageByModel?: Record<string, TokenUsage>;
};

function getDataClient() {
  dataClient ??= generateClient<Schema>({ authMode: "iam" });
  return dataClient;
}

function getOpenAI() {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

async function getProviderSettings(): Promise<Record<string, unknown>> {
  if (cachedProviderSettings && cachedProviderSettings.expiresAt > Date.now()) {
    return cachedProviderSettings.settings;
  }

  // The generated `.models` API is unavailable in Lambda, so use raw GraphQL.
  const response = (await getDataClient().graphql({
    query: LIST_PLATFORM_SETTINGS,
    variables: { limit: 100 },
  })) as {
    data?: { listPlatformSettings?: { items?: Array<Record<string, any> | null> } };
    errors?: Array<{ message: string }>;
  };
  if (response.errors?.length) {
    throw new ProviderLimitError(
      `Unable to load document-analysis provider limits: ${response.errors
        .map((error) => error.message)
        .join("; ")}`,
    );
  }
  const settings = response.data?.listPlatformSettings?.items?.find(
    (item) => item != null && !item._deleted,
  );
  const limits: Record<string, unknown> = {
    documentAnalysisOpenAiRequestsPerMinute:
      settings?.documentAnalysisOpenAiRequestsPerMinute,
    documentAnalysisOpenAiTokensPerMinute:
      settings?.documentAnalysisOpenAiTokensPerMinute,
    documentAnalysisOpenAiMaxConcurrentRequests:
      settings?.documentAnalysisOpenAiMaxConcurrentRequests,
    documentAnalysisAnthropicRequestsPerMinute:
      settings?.documentAnalysisAnthropicRequestsPerMinute,
    documentAnalysisAnthropicTokensPerMinute:
      settings?.documentAnalysisAnthropicTokensPerMinute,
    documentAnalysisAnthropicMaxConcurrentRequests:
      settings?.documentAnalysisAnthropicMaxConcurrentRequests,
  };
  cachedProviderSettings = {
    settings: limits,
    expiresAt: Date.now() + 30_000,
  };
  return limits;
}

async function getProviderLimits(
  provider: ModelProvider,
): Promise<ProviderLimits> {
  const settings = await getProviderSettings();
  return resolveProviderLimits(
    provider,
    settings,
    process.env.DOCUMENT_ANALYSIS_DEMO_MODE === "true",
  );
}

function getProviderRateLimitStore(): DynamoProviderRateLimitStore {
  if (!providerRateLimitStore) {
    const tableName = process.env.DOCUMENT_ANALYSIS_LIMITER_TABLE;
    if (!tableName) {
      throw new ProviderLimitError(
        "DOCUMENT_ANALYSIS_LIMITER_TABLE is not configured",
      );
    }
    providerRateLimitStore = new DynamoProviderRateLimitStore(tableName);
  }
  return providerRateLimitStore;
}

async function runWithProviderLimit<T>(
  event: WorkflowEvent,
  provider: ModelProvider,
  request: unknown,
  execute: () => Promise<T>,
  defaultOutputTokens = 2048,
): Promise<T> {
  return withProviderRateLimit({
    provider,
    limits: await getProviderLimits(provider),
    estimatedTokens: estimateRequestTokens(request, defaultOutputTokens),
    store: getProviderRateLimitStore(),
    assertRunActive: () => assertRunActive(event),
    execute,
    getActualTokens: readActualTokenUsage,
  });
}

function getOpenAIForRun(event: WorkflowEvent): OpenAI {
  const client = getOpenAI();
  const limitedCompletions = new Proxy(client.chat.completions, {
    get(target, property, receiver) {
      if (property !== "create") return Reflect.get(target, property, receiver);
      return (...args: any[]) => {
        const request = args[0];
        return runWithProviderLimit(
          event,
          "openai",
          request,
          () => Reflect.apply(target.create, target, args),
        );
      };
    },
  });
  const limitedModerations = new Proxy(client.moderations, {
    get(target, property, receiver) {
      if (property !== "create") return Reflect.get(target, property, receiver);
      return (...args: any[]) => {
        const request = args[0];
        return runWithProviderLimit(
          event,
          "openai",
          request,
          () => Reflect.apply(target.create, target, args),
          0,
        );
      };
    },
  });
  const limitedChat = new Proxy(client.chat, {
    get(target, property, receiver) {
      if (property === "completions") return limitedCompletions;
      return Reflect.get(target, property, receiver);
    },
  });

  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === "chat") return limitedChat;
      if (property === "moderations") return limitedModerations;
      return Reflect.get(target, property, receiver);
    },
  });
}

async function withRateLimitTelemetry<T>(
  vendor: string,
  model: string,
  request: Promise<T>,
): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (
      error !== null &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 429
    ) {
      console.error(`MODEL_RATE_LIMITED vendor=${vendor} model=${model}`);
    }
    throw error;
  }
}

async function verifySynthesisOutput(
  sourceItems: unknown[],
  output: Record<string, unknown>,
  event: WorkflowEvent,
): Promise<{
  output: Record<string, unknown[]>;
  model: string;
  usage: TokenUsage;
}> {
  const categories = ["summariesJSON", "objectivesJSON", "conceptsJSON"] as const;
  const candidates = categories.flatMap((category) =>
    (Array.isArray(output[category]) ? output[category] : []).map((entry) => ({
      category,
      entry,
    })),
  );
  if (candidates.length === 0) {
    return {
      output: {
        summariesJSON: [],
        objectivesJSON: [],
        conceptsJSON: [],
      },
      model: "gpt-4o-mini",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }

  const completion = await withRateLimitTelemetry(
    "openai",
    "gpt-4o-mini",
    getOpenAIForRun(event).chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Verify each candidate is fully supported by the source facts. Return JSON {"verdicts":[{"index":0,"supported":true}]} with exactly one verdict for each candidate index.',
        },
        {
          role: "user",
          content: JSON.stringify({ sourceItems, candidates }),
        },
      ],
    }),
  );
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Synthesis verification returned no content");
  const parsed = JSON.parse(content) as {
    verdicts?: Array<{ index?: number; supported?: boolean }>;
  };
  if (
    !Array.isArray(parsed.verdicts) ||
    !parsed.verdicts.every(
      (verdict) =>
        Number.isInteger(verdict.index) &&
        typeof verdict.supported === "boolean",
    )
  ) {
    throw new Error("Synthesis verifier returned invalid verdicts");
  }
  const verified = filterVerifiedEntries(
    candidates,
    parsed.verdicts.map((verdict) => ({
      index: verdict.index as number,
      supported: verdict.supported as boolean,
    })),
  );
  return {
    output: Object.fromEntries(
      categories.map((category) => [
        category,
        verified
          .filter((candidate) => candidate.category === category)
          .map((candidate) => candidate.entry),
      ]),
    ),
    model: completion.model || "gpt-4o-mini",
    usage: {
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
      totalTokens: completion.usage?.total_tokens ?? 0,
    },
  };
}

function getBucketName() {
  const bucketName = process.env.STORAGE_BUCKET;
  if (!bucketName) throw new Error("STORAGE_BUCKET is not configured");
  return bucketName;
}

async function getObject(key: string): Promise<Buffer> {
  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: getBucketName(), Key: key }),
  );
  if (!response.Body) throw new Error(`S3 object has no body: ${key}`);
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson<T>(key: string): Promise<T> {
  return JSON.parse((await getObject(key)).toString("utf8")) as T;
}

async function putJson(key: string, value: unknown): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: JSON.stringify(value),
      ContentType: "application/json",
      Tagging: "analysis-run=true",
    }),
  );
}

async function getDocument(documentId: string): Promise<any> {
  const { data, errors } = (await getDataClient().graphql({
    query: GET_DOCUMENT,
    variables: { id: documentId },
  })) as any;
  if (errors?.length || !data?.getDocument) {
    throw new Error(`Unable to load Document ${documentId}`);
  }
  return data.getDocument;
}

async function updateDocument(
  documentId: string,
  update: Record<string, unknown>,
): Promise<any> {
  const current = await getDocument(documentId);
  const { data, errors } = (await getDataClient().graphql({
    query: UPDATE_DOCUMENT,
    variables: {
      input: {
        id: documentId,
        _version: current._version,
        ...update,
      },
    },
  })) as any;
  if (errors?.length || !data?.updateDocument) {
    throw new Error(`Unable to update Document ${documentId}`);
  }
  return data.updateDocument;
}

async function assertRunActive(event: WorkflowEvent): Promise<void> {
  const document = await getDocument(event.documentId);
  const metadata =
    typeof document.metadata === "string"
      ? JSON.parse(document.metadata || "{}")
      : document.metadata ?? {};
  const analysis = metadata.analysis ?? {};
  if (
    analysis.runId !== event.runId ||
    ["cancelled", "failed", "completed"].includes(analysis.state)
  ) {
    throw new Error(`Document analysis run ${event.runId} is no longer active`);
  }
}

function isNotFound(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "name" in error &&
    ((error as { name: string }).name === "NoSuchKey" ||
      (error as { name: string }).name === "NotFound")
  );
}

function toFact(question: Record<string, unknown>, pageNumber: number): ExhaustiveFact {
  return {
    subject: typeof question.subject === "string" ? question.subject : "",
    field: typeof question.field === "string" ? question.field : "",
    answer:
      typeof question.answer === "string"
        ? question.answer
        : typeof question.expectedAnswer === "string"
          ? question.expectedAnswer
          : "",
    accept: Array.isArray(question.accept)
      ? question.accept.filter((value): value is string => typeof value === "string")
      : [],
    page: typeof question.page === "number" ? question.page : pageNumber,
    sourceText:
      typeof question.sourceText === "string" ? question.sourceText : "",
  };
}

function toQuestion(fact: ExhaustiveFact): Record<string, unknown> {
  const prompt = `What is ${fact.field} for ${fact.subject}?`;
  return {
    prompt,
    answer: fact.answer,
    questionType: "recall",
    page: fact.page,
    subject: fact.subject,
    field: fact.field,
    sourceText: fact.sourceText,
    accept: fact.accept,
    question: prompt,
    expectedAnswer: fact.answer,
    type: "recall",
  };
}

function toVocabularyFact(
  entry: Record<string, unknown>,
  pageNumber: number,
): ExhaustiveFact {
  return {
    subject:
      typeof entry.word === "string"
        ? entry.word
        : typeof entry.term === "string"
          ? entry.term
          : "",
    field: "definition",
    answer:
      typeof entry.definition === "string" ? entry.definition : "",
    accept: [],
    page: typeof entry.page === "number" ? entry.page : pageNumber,
    sourceText: typeof entry.context === "string" ? entry.context : "",
  };
}

function getPageCandidates(
  result: PageResult,
  pageNumber: number,
): Array<{
  kind: "question" | "vocabulary";
  fact: ExhaustiveFact;
  entry: Record<string, unknown>;
}> {
  return [
    ...result.questionsJSON.map((question) => ({
      kind: "question" as const,
      fact: toFact(question, pageNumber),
      entry: question,
    })),
    ...result.vocabularyJSON.map((rawEntry) => {
      const entry =
        rawEntry !== null && typeof rawEntry === "object"
          ? (rawEntry as Record<string, unknown>)
          : {};
      return {
        kind: "vocabulary" as const,
        fact: toVocabularyFact(entry, pageNumber),
        entry,
      };
    }),
  ];
}

function addModelUsage(
  usageByModel: Record<string, TokenUsage> = {},
  model: string,
  usage: TokenUsage,
): Record<string, TokenUsage> {
  const previous = usageByModel[model] ?? {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };
  return {
    ...usageByModel,
    [model]: {
      promptTokens: previous.promptTokens + usage.promptTokens,
      completionTokens: previous.completionTokens + usage.completionTokens,
      totalTokens: previous.totalTokens + usage.totalTokens,
    },
  };
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    const parsed: unknown = JSON.parse(value || "{}");
    return parsed !== null && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  }
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

async function upsertAnalysisJob(
  event: WorkflowEvent,
  status: "processing" | "completed" | "failed",
  usageByModel?: Record<string, TokenUsage>,
  details: Record<string, unknown> = {},
): Promise<void> {
  const response = (await getDataClient().graphql({
    query: LIST_ANALYSIS_JOBS,
    variables: {
      filter: {
        documentID: { eq: event.documentId },
        responseId: { eq: event.runId },
      },
      limit: 2,
    },
  })) as any;
  if (response.errors?.length) {
    throw new Error(`Unable to find AgentJob for analysis run ${event.runId}`);
  }
  const matches = (response.data?.listAgentJobs?.items ?? []).filter(Boolean);
  if (matches.length > 1) {
    throw new Error(`Multiple AgentJobs exist for analysis run ${event.runId}`);
  }

  const current = matches[0];
  const currentMetadata = parseJsonObject(current?.metadata);
  const documentMetadata = parseJsonObject((await getDocument(event.documentId)).metadata);
  const analysisMetadata = parseJsonObject(documentMetadata.analysis);
  const recordedUsage =
    usageByModel ??
    (currentMetadata.usageByModel as Record<string, TokenUsage> | undefined) ??
    {};
  const tokensUsed = Object.values(recordedUsage).reduce(
    (total, usage) => total + usage.totalTokens,
    0,
  );
  const modelUsed = Object.keys(recordedUsage).sort().join(", ");
  const metadata = JSON.stringify({
    ...currentMetadata,
    ...details,
    runId: event.runId,
    usageByModel: recordedUsage,
  });
  const fields = {
    type: "pdf_analysis",
    status,
    documentID: event.documentId,
    responseId: event.runId,
    identityId: event.identityId,
    ...(modelUsed ? { modelUsed } : {}),
    ...(Object.keys(recordedUsage).length > 0 ? { tokensUsed } : {}),
    metadata,
    ...(status === "completed" || status === "failed"
      ? { completedAt: new Date().toISOString() }
      : {}),
  };

  const result = current
    ? await getDataClient().graphql({
        query: UPDATE_ANALYSIS_JOB,
        variables: {
          input: { id: current.id, _version: current._version, ...fields },
        },
      })
    : await getDataClient().graphql({
        query: CREATE_ANALYSIS_JOB,
        variables: {
          input: {
            ...fields,
            ...(typeof analysisMetadata.startedAt === "string"
              ? { startedAt: analysisMetadata.startedAt }
              : {}),
          },
        },
      });
  const errors = (result as any).errors;
  const job = current
    ? (result as any).data?.updateAgentJob
    : (result as any).data?.createAgentJob;
  if (errors?.length || !job) {
    throw new Error(`Unable to persist AgentJob for analysis run ${event.runId}`);
  }
}

async function prepare(event: WorkflowEvent) {
  await assertRunActive(event);
  const extraction = await extractByFormat(event.s3Key);
  const pages =
    (extraction.sourceFormat === "pdf" || extraction.sourceFormat === "pptx") &&
    extraction.pages.length > 0
      ? extraction.pages
      : segmentTextIntoPages(extraction.text);
  const baseKey = `private/${event.identityId}/documents/${event.documentId}/analysis/${event.runId}`;
  const pageManifest = pages.map((page) => {
    const pageKey = String(page.pageNumber).padStart(4, "0");
    return {
      page: page.pageNumber,
      inputKey: `${baseKey}/pages/${pageKey}.json`,
      resultKey: `${baseKey}/results/${pageKey}.json`,
      imageKey: `${baseKey}/images/${pageKey}.webp`,
    };
  });

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    if (!page) continue;
    const previous = pages[index - 1]?.text ?? "";
    const next = pages[index + 1]?.text ?? "";
    await putJson(pageManifest[index].inputKey, {
      ...page,
      prevTail: previous.slice(-1500),
      nextHead: next.slice(0, 1500),
      sourceFormat: extraction.sourceFormat,
      profile: event.profile,
    } satisfies PageInput);
  }

  const manifestKey = `${baseKey}/manifest.json`;
  await putJson(manifestKey, pageManifest);
  const directContentKey = `${baseKey}/direct-content.json`;
  await putJson(directContentKey, extraction.directContent ?? {});
  const pendingMedia: Array<{
    filename: string;
    mimeType: string;
    s3Key: string;
    size: number;
    description?: string;
  }> = [];
  for (const media of extraction.mediaFiles ?? []) {
    const filename = media.filename.split(/[\\/]/).pop() || "media";
    const s3Key = `protected/${event.identityId}/pending-media/${event.documentId}/${filename}`;
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: getBucketName(),
          Key: s3Key,
          Body: media.data,
          ContentType: media.mimeType,
        }),
      );
    } catch (error) {
      throw new Error(`Unable to stage extracted media ${filename}`, {
        cause: error,
      });
    }
    pendingMedia.push({
      filename,
      mimeType: media.mimeType,
      s3Key,
      size: media.data.length,
      ...(media.description ? { description: media.description } : {}),
    });
  }
  const pendingMediaKey = `${baseKey}/pending-media.json`;
  await putJson(pendingMediaKey, pendingMedia);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: `private/${event.identityId}/documents/${event.documentId}/extracted-text.txt`,
      Body: extraction.text,
      ContentType: "text/plain; charset=utf-8",
    }),
  );

  const document = await getDocument(event.documentId);
  const metadata =
    typeof document.metadata === "string"
      ? JSON.parse(document.metadata || "{}")
      : document.metadata ?? {};
  await updateDocument(event.documentId, {
    status: "analyzing",
    sourceFormat: extraction.sourceFormat,
    pageCount: pages.length,
    textExtractedAt: Date.now(),
    metadata: JSON.stringify({
      ...metadata,
      analysis: {
        runId: event.runId,
        executionArn: event.executionArn,
        mode: "workflow",
        state: "analyzing",
        totalPages: pages.length,
        done: 0,
        failed: 0,
        updatedAt: new Date().toISOString(),
      },
    }),
  });

  return {
    ...event,
    baseKey,
    manifestKey,
    directContentKey,
    pendingMediaKey,
    totalPages: pages.length,
  };
}

async function extractPage(event: WorkflowEvent): Promise<WorkflowEvent & PageResult> {
  await assertRunActive(event);
  if (!event.inputKey || !event.resultKey || !event.page) {
    throw new Error("Page extraction is missing page input metadata");
  }
  const page = await readJson<PageInput>(event.inputKey);
  const extracted = await analyzePages(
    getOpenAIForRun(event),
    [page],
    event.fileId,
    event.documentId,
    { profile: event.profile },
  );
  const questions = normaliseQuestionEntries(extracted.questionsJSON);
  const facts = questions.map((question) =>
    toFact(question as Record<string, unknown>, page.pageNumber),
  );
  const checked = checkPageFacts(page, facts);
  const result: PageResult = {
    page: page.pageNumber,
    questionsJSON: questions,
    vocabularyJSON: extracted.vocabularyJSON,
    summariesJSON: extracted.summariesJSON,
    objectivesJSON: extracted.objectivesJSON,
    conceptsJSON: extracted.conceptsJSON,
    suspect: checked.suspect,
    needsRepair: checked.suspect.length > 0,
    repaired: false,
    sparseText: page.text.trim().length < 200,
    usageByModel: { "gpt-4o": extracted.usage },
  };
  await putJson(event.resultKey, result);
  return { ...event, ...result };
}

async function verifyPage(
  event: WorkflowEvent,
): Promise<WorkflowEvent & PageResult> {
  await assertRunActive(event);
  if (!event.resultKey || !event.inputKey) {
    throw new Error("Page verification is missing result metadata");
  }
  const result = await readJson<PageResult>(event.resultKey);
  const page = await readJson<PageInput>(event.inputKey);
  const candidates = getPageCandidates(result, page.pageNumber);
  const anthropicKey = await getAnthropicKey();
  if (!anthropicKey) return { ...event, ...result, available: false };
  const model = process.env.VERIFIER_ANTHROPIC_MODEL || "claude-sonnet-5-5";
  const request = {
    model,
    max_tokens: 2048,
    system:
      'Verify each candidate against only the source page. Return JSON {"verdicts":[{"index":0,"supported":true,"reason":""}],"omissions":[]} where omissions are brief facts present in the source but missing from the candidates.',
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          page: page.text,
          candidates: candidates.map(({ kind, fact }) => ({ kind, ...fact })),
        }),
      },
    ],
  };
  const payload = await runWithProviderLimit(
    event,
    "anthropic",
    request,
    async () => {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "anthropic-version": "2023-06-01",
          "x-api-key": anthropicKey,
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        if (response.status === 429) {
          console.error(`MODEL_RATE_LIMITED vendor=anthropic model=${model}`);
        }
        const errorName =
          response.status === 429
            ? "RateLimited"
            : response.status >= 500
              ? "ModelTimeout"
              : "AnthropicVerifyError";
        throw Object.assign(
          new Error(`Anthropic verifier failed with HTTP ${response.status}`),
          { name: errorName },
        );
      }
      return (await response.json()) as {
        model?: string;
        usage?: { input_tokens?: number; output_tokens?: number };
        content?: Array<{ type?: string; text?: string }>;
      };
    },
  );
  const content = payload.content?.find((block) => block.type === "text")?.text;
  if (!content) throw new Error("Anthropic verifier returned an empty response");
  const promptTokens = payload.usage?.input_tokens ?? 0;
  const completionTokens = payload.usage?.output_tokens ?? 0;
  return applyVerification(event, result, content, payload.model || model, {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  });
}

async function verifyWithOpenAI(
  event: WorkflowEvent,
): Promise<WorkflowEvent & PageResult> {
  await assertRunActive(event);
  if (!event.resultKey || !event.inputKey) {
    throw new Error("Page verification is missing result metadata");
  }
  const result = await readJson<PageResult>(event.resultKey);
  const page = await readJson<PageInput>(event.inputKey);
  const candidates = getPageCandidates(result, page.pageNumber);
  const response = await withRateLimitTelemetry(
    "openai",
    "gpt-4o-mini",
    getOpenAIForRun(event).chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Verify each candidate against only the source page. Return JSON {"verdicts":[{"index":0,"supported":true,"reason":""}],"omissions":[]} where omissions are brief facts present in the source but missing from the candidates.',
        },
        {
          role: "user",
          content: JSON.stringify({
            page: page.text,
            candidates: candidates.map(({ kind, fact }) => ({ kind, ...fact })),
          }),
        },
      ],
    }),
  );
  const content = response.choices[0]?.message?.content;
  if (!content) throw new VerifierResponseError("Verifier returned an empty response");
  return applyVerification(
    event,
    result,
    content,
    response.model || "gpt-4o-mini",
    {
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
    },
  );
}

/** Malformed verifier output; named so the state machine retries the task. */
class VerifierResponseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "VerifierResponseError";
  }
}

async function applyVerification(
  event: WorkflowEvent,
  result: PageResult,
  content: string,
  verifierModel: string,
  usage: TokenUsage,
): Promise<WorkflowEvent & PageResult> {
  if (!event.resultKey) {
    throw new Error("Page verification is missing result metadata");
  }
  let parsed: {
    verdicts?: Array<{
      index?: number;
      supported?: boolean;
      reason?: string;
    }>;
    omissions?: string[];
  };
  try {
    parsed = JSON.parse(content);
  } catch (cause) {
    throw new VerifierResponseError("Verifier returned invalid JSON", { cause });
  }
  if (
    !Array.isArray(parsed.verdicts) ||
    !parsed.verdicts.every(
      (verdict) =>
        Number.isInteger(verdict.index) &&
        typeof verdict.supported === "boolean",
    ) ||
    !Array.isArray(parsed.omissions) ||
    !parsed.omissions.every((omission) => typeof omission === "string")
  ) {
    throw new VerifierResponseError("Verifier returned an invalid verdict payload");
  }
  const candidates = getPageCandidates(result, result.page);
  const verdicts: FactVerificationVerdict[] = parsed.verdicts.map((item) => ({
    index: item.index as number,
    supported: item.supported as boolean,
    ...(item.reason ? { reason: item.reason } : {}),
  }));
  try {
    filterVerifiedEntries(candidates, verdicts);
  } catch (cause) {
    throw new VerifierResponseError(
      cause instanceof Error ? cause.message : "Verifier verdicts were invalid",
      { cause },
    );
  }
  const verification = {
    supported: verdicts.filter((item) => item.supported).length,
    unsupported: verdicts.filter((item) => !item.supported).length,
    omissions: parsed.omissions,
    verifierModel,
    verdicts,
  };
  const next = {
    ...result,
    usageByModel: addModelUsage(result.usageByModel, verifierModel, usage),
    verification,
    needsRepair:
      (result.needsRepair ?? false) ||
      verification.unsupported > 0 ||
      verification.omissions.length > 0,
  };
  await putJson(event.resultKey, next);
  return { ...event, ...next, available: true };
}

async function getAnthropicKey(): Promise<string | undefined> {
  if (!anthropicKeyPromise) {
    anthropicKeyPromise = (async () => {
      const parameterName = process.env.ANTHROPIC_API_KEY_PARAMETER;
      if (!parameterName) return undefined;
      let response;
      try {
        response = await ssmClient.send(
          new GetParameterCommand({
            Name: parameterName,
            WithDecryption: true,
          }),
        );
      } catch (error) {
        if (
          error !== null &&
          typeof error === "object" &&
          "name" in error &&
          (error as { name: string }).name === "ParameterNotFound"
        ) {
          return undefined;
        }
        throw error;
      }
      const value = response.Parameter?.Value;
      if (!value) {
        throw new Error(
          `SSM parameter ${parameterName} did not contain an API key`,
        );
      }
      return value;
    })();
  }
  return anthropicKeyPromise;
}

async function repairPage(
  event: WorkflowEvent,
): Promise<WorkflowEvent & PageResult> {
  await assertRunActive(event);
  if (!event.resultKey || !event.inputKey) {
    throw new Error("Page repair is missing result metadata");
  }
  const previous = await readJson<PageResult>(event.resultKey);
  const page = await readJson<PageInput>(event.inputKey);
  const repaired = await analyzePages(
    getOpenAIForRun(event),
    [page],
    event.fileId,
    event.documentId,
    { profile: "exhaustive" },
  );
  const mergedQuestions = [
    ...previous.questionsJSON,
    ...normaliseQuestionEntries(repaired.questionsJSON),
  ];
  const uniqueQuestions = new Map<string, Record<string, unknown>>();
  for (const question of mergedQuestions) {
    const key = [
      question.page,
      question.subject,
      question.field,
      question.answer,
      question.sourceText,
    ].join("\u0000");
    uniqueQuestions.set(key, question);
  }
  const questionsJSON = [...uniqueQuestions.values()];
  const checked = checkPageFacts(
    page,
    questionsJSON.map((question) =>
      toFact(question, page.pageNumber),
    ),
  );
  const next: PageResult = {
    ...previous,
    questionsJSON,
    vocabularyJSON: [
      ...previous.vocabularyJSON,
      ...repaired.vocabularyJSON,
    ],
    suspect: checked.suspect,
    repaired: true,
    needsRepair: false,
    usageByModel: addModelUsage(
      previous.usageByModel,
      "gpt-4o",
      repaired.usage,
    ),
  };
  await putJson(event.resultKey, next);
  return { ...event, ...next };
}

async function analyzeVisionPage(
  event: WorkflowEvent,
): Promise<WorkflowEvent & PageResult> {
  await assertRunActive(event);
  if (!event.resultKey || !event.inputKey || !event.imageKey) {
    throw new Error("Vision analysis is missing page or image metadata");
  }
  const previous = await readJson<PageResult>(event.resultKey);
  const page = await readJson<PageInput>(event.inputKey);
  const image = await getObject(event.imageKey);
  const imageUrl = `data:image/webp;base64,${image.toString("base64")}`;
  const completion = await withRateLimitTelemetry(
    "openai",
    "gpt-4o",
    getOpenAIForRun(event).chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract discrete educational facts visible on this page. Return JSON with facts, each containing subject, field, answer, accept, page, and sourceText, and vocabulary, each containing term, definition, context, and page. Use only visible page content.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Page ${page.pageNumber}. Existing extracted text: ${page.text}`,
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  );
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Vision model returned an empty response");
  const parsed = JSON.parse(content) as {
    facts?: unknown[];
    vocabulary?: unknown[];
  };
  if (!Array.isArray(parsed.facts) || !Array.isArray(parsed.vocabulary)) {
    throw new Error("Vision model returned an invalid extraction payload");
  }
  const visualFacts = parsed.facts.map((fact) =>
    toFact(
      fact !== null && typeof fact === "object"
        ? (fact as Record<string, unknown>)
        : {},
      page.pageNumber,
    ),
  );
  const visualQuestions = visualFacts.map(toQuestion);
  const questionsJSON = [...previous.questionsJSON, ...visualQuestions];
  const checked = checkPageFacts(
    page,
    questionsJSON.map((question) => toFact(question, page.pageNumber)),
  );
  const next: PageResult = {
    ...previous,
    questionsJSON,
    vocabularyJSON: [...previous.vocabularyJSON, ...parsed.vocabulary],
    suspect: checked.suspect,
    needsRepair: checked.suspect.length > 0,
    usageByModel: addModelUsage(
      previous.usageByModel,
      "gpt-4o",
      {
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
      },
    ),
  };
  await putJson(event.resultKey, next);
  return { ...event, ...next };
}

async function writeResult(
  event: WorkflowEvent,
): Promise<WorkflowEvent & PageResult> {
  if (!event.resultKey) throw new Error("Missing page result key");
  const result = await readJson<PageResult>(event.resultKey);
  if (!event.inputKey || !result.verification) {
    throw new Error("Cannot persist page results without verified source metadata");
  }
  const page = await readJson<PageInput>(event.inputKey);
  const candidates = getPageCandidates(result, page.pageNumber);
  const verified = filterVerifiedEntries(
    candidates,
    result.verification.verdicts,
  ).filter(
    ({ fact }) => checkPageFacts(page, [fact]).facts.length === 1,
  );
  const completed = {
    ...result,
    questionsJSON: verified
      .filter((candidate) => candidate.kind === "question")
      .map((candidate) => candidate.entry),
    vocabularyJSON: verified
      .filter((candidate) => candidate.kind === "vocabulary")
      .map((candidate) => candidate.entry),
    completed: true,
  };
  await putJson(event.resultKey, completed);
  return { ...event, ...completed };
}

async function updateAnalysisMetadata(
  event: WorkflowEvent,
  analysisUpdate: Record<string, unknown>,
  documentStatus?: string,
) {
  const document = await getDocument(event.documentId);
  const metadata =
    typeof document.metadata === "string"
      ? JSON.parse(document.metadata || "{}")
      : document.metadata ?? {};
  const currentAnalysis = metadata.analysis ?? {};
  if (
    currentAnalysis.runId !== event.runId ||
    currentAnalysis.state === "cancelled"
  ) {
    return;
  }
  await updateDocument(event.documentId, {
    ...(documentStatus ? { status: documentStatus } : {}),
    metadata: JSON.stringify({
      ...metadata,
      analysis: {
        ...currentAnalysis,
        ...analysisUpdate,
        updatedAt: new Date().toISOString(),
      },
    }),
  });
}

async function reportProgress(event: WorkflowEvent) {
  const mapRuns = await sfnClient.send(
    new ListMapRunsCommand({ executionArn: event.executionArn }),
  );
  const run = mapRuns.mapRuns?.[0];
  if (!run?.mapRunArn) {
    return { ...event, mapDone: false };
  }
  const details = await sfnClient.send(
    new DescribeMapRunCommand({ mapRunArn: run.mapRunArn }),
  );
  const counts = details.itemCounts;
  const totalPages =
    counts?.total ??
    (typeof event.totalPages === "number" ? event.totalPages : 0);
  const done =
    (counts?.succeeded ?? 0) +
    (counts?.failed ?? 0) +
    (counts?.timedOut ?? 0) +
    (counts?.aborted ?? 0);
  const mapDone = (counts?.running ?? 0) === 0 && (counts?.pending ?? 0) === 0;
  await updateAnalysisMetadata(event, {
    state: mapDone ? "aggregating" : "analyzing",
    totalPages,
    done,
    failed: counts?.failed ?? 0,
  });
  return { ...event, mapDone };
}

async function aggregate(event: WorkflowEvent) {
  await assertRunActive(event);
  if (!event.manifestKey) throw new Error("Missing workflow page manifest");
  const manifest = await readJson<
    Array<{ page: number; inputKey: string; resultKey: string }>
  >(event.manifestKey);
  const pageResults: PageResult[] = [];
  const failedPages: number[] = [];
  for (const item of manifest) {
    try {
      const result = await readJson<PageResult>(item.resultKey);
      if (!result.completed) failedPages.push(item.page);
      else pageResults.push(result);
    } catch (error) {
      if (!isNotFound(error)) throw error;
      failedPages.push(item.page);
    }
  }

  const directContent = event.directContentKey
    ? await readJson<Record<string, unknown>>(event.directContentKey)
    : {};
  const verifiedQuestions = pageResults.flatMap((page) => page.questionsJSON);
  const verifiedVocabulary = pageResults.flatMap((page) => page.vocabularyJSON);
  const directQuestions = Array.isArray(directContent.questionsJSON)
    ? retainDirectQuestionsWithVerifiedMatches(
        directContent.questionsJSON,
        verifiedQuestions,
      )
    : [];
  const directVocabulary = Array.isArray(directContent.vocabularyJSON)
    ? retainDirectVocabularyWithVerifiedMatches(
        directContent.vocabularyJSON,
        verifiedVocabulary,
      )
    : [];
  const questionsJSON =
    directQuestions.length > 0 ? directQuestions : verifiedQuestions;
  const vocabularyJSON =
    directVocabulary.length > 0 ? directVocabulary : verifiedVocabulary;
  const tokenUsageByModel = pageResults.reduce<Record<string, TokenUsage>>(
    (usage, page) => {
      for (const [model, modelUsage] of Object.entries(
        page.usageByModel ?? {},
      )) {
        Object.assign(usage, addModelUsage(usage, model, modelUsage));
      }
      return usage;
    },
    {},
  );
  const synthesisItems = [
    ...questionsJSON.map((question) => {
      if (question === null || typeof question !== "object") return question;
      const entry = question as Record<string, unknown>;
      return {
        type: "question",
        prompt: entry.prompt ?? entry.question,
        answer: entry.answer ?? entry.expectedAnswer,
        subject: entry.subject,
        field: entry.field,
        page: entry.page,
      };
    }),
    ...vocabularyJSON.map((value) => {
      if (value === null || typeof value !== "object") return value;
      const entry = value as Record<string, unknown>;
      return {
        type: "vocabulary",
        word: entry.word ?? entry.term,
        definition: entry.definition,
        page: entry.page,
      };
    }),
  ];
  let reductionBatches = chunkItemsByJsonSize(synthesisItems, 32_000);
  if (reductionBatches.length === 0) reductionBatches = [[]];
  let synthesized: Record<string, unknown> = {};

  while (reductionBatches.length > 0) {
    const reductions: Array<Record<string, unknown>> = [];
    for (const batch of reductionBatches) {
      const completion = await withRateLimitTelemetry(
        "openai",
        "gpt-4o",
        getOpenAIForRun(event).chat.completions.create({
          model: "gpt-4o",
          max_tokens: 2048,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Synthesize concise document summaries, learning objectives, and concepts from the verified facts. Return JSON with summariesJSON, objectivesJSON, and conceptsJSON arrays. Do not add facts absent from the provided material.",
            },
            { role: "user", content: JSON.stringify(batch) },
          ],
        }),
      );
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Document synthesis returned no content");
      }
      const reduction = JSON.parse(content) as Record<string, unknown>;
      const model = completion.model || "gpt-4o";
      Object.assign(
        tokenUsageByModel,
        addModelUsage(
        tokenUsageByModel,
        model,
        {
          promptTokens: completion.usage?.prompt_tokens ?? 0,
          completionTokens: completion.usage?.completion_tokens ?? 0,
          totalTokens: completion.usage?.total_tokens ?? 0,
        },
        ),
      );
      const verified = await verifySynthesisOutput(batch, reduction, event);
      reductions.push(verified.output);
      Object.assign(
        tokenUsageByModel,
        addModelUsage(tokenUsageByModel, verified.model, verified.usage),
      );
    }
    if (reductions.length === 1) {
      synthesized = reductions[0];
      break;
    }
    reductionBatches = chunkItemsByJsonSize(reductions, 32_000);
  }
  const result = {
    questionsJSON,
    vocabularyJSON,
    summariesJSON: Array.isArray(synthesized.summariesJSON)
      ? synthesized.summariesJSON
      : [],
    objectivesJSON: Array.isArray(synthesized.objectivesJSON)
      ? synthesized.objectivesJSON
      : [],
    conceptsJSON: Array.isArray(synthesized.conceptsJSON)
      ? synthesized.conceptsJSON
      : [],
    tokenUsageByModel,
    failedPages,
    totalPages: manifest.length,
    done: pageResults.length + failedPages.length,
    quality: pageResults.reduce(
      (summary, page) => ({
        supported:
          summary.supported + (page.verification?.supported ?? 0),
        unsupported:
          summary.unsupported + (page.verification?.unsupported ?? 0),
        omissionsFound:
          summary.omissionsFound + (page.verification?.omissions.length ?? 0),
        repaired: summary.repaired + (page.repaired ? 1 : 0),
      }),
      { supported: 0, unsupported: 0, omissionsFound: 0, repaired: 0 },
    ),
  };
  const resultKey = `${event.baseKey}/aggregate.json`;
  await putJson(resultKey, result);
  return { ...event, aggregateKey: resultKey };
}

async function moderate(event: WorkflowEvent) {
  await assertRunActive(event);
  if (!event.aggregateKey) {
    throw new Error("Missing aggregate content for moderation");
  }
  const extractedTextKey = `private/${event.identityId}/documents/${event.documentId}/extracted-text.txt`;
  const sourceText = (await getObject(extractedTextKey)).toString("utf8");
  const content = await readJson<Record<string, unknown>>(event.aggregateKey);
  const text = `${sourceText}\n\n${JSON.stringify(content)}`;
  const chunks: string[] = [];
  for (let offset = 0; offset < text.length; offset += 8_000) {
    chunks.push(text.slice(offset, offset + 8_000));
  }
  const categories: Record<string, boolean> = {};
  const categoryScores: Record<string, number> = {};
  let flagged = false;
  let model = "omni-moderation-latest";

  for (const chunk of chunks) {
    const response = await withRateLimitTelemetry(
      "openai",
      model,
      getOpenAIForRun(event).moderations.create({
        model,
        input: chunk,
      }),
    );
    const result = response.results[0];
    if (!result) throw new Error("Moderation returned no result for a text chunk");
    model = response.model || model;
    flagged ||= result.flagged;
    for (const [category, categoryFlagged] of Object.entries(result.categories)) {
      categories[category] ||= categoryFlagged;
    }
    for (const [category, score] of Object.entries(result.category_scores)) {
      categoryScores[category] = Math.max(
        categoryScores[category] ?? 0,
        score,
      );
    }
  }

  const moderation = {
    flagged,
    categories,
    categoryScores,
    model,
    chunksChecked: chunks.length,
    checkedAt: new Date().toISOString(),
  };
  await updateAnalysisMetadata(event, { moderation });
  return { ...event, moderation };
}

async function finalize(event: WorkflowEvent & { aggregateKey: string }) {
  await assertRunActive(event);
  const result = await readJson<{
    questionsJSON: unknown[];
    vocabularyJSON: unknown[];
    summariesJSON: unknown[];
    objectivesJSON: unknown[];
    conceptsJSON: unknown[];
    failedPages: number[];
    totalPages: number;
    done: number;
    quality: Record<string, number>;
    tokenUsageByModel: Record<string, TokenUsage>;
  }>(event.aggregateKey);
  const existing = await getDataClient().graphql({
    query: /* GraphQL */ `
      query ListParsedContents($filter: ModelParsedContentFilterInput) {
        listParsedContents(filter: $filter, limit: 1) {
          items { id _version }
        }
      }
    `,
    variables: {
      filter: {
        documentID: { eq: event.documentId },
        fileID: { eq: event.fileId },
      },
    },
  }) as any;
  if (existing.errors?.length) {
    throw new Error(`Unable to check existing ParsedContent for ${event.documentId}`);
  }
  const pendingMedia = event.pendingMediaKey
    ? await readJson<unknown[]>(event.pendingMediaKey)
    : [];
  const contentInput = {
    documentID: event.documentId,
    fileID: event.fileId,
    vocabularyJSON: JSON.stringify(result.vocabularyJSON),
    summariesJSON: JSON.stringify(result.summariesJSON),
    objectivesJSON: JSON.stringify(result.objectivesJSON),
    conceptsJSON: JSON.stringify(result.conceptsJSON),
    questionsJSON: JSON.stringify(normaliseQuestionEntries(result.questionsJSON)),
    pendingMediaJSON:
      pendingMedia.length > 0 ? JSON.stringify(pendingMedia) : undefined,
    modelUsed: "gpt-4o",
    createdAt: new Date().toISOString(),
  };
  assertParsedContentPayloadSize(contentInput);
  const current = existing.data?.listParsedContents?.items?.[0];
  if (current) {
    const update = await getDataClient().graphql({
      query: /* GraphQL */ `
        mutation UpdateParsedContent($input: UpdateParsedContentInput!) {
          updateParsedContent(input: $input) { id _version }
        }
      `,
      variables: {
        input: { id: current.id, _version: current._version, ...contentInput },
      },
    }) as any;
    if (update.errors?.length || !update.data?.updateParsedContent) {
      throw new Error(`Unable to update ParsedContent for ${event.documentId}`);
    }
  } else {
    const created = await getDataClient().graphql({
      query: CREATE_PARSED_CONTENT,
      variables: { input: contentInput },
    }) as any;
    if (created.errors?.length || !created.data?.createParsedContent) {
      throw new Error(`Unable to create ParsedContent for ${event.documentId}`);
    }
  }
  await upsertAnalysisJob(
    event,
    "processing",
    result.tokenUsageByModel,
    {
      totalPages: result.totalPages,
      failedPages: result.failedPages,
      quality: result.quality,
    },
  );
  await updateAnalysisMetadata(
    event,
    {
      state: "embedding",
      totalPages: result.totalPages,
      done: result.done,
      failed: result.failedPages.length,
      failedPages: result.failedPages,
      quality: result.quality,
    },
  );
  return { ...event, status: "embedding" };
}

async function complete(event: WorkflowEvent & { aggregateKey: string }) {
  await assertRunActive(event);
  const result = await readJson<{
    failedPages: number[];
    totalPages: number;
    done: number;
    quality: Record<string, number>;
  }>(event.aggregateKey);
  const status =
    event.profile === "exhaustive" && result.failedPages.length > 0
      ? "failed"
      : "completed";
  await upsertAnalysisJob(event, status, undefined, {
    totalPages: result.totalPages,
    failedPages: result.failedPages,
    quality: result.quality,
  });
  await updateAnalysisMetadata(
    event,
    {
      state: status,
      totalPages: result.totalPages,
      done: result.done,
      failed: result.failedPages.length,
      failedPages: result.failedPages,
      quality: result.quality,
    },
    status,
  );
  return { success: status === "completed", documentId: event.documentId, status };
}

async function markFailed(event: WorkflowEvent) {
  const message = event.error?.Cause ?? event.error?.Error ?? "Workflow failed";
  await upsertAnalysisJob(event, "failed", undefined, { error: message });
  await updateAnalysisMetadata(
    event,
    { state: "failed", error: message },
    "failed",
  );
  return { success: false, documentId: event.documentId, message };
}

export const handler: Handler = async (event: WorkflowEvent) => {
  switch (event.workflowMode) {
    case "prepare":
      return prepare(event);
    case "extract":
      return extractPage(event);
    case "verify":
      return verifyPage(event);
    case "verifyOpenAI":
      return verifyWithOpenAI(event);
    case "repair":
      return repairPage(event);
    case "vision":
      return analyzeVisionPage(event);
    case "writeResult":
      return writeResult(event);
    case "progress":
      return reportProgress(event);
    case "aggregate":
      return aggregate(event);
    case "moderate":
      return moderate(event);
    case "finalize":
      return finalize(event as WorkflowEvent & { aggregateKey: string });
    case "complete":
      return complete(event as WorkflowEvent & { aggregateKey: string });
    case "markFailed":
      return markFailed(event);
    default:
      throw new Error(`Unsupported document analysis workflow mode`);
  }
};
