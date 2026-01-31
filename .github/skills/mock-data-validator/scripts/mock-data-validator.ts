/**
 * Mock Data Validator Agent Skill
 * 
 * Validates that Storybook mock data structures match component TypeScript prop types.
 * Used by Storybook Testing Agent and TypeScript Feature Development workflows.
 * 
 * @module agent-skills/mock-data-validator
 */

import * as fs from 'fs';
import * as path from 'path';

export interface MockDataValidatorInput {
  /** Absolute path to component file */
  componentPath: string;
  /** Absolute path to mock data file (JSON or JS) */
  mockDataPath: string;
  /** Optional: specific prop to validate (validates all props if omitted) */
  propName?: string;
}

export interface FieldMismatch {
  /** JSON path to field (e.g., "messages[0].parts") */
  field: string;
  /** Expected TypeScript type */
  expected: string;
  /** Actual type found in mock data */
  actual: string;
  /** Severity of mismatch */
  severity: 'error' | 'warning';
  /** Suggestion for fixing */
  suggestion?: string;
}

export interface MockDataValidatorOutput {
  /** Overall validation result */
  valid: boolean;
  /** List of mismatches found */
  mismatches: FieldMismatch[];
  /** Human-readable summary */
  summary: string;
  /** Component props interface extracted */
  componentProps?: Record<string, string>;
  /** Mock data structure analyzed */
  mockDataStructure?: Record<string, string>;
  /** Errors encountered during validation */
  errors?: string[];
}

/**
 * Extract TypeScript interface/type from component file
 * 
 * Looks for patterns like:
 * - interface ComponentProps { ... }
 * - type ComponentProps = { ... }
 * - React.FC<ComponentProps>
 */
function extractComponentProps(componentContent: string, componentPath: string): Record<string, string> | null {
  const props: Record<string, string> = {};
  
  // Try to find props interface/type definition
  // Pattern 1: interface ComponentProps { field: type; }
  const interfaceMatch = componentContent.match(/interface\s+\w*Props\s*\{([^}]+)\}/s);
  if (interfaceMatch) {
    const propsBody = interfaceMatch[1];
    const fieldMatches = propsBody.matchAll(/(\w+)(\?)?:\s*([^;]+);/g);
    for (const match of fieldMatches) {
      const [, fieldName, optional, fieldType] = match;
      props[fieldName] = optional ? `${fieldType.trim()} | undefined` : fieldType.trim();
    }
    return props;
  }
  
  // Pattern 2: type ComponentProps = { field: type; }
  const typeMatch = componentContent.match(/type\s+\w*Props\s*=\s*\{([^}]+)\}/s);
  if (typeMatch) {
    const propsBody = typeMatch[1];
    const fieldMatches = propsBody.matchAll(/(\w+)(\?)?:\s*([^;]+);/g);
    for (const match of fieldMatches) {
      const [, fieldName, optional, fieldType] = match;
      props[fieldName] = optional ? `${fieldType.trim()} | undefined` : fieldType.trim();
    }
    return props;
  }
  
  // Pattern 3: JSDoc @param comments for JS components
  const jsDocMatches = componentContent.matchAll(/@param\s+\{([^}]+)\}\s+(\w+)/g);
  for (const match of jsDocMatches) {
    const [, fieldType, fieldName] = match;
    props[fieldName] = fieldType.trim();
  }
  
  if (Object.keys(props).length > 0) {
    return props;
  }
  
  return null;
}

/**
 * Infer TypeScript type from JSON value
 */
function inferTypeFromValue(value: any, path: string = ''): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  const type = typeof value;
  
  if (type === 'object') {
    if (Array.isArray(value)) {
      if (value.length === 0) return 'any[]';
      // Infer from first element
      const elementType = inferTypeFromValue(value[0], `${path}[0]`);
      return `${elementType}[]`;
    }
    // Object type - return structure
    return 'object';
  }
  
  return type; // 'string', 'number', 'boolean'
}

/**
 * Recursively compare mock data structure to expected props
 */
