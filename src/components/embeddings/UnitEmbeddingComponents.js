/**
 * Example Integration: Unit Editor with Embedding Generation
 * Shows how to integrate embedding generation into unit workflow
 */

import React from 'react';
import { Button, Box, CircularProgress, Alert, Chip } from '@mui/material';
import { useUnitEmbedding, useUnitPublish, useBatchSectionEmbeddings } from '../../hooks/useEmbeddings';
import PublishIcon from '@mui/icons-material/Publish';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from 'react-i18next';

/**
 * Unit Publishing Component with Embedding Generation
 * Place this in your unit editor
 */
export function UnitPublishButton({ unit }) {
  const { publishing, error, publish } = useUnitPublish(unit);
  const [published, setPublished] = React.useState(false);

  const handlePublish = async () => {
    try {
      await publish();
      setPublished(true);
      // Show success message
      setTimeout(() => setPublished(false), 3000);
    } catch (err) {
      console.error('Publish error:', err);
    }
  };

  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        startIcon={publishing ? <CircularProgress size={20} /> : <PublishIcon />}
        onClick={handlePublish}
        disabled={publishing || !unit}
      >
        {publishing ? 'Publishing...' : 'Publish Unit'}
      </Button>
      
      {published && (
        <Alert severity="success" sx={{ mt: 1 }}>
          Unit published with embeddings generated!
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          Error: {error.message}
        </Alert>
      )}
    </Box>
  );
}

/**
 * On-Demand Embedding Generator
 * Add to unit editor toolbar
 */
export function EmbeddingGenerateButton({ unitId, showSections = false }) {
  const { loading, error, result, generate } = useUnitEmbedding(unitId);
  const sections = useBatchSectionEmbeddings(unitId);

  const handleGenerate = async () => {
    try {
      await generate({ force: true });
      
      if (showSections) {
        await sections.generateAll();
      }
    } catch (err) {
      console.error('Generation error:', err);
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        size="small"
        startIcon={loading || sections.loading ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
        onClick={handleGenerate}
        disabled={loading || sections.loading}
      >
        {loading || sections.loading ? 'Generating...' : 'Generate Embeddings'}
      </Button>
      
      {result && (
        <Chip
          icon={<CheckCircleIcon />}
          label={result.cached ? 'Cached' : `${result.wordCount} words embedded`}
          color={result.cached ? 'default' : 'success'}
          size="small"
          sx={{ ml: 1 }}
        />
      )}
      
      {sections.summary && (
        <Chip
          label={`${sections.summary.success}/${sections.summary.total} sections`}
          color="info"
          size="small"
          sx={{ ml: 1 }}
        />
      )}
    </Box>
  );
}

/**
 * Embedding Status Indicator
 * Shows whether unit has fresh embeddings
 */
export function EmbeddingStatusIndicator({ unit }) {
  const hasEmbedding = unit?.embedding && unit?.embeddingVersion;
  const age = hasEmbedding ? Date.now() - unit.embeddingVersion : null;
  const isStale = age && age > 7 * 24 * 60 * 60 * 1000; // 7 days
  
  if (!hasEmbedding) {
    return (
      <Chip
        label="No embedding"
        color="default"
        size="small"
        variant="outlined"
      />
    );
  }
  
  if (isStale) {
    return (
      <Chip
        label="Embedding stale"
        color="warning"
        size="small"
      />
    );
  }
  
  return (
    <Chip
      icon={<CheckCircleIcon />}
      label="Embedding fresh"
      color="success"
      size="small"
    />
  );
}
