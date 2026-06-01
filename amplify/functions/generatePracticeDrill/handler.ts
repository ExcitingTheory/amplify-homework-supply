/**
 * Generate Practice Drill — Lambda Handler
 *
 * Called via GraphQL mutation: generatePracticeDrill(unitId, drillType, count, sourcesEnabled)
 *
 * 1. Fetches unit + related vocabulary, questions, documents, and ParsedContent
 * 2. Builds an OpenAI prompt with all source material
 * 3. GPT-4 generates PracticeDrillBlock[] with rephrased questions
 * 4. attachAudioToBlocks() — batch TTS for all pronounceable text
 * 5. Returns blocks with embedded audio + pronunciation metadata
 */

import type { Handler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "../../data/resource";
import { fromEnv } from "@aws-sdk/credential-providers";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import OpenAI from "openai";

// ============================================================================
// Types
// ============================================================================

interface SourcesEnabled {
  vocabulary: boolean;
  questions: boolean;
  text: boolean;
  documents: boolean;
}

interface PracticeDrillBlock {
  type: "quiz" | "answer" | "meaning-association" | "custom-answer";
  instruction: string;
  documentRef?: { filename: string; page: number | string };
  choices?: { choice: string; correct: boolean }[];
  expectedAnswer?: string;
  pairs?: { term: string; definition: string }[];
  hint?: string;
  sourceBlockId?: string;
  sourceItemId: string;
  sourceType: "vocabulary" | "question" | "text" | "document";
  audio?: {
    instruction?: string;
    expectedAnswer?: string;
    choices?: Record<string, string>;
    pairs?: Record<string, string>;
    hint?: string;
  };
  pronunciation?: {
    enabled: boolean;
    targetText: string;
    targetLanguage?: string;
    audioKey?: string;
    maxAttempts?: number;
  };
}

// ============================================================================
// Amplify / OpenAI setup
// ============================================================================

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
          credentials: await fromEnv()(),
        }),
        clearCredentialsAndIdentityId: () => {},
      },
    },
  },
);

let openaiInstance: any = null;
let dataClient: ReturnType<typeof generateClient<Schema>> | null = null;

async function getOpenAI() {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiInstance;
}

function getDataClient() {
  if (!dataClient) {
    dataClient = generateClient<Schema>({ authMode: "iam" });
  }
  return dataClient;
}

// ============================================================================
// GraphQL queries for fetching unit data
// ============================================================================

const GET_UNIT = /* GraphQL */ `
  query GetUnit($id: ID!) {
    getUnit(id: $id) {
      id
      _version
      _lastChangedAt
      _deleted
      name
      identityId
      contentVersion
      language
    }
  }
`;

const s3 = new S3Client({});
const bucketName = process.env.STORAGE_BUCKET;

/**
 * Read published unit content from S3.
 * Lambda IAM role has full bucket access — no path prefix restrictions.
 */
async function getUnitContentFromS3(
  identityId: string,
  unitId: string,
): Promise<string | null> {
  if (!bucketName) return null;
  try {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: `protected/${identityId}/units/${unitId}/published.json`,
      }),
    );
    return (await response.Body?.transformToString()) ?? null;
  } catch {
    return null;
  }
}

const LIST_UNIT_WORDS = /* GraphQL */ `
  query ListUnitWords($filter: ModelUnitWordFilterInput) {
    listUnitWords(filter: $filter) {
      items {
        id
        _version
        _lastChangedAt
        _deleted
        wordId
        word {
          id
          _version
          _lastChangedAt
          _deleted
          phrase
          definition
          phonetic
          language
          audioPath
        }
      }
    }
  }
`;

const LIST_QUESTION_UNITS = /* GraphQL */ `
  query ListQuestionUnits($filter: ModelQuestionUnitFilterInput) {
    listQuestionUnits(filter: $filter) {
      items {
        id
        _version
        _lastChangedAt
        _deleted
        questionId
        question {
          id
          _version
          _lastChangedAt
          _deleted
          prompt
          answer
          choices
          type
          audioPath
          imagePath
        }
      }
    }
  }
`;