function compareMockToProps(
  mockData: any,
  expectedProps: Record<string, string>,
  basePath: string = ''
): FieldMismatch[] {
  const mismatches: FieldMismatch[] = [];
  
  for (const [propName, propType] of Object.entries(expectedProps)) {
    const fieldPath = basePath ? `${basePath}.${propName}` : propName;
    
    // Check if field exists in mock data
    if (!(propName in mockData)) {
      // Check if it's optional (type includes undefined or has ?)
      if (!propType.includes('undefined') && !propType.includes('?')) {
        mismatches.push({
          field: fieldPath,
          expected: propType,
          actual: 'missing',
          severity: 'error',
          suggestion: `Add "${propName}" field to mock data`
        });
      }
      continue;
    }
    
    const actualValue = mockData[propName];
    const actualType = inferTypeFromValue(actualValue, fieldPath);
    
    // Simple type checking (could be more sophisticated)
    const normalizedExpected = propType.replace(/\s+/g, '').toLowerCase();
    const normalizedActual = actualType.toLowerCase();
    
    // Skip function types - we can't validate functions in JSON
    if (normalizedExpected.includes('=>') || normalizedExpected.includes('function')) {
      // Allow null or undefined for function props in mock data
      if (actualValue === null || actualValue === undefined) {
        continue;
      }
      // If it's a function in mock (from JS file), that's fine
      if (typeof actualValue === 'function') {
        continue;
      }
    }
    
    // Check for common mismatches
    if (normalizedExpected.includes('string') && !normalizedExpected.includes('[]') && normalizedActual !== 'string') {
      mismatches.push({
        field: fieldPath,
        expected: propType,
        actual: actualType,
        severity: 'error',
        suggestion: `Convert to string or update prop type to accept ${actualType}`
      });
    } else if (normalizedExpected.includes('number') && !normalizedExpected.includes('[]') && normalizedActual !== 'number') {
      mismatches.push({
        field: fieldPath,
        expected: propType,
        actual: actualType,
        severity: 'error',
        suggestion: `Convert to number or update prop type to accept ${actualType}`
      });
    } else if (normalizedExpected.includes('boolean') && !normalizedExpected.includes('[]') && normalizedActual !== 'boolean') {
      mismatches.push({
        field: fieldPath,
        expected: propType,
        actual: actualType,
        severity: 'error',
        suggestion: `Convert to boolean or update prop type to accept ${actualType}`
      });
    } else if ((normalizedExpected.includes('[]') || normalizedExpected.includes('array')) && !normalizedActual.includes('[]')) {
      mismatches.push({
        field: fieldPath,
        expected: propType,
        actual: actualType,
        severity: 'error',
        suggestion: `Convert to array or update prop type to accept ${actualType}`
      });
    }
    
    // If it's an object, recursively check nested fields
    if (actualType === 'object' && typeof actualValue === 'object' && !Array.isArray(actualValue)) {
      // Try to extract nested type definition (simplified)
      // This would need more sophisticated TypeScript parsing for production
      // For now, just note it as a warning if we can't verify
      mismatches.push({
        field: fieldPath,
        expected: propType,
        actual: 'object (structure not validated)',
        severity: 'warning',
        suggestion: 'Manually verify nested object structure matches interface'
      });
    }
  }
  
  return mismatches;
}

/**
 * Load mock data from file (supports .json and .js files)
 */
function loadMockData(mockDataPath: string): any {
  const ext = path.extname(mockDataPath);
  
  if (ext === '.json') {
    const content = fs.readFileSync(mockDataPath, 'utf8');
    return JSON.parse(content);
  } else if (ext === '.js' || ext === '.ts') {
    // For JS/TS files, we'd need to evaluate or parse exports
    // Simplified: just read and try to extract object literals
    const content = fs.readFileSync(mockDataPath, 'utf8');
    
    // Try to find export default { ... } or export const mockData = { ... }
    const exportMatch = content.match(/export\s+(default|const\s+\w+\s*=)\s*(\{[\s\S]*\})/);
    if (exportMatch) {
      try {
        // Very simplified - would need proper parsing for production
        return eval(`(${exportMatch[2]})`);
      } catch (e) {
        throw new Error(`Failed to parse mock data from ${mockDataPath}: ${e}`);
      }
    }
    throw new Error(`Could not find exported mock data in ${mockDataPath}`);
  }
  
  throw new Error(`Unsupported mock data file type: ${ext}`);
}

