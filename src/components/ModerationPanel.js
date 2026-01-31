import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import { useTranslation } from 'react-i18next';

/**
 * ModerationPanel Component
 * 
 * Detailed moderation information panel for instructors.
 * Shows flagged categories with scores and policy guidance.
 */
export default function ModerationPanel({ item, title }) {
  const { t } = useTranslation('components');
  if (!item || !item.moderationCheckedAt) {
    return null;
  }

  const isFlagged = item.moderationStatus === 'flagged';

  if (!isFlagged) {
    return null; // Don't show panel for approved content
  }

  let flags = {};
  try {
    flags = JSON.parse(item.moderationFlags || '{}');
  } catch (e) {
    console.error('Error parsing moderation flags:', e);
    return null;
  }

  const categories = flags.categories || {};
  const scores = flags.categoryScores || {};
  const model = flags.model || 'text-moderation-latest';

  const flaggedCategories = Object.entries(categories)
    .filter(([_, value]) => value === true)
    .map(([key]) => ({
      name: key.replace(/_/g, ' ').replace(/\//g, ' or '),
      score: scores[key] || 0,
      rawName: key
    }));

  if (flaggedCategories.length === 0) {
    return null;
  }

  const categoryDescriptions = {
    'hate': t('moderationPanel.categories.hate'),
    'hate threatening': t('moderationPanel.categories.hate threatening'),
    'harassment': t('moderationPanel.categories.harassment'),
    'harassment threatening': t('moderationPanel.categories.harassment threatening'),
    'self-harm': t('moderationPanel.categories.self-harm'),
    'self-harm intent': t('moderationPanel.categories.self-harm intent'),
    'self-harm instructions': t('moderationPanel.categories.self-harm instructions'),
    'sexual': t('moderationPanel.categories.sexual'),
    'sexual minors': t('moderationPanel.categories.sexual minors'),
    'violence': t('moderationPanel.categories.violence'),
    'violence graphic': t('moderationPanel.categories.violence graphic')
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        mb: 2,
        border: '2px solid',
        borderColor: 'warning.main'
      }}
    >
      <Alert severity="warning" icon={<WarningIcon />}>
        <AlertTitle sx={{ fontWeight: 'bold' }}>
          {title || t('moderationPanel.title')}
        </AlertTitle>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {t('moderationPanel.alertMessage')}
        </Typography>
      </Alert>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          {t('moderationPanel.flaggedCategories')}
        </Typography>
        <Stack spacing={1}>
          {flaggedCategories.map(({ name, score, rawName }) => (
            <Accordion key={rawName} defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Chip 
                    label={name} 
                    color="warning" 
                    size="small" 
                    sx={{ textTransform: 'capitalize' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {t('moderationPanel.confidence', { score: (score * 100).toFixed(1) })}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {categoryDescriptions[name] || t('moderationPanel.categories.fallback')}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Box>

      <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {t('moderationPanel.checked', { date: new Date(item.moderationCheckedAt).toLocaleString() })}
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          {t('moderationPanel.model', { model })}
        </Typography>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          <strong>{t('moderationPanel.disclaimerLabel')}</strong> {t('moderationPanel.disclaimerNote')}
        </Typography>
      </Box>
    </Paper>
  );
}
