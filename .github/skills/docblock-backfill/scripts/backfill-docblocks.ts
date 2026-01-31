#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';

/**
 * Backfills missing JSDoc/TSDoc docblocks in files with user-facing strings
 */

interface DocblockIssue {
  file: string;
  type: 'missing' | 'outdated' | 'incomplete';
  severity: 'error' | 'warning';
  details?: string;
}

interface ComponentInfo {
  name: string;
  type: 'component' | 'page' | 'utility';
  exports: string[];
  props?: string;
  hasDocblock: boolean;
  localeMetadata?: any;
}

/**
 * Extract existing file-level docblock if present
 */
function extractFileDocblock(filePath: string): string | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const docblockRegex = /^\/\*\*[\s\S]*?\*\//;
  const match = content.match(docblockRegex);
  return match ? match[0] : null;
}

/**
 * Analyze file exports and component structure
 */
function analyzeFile(filePath: string): ComponentInfo {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath);
  
  const ast = parser.parse(content, {
    sourceType: 'module',
    plugins: [
      'typescript',
      'jsx',
      ext === '.tsx' || ext === '.jsx' ? 'jsx' : undefined
    ].filter(Boolean) as any[]
  });

  const info: ComponentInfo = {
    name: path.basename(filePath, ext),
    type: 'utility',
    exports: [],
    hasDocblock: extractFileDocblock(filePath) !== null
  };

  // Determine file type
  if (filePath.includes('/components/')) {
    info.type = 'component';
  } else if (filePath.includes('/pages/')) {
    info.type = 'page';
  }

  // Extract exports
  traverse(ast, {
    ExportNamedDeclaration(path) {
      const declaration = path.node.declaration;
      if (declaration && 'id' in declaration && declaration.id && declaration.id.type === 'Identifier') {
        info.exports.push(declaration.id.name);
      }
    },
    ExportDefaultDeclaration(path) {
      info.exports.push('default');
    }
  });

  return info;
}

/**
 * Load locale metadata for a component
 */
function loadLocaleMetadata(componentPath: string, localeDir: string): any {
  // Try to find matching locale file
  const componentName = path.basename(componentPath, path.extname(componentPath));
  
  // Check common locale files
  const localeFiles = ['common', 'editor', 'chat', 'units', 'grades', 'auth'];
  
  for (const localeFile of localeFiles) {
    const localePath = path.join(localeDir, `${localeFile}.json`);
    
    if (fs.existsSync(localePath)) {
      const localeData = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
      
      // Search for component metadata
      for (const [key, value] of Object.entries(localeData)) {
        if (typeof value === 'object' && value !== null && 'component' in value) {
          const component = (value as any).component;
          if (component?.location?.includes(componentName)) {
            return { key, ...value, localeFile };
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Generate JSDoc docblock for a component
 */
function generateDocblock(info: ComponentInfo, metadata?: any): string {
  const lines: string[] = ['/**'];
  
  // Title
  const title = metadata?.value || info.name;
  const description = metadata?.component?.description || `${info.name} ${info.type}`;
  lines.push(` * ${info.name} - ${description}`);
  lines.push(' * ');
  
  // Description section
  if (metadata?.context) {
    lines.push(' * @description');
    lines.push(` * ${metadata.context}`);
    lines.push(' * ');
  }
  
  // Component tag
  if (info.type === 'component') {
    lines.push(' * @component');
  }
  
  // Metadata section
  if (metadata) {
    lines.push(' * @metadata');
    if (metadata.context) {
      lines.push(` * - context: ${metadata.context}`);
    }
    if (metadata.usage) {
      lines.push(` * - usage: ${metadata.usage}`);
    }
    if (metadata.impact) {
      lines.push(` * - impact: ${metadata.impact}`);
    }
    if (metadata.component?.location) {
      lines.push(` * - location: ${metadata.component.location}`);
    }
    lines.push(' * ');
  }
  
  // References
  if (metadata?.localeFile) {
    lines.push(` * @see {@link public/locales/en/${metadata.localeFile}.json} for UI strings`);
  }
  
  lines.push(' */');
  
  return lines.join('\n');
}

/**
 * Add docblock to file
 */
function addDocblockToFile(filePath: string, docblock: string, dryRun: boolean): void {
  if (dryRun) {
    console.log(`\n📄 ${filePath}`);
    console.log(docblock);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Add docblock at the beginning (after any existing imports/shebangs)
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Skip shebang
  if (lines[0].startsWith('#!')) {
    insertIndex = 1;
  }
  
  // Skip initial imports/requires
  while (insertIndex < lines.length && 
         (lines[insertIndex].startsWith('import ') || 
          lines[insertIndex].startsWith('require(') ||
          lines[insertIndex].trim() === '')) {
    insertIndex++;
  }
  
  lines.splice(insertIndex, 0, docblock, '');
  
  fs.writeFileSync(filePath, lines.join('\n'));
}

/**
 * Main backfill function
 */
async function backfillDocblocks(
  target: string,
  options: {
    dryRun?: boolean;
    localeDir?: string;
    include?: string[];
    exclude?: string[];
  } = {}
) {
  const {
    dryRun = false,
    localeDir = path.join(process.cwd(), 'public/locales/en'),
    include = [
      'src/components/**/*.{ts,tsx,js,jsx}',
      'pages/**/*.{ts,tsx,js,jsx}',
      'src/utils/**/*.{ts,tsx,js,jsx}'
    ],
    exclude = [
      '**/*.test.*',
      '**/*.stories.*',
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**'
    ]
  } = options;

  console.log('🔍 Scanning for files needing docblocks...\n');
  
  // Determine files to process
  let files: string[];
  
  if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    files = [target];
  } else if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    files = await glob(include, { 
      cwd: target,
      ignore: exclude,
      absolute: true
    });
  } else {
    files = await glob(include, {
      ignore: exclude,
      absolute: true
    });
  }
  
  console.log(`📁 Found ${files.length} files to analyze`);
  
  const issues: DocblockIssue[] = [];
  const backfilled: string[] = [];
  
  for (const file of files) {
    try {
      const info = analyzeFile(file);
      
      if (!info.hasDocblock) {
        // Load locale metadata if available
        const metadata = loadLocaleMetadata(file, localeDir);
        
        // Generate and add docblock
        const docblock = generateDocblock(info, metadata);
        addDocblockToFile(file, docblock, dryRun);
        
        backfilled.push(file);
        console.log(`  ✅ ${path.relative(process.cwd(), file)}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ ${file}: ${errorMessage}`);
      issues.push({
        file,
        type: 'missing',
        severity: 'error',
        details: errorMessage
      });
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  - Files analyzed: ${files.length}`);
  console.log(`  - Docblocks ${dryRun ? 'would be' : ''} added: ${backfilled.length}`);
  console.log(`  - Errors: ${issues.length}`);
  
  if (dryRun) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }
  
  return {
    totalFiles: files.length,
    backfilled: backfilled.length,
    issues
  };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const target = args.find(arg => !arg.startsWith('--')) || process.cwd();
  
  backfillDocblocks(target, { dryRun })
    .then(() => {
      console.log('\n✅ Docblock backfill complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

export { backfillDocblocks, analyzeFile, generateDocblock };
