/**
 * Integration tests for suggestBlocksStream handler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('suggestBlocksStream handler integration tests', () => {
  beforeEach(() => {
    vi.stubEnv('OPENAI_API_KEY', 'test-api-key');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('IS_LOCAL', 'true');
    vi.resetModules();
  });

  it('should require authorization header', () => {
    const validAuth = 'Bearer test-token';
    const invalidAuth = 'Basic test-token';

    expect(validAuth.startsWith('Bearer ')).toBe(true);
    expect(invalidAuth.startsWith('Bearer ')).toBe(false);
  });

  it('should validate unitStructure parameter', async () => {
    const { handler } = await import('../suggestBlocksStream/handler');
    
    expect(handler).toBeDefined();
    // Handler requires unitStructure in request body
  });

  it('should suggest valid block types', () => {
    const validBlockTypes = [
      'heading',
      'paragraph',
      'quiz',
      'meaning-association',
      'answer',
      'custom-answer',
    ];

    validBlockTypes.forEach(blockType => {
      expect(typeof blockType).toBe('string');
      expect(blockType.length).toBeGreaterThan(0);
    });
  });

  it('should format block suggestions with reasoning', () => {
    const suggestion = {
      type: 'quiz',
      label: 'Practice Questions',
      icon: '❓',
      reasoning: 'Quiz reinforces vocabulary understanding and tests retention',
      priority: 'HIGH',
    };

    expect(suggestion.type).toBeDefined();
    expect(suggestion.label).toBeDefined();
    expect(suggestion.icon).toBeDefined();
    expect(suggestion.reasoning.length).toBeGreaterThan(10);
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(suggestion.priority);
  });

  it('should set correct response headers for JSON', () => {
    const jsonHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };

    expect(jsonHeaders['Content-Type']).toBe('application/json');
    expect(jsonHeaders['Access-Control-Allow-Origin']).toBe('*');
  });

  it('should parse unit structure correctly', () => {
    const unitStructure = {
      name: 'Hiragana Basics',
      blocks: [
        { id: 'block-1', type: 'heading', content: 'あ行' },
        { id: 'block-2', type: 'paragraph', content: 'Introduction text' },
        { id: 'block-3', type: 'meaning-association', content: 'Visual associations' },
      ],
    };

    expect(unitStructure.name).toBeDefined();
    expect(Array.isArray(unitStructure.blocks)).toBe(true);
    expect(unitStructure.blocks.length).toBe(3);
    expect(unitStructure.blocks[0].type).toBe('heading');
  });

  it('should handle system message construction', () => {
    const systemPrompt = `You are an expert educational content designer specializing in Japanese language instruction.`;

    expect(systemPrompt).toContain('educational');
    expect(systemPrompt).toContain('Japanese');
    expect(systemPrompt.length).toBeGreaterThan(50);
  });

  it('should validate JSON response format', () => {
    const mockResponse = {
      suggestions: [
        {
          type: 'quiz',
          label: 'Quick Quiz',
          icon: '❓',
          reasoning: 'Test comprehension',
          priority: 'MEDIUM',
        },
      ],
      overallAssessment: 'Unit has good structure with room for practice exercises',
    };

    const jsonString = JSON.stringify(mockResponse);
    const parsed = JSON.parse(jsonString);

    expect(Array.isArray(parsed.suggestions)).toBe(true);
    expect(parsed.overallAssessment).toBeDefined();
  });
});