/**
 * Validate Mock Data Against Component Props
 * 
 * Main entry point for the skill. Extracts component prop types,
 * loads mock data, and compares structures.
 */
export async function executeSkill(input: MockDataValidatorInput): Promise<MockDataValidatorOutput> {
  const errors: string[] = [];
  
  try {
    // Validate input files exist
    if (!fs.existsSync(input.componentPath)) {
      return {
        valid: false,
        mismatches: [],
        summary: `Component file not found: ${input.componentPath}`,
        errors: [`Component file not found: ${input.componentPath}`]
      };
    }
    
    if (!fs.existsSync(input.mockDataPath)) {
      return {
        valid: false,
        mismatches: [],
        summary: `Mock data file not found: ${input.mockDataPath}`,
        errors: [`Mock data file not found: ${input.mockDataPath}`]
      };
    }
    
    // Read component file
    const componentContent = fs.readFileSync(input.componentPath, 'utf8');
    
    // Extract props interface
    const componentProps = extractComponentProps(componentContent, input.componentPath);
    if (!componentProps) {
      return {
        valid: false,
        mismatches: [],
        summary: `Could not extract props interface from ${path.basename(input.componentPath)}. Ensure component has TypeScript interface or JSDoc @param comments.`,
        errors: ['No props interface found in component']
      };
    }
    
    // Load mock data
    let mockData: any;
    try {
      mockData = loadMockData(input.mockDataPath);
    } catch (e) {
      return {
        valid: false,
        mismatches: [],
        summary: `Failed to load mock data: ${e}`,
        errors: [`Failed to load mock data: ${e}`]
      };
    }
    
    // Compare structures
    const mismatches = compareMockToProps(mockData, componentProps);
    
    // Generate summary
    const valid = mismatches.filter(m => m.severity === 'error').length === 0;
    const errorCount = mismatches.filter(m => m.severity === 'error').length;
    const warningCount = mismatches.filter(m => m.severity === 'warning').length;
    
    let summary = '';
    if (valid) {
      summary = `✅ Mock data validation passed for ${path.basename(input.componentPath)}`;
      if (warningCount > 0) {
        summary += ` (${warningCount} warnings)`;
      }
    } else {
      summary = `❌ Mock data validation failed for ${path.basename(input.componentPath)}: ${errorCount} errors, ${warningCount} warnings`;
    }
    
    return {
      valid,
      mismatches,
      summary,
      componentProps,
      mockDataStructure: Object.entries(mockData).reduce((acc, [key, value]) => {
        acc[key] = inferTypeFromValue(value, key);
        return acc;
      }, {} as Record<string, string>),
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error: any) {
    return {
      valid: false,
      mismatches: [],
      summary: `Skill execution failed: ${error.message}`,
      errors: [error.message]
    };
  }
}

// Export metadata for VS Code agent system
export const skillMetadata = {
  name: 'mock-data-validator',
  description: 'Validates that Storybook mock data structures match component TypeScript prop types',
  version: '1.0.0',
  inputSchema: {
    type: 'object',
    required: ['componentPath', 'mockDataPath'],
    properties: {
      componentPath: { type: 'string', description: 'Absolute path to component file' },
      mockDataPath: { type: 'string', description: 'Absolute path to mock data file' },
      propName: { type: 'string', description: 'Optional: specific prop to validate' }
    }
  },
  outputSchema: {
    type: 'object',
    required: ['valid', 'mismatches', 'summary'],
    properties: {
      valid: { type: 'boolean' },
      mismatches: { type: 'array' },
      summary: { type: 'string' },
      componentProps: { type: 'object' },
      mockDataStructure: { type: 'object' },
      errors: { type: 'array', items: { type: 'string' } }
    }
  }
};
