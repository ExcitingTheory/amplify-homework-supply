/**
 * @fileoverview GradeHistory - Displays previous attempt statistics for workbook assignments
 * @module GradeHistory
 * 
 * Shows a list of previous grade attempts with accuracy scores and timestamps.
 * Used in the workbook sidebar to give students visibility into their progress.
 */

import React from 'react';
import { Box, Typography, Divider, Chip, Stack } from '@mui/material';
import UnitContext from '../../../context/unitContext';
import { useTranslation } from 'next-i18next';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

export default function GradeHistory() {
  const { t } = useTranslation('workbook');
  const { unit, grade, recentGrades } = React.useContext(UnitContext);

  const hasGrades = recentGrades && recentGrades.length > 0;
  const currentAccuracy = grade?.accuracy || 0;
  const roundedCurrentAccuracy = Math.round(currentAccuracy * 100) / 100;

  // Calculate statistics
  const averageAccuracy = hasGrades
    ? recentGrades.reduce((sum, g) => sum + (g.accuracy || 0), 0) / recentGrades.length
    : 0;
  const roundedAverage = Math.round(averageAccuracy * 100) / 100;
  
  const bestAccuracy = hasGrades
    ? Math.max(...recentGrades.map(g => g.accuracy || 0))
    : 0;
  const roundedBest = Math.round(bestAccuracy * 100) / 100;

  const attemptCount = recentGrades.length;

  // Determine trend from last 2 attempts
  let trend = 'flat';
  if (recentGrades.length >= 2) {
    const lastTwo = recentGrades.slice(0, 2);
    const diff = lastTwo[0].accuracy - lastTwo[1].accuracy;
    if (diff > 0.5) trend = 'up';
    else if (diff < -0.5) trend = 'down';
  }

  const TrendIcon = trend === 'up' ? TrendingUpIcon : trend === 'down' ? TrendingDownIcon : TrendingFlatIcon;
  const trendColor = trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'default';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('gradeHistory.title')}
      </Typography>

      {!hasGrades && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {t('gradeHistory.noAttempts')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('gradeHistory.completeFirstAttempt')}
          </Typography>
        </Box>
      )}

      {hasGrades && (
        <>
          {/* Statistics Summary */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={`${attemptCount} ${t('gradeHistory.attempts')}`}
                size="small"
              />
              <Chip 
                icon={<TrendIcon />}
                label={t(`gradeHistory.trend.${trend}`)}
                size="small"
                color={trendColor}
              />
            </Stack>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('gradeHistory.bestScore')}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {roundedBest}%
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('gradeHistory.averageScore')}
              </Typography>
              <Typography variant="h6">
                {roundedAverage}%
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Recent Attempts List */}
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
            {t('gradeHistory.recentAttempts')}
          </Typography>

          <style jsx global>{`
            ol.recent-grades {
              list-style-type: none;
              counter-reset: my-counter;
              padding: 0;
              margin: 0;
            }
            
            ol.recent-grades li::before {
              content: counter(my-counter);
              counter-increment: my-counter;
              font-weight: bold;
              font-size: 1.2em;
              position: absolute;
              left: 0;
              top: 50%;
              transform: translateY(-50%);
              width: 2rem;
              text-align: center;
              color: #666;
            }
          `}</style>

          <ol className="recent-grades">
            {recentGrades.map((attemptGrade, index) => {
              const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              const localTime = new Date(attemptGrade?.createdAt).toLocaleString(undefined, {
                timeZone,
                dateStyle: 'short',
                timeStyle: 'short',
              });

              const roundedAccuracy = Math.round(attemptGrade?.accuracy * 100) / 100;
              const isBest = roundedAccuracy === roundedBest;

              return (
                <li
                  key={attemptGrade.id || index}
                  style={{
                    position: 'relative',
                    paddingLeft: '2.5rem',
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: index < recentGrades.length - 1 ? '1px solid #e0e0e0' : 'none',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {localTime}
                      </Typography>
                      {attemptGrade.percentComplete !== undefined && (
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(attemptGrade.percentComplete)}% {t('gradeHistory.complete')}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: isBest ? 'bold' : 'normal',
                          color: isBest ? 'success.main' : 'text.primary',
                        }}
                      >
                        {roundedAccuracy}%
                      </Typography>
                      {isBest && (
                        <Chip
                          label={t('gradeHistory.best')}
                          size="small"
                          color="success"
                          sx={{ height: '20px', fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </Box>
  );
}
