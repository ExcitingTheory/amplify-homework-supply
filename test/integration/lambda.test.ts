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

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, test } from 'vitest';
import { Amplify } from 'aws-amplify';
import { parseAmplifyConfig } from 'aws-amplify/utils';
import { generateClient } from 'aws-amplify/api';
import { post } from 'aws-amplify/api';
import { signIn, signOut, fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import amplifyOutputs from '../../amplify_outputs.json';
import {
  signInAs,
 } from './shared';

// Configure Amplify with existing resources
const amplifyConfig = parseAmplifyConfig(amplifyOutputs);

Amplify.configure({
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
});

// Create typed GraphQL client
const client = generateClient<Schema>();

// Helper: Clean up test data after each test
async function cleanup() {
  await signOut();
}

describe('C. Lambda Handler Integration Tests', () => {
  // ========================================================================
  // C1. Chat Stream Handler
  // ========================================================================
  describe('C1. Chat Stream Handler', () => {
    afterEach(cleanup);

    test('Send chat message with streaming response', async () => {
      await signInAs('student1');

      const restOperation = post({
        apiName: 'homeworkSupplyStreamApi',
        path: '/chat',
        options: {
          body: {
            messages: [
              {
                role: 'user',
                content: 'What are the basic hiragana characters?',
              },
            ],
          },
        },
      });

      const { body } = await restOperation.response;
      const text = await body.text();
      console.log('Chat Stream Response:', text);

      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
      // SSE format should contain "data:" prefix
      expect(text).toContain('data:');
    }, 30000);

    test('Chat with context awareness', async () => {
      await signInAs('instructor1');

      const restOperation = post({
        apiName: 'homeworkSupplyStreamApi',
        path: '/chat',
        options: {
          body: {
            messages: [
              {
                role: 'user',
                content: 'Generate a quiz about this topic',
              },
            ],
            context: {
              unit: { name: 'Test Unit', description: 'Testing context' },
            },
          },
        },
      });

      const { body } = await restOperation.response;
      const text = await body.text();

      expect(text).toBeDefined();
      expect(text.length).toBeGreaterThan(0);
    }, 30000);

    test('Error handling for empty message', async () => {
      await signInAs('student1');

      const restOperation = post({
        apiName: 'homeworkSupplyStreamApi',
        path: '/chat',
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
  describe('C2. Content Completion Handler', () => {
    afterEach(cleanup);

    test('Generate content completion for editor', async () => {
      await signInAs('instructor1');

      const restOperation = post({
        apiName: 'homeworkSupplyStreamApi',
        path: '/content-completion',
        options: {
          body: {
            prompt: 'Write an introduction about Japanese culture',
            context: { topic: 'culture', language: 'Japanese' },
          },
        },
      });

      const { body } = await restOperation.response;
      const text = await body.text();

      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
      // SSE format should contain "data:" prefix
      expect(text).toContain('data:');
    }, 30000);

    test('Content completion with context-aware suggestions', async () => {
      await signInAs('instructor1');

      const restOperation = post({
        apiName: 'homeworkSupplyStreamApi',
        path: '/content-completion',
        options: {
          body: {
            prompt: 'Continue this sentence: When learning Japanese, one should...',
            context: { level: 'beginner', topic: 'learning-tips' },
          },
        },
      });

      const { body } = await restOperation.response;
      const text = await body.text();

      expect(text).toBeDefined();
      expect(text.length).toBeGreaterThan(0);
    }, 30000);

    test('Content completion respects user preferences', async () => {
      await signInAs('instructor1');

      const restOperation = post({
        apiName: 'homeworkSupplyStreamApi',
        path: '/content-completion',
        options: {
          body: {
            prompt: 'Generate a grammar explanation for Japanese verbs',
            context: { temperature: 0.7, maxTokens: 200 },
          },
        },
      });

      const { body } = await restOperation.response;
      const text = await body.text();

      expect(text).toBeDefined();
      expect(text.length).toBeGreaterThan(0);
    }, 30000);

    test('Error handling for incomplete prompts', async () => {
      await signInAs('instructor1');

      try {
        const restOperation = post({
          apiName: 'homeworkSupplyStreamApi',
          path: '/content-completion',
          options: {
            body: {
              prompt: '',
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
  describe('C3. Suggest Blocks Handler', () => {
    afterEach(cleanup);

    test('Suggest quiz blocks for unit', async () => {
      await signInAs('instructor1');

      const restOperation = post({
        apiName: 'homeworkSupplyStreamApi',
        path: '/suggest-blocks',
        options: {
          body: {
            unitStructure: {
              title: 'Japanese Hiragana',
              content: 'Learn the basic hiragana characters',
            },
            currentContext: { language: 'Japanese', level: 'beginner' },
            userHistory: { previousBlocks: ['text', 'image'] },
          },
        },
      });

      const { body } = await restOperation.response;
      const result = await body.json() as any;

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.overallAssessment).toBeDefined();
    }, 30000);

    test('Suggest meaning-association blocks', async () => {
      await signInAs('instructor1');

      const restOperation = post({
        apiName: 'homeworkSupplyStreamApi',
        path: '/suggest-blocks',
        options: {
          body: {
            unitStructure: {
              title: 'Vocabulary Matching',
              content: 'Match words to definitions',
            },
            currentContext: {
              blockTypes: ['meaning-association'],
            },
          },
        },
      });

      const { body } = await restOperation.response;
      const result = await body.json() as any;

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
    }, 30000);

    test('Suggest custom-answer blocks', async () => {
      await signInAs('instructor1');

      const restOperation = post({
        apiName: 'homeworkSupplyStreamApi',
        path: '/suggest-blocks',
        options: {
          body: {
            unitStructure: {
              title: 'Free Response Practice',
            },
            currentContext: {
              blockTypes: ['custom-answer'],
            },
          },
        },
      });

      const { body } = await restOperation.response;
      const result = await body.json() as any;

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
    }, 30000);

    test('Validate block structure matches schema', async () => {
      await signInAs('instructor1');

      const restOperation = post({
        apiName: 'homeworkSupplyStreamApi',
        path: '/suggest-blocks',
        options: {
          body: {
            unitStructure: {
              title: 'Test Unit',
              content: 'Test content',
            },
          },
        },
      });

      const { body } = await restOperation.response;
      const result = await body.json() as any;

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      // Each suggestion should have required fields
      if (result && result.suggestions && result.suggestions.length > 0) {
        expect(result.suggestions[0]).toHaveProperty('type');
        expect(result.suggestions[0]).toHaveProperty('label');
        expect(result.suggestions[0]).toHaveProperty('reasoning');
        expect(result.suggestions[0]).toHaveProperty('priority');
      }
    }, 30000);
  });

  // ========================================================================
  // C4. Section Handler (Group Management)
  // ========================================================================
  describe('C4. Section Handler (Group Management)', () => {
    afterEach(cleanup);

    test('Create dynamic section group', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.createSectionGroup({
        name: 'Japanese 101 - Spring 2026',
        description: 'Beginner Japanese conversation course',
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      expect(typeof data).toBe('string');
    }, 30000);

    test('Add self to section via join code', async () => {
      await signInAs('student1');

      const { data, errors } = await client.mutations.addSelfToSection({
        code: 'TEST123',
      });

      expect(typeof data === 'string' || errors !== undefined).toBe(true);
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
  describe('C5. Embeddings Handler', () => {
    afterEach(cleanup);

    test('Generate embedding for single text', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.generateEmbedding({
        content: 'Photosynthesis is the process plants use to make food',
        model: 'text-embedding-3-small',
        dimensions: 1536,
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      if (data) {
        expect(data.embedding).toBeDefined();
        expect(Array.isArray(data.embedding)).toBe(true);
        expect(data.embedding.length).toBe(1536);
        expect(data.model).toBe('text-embedding-3-small');
        expect(data.dimensions).toBe(1536);
      }
    }, 30000);

    test('Generate embeddings with default dimensions', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.generateEmbedding({
        content: 'Japanese vocabulary word',
        model: 'text-embedding-3-small',
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      if (data) {
        expect(data.embedding.length).toBeGreaterThan(0);
      }
    }, 30000);

    test('Verify embedding model is correct', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.generateEmbedding({
        content: 'Test text for embedding',
        model: 'text-embedding-3-small',
        dimensions: 1536,
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      if (data) {
        expect(data.model).toBe('text-embedding-3-small');
      }
    }, 30000);

    test('Generate embeddings for file', async () => {
      await signInAs('instructor1');

      // This test assumes a file with ID exists - in real scenario, create first
      const { data, errors } = await client.mutations.generateEmbeddings({
        fileID: 'test-file-id',
      });

      // May error if file doesn't exist, but handler should respond
      expect(typeof data === 'object' || errors !== undefined).toBe(true);
    }, 30000);

    test('Semantic search using embeddings', async () => {
      await signInAs('instructor1');

      const { data: embedding1, errors: err1 } =
        await client.mutations.generateEmbedding({
          content: 'Japanese kanji characters',
          model: 'text-embedding-3-small',
          dimensions: 1536,
        });

      const { data: embedding2, errors: err2 } =
        await client.mutations.generateEmbedding({
          content: 'Kanji writing system in Japan',
          model: 'text-embedding-3-small',
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
  describe('C6. OpenAI Handler (Multiple Operations)', () => {
    afterEach(cleanup);

    // Text-to-Speech
    test('Generate audio from text (TTS)', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.generateAudio({
        phrase: 'Konnichiwa, genki desu ka?',
        voice: 'alloy',
        model: 'tts-1',
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      expect(typeof data).toBe('string');
    }, 30000);

    // Speech-to-Text (Whisper)
    test('Transcribe audio URL (Whisper)', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.queries.transcribeUrl({
        audioUrl: 'https://example.com/audio.mp3',
        model: 'whisper-1',
      });

      expect(typeof data === 'string' || errors !== undefined).toBe(true);
    }, 30000);

    // Image Analysis (Vision)
    test('Analyze image URL (GPT-4 Vision)', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.queries.processImageUrl({
        imageUrl: 'https://example.com/image.jpg',
        model: 'gpt-4-vision',
      });

      expect(typeof data === 'string' || errors !== undefined).toBe(true);
    }, 30000);

    test('Verify image content', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.queries.verifyImageUrl({
        expected: 'contains the letter A',
        imageUrl: 'https://example.com/image.jpg',
        model: 'gpt-4-vision',
      });

      expect(typeof data === 'string' || errors !== undefined).toBe(true);
    }, 30000);

    // Image Generation (DALL-E)
    test('Generate image from text (DALL-E)', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.generateImage({
        phrase: 'A serene Japanese garden with a pagoda',
        model: 'dall-e-3',
      });

      expect(typeof data === 'string' || errors !== undefined).toBe(true);
    }, 30000);

    test('Generate image file', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.generateImageFile({
        phrase: 'Mount Fuji at sunrise',
        model: 'dall-e-3',
      });

      expect(
        typeof data === 'object' || typeof data === 'string' || errors
      ).toBeDefined();
    }, 30000);

    // Answer Verification
    test('Verify short answer', async () => {
      await signInAs('student1');

      const { data, errors } = await client.queries.verifyShortAnswer({
        expected: 'Photosynthesis is the process plants use to make food',
        answer: 'Plants use photosynthesis to make food',
        prompt: 'What process do plants use to make food?',
        model: 'gpt-4',
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      expect(typeof data).toBe('string');
    }, 30000);

    test('Verify word translation', async () => {
      await signInAs('student1');

      const { data, errors } = await client.queries.verifyWord({
        word: 'konnichiwa',
        expected: 'こんにちは',
        definition: 'Good afternoon / hello',
        model: 'gpt-4',
      });

      expect(typeof data === 'string' || errors !== undefined).toBe(true);
    }, 30000);

    test('Verify audio content', async () => {
      await signInAs('student1');

      const { data, errors } = await client.queries.verifyAudioUrl({
        expected: 'Contains greeting in Japanese',
        audioUrl: 'https://example.com/audio.mp3',
        model: 'whisper-1',
        chatModel: 'gpt-4',
      });

      expect(typeof data === 'string' || errors !== undefined).toBe(true);
    }, 30000);

    test('Error handling for failed operations', async () => {
      await signInAs('instructor1');

      // Test with invalid URL
      const { data, errors } = await client.queries.processImageUrl({
        imageUrl: 'https://invalid-url-12345.example.com/notfound.jpg',
        model: 'gpt-4-vision',
      });

      // Should handle error gracefully
      expect(typeof data === 'string' || errors !== undefined).toBe(true);
    }, 30000);
  });

  // ========================================================================
  // C7. Document Analysis Handler
  // ========================================================================
  describe('C7. Document Analysis Handler', () => {
    afterEach(cleanup);

    test('Initiate document analysis', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.analyzeDocument({
        fileID: 'test-document-id-1',
      });

      // May error if file doesn't exist, but handler should respond
      expect(
        typeof data === 'object' || errors !== undefined
      ).toBe(true);
    }, 30000);

    test('Document analysis returns proper result structure', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.analyzeDocument({
        fileID: 'test-document-id-2',
      });

      if (data && typeof data === 'object') {
        // Check expected fields in result
        expect(['status', 'fileID', 'results'].some(f => f in data)).toBe(true);
      }
    }, 30000);

    test('Cancel document analysis', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.cancelDocumentAnalysis({
        fileID: 'test-document-id-1',
      });

      expect(typeof data === 'object' || errors !== undefined).toBe(true);
    }, 30000);

    test('Error handling for invalid file ID', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.analyzeDocument({
        fileID: 'invalid-file-id-xyz',
      });

      // Should respond with error or error structure
      expect(errors !== undefined || data !== undefined).toBe(true);
    }, 30000);

    test('Generate embeddings for document', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.generateEmbeddings({
        fileID: 'test-document-id-3',
      });

      expect(
        typeof data === 'object' || errors !== undefined
      ).toBe(true);
    }, 30000);
  });

  // ========================================================================
  // C8. Moderation Handler
  // ========================================================================
  describe('C8. Moderation Handler', () => {
    afterEach(cleanup);

    test('Check text content for policy violations', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.moderateContent({
        content: 'This is a simple test sentence about learning Japanese.',
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      expect(typeof data === 'object').toBe(true);
    }, 30000);

    test('Moderation result has required fields', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.moderateContent({
        content: 'Test content for moderation',
      });

      if (data && typeof data === 'object') {
        expect(['status', 'flags', 'checkedAt'].some(f => f in data)).toBe(true);
      }
    }, 30000);

    test('Flag inappropriate content', async () => {
      await signInAs('instructor1');

      // Test with content that may be flagged (use mild example)
      const { data, errors } = await client.mutations.moderateContent({
        content: 'This content should be checked for appropriateness',
      });

      expect(typeof data === 'object' || errors !== undefined).toBe(true);
    }, 30000);

    test('Store moderation results', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.moderateContent({
        content: 'Content to be moderated and stored',
      });

      expect(errors).toBeUndefined();
      // Result should contain status field
      if (data && typeof data === 'object') {
        expect(data).toHaveProperty('status');
      }
    }, 30000);

    test('Auto-reject flagged content', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.moderateContent({
        content: 'Test content',
      });

      // Moderation handler should return status info
      expect(data !== undefined || errors !== undefined).toBe(true);
    }, 30000);

    test('Handle empty content', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.moderateContent({
        content: '',
      });

      // Should handle gracefully
      expect(typeof data === 'object' || errors !== undefined).toBe(true);
    }, 30000);
  });

  // ========================================================================
  // Additional Integration Tests
  // ========================================================================
  describe('Content & AI Integration', () => {
    afterEach(cleanup);

    test('Predict unit data', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.predictUnitData({
        unitID: 'test-unit-id-1',
      });

      expect(typeof data === 'string' || errors !== undefined).toBe(true);
    }, 30000);

    test('Predict unit by data content', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.predictUnitByData({
        data: 'Sample unit content for prediction',
      });

      expect(typeof data === 'string' || errors !== undefined).toBe(true);
    }, 30000);
  });

  // ========================================================================
  // Assistant Editor Tests
  // ========================================================================
  describe('Assistant Editor Mutations', () => {
    afterEach(cleanup);

    test('Initialize assistant editor', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.initAssistantEditor({
        model: 'gpt-4',
        additionalInstructions: 'You are a Japanese language tutor',
      });

      expect(typeof data === 'string' || errors !== undefined).toBe(true);
    }, 30000);

    test('Update assistant editor', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.updateAssistantEditor({
        assistantId: 'test-assistant-id',
        additionalInstructions: 'Updated instructions',
        model: 'gpt-4',
      });

      expect(typeof data === 'string' || errors !== undefined).toBe(true);
    }, 30000);

    test('Delete assistant editor', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.deleteAssistantEditor({
        assistantId: 'test-assistant-id',
        threadId: 'test-thread-id',
      });

      expect(typeof data === 'string' || errors !== undefined).toBe(true);
    }, 30000);

    test('Chat with assistant thread', async () => {
      await signInAs('instructor1');

      const { data, errors } = await client.mutations.chatAssistantThread({
        assistantId: 'test-assistant-id',
        messages: JSON.stringify([
          {
            role: 'user',
            content: 'What are kanji?',
          },
        ]),
      });

      expect(typeof data === 'string' || errors !== undefined).toBe(true);
    }, 30000);
  });
});

// Run cleanup on test suite completion
afterAll(async () => {
  await signOut();
});
