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

/**
 * ModerationPanel Component
 * 
 * Detailed moderation information panel for instructors.
 * Shows flagged categories with scores and policy guidance.
 */
export default function ModerationPanel({ item, title = "Content Moderation" }) {
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
    'hate': 'Content promoting hate based on race, gender, ethnicity, religion, etc.',
    'hate threatening': 'Hateful content that includes violence or serious harm',
    'harassment': 'Content intended to harass, threaten, or bully an individual',
    'harassment threatening': 'Harassment content that includes violence or serious harm',
    'self-harm': 'Content promoting, encouraging, or depicting acts of self-harm',
    'self-harm intent': 'Content where someone expresses intent to engage in self-harm',
    'self-harm instructions': 'Content encouraging or providing instructions for self-harm',
    'sexual': 'Content meant to arouse sexual excitement',
    'sexual minors': 'Sexual content involving individuals under 18',
    'violence': 'Content depicting death, violence, or physical injury',
    'violence graphic': 'Graphic content depicting death, violence, or physical injury'
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
          {title}
        </AlertTitle>
        <Typography variant="body2" sx={{ mb: 1 }}>
          This content has been flagged by automated moderation. It has been saved, but may require review according to your institution's policies.
        </Typography>
      </Alert>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Flagged Categories:
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
                    Confidence: {(score * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {categoryDescriptions[name] || 'Content flagged in this category.'}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Box>

      <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Checked: {new Date(item.moderationCheckedAt).toLocaleString()}
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          Model: {model}
        </Typography>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          <strong>Note:</strong> Automated moderation is not perfect. Please review this content in context and handle according to your institution's specific policies and local jurisdiction requirements.
        </Typography>
      </Box>
    </Paper>
  );
}
