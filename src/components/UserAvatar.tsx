/**
 * UserAvatar — Reusable avatar display component.
 *
 * Reads avatar URL from SettingsContext metadata, resolves S3 paths
 * via getCachedUrl, and falls back to a generic MUI Avatar icon.
 * Optionally shows a streak lightning bolt badge at the bottom-right corner.
 *
 * @module UserAvatar
 */

import React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import WhatshotIcon from '@mui/icons-material/Whatshot'
import SettingsContext from '../context/settingsContext'
import getCachedUrl from '../utils/getCachedUrl'

export interface UserAvatarProps {
  /** Avatar size in px. Defaults to 40. */
  size?: number
  /** Override the avatar source URL (skips settings lookup). */
  src?: string | null
  /** Current streak count. When > 0, shows a lightning bolt badge. */
  streak?: number
}

export function UserAvatar({ size = 40, src: srcOverride, streak = 0 }: UserAvatarProps) {
  const { settings } = React.useContext(SettingsContext) || {}
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)

  // metadata may be a JSON string (from DynamoDB) or a parsed object
  const rawMetadata = settings?.metadata
  const metadata: Record<string, unknown> = typeof rawMetadata === 'string'
    ? (() => { try { return JSON.parse(rawMetadata) } catch { return {} } })()
    : (rawMetadata || {}) as Record<string, unknown>
  const rawUrl: string | null =
    srcOverride ?? (metadata?.avatarUrl as string) ?? null

  React.useEffect(() => {
    if (!rawUrl) {
      setAvatarUrl(null)
      return
    }
    let cancelled = false
    getCachedUrl(rawUrl).then((url: string) => {
      if (!cancelled) setAvatarUrl(url)
    }).catch(() => {
      if (!cancelled) setAvatarUrl(null)
    })
    return () => { cancelled = true }
  }, [rawUrl])

  const avatar = (
    <Avatar
      src={avatarUrl || undefined}
      sx={{ width: size, height: size }}
    />
  )

  if (streak <= 0) return avatar

  const badgeSize = Math.max(16, Math.round(size * 0.4))

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', pb: `${badgeSize * 0.5}px` }}>
      {avatar}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          right: -2,
          display: 'flex',
          alignItems: 'center',
          gap: '1px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#ff9800',
            color: '#fff',
            borderRadius: '50%',
            width: badgeSize,
            height: badgeSize,
            border: '2px solid',
            borderColor: 'background.paper',
          }}
        >
          <WhatshotIcon sx={{ fontSize: badgeSize * 0.7 }} />
        </Box>
        <Typography
          sx={{
            fontSize: badgeSize * 0.6,
            fontWeight: 800,
            lineHeight: 1,
            color: 'text.primary',
          }}
        >
          {streak}
        </Typography>
      </Box>
    </Box>
  )
}

export default UserAvatar
