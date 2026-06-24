"use client";
import React, { useEffect, useState, useRef } from "react";
import { getAmplifyClient } from "@/utils/amplifyClient";
import { useTranslations } from "next-intl";

import {
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  LinearProgress,
  Paper,
  Tooltip,
  Avatar,
  Divider,
  IconButton,
  Alert,
} from "@mui/material";

import PeopleIcon from "@mui/icons-material/People";
import EditNoteIcon from "@mui/icons-material/EditNote";
import LazyCardMedia from "@/components/LazyCardMedia";
import SchoolIcon from "@mui/icons-material/School";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import RateReviewIcon from "@mui/icons-material/RateReview";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GroupsIcon from "@mui/icons-material/Groups";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import { FilesProvider } from "@/context/fileContext";
import { useChatPageContext } from "@/hooks/useChatPageContext";
import { BadgeShelf } from "@/components/Gamification/BadgeShelf";
import { NailedItWall } from "@/components/Gamification/NailedItWall";
import { StreakIndicator } from "@/components/Gamification/StreakIndicator";
import { StreakShield } from "@/components/Gamification/StreakShield";
import { ProgressRings } from "@/components/Gamification/ProgressRings";
import { CampaignBriefing } from "@/components/Gamification/CampaignBriefing";
import { BossBattleCard } from "@/components/Gamification/BossBattleCard";
import { CampaignTimeline } from "@/components/Gamification/CampaignTimeline";
import { SkillTreePopupButton } from "@/components/SkillTreePopupButton";
import { LevelBadge } from "@/components/Gamification/LevelBadge";
import { ArmoriaShield } from "@/components/Gamification/ArmoriaShield";
import { AvatarDisplay } from "@/components/Gamification/AvatarDisplay";
import { PracticeDrillDialog } from "@/components/PracticeDrill";
import { OpenPeerReviewButton } from "@/components/PeerReview/OpenPeerReviewButton";
import {
  useXP,
  useProgress,
  useCampaign,
  useBadges,
  useSquad,
} from "@/context/gamificationContext";
import { useAvatarConfig } from "@/hooks/useAvatarConfig";
import { useStudentMemory } from "@/hooks/useStudentMemory";
import { parseMemoryMarkdown } from "@/utils/memoryParser";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import { useRouter } from "next/navigation";
import { PrefetchButton } from "@/components/PrefetchButton";
import { createPeerReviewRoom } from "../actions/peerReview";
import AuthContext from "@/context/authContext";

function gradeColor(pct = 0) {
  if (pct >= 80) return "success";
  if (pct >= 60) return "warning";
  return "error";
}

function gradeLabel(pct = 0) {
  if (pct >= 90) return "Excellent";
  if (pct >= 80) return "Good";
  if (pct >= 60) return "Fair";
  return "Needs work";
}

function getUserId(user) {
  return (
    user?.signInUserSession?.idToken?.payload?.sub ||
    user?.userId ||
    user?.username
  );
}

// ── Stat chip used in the hero bar ────────────────────────────────────────
function StatPill({ icon, label, value, color = "default" }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 56,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          color: `${color}.main`,
        }}
      >
        {icon}
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
          {value}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
        {label}
      </Typography>
    </Box>
  );
}

