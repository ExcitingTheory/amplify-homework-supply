/**
 * @fileoverview useDrillRecording — Hook for managing audio recording,
 * upload, and Whisper verification in pronunciation drills.
 */

import { useState, useRef, useCallback } from 'react'
import type { VerifyResult } from './DrillRecordButton'

// ============================================================================
// Types
// ============================================================================

interface UseDrillRecordingOptions {
  sessionId: string
  onVerifyResult?: (blockId: string, result: VerifyResult) => void
}

interface UseDrillRecordingReturn {
  startRecording: (blockId: string, targetText: string) => Promise<void>
  stopRecording: () => Promise<void>
  isRecording: boolean
  isUploading: boolean
  isVerifying: boolean
  currentBlockId: string | null
  results: Record<string, VerifyResult>
  attemptCounts: Record<string, number>
}

// ============================================================================
// Hook
// ============================================================================

export function useDrillRecording({
  sessionId,
  onVerifyResult,
}: UseDrillRecordingOptions): UseDrillRecordingReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, VerifyResult>>({})
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({})

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const targetTextRef = useRef<string>('')

  const startRecording = useCallback(async (blockId: string, targetText: string) => {
    targetTextRef.current = targetText
    setCurrentBlockId(blockId)

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'

    const mediaRecorder = new MediaRecorder(stream, { mimeType })
    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop())
      streamRef.current = null

      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      if (blob.size === 0) return

      await uploadAndVerify(blockId, blob)
    }

    mediaRecorder.start()
    setIsRecording(true)
  }, [sessionId])

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [])

  const uploadAndVerify = async (blockId: string, blob: Blob) => {
    try {
      setIsUploading(true)
      const attempt = (attemptCounts[blockId] || 0) + 1
      setAttemptCounts((prev) => ({ ...prev, [blockId]: attempt }))

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

      const { default: getCachedUrl } = await import('../../utils/getCachedUrl')
      const audioUrl = await getCachedUrl(s3Path, 'protected', identityId)

      setIsUploading(false)
      setIsVerifying(true)

      const { getAmplifyClient } = await import('../../utils/amplifyClient')
      const client = getAmplifyClient()
      const { data, errors } = await client.queries.verifyAudioUrl({
        expected: targetTextRef.current,
        audioUrl,
        model: 'whisper-1',
        chatModel: 'gpt-4o',
      })

      const verifyResult: VerifyResult = {
        correct: false,
        score: 0,
        feedback: '',
        audioUrl: s3Path,
      }

      if (!errors && data) {
        try {
          const parsed = JSON.parse(data)
          verifyResult.correct = parsed.correct ?? parsed.answer ?? false
          verifyResult.score = parsed.score ?? (verifyResult.correct ? 100 : 0)
          verifyResult.feedback = parsed.feedback ?? parsed.reason ?? ''
        } catch {
          verifyResult.feedback = data
        }
      }

      setResults((prev) => {
        const existing = prev[blockId]
        // Keep best score
        if (existing && existing.score > verifyResult.score) return prev
        return { ...prev, [blockId]: verifyResult }
      })

      onVerifyResult?.(blockId, verifyResult)
    } catch (err) {
      console.error('[useDrillRecording] Error:', err)
    } finally {
      setIsUploading(false)
      setIsVerifying(false)
      setCurrentBlockId(null)
    }
  }

  return {
    startRecording,
    stopRecording,
    isRecording,
    isUploading,
    isVerifying,
    currentBlockId,
    results,
    attemptCounts,
  }
}
