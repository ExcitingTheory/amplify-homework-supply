import React, { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18nextConfig from '../next-i18next.config';
import { getAmplifyClient } from '../src/utils/amplifyClient';
import { getCurrentUser } from 'aws-amplify/auth';

import {
  Box,
  AppBar,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Container,
} from '@mui/material';

import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import GridOnIcon from '@mui/icons-material/GridOn';
import MainToolbar from '../src/components/MainToolbar';
import MyAuth from '../src/components/authenticator';
import { LeaderboardTable } from '../src/components/Leaderboard/LeaderboardTable';
import { CompletionGrid } from '../src/components/Leaderboard/CompletionGrid';

function LeaderboardPage() {
  const { t } = useTranslation('pages');
  const [mode, setMode] = useState('completion');
  const [entries, setEntries] = useState([]);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    getCurrentUser().then(user => {
      setCurrentUserId(user?.username || user?.userId || '');
    }).catch(() => {});
  }, []);

  // Subscribe to all LeaderboardEntry records (overall aggregation)
  useEffect(() => {
    const client = getAmplifyClient();
    if (!client?.models?.LeaderboardEntry) return;

    const subscription = client.models.LeaderboardEntry.observeQuery().subscribe({
      next: ({ items }) => {
        const valid = items.filter(item => item != null && item.id != null);
        // Aggregate by student across all cohorts
        const byStudent = new Map();
        for (const entry of valid) {
          const existing = byStudent.get(entry.studentId);
          if (!existing || entry.totalXP > existing.totalXP) {
            byStudent.set(entry.studentId, {
              studentId: entry.studentId,
              studentName: entry.studentName || entry.studentId,
              avatarColor: entry.avatarColor || '#6366f1',
              totalXP: entry.totalXP || 0,
              level: entry.level || 1,
              currentStreak: entry.currentStreak || 0,
              completedAssignments: entry.completedAssignments || 0,
            });
          }
        }
        setEntries(Array.from(byStudent.values()));
      },
      error: (error) => {
        if (error?.message?.includes('exceeds maximum value limit')) {
          console.warn('[Leaderboard] Filter limit — using client filtering');
          return;
        }
        console.error('[Leaderboard] Subscription error:', error);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleModeChange = (_event, newMode) => {
    if (newMode) setMode(newMode);
  };

  return (
    <>
      <AppBar position="static">
        <MainToolbar pageTitle={t('leaderboard.title', 'Leaderboard')} />
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            {t('leaderboard.heading', 'Overall Leaderboard')}
          </Typography>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            size="small"
          >
            <ToggleButton value="xp" aria-label="XP Ranking">
              <LeaderboardIcon sx={{ mr: 0.5 }} />
              {t('leaderboard.xpMode', 'XP')}
            </ToggleButton>
            <ToggleButton value="completion" aria-label="Completion Grid">
              <GridOnIcon sx={{ mr: 0.5 }} />
              {t('leaderboard.completionMode', 'Completion')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {mode === 'xp' && (
          <LeaderboardTable
            entries={entries}
            currentStudentId={currentUserId}
            topN={10}
          />
        )}

        {mode === 'completion' && entries.length > 0 && (
          <CompletionGrid entries={entries} />
        )}

        {entries.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              {t('leaderboard.empty', 'No leaderboard data yet. Complete assignments to earn XP!')}
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
}

function WrappedPage() {
  return (
    <MyAuth>
      <LeaderboardPage />
    </MyAuth>
  );
}

export default WrappedPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'pages'], nextI18nextConfig)),
    },
  };
}
