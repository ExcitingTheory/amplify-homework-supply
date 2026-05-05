/**
 * GamificationToastLayer — Global overlay that renders event-driven
 * micro-interaction toasts: RankChangeToast, BadgeCoinFlip, EasterEggToast,
 * ContentUnlockAnimation, and AnimatedXPCounter.
 *
 * Mount once inside GamificationProviderWrapper in _app.jsx.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useXP, useContentLock } from '../../context/gamificationContext'
import { RankChangeToast } from './RankChangeToast'
import { BadgeCoinFlip } from './BadgeCoinFlip'
import { EasterEggToast } from './EasterEggToast'
import { ContentUnlockAnimation } from './ContentUnlockAnimation'

// Badge metadata (mirrors BadgeShelf definitions)
const BADGE_META: Record<string, { emoji: string; name: string; description: string }> = {
  FIRST_SUBMISSION: { emoji: '📝', name: 'First Steps', description: 'Submitted your first assignment' },
  GOOD_EYE: { emoji: '👁️', name: 'Good Eye', description: 'Found an error others missed' },
  QUICK_DRAW: { emoji: '⚡', name: 'Quick Draw', description: 'First to submit in your section' },
  SHARPSHOOTER: { emoji: '🎯', name: 'Sharpshooter', description: '3 perfect scores in a row' },
  CONSISTENT: { emoji: '🔥', name: 'Consistent', description: '14-day streak' },
  TEAM_PLAYER: { emoji: '🤝', name: 'Team Player', description: 'Completed 5 peer reviews' },
  DEEP_THINKER: { emoji: '🧠', name: 'Deep Thinker', description: 'Revised after AI feedback 3 times' },
  TOP_OF_CLASS: { emoji: '🏆', name: 'Top of Class', description: 'Reached #1 on leaderboard' },
  PERFECTIONIST: { emoji: '💎', name: 'Perfectionist', description: '100% on every workbook in a module' },
}

interface RankToastState {
  open: boolean
  positionsChanged: number
  newRank: number
}

interface BadgeFlipState {
  open: boolean
  emoji: string
  name: string
  description: string
}

interface EasterEggState {
  open: boolean
  message: string
  xpReward: number
}

interface UnlockState {
  show: boolean
  title: string
}

export function GamificationToastLayer() {
  const { xpLogs } = useXP()
  const { locks } = useContentLock()

  // Track previous values to detect changes
  const prevXpLogsCountRef = useRef(xpLogs.length)
  const prevLocksRef = useRef<string[]>([])

  // Toast states
  const [rankToast, setRankToast] = useState<RankToastState>({ open: false, positionsChanged: 0, newRank: 0 })
  const [badgeFlip, setBadgeFlip] = useState<BadgeFlipState>({ open: false, emoji: '', name: '', description: '' })
  const [easterEgg, setEasterEgg] = useState<EasterEggState>({ open: false, message: '', xpReward: 0 })
  const [unlock, setUnlock] = useState<UnlockState>({ show: false, title: '' })

  // Detect new XP logs for badge/easter-egg/rank events
  useEffect(() => {
    const prevCount = prevXpLogsCountRef.current
    if (xpLogs.length <= prevCount) {
      prevXpLogsCountRef.current = xpLogs.length
      return
    }

    // New entries are the ones we haven't seen
    const newEntries = xpLogs.slice(0, xpLogs.length - prevCount)
    prevXpLogsCountRef.current = xpLogs.length

    for (const entry of newEntries) {
      const reason = (entry as any).xpReason || ''

      // Easter egg discovery
      if (reason === 'EASTER_EGG') {
        setEasterEgg({
          open: true,
          message: (entry as any).description || 'You found a secret!',
          xpReward: (entry as any).xpAmount || 0,
        })
      }

      // Badge award — check if XP reason contains badge info
      if (reason === 'BADGE_AWARDED') {
        const badgeType = (entry as any).metadata?.badgeType || ''
        const meta = BADGE_META[badgeType] || { emoji: '🏅', name: 'Badge', description: 'Achievement unlocked!' }
        setBadgeFlip({ open: true, ...meta })
      }

      // Rank change — check for leaderboard position data
      if (reason === 'RANK_CHANGE' || (entry as any).metadata?.rankChange) {
        const meta = (entry as any).metadata || {}
        if (meta.positionsChanged && meta.newRank) {
          setRankToast({
            open: true,
            positionsChanged: meta.positionsChanged,
            newRank: meta.newRank,
          })
        }
      }
    }
  }, [xpLogs])

  // Detect content unlocks (lock removed from list)
  useEffect(() => {
    const currentLockedIds = locks.filter((l: any) => l.isLocked).map((l: any) => l.contentId)
    const prevLockedIds = prevLocksRef.current

    if (prevLockedIds.length > 0) {
      // Find items that were locked but no longer are
      const newlyUnlocked = prevLockedIds.filter(id => !currentLockedIds.includes(id))
      if (newlyUnlocked.length > 0) {
        // Show animation for the first unlocked item
        const unlockedLock = locks.find((l: any) => l.contentId === newlyUnlocked[0])
        setUnlock({
          show: true,
          title: (unlockedLock as any)?.title || 'Content Unlocked!',
        })
      }
    }

    prevLocksRef.current = currentLockedIds
  }, [locks])

  const closeRank = useCallback(() => setRankToast(s => ({ ...s, open: false })), [])
  const closeBadge = useCallback(() => setBadgeFlip(s => ({ ...s, open: false })), [])
  const closeEgg = useCallback(() => setEasterEgg(s => ({ ...s, open: false })), [])
  const closeUnlock = useCallback(() => setUnlock({ show: false, title: '' }), [])

  return (
    <>
      <RankChangeToast
        open={rankToast.open}
        positionsChanged={rankToast.positionsChanged}
        newRank={rankToast.newRank}
        onClose={closeRank}
      />
      <BadgeCoinFlip
        open={badgeFlip.open}
        badgeEmoji={badgeFlip.emoji}
        badgeName={badgeFlip.name}
        badgeDescription={badgeFlip.description}
        onClose={closeBadge}
      />
      <EasterEggToast
        open={easterEgg.open}
        message={easterEgg.message}
        xpReward={easterEgg.xpReward}
        onClose={closeEgg}
      />
      <ContentUnlockAnimation
        show={unlock.show}
        title={unlock.title}
        onComplete={closeUnlock}
      />
    </>
  )
}

export default GamificationToastLayer
