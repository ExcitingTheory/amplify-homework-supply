/**
 * BotAvatar — AI assistant avatar displayed alongside chat messages.
 * Uses DiceBearAvatar with a deterministic 'bot' seed and bot-specific styling.
 *
 * @module BotAvatar
 */

import React from 'react'
import { AvatarDisplay } from './Gamification/AvatarDisplay'
import type { AvatarStyleTier, AvatarOverrides } from './Gamification/DiceBearAvatar'

export interface BotAvatarProps {
  /** Size in pixels. Defaults to 28. */
  size?: number
  /** DiceBear style tier. Defaults to 'simple'. */
  style?: AvatarStyleTier
  /** Optional customization overrides (unlocked via Bot Whisperer badges). */
  overrides?: AvatarOverrides
}

/** Default bot appearance — purple-ish tones, friendly look */
const BOT_DEFAULTS: AvatarOverrides = {
  backgroundColor: ['b6e3f4'],
}

export function BotAvatar({ size = 28, style = 'simple', overrides }: BotAvatarProps) {
  return (
    <AvatarDisplay
      seed="homework-supply-bot"
      style={style}
      size={size}
      overrides={overrides || BOT_DEFAULTS}
    />
  )
}

export default BotAvatar
