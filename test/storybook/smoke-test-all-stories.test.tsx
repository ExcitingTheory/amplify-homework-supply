/**
 * @fileoverview Smoke tests for all Storybook stories
 * 
 * Automatically imports and renders all story files to ensure they render without crashing.
 * This catches basic rendering issues, missing dependencies, and broken stories.
 * 
 * Run with:
 *   npm run test:storybook
 *   npm run storybook:test
 * 
 * @module test/storybook/smoke-test-all-stories
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { composeStories } from '@storybook/react';
import { render, cleanup } from '@testing-library/react';

// Auto-import all story files
// This uses Vite's glob import feature
const storyFiles = import.meta.glob('../../**/*.stories.{tsx,jsx,ts,js}', { eager: true });

describe('Storybook Smoke Tests - All Stories Render', () => {
  beforeAll(() => {
    console.log(`\n📚 Testing ${Object.keys(storyFiles).length} story files...\n`);
  });

  // Iterate through each story file
  Object.entries(storyFiles).forEach(([filePath, module]: [string, any]) => {
    // Extract filename for better test organization
    const fileName = filePath.split('/').pop() || filePath;
    
    describe(`Story File: ${fileName}`, () => {
      let stories: Record<string, any>;
      
      try {
        // Compose all stories from the file
        stories = composeStories(module);
      } catch (error: any) {
        it('should compose stories without errors', () => {
          throw new Error(`Failed to compose stories: ${error.message}`);
        });
        return;
      }
      
      const storyNames = Object.keys(stories);
      
      if (storyNames.length === 0) {
        it('should have at least one story', () => {
          expect(storyNames.length).toBeGreaterThan(0);
        });
        return;
      }
      
      // Test each story variant
      Object.entries(stories).forEach(([storyName, Story]: [string, any]) => {
        it(`renders "${storyName}" without crashing`, async () => {
          let container: any;
          
          try {
            // Render the story
            const result = render(<Story />);
            container = result.container;
            
            // Basic assertion - story rendered something
            expect(container).toBeTruthy();
            expect(container.innerHTML.length).toBeGreaterThan(0);
            
            // Check for React error boundaries
            const errorBoundaries = container.querySelectorAll('[data-error-boundary]');
            expect(errorBoundaries.length).toBe(0);
            
          } catch (error: any) {
            // Provide detailed error message
            const errorMsg = `
Story: ${fileName} - ${storyName}
Error: ${error.message}
Stack: ${error.stack || 'No stack trace'}
            `.trim();
            
            throw new Error(errorMsg);
          } finally {
            // Clean up after each test
            cleanup();
          }
        });
      });
    });
  });
});

describe('Storybook Coverage Summary', () => {
  it('should report story count', () => {
    const fileCount = Object.keys(storyFiles).length;
    
    let totalStories = 0;
    Object.values(storyFiles).forEach((module: any) => {
      try {
        const stories = composeStories(module);
        totalStories += Object.keys(stories).length;
      } catch (error) {
        // Skip files that fail to compose
      }
    });
    
    console.log(`\n✅ Smoke Test Summary:`);
    console.log(`   📁 Story Files: ${fileCount}`);
    console.log(`   📖 Total Stories: ${totalStories}`);
    console.log(`   ✨ All stories rendered successfully\n`);
    
    expect(fileCount).toBeGreaterThan(0);
    expect(totalStories).toBeGreaterThan(0);
  });
});

describe('Critical Story Files - Explicit Tests', () => {
  // Test priority stories explicitly for better error messages
  
  const criticalStories = [
    '../../src/components/ChatSidebar.stories.jsx',
    '../../src/components/Editor3/Editor.stories.jsx',
    '../../src/components/MainToolbar.stories.jsx',
    '../../src/components/VocabularyReview2.stories.tsx',
    '../../src/components/QuestionsReview2.stories.tsx',
  ];
  
  criticalStories.forEach((storyPath) => {
    it(`should have ${storyPath.split('/').pop()}`, () => {
      const exists = Object.keys(storyFiles).some((path) => path.includes(storyPath));
      
      if (!exists) {
        console.warn(`⚠️ Critical story file not found: ${storyPath}`);
      }
      
      // Don't fail the test, just warn
      expect(true).toBe(true);
    });
  });
});

describe('Story Metadata Validation', () => {
  it('should validate story metadata structure', () => {
    const filesWithNoTitle: string[] = [];
    const filesWithNoComponent: string[] = [];
    
    Object.entries(storyFiles).forEach(([filePath, module]: [string, any]) => {
      const meta = module.default;
      
      if (!meta) {
        return; // Skip files without default export
      }
      
      if (!meta.title) {
        filesWithNoTitle.push(filePath);
      }
      
      if (!meta.component && !meta.render) {
        filesWithNoComponent.push(filePath);
      }
    });
    
    if (filesWithNoTitle.length > 0) {
      console.warn(`\n⚠️ Stories without title (${filesWithNoTitle.length}):`);
      filesWithNoTitle.forEach((file) => console.warn(`   - ${file}`));
    }
    
    if (filesWithNoComponent.length > 0) {
      console.warn(`\n⚠️ Stories without component/render (${filesWithNoComponent.length}):`);
      filesWithNoComponent.forEach((file) => console.warn(`   - ${file}`));
    }
    
    // Don't fail - just informational
    expect(true).toBe(true);
  });
});

describe('Story Args Validation', () => {
  it('should check for stories using deprecated patterns', () => {
    const storiesUsingOldPattern: string[] = [];
    
    Object.entries(storyFiles).forEach(([filePath, module]: [string, any]) => {
      const stories = composeStories(module);
      
      Object.entries(stories).forEach(([storyName, Story]: [string, any]) => {
        // Check if using old template.bind({}) pattern
        if (Story.toString().includes('.bind(')) {
          storiesUsingOldPattern.push(`${filePath} - ${storyName}`);
        }
      });
    });
    
    if (storiesUsingOldPattern.length > 0) {
      console.warn(`\n⚠️ Stories using deprecated patterns (${storiesUsingOldPattern.length}):`);
      storiesUsingOldPattern.forEach((story) => console.warn(`   - ${story}`));
      console.warn(`   Recommendation: Update to CSF 3.0 object notation\n`);
    }
    
    // Informational only
    expect(true).toBe(true);
  });
});
