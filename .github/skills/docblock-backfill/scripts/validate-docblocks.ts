#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';

/**
 * Validates existing docblocks match current code structure
 */

interface ValidationIssue {
  file: string;
  type: 'missing' | 'outdated' | 'mismatch' | 'incomplete';
  severity: 'error' | 'warning';
  details: string;
  line?: number;
}

interface ValidationResult {
  totalFiles: number;
  filesWithDocblocks: number;
  filesWithoutDocblocks: number;
  issues: ValidationIssue[];
  valid: string[];
}

/**
 * Extract function/component parameters from AST
 */
function extractParameters(filePath: string): Set<string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath);
  const params = new Set<string>();
  
  try {
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });
    
    traverse(ast, {
      FunctionDeclaration(path) {
        path.node.params.forEach(param => {
          if (param.type === 'Identifier') {
            params.add(param.name);
          } else if (param.type === 'ObjectPattern') {
            param.properties.forEach(prop => {
              if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                params.add(prop.key.name);
              }
            });
          }
        });
      },
      ArrowFunctionExpression(path) {
        path.node.params.forEach(param => {
          if (param.type === 'Identifier') {
            params.add(param.name);
          } else if (param.type === 'ObjectPattern') {
            param.properties.forEach(prop => {
              if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                params.add(prop.key.name);
              }
            });
          }
        });
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  ⚠️  Failed to parse ${filePath}: ${errorMessage}`);
  }
  
  return params;
}

/**
 * Extract component name from exports
 */
function extractComponentName(filePath: string): string | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  try {
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });
    
    let componentName: string | null = null;
    
    traverse(ast, {
      ExportNamedDeclaration(path) {
        const declaration = path.node.declaration;
        if (declaration && 'id' in declaration && declaration.id && declaration.id.type === 'Identifier') {
          componentName = declaration.id.name;
        }
      },
      ExportDefaultDeclaration(path) {
        const declaration = path.node.declaration;
        if (declaration.type === 'Identifier') {
          componentName = declaration.name;
        }
      }
    });
    
    return componentName;
  } catch (error) {
    return null;
  }
}

/**
 * Validate a single file's docblock
 */
function validateFile(filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if docblock exists
  const docblockRegex = /^\/\*\*[\s\S]*?\*\//;
  const match = content.match(docblockRegex);
  
  if (!match) {
    issues.push({
      file: filePath,
      type: 'missing',
      severity: 'warning',
      details: 'No file-level docblock found'
    });
    return issues;
  }
  
  const docblock = match[0];
  
  // Extract documented parameters
  const paramRegex = /@param\s+{[^}]+}\s+(\w+)/g;
  const documentedParams = new Set<string>();
  let paramMatch;
  
  while ((paramMatch = paramRegex.exec(docblock)) !== null) {
    documentedParams.add(paramMatch[1]);
  }
  
  // Extract actual parameters from code
  const actualParams = extractParameters(filePath);
  
  // Check for parameter mismatches
  for (const docParam of Array.from(documentedParams)) {
    if (!actualParams.has(docParam)) {
      issues.push({
        file: filePath,
        type: 'mismatch',
        severity: 'error',
        details: `Documented parameter '${docParam}' not found in function signature`
      });
    }
  }
  
  // Check for undocumented parameters
  for (const actualParam of Array.from(actualParams)) {
    if (!documentedParams.has(actualParam) && actualParams.size > 0) {
      issues.push({
        file: filePath,
        type: 'incomplete',
        severity: 'warning',
        details: `Parameter '${actualParam}' in signature but not documented`
      });
    }
  }
  
  // Validate component name matches export
  const componentName = extractComponentName(filePath);
  if (componentName) {
    const nameInDocblock = docblock.match(/^\/\*\*\s*\n\s*\*\s*(\w+)/);
    if (nameInDocblock && nameInDocblock[1] !== componentName) {
      issues.push({
        file: filePath,
        type: 'mismatch',
        severity: 'error',
        details: `Docblock says '${nameInDocblock[1]}' but export is '${componentName}'`
      });
    }
  }
  
  // Check for metadata section if file is a component
  if (filePath.includes('/components/') && !docblock.includes('@metadata')) {
    issues.push({
      file: filePath,
      type: 'incomplete',
      severity: 'warning',
      details: 'Component missing @metadata section'
    });
  }
  
  return issues;
}

/**
 * Validate all docblocks in workspace
 */
async function validateDocblocks(
  options: {
    fix?: boolean;
    report?: boolean;
    include?: string[];
    exclude?: string[];
  } = {}
): Promise<ValidationResult> {
  const {
    fix = false,
    report = false,
    include = [
      'src/components/**/*.{ts,tsx,js,jsx}',
      'pages/**/*.{ts,tsx,js,jsx}',
      'src/utils/**/*.{ts,tsx,js,jsx}'
    ],
    exclude = [
      '**/*.test.*',
      '**/*.stories.*',
      '**/node_modules/**',
      '**/.next/**'
    ]
  } = options;
  
  console.log('🔍 Validating docblocks...\n');
  
  const files = await glob(include, {
    ignore: exclude,
    absolute: true
  });
  
  console.log(`📁 Found ${files.length} files to validate\n`);
  
  const result: ValidationResult = {
    totalFiles: files.length,
    filesWithDocblocks: 0,
    filesWithoutDocblocks: 0,
    issues: [],
    valid: []
  };
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const hasDocblock = /^\/\*\*[\s\S]*?\*\//.test(content);
    
    if (hasDocblock) {
      result.filesWithDocblocks++;
    } else {
      result.filesWithoutDocblocks++;
    }
    
    const fileIssues = validateFile(file);
    
    if (fileIssues.length === 0 && hasDocblock) {
      result.valid.push(file);
      console.log(`  ✅ ${path.relative(process.cwd(), file)}`);
    } else if (fileIssues.length > 0) {
      result.issues.push(...fileIssues);
      console.log(`  ⚠️  ${path.relative(process.cwd(), file)}`);
      fileIssues.forEach(issue => {
        const icon = issue.severity === 'error' ? '❌' : '⚠️';
        console.log(`      ${icon} ${issue.details}`);
      });
    }
  }
  
  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`  - Total files: ${result.totalFiles}`);
  console.log(`  - With docblocks: ${result.filesWithDocblocks} (${Math.round(result.filesWithDocblocks / result.totalFiles * 100)}%)`);
  console.log(`  - Without docblocks: ${result.filesWithoutDocblocks} (${Math.round(result.filesWithoutDocblocks / result.totalFiles * 100)}%)`);
  console.log(`  - Valid docblocks: ${result.valid.length}`);
  console.log(`  - Issues found: ${result.issues.length}`);
  
  // Group issues by type
  const issuesByType = result.issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  if (Object.keys(issuesByType).length > 0) {
    console.log('\n📋 Issues by type:');
    Object.entries(issuesByType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
  }
  
  // Generate report if requested
  if (report) {
    const reportPath = path.join(process.cwd(), 'docblock-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }
  
  return result;
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const report = args.includes('--report');
  
  validateDocblocks({ fix, report })
    .then((result) => {
      console.log('\n✅ Validation complete!');
      
      if (result.issues.length > 0) {
        console.log('\n⚠️  Found issues that need attention');
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

export { validateDocblocks, validateFile };
