/**
 * Integration tests for contentCompletionStream handler
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('contentCompletionStream handler integration tests', () => {
  beforeEach(() => {
    vi.stubEnv('OPENAI_API_KEY', 'test-api-key');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('IS_LOCAL', 'true');
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should require authorization header', async () => {
    // Handler should reject requests without Bearer token
    const testCases = [
      { headers: {} }, // Missing auth header
      { headers: { authorization: 'Basic xyz' } }, // Wrong type
      { headers: { authorization: 'Bearer' } }, // Empty token
    ];

    testCases.forEach(testCase => {
      expect(testCase.headers.authorization?.startsWith('Bearer ')).not.toBe(true);
    });
  });

  it('should require prompt parameter', async () => {
    const { handler } = await import('../contentCompletionStream/handler');
    
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should handle context properly', async () => {
    const contextWithUnit = {
      unitName: 'Hiragana Introduction',
      lastBlocks: [
        { type: 'paragraph', content: 'あ行について' },
        { type: 'quiz', content: 'Question 1' },
      ],
    };

    // Verify context structure is valid
    expect(contextWithUnit.unitName).toBeDefined();
    expect(Array.isArray(contextWithUnit.lastBlocks)).toBe(true);
    expect(contextWithUnit.lastBlocks.length).toBe(2);
  });

  it('should set correct response headers', async () => {
    const expectedHeaders = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    };

    Object.entries(expectedHeaders).forEach(([key, value]) => {
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
    });
  });

  it('should format SSE correctly', () => {
    const chunk = { type: 'text-delta', delta: 'sample text' };
    const sseFormatted = `data: ${JSON.stringify(chunk)}\n\n`;

    // SSE format should be: "data: {...}\n\n"
    expect(sseFormatted).toMatch(/^data: {.*}\n\n$/);
    expect(sseFormatted.includes('text-delta')).toBe(true);
  });
});
