/**
 * @module CompletionScreen
 * @category Components
 * @description Completion screen shown after finishing a level
 * 
 * Replaces the exercise tab content with score stats and a continue button.
 * Auto-advances to next level after a timeout (once only).
 */

import * as React from 'react';
import { Box, Button, Typography, Paper, LinearProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const AUTO_ADVANCE_DELAY = 5000; // 5 seconds

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'background.paper',
  padding: 2,
  height: '100%',
  width: '100%',
  overflow: 'auto',
  boxSizing: 'border-box',
};

const paperStyle = {
  padding: 4,
  paddingBottom: 5,
  textAlign: 'center',
  maxWidth: '500px',
  width: '100%',
  backgroundColor: 'grey.100',
  maxHeight: '100%',
  overflowY: 'auto',
  boxSizing: 'border-box',
};

export const CompletionScreen = ({
  levelName,
  accuracy,
  attempts,
  onContinue,
  onDismiss,
  nextLevelName,
  isLastLevel = false,
  disableAutoAdvance = false,
  showRetry = false,
  onRetry = null,
  vocabularyList = null,
}) => {
  const [timeRemaining, setTimeRemaining] = React.useState(AUTO_ADVANCE_DELAY / 1000);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = React.useState(!disableAutoAdvance);
  const hasAutoAdvanced = React.useRef(false);

  const onContinueRef = React.useRef(onContinue);
  React.useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  // Auto-advance timer: 1 update per second
  React.useEffect(() => {
    if (!autoAdvanceEnabled || isLastLevel || disableAutoAdvance || hasAutoAdvanced.current) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!hasAutoAdvanced.current) {
            hasAutoAdvanced.current = true;
            onContinueRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoAdvanceEnabled, isLastLevel, disableAutoAdvance]);

  const handleContinue = React.useCallback(() => {
    hasAutoAdvanced.current = true;
    setAutoAdvanceEnabled(false);
    onContinueRef.current();
  }, []);

  const handleDismiss = React.useCallback(() => {
    hasAutoAdvanced.current = true;
    setAutoAdvanceEnabled(false);
    if (onDismiss) {
      onDismiss();
    }
  }, [onDismiss]);

  const accuracyPercent = React.useMemo(() => Math.round((accuracy || 0) * 100), [accuracy]);
  const progressPercent = React.useMemo(
    () => ((AUTO_ADVANCE_DELAY / 1000 - timeRemaining) / (AUTO_ADVANCE_DELAY / 1000)) * 100,
    [timeRemaining]
  );

  return (
    <Box sx={containerStyle}>
      <Paper elevation={3} sx={{
        ...paperStyle,
        padding: { xs: 2, sm: 4 },
        paddingBottom: { xs: 3, sm: 5 },
      }}>
        <CheckCircleIcon sx={{
          fontSize: { xs: '3rem', sm: '4rem' },
          color: 'success.main',
          marginBottom: '1rem',
        }} />

        <Typography variant="h4" gutterBottom sx={{ 
          color: 'success.dark', 
          fontWeight: 600,
          fontSize: { xs: '1.5rem', sm: '2.125rem' },
        }}>
          {levelName} Complete!
        </Typography>

        <Box my={{ xs: 2, sm: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Your Score
          </Typography>
          <Typography variant="h3" sx={{ 
            color: 'primary.main', 
            fontWeight: 700,
            fontSize: { xs: '2rem', sm: '3rem' },
          }}>
            {accuracyPercent}%
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {attempts} total attempt{attempts !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {vocabularyList && (
          <Box my={{ xs: 2, sm: 3 }} sx={{ maxHeight: '200px', overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Vocabulary Learned
            </Typography>
            <Box sx={{ textAlign: 'left', paddingLeft: 2 }}>
              {vocabularyList}
            </Box>
          </Box>
        )}

        {!isLastLevel && !disableAutoAdvance && (
          <Box my={{ xs: 2, sm: 3 }}>
            <Typography variant="body1" gutterBottom>
              Ready for <strong>{nextLevelName}</strong>?
            </Typography>
            {autoAdvanceEnabled && (
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Auto-advancing in {timeRemaining}s...
              </Typography>
            )}
          </Box>
        )}

        <Box mt={2} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {onDismiss && (
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              onClick={handleDismiss}
              sx={{
                padding: { xs: '0.5rem 1.5rem', sm: '0.75rem 2rem' },
                fontSize: { xs: '1rem', sm: '1.1rem' },
              }}
            >
              Back
            </Button>
          )}
          {showRetry && onRetry && (
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={onRetry}
              sx={{
                padding: { xs: '0.5rem 1.5rem', sm: '0.75rem 2rem' },
                fontSize: { xs: '1rem', sm: '1.1rem' },
              }}
            >
              Try Again
            </Button>
          )}
          {!isLastLevel ? (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleContinue}
              sx={{
                padding: { xs: '0.5rem 1.5rem', sm: '0.75rem 2rem' },
                fontSize: { xs: '1rem', sm: '1.1rem' },
              }}
            >
              {disableAutoAdvance ? nextLevelName : `Continue to ${nextLevelName}`}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleContinue}
              sx={{
                padding: { xs: '0.5rem 1.5rem', sm: '0.75rem 2rem' },
                fontSize: { xs: '1rem', sm: '1.1rem' },
              }}
            >
              Finish Exercise
            </Button>
          )}
        </Box>

        {!isLastLevel && autoAdvanceEnabled && (
          <Button
            variant="text"
            size="small"
            onClick={() => setAutoAdvanceEnabled(false)}
            sx={{ marginTop: '1rem' }}
          >
            Cancel auto-advance
          </Button>
        )}
      </Paper>
    </Box>
  );
};
