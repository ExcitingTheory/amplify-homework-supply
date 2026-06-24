'use client'

import * as React from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { getThemeOptions, getCustomThemeOptions } from '@/themes/editorThemes'
import { buildFullPaletteFromCustom } from '@/components/Gamification/ThemeMixer'
import type { CustomThemePaletteInput } from '@/components/Gamification/ThemeMixer'

/**
 * Wraps the public profile page in a ThemeProvider using the viewed user's
 * selected cosmetic theme. This means visitors see the profile styled with
 * that user's chosen palette — without affecting the rest of their own app.
 *
 * Supports both preset themes and custom user-mixed palettes.
 */
export default function ProfileThemeWrapper({
  themeId,
  customPalette,
  children,
}: {
  themeId: string | null
  customPalette?: CustomThemePaletteInput | null
  children: React.ReactNode
}) {
  const theme = React.useMemo(() => {
    if (themeId === 'custom' && customPalette) {
      const palette = buildFullPaletteFromCustom(customPalette)
      return createTheme(getCustomThemeOptions(palette))
    }
    return createTheme(getThemeOptions(themeId))
  }, [themeId, customPalette])

  if (!themeId || themeId === 'default') {
    // No override needed — use the parent theme
    return <>{children}</>
  }

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
