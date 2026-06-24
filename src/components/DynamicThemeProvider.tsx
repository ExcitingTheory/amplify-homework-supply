'use client'

import * as React from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { useContext } from 'react'
import SettingsContext from '../context/settingsContext'
import { getThemeOptions, getCustomThemeOptions } from '../themes/editorThemes'
import { buildFullPaletteFromCustom } from './Gamification/ThemeMixer'
import type { CustomThemePaletteInput } from './Gamification/ThemeMixer'

/**
 * Reads the authenticated user's profileThemeId from SettingsContext
 * and provides a dynamically-created MUI theme to all descendants.
 * This sits inside SettingsProvider so it has access to settings,
 * and overrides the static theme from ThemeRegistry.
 *
 * Supports both preset themes (midnight, forest, etc.) and user-mixed
 * custom themes stored as JSON in Settings.customThemePalette.
 */
export default function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useContext(SettingsContext)
  const profileThemeId = settings?.profileThemeId || 'default'

  const theme = React.useMemo(() => {
    let options
    if (profileThemeId === 'custom' && settings?.customThemePalette) {
      const customInput: CustomThemePaletteInput =
        typeof settings.customThemePalette === 'string'
          ? JSON.parse(settings.customThemePalette)
          : settings.customThemePalette
      const palette = buildFullPaletteFromCustom(customInput)
      options = getCustomThemeOptions(palette)
    } else {
      options = getThemeOptions(profileThemeId)
    }
    return createTheme({
      ...options,
      components: {
        MuiAccordionSummary: {
          defaultProps: {
            slotProps: {
              content: { component: 'div' },
            },
          },
        },
      },
    })
  }, [profileThemeId, settings?.customThemePalette])

  // Also sync the theme choice to a cookie so SSR can pick it up
  React.useEffect(() => {
    if (!profileThemeId) return
    document.cookie = `profile-theme=${profileThemeId};path=/;max-age=31536000;SameSite=Lax`
  }, [profileThemeId])

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
