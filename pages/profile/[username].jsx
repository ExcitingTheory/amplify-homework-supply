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
import MyAuth from '../../src/components/authenticator';
import { useChatPageContext } from '../../src/hooks/useChatPageContext';

import { BadgeShelf } from '../../src/components/Gamification/BadgeShelf';
import { NailedItWall } from '../../src/components/Gamification/NailedItWall';
import { LevelBadge } from '../../src/components/Gamification/LevelBadge';
import { StreakCalendar } from '../../src/components/Gamification/StreakCalendar';
import { UserAvatar } from '../../src/components/UserAvatar';
import { AvatarEditor } from '../../src/components/AvatarEditor';
import { useXP } from '../../src/context/xpContext';
import { getAmplifyClient } from '../../src/utils/amplifyClient';

function ProfilePage() {
  const { t } = useTranslation('pages');
  const router = useRouter();
  const { username: routeUsername } = router.query;

  const [name, setName] = React.useState('');
  const [currentUsername, setCurrentUsername] = React.useState('');
  const [earnedBadges, setEarnedBadges] = React.useState([]);
  const [nailedItBlocks, setNailedItBlocks] = React.useState([]);
  const [currentStreak, setCurrentStreak] = React.useState(0);
  const [activeDays, setActiveDays] = React.useState(new Set());
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

  // Fetch gamification data for profileUsername
  React.useEffect(() => {
    if (!profileUsername) return;
    const client = getAmplifyClient();

    // Subscribe to Badge records
    const badgeSub = client.models.Badge?.observeQuery?.({
      filter: { owner: { eq: profileUsername } },
    })?.subscribe?.({
      next: ({ items }) => {
        const valid = items.filter(i => i != null && i.id != null);
        setEarnedBadges(valid.map(b => ({
          badgeType: b.badgeType,
          awardedAt: b.createdAt || b.awardedAt || new Date().toISOString(),
          sourceId: b.sourceId || null,
        })));
      },
      error: (err) => console.error('[Profile] Badge subscription error:', err),
    });

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

    // Fetch streak data
    client.models.StudentStreak?.list?.({
      filter: { owner: { eq: profileUsername } },
    }).then(({ data }) => {
      const streak = data?.filter(s => s != null)?.[0];
      if (streak) setCurrentStreak(streak.currentStreak || 0);
    }).catch(err => console.warn('[Profile] Streak fetch error:', err));

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
      badgeSub?.unsubscribe?.();
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
          marginTop: '5rem',
          marginBottom: '3rem',
          padding: '1rem',
          height: 'calc(100vh - 5rem)',
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
            <UserAvatar size={96} streak={currentStreak} />
          )}
          <Typography variant="h5">{displayName}</Typography>
          <LevelBadge level={level} />
        </Card>

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
      <ProfilePage />
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
