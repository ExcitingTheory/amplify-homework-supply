/**
 * @fileoverview TimelineCard — individual dialogue card on the horizontal timeline.
 *
 * Rendered inside HorizontalTimeline, one per dialogue line. Shows truncated
 * text, direction note, emotion chip, and a mini waveform when a take exists.
 * Clicking a card selects it (parent handles selection state).
 */

import React from 'react';
import { Box, Chip, Typography, Tooltip } from '@mui/material';
import { GraphicEq as WaveformIcon } from '@mui/icons-material';

interface TimelineCardProps {
  line: any;
  speaker: any;
  isSelected: boolean;
  left: number;
  width: number;
  onClick: (id: string) => void;
}

export default function TimelineCard({
  line,
  speaker,
  isSelected,
  left,
  width,
  onClick,
}: TimelineCardProps) {
  const activeTake =
    line.activeTakeIndex !== null && line.takes?.[line.activeTakeIndex];

  return (
    <Tooltip
      title={line.text || '(empty)'}
      enterDelay={400}
      placement="top"
    >
      <Box
        onClick={() => onClick(line.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClick(line.id);
        }}
        aria-label={`${speaker?.name || 'Unknown'}: ${line.text || 'empty'}`}
        sx={{
          position: 'absolute',
          left,
          width: Math.max(width, 60),
          top: 4,
          bottom: 4,
          borderRadius: 1,
          bgcolor: isSelected ? 'primary.main' : 'primary.light',
          color: isSelected ? 'primary.contrastText' : 'text.primary',
          opacity: isSelected ? 1 : 0.85,
          border: isSelected ? 2 : 1,
          borderColor: isSelected ? 'primary.dark' : 'divider',
          cursor: 'pointer',
          overflow: 'hidden',
          px: 0.75,
          py: 0.5,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          transition: 'opacity 0.15s, border-color 0.15s',
          '&:hover': { opacity: 1, borderColor: 'primary.main' },
        }}
      >
        {/* Dialogue text */}
        <Typography
          variant="caption"
          noWrap
          sx={{ fontWeight: 500, lineHeight: 1.3 }}
        >
          {line.text || '(empty)'}
        </Typography>

        {/* Direction note (italic sub-line) */}
        {line.direction && (
          <Typography
            variant="caption"
            noWrap
            sx={{ fontStyle: 'italic', opacity: 0.7, fontSize: '0.65rem', lineHeight: 1.2 }}
          >
            {line.direction}
          </Typography>
        )}

        {/* Bottom row: emotion chip + waveform indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
          {line.emotion && (
            <Chip
              label={line.emotion}
              size="small"
              sx={{
                height: 16,
                fontSize: '0.6rem',
                '& .MuiChip-label': { px: 0.5 },
              }}
            />
          )}
          {activeTake && (
            <WaveformIcon sx={{ fontSize: 12, opacity: 0.6 }} />
          )}
        </Box>
      </Box>
    </Tooltip>
  );
}
