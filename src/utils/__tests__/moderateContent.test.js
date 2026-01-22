/**
 * Unit tests for moderateContent.js
 * Tests content moderation using OpenAI Moderation API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AWS Amplify API before importing the module
vi.mock('aws-amplify/api', () => ({
  generateClient: () => ({
    graphql: vi.fn()
  })
}));

import { 
  moderateContent, 
  buildModerationFields, 
  moderateAndSave,
  getModerationStatus,
  shouldShowModerationWarning
} from '../moderateContent.js';
import { generateClient } from 'aws-amplify/api';

describe('moderateContent', () => {
  let mockGraphql;
  
  beforeEach(() => {
    // Reset mocks
    mockGraphql = vi.fn();
    vi.mocked(generateClient).mockReturnValue({
      graphql: mockGraphql
    });
  });
  
  describe('Text Extraction', () => {
    it('should extract text from plain strings', async () => {
      const testContent = 'This is a test message';
      
      mockGraphql.mockResolvedValue({
        data: {
          moderateContent: {
            flagged: false,
            categories: {},
            categoryScores: {},
            model: 'text-moderation-latest',
            error: null
          }
        }
      });
      
      await moderateContent(testContent);
      
      // Verify the mutation was called with the correct content
      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining('mutation ModerateContent'),
        variables: { content: testContent }
      });
    });
    
    it('should extract text from Lexical JSON editor state', async () => {
      const lexicalContent = {
        root: {
          children: [
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'Hello ' },
                { type: 'text', text: 'world', format: 1 }
              ]
            },
            {
              type: 'heading',
              children: [
                { type: 'text', text: 'Test Heading' }
              ]
            }
          ]
        }
      };
      
      mockGraphql.mockResolvedValue({
        data: {
          moderateContent: {
            flagged: false,
            categories: {},
            categoryScores: {},
            model: 'text-moderation-latest',
            error: null
          }
        }
      });
      
      await moderateContent(lexicalContent);
      
      // Should extract all text nodes
      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining('mutation ModerateContent'),
        variables: { content: 'Hello world Test Heading' }
      });
    });
    
    it('should extract text from custom Lexical block types', async () => {
      const customBlockContent = {
        root: {
          children: [
            {
              type: 'quiz',
              prompt: 'What is the answer?',
              answer: 'The correct answer'
            },
            {
              type: 'meaning-association',
              phrase: 'こんにちは',
              definition: 'Hello'
            }
          ]
        }
      };
      
      mockGraphql.mockResolvedValue({
        data: {
          moderateContent: {
            flagged: false,
            categories: {},
            categoryScores: {},
            model: 'text-moderation-latest',
            error: null
          }
        }
      });
      
      await moderateContent(customBlockContent);
      
      // Should extract prompt, answer, phrase, definition
      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining('mutation ModerateContent'),
        variables: { content: 'What is the answer? The correct answer こんにちは Hello' }
      });
    });
    
    it('should extract text from Grade data (student responses)', async () => {
      const gradeData = {
        'block-1': {
          userAnswer: 'Student answer 1',
          complete: true,
          accuracy: 100
        },
        'block-2': {
          response: 'Student response 2',
          complete: true,
          accuracy: 80
        }
      };
      
      mockGraphql.mockResolvedValue({
        data: {
          moderateContent: {
            flagged: false,
            categories: {},
            categoryScores: {},
            model: 'text-moderation-latest',
            error: null
          }
        }
      });
      
      await moderateContent(gradeData);
      
      // Should extract userAnswer and response fields
      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining('mutation ModerateContent'),
        variables: { content: 'Student answer 1 Student response 2' }
      });
    });
    
    it('should handle empty or null content', async () => {
      mockGraphql.mockResolvedValue({
        data: {
          moderateContent: {
            flagged: false,
            categories: {},
            categoryScores: {},
            model: 'text-moderation-latest',
            error: null
          }
        }
      });
      
      const result = await moderateContent(null);
      
      // Should not call API for empty content
      expect(mockGraphql).not.toHaveBeenCalled();
      expect(result.flagged).toBe(false);
    });
    
    it('should parse JSON strings', async () => {
      const jsonString = JSON.stringify({
        root: {
          children: [
            { type: 'text', text: 'Parsed from JSON' }
          ]
        }
      });
      
      mockGraphql.mockResolvedValue({
        data: {
          moderateContent: {
            flagged: false,
            categories: {},
            categoryScores: {},
            model: 'text-moderation-latest',
            error: null
          }
        }
      });
      
      await moderateContent(jsonString);
      
      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining('mutation ModerateContent'),
        variables: { content: 'Parsed from JSON' }
      });
    });
  });
  
  describe('Moderation API Calls', () => {
    it('should return non-flagged result for appropriate content', async () => {
      mockGraphql.mockResolvedValue({
        data: {
          moderateContent: {
            flagged: false,
            categories: {
              hate: false,
              'hate/threatening': false,
              'self-harm': false,
              sexual: false,
              'sexual/minors': false,
              violence: false,
              'violence/graphic': false
            },
            categoryScores: {
              hate: 0.00001,
              'hate/threatening': 0.00001,
              'self-harm': 0.00001,
              sexual: 0.00001,
              'sexual/minors': 0.00001,
              violence: 0.00001,
              'violence/graphic': 0.00001
            },
            model: 'text-moderation-latest',
            error: null
          }
        }
      });
      
      const result = await moderateContent('This is appropriate educational content.');
      
      expect(result.flagged).toBe(false);
      expect(result.categories).toBeDefined();
      expect(result.categoryScores).toBeDefined();
      expect(result.model).toBe('text-moderation-latest');
    });
    
    it('should return flagged result for inappropriate content', async () => {
      mockGraphql.mockResolvedValue({
        data: {
          moderateContent: {
            flagged: true,
            categories: {
              hate: false,
              'hate/threatening': false,
              'self-harm': false,
              sexual: false,
              'sexual/minors': false,
              violence: true,
              'violence/graphic': false
            },
            categoryScores: {
              hate: 0.00001,
              'hate/threatening': 0.00001,
              'self-harm': 0.00001,
              sexual: 0.00001,
              'sexual/minors': 0.00001,
              violence: 0.95,
              'violence/graphic': 0.00001
            },
            model: 'text-moderation-latest',
            error: null
          }
        }
      });
      
      const result = await moderateContent('Inappropriate violent content');
      
      expect(result.flagged).toBe(true);
      expect(result.categories.violence).toBe(true);
      expect(result.categoryScores.violence).toBeGreaterThan(0.9);
    });
    
    it('should handle API errors gracefully', async () => {
      mockGraphql.mockRejectedValue(new Error('Network error'));
      
      const result = await moderateContent('Test content');
      
      // Should not throw, should return non-flagged result
      expect(result.flagged).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });
  
  describe('buildModerationFields', () => {
    it('should build fields for flagged content', () => {
      const moderationResult = {
        flagged: true,
        categories: {
          violence: true,
          hate: false
        },
        categoryScores: {
          violence: 0.95,
          hate: 0.01
        },
        model: 'text-moderation-latest'
      };
      
      const fields = buildModerationFields(moderationResult);
      
      expect(fields.moderationStatus).toBe('flagged');
      expect(fields.moderationFlags).toBeDefined();
      expect(fields.moderationCheckedAt).toBeDefined();
      
      const parsedFlags = JSON.parse(fields.moderationFlags);
      expect(parsedFlags.categories.violence).toBe(true);
      expect(parsedFlags.model).toBe('text-moderation-latest');
    });
    
    it('should build fields for approved content', () => {
      const moderationResult = {
        flagged: false,
        categories: {},
        categoryScores: {},
        model: 'text-moderation-latest'
      };
      
      const fields = buildModerationFields(moderationResult);
      
      expect(fields.moderationStatus).toBe('approved');
      expect(fields.moderationFlags).toBeNull();
      expect(fields.moderationCheckedAt).toBeDefined();
    });
    
    it('should handle null moderation result', () => {
      const fields = buildModerationFields(null);
      expect(fields).toEqual({});
    });
  });
  
  describe('moderateAndSave', () => {
    it('should combine item with moderation fields', async () => {
      mockGraphql.mockResolvedValue({
        data: {
          moderateContent: {
            flagged: false,
            categories: {},
            categoryScores: {},
            model: 'text-moderation-latest',
            error: null
          }
        }
      });
      
      const mockModel = { name: 'Unit' };
      const mockItem = {
        id: 'unit-123',
        name: 'Test Unit',
        data: JSON.stringify({ root: { children: [] } })
      };
      
      const result = await moderateAndSave(mockModel, mockItem, mockItem.data);
      
      expect(result.id).toBe('unit-123');
      expect(result.name).toBe('Test Unit');
      expect(result.moderationStatus).toBe('approved');
      expect(result.moderationCheckedAt).toBeDefined();
    });
    
    it('should log warning for flagged content', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
      
      mockGraphql.mockResolvedValue({
        data: {
          moderateContent: {
            flagged: true,
            categories: { hate: true },
            categoryScores: { hate: 0.98 },
            model: 'text-moderation-latest',
            error: null
          }
        }
      });
      
      const mockModel = { name: 'Grade' };
      const mockItem = {
        id: 'grade-456',
        data: JSON.stringify({ 'block-1': { userAnswer: 'Inappropriate answer' } })
      };
      
      await moderateAndSave(mockModel, mockItem, mockItem.data);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Content flagged by moderation:',
        expect.objectContaining({
          categories: expect.objectContaining({ hate: true }),
          itemId: 'grade-456',
          modelName: 'Grade'
        })
      );
      
      consoleWarnSpy.mockRestore();
    });
  });
  
  describe('getModerationStatus', () => {
    it('should return "Not checked" for unchecked items', () => {
      const item = {
        id: 'unit-1',
        moderationCheckedAt: null
      };
      
      expect(getModerationStatus(item)).toBe('Not checked');
    });
    
    it('should return "Approved" for approved items', () => {
      const item = {
        id: 'unit-2',
        moderationStatus: 'approved',
        moderationCheckedAt: new Date().toISOString()
      };
      
      expect(getModerationStatus(item)).toBe('Approved');
    });
    
    it('should return flagged categories for flagged items', () => {
      const item = {
        id: 'unit-3',
        moderationStatus: 'flagged',
        moderationFlags: JSON.stringify({
          categories: {
            violence: true,
            hate: true,
            sexual: false
          }
        }),
        moderationCheckedAt: new Date().toISOString()
      };
      
      const status = getModerationStatus(item);
      expect(status).toContain('violence');
      expect(status).toContain('hate');
      expect(status).not.toContain('sexual');
    });
    
    it('should handle invalid JSON in moderation flags', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
      
      const item = {
        id: 'unit-4',
        moderationStatus: 'flagged',
        moderationFlags: 'invalid json',
        moderationCheckedAt: new Date().toISOString()
      };
      
      expect(getModerationStatus(item)).toBe('Flagged for review');
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('shouldShowModerationWarning', () => {
    it('should return true for flagged items', () => {
      const item = { moderationStatus: 'flagged' };
      expect(shouldShowModerationWarning(item)).toBe(true);
    });
    
    it('should return false for approved items', () => {
      const item = { moderationStatus: 'approved' };
      expect(shouldShowModerationWarning(item)).toBe(false);
    });
    
    it('should return false for unchecked items', () => {
      const item = { moderationStatus: null };
      expect(shouldShowModerationWarning(item)).toBe(false);
    });
  });
});
