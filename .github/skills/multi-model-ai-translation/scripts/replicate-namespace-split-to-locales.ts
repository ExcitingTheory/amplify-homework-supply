#!/usr/bin/env tsx
/**
 * Replicate namespace split from English to other locales
 * 
 * Usage:
 *   npx tsx scripts/replicate-namespace-split-to-locales.ts [--dry-run]
 * 
 * Splits editor.json in ja, es, fr, de directories the same way as English
 */

import fs from 'fs';
import path from 'path';

const LOCALES_DIR = path.join(process.cwd(), 'public/locales');
const SOURCE_LOCALE = 'en';
const TARGET_LOCALES = ['ja', 'es', 'fr', 'de'];
const DRY_RUN = process.argv.includes('--dry-run');

// Section-to-namespace mapping (same as split-editor-namespaces.ts)
const NAMESPACE_MAPPING = {
  'editor.authoring': [
    'toolBarPlugin',
    'tabsVerticalRight',
    'assignmentConfiguration',
    'toolbar',
    'configurationManager',
    'tabsVerticalLeft',
    'mainToolbar',
  ],
  
  'editor.files': [
    'fileManager2',
    'fileMetadataComponent',
    'documentUploader',
    'fileManager',
  ],
  
  'editor.ai': [
    'unifiedGenerateModal',
    'promptMethodSelector',
    'enhancedGenerators',
    'blockSuggestionMenu',
    'suggestedContent',
    'aiContentSuggestion',
  ],
  
  'editor.blocks': [
    'customAnswerEditor',
    'meaningAssociationEditor',
    'quizEditor',
    'answerEditor',
    'questionEditor',
  ],
  
  'workbook': [
    'answerComponent',
    'toolBarRoPlugin',
    'verticalTabsRo',
    'unitCompletedPlugin',
    'quizComponent',
    'meaningAssociationExercise',
    'customAnswerComponent',
  ],
  
  'editor.shared': [
    // Recording/Audio
    'recordingStudio3',
    'recordingStudioEnhanced',
    'recordingStudio',
    'audioWaveformPlayer',
    'staticWaveform',
    'sketchPad',
    
    // Embedding
    'unitEmbedding',
    'autoEmbedPlugin',
    'unitEmbeddingComponents',
    'wordEmbeddingIntegration',
    'wordEmbedding',
    
    // Display Plugins
    'imagesPlugin',
    'tablePlugin',
    'wordBlockPlugin',
    'vocabularyReview',
    'questionsReview',
    'tableComponent',
    'mediaPlayerComponent',
    'pdfViewerComponent',
    
    // UI Components
    'metadataEditor',
    'metadataField',
    'floatingLinkEditorPlugin',
    'imageMaskEditor',
    'freeSoloCreateOptionDialog',
    'insertLayoutDialog',
    'placeholders',
    'blocks',
    'questionBlock',
    'autocompleteNode',
    'tableOfContents',
    'imageResizer',
    'playlistEditor',
  ],
};

function countLines(obj: any): number {
  return JSON.stringify(obj, null, 2).split('\n').length;
}

async function splitLocaleEditorFile(locale: string) {
  const editorJsonPath = path.join(LOCALES_DIR, locale, 'editor.json');
  
  // Check if editor.json exists
  if (!fs.existsSync(editorJsonPath)) {
    console.log(`⚠️  Skipping ${locale}: editor.json not found`);
    return { locale, skipped: true, reason: 'file not found' };
  }
  
  console.log(`\n📂 Processing ${locale}/editor.json...`);
  
  const editorJson = JSON.parse(fs.readFileSync(editorJsonPath, 'utf-8'));
  const allSections = Object.keys(editorJson);
  
  console.log(`   Sections found: ${allSections.length}`);
  
  // Create namespace files
  const stats: any[] = [];
  let totalCreated = 0;
  
  for (const [namespace, sections] of Object.entries(NAMESPACE_MAPPING)) {
    const namespaceContent: Record<string, any> = {};
    let foundSections = 0;
    
    // Extract sections
    sections.forEach(section => {
      if (editorJson[section]) {
        namespaceContent[section] = editorJson[section];
        foundSections++;
      }
    });
    
    const lines = countLines(namespaceContent);
    stats.push({
      namespace,
      sections: foundSections,
      lines,
    });
    
    // Write file
    const filename = `${namespace}.json`;
    const filepath = path.join(LOCALES_DIR, locale, filename);
    
    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would create: ${filename} (${foundSections} sections, ${lines} lines)`);
    } else {
      fs.writeFileSync(
        filepath,
        JSON.stringify(namespaceContent, null, 2) + '\n',
        'utf-8'
      );
      console.log(`   ✅ Created: ${filename} (${foundSections} sections, ${lines} lines)`);
      totalCreated++;
    }
  }
  
  // Backup original
  if (!DRY_RUN) {
    const backupPath = path.join(LOCALES_DIR, locale, 'editor.json.backup');
    fs.renameSync(editorJsonPath, backupPath);
    console.log(`   📦 Backed up: editor.json → editor.json.backup`);
  }
  
  return { locale, stats, created: totalCreated, skipped: false };
}

async function main() {
  console.log('🌍 Replicating namespace split to other locales...\n');
  console.log(`Source: ${SOURCE_LOCALE} (already split)`);
  console.log(`Targets: ${TARGET_LOCALES.join(', ')}\n`);
  console.log('='.repeat(70));
  
  const results = [];
  
  for (const locale of TARGET_LOCALES) {
    const result = await splitLocaleEditorFile(locale);
    results.push(result);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 REPLICATION SUMMARY');
  console.log('='.repeat(70));
  
  const processed = results.filter(r => !r.skipped);
  const skipped = results.filter(r => r.skipped);
  
  if (processed.length > 0) {
    console.log('\n✅ Processed Locales:');
    processed.forEach(({ locale, created }) => {
      console.log(`   ${locale}: ${created || 6} namespace files created`);
    });
  }
  
  if (skipped.length > 0) {
    console.log('\n⚠️  Skipped Locales:');
    skipped.forEach(({ locale, reason }) => {
      console.log(`   ${locale}: ${reason}`);
    });
  }
  
  if (DRY_RUN) {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 DRY RUN MODE - No files were created');
    console.log('   Run without --dry-run to apply changes');
    console.log('='.repeat(70));
  } else if (processed.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('✅ NAMESPACE REPLICATION COMPLETE!');
    console.log('='.repeat(70));
    console.log('\nAll locales now have the same namespace structure:');
    console.log('  • editor.authoring.json');
    console.log('  • editor.files.json');
    console.log('  • editor.ai.json');
    console.log('  • editor.blocks.json');
    console.log('  • workbook.json');
    console.log('  • editor.shared.json');
    console.log('\nOriginal editor.json files backed up as editor.json.backup');
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
