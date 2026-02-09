/**
 * @module CompletionScreen
 * @category Components
 * @description Completion screen shown after finishing a level
 * 
 * Shows congratulations message, score stats, and auto-advances to next level
 * after a timeout (or user can click to continue immediately).
 */

import * as React from 'react';
import { Box, Button, Typography, Paper, LinearProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const AUTO_ADVANCE_DELAY = 5000; // 5 seconds

// Static styles defined outside component to avoid recreation
const containerStyle = {
  position: 'relative',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  border: '2px solid #e0e0e0',
  borderRadius: '8px',
  zIndex: 1,
  padding: 2,
  minHeight: '100%',
  height: '100%',
  maxHeight: '100%',
  overflow: 'auto',
  boxSizing: 'border-box',
};

const paperStyle = {
  padding: 4,
  paddingBottom: 5,
  textAlign: 'center',
  maxWidth: '500px',
  width: '100%',
  backgroundColor: '#f8f9fa',
  maxHeight: '100%',
  overflowY: 'auto',
  boxSizing: 'border-box',
};

export const CompletionScreen = ({
  levelName,
  accuracy,
  attempts,
  onContinue,
  nextLevelName,
  isLastLevel = false,
  disableAutoAdvance = false,
  showRetry = false,
  onRetry = null,
  vocabularyList = null,
}) => {
  const [timeRemaining, setTimeRemaining] = React.useState(AUTO_ADVANCE_DELAY / 1000);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = React.useState(!disableAutoAdvance);

  // Use ref to avoid re-creating interval when onContinue changes
  const onContinueRef = React.useRef(onContinue);
  React.useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  React.useEffect(() => {
    if (!autoAdvanceEnabled || isLastLevel || disableAutoAdvance) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0.25) {
          clearInterval(timer);
          onContinueRef.current();
          return 0;
        }
        return prev - 0.25;
      });
    }, 250); // Reduced from 100ms to 250ms (4 updates/sec instead of 10)

    return () => clearInterval(timer);
  }, [autoAdvanceEnabled, isLastLevel, disableAutoAdvance]);

  const handleContinue = React.useCallback(() => {
    setAutoAdvanceEnabled(false);
    onContinueRef.current();
  }, []);

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
          color: '#4caf50',
          marginBottom: '1rem',
        }} />

        <Typography variant="h4" gutterBottom sx={{ 
          color: '#2e7d32', 
          fontWeight: 600,
          fontSize: { xs: '1.5rem', sm: '2.125rem' },
        }}>
          {levelName} Complete! 🎉
        </Typography>

        <Box my={{ xs: 2, sm: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Your Score
          </Typography>
          <Typography variant="h3" sx={{ 
            color: '#1976d2', 
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
              <>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Auto-advancing in {Math.ceil(timeRemaining)}s...
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progressPercent}
                  sx={{ marginTop: '0.5rem', marginBottom: '1rem' }}
                />
              </>
            )}
          </Box>
        )}

        <Box mt={2} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
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
