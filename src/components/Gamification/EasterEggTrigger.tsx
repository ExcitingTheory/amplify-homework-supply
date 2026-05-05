/**
 * EasterEggTrigger — Client-side detection hooks and components for Easter eggs.
 *
 * Trigger types supported:
 * - Hidden clickable element (tiny icon placed in course map)
 * - Keyword typed in a text field (Konami-style sequences)
 * - Time-based (active during specific time windows)
 * - UI interaction patterns (e.g. rapid-click, long-press)
 *
 * When triggered, fires a callback (typically a GraphQL mutation to award XP).
 *
 * @module EasterEggTrigger
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import SearchIcon from '@mui/icons-material/Search'
import Tooltip from '@mui/material/Tooltip'

// ============================================================================
// Types
// ============================================================================

export type EasterEggTriggerType = 'CLICK' | 'KEYWORD' | 'TIME' | 'INTERACTION'

export interface EasterEggConfig {
  id: string
  type: EasterEggTriggerType
  /** Description for the award toast */
  message: string
  /** XP reward amount */
  xpReward: number
  /** For KEYWORD type: the sequence to detect */
  keyword?: string
  /** For TIME type: ISO start/end times */
  activeAfter?: string
  activeUntil?: string
  /** For INTERACTION type: number of rapid clicks needed */
  clickCount?: number
  /** For INTERACTION type: time window in ms for rapid clicks */
  clickWindow?: number
}

export interface EasterEggTriggerResult {
  eggId: string
  message: string
  xpReward: number
}

// ============================================================================
// useEasterEggKeyword — detects typed keyword sequences
// ============================================================================

export interface UseEasterEggKeywordOptions {
  keyword: string
  onTrigger: () => void
  /** Whether this egg has already been found (skip detection) */
  disabled?: boolean
}

export function useEasterEggKeyword({ keyword, onTrigger, disabled }: UseEasterEggKeywordOptions) {
  const bufferRef = useRef('')

  useEffect(() => {
    if (disabled || !keyword) return

    const handler = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return
      bufferRef.current += e.key.toLowerCase()
      // Keep only the last N characters
      if (bufferRef.current.length > keyword.length * 2) {
        bufferRef.current = bufferRef.current.slice(-keyword.length)
      }
      if (bufferRef.current.endsWith(keyword.toLowerCase())) {
        bufferRef.current = ''
        onTrigger()
      }
    }

    window.addEventListener('keypress', handler)
    return () => window.removeEventListener('keypress', handler)
  }, [keyword, onTrigger, disabled])
}

// ============================================================================
// useEasterEggTime — triggers during a time window
// ============================================================================

export interface UseEasterEggTimeOptions {
  activeAfter?: string
  activeUntil?: string
  onTrigger: () => void
  disabled?: boolean
}

export function useEasterEggTime({ activeAfter, activeUntil, onTrigger, disabled }: UseEasterEggTimeOptions) {
  const triggeredRef = useRef(false)

  useEffect(() => {
    if (disabled || triggeredRef.current) return

    const check = () => {
      const now = Date.now()
      const after = activeAfter ? new Date(activeAfter).getTime() : 0
      const until = activeUntil ? new Date(activeUntil).getTime() : Infinity
      if (now >= after && now <= until && !triggeredRef.current) {
        triggeredRef.current = true
        onTrigger()
      }
    }

    check()
    const interval = setInterval(check, 30000) // check every 30s
    return () => clearInterval(interval)
  }, [activeAfter, activeUntil, onTrigger, disabled])
}

// ============================================================================
// useEasterEggRapidClick — detects rapid-click patterns
// ============================================================================

export interface UseEasterEggRapidClickOptions {
  clickCount?: number
  clickWindow?: number
  onTrigger: () => void
  disabled?: boolean
}

export function useEasterEggRapidClick({
  clickCount = 5,
  clickWindow = 2000,
  onTrigger,
  disabled,
}: UseEasterEggRapidClickOptions) {
  const clicksRef = useRef<number[]>([])

  const handleClick = useCallback(() => {
    if (disabled) return
    const now = Date.now()
    clicksRef.current.push(now)
    // Remove clicks outside the window
    clicksRef.current = clicksRef.current.filter((t) => now - t < clickWindow)
    if (clicksRef.current.length >= clickCount) {
      clicksRef.current = []
      onTrigger()
    }
  }, [clickCount, clickWindow, onTrigger, disabled])

  return { handleClick }
}

// ============================================================================
// HiddenEasterEgg — A tiny, nearly invisible clickable icon
// ============================================================================

export interface HiddenEasterEggProps {
  /** Position style overrides */
  sx?: Record<string, unknown>
  /** Called when the hidden element is clicked */
  onFind: () => void
  /** Whether already found (hides completely) */
  found?: boolean
  /** Accessible label */
  ariaLabel?: string
}

export function HiddenEasterEgg({
  sx,
  onFind,
  found = false,
  ariaLabel = 'Hidden element',
}: HiddenEasterEggProps) {
  if (found) return null

  return (
    <Box
      sx={{
        position: 'absolute',
        opacity: 0.05,
        width: 16,
        height: 16,
        cursor: 'default',
        '&:hover': { opacity: 0.15 },
        transition: 'opacity 0.3s',
        ...sx,
      }}
    >
      <IconButton
        size="small"
        onClick={onFind}
        aria-label={ariaLabel}
        sx={{ width: 16, height: 16, p: 0 }}
      >
        <SearchIcon sx={{ fontSize: 12 }} />
      </IconButton>
    </Box>
  )
}

// ============================================================================
// useEasterEggTrigger — unified hook for any trigger type
// ============================================================================

export interface UseEasterEggTriggerOptions {
  config: EasterEggConfig
  /** Set of already-found egg IDs */
  foundEggs?: Set<string>
  /** Callback when egg is triggered */
  onTrigger: (result: EasterEggTriggerResult) => void
}

export function useEasterEggTrigger({ config, foundEggs, onTrigger }: UseEasterEggTriggerOptions) {
  const disabled = foundEggs?.has(config.id) ?? false

  const handleTrigger = useCallback(() => {
    if (disabled) return
    onTrigger({ eggId: config.id, message: config.message, xpReward: config.xpReward })
  }, [config, disabled, onTrigger])

  // Keyword detection
  useEasterEggKeyword({
    keyword: config.keyword || '',
    onTrigger: handleTrigger,
    disabled: disabled || config.type !== 'KEYWORD',
  })

  // Time-based detection
  useEasterEggTime({
    activeAfter: config.activeAfter,
    activeUntil: config.activeUntil,
    onTrigger: handleTrigger,
    disabled: disabled || config.type !== 'TIME',
  })

  // Rapid click detection
  const { handleClick } = useEasterEggRapidClick({
    clickCount: config.clickCount,
    clickWindow: config.clickWindow,
    onTrigger: handleTrigger,
    disabled: disabled || config.type !== 'INTERACTION',
  })

  return {
    handleClick,
    handleFind: handleTrigger,
    isFound: disabled,
  }
}

export default HiddenEasterEgg
