#!/usr/bin/env tsx
/**
 * Intelligent metadata generator for all i18n namespaces
 * 
 * Extracts component docblocks and uses AI to generate complete metadata
 * for all translation keys across all namespaces
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractAllDocblocks, findDocblock } from './extract-component-docblocks';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
 * Generate metadata for a translation key using Claude
 */
async function generateKeyMetadata(
  keyPath: string,
  value: string,
  namespace: string,
  docblocksContext: string
): Promise<MetadataValue> {
  const prompt = `You are helping generate metadata for UI translation strings in a elearning platform built with Next.js, AWS Amplify, and OpenAI.

**Translation Key:** ${keyPath}
**Current English Value:** "${value}"
**Namespace:** ${namespace}

**Component Context Available:**
${docblocksContext}

Generate complete metadata for this translation key with the following JSON structure:

{
  "value": "${value}",
  "context": "Detailed explanation of where and how this text appears in the UI and when users see it (2-3 sentences)",
  "component": {
    "location": "Actual component file path (e.g., src/components/Editor3/ToolbarPlugin.js)",
    "description": "What the component does and when users see it, based on docblocks (2-3 sentences)"
  },
  "usage": "Specific UI element type and user action (1 sentence)",
  "impact": "Importance level (Critical/High/Important/Medium/Low) and why this matters to users (1 sentence)",
  "userType": "all|instructors|students|admins",
  "tone": "polite-formal|casual|technical",
  "alternativeTerms": ["synonym1", "synonym2", "synonym3"]
}

**Guidelines:**
- For "context": Describe the exact UI location and user journey
- For "component.location": Use actual file paths from docblocks when available, otherwise infer from namespace
- For "component.description": Extract from docblocks or describe functionality
- For "usage": Be specific about the element type (button, link, label, heading, etc.)
- For "impact": Consider how critical this text is for platform usability
- For "userType": Identify who sees this (instructors create content, students complete assignments, admins manage platform)
- For "tone": Match the formality level appropriate for the context
- For "alternativeTerms": Provide 2-4 synonyms that help translators understand semantic range

**Platform Context:**
- This is "Homework Supply" - an eLearning platform
- Instructors create learning units with rich content (vocabulary, quizzes, media)
- Students complete assignments and get graded
- Uses Lexical editor for content authoring
- AWS Amplify DataStore for real-time data sync
- OpenAI for AI features (chat, transcription, TTS)

Return ONLY the JSON object, no explanations.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  
  // Parse JSON response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse JSON from Claude response for key: ${keyPath}`);
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Recursively process locale data and generate metadata for all keys
 */
async function processLocaleData(
  data: any,
  namespace: string,
  docblocksContext: string,
  keyPath: string[] = []
): Promise<any> {
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    // If already has metadata structure (has 'value' field), keep it
    if ('value' in data && typeof data.value === 'string') {
      // Check if it's a placeholder metadata, if so regenerate
      if (data.context && data.context.includes('[NEEDS_')) {
        const fullPath = keyPath.join('.');
        console.log(`  Generating metadata for: ${fullPath}`);
        
        try {
          const metadata = await generateKeyMetadata(fullPath, data.value, namespace, docblocksContext);
          return metadata;
        } catch (error) {
          console.error(`  ⚠️  Failed to generate metadata for ${fullPath}:`, error);
          return data; // Keep existing placeholder
        }
      }
      return data; // Already has good metadata
    }
    
    // Recursively process nested objects
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = await processLocaleData(value, namespace, docblocksContext, [...keyPath, key]);
    }
    return result;
  }
  
  if (typeof data === 'string') {
    // Generate metadata for string value
    const fullPath = keyPath.join('.');
    console.log(`  Generating metadata for: ${fullPath}`);
    
    try {
      const metadata = await generateKeyMetadata(fullPath, data, namespace, docblocksContext);
      return metadata;
    } catch (error) {
      console.error(`  ⚠️  Failed to generate metadata for ${fullPath}:`, error);
      // Return basic structure on error
      return {
        value: data,
        context: `UI text for ${fullPath} in ${namespace} namespace. [ERROR: AI generation failed]`,
        component: {
          location: `[ERROR: Specify component file path]`,
          description: `[ERROR: Describe component functionality]`
        },
        usage: `[ERROR: Describe UI element and user action]`,
        impact: `[ERROR: Specify importance]`,
        userType: "all",
        tone: "polite-formal",
        alternativeTerms: []
      };
    }
  }
  
  return data;
}

