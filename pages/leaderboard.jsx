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
import GroupsIcon from '@mui/icons-material/Groups';
import MainToolbar from '../src/components/MainToolbar';
import MyAuth from '../src/components/AmplifyAuthenticator';
import { LeaderboardTable } from '../src/components/Leaderboard/LeaderboardTable';
import { CompletionGrid } from '../src/components/Leaderboard/CompletionGrid';
import { GuildLeaderboard } from '../src/components/Gamification/GuildLeaderboard';
import { useGuild } from '../src/context/gamificationContext';
import { GamificationProviderWrapper } from '../src/context/gamificationProviderWrapper';
import { useScrolledAppBar } from '../src/hooks/useScrolledAppBar';

function LeaderboardPage() {
  const { t } = useTranslation('pages');
  const [mode, setMode] = useState('completion');
  const [entries, setEntries] = useState([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const { guildLeaderboard, myGuild } = useGuild();
  const isScrolled = useScrolledAppBar();

  useEffect(() => {
    getCurrentUser().then(user => {
      setCurrentUserId(user?.username || user?.userId || '');
    }).catch(() => {});
  }, []);

  // Subscribe to StudentProfile records for leaderboard (replaces LeaderboardEntry)
  useEffect(() => {
    const client = getAmplifyClient();
    if (!client?.models?.StudentProfile) return;

    const subscription = client.models.StudentProfile.observeQuery().subscribe({
      next: ({ items }) => {
        const valid = items.filter(item => item != null && item.id != null);
        const byStudent = new Map();
        for (const entry of valid) {
          const existing = byStudent.get(entry.studentId);
          if (!existing || (entry.totalXP || 0) > existing.totalXP) {
            byStudent.set(entry.studentId, {
              studentId: entry.studentId,
              studentName: entry.studentName || entry.studentId,
              avatarColor: '#6366f1',
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
        if (error?.message?.includes('DuplicatedOperationError')) return;
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
      <AppBar position="static" sx={{ transition: 'all 0.3s ease' }}>
        <MainToolbar>
          <Box sx={{
            flexGrow: 1,
            margin: isScrolled ? '0.25rem 1rem' : '0.5rem 1rem',
            transition: 'all 0.3s ease',
          }}>
            <Typography
              variant={isScrolled ? "body1" : "h6"}
              component="div"
              sx={{
                flexGrow: 1,
                transition: 'all 0.3s ease',
                fontWeight: isScrolled ? 500 : 400,
              }}
            >
              {t('leaderboard.title', 'Leaderboard')}
            </Typography>
          </Box>
        </MainToolbar>
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
            <ToggleButton value="xp" aria-label={t('leaderboard.xpMode', 'XP')}>
              <LeaderboardIcon sx={{ mr: 0.5 }} />
              {t('leaderboard.xpMode', 'XP')}
            </ToggleButton>
            <ToggleButton value="completion" aria-label={t('leaderboard.completionMode', 'Completion')}>
              <GridOnIcon sx={{ mr: 0.5 }} />
              {t('leaderboard.completionMode', 'Completion')}
            </ToggleButton>
            <ToggleButton value="guilds" aria-label={t('leaderboard.guildsMode', 'Guilds')}>
              <GroupsIcon sx={{ mr: 0.5 }} />
              {t('leaderboard.guildsMode', 'Guilds')}
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

        {mode === 'guilds' && (
          <GuildLeaderboard
            guilds={guildLeaderboard.map(g => ({
              id: g.id,
              name: g.name,
              totalXP: g.totalXP || 0,
              memberCount: g.memberCount || 0,
            }))}
            myGuildId={myGuild?.id}
          />
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
      <GamificationProviderWrapper>
        <LeaderboardPage />
      </GamificationProviderWrapper>
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
