#!/usr/bin/env tsx

/**
 * Move translation keys from one namespace to another
 * Based on namespace mismatches from verification report
 */

import fs from 'fs';
import path from 'path';

const LOCALE_DIR = path.join(process.cwd(), 'public/locales/en');

// Keys to move from editor to components (from the report)
const KEYS_TO_MOVE = [
  'authenticator.nameLabel',
  'authenticator.namePlaceholder',
  'authenticator.emailLabel',
  'authenticator.emailPlaceholder',
  'authenticator.passwordLabel',
  'authenticator.passwordPlaceholder',
  'authenticator.confirmPasswordLabel',
  'vocabularyReview.sectionHeading',
  'svgPreview.emptyState',
  'svgPreview.caption',
  'sortableAnswers.answerLabel',
  'sortableAnswers.correct',
  'sortableAnswers.incorrect',
  'sectionAssigner.dialogTitle',
  'sectionAssigner.dueDate',
  'sectionAssigner.selectSection',
  'sectionAssigner.cancel',
  'sectionAssigner.assign',
  'savedPdfThumbnail.errorMessage',
  'savedPdfThumbnail.pageOverlay',
  'recordingStudioEnhanced.trackName',
  'recordingStudioEnhanced.deleteLastTrackAlert',
  'recordingStudioEnhanced.micAccessError',
  'recordingStudioEnhanced.selectToCut',
  'recordingStudioEnhanced.enterPrompt',
  'recordingStudioEnhanced.ttsNotImplemented',
  'recordingStudioEnhanced.ttsGenerationFailed',
  'recordingStudioEnhanced.audioFilters',
  'recordingStudioEnhanced.noiseReduction',
  'recordingStudioEnhanced.none',
  'recordingStudioEnhanced.light',
  'recordingStudioEnhanced.medium',
  'recordingStudioEnhanced.heavy',
  'recordingStudioEnhanced.speechEnhancement',
  'recordingStudioEnhanced.clarity',
  'recordingStudioEnhanced.presence',
  'recordingStudioEnhanced.broadcast',
  'recordingStudioEnhanced.cutTooltip',
  'recordingStudioEnhanced.addTrack',
  'recordingStudioEnhanced.voice',
  'recordingStudioEnhanced.promptPlaceholder',
  'recordingStudioEnhanced.generate',
  'recordingStudio2.recordingNumber',
  'recordingStudio2.existingRecordings',
  'recordingStudio2.staticWaveformPreview',
  'recordingStudio2.recordedAudioWaveform',
  'questionsReview.hasAudio',
  'questionsReview.hasImage',
  'questionsReview.questionPrompt',
  'questionsReview.enterQuestion',
  'questionsReview.hintOptional',
  'questionsReview.enterHint',
  'questionsReview.answer',
  'questionsReview.enterAnswer',
  'questionsReview.loading',
  'questionsReview.noQuestions',
  'questionsReview.sectionHeading',
  'questionsReview.from',
  'questionsReview.pages',
  'questionsReview.importedOn',
  'questionsReview.filteringBySearch',
  'questionsReview.hide',
  'questionsReview.show',
  'questionsReview.summariesAndObjectives',
  'questionsReview.summaries',
  'questionsReview.learningObjectives',
  'questionsReview.deselectAll',
  'questionsReview.selectAll',
  'questionsReview.selectedCount',
  'questionsReview.importToQuestionBank',
  'questionEditor.dialogTitle',
  'questionEditor.save',
  'questionBlock.answerLabel',
  'questionBlock.correct',
  'questionBlock.incorrect',
  'questionBlock.edit',
  'questionBlock.reset',
  'questionBlock.gradeDisplay',
  'questionBlock.invalid',
  'questionBlock.done',
  'questionBlock.remove',
  'questionBlock.addAnswerPlaceholder',
  'pdfThumbnail.failedToLoad',
  'pdfThumbnail.pageNumber',
  'moderationPanel.categories.hate',
  'moderationPanel.categories.hate threatening',
  'moderationPanel.categories.harassment',
  'moderationPanel.categories.harassment threatening',
  'moderationPanel.categories.self-harm',
  'moderationPanel.categories.self-harm intent',
  'moderationPanel.categories.self-harm instructions',
  'moderationPanel.categories.sexual',
  'moderationPanel.categories.sexual minors',
  'moderationPanel.categories.violence',
  'moderationPanel.categories.violence graphic',
  'moderationPanel.title',
  'moderationPanel.alertMessage',
  'moderationPanel.flaggedCategories',
  'moderationPanel.confidence',
  'moderationPanel.categories.fallback',
  'moderationPanel.checked',
  'moderationPanel.model',
  'moderationPanel.disclaimerLabel',
  'moderationPanel.disclaimerNote',
  'moderationBadge.approved',
  'moderationBadge.flaggedForReview',
  'moderationBadge.categories',
  'moderationBadge.savedMessage',
  'moderationBadge.flaggedWithCategories',
  'moderationBadge.flagged',
  'documentSourceBadge.sourcePrefix',
  'documentSourceBadge.pagePrefix',
  'wordEmbedding.questionSaveFailed',
  'wordEmbedding.embeddingFailed',
  'screenplayEditor.formatLabel',
  'screenplayEditor.placeholder',
];

function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
}

function deleteNestedKey(obj: any, path: string): boolean {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current || typeof current !== 'object' || !(part in current)) {
      return false;
    }
    current = current[part];
  }
  
  const lastPart = parts[parts.length - 1];
  if (lastPart in current) {
    delete current[lastPart];
    return true;
  }
  
  return false;
}

function sortObjectKeys(obj: any): any {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }
  
  const sorted: any = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  
  return sorted;
}

function loadJSON(namespace: string): any {
  const filePath = path.join(LOCALE_DIR, `${namespace}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveJSON(namespace: string, data: any): void {
  const filePath = path.join(LOCALE_DIR, `${namespace}.json`);
  const sorted = sortObjectKeys(data);
  fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}

async function main() {
  console.log('🔄 Moving keys from editor.json to components.json...\n');
  
  const editor = loadJSON('editor');
  const components = loadJSON('components');
  
  let movedCount = 0;
  let notFoundCount = 0;
  
  for (const key of KEYS_TO_MOVE) {
    const value = getNestedValue(editor, key);
    
    if (value !== undefined) {
      // Copy to components
      setNestedValue(components, key, value);
      
      // Remove from editor
      deleteNestedKey(editor, key);
      
      movedCount++;
      console.log(`✓ Moved ${key}`);
    } else {
      notFoundCount++;
      console.log(`⚠️  Not found in editor: ${key}`);
    }
  }
  
  // Save both files
  saveJSON('editor', editor);
  saveJSON('components', components);
  
  console.log(`\n✅ Successfully moved ${movedCount} keys`);
  if (notFoundCount > 0) {
    console.log(`⚠️  ${notFoundCount} keys not found in editor.json`);
  }
  console.log('\n💾 Files saved and sorted alphabetically');
}

main();
