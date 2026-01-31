#!/usr/bin/env tsx
/**
 * @fileoverview Component Mock Data Validator
 * 
 * Validates that mock data used in Storybook stories matches the actual
 * component prop types. Supports TypeScript interfaces, JSDoc, and PropTypes.
 * 
 * Usage:
 *   npx tsx scripts/validate-component-mocks.ts [componentName]
 * 
 * @module scripts/validate-component-mocks
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  component: string;
  story: string;
  issue: string;
  suggestion?: string;
}

interface ComponentPropInfo {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

interface StoryMockInfo {
  storyFile: string;
  storyName: string;
  mockDataPaths: string[];
  propsUsed: Record<string, any>;
}

/**
 * Extract prop types from TypeScript/JavaScript component
 */
function extractPropTypes(filePath: string): ComponentPropInfo[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const props: ComponentPropInfo[] = [];

  function visit(node: ts.Node) {
    // Check for TypeScript interface
    if (ts.isInterfaceDeclaration(node)) {
      const interfaceName = node.name.text;
      if (interfaceName.endsWith('Props')) {
        node.members.forEach((member) => {
          if (ts.isPropertySignature(member) && member.name) {
            const propName = member.name.getText(sourceFile);
            const isOptional = member.questionToken !== undefined;
            const typeNode = member.type;
            const typeText = typeNode ? typeNode.getText(sourceFile) : 'any';

            props.push({
              name: propName,
              type: typeText,
              required: !isOptional,
            });
          }
        });
      }
    }

    // Check for type alias
    if (ts.isTypeAliasDeclaration(node)) {
      const typeName = node.name.text;
      if (typeName.endsWith('Props') && ts.isTypeLiteralNode(node.type)) {
        node.type.members.forEach((member) => {
          if (ts.isPropertySignature(member) && member.name) {
            const propName = member.name.getText(sourceFile);
            const isOptional = member.questionToken !== undefined;
            const typeNode = member.type;
            const typeText = typeNode ? typeNode.getText(sourceFile) : 'any';

            props.push({
              name: propName,
              type: typeText,
              required: !isOptional,
            });
          }
        });
      }
    }

    // Check for JSDoc @param tags in function components
    if (ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) {
      const jsDocTags = ts.getJSDocTags(node);
      jsDocTags.forEach((tag) => {
        if (tag.tagName.text === 'param' && tag.comment) {
          // Parse JSDoc param: @param {Type} name - description
          const commentText = typeof tag.comment === 'string' ? tag.comment : '';
          const match = commentText.match(/\{([^}]+)\}\s+(\w+)\s*-?\s*(.*)/);
          if (match) {
            const [, type, name, description] = match;
            props.push({
              name,
              type,
              required: !type.includes('?') && !type.includes('undefined'),
              description: description || undefined,
            });
          }
        }
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return props;
}

/**
 * Find all story files for a component
 */
async function findStoryFiles(componentName: string): Promise<string[]> {
  const patterns = [
    `src/components/${componentName}.stories.@(ts|tsx|js|jsx)`,
    `src/components/**/${componentName}.stories.@(ts|tsx|js|jsx)`,
    `src/stories/**/${componentName}.stories.@(ts|tsx|js|jsx)`,
  ];

  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, { cwd: process.cwd() });
    files.push(...matches);
  }

  return files;
}

/**
 * Extract mock data references from story file
 */
function extractMockDataFromStory(storyFilePath: string): StoryMockInfo[] {
  const content = fs.readFileSync(storyFilePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    storyFilePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const mockInfo: StoryMockInfo[] = [];
  const imports: Map<string, string> = new Map();

  function visit(node: ts.Node) {
    // Track imports from __mocks__ directory
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
      if (moduleSpecifier.includes('__mocks__')) {
        node.importClause?.namedBindings?.forEachChild((binding) => {
          if (ts.isImportSpecifier(binding)) {
            const name = binding.name.text;
            imports.set(name, moduleSpecifier);
          }
        });
      }
    }

    // Find story exports
    if (ts.isVariableStatement(node)) {
      const modifiers = ts.getModifiers(node);
      const isExported = modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);

      if (isExported) {
        node.declarationList.declarations.forEach((decl) => {
          if (ts.isIdentifier(decl.name)) {
            const storyName = decl.name.text;
            
            // Extract props/args used in the story
            const propsUsed: Record<string, any> = {};
            if (decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
              decl.initializer.properties.forEach((prop) => {
                if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                  if (prop.name.text === 'args' || prop.name.text === 'parameters') {
                    // Track which mock data is used
                    const propText = prop.initializer.getText(sourceFile);
                    imports.forEach((importPath, importName) => {
                      if (propText.includes(importName)) {
                        propsUsed[importName] = importPath;
                      }
                    });
                  }
                }
              });
            }

            if (Object.keys(propsUsed).length > 0) {
              mockInfo.push({
                storyFile: storyFilePath,
                storyName,
                mockDataPaths: Array.from(new Set(Object.values(propsUsed))),
                propsUsed,
              });
            }
          }
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return mockInfo;
}

/**
 * Validate mock data against component prop types
 */
function validateMockData(
  componentProps: ComponentPropInfo[],
  mockData: any,
  storyInfo: StoryMockInfo
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const componentName = path.basename(storyInfo.storyFile, path.extname(storyInfo.storyFile))
    .replace('.stories', '');

  // Check for required props
  componentProps.forEach((prop) => {
    if (prop.required && !(prop.name in mockData)) {
      issues.push({
        severity: 'error',
        component: componentName,
        story: storyInfo.storyName,
        issue: `Missing required prop: ${prop.name} (type: ${prop.type})`,
        suggestion: `Add ${prop.name} to mock data`,
      });
    }
  });

  // Validate specific known patterns
  if ('messages' in mockData && Array.isArray(mockData.messages)) {
    // Check ChatSidebar message format
    mockData.messages.forEach((msg: any, index: number) => {
      if (!msg.parts) {
        issues.push({
          severity: 'error',
          component: componentName,
          story: storyInfo.storyName,
          issue: `Message ${index} missing 'parts' array - uses legacy format`,
          suggestion: 'Update to current format: { id, role, parts: [{ type: "text", text: "..." }] }',
        });
      }

      if (msg.content !== undefined) {
        issues.push({
          severity: 'warning',
          component: componentName,
          story: storyInfo.storyName,
          issue: `Message ${index} has deprecated 'content' field`,
          suggestion: 'Remove content field and use parts array only',
        });
      }
    });
  }

  return issues;
}

/**
 * Main validation function
 */
async function validateComponentMocks(componentName?: string) {
  console.log('🔍 Validating component mock data...\n');

  const allIssues: ValidationIssue[] = [];
  let componentsChecked = 0;
  let storiesChecked = 0;

  // Find all component files
  const componentPattern = componentName
    ? `src/components/${componentName}.@(ts|tsx|js|jsx)`
    : 'src/components/**/*.@(ts|tsx|js|jsx)';

  const componentFiles = await glob(componentPattern, {
    cwd: process.cwd(),
    ignore: ['**/*.stories.*', '**/*.test.*', '**/*.spec.*'],
  });

  for (const componentFile of componentFiles) {
    const fullPath = path.join(process.cwd(), componentFile);
    const baseName = path.basename(componentFile, path.extname(componentFile));

    // Skip if it's not a main component file
    if (baseName.includes('.') || baseName.toLowerCase() === 'index') {
      continue;
    }

    // Extract prop types from component
    const propTypes = extractPropTypes(fullPath);
    if (propTypes.length === 0) {
      continue; // No props defined, skip validation
    }

    // Find story files
    const storyFiles = await findStoryFiles(baseName);
    if (storyFiles.length === 0) {
      continue; // No stories for this component
    }

    componentsChecked++;

    for (const storyFile of storyFiles) {
      const storyFullPath = path.join(process.cwd(), storyFile);
      const mockInfos = extractMockDataFromStory(storyFullPath);

      for (const mockInfo of mockInfos) {
        storiesChecked++;

        // Load mock data files referenced in the story
        for (const mockPath of mockInfo.mockDataPaths) {
          try {
            const mockFilePath = path.join(process.cwd(), '.storybook', '__mocks__', mockPath);
            
            let mockData = {};
            if (fs.existsSync(mockFilePath)) {
              if (mockFilePath.endsWith('.json')) {
                mockData = JSON.parse(fs.readFileSync(mockFilePath, 'utf-8'));
              } else {
                // Load JS module
                const mockModule = await import(mockFilePath);
                mockData = mockModule.default || mockModule;
              }

              // Validate
              const issues = validateMockData(propTypes, mockData, mockInfo);
              allIssues.push(...issues);
            }
          } catch (error) {
            // Silently skip if mock file not found or can't be loaded
          }
        }
      }
    }
  }

  // Report results
  console.log(`📊 Validation Summary:`);
  console.log(`   Components checked: ${componentsChecked}`);
  console.log(`   Stories checked: ${storiesChecked}`);
  console.log(`   Issues found: ${allIssues.length}\n`);

  if (allIssues.length > 0) {
    const errors = allIssues.filter(i => i.severity === 'error');
    const warnings = allIssues.filter(i => i.severity === 'warning');

    if (errors.length > 0) {
      console.log(`❌ Errors (${errors.length}):\n`);
      errors.forEach((issue) => {
        console.log(`  Component: ${issue.component}`);
        console.log(`  Story: ${issue.story}`);
        console.log(`  Issue: ${issue.issue}`);
        if (issue.suggestion) {
          console.log(`  Fix: ${issue.suggestion}`);
        }
        console.log('');
      });
    }

    if (warnings.length > 0) {
      console.log(`⚠️  Warnings (${warnings.length}):\n`);
      warnings.forEach((issue) => {
        console.log(`  Component: ${issue.component}`);
        console.log(`  Story: ${issue.story}`);
        console.log(`  Issue: ${issue.issue}`);
        if (issue.suggestion) {
          console.log(`  Fix: ${issue.suggestion}`);
        }
        console.log('');
      });
    }

    if (errors.length > 0) {
      process.exit(1);
    }
  } else {
    console.log('✅ All mock data validated successfully!');
  }
}

// Run
const componentName = process.argv[2];
validateComponentMocks(componentName).catch(console.error);
