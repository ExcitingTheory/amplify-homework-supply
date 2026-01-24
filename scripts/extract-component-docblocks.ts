/**
 * Extract JSDoc/TSDoc docblocks from component files
 * 
 * Parses @fileoverview comments to map component locations to their descriptions
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ComponentDocblock {
  filePath: string;
  description: string;
  module?: string;
  example?: string;
}

/**
 * Parse a JSDoc/TSDoc comment block
 */
function parseDocblock(content: string, filePath: string): ComponentDocblock | null {
  // Match /** ... */ style comments at start of file
  const docblockMatch = content.match(/^\/\*\*\s*\n([\s\S]*?)\*\//);
  
  if (!docblockMatch) {
    return null;
  }

  const docblock = docblockMatch[1];
  
  // Extract @fileoverview or first descriptive paragraph
  const fileoverviewMatch = docblock.match(/@fileoverview\s+([^\n]+(?:\n(?!\s*@|\s*\*\/)[^\n]+)*)/);
  const moduleMatch = docblock.match(/@module\s+(\S+)/);
  const exampleMatch = docblock.match(/@example\s+([\s\S]*?)(?=\n\s*\*\s*@|\n\s*\*\/)/);
  
  let description = '';
  
  if (fileoverviewMatch) {
    // Clean up @fileoverview content - remove leading * and whitespace
    description = fileoverviewMatch[1]
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trim())
      .join(' ')
      .trim();
  } else {
    // Fall back to first paragraph (lines before first @ tag)
    const firstParagraph = docblock.match(/^\s*\*\s*([^\n@]+(?:\n\s*\*\s*[^\n@]+)*)/);
    if (firstParagraph) {
      description = firstParagraph[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .join(' ')
        .trim();
    }
  }
  
  if (!description) {
    return null;
  }
  
  return {
    filePath: filePath.replace(/^.*\/src\//, 'src/'), // Normalize to src/ relative
    description,
    module: moduleMatch ? moduleMatch[1] : undefined,
    example: exampleMatch ? exampleMatch[1].trim() : undefined,
  };
}

/**
 * Extract docblocks from all component files
 */
export async function extractAllDocblocks(): Promise<Map<string, ComponentDocblock>> {
  const docblocks = new Map<string, ComponentDocblock>();
  
  // Find all component files
  const componentFiles = await glob('src/**/*.{ts,tsx,js,jsx}', {
    cwd: process.cwd(),
    ignore: ['**/*.test.*', '**/*.spec.*', '**/*.stories.*', '**/node_modules/**'],
  });
  
  for (const file of componentFiles) {
    const fullPath = path.join(process.cwd(), file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const docblock = parseDocblock(content, file);
    
    if (docblock) {
      // Key by normalized path (src/components/Foo.tsx)
      docblocks.set(docblock.filePath, docblock);
      
      // Also key by component name for easier lookup
      const componentName = path.basename(file, path.extname(file));
      if (componentName !== 'index') {
        docblocks.set(componentName, docblock);
      }
    }
  }
  
  return docblocks;
}

/**
 * Find docblock for a given component reference
 * 
 * @param componentRef - Can be a file path, component name, or partial path
 * @param docblocks - Map of extracted docblocks
 */
export function findDocblock(
  componentRef: string,
  docblocks: Map<string, ComponentDocblock>
): ComponentDocblock | undefined {
  // Try exact match first
  if (docblocks.has(componentRef)) {
    return docblocks.get(componentRef);
  }
  
  // Try as component name
  const basename = path.basename(componentRef, path.extname(componentRef));
  if (docblocks.has(basename)) {
    return docblocks.get(basename);
  }
  
  // Try fuzzy match on file path
  for (const [key, docblock] of docblocks.entries()) {
    if (docblock.filePath.includes(componentRef) || componentRef.includes(docblock.filePath)) {
      return docblock;
    }
  }
  
  return undefined;
}

/**
 * CLI usage for debugging
 */
if (require.main === module) {
  (async () => {
    const docblocks = await extractAllDocblocks();
    console.log(`Extracted ${docblocks.size} docblocks\n`);
    
    // Show samples
    let count = 0;
    for (const [key, docblock] of docblocks.entries()) {
      if (count++ >= 10) break;
      console.log(`${key}:`);
      console.log(`  Path: ${docblock.filePath}`);
      console.log(`  Desc: ${docblock.description.substring(0, 100)}...`);
      console.log();
    }
  })();
}
