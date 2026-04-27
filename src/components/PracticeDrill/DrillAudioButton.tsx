/**
 * @fileoverview DrillAudioButton — Inline play button for TTS audio playback
 * in practice drills. Plays pre-generated base64 MP3 or S3-backed audio via
 * the shared AudioPlayerContext (only one audio plays at a time).
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { IconButton, CircularProgress, Tooltip } from '@mui/material'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import PauseIcon from '@mui/icons-material/Pause'
import { useTranslation } from 'next-i18next'
import { useAudioPlayer } from '../Editor3/context/AudioPlayerContext'

// ============================================================================
// Types
// ============================================================================

export interface DrillAudioButtonProps {
  /** base64-encoded MP3 string or S3 path */
  audio: string
  /** Accessible label (e.g., "Play question audio") */
  label?: string
  /** Button size */
  size?: 'small' | 'medium'
  /** Disable the button */
  disabled?: boolean
}

// ============================================================================
// Helpers
// ============================================================================

function isBase64(str: string): boolean {
  // S3 paths contain '/' and start with 'public/' or 'protected/'
  return !str.includes('/') && str.length > 100
}

function base64ToBlobUrl(base64: string): string {
  const byteChars = atob(base64)
  const byteNumbers = new Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: 'audio/mpeg' })
  return URL.createObjectURL(blob)
}

// ============================================================================
// Component
// ============================================================================

export default function DrillAudioButton({
  audio,
  label,
  size = 'small',
  disabled = false,
}: DrillAudioButtonProps) {
  const { t } = useTranslation('components')
  const audioPlayer = useAudioPlayer()
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const blobUrlRef = useRef<string | null>(null)
  const sourceUrlRef = useRef<string | null>(null)

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [])

  // Track playback state from AudioPlayerContext
  useEffect(() => {
    if (!audioPlayer) return

    const unsubscribe = audioPlayer.subscribe({
      onEnded: () => {
        if (audioPlayer.currentSource === sourceUrlRef.current) {
          setPlaying(false)
        }
      },
    })
    return unsubscribe
  }, [audioPlayer])

  // Sync playing state when context's current source changes
  useEffect(() => {
    if (!audioPlayer) return
    if (audioPlayer.currentSource !== sourceUrlRef.current) {
      setPlaying(false)
    }
  }, [audioPlayer?.currentSource])

  const handleClick = useCallback(async () => {
    if (!audioPlayer || !audio) return

    // If currently playing this audio, pause it
    if (playing && audioPlayer.currentSource === sourceUrlRef.current) {
      audioPlayer.pause()
      setPlaying(false)
      return
    }

    setLoading(true)
    try {
      let url: string

      if (isBase64(audio)) {
        // Convert base64 to blob URL (reuse if already created)
        if (!blobUrlRef.current) {
          blobUrlRef.current = base64ToBlobUrl(audio)
        }
        url = blobUrlRef.current
      } else {
        // S3 path — use getCachedUrl (lazy import to avoid circular deps)
        const { default: getCachedUrl } = await import('../../utils/getCachedUrl')
        url = await getCachedUrl(audio)
      }

      sourceUrlRef.current = url
      const success = await audioPlayer.play(url)
      if (success) {
        setPlaying(true)
      }
    } catch (err) {
      console.error('[DrillAudioButton] Playback error:', err)
    } finally {
      setLoading(false)
    }
  }, [audio, audioPlayer, playing])

  const ariaLabel = label || t('practiceDrill.audio.play', 'Play audio')

  if (loading) {
    return (
      <IconButton size={size} disabled aria-label={ariaLabel}>
        <CircularProgress size={size === 'small' ? 16 : 20} />
      </IconButton>
    )
  }

  return (
    <Tooltip title={playing ? t('practiceDrill.audio.pause', 'Pause') : ariaLabel}>
      <span>
        <IconButton
          size={size}
          onClick={handleClick}
          disabled={disabled || !audio}
          aria-label={ariaLabel}
          color={playing ? 'primary' : 'default'}
        >
          {playing ? <PauseIcon fontSize={size} /> : <VolumeUpIcon fontSize={size} />}
        </IconButton>
      </span>
    </Tooltip>
  )
}
