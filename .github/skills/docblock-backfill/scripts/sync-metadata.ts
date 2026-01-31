#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';

/**
 * Syncs component metadata from locale files back to source code docblocks
 */

interface LocaleMetadata {
  value: string;
  context: string;
  component: {
    location: string;
    description: string;
  };
  usage: string;
  impact: string;
  userType?: string;
  tone?: string;
  alternativeTerms?: string[];
}

/**
 * Load all locale files and extract component metadata
 */
function loadAllLocaleMetadata(localeDir: string): Map<string, LocaleMetadata[]> {
  const componentMetadata = new Map<string, LocaleMetadata[]>();
  
  if (!fs.existsSync(localeDir)) {
    console.warn(`⚠️  Locale directory not found: ${localeDir}`);
    return componentMetadata;
  }
  
  const localeFiles = fs.readdirSync(localeDir).filter(f => f.endsWith('.json'));
  
  for (const file of localeFiles) {
    const filePath = path.join(localeDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Recursively extract component metadata
    extractComponentMetadata(data, componentMetadata);
  }
  
  return componentMetadata;
}

/**
 * Recursively extract component metadata from locale data
 */
function extractComponentMetadata(
  obj: any,
  result: Map<string, LocaleMetadata[]>,
  parentKey: string = ''
): void {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      // Check if this is a metadata object
      if ('value' in value && 'component' in value) {
        const metadata = value as LocaleMetadata;
        const location = metadata.component.location;
        
        if (location) {
          if (!result.has(location)) {
            result.set(location, []);
          }
          result.get(location)!.push(metadata);
        }
      } else {
        // Recurse into nested objects
        extractComponentMetadata(value, result, key);
      }
    }
  }
}

/**
 * Update docblock metadata section
 */
function updateDocblockMetadata(
  filePath: string,
  metadata: LocaleMetadata[],
  dryRun: boolean = false
): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Find existing docblock
  const docblockRegex = /^\/\*\*[\s\S]*?\*\//;
  const match = content.match(docblockRegex);
  
  if (!match) {
    console.warn(`  ⚠️  No docblock found in ${filePath}`);
    return false;
  }
  
  const existingDocblock = match[0];
  
  // Build metadata section
  const metadataLines = [' * @metadata'];
  
  // Aggregate metadata from all locale entries
  const contexts = new Set<string>();
  const usages = new Set<string>();
  const impacts = new Set<string>();
  let location = '';
  
  for (const meta of metadata) {
    if (meta.context) contexts.add(meta.context);
    if (meta.usage) usages.add(meta.usage);
    if (meta.impact) impacts.add(meta.impact);
    if (meta.component.location) location = meta.component.location;
  }
  
  if (contexts.size > 0) {
    metadataLines.push(` * - context: ${Array.from(contexts).join('; ')}`);
  }
  if (usages.size > 0) {
    metadataLines.push(` * - usage: ${Array.from(usages).join('; ')}`);
  }
  if (impacts.size > 0) {
    metadataLines.push(` * - impact: ${Array.from(impacts).join('; ')}`);
  }
  if (location) {
    metadataLines.push(` * - location: ${location}`);
  }
  
  const metadataSection = metadataLines.join('\n');
  
  // Check if metadata section already exists
  let updatedDocblock: string;
  
  if (existingDocblock.includes('@metadata')) {
    // Replace existing metadata section
    const metadataRegex = / \* @metadata[\s\S]*?(?= \*\s+@|\*\/)/;
    updatedDocblock = existingDocblock.replace(metadataRegex, metadataSection + '\n');
  } else {
    // Add metadata section before closing
    const lines = existingDocblock.split('\n');
    lines.splice(lines.length - 1, 0, metadataSection);
    updatedDocblock = lines.join('\n');
  }
  
  if (dryRun) {
    console.log(`\n📄 ${filePath}`);
    console.log('   Metadata to add:');
    console.log(metadataSection);
    return true;
  }
  
  // Write updated content
  const updatedContent = content.replace(docblockRegex, updatedDocblock);
  fs.writeFileSync(filePath, updatedContent);
  
  return true;
}

/**
 * Sync metadata for a single file or directory
 */
async function syncMetadata(
  target: string,
  options: {
    localeDir?: string;
    dryRun?: boolean;
  } = {}
) {
  const {
    localeDir = path.join(process.cwd(), 'public/locales/en'),
    dryRun = false
  } = options;
  
  console.log('🔄 Syncing metadata from locale files...\n');
  console.log(`📂 Locale directory: ${localeDir}\n`);
  
  // Load all component metadata from locale files
  const componentMetadata = loadAllLocaleMetadata(localeDir);
  
  console.log(`📊 Found metadata for ${componentMetadata.size} components\n`);
  
  const synced: string[] = [];
  const errors: string[] = [];
  
  // If target is a specific file
  if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    const relativePath = path.relative(process.cwd(), target);
    const metadata = componentMetadata.get(relativePath) || 
                     componentMetadata.get(target);
    
    if (metadata && metadata.length > 0) {
      if (updateDocblockMetadata(target, metadata, dryRun)) {
        synced.push(target);
        console.log(`  ✅ ${relativePath} (${metadata.length} metadata fields)`);
      }
    } else {
      console.log(`  ⚠️  No metadata found for ${relativePath}`);
    }
  } else {
    // Process all files with metadata
    for (const [filePath, metadata] of Array.from(componentMetadata.entries())) {
      const absolutePath = path.join(process.cwd(), filePath);
      
      if (fs.existsSync(absolutePath)) {
        try {
          if (updateDocblockMetadata(absolutePath, metadata, dryRun)) {
            synced.push(filePath);
            console.log(`  ✅ ${filePath} (${metadata.length} metadata fields)`);
          }
        } catch (error) {
          errors.push(filePath);
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`  ❌ ${filePath}: ${errorMessage}`);
        }
      }
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  - Components with metadata: ${componentMetadata.size}`);
  console.log(`  - Files ${dryRun ? 'would be' : ''} updated: ${synced.length}`);
  console.log(`  - Errors: ${errors.length}`);
  
  if (dryRun) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }
  
  return {
    totalComponents: componentMetadata.size,
    synced: synced.length,
    errors
  };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const localeDir = args.find(arg => arg.startsWith('--locale-dir='))?.split('=')[1];
  const target = args.find(arg => !arg.startsWith('--')) || process.cwd();
  
  syncMetadata(target, { localeDir, dryRun })
    .then(() => {
      console.log('\n✅ Metadata sync complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

export { syncMetadata, loadAllLocaleMetadata };
