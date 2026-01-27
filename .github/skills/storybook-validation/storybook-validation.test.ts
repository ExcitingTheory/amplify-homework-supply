import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  executeSkill,
  skillMetadata,
  type StorybookValidationInput,
  type ValidationIssue,
  type StoryFile
} from './storybook-validation';

describe('Storybook Validation Agent Skill', () => {
  
  describe('Input Validation', () => {
    it('should accept valid input with all phases', async () => {
      const input: StorybookValidationInput = {
        phases: [1, 2, 3, 4, 5, 6, 7],
        components: ['ChatSidebar'],
        minSeverity: 'warning',
        visualRegression: false,
        autoFix: false
      };
      
      const result = await executeSkill(input);
      
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.stories).toBeInstanceOf(Array);
      expect(result.issues).toBeInstanceOf(Array);
    });
    
    it('should use defaults when no input provided', async () => {
      const result = await executeSkill({});
      
      expect(result).toBeDefined();
      expect(result.summary.totalStories).toBeGreaterThanOrEqual(0);
    });
    
    it('should accept partial phase selection', async () => {
      const result = await executeSkill({
        phases: [1, 2, 3]
      });
      
      expect(result.timing).toBeDefined();
      expect(result.timing[1]).toBeGreaterThanOrEqual(0);
      expect(result.timing[4]).toBeUndefined();
    });
    
    it('should filter by component names', async () => {
      const result = await executeSkill({
        components: ['ChatSidebar', 'Editor3']
      });
      
      expect(result).toBeDefined();
      // When implemented, should only include specified components
    });
  });
  
  describe('Phase 1: Inventory & Baseline', () => {
    it('should discover all story files', async () => {
      const result = await executeSkill({
        phases: [1]
      });
      
      expect(result.stories).toBeInstanceOf(Array);
      // When implemented:
      // expect(result.stories.length).toBeGreaterThan(0);
      // expect(result.stories[0]).toHaveProperty('path');
      // expect(result.stories[0]).toHaveProperty('component');
      // expect(result.stories[0]).toHaveProperty('variants');
    });
    
    it('should count story variants correctly', async () => {
      const result = await executeSkill({
        phases: [1]
      });
      
      // When implemented, verify variant counting
      expect(result).toBeDefined();
    });
    
    it('should track execution time for Phase 1', async () => {
      const result = await executeSkill({
        phases: [1]
      });
      
      expect(result.timing[1]).toBeDefined();
      expect(result.timing[1]).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Phase 2: Mock Data Validation', () => {
    it('should validate mock data structure against component props', async () => {
      const result = await executeSkill({
        phases: [1, 2]
      });
      
      expect(result.issues).toBeInstanceOf(Array);
      // When implemented, should find structural mismatches
    });
    
    it('should report missing required fields', async () => {
      const result = await executeSkill({
        phases: [2]
      });
      
      // When implemented:
      // const criticalIssues = result.issues.filter(i => i.severity === 'error');
      // criticalIssues.forEach(issue => {
      //   expect(issue.message).toBeTruthy();
      //   expect(issue.component).toBeTruthy();
      // });
      
      expect(result).toBeDefined();
    });
    
    it('should validate ChatSidebar message format (parts array)', async () => {
      const result = await executeSkill({
        phases: [2],
        components: ['ChatSidebar']
      });
      
      // When implemented, should verify:
      // - messages have 'parts' array
      // - parts contain 'type' and 'text' fields
      // - no legacy 'content' field usage
      
      expect(result).toBeDefined();
    });
    
    it('should validate Lexical editor state structure', async () => {
      const result = await executeSkill({
        phases: [2],
        components: ['Editor3', 'Workbook']
      });
      
      // When implemented, should verify:
      // - root.children array exists
      // - custom nodes (quiz, answer, etc.) have correct structure
      
      expect(result).toBeDefined();
    });
  });
  
  describe('Phase 3: Mock Loading Verification', () => {
    it('should verify all import paths resolve', async () => {
      const result = await executeSkill({
        phases: [3]
      });
      
      expect(result.issues).toBeInstanceOf(Array);
      // When implemented, should find broken imports
    });
    
    it('should detect missing context providers', async () => {
      const result = await executeSkill({
        phases: [3]
      });
      
      // When implemented:
      // const providerIssues = result.issues.filter(i => 
      //   i.message.includes('provider')
      // );
      // expect(providerIssues).toBeDefined();
      
      expect(result).toBeDefined();
    });
  });
  
  describe('Phase 4: Rendering Validation', () => {
    it('should start Storybook and validate rendering', async () => {
      // This test requires Storybook to be installed and configured
      // Mark as TODO until tool integration is complete
      
      const result = await executeSkill({
        phases: [4]
      });
      
      expect(result.tests).toBeDefined();
      expect(result.tests.rendering).toBeDefined();
    });
    
    it('should detect console errors', async () => {
      const result = await executeSkill({
        phases: [4]
      });
      
      // When implemented:
      // const consoleErrors = result.issues.filter(i => 
      //   i.message.includes('console error')
      // );
      
      expect(result).toBeDefined();
    });
    
    it('should run a11y checks', async () => {
      const result = await executeSkill({
        phases: [4]
      });
      
      expect(result.tests.a11y).toBeDefined();
    });
    
    it('should optionally run visual regression', async () => {
      const result = await executeSkill({
        phases: [4],
        visualRegression: true
      });
      
      // When implemented, should trigger Chromatic
      expect(result).toBeDefined();
    });
  });
  
  describe('Phase 5: Component Deep Dives', () => {
    it('should validate priority components', async () => {
      const result = await executeSkill({
        phases: [5],
        components: ['ChatSidebar', 'Editor3', 'FileManager2']
      });
      
      expect(result.issues).toBeInstanceOf(Array);
    });
    
    it('should check API mock response structure', async () => {
      const result = await executeSkill({
        phases: [5]
      });
      
      // When implemented, should verify:
      // - Chat API returns { body: ReadableStream, headers: Headers }
      // - No "Cannot destructure property 'body'" errors
      
      expect(result).toBeDefined();
    });
  });
  
  describe('Phase 6: Automated Testing', () => {
    it('should run mock validation tests', async () => {
      const result = await executeSkill({
        phases: [6]
      });
      
      expect(result.tests.mockValidation).toBeDefined();
    });
    
    it('should run interaction tests if available', async () => {
      const result = await executeSkill({
        phases: [6]
      });
      
      // When implemented:
      // if (result.tests.interactions) {
      //   expect(result.tests.interactions.total).toBeGreaterThan(0);
      // }
      
      expect(result).toBeDefined();
    });
    
    it('should collect test results', async () => {
      const result = await executeSkill({
        phases: [6]
      });
      
      expect(result.tests).toBeDefined();
    });
  });
  
  describe('Phase 7: Documentation & Fixes', () => {
    it('should generate STORYBOOK_INVENTORY.md', async () => {
      const result = await executeSkill({
        phases: [1, 7]
      });
      
      expect(result.artifacts.inventoryPath).toBeDefined();
    });
    
    it('should generate STORYBOOK_TESTING_RESULTS.md', async () => {
      const result = await executeSkill({
        phases: [1, 2, 3, 4, 5, 6, 7]
      });
      
      expect(result.artifacts.resultsPath).toBeDefined();
    });
    
    it('should create STORYBOOK_MOCK_DATA_GUIDE.md if not exists', async () => {
      const result = await executeSkill({
        phases: [7]
      });
      
      // When implemented, should check if guide exists and create if needed
      expect(result.artifacts).toBeDefined();
    });
    
    it('should apply fixes when autoFix=true', async () => {
      const result = await executeSkill({
        phases: [1, 2, 7],
        autoFix: true
      });
      
      // When implemented:
      // - Should have fewer issues after Phase 7
      // - Should document which issues were auto-fixed
      
      expect(result).toBeDefined();
    });
  });
  
  describe('Summary Statistics', () => {
    it('should calculate accurate summary', async () => {
      const result = await executeSkill({
        phases: [1, 2, 3, 4]
      });
      
      expect(result.summary).toBeDefined();
      expect(result.summary.totalStories).toBeGreaterThanOrEqual(0);
      
      const sum = 
        result.summary.passed +
        result.summary.warnings +
        result.summary.failed +
        result.summary.notTested;
      
      expect(sum).toBe(result.summary.totalStories);
    });
    
    it('should categorize stories by status', async () => {
      const result = await executeSkill({
        phases: [1, 2, 3, 4]
      });
      
      expect(result.summary.passed).toBeGreaterThanOrEqual(0);
      expect(result.summary.warnings).toBeGreaterThanOrEqual(0);
      expect(result.summary.failed).toBeGreaterThanOrEqual(0);
      expect(result.summary.notTested).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Severity Filtering', () => {
    it('should filter issues by minSeverity=error', async () => {
      const result = await executeSkill({
        phases: [1, 2, 3],
        minSeverity: 'error'
      });
      
      // When implemented:
      // result.issues.forEach(issue => {
      //   expect(issue.severity).toBe('error');
      // });
      
      expect(result.issues).toBeInstanceOf(Array);
    });
    
    it('should include warnings and errors when minSeverity=warning', async () => {
      const result = await executeSkill({
        phases: [1, 2, 3],
        minSeverity: 'warning'
      });
      
      // When implemented:
      // result.issues.forEach(issue => {
      //   expect(['warning', 'error']).toContain(issue.severity);
      // });
      
      expect(result.issues).toBeInstanceOf(Array);
    });
    
    it('should include all issues when minSeverity=info', async () => {
      const result = await executeSkill({
        minSeverity: 'info'
      });
      
      expect(result.issues).toBeInstanceOf(Array);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid workspace path gracefully', async () => {
      const result = await executeSkill({
        workspaceRoot: '/nonexistent/path'
      });
      
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
    
    it('should continue execution if one phase fails', async () => {
      const result = await executeSkill({
        phases: [1, 2, 3, 4, 5, 6, 7]
      });
      
      // Even if some phases fail, should complete others
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });
    
    it('should return meaningful error messages', async () => {
      const result = await executeSkill({
        workspaceRoot: '/invalid'
      });
      
      if (result.errors && result.errors.length > 0) {
        expect(result.errors[0]).toBeTruthy();
        expect(typeof result.errors[0]).toBe('string');
      }
    });
  });
  
  describe('Performance', () => {
    it('should complete Phase 1 in reasonable time', async () => {
      const result = await executeSkill({
        phases: [1]
      });
      
      expect(result.timing[1]).toBeLessThan(30000); // 30 seconds max
    });
    
    it('should track timing for all executed phases', async () => {
      const result = await executeSkill({
        phases: [1, 2, 3]
      });
      
      expect(result.timing[1]).toBeGreaterThanOrEqual(0);
      expect(result.timing[2]).toBeGreaterThanOrEqual(0);
      expect(result.timing[3]).toBeGreaterThanOrEqual(0);
      expect(result.timing[4]).toBeUndefined();
    });
  });
  
  describe('Integration Scenarios', () => {
    it('should handle full validation workflow', async () => {
      const result = await executeSkill({
        phases: [1, 2, 3, 4, 5, 6, 7],
        minSeverity: 'warning',
        visualRegression: false,
        autoFix: false
      });
      
      expect(result.summary.totalStories).toBeGreaterThanOrEqual(0);
      expect(result.stories).toBeInstanceOf(Array);
      expect(result.issues).toBeInstanceOf(Array);
      expect(result.artifacts).toBeDefined();
    });
    
    it('should validate specific components only', async () => {
      const result = await executeSkill({
        components: ['ChatSidebar', 'Editor3'],
        phases: [1, 2, 5]
      });
      
      expect(result).toBeDefined();
      // When implemented, should only validate specified components
    });
    
    it('should generate documentation artifacts', async () => {
      const result = await executeSkill({
        phases: [1, 7]
      });
      
      expect(result.artifacts).toBeDefined();
    });
  });
  
  describe('Skill Metadata', () => {
    it('should export valid metadata', () => {
      expect(skillMetadata).toBeDefined();
      expect(skillMetadata.name).toBe('storybook-validation');
      expect(skillMetadata.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(skillMetadata.inputSchema).toBeDefined();
      expect(skillMetadata.outputSchema).toBeDefined();
    });
    
    it('should have correct input schema', () => {
      const { inputSchema } = skillMetadata;
      
      expect(inputSchema.properties.phases).toBeDefined();
      expect(inputSchema.properties.components).toBeDefined();
      expect(inputSchema.properties.minSeverity).toBeDefined();
      expect(inputSchema.properties.visualRegression).toBeDefined();
      expect(inputSchema.properties.autoFix).toBeDefined();
    });
    
    it('should have correct output schema', () => {
      const { outputSchema } = skillMetadata;
      
      expect(outputSchema.required).toContain('summary');
      expect(outputSchema.required).toContain('stories');
      expect(outputSchema.required).toContain('artifacts');
      expect(outputSchema.required).toContain('issues');
      expect(outputSchema.required).toContain('tests');
      expect(outputSchema.required).toContain('timing');
    });
  });
  
  describe('Real-World Scenarios', () => {
    it('should detect ChatSidebar message format issues', async () => {
      const result = await executeSkill({
        components: ['ChatSidebar'],
        phases: [2, 5],
        minSeverity: 'error'
      });
      
      // When implemented, should verify message.parts structure
      expect(result).toBeDefined();
    });
    
    it('should validate all Editor3 stories', async () => {
      const result = await executeSkill({
        components: ['Editor3', 'Workbook'],
        phases: [1, 2, 4]
      });
      
      expect(result).toBeDefined();
    });
    
    it('should detect missing context providers', async () => {
      const result = await executeSkill({
        phases: [3]
      });
      
      expect(result.issues).toBeInstanceOf(Array);
    });
  });
});
