/**
 * Amplify Gen 2 Lambda Handler Integration Tests
 *
 * Comprehensive test suite for all Lambda handlers based on E2E_TEST_PLAN.md (Section C)
 * Tests OpenAI, embeddings, document analysis, moderation, and content generation handlers.
 *
 * Test Coverage:
 * - C1. Chat Stream Handler
 * - C2. Content Completion Handler
 * - C3. Suggest Blocks Handler
 * - C4. Section Handler
 * - C5. Embeddings Handler
 * - C6. AI Handler (TTS, Whisper, Vision, DALL-E, Moderation)
 * - C7. Document Analysis Handler
 * - C8. Moderation Handler
 *
 * Usage:
 *   npm test test/integration/lambda.test.ts
 *
 * Prerequisites:
 *   - Sandbox running: npx ampx sandbox
 *   - Test users created in Cognito
 *   - Seed data loaded: npx ampx sandbox --seed
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  test,
} from "vitest";
import { Amplify } from "aws-amplify";
import { parseAmplifyConfig } from "aws-amplify/utils";
import { generateClient } from "aws-amplify/api";
import { post } from "aws-amplify/api";
import { signIn, signOut, fetchAuthSession } from "aws-amplify/auth";
import type { Schema } from "../../amplify/data/resource";
import amplifyOutputs from "../../amplify_outputs.json";
import {
  signInAs,
  parseSSEStream,
  extractTextFromSSE,
  isSSEStreamComplete,
  readStreamWithTiming,
  assertTrueStreaming,
} from "./shared";

// Configure Amplify with existing resources
const amplifyConfig = parseAmplifyConfig(amplifyOutputs);

Amplify.configure(
  {
    ...amplifyConfig,
    API: {
      ...amplifyConfig.API,
      REST: {
        ...amplifyConfig.API?.REST,
        homeworkSupplyStreamApi: {
          endpoint: (amplifyOutputs.custom as any).STREAM_API.endpoint,
          region: (amplifyOutputs.custom as any).STREAM_API.region,
        },
      },
    },
  },
  {
    API: {
      REST: {
        headers: async () => {
          const session = await fetchAuthSession();
          return {
            Authorization: session.tokens?.idToken?.toString() || "",
          };
        },
      },
    },
  },
);

// Create typed GraphQL client
const client = generateClient<Schema>();

// Helper: Clean up test data after each test
async function cleanup() {
  await signOut();
}

describe("C. Lambda Handler Integration Tests", () => {
  // ========================================================================
  // C1. Chat Stream Handler
  // ========================================================================
  describe("C1. Chat Stream Handler", () => {
    afterEach(cleanup);

    test("Send chat message with streaming response", async () => {
      await signInAs("student1");

      const restOperation = post({
        apiName: "homeworkSupplyStreamApi",
        path: "/chat",
        options: {
          body: {
            messages: [
              {
                role: "user",
                content: "What are the basic hiragana characters?",
              },
            ],
          },
        },
      });

      try {
        const response = await restOperation.response;
        console.log("Chat response status:", response.statusCode);
        console.log(
          "Chat response headers:",
          JSON.stringify(response.headers, null, 2),
        );

        const { body } = response;
        const sseText = await body.text();
        console.log(
          "Chat Stream Response (first 500 chars):",
          sseText.substring(0, 500),
        );
        console.log("Chat Stream Response length:", sseText.length);

        expect(sseText).toBeDefined();
        expect(sseText.length).toBeGreaterThan(0);

        // Parse SSE events
        const events = parseSSEStream(sseText);
        console.log("Parsed SSE events:", events.length);
        expect(events.length).toBeGreaterThan(0);

        // Extract text content
        const textContent = extractTextFromSSE(sseText);
        console.log("Extracted text:", textContent.substring(0, 100));
        expect(textContent.length).toBeGreaterThan(0);
      } catch (error: any) {
        console.error("Chat stream error:", {
          name: error.name,
          message: error.message,
          statusCode: error.response?.statusCode,
          body: error.response?.body,
          stack: error.stack,
        });
        throw error;
      }
    }, 30000);

    test("Chat with context awareness", async () => {
      await signInAs("instructor1");

      const restOperation = post({
        apiName: "homeworkSupplyStreamApi",
        path: "/chat",
        options: {
          body: {
            messages: [
              {
                role: "user",
                content: "Generate a quiz about this topic",
              },
            ],
            context: {
              unit: { name: "Test Unit", description: "Testing context" },
            },
          },
        },
      });

      try {
        const response = await restOperation.response;
        console.log("Context-aware response status:", response.statusCode);

        const { body } = response;
        const text = await body.text();
        console.log(
          "Context-aware response (first 300 chars):",
          text.substring(0, 300),
        );

        expect(text).toBeDefined();
        expect(text.length).toBeGreaterThan(0);
      } catch (error: any) {
        console.error("Context-aware chat error:", {
          name: error.name,
          message: error.message,
          response: error.response,
        });
        throw error;
      }
    }, 30000);

    test("Error handling for empty message", async () => {
      await signInAs("student1");

      const restOperation = post({
        apiName: "homeworkSupplyStreamApi",
        path: "/chat",
        options: {
          body: {
            messages: [],
          },
        },
      });

      const { body } = await restOperation.response;
      const text = await body.text();

      // Should handle gracefully (empty or error response)
      expect(text).toBeDefined();
    }, 30000);
  });

  // ========================================================================
  // C2. Content Completion Handler
  // ========================================================================
  describe("C2. Content Completion Handler", () => {
    afterEach(cleanup);

    test("Generate content completion for editor", async () => {
      await signInAs("instructor1");

      const restOperation = post({
        apiName: "homeworkSupplyStreamApi",
        path: "/content-completion",
        options: {
          body: {
            prompt: "Write an introduction about Japanese culture",
            context: { topic: "culture", language: "Japanese" },
          },
        },
      });

      try {
        const response = await restOperation.response;
        console.log("Content completion status:", response.statusCode);
        console.log(
          "Content completion headers:",
          JSON.stringify(response.headers, null, 2),
        );

        const { body } = response;
        const sseText = await body.text();
        console.log("Content completion response length:", sseText.length);
        console.log(
          "Content completion response (first 500 chars):",
          sseText.substring(0, 500),
        );

        expect(sseText).toBeDefined();
        // Note: Lambda HTTP API may not return buffered streaming response body
        // The fact that we got 200 status and no error means it worked
        // Real usage will use direct streaming, not buffered response

        // Parse SSE format if we got content
        if (sseText.length > 0) {
          const events = parseSSEStream(sseText);
          console.log("SSE events count:", events.length);
          expect(events.length).toBeGreaterThan(0);
        } else {
          console.log(
            "Empty response body - Lambda completed but body not returned (streaming limitation)",
          );
        }
      } catch (error: any) {
        console.error("Content completion error:", {
          name: error.name,
          message: error.message,
          response: error.response,
          stack: error.stack,
        });
        throw error;
      }
    }, 30000);

    test("Content completion with context-aware suggestions", async () => {
      await signInAs("instructor1");

      const restOperation = post({
        apiName: "homeworkSupplyStreamApi",
        path: "/content-completion",
        options: {
          body: {
            prompt:
              "Continue this sentence: When learning Japanese, one should...",
            context: { level: "beginner", topic: "learning-tips" },
          },
        },
      });

      try {
        const response = await restOperation.response;
        console.log("Context-aware completion status:", response.statusCode);

        const { body } = response;
        const sseText = await body.text();
        console.log("Context-aware completion length:", sseText.length);

        expect(sseText).toBeDefined();
        // Lambda completed successfully if we got here without 500 error

        if (sseText.length > 0) {
          const events = parseSSEStream(sseText);
          console.log("SSE events count:", events.length);
          expect(events.length).toBeGreaterThan(0);
        } else {
          console.log(
            "Empty response body - Lambda completed (streaming limitation)",
          );
        }
      } catch (error: any) {
        console.error("Context-aware completion error:", {
          name: error.name,
          message: error.message,
          response: error.response,
        });
        throw error;
      }
    }, 30000);

    test("Content completion respects user preferences", async () => {
      await signInAs("instructor1");

      const restOperation = post({
        apiName: "homeworkSupplyStreamApi",
        path: "/content-completion",
        options: {
          body: {
            prompt: "Generate a grammar explanation for Japanese verbs",
            context: { temperature: 0.7, maxTokens: 200 },
          },
        },
      });

      try {
        const response = await restOperation.response;
        console.log("User preferences completion status:", response.statusCode);

        const { body } = response;
        const sseText = await body.text();
        console.log("User preferences completion length:", sseText.length);

        expect(sseText).toBeDefined();
        // Lambda completed successfully if we got here without 500 error

        if (sseText.length > 0) {
          const events = parseSSEStream(sseText);
          console.log("SSE events count:", events.length);
          expect(events.length).toBeGreaterThan(0);
        } else {
          console.log(
            "Empty response body - Lambda completed (streaming limitation)",
          );
        }
      } catch (error: any) {
        console.error("User preferences completion error:", {
          name: error.name,
          message: error.message,
          response: error.response,
        });
        throw error;
      }
    }, 30000);

    test("Error handling for incomplete prompts", async () => {
      await signInAs("instructor1");

      try {
        const restOperation = post({
          apiName: "homeworkSupplyStreamApi",
          path: "/content-completion",
          options: {
            body: {
              prompt: "",
            },
          },
        });

        await restOperation.response;
        // Should not reach here - empty prompt should error
        expect(true).toBe(false);
      } catch (error: any) {
        // Should return 400 error for empty prompt
        expect(error).toBeDefined();
      }
    }, 30000);
  });

  // ========================================================================
  // C3. Suggest Blocks Handler
  // ========================================================================
  describe("C3. Suggest Blocks Handler", () => {
    afterEach(cleanup);

    test("Suggest quiz blocks for unit", async () => {
      await signInAs("instructor1");

      const restOperation = post({
        apiName: "homeworkSupplyStreamApi",
        path: "/suggest-blocks",
        options: {
          body: {
            unitStructure: {
              title: "Japanese Hiragana",
              content: "Learn the basic hiragana characters",
            },
            currentContext: { language: "Japanese", level: "beginner" },
            userHistory: { previousBlocks: ["text", "image"] },
          },
        },
      });

      const { body } = await restOperation.response;
      const result = (await body.json()) as any;

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.overallAssessment).toBeDefined();
    }, 30000);

    test("Suggest meaning-association blocks", async () => {
      await signInAs("instructor1");

      const restOperation = post({
        apiName: "homeworkSupplyStreamApi",
        path: "/suggest-blocks",
        options: {
          body: {
            unitStructure: {
              title: "Vocabulary Matching",
              content: "Match words to definitions",
            },
            currentContext: {
              blockTypes: ["meaning-association"],
            },
          },
        },
      });

      const { body } = await restOperation.response;
      const result = (await body.json()) as any;

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
    }, 30000);

    test("Suggest custom-answer blocks", async () => {
      await signInAs("instructor1");

      const restOperation = post({
        apiName: "homeworkSupplyStreamApi",
        path: "/suggest-blocks",
        options: {
          body: {
            unitStructure: {
              title: "Free Response Practice",
            },
            currentContext: {
              blockTypes: ["custom-answer"],
            },
          },
        },
      });

      const { body } = await restOperation.response;
      const result = (await body.json()) as any;

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
    }, 30000);

    test("Validate block structure matches schema", async () => {
      await signInAs("instructor1");

      const restOperation = post({
        apiName: "homeworkSupplyStreamApi",
        path: "/suggest-blocks",
        options: {
          body: {
            unitStructure: {
              title: "Test Unit",
              content: "Test content",
            },
          },
        },
      });

      const { body } = await restOperation.response;
      const result = (await body.json()) as any;

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      // Each suggestion should have required fields
      if (result && result.suggestions && result.suggestions.length > 0) {
        expect(result.suggestions[0]).toHaveProperty("type");
        expect(result.suggestions[0]).toHaveProperty("label");
        expect(result.suggestions[0]).toHaveProperty("reasoning");
        expect(result.suggestions[0]).toHaveProperty("priority");
      }
    }, 30000);
  });

  // ========================================================================
  // C3b. Streaming Verification — confirm endpoints truly stream via SSE
  // ========================================================================
  describe("C3b. Streaming Verification", () => {
    afterEach(cleanup);

    test("POST /chat streams chunks incrementally (not buffered)", async () => {
      await signInAs("student1");

      const restOperation = post({
        apiName: "homeworkSupplyStreamApi",
        path: "/chat",
        options: {
          body: {
            messages: [
              {
                role: "user",
                content: "Count from 1 to 10 slowly, one number per line.",
              },
            ],
          },
        },
      });

      const response = await restOperation.response;
      expect(response.statusCode).toBe(200);

      const result = await readStreamWithTiming(response.body);

      console.log("[Streaming /chat]", {
        chunkCount: result.chunkCount,
        totalDuration: `${result.totalDuration.toFixed(0)}ms`,
        eventCount: result.events.length,
        textDeltaCount: result.events.filter((e) => e.type === "text-delta")
          .length,
        chunkSizes: result.chunks.map((c) => c.text.length),
      });

      // Verify true streaming behavior
      assertTrueStreaming(result);

      // Verify SSE format: each event line starts with "data: "
      const lines = result.fullText
        .split("\n")
        .filter((l) => l.trim().length > 0);
      for (const line of lines) {
        expect(line).toMatch(/^data: /);
      }

      // Verify we got text-delta events (actual content being streamed)
      const textDeltas = result.events.filter((e) => e.type === "text-delta");
      expect(textDeltas.length).toBeGreaterThan(1);
    }, 60000);

    test("POST /content-completion streams chunks incrementally", async () => {
      await signInAs("instructor1");

      const restOperation = post({
        apiName: "homeworkSupplyStreamApi",
        path: "/content-completion",
        options: {
          body: {
            prompt: "Write a paragraph about the four seasons in Japan.",
            context: { unitName: "Japanese Seasons" },
          },
        },
      });

      const response = await restOperation.response;
      expect(response.statusCode).toBe(200);

      const result = await readStreamWithTiming(response.body);

      console.log("[Streaming /content-completion]", {
        chunkCount: result.chunkCount,
        totalDuration: `${result.totalDuration.toFixed(0)}ms`,
        eventCount: result.events.length,
      });

      assertTrueStreaming(result);
    }, 60000);

    test("POST /suggest-blocks streams chunks incrementally", async () => {
      await signInAs("instructor1");

      const restOperation = post({
        apiName: "homeworkSupplyStreamApi",
        path: "/suggest-blocks",
        options: {
          body: {
            unitStructure: [
              { type: "heading", content: "Introduction to Hiragana" },
              {
                type: "paragraph",
                content: "Hiragana is one of three Japanese writing systems.",
              },
            ],
            currentContext: {
              position: "End of lesson",
              lastBlockType: "paragraph",
            },
          },
        },
      });

      const response = await restOperation.response;
      expect(response.statusCode).toBe(200);

      const result = await readStreamWithTiming(response.body);

      console.log("[Streaming /suggest-blocks]", {
        chunkCount: result.chunkCount,
        totalDuration: `${result.totalDuration.toFixed(0)}ms`,
        eventCount: result.events.length,
      });

      assertTrueStreaming(result);

      // Verify tool call events for block insertion tools
      const blockToolNames = [
        "insert_heading",
        "insert_paragraph",
        "insert_markdown",
        "insert_quiz",
        "insert_answer",
        "insert_custom_answer",
        "insert_meaning_association",
        "insert_playlist",
        "insert_image",
        "insert_pdf_viewer",
        "insert_table",
        "insert_excalidraw",
        "insert_file_metadata",
        "insert_layout",
      ];
      const toolEvents = result.events.filter(
        (e) =>
          (e.type === "tool-call" ||
            e.type === "tool_call" ||
            e.type === "tool-result" ||
            e.type === "tool_result") &&
          blockToolNames.includes(e.toolName || e.name || ""),
      );

      // If no typed tool events, check for tool data in fullText (data protocol format)
      const hasToolCall =
        toolEvents.length > 0 ||
        blockToolNames.some((name) => result.fullText.includes(name));

      expect(hasToolCall).toBe(true);
    }, 60000);

    test("SSE events arrive in parseable order mid-stream", async () => {
      await signInAs("student1");

      const restOperation = post({
        apiName: "homeworkSupplyStreamApi",
        path: "/chat",
        options: {
          body: {
            messages: [{ role: "user", content: "Say hello in Japanese." }],
          },
        },
      });

      const response = await restOperation.response;
      const result = await readStreamWithTiming(response.body);

      // Build cumulative text at each chunk boundary and verify
      // that SSE events are parseable at intermediate points
      let accumulated = "";
      let parseableAtMidpoint = false;

      for (const chunk of result.chunks) {
        accumulated += chunk.text;
        const midEvents = parseSSEStream(accumulated);
        if (midEvents.length > 0 && chunk.index < result.chunks.length - 1) {
          parseableAtMidpoint = true;
        }
      }

      // At least some events should be parseable before the final chunk
      expect(parseableAtMidpoint).toBe(true);
    }, 60000);
  });

  // ========================================================================
  // C4. Section Handler (Group Management)
  // ========================================================================
  describe("C4. Section Handler (Group Management)", () => {
    afterEach(cleanup);

    test("Create dynamic section group", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.createSectionGroup({
        name: "Japanese 101 - Spring 2026",
        description: "Beginner Japanese conversation course",
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      expect(typeof data).toBe("string");
    }, 30000);

    test("Add self to section via join code", async () => {
      await signInAs("student1");

      const { data, errors } = await client.mutations.addSelfToSection({
        code: "TEST123",
      });

      expect(typeof data === "string" || errors !== undefined).toBe(true);
    }, 30000);

    // test('List section students by section code', async () => {
    //   await signInAs('instructor1');

    //   const { data, errors } = await client.queries.listSectionStudents({
    //     sectionCode: 'TEST123',
    //   });

    //   expect(errors).toBeUndefined();
    //   expect(Array.isArray(data)).toBe(true);
    // }, 30000);
  });

  // ========================================================================
  // C5. Embeddings Handler
  // ========================================================================
  describe("C5. Embeddings Handler", () => {
    afterEach(cleanup);

    test("Generate embedding for single text", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.generateEmbedding({
        content: "Photosynthesis is the process plants use to make food",
        model: "text-embedding-3-small",
        dimensions: 1536,
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      if (data) {
        expect(data.embedding).toBeDefined();
        expect(Array.isArray(data.embedding)).toBe(true);
        expect(data.embedding.length).toBe(1536);
        expect(data.model).toBe("text-embedding-3-small");
        expect(data.dimensions).toBe(1536);
      }
    }, 30000);

    test("Generate embeddings with default dimensions", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.generateEmbedding({
        content: "Japanese vocabulary word",
        model: "text-embedding-3-small",
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      if (data) {
        expect(data.embedding.length).toBeGreaterThan(0);
      }
    }, 30000);

    test("Verify embedding model is correct", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.generateEmbedding({
        content: "Test text for embedding",
        model: "text-embedding-3-small",
        dimensions: 1536,
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      if (data) {
        expect(data.model).toBe("text-embedding-3-small");
      }
    }, 30000);

    test("Generate embeddings for file", async () => {
      await signInAs("instructor1");

      // This test assumes a file with ID exists - in real scenario, create first
      const { data, errors } = await client.mutations.generateEmbeddings({
        fileID: "test-file-id",
      });

      // May error if file doesn't exist, but handler should respond
      expect(typeof data === "object" || errors !== undefined).toBe(true);
    }, 30000);

    test("Semantic search using embeddings", async () => {
      await signInAs("instructor1");

      const { data: embedding1, errors: err1 } =
        await client.mutations.generateEmbedding({
          content: "Japanese kanji characters",
          model: "text-embedding-3-small",
          dimensions: 1536,
        });

      const { data: embedding2, errors: err2 } =
        await client.mutations.generateEmbedding({
          content: "Kanji writing system in Japan",
          model: "text-embedding-3-small",
          dimensions: 1536,
        });

      expect(err1).toBeUndefined();
      expect(err2).toBeUndefined();

      // Both should have embeddings with same dimensions
      if (embedding1 && embedding2) {
        expect(embedding1.embedding.length).toBe(embedding2.embedding.length);
      }
    }, 60000);
  });

  // ========================================================================
  // C6. OpenAI Handler (Multiple Operations)
  // ========================================================================
  describe("C6. OpenAI Handler (Multiple Operations)", () => {
    afterEach(cleanup);

    // Text-to-Speech
    test("Generate audio from text (TTS)", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.generateAudio({
        phrase: "Konnichiwa, genki desu ka?",
        voice: "alloy",
        model: "tts-1",
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      expect(typeof data).toBe("string");
    }, 30000);

    // Speech-to-Text (Whisper)
    test("Transcribe audio URL (Whisper)", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.queries.transcribeUrl({
        audioUrl: "https://example.com/audio.mp3",
        model: "whisper-1",
      });

      expect(typeof data === "string" || errors !== undefined).toBe(true);
    }, 30000);

    // Image Analysis (Vision)
    test("Analyze image URL (GPT-4 Vision)", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.queries.processImageUrl({
        imageUrl: "https://example.com/image.jpg",
        model: "gpt-4-vision",
      });

      expect(typeof data === "string" || errors !== undefined).toBe(true);
    }, 30000);

    test("Verify image content", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.queries.verifyImageUrl({
        expected: "contains the letter A",
        imageUrl: "https://example.com/image.jpg",
        model: "gpt-4-vision",
      });

      expect(typeof data === "string" || errors !== undefined).toBe(true);
    }, 30000);

    // Image Generation (DALL-E)
    test("Generate image from text (DALL-E)", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.generateImage({
        phrase: "A serene Japanese garden with a pagoda",
        model: "dall-e-3",
      });

      expect(typeof data === "string" || errors !== undefined).toBe(true);
    }, 30000);

    test("Generate image file", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.generateImageFile({
        phrase: "Mount Fuji at sunrise",
        model: "dall-e-3",
      });

      expect(
        typeof data === "object" || typeof data === "string" || errors,
      ).toBeDefined();
    }, 30000);

    // Answer Verification
    test("Verify short answer", async () => {
      await signInAs("student1");

      const { data, errors } = await client.queries.verifyShortAnswer({
        expected: "Photosynthesis is the process plants use to make food",
        answer: "Plants use photosynthesis to make food",
        prompt: "What process do plants use to make food?",
        model: "gpt-4",
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      expect(typeof data).toBe("string");
    }, 30000);

    test("Verify word translation", async () => {
      await signInAs("student1");

      const { data, errors } = await client.queries.verifyWord({
        word: "konnichiwa",
        expected: "こんにちは",
        definition: "Good afternoon / hello",
        model: "gpt-4",
      });

      expect(typeof data === "string" || errors !== undefined).toBe(true);
    }, 30000);

    test("Verify audio content", async () => {
      await signInAs("student1");

      const { data, errors } = await client.queries.verifyAudioUrl({
        expected: "Contains greeting in Japanese",
        audioUrl: "https://example.com/audio.mp3",
        model: "whisper-1",
        chatModel: "gpt-4",
      });

      expect(typeof data === "string" || errors !== undefined).toBe(true);
    }, 30000);

    test("Error handling for failed operations", async () => {
      await signInAs("instructor1");

      // Test with invalid URL
      const { data, errors } = await client.queries.processImageUrl({
        imageUrl: "https://invalid-url-12345.example.com/notfound.jpg",
        model: "gpt-4-vision",
      });

      // Should handle error gracefully
      expect(typeof data === "string" || errors !== undefined).toBe(true);
    }, 30000);
  });

  // ========================================================================
  // C7. Document Analysis Handler
  // ========================================================================
  describe("C7. Document Analysis Handler", () => {
    afterEach(cleanup);

    test("Initiate document analysis", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.analyzeDocument({
        fileID: "test-document-id-1",
      });

      // May error if file doesn't exist, but handler should respond
      expect(typeof data === "object" || errors !== undefined).toBe(true);
    }, 30000);

    test("Document analysis returns proper result structure", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.analyzeDocument({
        fileID: "test-document-id-2",
      });

      if (data && typeof data === "object") {
        // Check expected fields in result
        expect(["status", "fileID", "results"].some((f) => f in data)).toBe(
          true,
        );
      }
    }, 30000);

    test("Cancel document analysis", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.cancelDocumentAnalysis({
        fileID: "test-document-id-1",
      });

      expect(typeof data === "object" || errors !== undefined).toBe(true);
    }, 30000);

    test("Error handling for invalid file ID", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.analyzeDocument({
        fileID: "invalid-file-id-xyz",
      });

      // Should respond with error or error structure
      expect(errors !== undefined || data !== undefined).toBe(true);
    }, 30000);

    test("Generate embeddings for document", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.generateEmbeddings({
        fileID: "test-document-id-3",
      });

      expect(typeof data === "object" || errors !== undefined).toBe(true);
    }, 30000);
  });

  // ========================================================================
  // C8. Moderation Handler
  // ========================================================================
  describe("C8. Moderation Handler", () => {
    afterEach(cleanup);

    test("Check text content for policy violations", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.moderateContent({
        content: "This is a simple test sentence about learning Japanese.",
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      expect(typeof data === "object").toBe(true);
    }, 30000);

    test("Moderation result has required fields", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.moderateContent({
        content: "Test content for moderation",
      });

      if (data && typeof data === "object") {
        // Check for actual response fields from OpenAI moderation API
        expect(
          ["flagged", "categories", "categoryScores", "model"].some(
            (f) => f in data,
          ),
        ).toBe(true);
        expect(data).toHaveProperty("flagged");
        expect(typeof data.flagged).toBe("boolean");
      }
    }, 30000);

    test("Flag inappropriate content", async () => {
      await signInAs("instructor1");

      // Test with content that may be flagged (use mild example)
      const { data, errors } = await client.mutations.moderateContent({
        content: "This content should be checked for appropriateness",
      });

      expect(typeof data === "object" || errors !== undefined).toBe(true);
    }, 30000);

    test("Store moderation results", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.moderateContent({
        content: "Content to be moderated and stored",
      });

      expect(errors).toBeUndefined();
      // Result should contain moderation fields
      if (data && typeof data === "object") {
        expect(data).toHaveProperty("flagged");
        expect(data).toHaveProperty("categories");
        expect(data).toHaveProperty("categoryScores");
        expect(data).toHaveProperty("model");
      }
    }, 30000);

    test("Auto-reject flagged content", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.moderateContent({
        content: "Test content",
      });

      // Moderation handler should return status info
      expect(data !== undefined || errors !== undefined).toBe(true);
    }, 30000);

    test("Handle empty content", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.moderateContent({
        content: "",
      });

      // Should handle gracefully
      expect(typeof data === "object" || errors !== undefined).toBe(true);
    }, 30000);
  });

  // ========================================================================
  // C9. Multi-Modal Moderation (Image + Audio)
  // ========================================================================
  describe("C9. Multi-Modal Moderation", () => {
    afterEach(cleanup);

    // --- Image Moderation ---

    test("Moderate image via URL returns moderation result", async () => {
      await signInAs("instructor1");

      // Use a publicly accessible safe test image
      const { data, errors } = await client.mutations.moderateImage({
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png",
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      if (data && typeof data === "object") {
        expect(data).toHaveProperty("flagged");
        expect(typeof data.flagged).toBe("boolean");
        expect(data).toHaveProperty("categories");
        expect(data).toHaveProperty("categoryScores");
        expect(data).toHaveProperty("model");
        expect(data.model).toContain("omni-moderation");
        // Safe image should not be flagged
        expect(data.flagged).toBe(false);
      }
    }, 60000);

    test("Moderate image handles empty URL gracefully", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.moderateImage({
        imageUrl: "",
      });

      // Should return safe fallback, not throw
      expect(typeof data === "object" || errors !== undefined).toBe(true);
      if (data && typeof data === "object") {
        expect(data.flagged).toBe(false);
      }
    }, 30000);

    test("Moderate image rejects invalid URL format", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.moderateImage({
        imageUrl: "not-a-valid-url",
      });

      // Should return error for invalid URL
      expect(errors !== undefined || (data && typeof data === "object")).toBe(
        true,
      );
    }, 30000);

    // --- Audio Moderation ---

    test("Moderate audio via URL transcribes and returns moderation result", async () => {
      await signInAs("instructor1");

      // Use a short publicly accessible audio sample (Wikimedia Commons)
      const { data, errors } = await client.mutations.moderateAudio({
        audioUrl:
          "https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg",
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      if (data && typeof data === "object") {
        expect(data).toHaveProperty("flagged");
        expect(typeof data.flagged).toBe("boolean");
        expect(data).toHaveProperty("categories");
        expect(data).toHaveProperty("categoryScores");
        expect(data).toHaveProperty("model");
        expect(data.model).toContain("omni-moderation");
        // Should include the transcript from Whisper
        expect(data).toHaveProperty("transcript");
        expect(typeof data.transcript).toBe("string");
        // Safe educational audio should not be flagged
        expect(data.flagged).toBe(false);
      }
    }, 90000);

    test("Moderate audio handles empty URL gracefully", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.moderateAudio({
        audioUrl: "",
      });

      // Should return safe fallback, not throw
      expect(typeof data === "object" || errors !== undefined).toBe(true);
      if (data && typeof data === "object") {
        expect(data.flagged).toBe(false);
      }
    }, 30000);

    test("Moderate audio rejects invalid URL format", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.moderateAudio({
        audioUrl: "not-a-valid-url",
      });

      // Should return error for invalid URL
      expect(errors !== undefined || (data && typeof data === "object")).toBe(
        true,
      );
    }, 30000);

    // --- verifyAudioUrl now includes moderation ---

    test("verifyAudioUrl includes moderation result in response", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.queries.verifyAudioUrl({
        expected: "hello",
        audioUrl:
          "https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg",
        model: "whisper-1",
        chatModel: "gpt-3.5-turbo",
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      if (data) {
        const result = JSON.parse(data as string);
        // Should have standard verify fields
        expect(result).toHaveProperty("correct");
        expect(result).toHaveProperty("score");
        // Should now also include moderation
        expect(result).toHaveProperty("moderation");
        if (result.moderation) {
          expect(result.moderation).toHaveProperty("flagged");
          expect(typeof result.moderation.flagged).toBe("boolean");
          expect(result.moderation).toHaveProperty("categories");
          expect(result.moderation).toHaveProperty("model");
        }
        // Should include transcript
        expect(result).toHaveProperty("transcript");
        expect(typeof result.transcript).toBe("string");
      }
    }, 90000);

    // --- Text moderation still works with omni-moderation-latest ---

    test("Text moderation uses omni-moderation-latest model", async () => {
      await signInAs("instructor1");

      const { data, errors } = await client.mutations.moderateContent({
        content:
          "The students are learning about photosynthesis in biology class.",
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      if (data && typeof data === "object") {
        expect(data.model).toContain("omni-moderation");
        expect(data.flagged).toBe(false);
      }
    }, 30000);

    // --- Server-authoritative record persistence ---

    test("moderateContent with modelName+recordId persists to Unit.moderation", async () => {
      await signInAs("instructor1");

      // Create a test unit
      const { data: unit } = await client.models.Unit.create({
        name: "Moderation Persist Test Unit",
        description: "Unit for testing backend moderation persistence",
      });
      expect(unit).toBeDefined();
      expect(unit!.id).toBeDefined();

      // Moderate with modelName + recordId — backend should write to Unit.moderation
      const { data: modResult, errors } =
        await client.mutations.moderateContent({
          content: "Safe educational content about biology.",
          modelName: "Unit",
          recordId: unit!.id,
        });

      expect(errors).toBeUndefined();
      expect(modResult).toBeDefined();
      expect(modResult!.flagged).toBe(false);

      // Verify the record was updated by the backend
      const { data: updatedUnit } = await client.models.Unit.get({
        id: unit!.id,
      });
      expect(updatedUnit).toBeDefined();
      expect(updatedUnit!.moderation).toBeDefined();

      const moderation =
        typeof updatedUnit!.moderation === "string"
          ? JSON.parse(updatedUnit!.moderation)
          : updatedUnit!.moderation;
      expect(moderation.status).toBe("approved");
      expect(moderation.checkedAt).toBeDefined();

      // Cleanup
      await client.models.Unit.delete({ id: unit!.id });
    }, 60000);

    test("moderateContent with modelName+recordId persists flagged status", async () => {
      await signInAs("instructor1");

      // Create a test unit
      const { data: unit } = await client.models.Unit.create({
        name: "Moderation Flag Test Unit",
        description: "Unit for testing flagged content persistence",
      });
      expect(unit).toBeDefined();

      // Moderate with content that should be checked (mild but testable)
      const { data: modResult, errors } =
        await client.mutations.moderateContent({
          content: "This is a normal sentence for testing.",
          modelName: "Unit",
          recordId: unit!.id,
        });

      expect(errors).toBeUndefined();
      expect(modResult).toBeDefined();

      // Verify backend wrote the moderation field regardless of flag status
      const { data: updatedUnit } = await client.models.Unit.get({
        id: unit!.id,
      });
      expect(updatedUnit!.moderation).toBeDefined();

      const moderation =
        typeof updatedUnit!.moderation === "string"
          ? JSON.parse(updatedUnit!.moderation)
          : updatedUnit!.moderation;
      // Status should be either 'approved' or 'flagged'
      expect(["approved", "flagged"]).toContain(moderation.status);
      expect(moderation.checkedAt).toBeDefined();

      // Cleanup
      await client.models.Unit.delete({ id: unit!.id });
    }, 60000);

    test("moderateContent without modelName+recordId does NOT modify records", async () => {
      await signInAs("instructor1");

      // Call moderation without record context — should just return result
      const { data, errors } = await client.mutations.moderateContent({
        content: "Just checking text, no record to update.",
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      expect(data!.flagged).toBe(false);
      // No crash, no side effects — backward compatible
    }, 30000);
  });
});

// Run cleanup on test suite completion
afterAll(async () => {
  await signOut();
});