const LIST_UNIT_DOCUMENTS = /* GraphQL */ `
  query ListUnitDocuments($filter: ModelUnitDocumentFilterInput) {
    listUnitDocuments(filter: $filter) {
      items {
        id
        _version
        _lastChangedAt
        _deleted
        documentId
        document {
          id
          _version
          _lastChangedAt
          _deleted
          filename
          identityId
          textExtractedAt
          parsedContent {
            items {
              id
              _version
              _lastChangedAt
              _deleted
              vocabularyJSON
              questionsJSON
              summariesJSON
              conceptsJSON
              page
            }
          }
        }
      }
    }
  }
`;

// ============================================================================
// Voice selection by language
// ============================================================================

const VOICE_MAP: Record<string, string> = {
  ja: "nova",
  jp: "nova",
  es: "shimmer",
  fr: "shimmer",
  it: "shimmer",
  pt: "shimmer",
  de: "alloy",
  ko: "nova",
  zh: "nova",
};

function selectVoice(language?: string): string {
  if (!language) return "alloy";
  const lang = language.toLowerCase().slice(0, 2);
  return VOICE_MAP[lang] || "alloy";
}

// ============================================================================
// Source material fetching
// ============================================================================

interface SourceMaterial {
  vocabulary: {
    id: string;
    phrase: string;
    definition: string;
    phonetic?: string;
    language?: string;
  }[];
  questions: {
    id: string;
    prompt: string;
    answer: string;
    choices?: string;
    type?: string;
  }[];
  textBlocks: { id: string; text: string }[];
  documents: {
    id: string;
    filename: string;
    concepts: any[];
    vocabulary: any[];
    summaries: any[];
  }[];
  language?: string;
}

async function fetchSourceMaterial(
  unitId: string,
  sourcesEnabled: SourcesEnabled,
): Promise<SourceMaterial> {
  const client = getDataClient();
  const material: SourceMaterial = {
    vocabulary: [],
    questions: [],
    textBlocks: [],
    documents: [],
  };

  // Fetch unit
  const { data: unitData } = (await client.graphql({
    query: GET_UNIT,
    variables: { id: unitId },
  })) as any;
  const unit = unitData?.getUnit;
  if (!unit) throw new Error(`Unit ${unitId} not found`);
  material.language = unit.language;

  // Fetch vocabulary words
  if (sourcesEnabled.vocabulary) {
    const { data: wordsData } = (await client.graphql({
      query: LIST_UNIT_WORDS,
      variables: { filter: { unitId: { eq: unitId } } },
    })) as any;
    material.vocabulary = (wordsData?.listUnitWords?.items || [])
      .filter((uw: any) => uw?.word)
      .map((uw: any) => ({
        id: uw.word.id,
        phrase: uw.word.phrase,
        definition: uw.word.definition || "",
        phonetic: uw.word.phonetic,
        language: uw.word.language,
      }));
  }

  // Fetch questions
  if (sourcesEnabled.questions) {
    const { data: questionsData } = (await client.graphql({
      query: LIST_QUESTION_UNITS,
      variables: { filter: { unitId: { eq: unitId } } },
    })) as any;
    material.questions = (questionsData?.listQuestionUnits?.items || [])
      .filter((qu: any) => qu?.question)
      .map((qu: any) => ({
        id: qu.question.id,
        prompt: qu.question.prompt,
        answer: qu.question.answer || "",
        choices: qu.question.choices,
        type: qu.question.type,
      }));
  }

  // Extract text blocks from Lexical content (read from S3)
  if (sourcesEnabled.text && unit.identityId) {
    try {
      const s3Content = await getUnitContentFromS3(unit.identityId, unitId);
      if (s3Content) {
        const lexicalData =
          typeof s3Content === "string" ? JSON.parse(s3Content) : s3Content;
        const textBlocks = extractTextBlocks(lexicalData);
        material.textBlocks = textBlocks.map((text: string, i: number) => ({
          id: `text-block-${i}`,
          text,
        }));
      }
    } catch {
      // Skip text blocks if parsing fails
    }
  }

  // Fetch documents with parsed content
  if (sourcesEnabled.documents) {
    const { data: docsData } = (await client.graphql({
      query: LIST_UNIT_DOCUMENTS,
      variables: { filter: { unitId: { eq: unitId } } },
    })) as any;
    material.documents = (docsData?.listUnitDocuments?.items || [])
      .filter((ud: any) => ud?.document)
      .map((ud: any) => {
        const doc = ud.document;
        const parsedItems = doc.parsedContent?.items || [];
        return {
          id: doc.id,
          filename: doc.filename || "document",
          concepts: parsedItems.flatMap((p: any) =>
            safeParseJSON(p.conceptsJSON, []),
          ),
          vocabulary: parsedItems.flatMap((p: any) =>
            safeParseJSON(p.vocabularyJSON, []),
          ),
          summaries: parsedItems.flatMap((p: any) =>
            safeParseJSON(p.summariesJSON, []),
          ),
        };
      });
  }

  return material;
}

