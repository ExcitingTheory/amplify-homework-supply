import * as React from 'react';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18nextConfig from '../../next-i18next.config';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import GroupIcon from '@mui/icons-material/Group';
import AppSkeleton from '../../src/components/AppSkeleton';
import MainToolbar from '../../src/components/MainToolbar';
import MyAuth from '../../src/components/AmplifyAuthenticator';
import { GuildJoinPanel } from '../../src/components/Gamification/GuildJoinPanel';
import { GuildEditor } from '../../src/components/Gamification/GuildEditor';
import { DiceBearAvatar } from '../../src/components/Gamification/DiceBearAvatar';
import { useGuild, useXP } from '../../src/context/gamificationContext';
import { GamificationProviderWrapper } from '../../src/context/gamificationProviderWrapper';
import { GuildPostFeed } from '../../src/components/Gamification/GuildPostFeed';
import { getAmplifyClient } from '../../src/utils/amplifyClient';
import { getCurrentUser } from 'aws-amplify/auth';
import { useScrolledAppBar } from '../../src/hooks/useScrolledAppBar';
import { useAvatarConfig } from '../../src/hooks/useAvatarConfig';

/**
 * Derive a short friendly label from a studentId.
 * If it looks like a UUID, use first 8 chars with "Member-" prefix.
 * Otherwise return as-is.
 */
function friendlyName(studentId) {
  if (!studentId) return 'Unknown';
  // UUID pattern
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(studentId)) {
    return `Member-${studentId.slice(0, 6)}`;
  }
  // Email — use part before @
  if (studentId.includes('@')) {
    return studentId.split('@')[0];
  }
  return studentId;
}

