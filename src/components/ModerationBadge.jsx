import React from 'react';
import { Chip, Tooltip, Box } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslations } from 'next-intl';

/**
 * ModerationBadge Component
 * 
 * Displays a visual indicator of content moderation status.
 * Shows warnings for flagged content but doesn't block it.
 * Instructors can see what categories were flagged.
 */
export default function ModerationBadge({ item, showDetails = false }) {
  const t = useTranslations('components');
  if (!item || !item.moderationCheckedAt) {
    return null; // Not yet moderated
  }

  const isFlagged = item.moderationStatus === 'flagged';
  
  // Parse flagged categories
  let flaggedCategories = [];
  let categoryScores = {};
  
  if (isFlagged && item.moderationFlags) {
    try {
      const flags = JSON.parse(item.moderationFlags);
      if (flags.categories) {
        flaggedCategories = Object.entries(flags.categories)
          .filter(([_, value]) => value === true)
          .map(([key]) => key.replace(/_/g, ' ').replace(/\//g, ' or '));
      }
      if (flags.categoryScores) {
        categoryScores = flags.categoryScores;
      }
    } catch (e) {
      console.error('Error parsing moderation flags:', e);
    }
  }

  if (!isFlagged) {
    // Don't show "approved" badges by default to reduce clutter
    return showDetails ? (
      <Chip
        icon={<CheckCircleIcon />}
        label={t('moderationBadge.approved')}
        size="small"
        color="success"
        variant="outlined"
        sx={{ fontSize: '0.75rem' }}
      />
    ) : null;
  }

  // Build tooltip content for flagged items
  const tooltipContent = (
    <Box>
      <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>
        {t('moderationBadge.flaggedForReview')}
      </Box>
      <Box sx={{ fontSize: '0.85rem' }}>
        {t('moderationBadge.categories')}: {flaggedCategories.join(', ')}
      </Box>
      <Box sx={{ fontSize: '0.75rem', mt: 0.5, fontStyle: 'italic' }}>
        {t('moderationBadge.savedMessage')}
      </Box>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow>
      <Chip
        icon={<WarningIcon />}
        label={showDetails ? t('moderationBadge.flaggedWithCategories', { categories: flaggedCategories.join(', ') }) : t('moderationBadge.flagged')}
        size="small"
        color="warning"
        sx={{ 
          fontSize: '0.75rem',
          cursor: 'help'
        }}
      />
    </Tooltip>
  );
}

/**
 * ModerationStatusIcon Component
 * 
 * Simple icon-only indicator for compact layouts
 */
export function ModerationStatusIcon({ item }) {
  const t = useTranslations('components');
  
  if (!item || !item.moderationCheckedAt) {
    return null;
  }

  const isFlagged = item.moderationStatus === 'flagged';

  if (!isFlagged) {
    return null; // Don't show check for approved items
  }

  let flaggedCategories = [];
  if (item.moderationFlags) {
    try {
      const flags = JSON.parse(item.moderationFlags);
      if (flags.categories) {
        flaggedCategories = Object.entries(flags.categories)
          .filter(([_, value]) => value === true)
          .map(([key]) => key.replace(/_/g, ' ').replace(/\//g, ' or '));
      }
    } catch (e) {
      console.error('Error parsing moderation flags:', e);
    }
  }

  return (
    <Tooltip 
      title={t('moderationBadge.flaggedWithCategories', { categories: flaggedCategories.join(', ') })}
      arrow
    >
      <WarningIcon 
        color="warning" 
        sx={{ 
          fontSize: '1.2rem',
          cursor: 'help',
          verticalAlign: 'middle'
        }} 
      />
    </Tooltip>
  );
}