function extractTextBlocks(lexicalData: any): string[] {
  const texts: string[] = [];
  function walk(node: any) {
    if (node.type === "text" && node.text) {
      texts.push(node.text);
    }
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  }
  if (lexicalData?.root) walk(lexicalData.root);
  return texts.filter((t) => t.trim().length > 10); // Skip very short fragments
}

function safeParseJSON(str: string | null | undefined, fallback: any): any {
  if (!str) return fallback;
  try {
    return typeof str === "string" ? JSON.parse(str) : str;
  } catch {
    return fallback;
  }
}

// ============================================================================
// GPT-4 question generation
// ============================================================================

function buildGenerationPrompt(
  material: SourceMaterial,
  drillType: string,
  count: number,
): string {
  const parts: string[] = [];

  parts.push(`You are generating ${count} practice questions for a student.`);
  parts.push("The source material is provided below.\n");
  parts.push("RULES:");
  parts.push(
    "1. Every question MUST test the same concept/meaning as the source.",
  );
  parts.push(
    "2. REPHRASE questions using synonyms and different sentence structures.",
  );
  parts.push(
    "3. For vocabulary drills, use the SAME target word but change the definition phrasing.",
  );
  parts.push(
    "4. For multiple-choice, generate plausible wrong answers from OTHER vocabulary/concepts in this unit.",
  );
  parts.push(
    "5. When a question derives from a document, include { filename, page } from the source.",
  );
  parts.push(
    "6. Never change the factual answer — only change how the question is asked.",
  );
  parts.push(
    "7. For vocabulary words, set pronunciation.enabled = true with the word as targetText.",
  );
  parts.push(
    "8. Vary block types: quiz (multiple-choice), answer (short-answer), meaning-association (matching), custom-answer (free-response).\n",
  );

  if (drillType === "VOCABULARY" || drillType === "vocabulary") {
    parts.push(
      "FOCUS: Generate primarily vocabulary-based drills (definitions, matching, fill-in-blank).\n",
    );
  } else if (drillType === "COMPREHENSION" || drillType === "comprehension") {
    parts.push(
      "FOCUS: Generate primarily comprehension questions from documents and text content.\n",
    );
  }

  // Source material
  if (material.vocabulary.length > 0) {
    parts.push("=== VOCABULARY ===");
    for (const w of material.vocabulary) {
      parts.push(
        `- ${w.phrase}: ${w.definition}${w.phonetic ? ` (${w.phonetic})` : ""}${w.language ? ` [${w.language}]` : ""}`,
      );
    }
    parts.push("");
  }

  if (material.questions.length > 0) {
    parts.push("=== QUESTION BANK ===");
    for (const q of material.questions) {
      parts.push(
        `- Q: ${q.prompt} | A: ${q.answer}${q.type ? ` | Type: ${q.type}` : ""}`,
      );
    }
    parts.push("");
  }

  if (material.textBlocks.length > 0) {
    parts.push("=== TEXT CONTENT ===");
    for (const tb of material.textBlocks.slice(0, 20)) {
      parts.push(`- ${tb.text}`);
    }
    parts.push("");
  }

  if (material.documents.length > 0) {
    parts.push("=== DOCUMENTS ===");
    for (const doc of material.documents) {
      parts.push(`File: ${doc.filename}`);
      if (doc.concepts.length > 0)
        parts.push(`  Concepts: ${JSON.stringify(doc.concepts.slice(0, 10))}`);
      if (doc.vocabulary.length > 0)
        parts.push(
          `  Vocabulary: ${JSON.stringify(doc.vocabulary.slice(0, 10))}`,
        );
      if (doc.summaries.length > 0)
        parts.push(`  Summaries: ${JSON.stringify(doc.summaries.slice(0, 5))}`);
    }
    parts.push("");
  }

  parts.push(
    `Generate exactly ${count} practice blocks as a JSON array of objects.`,
  );
  parts.push(
    "Each object must have: type, instruction, sourceItemId, sourceType",
  );
  parts.push(
    "Optional fields: choices (for quiz), expectedAnswer (for answer/custom-answer), pairs (for meaning-association), hint, documentRef, pronunciation",
  );
  parts.push(
    'For pronunciation: { enabled: true, targetText: "<word>", targetLanguage: "<iso-code>" }',
  );
  parts.push("\nRespond with ONLY the JSON array, no markdown formatting.");

  return parts.join("\n");
}

