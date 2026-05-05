import * as React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18nextConfig from '../../next-i18next.config';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';

import {
  fetchUserAttributes,
  fetchAuthSession,
} from 'aws-amplify/auth';

import MainToolbar from '../../src/components/MainToolbar';
import MyAuth from '../../src/components/AmplifyAuthenticator';
import { useChatPageContext } from '../../src/hooks/useChatPageContext';

import { BadgeShelf } from '../../src/components/Gamification/BadgeShelf';
import { NailedItWall } from '../../src/components/Gamification/NailedItWall';
import { LevelBadge } from '../../src/components/Gamification/LevelBadge';
import { StreakCalendar } from '../../src/components/Gamification/StreakCalendar';
import { ProgressRings } from '../../src/components/Gamification/ProgressRings';
import { StreakShield } from '../../src/components/Gamification/StreakShield';
import { DiceBearAvatar } from '../../src/components/Gamification/DiceBearAvatar';
import { AvatarEditor } from '../../src/components/AvatarEditor';
import { useXP } from '../../src/context/gamificationContext';
import { GamificationProviderWrapper } from '../../src/context/gamificationProviderWrapper';
import { getAmplifyClient } from '../../src/utils/amplifyClient';

/**
 * ProfileAvatar — Non-editable DiceBear avatar for viewing another user's profile.
 * Uses their username as the seed for a deterministic avatar.
 */
function ProfileAvatar({ profileUsername }) {
  return (
    <DiceBearAvatar
      seed={profileUsername || 'student'}
      size={96}
      style="simple"
    />
  );
}