/**
 * Process a single namespace file
 */
async function processNamespace(
  namespace: string,
  localesDir: string,
  docblocks: Map<string, any>
): Promise<void> {
  const filePath = path.join(localesDir, `${namespace}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Skipping ${namespace}.json - file not found`);
    return;
  }
  
  console.log(`\n📝 Processing ${namespace}.json...`);
  
  const existingData: LocaleData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  // Build context string from relevant docblocks
  let docblocksContext = `Component docblocks available for ${namespace} namespace:\n\n`;
  
  // Include relevant docblocks based on namespace
  const relevantPaths: string[] = [];
  
  switch (namespace) {
    case 'auth':
      relevantPaths.push('pages/auth/', 'src/components/Auth', 'Authenticator');
      break;
    case 'chat':
      relevantPaths.push('ChatSidebar', 'src/components/Chat');
      break;
    case 'common':
      relevantPaths.push('Navigation', 'src/components/Navigation', 'Layout');
      break;
    case 'editor':
      relevantPaths.push('Editor3', 'ToolbarPlugin', 'src/components/Editor3');
      break;
    case 'errors':
      relevantPaths.push('ErrorBoundary', 'src/components/Error');
      break;
    case 'units':
      relevantPaths.push('UnitEditor', 'src/components/Unit');
      break;
    case 'grades':
      relevantPaths.push('Workbook', 'GradeView', 'src/components/Grade');
      break;
  }
  
  // Find and include relevant docblocks
  for (const [key, docblock] of docblocks.entries()) {
    const isRelevant = relevantPaths.some(path => 
      key.includes(path) || docblock.filePath?.includes(path)
    );
    
    if (isRelevant) {
      docblocksContext += `- ${docblock.filePath}: ${docblock.description}\n`;
    }
  }
  
  // Add note if no specific docblocks found
  if (docblocksContext.split('\n').length < 3) {
    docblocksContext += `(No specific component docblocks found for ${namespace}, using general platform context)\n`;
  }
  
  // Process all keys with AI
  const enhanced = await processLocaleData(existingData, namespace, docblocksContext);
  
  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(enhanced, null, 2) + '\n');
  console.log(`✅ Enhanced ${namespace}.json with AI-generated metadata`);
}

async function main() {
  console.log('🤖 AI-Powered Metadata Generation for i18n Files\n');
  console.log('This will use Claude Sonnet 4 to generate complete metadata');
  console.log('for all translation keys based on component docblocks.\n');
  
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('   Export your Anthropic API key to use this script.');
    process.exit(1);
  }
  
  console.log('📚 Step 1: Extracting component docblocks...');
  const docblocks = await extractAllDocblocks();
  console.log(`   Found ${docblocks.size} component docblocks\n`);
  
  const localesDir = path.join(__dirname, '..', 'public', 'locales', 'en');
  const namespaces = ['auth', 'chat', 'common', 'editor', 'errors', 'units', 'grades'];
  
  console.log('🔧 Step 2: Generating metadata for all namespaces...\n');
  
  for (const namespace of namespaces) {
    try {
      await processNamespace(namespace, localesDir, docblocks);
      
      // Rate limiting: 500ms delay between namespaces
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error processing ${namespace}:`, error);
    }
  }
  
  console.log('\n✨ Metadata generation complete!');
  console.log('\nNext steps:');
  console.log('1. Review generated metadata in public/locales/en/*.json');
  console.log('2. Run translation workflow: Follow i18n-translation-workflow.prompt.md');
}

main().catch(console.error);
