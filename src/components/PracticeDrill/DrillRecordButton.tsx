/**
 * @fileoverview DrillRecordButton — Inline record button for pronunciation
 * drills. Records audio via MediaRecorder, uploads to S3, and calls
 * verifyAudioUrl (Whisper + GPT) to grade pronunciation accuracy.
 */

import React, { useState, useCallback, useRef } from 'react'
import { IconButton, CircularProgress, Tooltip, Box, Typography, Chip } from '@mui/material'
import MicIcon from '@mui/icons-material/Mic'
import StopIcon from '@mui/icons-material/Stop'
import ReplayIcon from '@mui/icons-material/Replay'
import { useTranslation } from 'next-i18next'
import MicLevelIndicator from '../Editor3/components/MicLevelIndicator'

// ============================================================================
// Types
// ============================================================================

export interface VerifyResult {
  correct: boolean
  score: number
  feedback: string
  audioUrl?: string
}

export interface DrillRecordButtonProps {
  /** The text the student should pronounce */
  targetText: string
  /** ISO 639-1 language code for Whisper hint */
  targetLanguage?: string
  /** Block ID for saving results */
  blockId: string
  /** Practice session ID for S3 path */
  sessionId: string
  /** Callback with verification result */
  onResult: (result: VerifyResult) => void
  /** Max recording attempts */
  maxAttempts?: number
  /** Disable the button */
  disabled?: boolean
}

// ============================================================================
// Component
// ============================================================================

export default function DrillRecordButton({
  targetText,
  targetLanguage,
  blockId,
  sessionId,
  onResult,
  maxAttempts = 3,
  disabled = false,
}: DrillRecordButtonProps) {
  const { t } = useTranslation('components')
  const [state, setState] = useState<'idle' | 'recording' | 'uploading' | 'verifying' | 'result'>('idle')
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [attemptCount, setAttemptCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [recordingAnalyser, setRecordingAnalyser] = useState<AnalyserNode | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const canRetry = attemptCount < maxAttempts

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Create AudioContext + AnalyserNode for MicLevelIndicator
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      source.connect(analyser)
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8
      setRecordingAnalyser(analyser)

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        // Clean up stream
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        setRecordingAnalyser(null)
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (blob.size === 0) {
          setError(t('practiceDrill.pronunciation.emptyRecording', 'No audio recorded'))
          setState('idle')
          return
        }

        await uploadAndVerify(blob)
      }

      mediaRecorder.start()
      setState('recording')
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError(t('practiceDrill.pronunciation.micDenied', 'Enable microphone access to practice pronunciation.'))
      } else {
        setError(t('practiceDrill.pronunciation.recordError', 'Failed to start recording'))
      }
      setState('idle')
    }
  }, [t])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setState('uploading')
    }
  }, [])

  const uploadAndVerify = async (blob: Blob) => {
    try {
      setState('uploading')
      const attempt = attemptCount + 1
      setAttemptCount(attempt)

      // Upload to S3
      const { uploadData } = await import('aws-amplify/storage')
      const { fetchAuthSession } = await import('aws-amplify/auth')
      const session = await fetchAuthSession()
      const identityId = session.identityId || 'unknown'
      const s3Path = `protected/${identityId}/practice/${sessionId}/${blockId}-attempt-${attempt}.webm`

      await uploadData({
        path: s3Path,
        data: blob,
        options: { contentType: 'audio/webm' },
      }).result

      // Get presigned URL for verification
      const { default: getCachedUrl } = await import('../../utils/getCachedUrl')
      const audioUrl = await getCachedUrl(s3Path, 'protected', identityId)

      // Verify via Whisper + GPT
      setState('verifying')
      const { getAmplifyClient } = await import('../../utils/amplifyClient')
      const client = getAmplifyClient()
      const { data, errors } = await client.queries.verifyAudioUrl({
        expected: targetText,
        audioUrl,
        model: 'whisper-1',
        chatModel: 'gpt-4o',
      })

      if (errors && errors.length > 0) {
        throw new Error(errors[0]?.message || 'Verification failed')
      }

      const verifyResult: VerifyResult = {
        correct: false,
        score: 0,
        feedback: '',
        audioUrl: s3Path,
      }

      if (data) {
        try {
          const parsed = JSON.parse(data)
          verifyResult.correct = parsed.correct ?? parsed.answer ?? false
          verifyResult.score = parsed.score ?? (verifyResult.correct ? 100 : 0)
          verifyResult.feedback = parsed.feedback ?? parsed.reason ?? ''
        } catch {
          verifyResult.feedback = data
        }
      }

      setResult(verifyResult)
      setState('result')
      onResult(verifyResult)
    } catch (err: any) {
      console.error('[DrillRecordButton] Upload/verify error:', err)
      setError(err.message || 'Verification failed')
      setState('idle')
    }
  }

  const handleRetry = useCallback(() => {
    setResult(null)
    setState('idle')
  }, [])

  // Render based on state
  const isWorking = state === 'uploading' || state === 'verifying'

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {state === 'idle' && (
        <Tooltip title={t('practiceDrill.pronunciation.record', 'Record pronunciation')}>
          <span>
            <IconButton
              size="small"
              onClick={startRecording}
              disabled={disabled || !canRetry}
              aria-label={t('practiceDrill.pronunciation.record', 'Record pronunciation')}
              color="default"
            >
              <MicIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {state === 'recording' && (
        <>
          <Tooltip title={t('practiceDrill.pronunciation.stop', 'Stop recording')}>
            <IconButton
              size="small"
              onClick={stopRecording}
              aria-label={t('practiceDrill.pronunciation.stop', 'Stop recording')}
              color="error"
              sx={{
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                },
              }}
            >
              <StopIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box sx={{ minWidth: 60, maxWidth: 100, flexGrow: 1 }}>
            <MicLevelIndicator analyser={recordingAnalyser} />
          </Box>
        </>
      )}

      {isWorking && (
        <IconButton size="small" disabled aria-label={state === 'uploading' ? 'Uploading' : 'Verifying'}>
          <CircularProgress size={16} />
        </IconButton>
      )}

      {state === 'result' && result && (
        <>
          <Chip
            size="small"
            label={`${result.score}/100`}
            color={result.score >= 70 ? 'success' : result.score >= 40 ? 'warning' : 'error'}
            variant="outlined"
          />
          {canRetry && (
            <Tooltip title={t('practiceDrill.pronunciation.tryAgain', 'Try again')}>
              <IconButton size="small" onClick={handleRetry} aria-label="Try again">
                <ReplayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </>
      )}

      {error && (
        <Typography variant="caption" color="error" sx={{ ml: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  )
}
