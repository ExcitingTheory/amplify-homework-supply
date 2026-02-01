#!/usr/bin/env tsx
/**
 * Update component useTranslation imports from 'editor' to new namespaces
 * 
 * Usage:
 *   npx tsx scripts/update-translation-imports.ts [--dry-run]
 * 
 * Updates:
 *   - useTranslation('editor') → appropriate namespace based on component location
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const DRY_RUN = process.argv.includes('--dry-run');

// Component-to-namespace mapping based on file path patterns
const NAMESPACE_MAPPING: Record<string, string> = {
  // Authoring Tools
  'plugins/ToolBarPlugin': 'editor.authoring',
  'components/TabsVerticalLeft': 'editor.authoring',
  'components/TabsVerticalRight': 'editor.authoring',
  'components/AssignmentConfiguration': 'editor.authoring',
  'components/Toolbar': 'editor.authoring',
  'components/ConfigurationManager': 'editor.authoring',
  'components/MainToolbar': 'editor.authoring',
  
  // File Management
  'components/FileManager2': 'editor.files',
  'components/FileMetadataComponent': 'editor.files',
  'components/DocumentUploader': 'editor.files',
  'components/FileManager': 'editor.files',
  
  // AI Features
  'components/UnifiedGenerateModal': 'editor.ai',
  'components/PromptMethodSelector': 'editor.ai',
  'components/EnhancedGenerators': 'editor.ai',
  'components/BlockSuggestionMenu': 'editor.ai',
  'components/SuggestedContent': 'editor.ai',
  'components/AIContentSuggestion': 'editor.ai',
  
  // Block Editors
  'components/CustomAnswerEditor': 'editor.blocks',
  'components/MeaningAssociationEditor': 'editor.blocks',
  'components/QuizEditor': 'editor.blocks',
  'components/AnswerEditor': 'editor.blocks',
  'components/QuestionEditor': 'editor.blocks',
  
  // Workbook (Learner Interface)
  'components/AnswerComponent': 'workbook',
  'nodes/AnswerNode/AnswerComponent': 'workbook',
  'plugins/ToolBarRoPlugin': 'workbook',
  'components/VerticalTabsRo': 'workbook',
  'plugins/UnitCompletedPlugin': 'workbook',
  'components/QuizComponent': 'workbook',
  'nodes/QuizNode/QuizComponent': 'workbook',
  'components/MeaningAssociationExercise': 'workbook',
  'components/CustomAnswerComponent': 'workbook',
  'nodes/CustomAnswerNode/CustomAnswerComponent': 'workbook',
  
  // Everything else → editor.shared
};

function getNamespaceForFile(filePath: string): string {
  // Check if file path matches any specific pattern
  for (const [pattern, namespace] of Object.entries(NAMESPACE_MAPPING)) {
    if (filePath.includes(pattern)) {
      return namespace;
    }
  }
  
  // Default to shared if in Editor3 directory
  if (filePath.includes('Editor3/')) {
    return 'editor.shared';
  }
  
  // Otherwise keep 'editor' (shouldn't happen for Editor3 components)
  return 'editor';
}

async function updateFile(filePath: string): Promise<boolean> {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if file uses useTranslation('editor')
  if (!content.includes("useTranslation('editor')") && 
      !content.includes('useTranslation("editor")')) {
    return false; // No changes needed
  }
  
  const newNamespace = getNamespaceForFile(filePath);
  
  // Replace useTranslation('editor') with new namespace
  const updatedContent = content
    .replace(/useTranslation\(['"]editor['"]\)/g, `useTranslation('${newNamespace}')`);
  
  if (content === updatedContent) {
    return false; // No changes made
  }
  
  if (DRY_RUN) {
    console.log(`\n📝 [DRY RUN] Would update: ${filePath}`);
    console.log(`   Namespace: 'editor' → '${newNamespace}'`);
    return true;
  }
  
  fs.writeFileSync(filePath, updatedContent, 'utf-8');
  console.log(`✅ Updated: ${filePath}`);
  console.log(`   Namespace: 'editor' → '${newNamespace}'`);
  return true;
}

async function main() {
  console.log('🔍 Finding components with useTranslation(\'editor\')...\n');
  
  // Find all JS/JSX/TS/TSX files in Editor3
  const files = await glob('src/components/Editor3/**/*.{js,jsx,ts,tsx}', {
    cwd: process.cwd(),
    absolute: true,
  });
  
  console.log(`📂 Found ${files.length} files in Editor3\n`);
  
  let updatedCount = 0;
  const namespaceCounts: Record<string, number> = {};
  
  for (const file of files) {
    const wasUpdated = await updateFile(file);
    if (wasUpdated) {
      updatedCount++;
      const namespace = getNamespaceForFile(file);
      namespaceCounts[namespace] = (namespaceCounts[namespace] || 0) + 1;
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 UPDATE SUMMARY');
  console.log('='.repeat(70));
  
  console.log(`\nTotal files scanned: ${files.length}`);
  console.log(`Files updated:       ${updatedCount}`);
  
  if (updatedCount > 0) {
    console.log('\nUpdates by namespace:');
    Object.entries(namespaceCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([namespace, count]) => {
        console.log(`  ${namespace.padEnd(25)} ${count} files`);
      });
  }
  
  if (DRY_RUN) {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 DRY RUN MODE - No files were modified');
    console.log('   Run without --dry-run to apply changes');
    console.log('='.repeat(70));
  } else if (updatedCount > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('✅ TRANSLATION IMPORTS UPDATED!');
    console.log('='.repeat(70));
    console.log('\nNext steps:');
    console.log('1. Test with: npm run dev');
    console.log('2. Check for missing translations in console');
    console.log('3. Update next-i18next.config.js (already done ✓)');
    console.log('4. Copy namespace files to other locales (ja, es, fr, de)');
  } else {
    console.log('\n✅ No updates needed - all imports already correct!');
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
