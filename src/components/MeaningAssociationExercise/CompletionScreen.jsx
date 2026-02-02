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
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  zIndex: 10,
  padding: 2,
  minHeight: '100%',
};

const paperStyle = {
  padding: 4,
  paddingBottom: 5,
  textAlign: 'center',
  maxWidth: '500px',
  backgroundColor: '#f8f9fa',
};

const iconStyle = {
  fontSize: '4rem',
  color: '#4caf50',
  marginBottom: '1rem',
};

export const CompletionScreen = ({
  levelName,
  accuracy,
  attempts,
  onContinue,
  nextLevelName,
  isLastLevel = false,
}) => {
  const [timeRemaining, setTimeRemaining] = React.useState(AUTO_ADVANCE_DELAY / 1000);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = React.useState(true);

  // Use ref to avoid re-creating interval when onContinue changes
  const onContinueRef = React.useRef(onContinue);
  React.useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  React.useEffect(() => {
    if (!autoAdvanceEnabled || isLastLevel) return;

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
  }, [autoAdvanceEnabled, isLastLevel]);

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
      <Paper elevation={3} sx={paperStyle}>
        <CheckCircleIcon style={iconStyle} />

        <Typography variant="h4" gutterBottom sx={{ color: '#2e7d32', fontWeight: 600 }}>
          {levelName} Complete! 🎉
        </Typography>

        <Box my={3}>
          <Typography variant="h6" gutterBottom>
            Your Score
          </Typography>
          <Typography variant="h3" sx={{ color: '#1976d2', fontWeight: 700 }}>
            {accuracyPercent}%
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {attempts} total attempt{attempts !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {!isLastLevel && (
          <Box my={3}>
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

        <Box mt={2}>
          {!isLastLevel ? (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleContinue}
              sx={{
                padding: '0.75rem 2rem',
                fontSize: '1.1rem',
              }}
            >
              Continue to {nextLevelName}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleContinue}
              sx={{
                padding: '0.75rem 2rem',
                fontSize: '1.1rem',
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
