/**
 * AudioAutoSubmitWrapper - Wraps audio recording components with a grace period
 * countdown before submission, matching the SketchPad pattern.
 *
 * Uses render prop pattern so it works with both AudioWaveformPlayer
 * and RecordingStudio2.
 *
 * For AudioWaveformPlayer: intercepts onRecordingComplete
 * For RecordingStudio2: intercepts setFeedback
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import SubmissionCountdown from './SubmissionCountdown';

export default function AudioAutoSubmitWrapper({
  children,
  gracePeriod = 10,
}) {
  const [countdown, setCountdown] = useState(null);
  const [pendingArgs, setPendingArgs] = useState(null);
  const countdownTimerRef = useRef(null);
  const onSubmitRef = useRef(null);

  const cancelCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
    setPendingArgs(null);
    onSubmitRef.current = null;
  }, []);

  const startCountdown = useCallback((submitFn, args) => {
    cancelCountdown();
    onSubmitRef.current = () => submitFn(...args);
    setPendingArgs(args);

    setCountdown(gracePeriod);
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          onSubmitRef.current?.();
          onSubmitRef.current = null;
          setPendingArgs(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [gracePeriod, cancelCountdown]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  /**
   * Creates an intercepted version of onRecordingComplete for AudioWaveformPlayer.
   * Instead of calling the original callback immediately, starts a countdown.
   */
  const wrapOnRecordingComplete = useCallback((originalCallback) => {
    return (audioFile, uploadResult) => {
      startCountdown(originalCallback, [audioFile, uploadResult]);
    };
  }, [startCountdown]);

  /**
   * Creates an intercepted version of setFeedback for RecordingStudio2.
   * Instead of calling the original setFeedback immediately, starts a countdown.
   */
  const wrapSetFeedback = useCallback((originalSetFeedback) => {
    return (data) => {
      startCountdown(originalSetFeedback, [data]);
    };
  }, [startCountdown]);

  return (
    <Box>
      {children({ wrapOnRecordingComplete, wrapSetFeedback })}
      <SubmissionCountdown countdown={countdown} onCancel={cancelCountdown} />
    </Box>
  );
}
