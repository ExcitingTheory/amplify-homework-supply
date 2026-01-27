/**
 * Component Versioning Agent Skill Tests
 * 
 * Tests for the component versioning automation skill that creates
 * versioned component copies with updated imports and exports.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { executeSkill, skillMetadata } from '../../src/agent-skills/component-versioning';

describe('Component Versioning Agent Skill', () => {
  const testDir = path.join(__dirname, '__test-fixtures__', 'component-versioning');
  const testComponentPath = path.join(testDir, 'TestComponent.jsx');
  const testComponent2Path = path.join(testDir, 'TestComponent2.tsx');
  const checklistPath = path.join(testDir, '../../docs', 'COMPONENT_VERSIONING_CHECKLIST_TestComponent.md');

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create a test component file
    const testComponentContent = `import React from 'react';
import { useState } from 'react';
import TestComponent from './TestComponent';

interface TestComponentProps {
  message: string;
}

const TestComponent: React.FC<TestComponentProps> = ({ message }) => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>{message}</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};

TestComponent.displayName = "TestComponent";

export default TestComponent;
`;

    fs.writeFileSync(testComponentPath, testComponentContent, 'utf8');
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testComponent2Path)) {
      fs.unlinkSync(testComponent2Path);
    }
    if (fs.existsSync(checklistPath)) {
      fs.unlinkSync(checklistPath);
    }
    // Note: Leave test component for inspection, or uncomment to clean fully
    // if (fs.existsSync(testComponentPath)) {
    //   fs.unlinkSync(testComponentPath);
    // }
  });

  describe('Happy Path Tests', () => {
    it('should create Component2 from Component with auto-detected version', async () => {
      const result = await executeSkill({
        componentPath: testComponentPath
      });

      expect(result.errors).toBeUndefined();
      expect(result.version).toBe(2);
      expect(result.newComponentPath).toBe(testComponent2Path);
      expect(fs.existsSync(testComponent2Path)).toBe(true);
      expect(fs.existsSync(result.checklistPath)).toBe(true);
      expect(result.summary).toContain('Created TestComponent2 from TestComponent');
    });

    it('should update imports to reference new component name', async () => {
      const result = await executeSkill({
        componentPath: testComponentPath
      });

      const newContent = fs.readFileSync(testComponent2Path, 'utf8');
      expect(newContent).toContain('import TestComponent2 from \'./TestComponent2\'');
      expect(newContent).not.toContain('import TestComponent from \'./TestComponent\'');
      expect(result.updatedImports.length).toBeGreaterThan(0);
    });

    it('should update exports to new component name', async () => {
      const result = await executeSkill({
        componentPath: testComponentPath
      });

      const newContent = fs.readFileSync(testComponent2Path, 'utf8');
      expect(newContent).toContain('export default TestComponent2');
      expect(newContent).toContain('TestComponent2.displayName = "TestComponent2"');
      expect(result.updatedExports.length).toBeGreaterThan(0);
    });

    it('should generate feature parity checklist', async () => {
      const result = await executeSkill({
        componentPath: testComponentPath
      });

      const checklistContent = fs.readFileSync(result.checklistPath, 'utf8');
      expect(checklistContent).toContain('# Component Versioning Checklist: TestComponent → TestComponent2');
      expect(checklistContent).toContain('## Features to Maintain');
      expect(checklistContent).toContain('## Features to Improve');
      expect(checklistContent).toContain('## Migration Notes');
    });

    it('should use explicit target version when provided', async () => {
      const result = await executeSkill({
        componentPath: testComponentPath,
        targetVersion: 3
      });

      expect(result.version).toBe(3);
      expect(result.newComponentPath).toContain('TestComponent3.tsx');
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle component file not found', async () => {
      const result = await executeSkill({
        componentPath: '/nonexistent/path/Component.jsx'
      });

      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Component file not found');
    });

    it('should error when target component already exists', async () => {
      // Create Component2 first
      await executeSkill({ componentPath: testComponentPath });

      // Try to create it again
      const result = await executeSkill({ componentPath: testComponentPath });

      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Target component already exists');
    });

    it('should reject invalid target version (< 2)', async () => {
      const result = await executeSkill({
        componentPath: testComponentPath,
        targetVersion: 1
      });

      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Invalid target version');
    });

    it('should handle unsupported file extension', async () => {
      const invalidPath = path.join(testDir, 'Test.txt');
      fs.writeFileSync(invalidPath, 'not a component', 'utf8');

      const result = await executeSkill({
        componentPath: invalidPath
      });

      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Unsupported file extension');

      fs.unlinkSync(invalidPath);
    });

    it('should handle file without exports (not a component)', async () => {
      const notAComponent = path.join(testDir, 'NotAComponent.jsx');
      fs.writeFileSync(notAComponent, 'const foo = "bar";\n', 'utf8');

      const result = await executeSkill({
        componentPath: notAComponent
      });

      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('no export found');

      fs.unlinkSync(notAComponent);
    });
  });

  describe('Skill Metadata', () => {
    it('should have valid skill metadata', () => {
      expect(skillMetadata.name).toBe('component-versioning');
      expect(skillMetadata.description).toBeTruthy();
      expect(skillMetadata.version).toBe('1.0.0');
      expect(skillMetadata.inputSchema).toBeDefined();
      expect(skillMetadata.outputSchema).toBeDefined();
    });

    it('should have correct required input fields', () => {
      expect(skillMetadata.inputSchema.required).toContain('componentPath');
    });

    it('should have correct required output fields', () => {
      expect(skillMetadata.outputSchema.required).toContain('newComponentPath');
      expect(skillMetadata.outputSchema.required).toContain('version');
      expect(skillMetadata.outputSchema.required).toContain('summary');
    });
  });
});
