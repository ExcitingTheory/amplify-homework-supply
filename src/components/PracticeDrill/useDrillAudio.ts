/**
 * @fileoverview useDrillAudio — Hook for managing TTS audio playback in
 * practice drills. Handles base64→blob URL conversion and S3 path resolution
 * via getCachedUrl. Manages a cache of converted URLs to avoid re-creating.
 */

import { useRef, useCallback } from 'react'

// ============================================================================
// Types
// ============================================================================

interface UseDrillAudioReturn {
  /** Convert a base64 string or S3 path to a playable URL */
  resolveAudioUrl: (audio: string) => Promise<string>
  /** Clean up all cached blob URLs — call on unmount */
  cleanup: () => void
}

// ============================================================================
// Helpers
// ============================================================================

function isBase64(str: string): boolean {
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
// Hook
// ============================================================================

export function useDrillAudio(): UseDrillAudioReturn {
  const cacheRef = useRef<Map<string, string>>(new Map())

  const resolveAudioUrl = useCallback(async (audio: string): Promise<string> => {
    // Check cache first (keyed by first 50 chars to limit memory)
    const cacheKey = audio.slice(0, 50)
    const cached = cacheRef.current.get(cacheKey)
    if (cached) return cached

    let url: string

    if (isBase64(audio)) {
      url = base64ToBlobUrl(audio)
    } else {
      // S3 path — resolve via getCachedUrl
      const { default: getCachedUrl } = await import('../../utils/getCachedUrl')
      url = await getCachedUrl(audio)
    }

    cacheRef.current.set(cacheKey, url)
    return url
  }, [])

  const cleanup = useCallback(() => {
    // Revoke all blob URLs
    for (const [key, url] of cacheRef.current.entries()) {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    }
    cacheRef.current.clear()
  }, [])

  return { resolveAudioUrl, cleanup }
}