async function generateBlocks(
  material: SourceMaterial,
  drillType: string,
  count: number,
): Promise<PracticeDrillBlock[]> {
  const openai = await getOpenAI();
  const prompt = buildGenerationPrompt(material, drillType, count);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a practice drill generator for an educational platform. Output valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "[]";
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error(
      "[generatePracticeDrill] Failed to parse GPT response:",
      content,
    );
    throw new Error("Failed to parse AI-generated practice blocks");
  }

  // Handle both { blocks: [...] } and [...] formats
  const blocks: PracticeDrillBlock[] = Array.isArray(parsed)
    ? parsed
    : parsed.blocks || parsed.items || [];

  // Validate and normalize each block
  return blocks.slice(0, count).map((block: any, i: number) => ({
    type: block.type || "quiz",
    instruction: block.instruction || block.question || "",
    documentRef: block.documentRef,
    choices: block.choices,
    expectedAnswer: block.expectedAnswer || block.answer,
    pairs: block.pairs,
    hint: block.hint,
    sourceBlockId: block.sourceBlockId,
    sourceItemId: block.sourceItemId || `generated-${i}`,
    sourceType: block.sourceType || "text",
    pronunciation: block.pronunciation,
  }));
}

// ============================================================================
// TTS audio pre-generation
// ============================================================================