function ProfilePage() {
  const { t } = useTranslation('pages');
  const router = useRouter();
  const { username: routeUsername } = router.query;

  const [name, setName] = React.useState('');
  const [currentUsername, setCurrentUsername] = React.useState('');
  const [earnedBadges, setEarnedBadges] = React.useState([]);
  const [nailedItBlocks, setNailedItBlocks] = React.useState([]);
  const [currentStreak, setCurrentStreak] = React.useState(0);
  const [freezesRemaining, setFreezesRemaining] = React.useState(0);
  const [freezesUsed, setFreezesUsed] = React.useState(0);
  const [activeDays, setActiveDays] = React.useState(new Set());
  const [progressModules, setProgressModules] = React.useState([]);
  const { level } = useXP();

  useChatPageContext({});

  // Resolve the profile owner username
  const profileUsername = routeUsername || currentUsername;

  // Fetch current user info
  React.useEffect(() => {
    async function fetchUser() {
      try {
        const userAttributes = await fetchUserAttributes();
        setName(userAttributes?.name || '');
        setCurrentUsername(userAttributes?.sub || '');
      } catch (err) {
        console.warn('[Profile] Could not fetch user attributes:', err);
      }
    }
    fetchUser();
  }, []);

  // Fetch gamification data for profileUsername from StudentProfile
  React.useEffect(() => {
    if (!profileUsername) return;
    const client = getAmplifyClient();

    // Fetch StudentProfile (contains badges, streak, progress)
    client.models.StudentProfile?.list?.({
      filter: { studentId: { eq: profileUsername } },
    }).then(({ data }) => {
      const profile = (data || []).filter(p => p != null)?.[0];
      if (profile) {
        // Badges
        setEarnedBadges((profile.badges || []).map(b => ({
          badgeType: b.badgeType,
          awardedAt: b.awardedAt || new Date().toISOString(),
          sourceId: b.sourceId || null,
          count: 1,
        })));
        // Streak
        setCurrentStreak(profile.currentStreak || 0);
        setFreezesRemaining(profile.freezesRemaining || 0);
        setFreezesUsed(profile.freezesUsed || 0);
        // Progress modules
        setProgressModules((profile.moduleProgress || []).map(p => ({
          moduleId: p.moduleId,
          moduleName: p.moduleId,
          completionPercent: p.completionPercent || 0,
          totalWorkbooks: p.totalWorkbooks || 0,
          completedWorkbooks: p.completedWorkbooks || 0,
        })));
      }
    }).catch(err => console.warn('[Profile] StudentProfile fetch error:', err));

    // Subscribe to NailedIt records
    const nailedItSub = client.models.NailedIt?.observeQuery?.({
      filter: { owner: { eq: profileUsername } },
    })?.subscribe?.({
      next: ({ items }) => {
        const valid = items.filter(i => i != null && i.id != null);
        setNailedItBlocks(valid.map(n => ({
          id: n.id,
          question: n.question || '',
          nailedItReason: n.nailedItReason || '',
          homeworkTitle: n.homeworkTitle || '',
          createdAt: n.createdAt || new Date().toISOString(),
        })));
      },
      error: (err) => console.error('[Profile] NailedIt subscription error:', err),
    });

    // Fetch XP logs for activity calendar
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    client.models.StudentXPLog?.list?.({
      filter: {
        owner: { eq: profileUsername },
        createdAt: { ge: startOfMonth },
      },
    }).then(({ data }) => {
      const days = new Set();
      (data || []).filter(l => l != null).forEach(log => {
        if (log.createdAt) days.add(log.createdAt.slice(0, 10));
      });
      setActiveDays(days);
    }).catch(err => console.warn('[Profile] XP log fetch error:', err));

    return () => {
      nailedItSub?.unsubscribe?.();
    };
  }, [profileUsername]);

  const displayName = name || profileUsername;

  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        sx={{
            backgroundColor: 'custom.glassNavbar',
            backdropFilter: 'blur(8px)',
        }}
      >
        <MainToolbar>
          <Box sx={{ flexGrow: 1, margin: '1rem' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {t('profile.title')}
            </Typography>
          </Box>
        </MainToolbar>
      </AppBar>
      <Box
        sx={{
          position: 'fixed',
          top: '5rem',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '1rem',
          paddingBottom: '3rem',
          overflow: 'auto',
        }}
      >
        {/* Profile Avatar, Level & Streak */}
        <Card sx={{
          padding: '2rem 1rem',
          margin: '1rem auto',
          height: 'fit-content',
          maxWidth: '60rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}>
          {currentUsername && currentUsername === profileUsername ? (
            <AvatarEditor />
          ) : (
            <ProfileAvatar profileUsername={profileUsername} />
          )}
          <Typography variant="h5">{displayName}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LevelBadge level={level} />
            <StreakShield freezesRemaining={freezesRemaining} freezesUsed={freezesUsed} />
          </Box>
        </Card>

        {/* Progress Rings */}
        {progressModules.length > 0 && (
          <Card sx={{
            padding: '2rem 1rem',
            margin: '1rem auto',
            height: 'fit-content',
            maxWidth: '60rem',
          }}>
            <Typography variant="h5" gutterBottom>{t('profile.progress', 'Progress')}</Typography>
            <ProgressRings modules={progressModules} />
          </Card>
        )}

        {/* Activity Calendar */}
        <Card sx={{
          padding: '2rem 1rem',
          margin: '1rem auto',
          height: 'fit-content',
          maxWidth: '60rem',
        }}>
          <Typography variant="h5" gutterBottom>{t('profile.activity', 'Activity')}</Typography>
          <StreakCalendar activeDays={activeDays} />
        </Card>

        {/* Badges */}
        <Card sx={{
          padding: '2rem 1rem',
          margin: '1rem auto',
          height: 'fit-content',
          maxWidth: '60rem',
        }}>
          <Typography variant="h5" gutterBottom>{t('profile.badges', 'Badges')}</Typography>
          <BadgeShelf earnedBadges={earnedBadges} columns={3} earnedOnly />
        </Card>

        {/* Nailed It Wall */}
        <Card sx={{
          padding: '2rem 1rem',
          margin: '1rem auto',
          height: 'fit-content',
          maxWidth: '60rem',
        }}>
          <Typography variant="h5" gutterBottom>{t('profile.nailedItWall', 'Nailed It Wall')}</Typography>
          <NailedItWall blocks={nailedItBlocks} />
        </Card>
      </Box>
    </>
  );
}

export default function WrappedPage() {
  return (
    <MyAuth>
      <GamificationProviderWrapper>
        <ProfilePage />
      </GamificationProviderWrapper>
    </MyAuth>
  )
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'pages', 'components'], nextI18nextConfig)),
    },
  }
}
