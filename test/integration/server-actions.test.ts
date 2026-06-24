/**
 * Server Actions Integration Tests
 *
 * Tests all Server Actions that replaced Lambda handlers.
 * Mocks Next.js server context (cookies) and external services (OpenAI, S3)
 * to test business logic in isolation.
 *
 * Coverage:
 * - SA1. Content Generation (generate.ts) — generateSpeech, generateImage
 * - SA2. Embeddings (embeddings.ts) — generateEmbedding
 * - SA3. Moderation (moderate.ts) — moderateContent, moderateImage
 * - SA4. Grading (grading.ts) — gradeDefinition, gradeShortAnswer, gradeImage, transcribeAudio
 * - SA5. Feedback (feedback.ts) — summarizeFeedback
 * - SA6. Practice Drill (drill.ts) — generatePracticeDrill
 * - SA7. Section (section.ts) — joinSection, createSection
 * - SA8. Gamification (gamification.ts) — recordGradeCompletion, generateSkillTreeFromUnit
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================================
// Mock Setup — Must be before imports
// ============================================================================

// Mock next/headers (required by amplifyServerClient)
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    getAll: () => [],
    get: () => undefined,
    has: () => false,
  })),
}));

// Mock the amplifyServerClient
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockGet = vi.fn();
const mockList = vi.fn();
const mockDelete = vi.fn();
const mockModels: Record<string, any> = {
  File: { create: mockCreate },
  Unit: { get: mockGet, list: mockList },
  Section: { get: mockGet, list: mockList, create: mockCreate },
  Grade: { list: mockList },
  Word: { get: mockGet, list: mockList },
  Question: { get: mockGet, list: mockList },
  UnitWord: { list: mockList },
  UnitQuestion: { list: mockList },
  XPTransaction: { create: mockCreate, list: mockList },
  PersonalBest: { create: mockCreate, get: mockGet, update: mockUpdate },
  EasterEgg: { create: mockCreate, get: mockGet, list: mockList },
  SkillTree: { create: mockCreate, get: mockGet, list: mockList },
  Skill: {
    create: mockCreate,
    list: mockList,
    delete: mockDelete,
    update: mockUpdate,
    get: mockGet,
  },
  LearningMemory: { create: mockCreate, get: mockGet, update: mockUpdate },
  StudentProfile: {
    create: mockCreate,
    list: mockList,
    update: mockUpdate,
    get: mockGet,
  },
  StudentXPLog: { create: mockCreate, list: mockList },
  Squad: { list: mockList, update: mockUpdate },
  Notification: { create: mockCreate },
};
const mockMutations: Record<string, any> = {
  addSelfToSection: vi.fn(),
  createSectionGroup: vi.fn(),
  checkBadges: vi.fn(),
  updateStreak: vi.fn(),
  awardGuildXP: vi.fn(),
  updateGuildXP: vi.fn(),
  awardXP: vi.fn(),
  checkPersonalBest: vi.fn(),
  checkEasterEggs: vi.fn(),
  generateSkillTree: vi.fn(),
  discoverEasterEgg: vi.fn(),
};

vi.mock("@/utils/amplifyServerClient", () => ({
  getServerClient: vi.fn(() => ({
    models: mockModels,
    mutations: mockMutations,
    queries: {},
  })),
}));

// Mock @aws-sdk/client-s3 — use vi.hoisted to make class available in vi.mock factory
const { MockS3Client, mockS3Send } = vi.hoisted(() => {
  const mockS3Send = vi.fn().mockResolvedValue({});
  class MockS3Client {
    send = mockS3Send;
    constructor(_config?: any) {}
  }
  return { MockS3Client, mockS3Send };
});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: MockS3Client,
  PutObjectCommand: class {
    Bucket: string;
    Key: string;
    Body: any;
    ContentType: string;
    constructor(params: any) {
      this.Bucket = params.Bucket;
      this.Key = params.Key;
      this.Body = params.Body;
      this.ContentType = params.ContentType;
    }
  },
}));

// Mock amplify_outputs.json
vi.mock("@/../amplify_outputs.json", () => ({
  default: {
    storage: {
      aws_region: "us-east-1",
      bucket_name: "test-bucket",
    },
  },
}));

// Mock Vercel AI SDK (used by grading.ts, feedback.ts, drill.ts)
const mockGenerateText = vi.fn();
const mockGenerateObject = vi.fn();
vi.mock("ai", () => ({
  generateText: (...args: any[]) => mockGenerateText(...args),
  generateObject: (...args: any[]) => mockGenerateObject(...args),
  Output: {
    object: (opts: any) => ({ type: "object", ...opts }),
  },
}));

const mockOpenAIModel = vi.fn(() => "mock-model");
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => mockOpenAIModel),
}));

// Mock global fetch for OpenAI API calls (used by generate.ts, embeddings.ts, moderate.ts, transcribeAudio)
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ============================================================================
// Imports (after mocks)
// ============================================================================

import { generateSpeech, generateImage } from "../../app/actions/generate";
import { generateEmbedding } from "../../app/actions/embeddings";
import { moderateContent, moderateImage } from "../../app/actions/moderate";
import {
  gradeDefinition,
  gradeShortAnswer,
  gradeImage,
  transcribeAudio,
} from "../../app/actions/grading";
import { summarizeFeedback } from "../../app/actions/feedback";
import { generatePracticeDrill } from "../../app/actions/drill";
import { joinSection, createSection } from "../../app/actions/section";
import {
  recordGradeCompletion,
  generateSkillTreeFromUnit,
} from "../../app/actions/gamification";

// ============================================================================
// Tests
// ============================================================================

describe("Server Actions Integration Tests", () => {
  beforeEach(() => {
    // Reset shared mocks' queued values without touching vi.mock() factory fns
    mockGenerateText.mockReset();
    mockGenerateObject.mockReset();
    mockFetch.mockReset();
    mockGet.mockReset();
    mockList.mockReset();
    mockCreate.mockReset();
    mockUpdate.mockReset();
    mockS3Send.mockReset();
    mockS3Send.mockResolvedValue({});
    Object.values(mockMutations).forEach((m: any) => m.mockReset());
    process.env.OPENAI_API_KEY = "test-key-sk-123456";
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  // ==========================================================================
  // SA1. Content Generation (generate.ts)
  // ==========================================================================
  describe("SA1. Content Generation", () => {
    describe("generateSpeech", () => {
      it("generates audio, uploads to S3, and creates File record", async () => {
        const audioBuffer = new ArrayBuffer(1024);
        mockFetch.mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(audioBuffer),
        });

        mockCreate.mockResolvedValueOnce({
          data: { id: "file-123", name: "generated-audio.mp3" },
          errors: null,
        });

        const result = await generateSpeech({
          phrase: "Konnichiwa, genki desu ka?",
          voice: "alloy",
          model: "tts-1",
        });

        // Verify OpenAI was called correctly
        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.openai.com/v1/audio/speech",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer test-key-sk-123456",
            }),
          }),
        );

        const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(fetchBody.model).toBe("tts-1");
        expect(fetchBody.voice).toBe("alloy");
        expect(fetchBody.input).toBe("Konnichiwa, genki desu ka?");

        // Verify S3 upload
        expect(mockS3Send).toHaveBeenCalledOnce();
        const s3Params = mockS3Send.mock.calls[0][0];
        expect(s3Params.Bucket).toBe("test-bucket");
        expect(s3Params.Key).toMatch(
          /^public\/audio\/\d+\/generated-audio-\d+\.mp3$/,
        );
        expect(s3Params.ContentType).toBe("audio/mpeg");

        // Verify File record created
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            mimeType: "audio/mpeg",
            description: "Generated audio - completed",
          }),
        );

        // Verify return shape
        expect(result).toMatchObject({
          id: "file-123",
          path: expect.stringMatching(/^public\/audio\//),
          filename: expect.stringMatching(/^generated-audio-\d+\.mp3$/),
          fileType: "audio/mpeg",
          status: "completed",
        });
      });

      it("uses default voice and model when not specified", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(512)),
        });
        mockCreate.mockResolvedValueOnce({
          data: { id: "file-456" },
          errors: null,
        });

        await generateSpeech({ phrase: "Hello world" });

        const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(fetchBody.model).toBe("tts-1");
        expect(fetchBody.voice).toBe("alloy");
      });

      it("throws when OpenAI returns error", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          statusText: "Rate limit exceeded",
        });

        await expect(generateSpeech({ phrase: "test" })).rejects.toThrow(
          "TTS generation failed: Rate limit exceeded",
        );
      });

      it("throws when File record creation fails", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(256)),
        });
        mockCreate.mockResolvedValueOnce({
          data: null,
          errors: [{ message: "Unauthorized" }],
        });

        await expect(generateSpeech({ phrase: "test" })).rejects.toThrow(
          "Failed to create File record",
        );
      });

      it("throws when OPENAI_API_KEY is missing", async () => {
        delete process.env.OPENAI_API_KEY;

        await expect(generateSpeech({ phrase: "test" })).rejects.toThrow(
          "OPENAI_API_KEY not configured",
        );
      });
    });

    describe("generateImage", () => {
      it("generates image, uploads to S3, and creates File record", async () => {
        const fakeBase64 = Buffer.from("fake-png-data").toString("base64");
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [{ b64_json: fakeBase64 }],
            }),
        });

        mockCreate.mockResolvedValueOnce({
          data: { id: "img-789" },
          errors: null,
        });

        const result = await generateImage({
          phrase: "A serene Japanese garden",
          model: "dall-e-3",
          size: "1024x1024",
        });

        // Verify DALL-E API call
        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.openai.com/v1/images/generations",
          expect.objectContaining({ method: "POST" }),
        );

        const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(fetchBody.model).toBe("dall-e-3");
        expect(fetchBody.prompt).toBe("A serene Japanese garden");
        expect(fetchBody.size).toBe("1024x1024");
        expect(fetchBody.response_format).toBe("b64_json");

        // Verify S3 upload
        expect(mockS3Send).toHaveBeenCalledOnce();
        const s3Params = mockS3Send.mock.calls[0][0];
        expect(s3Params.Bucket).toBe("test-bucket");
        expect(s3Params.Key).toMatch(
          /^public\/images\/\d+\/generated-image-\d+\.png$/,
        );
        expect(s3Params.ContentType).toBe("image/png");

        // Verify return shape
        expect(result).toMatchObject({
          id: "img-789",
          path: expect.stringMatching(/^public\/images\//),
          filename: expect.stringMatching(/^generated-image-\d+\.png$/),
          fileType: "image/png",
          status: "completed",
        });
      });

      it("uses default model and size", async () => {
        const fakeBase64 = Buffer.from("test").toString("base64");
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [{ b64_json: fakeBase64 }] }),
        });
        mockCreate.mockResolvedValueOnce({
          data: { id: "img-001" },
          errors: null,
        });

        await generateImage({ phrase: "A cat" });

        const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(fetchBody.model).toBe("dall-e-3");
        expect(fetchBody.size).toBe("1024x1024");
      });

      it("throws when DALL-E returns no image data", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [{}] }),
        });

        await expect(generateImage({ phrase: "test" })).rejects.toThrow(
          "No image data returned",
        );
      });

      it("throws when DALL-E API fails", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          statusText: "Content policy violation",
        });

        await expect(generateImage({ phrase: "test" })).rejects.toThrow(
          "Image generation failed: Content policy violation",
        );
      });
    });
  });

  // ==========================================================================
  // SA2. Embeddings (embeddings.ts)
  // ==========================================================================
  describe("SA2. Embeddings", () => {
    it("generates embedding vector for text", async () => {
      const mockEmbedding = Array.from({ length: 256 }, () => Math.random());
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ embedding: mockEmbedding }],
            model: "text-embedding-3-small",
            usage: { total_tokens: 5 },
          }),
      });

      const result = await generateEmbedding({
        content: "Photosynthesis converts sunlight into energy",
        dimensions: 256,
      });

      expect(result.embedding).toHaveLength(256);
      expect(result.model).toBe("text-embedding-3-small");
      expect(result.dimensions).toBe(256);
      expect(result.tokenCount).toBe(5);
    });

    it("uses default model and dimensions", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ embedding: Array(512).fill(0.1) }],
            model: "text-embedding-3-small",
            usage: { total_tokens: 3 },
          }),
      });

      await generateEmbedding({ content: "test" });

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(fetchBody.model).toBe("text-embedding-3-small");
    });

    it("throws on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Unauthorized",
      });

      await expect(generateEmbedding({ content: "test" })).rejects.toThrow();
    });
  });

  // ==========================================================================
  // SA3. Moderation (moderate.ts)
  // ==========================================================================
  describe("SA3. Moderation", () => {
    describe("moderateContent", () => {
      it("returns moderation result for safe content", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  flagged: false,
                  categories: { sexual: false, hate: false, violence: false },
                  category_scores: {
                    sexual: 0.001,
                    hate: 0.0,
                    violence: 0.002,
                  },
                },
              ],
              model: "omni-moderation-latest",
            }),
        });

        const result = await moderateContent({
          content: "Students are learning about photosynthesis.",
        });

        expect(result.flagged).toBe(false);
        expect(result.categories).toBeDefined();
        expect(result.categoryScores).toBeDefined();
        expect(result.model).toContain("omni-moderation");
      });

      it("flags inappropriate content", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  flagged: true,
                  categories: { violence: true, hate: false },
                  category_scores: { violence: 0.95, hate: 0.01 },
                },
              ],
              model: "omni-moderation-latest",
            }),
        });

        const result = await moderateContent({
          content: "Flagged content example",
        });

        expect(result.flagged).toBe(true);
      });
    });

    describe("moderateImage", () => {
      it("returns moderation result for image URL", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  flagged: false,
                  categories: { sexual: false },
                  category_scores: { sexual: 0.001 },
                },
              ],
              model: "omni-moderation-latest",
            }),
        });

        const result = await moderateImage({
          imageUrl: "https://example.com/safe-image.jpg",
        });

        expect(result.flagged).toBe(false);
        expect(result.model).toContain("omni-moderation");
      });
    });
  });

  // ==========================================================================
  // SA4. Grading (grading.ts) — uses Vercel AI SDK (generateObject/Output.object)
  // ==========================================================================
  describe("SA4. Grading", () => {
    describe("gradeDefinition", () => {
      it("grades a correct definition", async () => {
        mockGenerateObject.mockResolvedValueOnce({
          object: {
            answer: true,
            reason: "Excellent definition!",
            score: 95,
          },
        });

        const result = await gradeDefinition({
          word: "photosynthesis",
          definition: "The process by which plants convert sunlight into food",
          expectedDefinition:
            "The process plants use to convert light energy into chemical energy",
        });

        expect(result.answer).toBe(true);
        expect(result.score).toBe(95);
        expect(result.reason).toBe("Excellent definition!");

        // Verify generateObject was called with correct params
        expect(mockGenerateObject).toHaveBeenCalledWith(
          expect.objectContaining({
            model: "mock-model",
            temperature: 0.1,
          }),
        );
      });
    });

    describe("gradeShortAnswer", () => {
      it("grades a student's short answer", async () => {
        mockGenerateObject.mockResolvedValueOnce({
          object: {
            answer: true,
            reason: "Good answer with minor details missing",
            score: 85,
          },
        });

        const result = await gradeShortAnswer({
          question: "What is the water cycle?",
          answer: "Water evaporates, forms clouds, then rains back down",
          expectedAnswer:
            "The water cycle is the continuous movement of water through evaporation, condensation, and precipitation",
        });

        expect(result.answer).toBe(true);
        expect(result.score).toBe(85);
        expect(result.reason).toContain("Good");
      });
    });

    describe("gradeImage", () => {
      it("analyzes and grades image content", async () => {
        mockGenerateText.mockResolvedValueOnce({
          output: {
            description: "A diagram showing the water cycle",
            answer: true,
            reason: "Clear diagram with all stages labeled",
            score: 90,
          },
        });

        const result = await gradeImage({
          imageUrl:
            "https://test-bucket.s3.us-east-1.amazonaws.com/public/images/water-cycle.png",
          question: "Draw the water cycle",
          expectedContent:
            "A diagram showing evaporation, condensation, precipitation",
        });

        expect(result.description).toBe("A diagram showing the water cycle");
        expect(result.answer).toBe(true);
        expect(result.score).toBe(90);
      });
    });

    describe("transcribeAudio", () => {
      it("transcribes audio and grades against expected answer", async () => {
        // First fetch: download the audio file
        mockFetch.mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(["audio data"])),
        });
        // Second fetch: Whisper transcription
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ text: "Konnichiwa genki desu ka" }),
        });
        // Third fetch: moderation API (piggyback)
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                { flagged: false, categories: {}, category_scores: {} },
              ],
              model: "omni-moderation-latest",
            }),
        });
        // grading via generateObject
        mockGenerateObject.mockResolvedValueOnce({
          object: {
            answer: true,
            reason: "Good pronunciation",
            score: 90,
          },
        });

        const result = await transcribeAudio({
          audioUrl:
            "https://test-bucket.s3.us-east-1.amazonaws.com/public/audio/recording.mp3",
          expectedAnswer: "konnichiwa genki desu ka",
        });

        expect(result.transcript).toBe("Konnichiwa genki desu ka");
        expect(result.answer).toBe(true);
        expect(result.score).toBe(90);
      });

      it("returns transcript only when no expected answer", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(["audio"])),
        });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ text: "Hello world" }),
        });

        const result = await transcribeAudio({
          audioUrl:
            "https://test-bucket.s3.us-east-1.amazonaws.com/public/audio/test.mp3",
        });

        expect(result.transcript).toBe("Hello world");
        expect(result.answer).toBe(true);
        expect(result.score).toBe(100);
      });
    });
  });

  // ==========================================================================
  // SA5. Feedback (feedback.ts) — uses Vercel AI SDK
  // ==========================================================================
  describe("SA5. Feedback", () => {
    it("summarizes grade feedback using generateText", async () => {
      const feedbackJson = JSON.stringify({
        overall: "Student shows strong vocabulary but needs work on grammar",
        strengths: ["vocabulary", "reading comprehension"],
        improvements: ["verb conjugation", "particle usage"],
      });

      mockGenerateText.mockResolvedValueOnce({ text: feedbackJson });

      const result = await summarizeFeedback({
        assignmentData: JSON.stringify({
          name: "Japanese Lesson 1",
          rubric: [],
        }),
        gradeData: JSON.stringify({ accuracy: 75, responses: {} }),
      });

      expect(typeof result).toBe("string");
      const parsed = JSON.parse(result);
      expect(parsed.overall).toContain("vocabulary");
      expect(parsed.strengths).toHaveLength(2);
      expect(parsed.improvements).toHaveLength(2);

      // Verify generateText was called with AI SDK params
      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "mock-model",
          temperature: 0.4,
        }),
      );
    });

    it("passes assignment and grade data in prompt", async () => {
      mockGenerateText.mockResolvedValueOnce({ text: '{"overall": "test"}' });

      await summarizeFeedback({
        assignmentData: "ASSIGNMENT_YAML",
        gradeData: "GRADE_YAML",
      });

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining("ASSIGNMENT_YAML"),
        }),
      );
      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining("GRADE_YAML"),
        }),
      );
    });
  });

  // ==========================================================================
  // SA6. Practice Drill (drill.ts) — uses Vercel AI SDK + data client
  // ==========================================================================
  describe("SA6. Practice Drill", () => {
    it("generates practice drill blocks for a unit", async () => {
      // Mock Unit.get (first call to mockGet)
      mockGet.mockResolvedValueOnce({
        data: {
          id: "unit-1",
          name: "Japanese Verbs",
          identityId: "mock-identity-id",
          contentVersion: 1,
          publishedContentVersion: 1,
        },
      });

      // Mock UnitWord.list (first call to mockList)
      mockList.mockResolvedValueOnce({
        data: [
          { wordId: "w1", unitId: "unit-1" },
          { wordId: "w2", unitId: "unit-1" },
        ],
      });

      // Mock individual Word.get calls (2nd and 3rd calls to mockGet)
      mockGet.mockResolvedValueOnce({
        data: {
          id: "w1",
          phrase: "taberu",
          definition: "to eat",
          phonetic: "たべる",
        },
      });
      mockGet.mockResolvedValueOnce({
        data: {
          id: "w2",
          phrase: "nomu",
          definition: "to drink",
          phonetic: "のむ",
        },
      });

      // Mock UnitQuestion.list (2nd call to mockList)
      mockList.mockResolvedValueOnce({ data: [] });

      // Mock generateObject for drill generation
      const drillBlocks = {
        blocks: [
          {
            type: "quiz",
            instruction: "What does 'taberu' mean?",
            choices: [
              { choice: "to eat", correct: true },
              { choice: "to drink", correct: false },
            ],
            sourceItemId: "w1",
            sourceType: "vocabulary",
          },
        ],
      };
      mockGenerateObject.mockResolvedValueOnce({
        object: drillBlocks,
      });

      const result = await generatePracticeDrill({
        unitId: "unit-1",
        drillType: "vocabulary",
        count: 5,
      });

      expect(result.blocks).toBeDefined();
      expect(Array.isArray(result.blocks)).toBe(true);
      expect(result.blocks.length).toBeGreaterThan(0);
      expect(result.blocks[0].type).toBe("quiz");
      expect(result.blocks[0].sourceType).toBe("vocabulary");

      // Verify generateObject was called
      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "mock-model",
          temperature: 0.7,
        }),
      );
    });

    it("throws when unit not found", async () => {
      mockGet.mockResolvedValueOnce({ data: null });

      await expect(
        generatePracticeDrill({
          unitId: "nonexistent",
          drillType: "quiz",
          count: 5,
        }),
      ).rejects.toThrow("Unit not found");
    });
  });

  // ==========================================================================
  // SA7. Section (section.ts)
  // ==========================================================================
  describe("SA7. Section Management", () => {
    describe("joinSection", () => {
      it("joins a section by code", async () => {
        mockMutations.addSelfToSection.mockResolvedValueOnce({
          data: JSON.stringify({ sectionName: "Japanese 101" }),
          errors: null,
        });

        const result = await joinSection("JP101");

        expect(result.success).toBe(true);
        expect(result.sectionName).toBe("Japanese 101");
        expect(mockMutations.addSelfToSection).toHaveBeenCalledWith(
          expect.objectContaining({ code: "JP101" }),
        );
      });

      it("returns error for empty code", async () => {
        const result = await joinSection("");
        expect(result.success).toBe(false);
        expect(result.error).toContain("required");
      });
    });

    describe("createSection", () => {
      it("creates a new section", async () => {
        mockMutations.createSectionGroup.mockResolvedValueOnce({
          data: JSON.stringify({ id: "section-new", code: "NEW123" }),
          errors: null,
        });

        const result = await createSection(
          "Advanced Japanese",
          "For advanced students",
        );

        expect(result.success).toBe(true);
        expect(result.sectionId).toBe("section-new");
        expect(result.code).toBe("NEW123");
        expect(mockMutations.createSectionGroup).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Advanced Japanese",
            description: "For advanced students",
          }),
        );
      });

      it("returns error for empty name", async () => {
        const result = await createSection("");
        expect(result.success).toBe(false);
        expect(result.error).toContain("required");
      });
    });
  });

  // ==========================================================================
  // SA8. Gamification (gamification.ts) — engine calls via client.models.*
  // ==========================================================================
  describe("SA8. Gamification", () => {
    beforeEach(() => {
      // Default: all model operations succeed with sensible empty/stub values.
      // Individual tests override with mockResolvedValueOnce as needed.
      mockList.mockResolvedValue({ data: [] });
      mockGet.mockResolvedValue({ data: null });
      mockCreate.mockResolvedValue({
        data: {
          id: "mock-id",
          studentId: "student-1",
          totalXP: 0,
          level: 1,
          badges: [],
          personalBests: [],
          activeDebuffs: null,
          currentStreak: 0,
          longestStreak: 0,
          freezesRemaining: 0,
        },
      });
      mockUpdate.mockResolvedValue({ data: { id: "mock-id" } });
      mockDelete.mockResolvedValue({ data: {} });
    });

    describe("recordGradeCompletion", () => {
      it("creates an XP log and returns xp + personalBest result", async () => {
        const result = await recordGradeCompletion(
          "student-1",
          "unit-1",
          85,
          "grade-ref-1",
        );

        expect(result).toBeDefined();

        // engineAwardXP must have created a StudentXPLog with the right fields
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            studentId: "student-1",
            reason: "HOMEWORK_SUBMITTED",
            accuracy: 85,
          }),
        );

        // XP was awarded (no existing logs → not a duplicate)
        expect(result.xp).not.toBeNull();
        expect(result.xp?.alreadyAwarded).toBe(false);
        expect(result.xp?.xpAmount).toBeGreaterThan(0);

        // Personal best recorded on first attempt (no prior profile data)
        expect(result.personalBest?.firstAttempt).toBe(true);
        expect(result.personalBest?.isNewBest).toBe(true);
        expect(result.personalBest?.bestScore).toBe(85);

        // No easter eggs without submissionText
        expect(result.easterEggs).toBeNull();
      });

      it("returns alreadyAwarded:true when referenceId was previously logged", async () => {
        const existingLog = {
          id: "log-1",
          studentId: "student-1",
          reason: "HOMEWORK_SUBMITTED",
          referenceId: "grade-ref-1",
          xpAmount: 50,
          createdAt: new Date().toISOString(),
        };
        // All list calls return the existing log (duplicate detected in engineAwardXP)
        mockList.mockResolvedValue({ data: [existingLog] });

        const result = await recordGradeCompletion(
          "student-1",
          "unit-1",
          85,
          "grade-ref-1",
        );

        expect(result.xp?.alreadyAwarded).toBe(true);
        expect(result.xp?.xpAmount).toBe(0);
      });
    });

    describe("generateSkillTreeFromUnit", () => {
      it("generates skills from unit content via AI", async () => {
        // Unit.get returns a unit
        mockGet.mockResolvedValueOnce({
          data: { id: "unit-1", name: "Japanese Verbs", data: null },
        });

        // UnitWord.list — no vocabulary for simplicity
        mockList.mockResolvedValueOnce({ data: [] });

        // UnitQuestion.list — no questions
        mockList.mockResolvedValueOnce({ data: [] });

        // Skill.list — no existing skills to delete
        mockList.mockResolvedValueOnce({ data: [] });

        // AI generates skill definitions
        mockGenerateText.mockResolvedValueOnce({
          text: JSON.stringify({
            skills: [
              {
                title: "Basic Verbs",
                description: "Master basic Japanese verbs",
                prerequisites: [],
                xpReward: 100,
              },
            ],
          }),
        });

        // Skill.create for the new skill
        mockCreate.mockResolvedValueOnce({
          data: { id: "skill-db-1", title: "Basic Verbs", _version: 1 },
        });

        const result = await generateSkillTreeFromUnit("unit-1");

        expect(result).toBeDefined();
        expect(result?.generated).toBe(true);
        expect(result?.skillCount).toBe(1);
        expect(result?.skills?.[0].title).toBe("Basic Verbs");

        // AI was invoked
        expect(mockGenerateText).toHaveBeenCalledWith(
          expect.objectContaining({ model: "mock-model" }),
        );
      });

      it("returns null when unit does not exist", async () => {
        mockGet.mockResolvedValueOnce({ data: null });
        const result = await generateSkillTreeFromUnit("nonexistent");
        expect(result).toBeNull();
      });
    });
  });
});
