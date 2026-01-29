#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';

/**
 * Adds metadata structure to all English locale files based on auth.json template
 * This ensures all translation files have the required fields for multi-model translation
 */

interface MetadataValue {
  value: string;
  context: string;
  component: {
    location: string;
    description: string;
  };
  usage: string;
  impact: string;
  userType: string;
  tone: string;
  alternativeTerms?: string[];
}

type LocaleData = Record<string, any>;

/**
 * Recursively converts flat string values to metadata objects
 */
function addMetadataToValue(
  key: string,
  value: any,
  namespace: string,
  keyPath: string[] = []
): any {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    // If already has metadata structure (has 'value' field), keep it
    if ('value' in value && typeof value.value === 'string') {
      return value;
    }
    
    // Recursively process nested objects
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = addMetadataToValue(k, v, namespace, [...keyPath, key]);
    }
    return result;
  }
  
  if (typeof value === 'string') {
    // Convert string to metadata object
    const fullPath = [...keyPath, key].filter(Boolean).join('.');
    
    return {
      value: value,
      context: `UI text for ${fullPath} in ${namespace} namespace. [NEEDS_CONTEXT: Describe where this appears in the UI and when users see it]`,
      component: {
        location: `[NEEDS_LOCATION: Specify component file path]`,
        description: `[NEEDS_DESCRIPTION: Describe component functionality and user interaction]`
      },
      usage: `[NEEDS_USAGE: Describe specific UI element type and user action]`,
      impact: `[NEEDS_IMPACT: Specify importance level and explain why this matters to users]`,
      userType: "all",
      tone: "polite-formal",
      alternativeTerms: []
    };
  }
  
  // Return other types as-is
  return value;
}

/**
 * Process a locale file and add metadata structure
 */
function enhanceLocaleFile(namespace: string, localesDir: string): void {
  const filePath = path.join(localesDir, `${namespace}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Skipping ${namespace}.json - file not found`);
    return;
  }
  
  const existingData: LocaleData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  // Check if already has metadata (check first key)
  const firstKey = Object.keys(existingData)[0];
  if (firstKey && existingData[firstKey].value !== undefined) {
    console.log(`✓ ${namespace}.json already has metadata structure, skipping`);
    return;
  }
  
  // Add metadata to all string values
  const enhanced: Record<string, any> = {};
  for (const [key, value] of Object.entries(existingData)) {
    enhanced[key] = addMetadataToValue(key, value, namespace);
  }
  
  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(enhanced, null, 2) + '\n');
  console.log(`✅ Enhanced ${namespace}.json with metadata structure`);
}

async function main() {
  console.log('🔧 Adding metadata structure to all English locale files...\n');
  
  const localesDir = path.join(__dirname, '..', 'public', 'locales', 'en');
  const namespaces = ['auth', 'common', 'editor', 'chat', 'errors', 'units', 'grades'];
  
  for (const namespace of namespaces) {
    enhanceLocaleFile(namespace, localesDir);
  }
  
  console.log('\n📊 Metadata Enhancement Complete!');
  console.log('\n⚠️  NEXT STEPS REQUIRED:');
  console.log('1. Review generated metadata in public/locales/en/*.json');
  console.log('2. Fill in [NEEDS_*] placeholders with actual descriptions');
  console.log('3. Update component.location with actual file paths');
  console.log('4. Update component.description with functionality from component docblocks');
  console.log('5. Refine context, usage, and impact fields for accurate translations');
  console.log('\nℹ️  See auth.json for examples of complete metadata');
}

main().catch(console.error);
