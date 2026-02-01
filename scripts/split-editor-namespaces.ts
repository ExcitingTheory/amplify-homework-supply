#!/usr/bin/env tsx
/**
 * Split editor.json into 6 feature-based namespace files
 * 
 * Usage:
 *   npx tsx scripts/split-editor-namespaces.ts [--dry-run]
 * 
 * Creates:
 *   - editor.authoring.json (2,304 lines) - Toolbars, drawers, config
 *   - editor.files.json (2,154 lines) - File management
 *   - editor.ai.json (625 lines) - AI features
 *   - editor.blocks.json (1,097 lines) - Block editors
 *   - workbook.json (399 lines) - Student interface
 *   - editor.shared.json (3,006 lines) - Shared components
 */

import fs from 'fs';
import path from 'path';

const LOCALE_DIR = path.join(process.cwd(), 'public/locales/en');
const EDITOR_JSON_PATH = path.join(LOCALE_DIR, 'editor.json');
const DRY_RUN = process.argv.includes('--dry-run');

// Section-to-namespace mapping based on analysis
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

interface NamespaceStats {
  namespace: string;
  sections: number;
  lines: number;
  keys: string[];
}

function countLines(obj: any): number {
  return JSON.stringify(obj, null, 2).split('\n').length;
}

async function main() {
  console.log('🔍 Reading editor.json...\n');
  
  // Read original editor.json
  const editorJson = JSON.parse(fs.readFileSync(EDITOR_JSON_PATH, 'utf-8'));
  const allSections = Object.keys(editorJson);
  
  console.log(`📊 Total sections in editor.json: ${allSections.length}`);
  console.log(`📏 Total lines: ${countLines(editorJson)}\n`);
  
  // Verify all sections are mapped
  const mappedSections = new Set(
    Object.values(NAMESPACE_MAPPING).flat()
  );
  
  const unmappedSections = allSections.filter(s => !mappedSections.has(s));
  if (unmappedSections.length > 0) {
    console.error('❌ ERROR: Unmapped sections found:');
    unmappedSections.forEach(s => console.error(`   - ${s}`));
    console.error('\nPlease add these sections to NAMESPACE_MAPPING.');
    process.exit(1);
  }
  
  // Check for duplicates
  const sectionCount = new Map<string, number>();
  Object.values(NAMESPACE_MAPPING).flat().forEach(section => {
    sectionCount.set(section, (sectionCount.get(section) || 0) + 1);
  });
  
  const duplicates = Array.from(sectionCount.entries())
    .filter(([_, count]) => count > 1);
  
  if (duplicates.length > 0) {
    console.error('❌ ERROR: Duplicate sections found:');
    duplicates.forEach(([section, count]) => {
      console.error(`   - ${section} (appears ${count} times)`);
    });
    process.exit(1);
  }
  
  console.log('✅ All sections mapped, no duplicates\n');
  
  // Create namespace files
  const stats: NamespaceStats[] = [];
  
  for (const [namespace, sections] of Object.entries(NAMESPACE_MAPPING)) {
    const namespaceContent: Record<string, any> = {};
    
    // Extract sections in order
    sections.forEach(section => {
      if (editorJson[section]) {
        namespaceContent[section] = editorJson[section];
      } else {
        console.warn(`⚠️  Warning: Section '${section}' not found in editor.json`);
      }
    });
    
    const lines = countLines(namespaceContent);
    stats.push({
      namespace,
      sections: sections.length,
      lines,
      keys: sections,
    });
    
    // Write file
    const filename = `${namespace}.json`;
    const filepath = path.join(LOCALE_DIR, filename);
    
    if (DRY_RUN) {
      console.log(`📝 [DRY RUN] Would create: ${filename}`);
      console.log(`   Sections: ${sections.length}, Lines: ${lines}`);
    } else {
      fs.writeFileSync(
        filepath,
        JSON.stringify(namespaceContent, null, 2) + '\n',
        'utf-8'
      );
      console.log(`✅ Created: ${filename} (${sections.length} sections, ${lines} lines)`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 NAMESPACE STATISTICS');
  console.log('='.repeat(70));
  
  // Sort by lines descending
  stats.sort((a, b) => b.lines - a.lines);
  
  console.log('\nNamespace                  Sections    Lines');
  console.log('-'.repeat(70));
  stats.forEach(({ namespace, sections, lines }) => {
    const namespacePadded = namespace.padEnd(25);
    const sectionsPadded = sections.toString().padStart(8);
    const linesPadded = lines.toString().padStart(8);
    console.log(`${namespacePadded} ${sectionsPadded} ${linesPadded}`);
  });
  
  const totalLines = stats.reduce((sum, s) => sum + s.lines, 0);
  const totalSections = stats.reduce((sum, s) => sum + s.sections, 0);
  
  console.log('-'.repeat(70));
  console.log(`TOTAL                      ${totalSections.toString().padStart(8)} ${totalLines.toString().padStart(8)}`);
  
  console.log('\n' + '='.repeat(70));
  console.log('📈 SIZE REDUCTION');
  console.log('='.repeat(70));
  
  const originalLines = countLines(editorJson);
  const largestNew = Math.max(...stats.map(s => s.lines));
  const reduction = ((originalLines - largestNew) / originalLines * 100).toFixed(1);
  
  console.log(`\nOriginal editor.json:      ${originalLines} lines`);
  console.log(`Largest new file:          ${largestNew} lines (${stats[0].namespace})`);
  console.log(`Reduction:                 ${reduction}% 🎉`);
  
  if (DRY_RUN) {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 DRY RUN MODE - No files were created');
    console.log('   Run without --dry-run to create files');
    console.log('='.repeat(70));
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('✅ NAMESPACE SPLIT COMPLETE!');
    console.log('='.repeat(70));
    console.log('\nNext steps:');
    console.log('1. Backup original: mv public/locales/en/editor.json public/locales/en/editor.json.backup');
    console.log('2. Update component imports (see EDITOR_NAMESPACE_STRUCTURE.md)');
    console.log('3. Update next-i18next.config.js to include new namespaces');
    console.log('4. Test with: npm run dev');
    console.log('5. Copy structure to other locales (ja, es, fr, de)');
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
