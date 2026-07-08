import { useContext, useMemo } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import SettingsContext from '@/context/settingsContext'

/**
 * Returns true when animations should be suppressed — either because the
 * user toggled "Reduced Motion" in app settings or because the OS-level
 * `prefers-reduced-motion: reduce` media query matches.
 */
export function useReducedMotion(): boolean {
  const settingsCtx = useContext(SettingsContext)
  const systemPrefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const appPrefersReduced = settingsCtx?.settings?.reducedMotion === true

  return useMemo(
    () => systemPrefersReduced || appPrefersReduced,
    [systemPrefersReduced, appPrefersReduced],
  )
}

export default useReducedMotion