async function attachAudioToBlocks(
  blocks: PracticeDrillBlock[],
  language?: string,
): Promise<PracticeDrillBlock[]> {
  const openai = await getOpenAI();
  const voice = selectVoice(language);

  // Collect all unique text strings that need TTS
  const textSet = new Set<string>();
  for (const block of blocks) {
    textSet.add(block.instruction);
    if (block.expectedAnswer) textSet.add(block.expectedAnswer);
    if (block.hint) textSet.add(block.hint);
    block.choices?.forEach((c) => textSet.add(c.choice));
    block.pairs?.forEach((p) => {
      textSet.add(p.term);
      textSet.add(p.definition);
    });
    if (block.pronunciation?.targetText) {
      textSet.add(block.pronunciation.targetText);
    }
  }

  // Batch generate TTS — deduplicate identical strings
  const audioMap = new Map<string, string>();
  const texts = [...textSet].filter((t) => t && t.trim().length > 0);

  // Generate in parallel batches of 10 to avoid rate limits
  for (let i = 0; i < texts.length; i += 10) {
    const batch = texts.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map(async (text) => {
        const response = await openai.audio.speech.create({
          model: "tts-1",
          voice,
          input: text,
        });
        const buffer = await response.arrayBuffer();
        return { text, base64: Buffer.from(buffer).toString("base64") };
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        audioMap.set(result.value.text, result.value.base64);
      }
    }
  }

  // Check total size — if > 300KB, we'd need S3 fallback
  // For now, just attach what we have
  let totalSize = 0;
  for (const [, base64] of audioMap) {
    totalSize += base64.length * 0.75; // approximate decoded size
  }
  console.log(
    `[generatePracticeDrill] Total TTS audio size: ${Math.round(totalSize / 1024)}KB for ${audioMap.size} strings`,
  );

  // Attach audio to each block
  return blocks.map((block) => ({
    ...block,
    audio: {
      instruction: audioMap.get(block.instruction),
      expectedAnswer: block.expectedAnswer
        ? audioMap.get(block.expectedAnswer)
        : undefined,
      hint: block.hint ? audioMap.get(block.hint) : undefined,
      choices: block.choices
        ? Object.fromEntries(
            block.choices
              .filter((c) => audioMap.has(c.choice))
              .map((c) => [c.choice, audioMap.get(c.choice)!]),
          )
        : undefined,
      pairs: block.pairs
        ? Object.fromEntries(
            block.pairs.flatMap((p) => {
              const entries: [string, string][] = [];
              if (audioMap.has(p.term))
                entries.push([p.term, audioMap.get(p.term)!]);
              if (audioMap.has(p.definition))
                entries.push([p.definition, audioMap.get(p.definition)!]);
              return entries;
            }),
          )
        : undefined,
    },
  }));
}

// ============================================================================
// Handler
// ============================================================================

function requireAuth(event: any) {
  const userId = event.identity?.sub;
  const username = event.identity?.username;
  if (!userId) throw new Error("Unauthorized: User authentication required");
  return { userId, username: username || userId };
}

export const handler: Handler = async (event: any) => {
  const operationName = event.info?.fieldName || event.fieldName;
  console.log(`[generatePracticeDrill] ${operationName}`, event.arguments);

  if (operationName !== "generatePracticeDrill") {
    throw new Error(`Unknown operation: ${operationName}`);
  }

  const { userId, username } = requireAuth(event);
  const {
    unitId,
    drillType,
    count,
    sourcesEnabled: sourcesEnabledRaw,
  } = event.arguments || {};

  if (!unitId || !drillType || !count) {
    throw new Error("Missing required arguments: unitId, drillType, count");
  }

  const sourcesEnabled: SourcesEnabled =
    typeof sourcesEnabledRaw === "string"
      ? JSON.parse(sourcesEnabledRaw)
      : sourcesEnabledRaw;

  console.log(
    `[generatePracticeDrill] User: ${username}, Unit: ${unitId}, Type: ${drillType}, Count: ${count}`,
  );
  console.log(`[generatePracticeDrill] Sources:`, sourcesEnabled);

  // 1. Fetch all source material
  const material = await fetchSourceMaterial(unitId, sourcesEnabled);
  const totalItems =
    material.vocabulary.length +
    material.questions.length +
    material.textBlocks.length +
    material.documents.length;

  if (totalItems === 0) {
    throw new Error(
      "No source material found for this unit. Enable at least one content source.",
    );
  }

  console.log(
    `[generatePracticeDrill] Source material: ${material.vocabulary.length} vocab, ` +
      `${material.questions.length} questions, ${material.textBlocks.length} text blocks, ` +
      `${material.documents.length} documents`,
  );

  // 2. Generate practice blocks via GPT-4
  const blocks = await generateBlocks(material, drillType, count);
  console.log(`[generatePracticeDrill] Generated ${blocks.length} blocks`);

  // 3. Attach TTS audio to all pronounceable text
  const blocksWithAudio = await attachAudioToBlocks(blocks, material.language);
  console.log(`[generatePracticeDrill] Audio attached to blocks`);

  // Return as JSON — the mutation returns a.json()
  return JSON.stringify({
    blocks: blocksWithAudio,
    metadata: {
      unitId,
      drillType,
      count: blocksWithAudio.length,
      sourcesEnabled,
      generatedAt: new Date().toISOString(),
      language: material.language,
    },
  });
};
