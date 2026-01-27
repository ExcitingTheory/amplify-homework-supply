/**
 * Mock Data Validator Tests
 * 
 * Unit tests for the mock data validation agent skill.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { executeSkill } from './mock-data-validator';

// Test fixtures directory
const FIXTURES_DIR = path.join(__dirname, '__fixtures__');

// Helper to create test files
function createTestComponent(filename: string, content: string): string {
  const filepath = path.join(FIXTURES_DIR, filename);
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  fs.writeFileSync(filepath, content, 'utf8');
  return filepath;
}

function createTestMockData(filename: string, content: string): string {
  const filepath = path.join(FIXTURES_DIR, filename);
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  fs.writeFileSync(filepath, content, 'utf8');
  return filepath;
}

describe('Mock Data Validator', () => {
  beforeEach(() => {
    // Create fixtures directory
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  });

  afterEach(() => {
    // Clean up fixtures
    if (fs.existsSync(FIXTURES_DIR)) {
      fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }
  });

  describe('TypeScript Interface Extraction', () => {
    it('should extract props from TypeScript interface', async () => {
      const componentPath = createTestComponent('Component.tsx', `
        interface ComponentProps {
          name: string;
          age: number;
          isActive: boolean;
        }
        
        export const Component = (props: ComponentProps) => null;
      `);

      const mockPath = createTestMockData('mock.json', JSON.stringify({
        name: 'Test',
        age: 25,
        isActive: true
      }));

      const result = await executeSkill({ componentPath, mockDataPath: mockPath });

      expect(result.valid).toBe(true);
      expect(result.componentProps).toEqual({
        name: 'string',
        age: 'number',
        isActive: 'boolean'
      });
    });

    it('should extract props from type alias', async () => {
      const componentPath = createTestComponent('Component.tsx', `
        type ComponentProps = {
          title: string;
          count: number;
        };
        
        export const Component = (props: ComponentProps) => null;
      `);

      const mockPath = createTestMockData('mock.json', JSON.stringify({
        title: 'Test Title',
        count: 5
      }));

      const result = await executeSkill({ componentPath, mockDataPath: mockPath });

      expect(result.valid).toBe(true);
      expect(result.componentProps).toEqual({
        title: 'string',
        count: 'number'
      });
    });

    it('should handle optional props', async () => {
      const componentPath = createTestComponent('Component.tsx', `
        interface ComponentProps {
          required: string;
          optional?: number;
        }
        
        export const Component = (props: ComponentProps) => null;
      `);

      const mockPath = createTestMockData('mock.json', JSON.stringify({
        required: 'Test'
        // optional is missing
      }));

      const result = await executeSkill({ componentPath, mockDataPath: mockPath });

      expect(result.valid).toBe(true); // Should pass because optional field can be missing
      expect(result.componentProps).toEqual({
        required: 'string',
        optional: 'number | undefined'
      });
    });
  });

  describe('JavaScript JSDoc Extraction', () => {
    it('should extract props from JSDoc comments', async () => {
      const componentPath = createTestComponent('Component.js', `
        /**
         * @param {string} name
         * @param {number} age
         */
        export const Component = ({ name, age }) => null;
      `);

      const mockPath = createTestMockData('mock.json', JSON.stringify({
        name: 'Test',
        age: 25
      }));

      const result = await executeSkill({ componentPath, mockDataPath: mockPath });

      expect(result.valid).toBe(true);
      expect(result.componentProps).toEqual({
        name: 'string',
        age: 'number'
      });
    });
  });

  describe('Type Mismatch Detection', () => {
    it('should detect string/number mismatch', async () => {
      const componentPath = createTestComponent('Component.tsx', `
        interface ComponentProps {
          id: string;
        }
        export const Component = (props: ComponentProps) => null;
      `);

      const mockPath = createTestMockData('mock.json', JSON.stringify({
        id: 123 // Should be string
      }));

      const result = await executeSkill({ componentPath, mockDataPath: mockPath });

      expect(result.valid).toBe(false);
      expect(result.mismatches).toHaveLength(1);
      expect(result.mismatches[0]).toMatchObject({
        field: 'id',
        expected: 'string',
        actual: 'number',
        severity: 'error'
      });
    });

    it('should detect missing required fields', async () => {
      const componentPath = createTestComponent('Component.tsx', `
        interface ComponentProps {
          required: string;
        }
        export const Component = (props: ComponentProps) => null;
      `);

      const mockPath = createTestMockData('mock.json', JSON.stringify({
        // required field is missing
      }));

      const result = await executeSkill({ componentPath, mockDataPath: mockPath });

      expect(result.valid).toBe(false);
      expect(result.mismatches).toHaveLength(1);
      expect(result.mismatches[0]).toMatchObject({
        field: 'required',
        expected: 'string',
        actual: 'missing',
        severity: 'error'
      });
    });

    it('should detect array type mismatches', async () => {
      const componentPath = createTestComponent('Component.tsx', `
        interface ComponentProps {
          items: string[];
        }
        export const Component = (props: ComponentProps) => null;
      `);

      const mockPath = createTestMockData('mock.json', JSON.stringify({
        items: 'not an array'
      }));

      const result = await executeSkill({ componentPath, mockDataPath: mockPath });

      expect(result.valid).toBe(false);
      expect(result.mismatches).toHaveLength(1);
      expect(result.mismatches[0]).toMatchObject({
        field: 'items',
        severity: 'error'
      });
    });
  });

  describe('Mock Data Loading', () => {
    it('should load JSON mock data', async () => {
      const componentPath = createTestComponent('Component.tsx', `
        interface ComponentProps { name: string; }
        export const Component = (props: ComponentProps) => null;
      `);

      const mockPath = createTestMockData('mock.json', JSON.stringify({ name: 'Test' }));

      const result = await executeSkill({ componentPath, mockDataPath: mockPath });

      expect(result.valid).toBe(true);
    });

    it('should handle invalid JSON gracefully', async () => {
      const componentPath = createTestComponent('Component.tsx', `
        interface ComponentProps { name: string; }
        export const Component = (props: ComponentProps) => null;
      `);

      const mockPath = createTestMockData('mock.json', '{ invalid json }');

      const result = await executeSkill({ componentPath, mockDataPath: mockPath });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.summary).toContain('Failed to load mock data');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing component file', async () => {
      const result = await executeSkill({
        componentPath: '/nonexistent/Component.tsx',
        mockDataPath: '/nonexistent/mock.json'
      });

      expect(result.valid).toBe(false);
      expect(result.summary).toContain('Component file not found');
    });

    it('should handle missing mock data file', async () => {
      const componentPath = createTestComponent('Component.tsx', `
        interface ComponentProps { name: string; }
        export const Component = (props: ComponentProps) => null;
      `);

      const result = await executeSkill({
        componentPath,
        mockDataPath: '/nonexistent/mock.json'
      });

      expect(result.valid).toBe(false);
      expect(result.summary).toContain('Mock data file not found');
    });

    it('should handle component with no extractable props', async () => {
      const componentPath = createTestComponent('Component.tsx', `
        // No interface, no JSDoc
        export const Component = (props: any) => null;
      `);

      const mockPath = createTestMockData('mock.json', JSON.stringify({ name: 'Test' }));

      const result = await executeSkill({ componentPath, mockDataPath: mockPath });

      expect(result.valid).toBe(false);
      expect(result.summary).toContain('Could not extract props interface');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should validate ChatSidebar-like message structure', async () => {
      const componentPath = createTestComponent('ChatSidebar.tsx', `
        interface Message {
          id: string;
          role: 'user' | 'assistant';
          parts: Array<{
            type: string;
            text?: string;
          }>;
        }
        
        interface ChatSidebarProps {
          messages: Message[];
          onSend: (text: string) => void;
        }
        
        export const ChatSidebar = (props: ChatSidebarProps) => null;
      `);

      const mockPath = createTestMockData('chat-messages.json', JSON.stringify({
        messages: [
          {
            id: '1',
            role: 'user',
            parts: [
              { type: 'text', text: 'Hello' }
            ]
          }
        ],
        onSend: null // Function in JSON is tricky, but we allow null
      }));

      const result = await executeSkill({ componentPath, mockDataPath: mockPath });

      // Should pass at top level (messages is an array, onSend exists)
      // Nested validation would need deeper implementation
      expect(result.valid).toBe(true);
    });
  });

  describe('Summary Generation', () => {
    it('should generate success summary', async () => {
      const componentPath = createTestComponent('Component.tsx', `
        interface ComponentProps { name: string; }
        export const Component = (props: ComponentProps) => null;
      `);

      const mockPath = createTestMockData('mock.json', JSON.stringify({ name: 'Test' }));

      const result = await executeSkill({ componentPath, mockDataPath: mockPath });

      expect(result.summary).toContain('✅');
      expect(result.summary).toContain('Mock data validation passed');
    });

    it('should generate failure summary with counts', async () => {
      const componentPath = createTestComponent('Component.tsx', `
        interface ComponentProps {
          field1: string;
          field2: number;
        }
        export const Component = (props: ComponentProps) => null;
      `);

      const mockPath = createTestMockData('mock.json', JSON.stringify({
        field1: 123, // Wrong type
        // field2 missing
      }));

      const result = await executeSkill({ componentPath, mockDataPath: mockPath });

      expect(result.summary).toContain('❌');
      expect(result.summary).toContain('2 errors');
    });
  });
});
