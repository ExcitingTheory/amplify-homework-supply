"use client";
/**
 * StreakCalendar — Displays a compact monthly calendar grid showing activity days.
 *
 * Days with no activity show a small dot. Days with activity show a
 * fire icon. Today is highlighted with a ring.
 *
 * @module StreakCalendar
 */

import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import WhatshotIcon from '@mui/icons-material/Whatshot'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'

export interface StreakCalendarProps {
  /** Set of ISO date strings (YYYY-MM-DD) that had activity. */
  activeDays: Set<string>
  /** Year to display. Defaults to current year. */
  year?: number
  /** Month to display (1-12). Defaults to current month. */
  month?: number
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function StreakCalendar({ activeDays, year, month }: StreakCalendarProps) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
  }, [])

  // Use props or fallback to client date; render nothing until mounted
  const displayYear = year ?? now?.getFullYear()
  const displayMonth = month ?? (now ? now.getMonth() + 1 : undefined)

  if (displayYear == null || displayMonth == null) return null

  const firstDay = new Date(displayYear, displayMonth - 1, 1)
  const daysInMonth = new Date(displayYear, displayMonth, 0).getDate()
  const startDow = firstDay.getDay() // 0=Sun

  const todayISO = now ? toISODate(now.getFullYear(), now.getMonth() + 1, now.getDate()) : ''

  const monthName = `${firstDay.toLocaleString('en', { month: 'short' })} ${displayYear}`

  // Build grid cells: leading blanks + day cells
  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <Box sx={{ maxWidth: 200 }}>
      <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, textAlign: 'center', display: 'block' }}>
        {monthName}
      </Typography>

      {/* Day-of-week headers */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
        }}
      >
        {DAY_LABELS.map((label, i) => (
          <Typography
            key={`${label}-${i}`}
            variant="caption"
            sx={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 600, color: 'text.secondary', lineHeight: 1.2 }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      {/* Calendar grid — compact cells with dots/fire icons */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
        }}
      >
        {cells.map((day, idx) => {
          if (day === null) {
            return <Box key={`blank-${idx}`} sx={{ width: 24, height: 24 }} />
          }

          const dateISO = toISODate(displayYear, displayMonth, day)
          const isActive = activeDays.has(dateISO)
          const isToday = dateISO === todayISO
          const isFuture = now ? new Date(displayYear, displayMonth - 1, day) > now : false

          return (
            <Tooltip key={dateISO} title={`${dateISO}${isActive ? ' — Active' : ''}`} arrow>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  bgcolor: isToday ? 'action.selected' : 'transparent',
                  ...(isToday && {
                    outline: '1.5px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: -1,
                  }),
                }}
              >
                {isFuture ? (
                  <FiberManualRecordIcon sx={{ fontSize: '0.25rem', color: 'text.disabled' }} />
                ) : isActive ? (
                  <WhatshotIcon sx={{ fontSize: '0.85rem', color: '#ff9800' }} />
                ) : (
                  <FiberManualRecordIcon sx={{ fontSize: '0.25rem', color: 'text.disabled' }} />
                )}
              </Box>
            </Tooltip>
          )
        })}
      </Box>
    </Box>
  )
}

export default StreakCalendar
