"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import GroupIcon from "@mui/icons-material/Group";
import AppSkeleton from "@/components/AppSkeleton";
import MyAuth from "@/components/AmplifyAuthenticator";
import { GuildJoinPanel } from "@/components/Gamification/GuildJoinPanel";
import { GuildEditor } from "@/components/Gamification/GuildEditor";
import { DiceBearAvatar } from "@/components/Gamification/DiceBearAvatar";
import { useGuild, useXP } from "@/context/gamificationContext";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import { GuildPostFeed } from "@/components/Gamification/GuildPostFeed";
import { getAmplifyClient } from "@/utils/amplifyClient";
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import { useAvatarConfig } from "@/hooks/useAvatarConfig";
import { useRouter, useParams } from "next/navigation";

/**
 * Derive a short friendly label from a studentId.
 * If it looks like a UUID, use first 8 chars with "Member-" prefix.
 * Otherwise return as-is.
 */
function friendlyName(studentId) {
  if (!studentId) return "Unknown";
  // UUID pattern
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(studentId)) {
    return `Member-${studentId.slice(0, 6)}`;
  }
  // Email — use part before @
  if (studentId.includes("@")) {
    return studentId.split("@")[0];
  }
  return studentId;
}

function GuildPage() {
  const router = useRouter();
  const { id: guildIdFromRoute } = useParams();
  const client = React.useMemo(() => getAmplifyClient(), []);

  const { myGuild, myMembership, guildLeaderboard, guildMembers, isLoading } =
    useGuild();
  const { level } = useXP();

  // Get the current user's studentId from the membership or session
  const studentId = myMembership?.studentId || "";
  const {
    style: myAvatarStyle,
    overrides: myAvatarOverrides,
    seed: myAvatarSeed,
  } = useAvatarConfig();

  // Instructor view state — for instructors who aren't guild members
  const [isInstructor, setIsInstructor] = React.useState(false);
  const [instructorGuild, setInstructorGuild] = React.useState(null);
  const [instructorMembers, setInstructorMembers] = React.useState([]);

  // Check if the current user is an instructor of the guild's section
  React.useEffect(() => {
    if (myGuild || !guildIdFromRoute) return; // Already a member, skip
    let cancelled = false;
    async function checkInstructorAccess() {
      try {
        const { data: guild } = await client.models.Guild.get({
          id: guildIdFromRoute,
        });
        if (!guild || cancelled) return;

        // Check if user owns the section or is in the Instructors/Admins group
        const session = await fetchAuthSession();
        const groups =
          session?.tokens?.accessToken?.payload?.["cognito:groups"] || [];
        const isAdmin = groups.includes("Admins");
        const isInstructorGroup = groups.includes("Instructors");

        let hasAccess = isAdmin;
        if (!hasAccess && isInstructorGroup && guild.cohortId) {
          const { data: section } = await client.models.Section.get({
            id: guild.cohortId,
          });
          const currentUser = await getCurrentUser();
          hasAccess =
            section?.owner === currentUser?.username ||
            section?.instructor === currentUser?.username;
        }

        if (cancelled) return;
        if (hasAccess) {
          setIsInstructor(true);
          setInstructorGuild({
            id: guild.id,
            name: guild.name,
            totalXP: guild.totalXP || 0,
            description: guild.description,
            members: guild.members || [],
            posts: guild.posts || [],
          });
          setInstructorMembers(
            (guild.members || []).map((m, idx) => ({
              id: `member-${idx}`,
              studentId: m.studentId,
              role: m.role,
              joinedAt: m.joinedAt,
            })),
          );
        }
      } catch (err) {
        console.warn("[GuildPage] Instructor access check failed:", err);
      }
    }
    checkInstructorAccess();
    return () => {
      cancelled = true;
    };
  }, [client, guildIdFromRoute, myGuild]);

  // Look up display names from Settings for all guild members
  const [displayNameMap, setDisplayNameMap] = React.useState({});
  React.useEffect(() => {
    if (!guildMembers.length || !client?.models?.Settings) return;
    client.models.Settings.list()
      .then(({ data }) => {
        const map = {};
        for (const s of data || []) {
          if (s?.owner && s?.displayName) {
            map[s.owner] = s.displayName;
          }
        }
        setDisplayNameMap(map);
      })
      .catch((err) => {
        console.warn("[GuildPage] Failed to fetch display names:", err);
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
    [guildLeaderboard],
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
    [
      guildMembers,
      studentId,
      displayNameMap,
      myAvatarSeed,
      myAvatarStyle,
      myAvatarOverrides,
    ],
  );

  const handleJoinGuild = React.useCallback(
    async (guildId) => {
      try {
        const { data: guild } = await client.models.Guild.get({ id: guildId });
        if (!guild) return;
        const currentMembers = guild.members || [];
        await client.models.Guild.update({
          id: guildId,
          members: [
            ...currentMembers,
            { studentId, role: "MEMBER", joinedAt: new Date().toISOString() },
          ],
          _version: guild._version,
        });
      } catch (err) {
        console.error("[GuildPage] Failed to join guild:", err);
      }
    },
    [client, studentId],
  );

  const handleLeaveGuild = React.useCallback(async () => {
    if (!myGuild?.id) return;
    try {
      const { data: guild } = await client.models.Guild.get({ id: myGuild.id });
      if (!guild) return;
      const updatedMembers = (guild.members || []).filter(
        (m) => m.studentId !== studentId,
      );
      await client.models.Guild.update({
        id: myGuild.id,
        members: updatedMembers,
        _version: guild._version,
      });
    } catch (err) {
      console.error("[GuildPage] Failed to leave guild:", err);
    }
  }, [client, myGuild, studentId]);

  // ---- Guild Posts (embedded in Guild.posts) ----
  const [isPublishing, setIsPublishing] = React.useState(false);

  const posts = React.useMemo(() => {
    if (!myGuild?.posts) return [];
    return [...myGuild.posts]
      .map((p, idx) => ({ ...p, id: `post-${idx}`, _index: idx }))
      .filter((p) => p != null)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [myGuild?.posts]);

  const handlePublishPost = React.useCallback(
    async ({ title, data }) => {
      if (!myGuild?.id) return;
      setIsPublishing(true);
      try {
        const user = await getCurrentUser();
        const { data: guild } = await client.models.Guild.get({
          id: myGuild.id,
        });
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
        console.error("[GuildPage] Failed to publish post:", err);
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
      const match = posts.find((p) => p.id === postId);
      if (match == null) return;
      const postIndex = match._index;
      try {
        const { data: guild } = await client.models.Guild.get({
          id: myGuild.id,
        });
        if (!guild) return;
        const currentPosts = [...(guild.posts || [])];
        currentPosts.splice(postIndex, 1);
        await client.models.Guild.update({
          id: myGuild.id,
          posts: currentPosts,
          _version: guild._version,
        });
      } catch (err) {
        console.error("[GuildPage] Failed to delete post:", err);
      }
    },
    [client, myGuild?.id, posts],
  );

  // Check if current user is the guild leader
  const isLeader = React.useMemo(
    () =>
      memberEntries.some(
        (m) => m.studentId === studentId && m.role === "LEADER",
      ),
    [memberEntries, studentId],
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
        console.error("[GuildPage] Failed to save guild:", err);
      }
    },
    [client, myGuild?.id],
  );

  // Delete handler for the guild
  const handleDeleteGuild = React.useCallback(async () => {
    if (!myGuild?.id) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this guild? This cannot be undone.",
      )
    )
      return;
    try {
      const { data } = await client.models.Guild.get({ id: myGuild.id });
      await client.models.Guild.delete({
        id: myGuild.id,
        _version: data?._version,
      });
      router.push("/guilds");
    } catch (err) {
      console.error("[GuildPage] Failed to delete guild:", err);
    }
  }, [client, myGuild?.id, router]);

  if (isLoading) {
    return <AppSkeleton variant="detail" />;
  }

  // ── Instructor view — read-only guild detail ───────────────────────────
  if (!myGuild && isInstructor && instructorGuild) {
    const instructorPosts = [...(instructorGuild.posts || [])]
      .map((p, idx) => ({ ...p, id: `post-${idx}`, _index: idx }))
      .filter((p) => p != null)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return (
      <>
        <Box sx={{ padding: "1.5rem", maxWidth: "48rem", margin: "0 auto" }}>
          {instructorGuild.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {instructorGuild.description}
            </Typography>
          )}

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Total XP: {instructorGuild.totalXP}
          </Typography>

          {/* Members section */}
          <Box sx={{ mb: 3 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <GroupIcon color="action" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Members
              </Typography>
              <Chip
                label={instructorMembers.length}
                size="small"
                variant="outlined"
              />
            </Stack>
            <List dense disablePadding>
              {instructorMembers.map((member) => (
                <ListItem key={member.id} disablePadding sx={{ py: 0.5 }}>
                  <ListItemAvatar sx={{ minWidth: 44 }}>
                    <DiceBearAvatar
                      seed={member.studentId}
                      size={32}
                      label={friendlyName(member.studentId)}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={friendlyName(member.studentId)}
                    secondary={
                      member.role === "LEADER" ? "⭐ Leader" : "Member"
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Guild Posts — read-only */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Guild Posts
            </Typography>
            <GuildPostFeed
              posts={instructorPosts}
              currentUserId=""
              isMember={false}
              onPublish={() => {}}
              onDelete={() => {}}
              isPublishing={false}
              authorDisplayNames={{}}
            />
          </Box>
        </Box>
      </>
    );
  }

  // ── Not in a guild — show guild browser ─────────────────────────────────
  if (!myGuild) {
    return (
      <>
        <Box sx={{ padding: "1.5rem", maxWidth: "48rem", margin: "0 auto" }}>
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
      {/* Spacer for GuildEditor's fixed ToolBarPlugin AppBar */}
      {isLeader && (
        <Box
          sx={{
            minHeight: "var(--app-bar-height, 4rem)",
            flexShrink: 0,
            transition: "min-height 0.3s ease",
          }}
        />
      )}

      <Box sx={{ padding: "1.5rem", maxWidth: "48rem", margin: "0 auto" }}>
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
            <Chip
              label={memberEntries.length}
              size="small"
              variant="outlined"
            />
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
                  secondary={member.role === "LEADER" ? "⭐ Leader" : "Member"}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: member.studentId === studentId ? 600 : 400,
                  }}
                />
                {member.studentId === studentId && (
                  <Chip
                    label="You"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
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
  const { id: guildId } = useParams();
  const [cohortId, setCohortId] = React.useState(undefined);

  // Fetch the guild record to get its cohortId for scoping the gamification provider
  React.useEffect(() => {
    if (!guildId) return;
    const client = getAmplifyClient();
    client.models.Guild.get({ id: guildId })
      .then(({ data }) => {
        if (data?.cohortId) setCohortId(data.cohortId);
      })
      .catch(() => {}); // Ignore errors — provider will work without cohortId
  }, [guildId]);

  return (
    <MyAuth>
      <GamificationProviderWrapper cohortId={cohortId}>
        <GuildPage />
      </GamificationProviderWrapper>
    </MyAuth>
  );
}
