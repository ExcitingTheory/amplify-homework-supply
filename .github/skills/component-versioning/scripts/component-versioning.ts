/**
 * Component Versioning Agent Skill
 * 
 * Automates creation of versioned component copies (Component → Component2) with
 * updated imports, exports, and feature parity checklists.
 * 
 * @module agent-skills/component-versioning
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Input parameters for component versioning skill
 */
export interface ComponentVersioningInput {
  /** Absolute path to source component file */
  componentPath: string;
  
  /** Target version number (optional - auto-detects if omitted) */
  targetVersion?: number;
  
  /** Whether to also copy story file (default: true) */
  copyStory?: boolean;
  
  /** Custom output path (optional - uses same directory if omitted) */
  outputPath?: string;
}

/**
 * Output from component versioning skill
 */
export interface ComponentVersioningOutput {
  /** Path to newly created component file */
  newComponentPath: string;
  
  /** Path to newly created story file (if created) */
  newStoryPath?: string;
  
  /** Path to generated feature parity checklist */
  checklistPath: string;
  
  /** Version number of new component */
  version: number;
  
  /** Summary message */
  summary: string;
  
  /** Import statements that were updated */
  updatedImports: string[];
  
  /** Export statements that were updated */
  updatedExports: string[];
  
  /** Errors encountered (if any) */
  errors?: string[];
}

/**
 * Read source component file
 * Task 5, Subtask 1
 */
function readComponentFile(componentPath: string): string {
  if (!fs.existsSync(componentPath)) {
    throw new Error(`Component file not found: ${componentPath}`);
  }
  
  return fs.readFileSync(componentPath, 'utf8');
}

/**
 * Extract current version number from component name
 * Task 5, Subtask 2
 * 
 * Examples:
 * - "FileManager" → 1
 * - "FileManager2" → 2
 * - "RecordingStudio3" → 3
 */
function extractVersionNumber(componentName: string): number {
  const match = componentName.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Determine next version number
 * Task 5, Subtask 2
 */
function getNextVersion(componentPath: string, targetVersion?: number): number {
  if (targetVersion !== undefined) {
    if (targetVersion < 2) {
      throw new Error(`Invalid target version: ${targetVersion}. Must be >= 2`);
    }
    return targetVersion;
  }
  
  // Auto-detect: extract current version from filename
  const basename = path.basename(componentPath, path.extname(componentPath));
  const currentVersion = extractVersionNumber(basename);
  return currentVersion + 1;
}

/**
 * Get base component name without version number
 * 
 * Examples:
 * - "FileManager2" → "FileManager"
 * - "RecordingStudio3" → "RecordingStudio"
 * - "ChatSidebar" → "ChatSidebar"
 */
function getBaseComponentName(componentName: string): string {
  return componentName.replace(/\d+$/, '');
}

/**
 * Update import statements in component code
 * Task 5, Subtask 3
 */
function updateImports(content: string, componentName: string, newComponentName: string): { content: string; updatedImports: string[] } {
  const updatedImports: string[] = [];
  
  // Pattern 1: import Component from './Component'
  // Pattern 2: import { Component } from './Component'
  // Pattern 3: import type { Component } from './Component'
  
  const importRegex = /import\s+(?:type\s+)?(?:{[^}]*}|[\w]+)\s+from\s+['"]([^'"]+)['"]/g;
  
  let updatedContent = content.replace(importRegex, (match) => {
    // Check if this import references the old component name
    if (match.includes(` ${componentName} `) || match.includes(`{${componentName}}`) || match.includes(`{ ${componentName} }`) || match.includes(` ${componentName},`)) {
      const updated = match.replace(new RegExp(`\\b${componentName}\\b`, 'g'), newComponentName);
      if (updated !== match) {
        updatedImports.push(`${match} → ${updated}`);
        return updated;
      }
    }
    return match;
  });
  
  return { content: updatedContent, updatedImports };
}

/**
 * Copy component file with new version suffix
 * Task 6, Subtask 1
 */
function copyComponentFile(sourcePath: string, targetPath: string, content: string): void {
  const targetDir = path.dirname(targetPath);
  
  // Create target directory if needed
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Check if target already exists
  if (fs.existsSync(targetPath)) {
    throw new Error(`Target component already exists: ${targetPath}`);
  }
  
  // Write new file
  fs.writeFileSync(targetPath, content, 'utf8');
}

/**
 * Update component exports (name, displayName, etc.)
 * Task 6, Subtask 2
 */
