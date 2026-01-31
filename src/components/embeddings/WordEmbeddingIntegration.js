/**
 * Example Integration: Word Editor with Auto-Embedding
 * Shows how to integrate automatic embedding generation on word save
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAutoEmbedding } from '../../hooks/useEmbeddings';
import { Box, Alert, LinearProgress } from '@mui/material';

/**
 * Word Editor with Auto-Embedding
 * Wrap your existing word editor with this component
 */
export function WordEditorWithEmbedding({ wordId, children, onSaveComplete }) {
  const { t } = useTranslation('components');
  const {
    loading,
    error,
    result,
    generateForContent
  } = useAutoEmbedding('word', wordId);

  const [lastSaveTime, setLastSaveTime] = React.useState(null);

  // Hook into your existing save handler
  const handleWordSave = React.useCallback(async (wordData) => {
    try {
      // First, save the word normally (your existing logic)
      // await DataStore.save(wordData);
      
      // Then generate embedding automatically
      const embeddingResult = await generateForContent(wordData);
      
      setLastSaveTime(Date.now());
      
      if (onSaveComplete) {
        onSaveComplete(wordData, embeddingResult);
      }
    } catch (err) {
      console.error(t('wordEmbedding.questionSaveFailed'), err);
      throw err;
    }
  }, [generateForContent, onSaveComplete, t]);

  return (
    <Box>
      {loading && (
        <LinearProgress sx={{ mb: 2 }} />
      )}
      
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('wordEmbedding.embeddingFailed', { error: error.message })}
        </Alert>
      )}
      
      {result && result.wordCount > 0 && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => {}}>
          {t('wordEmbeddingIntegration.embeddingGenerated', { count: result.wordCount })}
        </Alert>
      )}
      
      {/* Pass save handler to children via context or props */}
      {React.cloneElement(children, { onSave: handleWordSave })}
    </Box>
  );
}

/**
 * Question Editor with Auto-Embedding
 * Similar pattern for questions
 */
export function QuestionEditorWithEmbedding({ questionId, children, onSaveComplete }) {
  const { t } = useTranslation('components');
  const {
    loading,
    error,
    result,
    generateForContent
  } = useAutoEmbedding('question', questionId);

  const handleQuestionSave = React.useCallback(async (questionData) => {
    try {
      // Save question normally
      // await DataStore.save(questionData);
      
      // Generate embedding
      await generateForContent(questionData);
      
      if (onSaveComplete) {
        onSaveComplete(questionData);
      }
    } catch (err) {
      console.error('Save with embedding error:', err);
      throw err;
    }
  }, [generateForContent, onSaveComplete]);

  return (
    <Box>
      {loading && (
        <LinearProgress sx={{ mb: 2 }} />
      )}
      
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('wordEmbeddingIntegration.embeddingFailed', { error: error.message })}
        </Alert>
      )}
      
      {/* Pass save handler to children */}
      {React.cloneElement(children, { onSave: handleQuestionSave })}
    </Box>
  );
}

/**
 * Example: Usage in existing Word component
 * 
 * Before:
 * <WordEditor wordId={wordId} onSave={handleSave} />
 * 
 * After:
 * <WordEditorWithEmbedding wordId={wordId}>
 *   <WordEditor wordId={wordId} />
 * </WordEditorWithEmbedding>
 */
