"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import GroupIcon from "@mui/icons-material/Group";
import SportsKabaddiIcon from "@mui/icons-material/SportsKabaddi";
import { SquadJoinPanel } from "@/components/Gamification/SquadJoinPanel";
import { SquadEditor } from "@/components/Gamification/SquadEditor";
import { ArmoriaShield } from "@/components/Gamification/ArmoriaShield";
import { DiceBearAvatar } from "@/components/Gamification/DiceBearAvatar";
import { useSquad, useXP, useCampaign } from "@/context/gamificationContext";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import { SquadPostFeed } from "@/components/Gamification/SquadPostFeed";
import { getAmplifyClient } from "@/utils/amplifyClient";
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import { useAvatarConfig } from "@/hooks/useAvatarConfig";
import { useRouter, useParams } from "next/navigation";
import {
  trackSquadViewed,
  trackSquadJoined,
  trackSquadLeft,
  trackSquadPostCreated,
  trackSquadPostDeleted,
} from "@/utils/analytics";

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

function SquadPage() {
  const router = useRouter();
  const { id: squadIdFromRoute } = useParams();
  const client = React.useMemo(() => getAmplifyClient(), []);

  const { mySquad, myMembership, squadLeaderboard, squadMembers, isLoading } =
    useSquad();
  const { level } = useXP();
  const { activeChallenges } = useCampaign();

  // Get the current user's studentId from the membership or session
  const studentId = myMembership?.studentId || "";
  const {
    style: myAvatarStyle,
    overrides: myAvatarOverrides,
    seed: myAvatarSeed,
  } = useAvatarConfig();

  // Track squad page view (deeper than pageView — includes squad/section context)
  React.useEffect(() => {
    if (mySquad?.id) {
      trackSquadViewed(mySquad.id, mySquad.cohortId || "");
    }
  }, [mySquad?.id, mySquad?.cohortId]);

  // Instructor view state — for instructors who aren't squad members
  const [isInstructor, setIsInstructor] = React.useState(false);
  const [instructorSquad, setInstructorSquad] = React.useState(null);
  const [instructorMembers, setInstructorMembers] = React.useState([]);

  // Check if the current user is an instructor of the squad's section
  React.useEffect(() => {
    if (mySquad || !squadIdFromRoute) return; // Already a member, skip
    let cancelled = false;
    async function checkInstructorAccess() {
      try {
        const { data: squad } = await client.models.Squad.get({
          id: squadIdFromRoute,
        });
        if (!squad || cancelled) return;

        // Check if user owns the section or is in the Instructors/Admins group
        const session = await fetchAuthSession();
        const groups =
          session?.tokens?.accessToken?.payload?.["cognito:groups"] || [];
        const isAdmin = groups.includes("Admins");
        const isInstructorGroup = groups.includes("Instructors");

        let hasAccess = isAdmin;
        if (!hasAccess && isInstructorGroup && squad.cohortId) {
          const { data: section } = await client.models.Section.get({
            id: squad.cohortId,
          });
          const currentUser = await getCurrentUser();
          hasAccess =
            section?.owner === currentUser?.username ||
            section?.instructor === currentUser?.username;
        }

        if (cancelled) return;
        if (hasAccess) {
          setIsInstructor(true);
          setInstructorSquad({
            id: squad.id,
            name: squad.name,
            totalXP: squad.totalXP || 0,
            description: squad.description,
            crestSvg: squad.crestSvg || null,
            members: squad.members || [],
            posts: squad.posts || [],
          });
          setInstructorMembers(
            (squad.members || []).map((m, idx) => ({
              id: `member-${idx}`,
              studentId: m.studentId,
              role: m.role,
              joinedAt: m.joinedAt,
            })),
          );
        }
      } catch (err) {
        console.warn("[SquadPage] Instructor access check failed:", err);
      }
    }
    checkInstructorAccess();
    return () => {
      cancelled = true;
    };
  }, [client, squadIdFromRoute, mySquad]);

  // Look up display names from Settings for all squad members
  const [displayNameMap, setDisplayNameMap] = React.useState({});
  React.useEffect(() => {
    if (!squadMembers.length || !client?.models?.Settings) return;
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
        console.warn("[SquadPage] Failed to fetch display names:", err);
      });
  }, [client, squadMembers.length]);

  // Map context data into panel format
  const availableSquads = React.useMemo(
    () =>
      squadLeaderboard.map((g) => ({
        id: g.id,
        name: g.name,
        totalXP: g.totalXP,
        memberCount: g.memberCount,
        description: g.description,
      })),
    [squadLeaderboard],
  );

  const mySquadEntry = React.useMemo(() => {
    if (!mySquad) return null;
    return {
      id: mySquad.id,
      name: mySquad.name,
      totalXP: mySquad.totalXP,
      memberCount: mySquad.memberCount,
      description: mySquad.description,
    };
  }, [mySquad]);

  const memberEntries = React.useMemo(
    () => {
      // Build a lookup from mySquad.members which has full avatar data
      const avatarLookup = {};
      if (mySquad?.members) {
        for (const m of mySquad.members) {
          if (m?.studentId) {
            avatarLookup[m.studentId] = {
              avatarSeed: m.avatarSeed || m.studentId,
              avatarStyle: m.avatarStyle,
              avatarOverrides: m.avatarOverrides,
            };
          }
        }
      }

      return squadMembers.map((m) => {
        // For the current user, prefer local hook data (most up-to-date)
        const avatar =
          m.studentId === studentId
            ? {
                avatarSeed: myAvatarSeed || studentId,
                avatarStyle: myAvatarStyle,
                avatarOverrides: myAvatarOverrides,
              }
            : avatarLookup[m.studentId] || { avatarSeed: m.studentId };

        return {
          id: m.id,
          studentId: m.studentId,
          displayName:
            displayNameMap[m.studentId] || friendlyName(m.studentId),
          role: m.role,
          joinedAt: m.joinedAt,
          ...avatar,
        };
      });
    },
    [
      squadMembers,
      mySquad?.members,
      studentId,
      displayNameMap,
      myAvatarSeed,
      myAvatarStyle,
      myAvatarOverrides,
    ],
  );

  const handleJoinSquad = React.useCallback(
    async (squadId) => {
      try {
        const { data: squad } = await client.models.Squad.get({ id: squadId });
        if (!squad) return;
        const currentMembers = squad.members || [];
        await client.models.Squad.update({
          id: squadId,
          members: [
            ...currentMembers,
            { studentId, role: "MEMBER", joinedAt: new Date().toISOString() },
          ],
          _version: squad._version,
        });
        trackSquadJoined(squadId, squad.cohortId || "");
      } catch (err) {
        console.error("[SquadPage] Failed to join squad:", err);
      }
    },
    [client, studentId],
  );

  const handleLeaveSquad = React.useCallback(async () => {
    if (!mySquad?.id) return;
    try {
      const { data: squad } = await client.models.Squad.get({ id: mySquad.id });
      if (!squad) return;
      const updatedMembers = (squad.members || []).filter(
        (m) => m.studentId !== studentId,
      );
      await client.models.Squad.update({
        id: mySquad.id,
        members: updatedMembers,
        _version: squad._version,
      });
      trackSquadLeft(mySquad.id, mySquad.cohortId || "");
    } catch (err) {
      console.error("[SquadPage] Failed to leave squad:", err);
    }
  }, [client, mySquad, studentId]);

  // ---- Squad Posts (embedded in Squad.posts) ----
  const [isPublishing, setIsPublishing] = React.useState(false);

  const posts = React.useMemo(() => {
    if (!mySquad?.posts) return [];
    return [...mySquad.posts]
      .map((p, idx) => ({ ...p, id: `post-${idx}`, _index: idx }))
      .filter((p) => p != null)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [mySquad?.posts]);

  const handlePublishPost = React.useCallback(
    async ({ title, data }) => {
      if (!mySquad?.id) return;
      setIsPublishing(true);
      try {
        const user = await getCurrentUser();
        const { data: squad } = await client.models.Squad.get({
          id: mySquad.id,
        });
        if (!squad) return;
        const currentPosts = squad.posts || [];
        const newPost = {
          authorId: user?.username || user?.userId || studentId,
          title,
          data,
          createdAt: new Date().toISOString(),
        };
        await client.models.Squad.update({
          id: mySquad.id,
          posts: [...currentPosts, newPost],
          _version: squad._version,
        });
        trackSquadPostCreated(mySquad.id, mySquad.cohortId || "");
      } catch (err) {
        console.error("[SquadPage] Failed to publish post:", err);
      } finally {
        setIsPublishing(false);
      }
    },
    [client, mySquad?.id, studentId],
  );

  const handleDeletePost = React.useCallback(
    async (postId) => {
      if (!mySquad?.id) return;
      // Find original index from synthetic id
      const match = posts.find((p) => p.id === postId);
      if (match == null) return;
      const postIndex = match._index;
      try {
        const { data: squad } = await client.models.Squad.get({
          id: mySquad.id,
        });
        if (!squad) return;
        const currentPosts = [...(squad.posts || [])];
        currentPosts.splice(postIndex, 1);
        await client.models.Squad.update({
          id: mySquad.id,
          posts: currentPosts,
          _version: squad._version,
        });
        trackSquadPostDeleted(mySquad.id, mySquad.cohortId || "");
      } catch (err) {
        console.error("[SquadPage] Failed to delete post:", err);
      }
    },
    [client, mySquad?.id, posts],
  );

  // Check if current user is the squad leader
  const isLeader = React.useMemo(
    () =>
      memberEntries.some(
        (m) => m.studentId === studentId && m.role === "LEADER",
      ),
    [memberEntries, studentId],
  );

  // Build author display names from squad members
  const authorDisplayNames = React.useMemo(() => {
    const names = {};
    for (const m of memberEntries) {
      if (m.studentId) {
        names[m.studentId] = m.displayName;
      }
    }
    return names;
  }, [memberEntries]);

  // Save handler for the squad editor
  const handleSquadSave = React.useCallback(
    async ({ name, description, config, svg }) => {
      if (!mySquad?.id) return;
      try {
        const { data } = await client.models.Squad.get({ id: mySquad.id });
        await client.models.Squad.update({
          id: mySquad.id,
          name,
          description: description || undefined,
          crestSvg: svg || undefined,
          _version: data?._version,
        });
      } catch (err) {
        console.error("[SquadPage] Failed to save squad:", err);
      }
    },
    [client, mySquad?.id],
  );

  // Delete handler for the squad
  const handleDeleteSquad = React.useCallback(async () => {
    if (!mySquad?.id) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this squad? This cannot be undone.",
      )
    )
      return;
    try {
      const { data } = await client.models.Squad.get({ id: mySquad.id });
      await client.models.Squad.delete({
        id: mySquad.id,
        _version: data?._version,
      });
      router.push("/squads");
    } catch (err) {
      console.error("[SquadPage] Failed to delete squad:", err);
    }
  }, [client, mySquad?.id, router]);

  if (isLoading) {
    return null;
  }

  // ── Instructor view — read-only squad detail ───────────────────────────
  if (!mySquad && isInstructor && instructorSquad) {
    const instructorPosts = [...(instructorSquad.posts || [])]
      .map((p, idx) => ({ ...p, id: `post-${idx}`, _index: idx }))
      .filter((p) => p != null)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return (
      <>
        <Box sx={{ padding: "1.5rem", maxWidth: "48rem", margin: "0 auto" }}>
          {/* Coat of Arms */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <ArmoriaShield
              squadId={instructorSquad.id}
              squadName={instructorSquad.name || "Squad"}
              crestSvg={instructorSquad.crestSvg}
              size={120}
            />
          </Box>

          {instructorSquad.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {instructorSquad.description}
            </Typography>
          )}

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Total XP: {instructorSquad.totalXP}
          </Typography>

          {/* Members section */}
          <Box sx={{ mb: 3 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1.5 }}
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
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 2,
              }}
            >
              {instructorMembers.map((member) => (
                <Box
                  key={member.id}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: 0.5,
                  }}
                >
                  <DiceBearAvatar
                    seed={member.studentId}
                    size={64}
                    label={friendlyName(member.studentId)}
                  />
                  <Typography variant="body2" noWrap sx={{ maxWidth: "100%" }}>
                    {friendlyName(member.studentId)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {member.role === "LEADER" ? "⭐ Leader" : "Member"}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Squad Posts — read-only */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Squad Posts
            </Typography>
            <SquadPostFeed
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

  // ── Not in a squad — show squad browser ─────────────────────────────────
  if (!mySquad) {
    return (
      <>
        <Box sx={{ padding: "1.5rem", maxWidth: "48rem", margin: "0 auto" }}>
          <SquadJoinPanel
            availableSquads={availableSquads}
            mySquad={null}
            mySquadMembers={[]}
            studentId={studentId}
            onJoinSquad={handleJoinSquad}
            onLeaveSquad={handleLeaveSquad}
            isLoading={isLoading}
            level={level}
          />
        </Box>
      </>
    );
  }

  // ── In a squad — show squad detail page ─────────────────────────────────
  return (
    <>
      {/* Spacer for SquadEditor's fixed ToolBarPlugin AppBar */}
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
        {/* Coat of Arms */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <ArmoriaShield
            squadId={mySquad.id}
            squadName={mySquad.name}
            crestSvg={mySquad.crestSvg}
            armoriaUnlocked={isLeader && (level?.level || 1) >= 2}
            size={120}
          />
        </Box>

        {/* Squad Editor — leaders only */}
        {isLeader && (
          <Box sx={{ mb: 3 }}>
            <SquadEditor
              squadName={mySquad.name}
              squadDescription={mySquad.description}
              crestConfig={null}
              onSave={handleSquadSave}
              onDelete={handleDeleteSquad}
              autoSaveDelay={1500}
              level={level?.level || 1}
            />
          </Box>
        )}

        {/* Members section */}
        <Box sx={{ mb: 3 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
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
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 2,
            }}
          >
            {memberEntries.map((member) => (
              <Box
                key={member.id}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 0.5,
                }}
              >
                <DiceBearAvatar
                  seed={member.avatarSeed || member.studentId}
                  size={64}
                  label={member.displayName}
                  style={member.avatarStyle}
                  overrides={member.avatarOverrides}
                />
                <Typography
                  variant="body2"
                  fontWeight={member.studentId === studentId ? 600 : 400}
                  noWrap
                  sx={{ maxWidth: "100%" }}
                >
                  {member.displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {member.role === "LEADER" ? "⭐ Leader" : "Member"}
                </Typography>
                {member.studentId === studentId && (
                  <Chip
                    label="You"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Active Challenges */}
        {activeChallenges.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <SportsKabaddiIcon color="action" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Active Challenges
              </Typography>
              <Chip
                label={activeChallenges.length}
                size="small"
                variant="outlined"
              />
            </Stack>
            <Stack spacing={1.5}>
              {activeChallenges.map((challenge) => (
                <Box
                  key={challenge.id}
                  sx={{
                    p: 1.5,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600}>
                    {challenge.title}
                  </Typography>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mt: 0.5, mb: 0.5 }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {challenge.currentXP?.toLocaleString() || 0} /{" "}
                      {challenge.targetXP?.toLocaleString()} XP
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(challenge.progressPercent || 0)}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(challenge.progressPercent || 0, 100)}
                    sx={{ height: 6, borderRadius: 1 }}
                  />
                  {challenge.deadline && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      Deadline:{" "}
                      {new Date(challenge.deadline).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
            <Divider sx={{ mt: 2 }} />
          </Box>
        )}

        {/* Squad Posts */}
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Squad Posts
          </Typography>
          <SquadPostFeed
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
  const { id: squadId } = useParams();
  const [cohortId, setCohortId] = React.useState(undefined);

  // Fetch the squad record to get its cohortId for scoping the gamification provider
  React.useEffect(() => {
    if (!squadId) return;
    const client = getAmplifyClient();
    client.models.Squad.get({ id: squadId })
      .then(({ data }) => {
        if (data?.cohortId) setCohortId(data.cohortId);
      })
      .catch(() => {}); // Ignore errors — provider will work without cohortId
  }, [squadId]);

  return (
    <GamificationProviderWrapper cohortId={cohortId}>
      <SquadPage />
    </GamificationProviderWrapper>
  );
}
