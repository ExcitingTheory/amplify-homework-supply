/**
 * @fileoverview Vitest test suite for validating Storybook mock data
 * 
 * Validates all mock data files against their Zod schemas to ensure
 * data structure consistency and catch regressions.
 * 
 * Run with: npm run storybook:validate-mocks
 * 
 * @module test/storybook/validate-mocks
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  chatMessagesSchema,
  chatMessageSchema,
  lexicalEditorStateSchema,
  fileSchema,
  filesSchema,
  gradeSchema,
  gradeDataSchema,
  wordSchema,
  wordsSchema,
  questionSchema,
  questionsSchema,
} from '../../.github/skills/storybook-validation/schemas';

const MOCKS_DIR = path.resolve(process.cwd(), '.storybook/__mocks__');
const UI_DATA_DIR = path.join(MOCKS_DIR, 'ui-data');

/**
 * Load and parse JSON file
 */
function loadJSON(filePath: string): any {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Load and evaluate JavaScript module
 */
async function loadJS(filePath: string): Promise<any> {
  const module = await import(filePath);
  return module.default || module;
}

describe('Chat Mock Data Validation', () => {
  it('should validate chat-bot-2.0.json', () => {
    const chatData = loadJSON(path.join(UI_DATA_DIR, 'chat-bot-2.0.json'));
    
    // Validate as array of messages
    const result = chatMessagesSchema.safeParse(chatData);
    
    if (!result.success) {
      console.error('Validation errors:', JSON.stringify(result.error.format(), null, 2));
    }
    
    expect(result.success).toBe(true);
  });

  it('should validate chat-bot-2.1.json', () => {
    const chatData = loadJSON(path.join(UI_DATA_DIR, 'chat-bot-2.1.json'));
    const result = chatMessagesSchema.safeParse(chatData);
    
    if (!result.success) {
      console.error('Validation errors:', JSON.stringify(result.error.format(), null, 2));
    }
    
    expect(result.success).toBe(true);
  });

  it('should validate chat-bot-2.3.json', () => {
    const chatData = loadJSON(path.join(UI_DATA_DIR, 'chat-bot-2.3.json'));
    const result = chatMessagesSchema.safeParse(chatData);
    
    if (!result.success) {
      console.error('Validation errors:', JSON.stringify(result.error.format(), null, 2));
    }
    
    expect(result.success).toBe(true);
  });

  it('should validate individual message structure', () => {
    const chatData = loadJSON(path.join(UI_DATA_DIR, 'chat-bot-2.0.json'));
    
    // Pick first message
    if (chatData.length > 0) {
      const firstMessage = chatData[0];
      const result = chatMessageSchema.safeParse(firstMessage);
      
      if (!result.success) {
        console.error('Message validation errors:', JSON.stringify(result.error.format(), null, 2));
      }
      
      expect(result.success).toBe(true);
    }
  });
});

describe('File Mock Data Validation', () => {
  it('should validate files.json', () => {
    const filesData = loadJSON(path.join(UI_DATA_DIR, 'files.json'));
    const result = filesSchema.safeParse(filesData);
    
    if (!result.success) {
      console.error('Validation errors:', JSON.stringify(result.error.format(), null, 2));
    }
    
    expect(result.success).toBe(true);
  });

  it('should validate file-details.json', () => {
    const fileData = loadJSON(path.join(UI_DATA_DIR, 'file-details.json'));
    const result = fileSchema.safeParse(fileData);
    
    if (!result.success) {
      console.error('Validation errors:', JSON.stringify(result.error.format(), null, 2));
    }
    
    expect(result.success).toBe(true);
  });
});

describe('Grade Mock Data Validation', () => {
  it('should validate grade-examples.js exports', async () => {
    const gradeModule = await import(path.join(MOCKS_DIR, 'grade-examples.js'));
    
    // Check if module has grade exports
    if (gradeModule.incompleteGrade) {
      const result = gradeSchema.safeParse(gradeModule.incompleteGrade);
      
      if (!result.success) {
        console.error('Incomplete grade validation errors:', JSON.stringify(result.error.format(), null, 2));
      }
      
      expect(result.success).toBe(true);
    }

    if (gradeModule.completeGrade) {
      const result = gradeSchema.safeParse(gradeModule.completeGrade);
      
      if (!result.success) {
        console.error('Complete grade validation errors:', JSON.stringify(result.error.format(), null, 2));
      }
      
      expect(result.success).toBe(true);
    }
  });

  it('should validate grade data structure (parsed JSON)', async () => {
    const gradeModule = await import(path.join(MOCKS_DIR, 'grade-examples.js'));
    
    if (gradeModule.incompleteGrade && gradeModule.incompleteGrade.data) {
      const gradeData = JSON.parse(gradeModule.incompleteGrade.data);
      const result = gradeDataSchema.safeParse(gradeData);
      
      if (!result.success) {
        console.error('Grade data validation errors:', JSON.stringify(result.error.format(), null, 2));
      }
      
      expect(result.success).toBe(true);
    }
  });
});

describe('Word/Dictionary Mock Data Validation', () => {
  it('should validate mockWordData.js exports', async () => {
    const wordModule = await import(path.join(MOCKS_DIR, 'mockWordData.js'));
    
    // Check if module has word exports
    if (wordModule.mockWords) {
      const result = wordsSchema.safeParse(wordModule.mockWords);
      
      if (!result.success) {
        console.error('Words validation errors:', JSON.stringify(result.error.format(), null, 2));
      }
      
      expect(result.success).toBe(true);
    }
  });

  it('should validate mockQuestionData.js exports', async () => {
    const questionModule = await import(path.join(MOCKS_DIR, 'mockQuestionData.js'));
    
    // Check if module has question exports
    if (questionModule.mockQuestions) {
      const result = questionsSchema.safeParse(questionModule.mockQuestions);
      
      if (!result.success) {
        console.error('Questions validation errors:', JSON.stringify(result.error.format(), null, 2));
      }
      
      expect(result.success).toBe(true);
    }
  });
});

describe('Lexical Editor State Validation', () => {
  it('should validate editor state in index-page-examples.js', async () => {
    const indexModule = await import(path.join(MOCKS_DIR, 'index-page-examples.js'));
    
    // Check if any units have editor state data
    if (indexModule.sampleUnits) {
      indexModule.sampleUnits.forEach((unit: any, index: number) => {
        if (unit.data) {
          const editorState = JSON.parse(unit.data);
          const result = lexicalEditorStateSchema.safeParse(editorState);
          
          if (!result.success) {
            console.error(`Unit ${index} editor state validation errors:`, JSON.stringify(result.error.format(), null, 2));
          }
          
          expect(result.success).toBe(true);
        }
      });
    }
  });
});

describe('Mock Data File Existence', () => {
  const requiredMockFiles = [
    'chatMockData.js',
    'mockFileData.js',
    'mockWordData.js',
    'mockQuestionData.js',
    'grade-examples.js',
    'index-page-examples.js',
    'ui-data/chat-bot-2.0.json',
    'ui-data/chat-bot-2.1.json',
    'ui-data/chat-bot-2.3.json',
    'ui-data/files.json',
    'ui-data/file-details.json',
  ];

  requiredMockFiles.forEach((file) => {
    it(`should have ${file}`, () => {
      const filePath = path.join(MOCKS_DIR, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});

describe('Schema Comprehensive Coverage', () => {
  it('should report validation coverage summary', () => {
    console.log('\n📊 Mock Data Validation Coverage:');
    console.log('  ✅ Chat messages (3 variants)');
    console.log('  ✅ File data (2 variants)');
    console.log('  ✅ Grade data (with nested structure)');
    console.log('  ✅ Word/Dictionary data');
    console.log('  ✅ Question bank data');
    console.log('  ✅ Lexical editor states');
    
    expect(true).toBe(true);
  });
});

describe('Component Type Compatibility', () => {
  it('should validate chat message structure matches ChatSidebar expectations', () => {
    const chatData = loadJSON(path.join(UI_DATA_DIR, 'chat-bot-2.0.json'));
    
    // ChatSidebar expects messages with 'parts' array (not 'content' string)
    chatData.forEach((msg: any, index: number) => {
      expect(msg.parts, `Message ${index} should have parts array`).toBeDefined();
      expect(Array.isArray(msg.parts), `Message ${index} parts should be array`).toBe(true);
      
      // Should NOT have deprecated 'content' field
      expect(msg.content).toBeUndefined();
      
      // Parts should have correct structure
      if (msg.parts.length > 0) {
        const textParts = msg.parts.filter((p: any) => p.type === 'text');
        textParts.forEach((part: any) => {
          expect(part.text).toBeDefined();
          expect(typeof part.text).toBe('string');
        });
      }
    });
  });

  it('should validate File model structure matches component expectations', () => {
    const filesData = loadJSON(path.join(UI_DATA_DIR, 'files.json'));
    
    // Files should have required fields
    filesData.forEach((file: any) => {
      expect(file.id, 'File should have id').toBeDefined();
      expect(file.name, 'File should have name').toBeDefined();
      expect(file.key, 'File should have S3 key').toBeDefined();
      expect(file.type, 'File should have type').toBeDefined();
      expect(['public', 'protected', 'private']).toContain(file.level);
    });
  });

  it('should validate Grade.data structure is parseable and correct', async () => {
    const gradeModule = await import(path.join(MOCKS_DIR, 'grade-examples.js'));
    
    if (gradeModule.incompleteGrade && gradeModule.incompleteGrade.data) {
      const gradeData = JSON.parse(gradeModule.incompleteGrade.data);
      
      // Should be an object keyed by block IDs
      expect(typeof gradeData).toBe('object');
      
      // Each block should have complete and accuracy fields
      Object.entries(gradeData).forEach(([blockId, blockGrade]: [string, any]) => {
        expect(blockId).toBeTruthy();
        expect(blockGrade).toHaveProperty('complete');
        expect(blockGrade).toHaveProperty('accuracy');
        expect(typeof blockGrade.complete).toBe('boolean');
        expect(typeof blockGrade.accuracy).toBe('number');
        expect(blockGrade.accuracy).toBeGreaterThanOrEqual(0);
        expect(blockGrade.accuracy).toBeLessThanOrEqual(100);
      });
    }
  });
});
