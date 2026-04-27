import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

/**
 * Inline countdown UI shown before auto-submitting an answer.
 * Reuses the SketchPad's grace period pattern and translation keys.
 */
export default function SubmissionCountdown({ countdown, onCancel, onSubmitNow }) {
  const { t } = useTranslation('editor.shared');

  if (countdown === null || countdown === undefined) return null;

  return (
    <Box sx={{
      p: 1,
      bgcolor: 'warning.light',
      color: 'warning.contrastText',
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'warning.main',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0.5,
    }}>
      <Typography variant="caption" sx={{ fontWeight: 500, textAlign: 'center', lineHeight: 1.3, color: 'inherit' }}>
        {t('autoSubmit.submittingInSeconds', { countdown })}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={onSubmitNow}
      >
        {t('autoSubmit.submitNow', 'Submit Now')}
      </Button>
      <Button
        variant="outlined"
        color="warning"
        size="small"
        onClick={onCancel}
      >
        {t('autoSubmit.cancelSubmission')}
      </Button>
    </Box>
  );
}