function Index({ signOut, user }) {
  const t = useTranslations("pages");
  const { session: authSession } = React.useContext(AuthContext);

  // ── data state ────────────────────────────────────────────────────────────
  const [sections, setSections] = useState([]);
  const [mySections, setMySections] = useState([]);
  const [assignments, setAssignment] = useState([]);
  const [myAssignments, setMyAssignment] = useState([]);
  const [units, setUnits] = useState({});
  const router = useRouter();

  const [myGradeMap, setMyGradeMap] = React.useState({});
  const [myGrades, setMyGrades] = React.useState([]);
  const [nailedItBlocks, setNailedItBlocks] = React.useState([]);
  const gradeCountRef = useRef(0);
  const assignmentCountRef = useRef(0);
  const sectionCountRef = useRef(0);

  // ── gamification ──────────────────────────────────────────────────────────
  const { totalXP, level, sectionLevel, xpLogs } = useXP();
  const { modules: progressModules, streak } = useProgress();
  const { campaign, activeChallenges, completedChallenges } = useCampaign();
  const { badges: earnedBadges } = useBadges();
  const { mySquad, myMembership } = useSquad();

  // ── avatar ────────────────────────────────────────────────────────────────
  const {
    style: avatarStyle,
    overrides: avatarOverrides,
    seed: configSeed,
    isLoaded,
    glowRing,
  } = useAvatarConfig();
  const userId = authSession?.idToken?.payload?.sub || getUserId(user);
  const avatarSeed =
    authSession?.idToken?.payload?.sub ||
    user?.attributes?.sub ||
    user?.userId ||
    user?.username ||
    "";

  // ── AI memory ─────────────────────────────────────────────────────────────
  const rawMemory = useStudentMemory(userId);
  const parsedMemory = React.useMemo(
    () => (rawMemory ? parseMemoryMarkdown(rawMemory) : null),
    [rawMemory],
  );

  // ── drill dialog state ────────────────────────────────────────────────────
  const [drillOpen, setDrillOpen] = React.useState(false);
  const [drillTarget, setDrillTarget] = React.useState(null); // { unitId, unitName }

  // ── chat page context ─────────────────────────────────────────────────────
  useChatPageContext({ sections: mySections });

  // ── user groups / role ────────────────────────────────────────────────────
  const myGroups = authSession?.groups || user?.groups || [];
  const isInstructorOrAdmin = myGroups.some((g) =>
    ["Admins", "Moderators", "Instructors"].includes(g),
  );

  // ── redirect instructors/admins to sections dashboard ─────────────────────
  useEffect(() => {
    if (isInstructorOrAdmin) {
      router.replace("/sections");
    }
  }, [isInstructorOrAdmin, router]);

  // ── subscriptions (unchanged logic) ───────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const client = getAmplifyClient();
    const subscription = client.models.Grade.observeQuery().subscribe({
      next: ({ items }) => {
        items = items.filter((item) => item != null && item.id != null);
        if (items.length === gradeCountRef.current && gradeCountRef.current > 0)
          return;
        gradeCountRef.current = items.length;
        const myCompletedGrades = items.filter(
          (g) => g.complete === true && g.owner === userId,
        );
        setMyGrades(myCompletedGrades);
        const gradeMap = {};
        for (const g of myCompletedGrades) {
          if (g.unitID) {
            if (!gradeMap[g.unitID]) gradeMap[g.unitID] = [];
            gradeMap[g.unitID].push(g);
          }
        }
        setMyGradeMap(gradeMap);
      },
      error: (error) => {
        const msg = error?.message || error?.errors?.[0]?.message || JSON.stringify(error);
        if (msg === "{}" || msg === "undefined" || msg.includes("DuplicatedOperationError") || msg.includes("Not Authorized")) return;
        console.error("[Index] Grade subscription error:", error);
      },
    });
    return () => subscription.unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const client = getAmplifyClient();
    const subscription = client.models.Assignment.observeQuery().subscribe({
      next: ({ items }) => {
        items = items.filter((item) => item != null && item.id != null);
        if (
          items.length === assignmentCountRef.current &&
          assignmentCountRef.current > 0
        )
          return;
        assignmentCountRef.current = items.length;
        setMyAssignment(items.filter((a) => a.owner === userId));
        setAssignment(items.filter((a) => a.owner !== userId));
      },
      error: (error) => {
        const msg = error?.message || error?.errors?.[0]?.message || JSON.stringify(error);
        if (msg === "{}" || msg === "undefined" || msg.includes("DuplicatedOperationError") || msg.includes("Not Authorized")) return;
        console.error("[Index] Assignment subscription error:", error);
      },
    });
    return () => subscription.unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const client = getAmplifyClient();
    const subscription = client.models.Section.observeQuery().subscribe({
      next: ({ items }) => {
        const validItems = items.filter(
          (item) => item != null && item.id != null,
        );
        if (
          validItems.length === sectionCountRef.current &&
          sectionCountRef.current > 0
        )
          return;
        sectionCountRef.current = validItems.length;
        setMySections(validItems.filter((s) => s.owner === userId));
        setSections(
          validItems.filter(
            (s) =>
              s.owner !== userId && s.learner && myGroups.includes(s.learner),
          ),
        );
      },
      error: (error) => {
        const msg = error?.message || error?.errors?.[0]?.message || JSON.stringify(error);
        if (msg === "{}" || msg === "undefined" || msg.includes("DuplicatedOperationError") || msg.includes("Not Authorized")) return;
        console.error("[Index] Section subscription error:", error);
      },
    });
    return () => subscription.unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const client = getAmplifyClient();
    const subscription = client.models.Unit.observeQuery().subscribe({
      next: ({ items }) => {
        const unitsById = {};
        items.forEach((unit) => {
          unitsById[unit.id] = unit;
        });
        setUnits(unitsById);
      },
      error: (error) => {
        const msg = error?.message || error?.errors?.[0]?.message || JSON.stringify(error);
        if (msg === "{}" || msg === "undefined" || msg.includes("DuplicatedOperationError") || msg.includes("Not Authorized")) return;
        console.error("[Index] Unit subscription error:", error);
      },
    });
    return () => subscription.unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const client = getAmplifyClient();
    const nailedItSub = client.models.NailedIt?.observeQuery?.({
      filter: { owner: { eq: userId } },
    })?.subscribe?.({
      next: ({ items }) => {
        const valid = items.filter((i) => i != null && i.id != null);
        setNailedItBlocks(
          valid.map((n) => ({
            id: n.id,
            question: n.question || "",
            nailedItReason: n.nailedItReason || "",
            homeworkTitle: n.homeworkTitle || "",
            createdAt: n.createdAt || new Date().toISOString(),
          })),
        );
      },
      error: (err) => console.warn("[Index] NailedIt subscription error:", err),
    });
    return () => nailedItSub?.unsubscribe?.();
  }, [userId]);

  // ── prefetch workbook routes ───────────────────────────────────────────────
  useEffect(() => {
    if (!assignments?.length) return;
    assignments.slice(0, 3).forEach((a) => {
      if (a.unitID) router.prefetch(`/workbook/${a.unitID}`);
    });
  }, [assignments, router]);

  // ── campaign chapters ─────────────────────────────────────────────────────
  const campaignChapters = React.useMemo(() => {
    const all = [...(activeChallenges || []), ...(completedChallenges || [])];
    return all.map((c, i) => ({
      id: c.id,
      title: c.title || `Challenge ${i + 1}`,
      setting: c.setting,
      stakes: c.stakes,
      targetXP: c.targetXP || 0,
      currentXP: c.currentXP || 0,
      active: c.active ?? false,
      chapterOrder: c.chapterOrder ?? i,
    }));
  }, [activeChallenges, completedChallenges]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const openDrill = (unitId, unitName) => {
    setDrillTarget({ unitId, unitName });
    setDrillOpen(true);
  };

  const handleCreateReviewRoom = async (gradeId, invitedUserIds) => {
    const grade = myGrades.find((g) => g.id === gradeId);
    const result = await createPeerReviewRoom(
      gradeId,
      invitedUserIds,
      grade?.sectionID || "",
      userId,
    );
    if (!result?.success)
      throw new Error(result?.error || "Failed to create room");
    return result.roomId;
  };

  const hasNoSections = sections.length === 0 && mySections.length === 0;

  // All assignments the learner should work on (from enrolled sections)
  const allAssignments = [...assignments, ...myAssignments];
  const pendingAssignments = allAssignments.filter(
    (a) => !myGradeMap[a.unitID]?.length,
  );
  const completedAssignmentsList = allAssignments.filter(
    (a) => myGradeMap[a.unitID]?.length > 0,
  );

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Box
        data-tour="dashboard"
        sx={{
          width: "100%",
          maxWidth: "80rem",
          mx: "auto",
          px: { xs: 1.5, sm: 2 },
          py: 3,
        }}
      >
        {/* ── HERO CARD ────────────────────────────────────────────────── */}
        <Paper
          data-tour="dashboard-hero"
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(25,35,55,0.95) 0%, rgba(15,20,40,0.98) 100%)"
                : "linear-gradient(135deg, rgba(21,101,192,0.92) 0%, rgba(13,71,161,0.97) 100%)",
            color: "#fff",
          }}
        >
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* Avatar */}
            <Box sx={{ flexShrink: 0, position: "relative" }}>
              {avatarSeed && isLoaded ? (
                <AvatarDisplay
                  seed={avatarSeed}
                  size={72}
                  style={avatarStyle}
                  overrides={avatarOverrides}
                  glowRing={glowRing}
                  guildCrestSvg={mySquad?.crestSvg ?? null}
                  guildName={mySquad?.name}
                  guildId={mySquad?.id}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: "rgba(255,255,255,0.2)",
                    fontSize: 32,
                  }}
                >
                  {(user?.username || "?")[0]?.toUpperCase()}
                </Avatar>
              )}
            </Box>

            {/* XP + level */}
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "inherit", lineHeight: 1 }}
                >
                  {user?.attributes?.name || user?.username || "Learner"}
                </Typography>
                {level && (
                  <Chip
                    label={`Lv. ${level.level} · ${level.label}`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.15)",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                    }}
                  />
                )}
              </Box>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.7)", display: "block", mb: 1 }}
              >
                {totalXP?.toLocaleString() || 0} XP total
              </Typography>
              {level && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={level.progressPercent || 0}
                    sx={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: "rgba(255,255,255,0.2)",
                      "& .MuiLinearProgress-bar": { bgcolor: "#fff" },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255,255,255,0.8)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {level.progressPercent || 0}%
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Stats row */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <StreakIndicator
                currentStreak={streak?.currentStreak || 0}
                size="medium"
                showEmpty={!isInstructorOrAdmin}
              />
              <StreakShield
                freezesRemaining={streak?.freezesRemaining || 0}
                freezesUsed={streak?.freezesUsed || 0}
                size="medium"
                showEmpty={!isInstructorOrAdmin}
              />
              <StatPill
                icon={<EmojiEventsIcon sx={{ fontSize: "1rem" }} />}
                label="Assignments"
                value={
                  completedAssignmentsList.length + pendingAssignments.length
                }
                color="warning"
              />
              {earnedBadges?.length > 0 && (
                <StatPill
                  icon={<SchoolIcon sx={{ fontSize: "1rem" }} />}
                  label="Badges"
                  value={earnedBadges.length}
                  color="success"
                />
              )}
            </Box>
          </Box>

          {/* Squad banner (if in a squad) */}
          {mySquad && (
            <Box
              component="a"
              href={`/squad/${mySquad.id}`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 3,
                py: 1.5,
                bgcolor: "rgba(0,0,0,0.2)",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                textDecoration: "none",
                "&:hover": { bgcolor: "rgba(0,0,0,0.3)" },
              }}
            >
              <ArmoriaShield
                squadId={mySquad.id}
                squadName={mySquad.name}
                crestSvg={mySquad.crestSvg}
                size={32}
                showName={false}
              />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.6)", display: "block" }}
                >
                  Your Squad
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#fff", fontWeight: 600 }}
                >
                  {mySquad.name}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label={`${(mySquad.totalXP || 0).toLocaleString()} XP`}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontSize: "0.7rem",
                  }}
                />
                <ArrowForwardIcon
                  sx={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)" }}
                />
              </Box>
            </Box>
          )}
        </Paper>

        {/* ── AI MEMORY PANEL ──────────────────────────────────────────── */}
        {parsedMemory &&
          (parsedMemory.demonstratedStrengths ||
            parsedMemory.recurringMistakes) && (
            <Paper
              data-tour="dashboard-ai-memory"
              elevation={0}
              sx={{
                mb: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                p: 2,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                <AutoFixHighIcon
                  sx={{ fontSize: "1rem", color: "primary.main" }}
                />
                Your Learning Profile
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                {parsedMemory.demonstratedStrengths && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="success.main"
                      sx={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Strengths
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5, lineHeight: 1.6 }}
                    >
                      {parsedMemory.demonstratedStrengths.slice(0, 200)}
                    </Typography>
                  </Box>
                )}
                {parsedMemory.recurringMistakes && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="warning.main"
                      sx={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Focus Areas
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5, lineHeight: 1.6 }}
                    >
                      {parsedMemory.recurringMistakes.slice(0, 200)}
                    </Typography>
                  </Box>
                )}
              </Box>
              {parsedMemory.recurringMistakes && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AutoFixHighIcon />}
                    onClick={() =>
                      openDrill(
                        sections[0]?.id || mySections[0]?.id || "",
                        "Focus Areas Practice",
                      )
                    }
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Practice my weak areas
                  </Button>
                </Box>
              )}
            </Paper>
          )}

        {/* ── PENDING ASSIGNMENTS ──────────────────────────────────────── */}
        {pendingAssignments.length > 0 && (
          <Box data-tour="dashboard-pending-assignments" sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <HourglassTopIcon color="warning" />
              {t("index.myAssignments")}
              <Chip
                label={pendingAssignments.length}
                size="small"
                color="warning"
                sx={{ fontWeight: 700 }}
              />
            </Typography>

            <Stack spacing={2}>
              {pendingAssignments.map((assignment, index) => {
                const unit = units[assignment.unitID];
                const timeZone =
                  Intl.DateTimeFormat().resolvedOptions().timeZone;
                const localTime = assignment.dueDate
                  ? new Date(assignment.dueDate).toLocaleString(undefined, {
                      timeZone,
                    })
                  : null;
                const isOverdue =
                  assignment.dueDate &&
                  new Date(assignment.dueDate) < new Date();

                return (
                  <Card
                    data-tour="assignment-card-pending"
                    key={assignment.id || index}
                    elevation={0}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderLeft: "4px solid",
                      borderLeftColor: isOverdue
                        ? "error.main"
                        : "warning.main",
                      borderRadius: 2,
                      display: "flex",
                      overflow: "hidden",
                      transition: "box-shadow 0.2s",
                      "&:hover": { boxShadow: 4 },
                    }}
                  >
                    {unit?.featuredImage && (
                      <Box
                        sx={{
                          width: 120,
                          flexShrink: 0,
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        <LazyCardMedia
                          s3Key={unit.featuredImage}
                          identityId={unit.identityId}
                        />
                      </Box>
                    )}
                    <Box sx={{ flex: 1, p: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1,
                          mb: 0.5,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 700, flex: 1 }}
                        >
                          {unit?.name || assignment.unitID}
                        </Typography>
                        {localTime && (
                          <Chip
                            label={
                              isOverdue
                                ? `Overdue · ${localTime}`
                                : `Due ${localTime}`
                            }
                            size="small"
                            color={isOverdue ? "error" : "default"}
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        )}
                      </Box>
                      {unit?.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1.5, lineHeight: 1.5 }}
                        >
                          {unit.description}
                        </Typography>
                      )}
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <PrefetchButton
                          data-tour="start-workbook-button"
                          variant="contained"
                          size="small"
                          href={`/workbook/${assignment.unitID}`}
                          startIcon={<EditNoteIcon />}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        >
                          Start Workbook
                        </PrefetchButton>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AutoFixHighIcon />}
                          onClick={() =>
                            openDrill(assignment.unitID, unit?.name || "")
                          }
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        >
                          Practice
                        </Button>
                        <Tooltip title="Create a room and share the code with your instructor to get personal guidance">
                          <span>
                            <Button
                              variant="outlined"
                              size="small"
                              color="secondary"
                              startIcon={<SupportAgentIcon />}
                              onClick={async () => {
                                try {
                                  const result = await createPeerReviewRoom(
                                    assignment.id,
                                    [],
                                    assignment.sectionID || "",
                                    userId,
                                  );
                                  if (result?.success && result.roomId) {
                                    router.push(`/review/${result.roomId}`);
                                  }
                                } catch (e) {
                                  console.error(
                                    "[Index] instructor guidance room error:",
                                    e,
                                  );
                                }
                              }}
                              sx={{
                                textTransform: "none",
                                fontWeight: 600,
                                borderRadius: 2,
                              }}
                            >
                              Request Guidance
                            </Button>
                          </span>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Card>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* ── COMPLETED ASSIGNMENTS ────────────────────────────────────── */}
        {completedAssignmentsList.length > 0 && (
          <Box data-tour="dashboard-completed-assignments" sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CheckCircleIcon color="success" />
              {t("index.completedAssignments")}
              <Chip
                label={completedAssignmentsList.length}
                size="small"
                color="success"
                sx={{ fontWeight: 700 }}
              />
            </Typography>

            <Stack spacing={2}>
              {completedAssignmentsList.map((assignment, index) => {
                const unit = units[assignment.unitID];
                const grades = myGradeMap[assignment.unitID] || [];
                const latestGrade = grades[grades.length - 1];
                const pct = latestGrade
                  ? Math.round(latestGrade.accuracy || 0)
                  : 0;

                return (
                  <Card
                    data-tour="assignment-card-completed"
                    key={assignment.id || index}
                    elevation={0}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderLeft: "4px solid",
                      borderLeftColor: `${gradeColor(pct)}.main`,
                      borderRadius: 2,
                      display: "flex",
                      overflow: "hidden",
                      transition: "box-shadow 0.2s",
                      "&:hover": { boxShadow: 4 },
                    }}
                  >
                    {unit?.featuredImage && (
                      <Box
                        sx={{
                          width: 120,
                          flexShrink: 0,
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        <LazyCardMedia
                          s3Key={unit.featuredImage}
                          identityId={unit.identityId}
                        />
                      </Box>
                    )}
                    <Box sx={{ flex: 1, p: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1,
                          mb: 0.5,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 700, flex: 1 }}
                        >
                          {unit?.name || assignment.unitID}
                        </Typography>
                        <Chip
                          label={`${pct}% · ${gradeLabel(pct)}`}
                          size="small"
                          color={gradeColor(pct)}
                          icon={<CheckCircleIcon />}
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                      {unit?.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1.5, lineHeight: 1.5 }}
                        >
                          {unit.description}
                        </Typography>
                      )}
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <PrefetchButton
                          variant="outlined"
                          size="small"
                          href={`/workbook/${assignment.unitID}`}
                          startIcon={<EditNoteIcon />}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        >
                          Review
                        </PrefetchButton>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AutoFixHighIcon />}
                          onClick={() =>
                            openDrill(assignment.unitID, unit?.name || "")
                          }
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        >
                          Practice from mistakes
                        </Button>
                        {latestGrade && (
                          <OpenPeerReviewButton
                            gradeId={latestGrade.id}
                            onCreateRoom={handleCreateReviewRoom}
                            onRoomCreated={(roomId) =>
                              router.push(`/review/${roomId}`)
                            }
                          />
                        )}
                        {latestGrade && (
                          <Tooltip title="Create a room and share the code with your instructor to get personal guidance">
                            <span>
                              <Button
                                variant="outlined"
                                size="small"
                                color="secondary"
                                startIcon={<SupportAgentIcon />}
                                onClick={async () => {
                                  try {
                                    const result = await createPeerReviewRoom(
                                      latestGrade.id,
                                      [],
                                      latestGrade.sectionID || "",
                                      userId,
                                    );
                                    if (result?.success && result.roomId) {
                                      router.push(`/review/${result.roomId}`);
                                    }
                                  } catch (e) {
                                    console.error(
                                      "[Index] instructor guidance room error:",
                                      e,
                                    );
                                  }
                                }}
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 600,
                                  borderRadius: 2,
                                }}
                              >
                                Request Guidance
                              </Button>
                            </span>
                          </Tooltip>
                        )}
                      </Stack>
                    </Box>
                  </Card>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* ── ENROLLED SECTIONS ────────────────────────────────────────── */}
        {sections.length > 0 && (
          <Box data-tour="dashboard-enrolled-sections" sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <SchoolIcon color="primary" />
              {t("index.sections")}
            </Typography>
            <Stack spacing={2}>
              {sections.map((section) => {
                // Per-section stats for this learner
                const sectionAssignments = allAssignments.filter(
                  (a) => a.sectionID === section.id,
                );
                const sectionCompleted = sectionAssignments.filter(
                  (a) => myGradeMap[a.unitID]?.length > 0,
                );
                const sectionPending = sectionAssignments.filter(
                  (a) => !myGradeMap[a.unitID]?.length,
                );
                const sectionGrades = sectionCompleted.flatMap(
                  (a) => myGradeMap[a.unitID] || [],
                );
                const avgAccuracy = sectionGrades.length
                  ? Math.round(
                      sectionGrades.reduce((s, g) => s + (g.accuracy || 0), 0) /
                        sectionGrades.length,
                    )
                  : null;
                const completionPct = sectionAssignments.length
                  ? Math.round(
                      (sectionCompleted.length / sectionAssignments.length) *
                        100,
                    )
                  : null;

                return (
                  <Card
                    data-tour="enrolled-section-card"
                    key={section.id}
                    elevation={0}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    {/* Header row */}
                    <Box
                      sx={{
                        px: 2.5,
                        pt: 2,
                        pb: 1.5,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, mb: 0.25 }}
                        >
                          {section.name || t("index.untitledSection")}
                        </Typography>
                        {section.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ lineHeight: 1.4 }}
                          >
                            {section.description}
                          </Typography>
                        )}
                      </Box>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexShrink={0}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {sectionPending.length > 0 && (
                          <Chip
                            label={`${sectionPending.length} pending`}
                            size="small"
                            color="warning"
                            icon={<HourglassTopIcon />}
                            sx={{ fontWeight: 700 }}
                          />
                        )}
                        {sectionCompleted.length > 0 && (
                          <Chip
                            label={`${sectionCompleted.length} done`}
                            size="small"
                            color="success"
                            icon={<CheckCircleIcon />}
                            sx={{ fontWeight: 700 }}
                          />
                        )}
                      </Stack>
                    </Box>

                    {/* Stats row */}
                    {sectionAssignments.length > 0 && (
                      <Box sx={{ px: 2.5, pb: 1.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 3,
                            flexWrap: "wrap",
                            mb: 1,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Completion
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700 }}
                            >
                              {sectionCompleted.length}/
                              {sectionAssignments.length} assignments
                            </Typography>
                          </Box>
                          {avgAccuracy !== null && (
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Your avg grade
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  color: `${gradeColor(avgAccuracy)}.main`,
                                }}
                              >
                                {avgAccuracy}%
                              </Typography>
                            </Box>
                          )}
                          {sectionLevel && (
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Section XP level
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 700 }}
                              >
                                Lv. {sectionLevel.level}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        {completionPct !== null && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <LinearProgress
                              variant="determinate"
                              value={completionPct}
                              sx={{ flex: 1, height: 6, borderRadius: 3 }}
                              color={
                                completionPct === 100 ? "success" : "primary"
                              }
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ whiteSpace: "nowrap" }}
                            >
                              {completionPct}%
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Action footer */}
                    <Box
                      sx={{
                        px: 2.5,
                        py: 1.5,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
                        alignItems: "center",
                        bgcolor: "action.hover",
                      }}
                    >
                      <Button
                        component="a"
                        href={`/section/${section.id}`}
                        size="small"
                        variant="contained"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: 2,
                        }}
                      >
                        View Class
                      </Button>
                      <SkillTreePopupButton
                        sectionId={section.id}
                        label={section.name}
                      />
                    </Box>
                  </Card>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* ── MY SECTIONS (instructor-owned) ──────────────────────────── */}
        {mySections.length > 0 && (
          <Box data-tour="dashboard-my-sections" sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <PeopleIcon color="primary" />
              {t("index.mySections")}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 2,
              }}
            >
              {mySections.map((section) => (
                <Card
                  key={section.id}
                  component="a"
                  href={`/section/${section.id}`}
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    p: 2,
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    transition: "box-shadow 0.2s, transform 0.2s",
                    "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {section.name || t("index.untitledSection")}
                  </Typography>
                  {section.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ flex: 1, lineHeight: 1.5 }}
                    >
                      {section.description}
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Chip
                      label="Manage"
                      size="small"
                      color="primary"
                      variant="outlined"
                      icon={<PeopleIcon />}
                      sx={{ fontWeight: 600, cursor: "pointer" }}
                    />
                  </Box>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* ── EMPTY STATE — join a section ─────────────────────────────── */}
        {hasNoSections && (
          <Paper
            data-tour="dashboard-empty-state"
            elevation={0}
            sx={{
              mb: 4,
              borderRadius: 3,
              border: "2px dashed",
              borderColor: "divider",
              p: { xs: 4, sm: 6 },
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <SchoolIcon sx={{ fontSize: 56, color: "text.disabled" }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {t("index.noSectionsYet")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter a join code from your instructor to get started.
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              href="/sections"
              startIcon={<AddIcon />}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                px: 4,
              }}
            >
              {t("index.joinSection")}
            </Button>
          </Paper>
        )}

        {/* ── GAMIFICATION ─────────────────────────────────────────────── */}
        <Box data-tour="dashboard-gamification" sx={{ mt: 2 }}>
          {progressModules?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <ProgressRings modules={progressModules} />
            </Box>
          )}

          {campaign && (
            <Box sx={{ mb: 3 }}>
              <CampaignBriefing
                title={campaign.title}
                setting={campaign.setting}
                stakes={campaign.stakes}
              />
            </Box>
          )}

          {campaignChapters.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <CampaignTimeline chapters={campaignChapters} />
            </Box>
          )}

          {activeChallenges?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              {activeChallenges.map((challenge) => (
                <Box key={challenge.id} sx={{ mb: 2 }}>
                  <BossBattleCard
                    title={challenge.title}
                    narrative={challenge.setting}
                    totalHP={challenge.targetXP || 0}
                    totalDamage={challenge.currentXP || 0}
                    deadline={challenge.deadline}
                    active={challenge.active}
                    bonusMultiplier={challenge.bonusMultiplier}
                    phases={[]}
                    contributors={(challenge.contributions || []).map((c) => ({
                      userId: c.studentId,
                      displayName: c.studentId,
                      xpContributed: c.xpContributed,
                    }))}
                  />
                </Box>
              ))}
            </Box>
          )}

          {earnedBadges?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <BadgeShelf earnedBadges={earnedBadges} earnedOnly />
            </Box>
          )}

          {nailedItBlocks?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <NailedItWall blocks={nailedItBlocks} />
            </Box>
          )}
        </Box>
      </Box>

      {/* ── PRACTICE DRILL DIALOG ──────────────────────────────────────── */}
      {drillOpen && drillTarget && (
        <PracticeDrillDialog
          open={drillOpen}
          onClose={() => {
            setDrillOpen(false);
            setDrillTarget(null);
          }}
          unitId={drillTarget.unitId}
          unitName={drillTarget.unitName}
          username={user?.username || ""}
          config={{
            sources: {
              vocabulary: true,
              questions: true,
              text: false,
              documents: false,
            },
            count: 10,
            drillType: "mixed",
          }}
        />
      )}
    </>
  );
}

function WrappedPage({ signOut, user, ...args }) {
  return (
    <GamificationProviderWrapper>
      <FilesProvider>
        <Index signOut={signOut} user={user} {...args} />
      </FilesProvider>
    </GamificationProviderWrapper>
  );
}

export default WrappedPage;