function updateExports(content: string, componentName: string, newComponentName: string): { content: string; updatedExports: string[] } {
  const updatedExports: string[] = [];
  
  let updatedContent = content;
  
  // Pattern 1: export default ComponentName
  const exportDefaultRegex = new RegExp(`export default ${componentName}(?!\\w)`, 'g');
  if (exportDefaultRegex.test(updatedContent)) {
    const original = `export default ${componentName}`;
    const updated = `export default ${newComponentName}`;
    updatedContent = updatedContent.replace(exportDefaultRegex, updated);
    updatedExports.push(`${original} → ${updated}`);
  }
  
  // Pattern 2: const ComponentName = ...
  // Pattern 3: function ComponentName(...) {...}
  // Pattern 4: class ComponentName ...
  const declarationPatterns = [
    { regex: new RegExp(`const ${componentName}\\s*[:=]`, 'g'), type: 'const' },
    { regex: new RegExp(`function ${componentName}\\s*\\(`, 'g'), type: 'function' },
    { regex: new RegExp(`class ${componentName}\\s+`, 'g'), type: 'class' }
  ];
  
  for (const { regex, type } of declarationPatterns) {
    if (regex.test(updatedContent)) {
      updatedContent = updatedContent.replace(new RegExp(`\\b${componentName}\\b`, 'g'), (match) => {
        // Be careful not to replace component name within strings or comments
        return newComponentName;
      });
      updatedExports.push(`${type} ${componentName} → ${type} ${newComponentName}`);
      break; // Only report once per type
    }
  }
  
  // Pattern 5: ComponentName.displayName = "ComponentName"
  const displayNameRegex = new RegExp(`${componentName}\\.displayName\\s*=\\s*['"]${componentName}['"]`, 'g');
  if (displayNameRegex.test(updatedContent)) {
    const original = `${componentName}.displayName = "${componentName}"`;
    const updated = `${newComponentName}.displayName = "${newComponentName}"`;
    updatedContent = updatedContent.replace(displayNameRegex, updated);
    updatedExports.push(`${original} → ${updated}`);
  }
  
  return { content: updatedContent, updatedExports };
}

/**
 * Generate feature parity checklist markdown
 * Task 7
 */
function generateFeatureParityChecklist(
  originalPath: string,
  newPath: string,
  componentName: string,
  newComponentName: string
): string {
  const date = new Date().toISOString().split('T')[0];
  
  return `# Component Versioning Checklist: ${componentName} → ${newComponentName}

**Original Component:** ${originalPath}  
**New Component:** ${newPath}  
**Date Created:** ${date}

## Features to Maintain

- [ ] All props from original component
- [ ] All methods/functions from original component
- [ ] All UI interactions from original component
- [ ] All state management patterns from original component
- [ ] All context integrations from original component

## Features to Improve

- [ ] Add TypeScript type safety (if upgrading from JS)
- [ ] Improve error handling
- [ ] Add loading states
- [ ] Improve accessibility
- [ ] Optimize performance

## New Features

- [ ] (Add new features here as you implement them)

## Deprecated Features

- [ ] (List features intentionally not porting here)

## Migration Notes

- Original component file: ${originalPath}
- New component file: ${newPath}
- Update all consuming components to import ${newComponentName} instead of ${componentName}
- Test both versions side-by-side in Storybook before migration
- Verify all functionality works identically (or better) in new version

## Testing Checklist

- [ ] Unit tests created for new component
- [ ] Story file created/updated
- [ ] Mock data validated
- [ ] Visual regression testing complete
- [ ] Accessibility audit passed
- [ ] Performance benchmarks meet/exceed original

## Migration Plan

1. [ ] Complete new component implementation
2. [ ] Add both components to Storybook for comparison
3. [ ] Run full test suite on both versions
4. [ ] Update consuming components one at a time
5. [ ] Deprecate original after full migration
6. [ ] Remove original in future cleanup (after grace period)
`;
}

/**
 * Validate that file is a React component
 * Task 8, Subtask 2
 */
function validateComponentFile(content: string, filePath: string): { valid: boolean; error?: string } {
  const ext = path.extname(filePath);
  
  // Check file extension
  if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
    return { 
      valid: false, 
      error: `Unsupported file extension: ${ext}. Must be .js, .jsx, .ts, or .tsx` 
    };
  }
  
  // Check for export statement (basic React component validation)
  // Match various export patterns including default, named, interface, type, etc.
  const hasExport = /export\s+/i.test(content);
  if (!hasExport) {
    return { 
      valid: false, 
      error: 'File does not appear to be a React component (no export found)' 
    };
  }
  
  return { valid: true };
}

/**
 * Main skill execution function
 * 
 * Creates a versioned copy of a React component with automatic import/export updates
 * and feature parity checklist generation.
 */
