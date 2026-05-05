/**
 * useAvatarConfig — Returns the current user's saved avatar configuration
 * from SettingsContext. All DiceBearAvatar instances for the current user
 * should consume this hook so they render identically.
 *
 * Returns `undefined` for style/overrides when no config is saved yet,
 * signalling DiceBearAvatar to use seed-based defaults.
 */

import { useContext, useMemo } from 'react'
import SettingsContext from '../context/settingsContext'
import { getUnlockedStyleTier } from '../components/Gamification/DiceBearAvatar'
import { useXP } from '../context/gamificationContext'
import type { AvatarStyleTier, AvatarOverrides } from '../components/Gamification/DiceBearAvatar'

export interface AvatarConfig {
  /** Resolved style tier — saved preference or level-based default */
  style: AvatarStyleTier
  /** Saved overrides, or empty object if not customized */
  overrides: AvatarOverrides
  /** Whether settings have loaded (false = still loading, show nothing or fallback) */
  isLoaded: boolean
  /** The seed to use for the avatar (owner from settings) */
  seed: string
}

export function useAvatarConfig(): AvatarConfig {
  const ctx = useContext(SettingsContext)
  const settings = ctx?.settings
  const isLoaded = ctx ? !ctx.isLoading : false
  const { level } = useXP()
  const numericLevel = level?.level ?? 1

  // metadata can be a parsed object or a JSON string depending on Amplify's response
  const rawMetadata = settings?.metadata
  const seed = (settings as any)?.owner || ''

  return useMemo(() => {
    const metadata: Record<string, unknown> = typeof rawMetadata === 'string'
      ? (() => { try { return JSON.parse(rawMetadata) } catch { return {} } })()
      : (rawMetadata || {}) as Record<string, unknown>

    const savedStyle = (metadata.avatarStyle as AvatarStyleTier) || undefined
    const style = savedStyle || getUnlockedStyleTier(numericLevel)
    const overrides = (metadata.avatarOverrides as AvatarOverrides) || {}

    return { style, overrides, isLoaded, seed }
  }, [rawMetadata, isLoaded, numericLevel, seed])
}

export default useAvatarConfig
