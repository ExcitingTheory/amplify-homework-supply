import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export interface CampaignChapter {
  id: string;
  title: string;
  setting?: string;
  stakes?: string;
  targetXP: number;
  currentXP: number;
  active: boolean;
  chapterOrder?: number;
}

export interface CampaignTimelineProps {
  chapters: CampaignChapter[];
}

/**
 * CampaignTimeline — Visual chapter progression for group challenges.
 * Shows completed, in-progress, and locked chapters in order.
 */
export function CampaignTimeline({ chapters }: CampaignTimelineProps) {
  if (!chapters || chapters.length === 0) return null;

  // Sort by chapterOrder, then by creation order
  const sorted = [...chapters].sort((a, b) => {
    if (a.chapterOrder != null && b.chapterOrder != null) {
      return a.chapterOrder - b.chapterOrder;
    }
    return 0;
  });

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Campaign Progress
      </Typography>
      <Stack spacing={1.5}>
        {sorted.map((chapter, index) => {
          const progress = chapter.targetXP > 0
            ? Math.min(100, Math.round((chapter.currentXP / chapter.targetXP) * 100))
            : 0;
          const isCompleted = chapter.currentXP >= chapter.targetXP;
          const isActive = chapter.active && !isCompleted;
          const isLocked = !chapter.active && !isCompleted;

          return (
            <Box
              key={chapter.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                opacity: isLocked ? 0.5 : 1,
              }}
            >
              {/* Chapter number/icon */}
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: isCompleted ? 'success.main' : isActive ? 'primary.main' : 'grey.300',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {isCompleted ? <CheckCircleIcon fontSize="small" /> :
                 isLocked ? <LockIcon fontSize="small" /> :
                 <PlayArrowIcon fontSize="small" />}
              </Box>

              {/* Chapter content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    Chapter {index + 1}: {chapter.title}
                  </Typography>
                  {isCompleted && (
                    <Chip label="Complete" size="small" color="success" sx={{ height: 18, fontSize: '0.6rem' }} />
                  )}
                  {isActive && (
                    <Chip label={`${progress}%`} size="small" color="primary" sx={{ height: 18, fontSize: '0.6rem' }} />
                  )}
                  {isLocked && (
                    <Chip label="Locked" size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
                  )}
                </Box>
                {isActive && (
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                  />
                )}
                {chapter.setting && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {chapter.setting}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

export default CampaignTimeline;
