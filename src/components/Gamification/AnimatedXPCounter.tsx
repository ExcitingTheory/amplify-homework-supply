/**
 * AnimatedXPCounter — Number that ticks up like a slot machine when XP changes.
 *
 * Uses requestAnimationFrame for smooth incremental count.
 *
 * @module AnimatedXPCounter
 */

import React, { useEffect, useRef, useState } from 'react'
import Typography from '@mui/material/Typography'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface AnimatedXPCounterProps {
  /** Current total XP value to display. */
  targetValue: number
  /** Duration of the animation in ms. Defaults to 800. */
  duration?: number
  /** Typography variant. Defaults to 'h6'. */
  variant?: 'h6' | 'h5' | 'h4' | 'subtitle1' | 'body1'
}

export function AnimatedXPCounter({
  targetValue,
  duration = 800,
  variant = 'h6',
}: AnimatedXPCounterProps) {
  const reducedMotion = useReducedMotion()
  const [displayValue, setDisplayValue] = useState(targetValue)
  const previousRef = useRef(targetValue)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const startValue = previousRef.current
    const diff = targetValue - startValue

    if (diff === 0) return

    // Snap instantly when reduced motion is preferred
    if (reducedMotion) {
      setDisplayValue(targetValue)
      previousRef.current = targetValue
      return
    }

    const startTime = performance.now()

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + diff * eased)

      setDisplayValue(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        previousRef.current = targetValue
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [targetValue, duration, reducedMotion])

  return (
    <Typography
      variant={variant}
      fontWeight={700}
      sx={{
        fontFeatureSettings: '"tnum"',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {displayValue.toLocaleString()} XP
    </Typography>
  )
}

export default AnimatedXPCounter