export async function executeSkill(input: ComponentVersioningInput): Promise<ComponentVersioningOutput> {
  const errors: string[] = [];
  
  try {
    // Validate input
    if (!input.componentPath) {
      return {
        newComponentPath: '',
        checklistPath: '',
        version: 0,
        summary: 'Error: componentPath is required',
        updatedImports: [],
        updatedExports: [],
        errors: ['componentPath is required']
      };
    }
    
    // Read source component file (Task 5, Subtask 1)
     let content: string;
    try {
      content = readComponentFile(input.componentPath);
    } catch (error: any) {
      return {
        newComponentPath: '',
        checklistPath: '',
        version: 0,
        summary: `Error: ${error.message}`,
        updatedImports: [],
        updatedExports: [],
        errors: [error.message]
      };
    }
    
    // Validate component file (Task 8, Subtask 2)
    const validation = validateComponentFile(content, input.componentPath);
    if (!validation.valid) {
      return {
        newComponentPath: '',
        checklistPath: '',
        version: 0,
        summary: `Error: ${validation.error}`,
        updatedImports: [],
        updatedExports: [],
        errors: [validation.error || 'Validation failed']
      };
    }
    
    // Extract component name and determine next version (Task 5, Subtask 2)
    const ext = path.extname(input.componentPath);
    const basename = path.basename(input.componentPath, ext);
    const baseComponentName = getBaseComponentName(basename);
    const nextVersion = getNextVersion(input.componentPath, input.targetVersion);
    const newComponentName = `${baseComponentName}${nextVersion}`;
    
    // Determine target path
    const targetExt = ext === '.js' || ext === '.jsx' ? '.tsx' : ext; // Upgrade to TypeScript
    const targetDir = input.outputPath || path.dirname(input.componentPath);
    const targetPath = path.join(targetDir, `${newComponentName}${targetExt}`);
    
    // Update imports (Task 5, Subtask 3)
    const { content: contentWithUpdatedImports, updatedImports } = updateImports(content, basename, newComponentName);
    
    // Update exports (Task 6, Subtask 2)
    const { content: finalContent, updatedExports } = updateExports(contentWithUpdatedImports, basename, newComponentName);
    
    // Copy component file (Task 6, Subtask 1)
    try {
      copyComponentFile(input.componentPath, targetPath, finalContent);
    } catch (error: any) {
      return {
        newComponentPath: '',
        checklistPath: '',
        version: nextVersion,
        summary: `Error: ${error.message}`,
        updatedImports: [],
        updatedExports: [],
        errors: [error.message]
      };
    }
    
    // Generate feature parity checklist (Task 7)
    const checklistPath = path.join(path.dirname(input.componentPath), '../../docs', `COMPONENT_VERSIONING_CHECKLIST_${baseComponentName}.md`);
    const checklistContent = generateFeatureParityChecklist(
      input.componentPath,
      targetPath,
      basename,
      newComponentName
    );
    
    // Ensure docs directory exists
    const docsDir = path.dirname(checklistPath);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    fs.writeFileSync(checklistPath, checklistContent, 'utf8');
    
    // Build summary
    const summary = `✅ Created ${newComponentName} from ${basename} with ${updatedImports.length} import updates and ${updatedExports.length} export updates`;
    
    return {
      newComponentPath: targetPath,
      checklistPath,
      version: nextVersion,
      summary,
      updatedImports,
      updatedExports
    };
    
  } catch (error: any) {
    return {
      newComponentPath: '',
      checklistPath: '',
      version: 0,
      summary: `Skill execution failed: ${error.message}`,
      updatedImports: [],
      updatedExports: [],
      errors: [error.message]
    };
  }
}

/**
 * Skill metadata for VS Code agent system
 */
export const skillMetadata = {
  name: 'component-versioning',
  description: 'Automates creation of versioned component copies (Component → Component2) with updated imports, exports, and feature parity checklists',
  version: '1.0.0',
  inputSchema: {
    type: 'object',
    required: ['componentPath'],
    properties: {
      componentPath: { 
        type: 'string', 
        description: 'Absolute path to source component file' 
      },
      targetVersion: { 
        type: 'number', 
        description: 'Target version number (optional - auto-detects if omitted)' 
      },
      copyStory: { 
        type: 'boolean', 
        description: 'Whether to also copy story file (default: true)' 
      },
      outputPath: { 
        type: 'string', 
        description: 'Custom output path (optional - uses same directory if omitted)' 
      }
    }
  },
  outputSchema: {
    type: 'object',
    required: ['newComponentPath', 'checklistPath', 'version', 'summary', 'updatedImports', 'updatedExports'],
    properties: {
      newComponentPath: { 
        type: 'string', 
        description: 'Path to newly created component file' 
      },
      newStoryPath: { 
        type: 'string', 
        description: 'Path to newly created story file (if created)' 
      },
      checklistPath: { 
        type: 'string', 
        description: 'Path to generated feature parity checklist' 
      },
      version: { 
        type: 'number', 
        description: 'Version number of new component' 
      },
      summary: { 
        type: 'string', 
        description: 'Summary message' 
      },
      updatedImports: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'Import statements that were updated' 
      },
      updatedExports: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'Export statements that were updated' 
      },
      errors: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'Errors encountered (if any)' 
      }
    }
  }
};