function GuildPage() {
  const router = useRouter();
  const { id: guildIdFromRoute } = router.query;
  const client = React.useMemo(() => getAmplifyClient(), []);

  const { myGuild, myMembership, guildLeaderboard, guildMembers, isLoading } = useGuild();
  const { level } = useXP();
  const isScrolled = useScrolledAppBar();

  // Get the current user's studentId from the membership or session
  const studentId = myMembership?.studentId || '';
  const { style: myAvatarStyle, overrides: myAvatarOverrides, seed: myAvatarSeed } = useAvatarConfig();

  // Look up display names from Settings for all guild members
  const [displayNameMap, setDisplayNameMap] = React.useState({});
  React.useEffect(() => {
    if (!guildMembers.length || !client?.models?.Settings) return;
    client.models.Settings.list().then(({ data }) => {
      const map = {};
      for (const s of (data || [])) {
        if (s?.owner && s?.displayName) {
          map[s.owner] = s.displayName;
        }
      }
      setDisplayNameMap(map);
    }).catch((err) => {
      console.warn('[GuildPage] Failed to fetch display names:', err);
    });
  }, [client, guildMembers.length]);

  // Map context data into panel format
  const availableGuilds = React.useMemo(
    () =>
      guildLeaderboard.map((g) => ({
        id: g.id,
        name: g.name,
        totalXP: g.totalXP,
        memberCount: g.memberCount,
        description: g.description,
      })),
    [guildLeaderboard]
  );

  const myGuildEntry = React.useMemo(() => {
    if (!myGuild) return null;
    return {
      id: myGuild.id,
      name: myGuild.name,
      totalXP: myGuild.totalXP,
      memberCount: myGuild.memberCount,
      description: myGuild.description,
    };
  }, [myGuild]);

  const memberEntries = React.useMemo(
    () =>
      guildMembers.map((m) => ({
        id: m.id,
        studentId: m.studentId,
        displayName: displayNameMap[m.studentId] || friendlyName(m.studentId),
        role: m.role,
        joinedAt: m.joinedAt,
        ...(m.studentId === studentId && {
          avatarSeed: myAvatarSeed || studentId,
          avatarStyle: myAvatarStyle,
          avatarOverrides: myAvatarOverrides,
        }),
      })),
    [guildMembers, studentId, displayNameMap, myAvatarSeed, myAvatarStyle, myAvatarOverrides]
  );

  const handleJoinGuild = React.useCallback(
    async (guildId) => {
      try {
        const { data: guild } = await client.models.Guild.get({ id: guildId });
        if (!guild) return;
        const currentMembers = guild.members || [];
        await client.models.Guild.update({
          id: guildId,
          members: [...currentMembers, { studentId, role: 'MEMBER', joinedAt: new Date().toISOString() }],
          _version: guild._version,
        });
      } catch (err) {
        console.error('[GuildPage] Failed to join guild:', err);
      }
    },
    [client, studentId]
  );

  const handleLeaveGuild = React.useCallback(async () => {
    if (!myGuild?.id) return;
    try {
      const { data: guild } = await client.models.Guild.get({ id: myGuild.id });
      if (!guild) return;
      const updatedMembers = (guild.members || []).filter(m => m.studentId !== studentId);
      await client.models.Guild.update({
        id: myGuild.id,
        members: updatedMembers,
        _version: guild._version,
      });
    } catch (err) {
      console.error('[GuildPage] Failed to leave guild:', err);
    }
  }, [client, myGuild, studentId]);

  // ---- Guild Posts (embedded in Guild.posts) ----
  const [isPublishing, setIsPublishing] = React.useState(false);

  const posts = React.useMemo(() => {
    if (!myGuild?.posts) return [];
    return [...myGuild.posts]
      .map((p, idx) => ({ ...p, id: `post-${idx}`, _index: idx }))
      .filter(p => p != null)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [myGuild?.posts]);

  const handlePublishPost = React.useCallback(
    async ({ title, data }) => {
      if (!myGuild?.id) return;
      setIsPublishing(true);
      try {
        const user = await getCurrentUser();
        const { data: guild } = await client.models.Guild.get({ id: myGuild.id });
        if (!guild) return;
        const currentPosts = guild.posts || [];
        const newPost = {
          authorId: user?.username || user?.userId || studentId,
          title,
          data,
          createdAt: new Date().toISOString(),
        };
        await client.models.Guild.update({
          id: myGuild.id,
          posts: [...currentPosts, newPost],
          _version: guild._version,
        });
      } catch (err) {
        console.error('[GuildPage] Failed to publish post:', err);
      } finally {
        setIsPublishing(false);
      }
    },
    [client, myGuild?.id, studentId],
  );

  const handleDeletePost = React.useCallback(
    async (postId) => {
      if (!myGuild?.id) return;
      // Find original index from synthetic id
      const match = posts.find(p => p.id === postId);
      if (match == null) return;
      const postIndex = match._index;
      try {
        const { data: guild } = await client.models.Guild.get({ id: myGuild.id });
        if (!guild) return;
        const currentPosts = [...(guild.posts || [])];
        currentPosts.splice(postIndex, 1);
        await client.models.Guild.update({
          id: myGuild.id,
          posts: currentPosts,
          _version: guild._version,
        });
      } catch (err) {
        console.error('[GuildPage] Failed to delete post:', err);
      }
    },
    [client, myGuild?.id, posts],
  );

  // Check if current user is the guild leader
  const isLeader = React.useMemo(
    () => memberEntries.some((m) => m.studentId === studentId && m.role === 'LEADER'),
    [memberEntries, studentId]
  );

  // Build author display names from guild members
  const authorDisplayNames = React.useMemo(() => {
    const names = {};
    for (const m of memberEntries) {
      if (m.studentId) {
        names[m.studentId] = m.displayName;
      }
    }
    return names;
  }, [memberEntries]);

  // Save handler for the guild editor
  const handleGuildSave = React.useCallback(
    async ({ name, description, config, svg }) => {
      if (!myGuild?.id) return;
      try {
        const { data } = await client.models.Guild.get({ id: myGuild.id });
        await client.models.Guild.update({
          id: myGuild.id,
          name,
          description: description || undefined,
          _version: data?._version,
        });
      } catch (err) {
        console.error('[GuildPage] Failed to save guild:', err);
      }
    },
    [client, myGuild?.id]
  );

  // Delete handler for the guild
  const handleDeleteGuild = React.useCallback(async () => {
    if (!myGuild?.id) return;
    if (!window.confirm('Are you sure you want to delete this guild? This cannot be undone.')) return;
    try {
      const { data } = await client.models.Guild.get({ id: myGuild.id });
      await client.models.Guild.delete({ id: myGuild.id, _version: data?._version });
      router.push('/guilds');
    } catch (err) {
      console.error('[GuildPage] Failed to delete guild:', err);
    }
  }, [client, myGuild?.id, router]);

  if (isLoading) {
    return <AppSkeleton variant="detail" />;
  }

  // ── Not in a guild — show guild browser ─────────────────────────────────
  if (!myGuild) {
    return (
      <>
        <AppBar position="static" color="inherit" sx={{ transition: 'all 0.3s ease' }}>
          <MainToolbar>
            <Box sx={{ flexGrow: 1, margin: '1rem', transition: 'all 0.3s ease' }}>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Guilds
              </Typography>
            </Box>
          </MainToolbar>
        </AppBar>
        <Box sx={{ padding: '1.5rem', maxWidth: '48rem', margin: '0 auto' }}>
          <GuildJoinPanel
            availableGuilds={availableGuilds}
            myGuild={null}
            myGuildMembers={[]}
            studentId={studentId}
            onJoinGuild={handleJoinGuild}
            onLeaveGuild={handleLeaveGuild}
            isLoading={isLoading}
            level={level}
          />
        </Box>
      </>
    );
  }

  // ── In a guild — show guild detail page ─────────────────────────────────
  return (
    <>
      <AppBar position="static" color="inherit" sx={{ transition: 'all 0.3s ease' }}>
        <MainToolbar>
          <Box sx={{
            flexGrow: 1,
            margin: isScrolled ? '0.25rem 1rem' : '1rem',
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
              {myGuild.name}
            </Typography>
          </Box>
        </MainToolbar>
      </AppBar>

      {/* Spacer for GuildEditor's fixed ToolBarPlugin AppBar */}
      {isLeader && (
        <Box sx={{ minHeight: 'var(--app-bar-height, 4rem)', flexShrink: 0, transition: 'min-height 0.3s ease' }} />
      )}

      <Box sx={{ padding: '1.5rem', maxWidth: '48rem', margin: '0 auto' }}>
        {/* Guild Editor — leaders only */}
        {isLeader && (
          <Box sx={{ mb: 3 }}>
            <GuildEditor
              guildName={myGuild.name}
              guildDescription={myGuild.description}
              onSave={handleGuildSave}
              onDelete={handleDeleteGuild}
              autoSaveDelay={1500}
              level={level?.level || 1}
            />
          </Box>
        )}

        {/* Members section */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <GroupIcon color="action" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>
              Members
            </Typography>
            <Chip label={memberEntries.length} size="small" variant="outlined" />
          </Stack>
          <List dense disablePadding>
            {memberEntries.map((member) => (
              <ListItem key={member.id} disablePadding sx={{ py: 0.5 }}>
                <ListItemAvatar sx={{ minWidth: 44 }}>
                  <DiceBearAvatar
                    seed={member.avatarSeed || member.studentId}
                    size={32}
                    label={member.displayName}
                    style={member.avatarStyle}
                    overrides={member.avatarOverrides}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={member.displayName}
                  secondary={member.role === 'LEADER' ? '⭐ Leader' : 'Member'}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: member.studentId === studentId ? 600 : 400 }}
                />
                {member.studentId === studentId && (
                  <Chip label="You" size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />
                )}
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Guild Posts */}
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Guild Posts
          </Typography>
          <GuildPostFeed
            posts={posts}
            currentUserId={studentId}
            isMember={!!myMembership}
            onPublish={handlePublishPost}
            onDelete={handleDeletePost}
            isPublishing={isPublishing}
            authorDisplayNames={authorDisplayNames}
          />
        </Box>
      </Box>
    </>
  );
}

export default function WrappedPage() {
  const router = useRouter();
  const { id: guildId } = router.query;
  const [cohortId, setCohortId] = React.useState(undefined);

  // Fetch the guild record to get its cohortId for scoping the gamification provider
  React.useEffect(() => {
    if (!guildId) return;
    const client = getAmplifyClient();
    client.models.Guild.get({ id: guildId }).then(({ data }) => {
      if (data?.cohortId) setCohortId(data.cohortId);
    }).catch(() => {}); // Ignore errors — provider will work without cohortId
  }, [guildId]);

  return (
    <MyAuth>
      <GamificationProviderWrapper cohortId={cohortId}>
        <GuildPage />
      </GamificationProviderWrapper>
    </MyAuth>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'pages', 'components', 'editor.authoring', 'editor.files', 'editor.ai', 'editor.blocks', 'editor.shared'], nextI18nextConfig)),
    },
  };
}
