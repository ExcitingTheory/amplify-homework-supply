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

import SchoolIcon from "@mui/icons-material/School";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import RateReviewIcon from "@mui/icons-material/RateReview";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GroupsIcon from "@mui/icons-material/Groups";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

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

import { LevelBadge } from "@/components/Gamification/LevelBadge";
import { ArmoriaShield } from "@/components/Gamification/ArmoriaShield";
import { AvatarDisplay } from "@/components/Gamification/AvatarDisplay";

import {
  useXP,
  useProgress,
  useCampaign,
  useBadges,
  useSquad,
  useContentLock,
} from "@/context/gamificationContext";
import { useAvatarConfig } from "@/hooks/useAvatarConfig";
import { useStudentMemory } from "@/hooks/useStudentMemory";
import { parseMemoryMarkdown } from "@/utils/memoryParser";
import {
  getStudentAccommodation,
  getEffectiveDueDate,
} from "@/utils/accommodations";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import { useRouter } from "next/navigation";
import { PrefetchButton } from "@/components/PrefetchButton";

import { createPeerReviewRoom } from "../actions/peerReview";
import AuthContext from "@/context/authContext";
import { SectionPanel } from "@/components/Dashboard";
import { DashboardHeroView } from "@/components/Dashboard/DashboardHeroView";
import InstructorDashboard from "@/components/InstructorDashboard";
import { CollaborativeChatWrapper } from "@/components/Chat/CollaborativeChatWrapper";

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

function getDueStatus(dueDate) {
  if (!dueDate) return { label: "No due date", color: "default" };

  const dueTime = new Date(dueDate).getTime();
  const now = Date.now();
  const twoDays = 2 * 24 * 60 * 60 * 1000;

  if (dueTime < now) return { label: "Overdue", color: "error" };
  if (dueTime - now <= twoDays) return { label: "Due soon", color: "warning" };
  return { label: "Due", color: "default" };
}

function getUserId(user) {
  return (
    user?.signInUserSession?.idToken?.payload?.sub ||
    user?.userId ||
    user?.username
  );
}

function Index({
  signOut,
  user,
  initialSections = [],
  initialAssignments = [],
  initialGrades = [],
}) {
  const t = useTranslations("pages");
  const { session: authSession } = React.useContext(AuthContext);

  // Time-of-day greeting
  const greetingKey = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "index.greetingMorning";
    if (hour < 17) return "index.greetingAfternoon";
    return "index.greetingEvening";
  }, []);

  // ── data state ────────────────────────────────────────────────────────────
  const [sections, setSections] = useState(initialSections);
  const [mySections, setMySections] = useState([]);
  const [assignments, setAssignment] = useState(initialAssignments);
  const [myAssignments, setMyAssignment] = useState([]);
  const [units, setUnits] = useState({});
  const router = useRouter();

  const [myGradeMap, setMyGradeMap] = React.useState({});
  const [myGrades, setMyGrades] = React.useState(initialGrades);
  const gradeCountRef = useRef(0);
  const assignmentCountRef = useRef(0);
  const sectionCountRef = useRef(0);

  // ── gamification ──────────────────────────────────────────────────────────
  const { totalXP, level, sectionLevel, xpLogs } = useXP();
  const { modules: progressModules, streak } = useProgress();
  const { campaign, activeChallenges, completedChallenges } = useCampaign();
  const { badges: earnedBadges } = useBadges();
  const { mySquad, myMembership } = useSquad();
  const { isLocked, getLockStatus } = useContentLock();

  // ── avatar ────────────────────────────────────────────────────────────────
  const {
    style: avatarStyle,
    overrides: avatarOverrides,
    seed: configSeed,
    isLoaded,
    glowRing,
  } = useAvatarConfig();
  const userId =
    authSession?.idToken?.payload?.sub ||
    authSession?.username ||
    authSession?.userId ||
    user?.attributes?.sub ||
    getUserId(user);
  const avatarSeed =
    authSession?.idToken?.payload?.sub ||
    authSession?.username ||
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

  // ── chat page context ─────────────────────────────────────────────────────
  useChatPageContext({ sections: mySections });

  // ── user groups / role ────────────────────────────────────────────────────
  const myGroups = authSession?.groups || user?.groups || [];
  const isInstructorOrAdmin = myGroups.some((g) =>
    ["Admins", "Moderators", "Instructors"].includes(g),
  );

  // ── offline seed from IndexedDB ───────────────────────────────────────────
  useEffect(() => {
    if (typeof navigator === "undefined" || navigator.onLine) return;
    let mounted = true;
    (async () => {
      try {
        const { getAllCachedSections, getAllCachedAssignments } =
          await import("@/offline/OfflineDataStore");
        const [cachedSections, cachedAssignments] = await Promise.all([
          getAllCachedSections(),
          getAllCachedAssignments(),
        ]);
        if (!mounted) return;
        if (cachedSections.length > 0) setSections(cachedSections);
        if (cachedAssignments.length > 0) setAssignment(cachedAssignments);
      } catch {
        // IndexedDB not available — noop
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
        const msg =
          error?.message ||
          error?.errors?.[0]?.message ||
          JSON.stringify(error);
        if (
          msg === "{}" ||
          msg === "undefined" ||
          msg.includes("DuplicatedOperationError") ||
          msg.includes("Not Authorized")
        )
          return;
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
        const msg =
          error?.message ||
          error?.errors?.[0]?.message ||
          JSON.stringify(error);
        if (
          msg === "{}" ||
          msg === "undefined" ||
          msg.includes("DuplicatedOperationError") ||
          msg.includes("Not Authorized")
        )
          return;
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
        const msg =
          error?.message ||
          error?.errors?.[0]?.message ||
          JSON.stringify(error);
        if (
          msg === "{}" ||
          msg === "undefined" ||
          msg.includes("DuplicatedOperationError") ||
          msg.includes("Not Authorized")
        )
          return;
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
        const msg =
          error?.message ||
          error?.errors?.[0]?.message ||
          JSON.stringify(error);
        if (
          msg === "{}" ||
          msg === "undefined" ||
          msg.includes("DuplicatedOperationError") ||
          msg.includes("Not Authorized")
        )
          return;
        console.error("[Index] Unit subscription error:", error);
      },
    });
    return () => subscription.unsubscribe();
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

  const xpNailedItBlocks = React.useMemo(() => {
    const logs = (xpLogs || [])
      .filter((log) => log && log.reason === "NAILED_IT")
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 12);

    return logs.map((log, idx) => ({
      id: log.id || `nailed-it-${idx}`,
      question: log.sourceId || "Workbook mastery moment",
      nailedItReason:
        "Excellent understanding demonstrated in a completed task.",
      homeworkTitle: "Learner Workbook",
      createdAt: log.createdAt || new Date().toISOString(),
    }));
  }, [xpLogs]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const openDrill = (unitId, unitName) => {
    router.push(`/drill/${unitId}?drillType=mixed&count=10`);
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

  // This learner's accommodation entry per enrolled section (extra due-date days, etc.)
  const accommodationBySectionId = React.useMemo(() => {
    const map = {};
    sections.forEach((s) => {
      if (!s?.id) return;
      map[s.id] = getStudentAccommodation(s.accommodations, userId);
    });
    return map;
  }, [sections, userId]);

  // All assignments the learner should work on (from enrolled sections)
  const allAssignments = [...assignments, ...myAssignments].filter(
    (assignment) => !assignment.studentID || assignment.studentID === userId,
  );
  const pendingAssignments = allAssignments.filter(
    (a) => a.lateStatus !== "DROPPED" && !myGradeMap[a.unitID]?.length,
  );
  const completedAssignmentsList = allAssignments.filter(
    (a) => a.lateStatus !== "DROPPED" && myGradeMap[a.unitID]?.length > 0,
  );

  // Most urgent incomplete, unlocked assignment across all sections (Phase 6.1)
  const urgentNextAssignment = React.useMemo(() => {
    const effectiveDue = (a) => {
      const iso =
        getEffectiveDueDate(a.dueDate, accommodationBySectionId[a.sectionID]) ||
        a.dueDate;
      return iso ? new Date(iso).getTime() : Infinity;
    };
    return (
      allAssignments
        .filter((a) => !myGradeMap[a.unitID]?.length && !isLocked(a.unitID))
        .sort((a, b) => effectiveDue(a) - effectiveDue(b))[0] || null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAssignments, myGradeMap, accommodationBySectionId]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Box
        id="main-content"
        component="main"
        data-tour="dashboard"
        sx={{
          width: "100%",
          maxWidth: "80rem",
          mx: "auto",
          px: { xs: 1.5, sm: 2 },
          py: 3,
        }}
      >
        {/* Skip link — jumps past hero to first section assignment */}
        <Box
          component="a"
          href="#section-list"
          sx={{
            position: "absolute",
            left: "-9999px",
            top: "auto",
            width: 1,
            height: 1,
            overflow: "hidden",
            "&:focus": {
              position: "static",
              width: "auto",
              height: "auto",
              overflow: "visible",
              display: "block",
              mb: 1,
              p: 1,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              borderRadius: 1,
              fontWeight: 700,
              fontSize: "0.875rem",
            },
          }}
        >
          Skip to your next assignment
        </Box>
        {/* ── HERO CARD ────────────────────────────────────────────────── */}
        <DashboardHeroView
          greeting={t(greetingKey, {
            name: user?.attributes?.name || user?.username || "Learner",
          })}
          level={level}
          avatar={
            avatarSeed && isLoaded ? (
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
            )
          }
          nextStep={
            urgentNextAssignment
              ? {
                  todayLabel: "Today",
                  unitName:
                    units[urgentNextAssignment.unitID]?.name ||
                    "Next assignment",
                  sectionName:
                    sections.find(
                      (s) => s.id === urgentNextAssignment.sectionID,
                    )?.name || "Your next lesson",
                  dueText: urgentNextAssignment.dueDate
                    ? `Due ${new Date(getEffectiveDueDate(urgentNextAssignment.dueDate, accommodationBySectionId[urgentNextAssignment.sectionID]) || urgentNextAssignment.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                    : undefined,
                }
              : null
          }
          startButton={
            urgentNextAssignment ? (
              <PrefetchButton
                variant="contained"
                size="small"
                href={`/workbook/${urgentNextAssignment.unitID}`}
                sx={{
                  flexShrink: 0,
                  alignSelf: { xs: "stretch", sm: "center" },
                }}
              >
                Start
              </PrefetchButton>
            ) : null
          }
          caughtUpText="You are caught up on your assignments."
          streak={streak}
          showStreakEmpty={!isInstructorOrAdmin}
          assignmentsCount={
            completedAssignmentsList.length + pendingAssignments.length
          }
          badgesCount={earnedBadges?.length || 0}
          totalXP={totalXP}
          badgeShelf={
            earnedBadges?.length > 0 ? (
              <BadgeShelf earnedBadges={earnedBadges} earnedOnly />
            ) : null
          }
          squad={
            mySquad
              ? {
                  id: mySquad.id,
                  name: mySquad.name,
                  crestSvg: mySquad.crestSvg,
                  totalXP: mySquad.totalXP,
                }
              : null
          }
        />

        {/* ── INSTRUCTOR DASHBOARD ─────────────────────────────────── */}
        {isInstructorOrAdmin && mySections.length > 0 && (
          <InstructorDashboard sections={mySections} />
        )}

        {/* ── LEARNER CONTENT (hidden for instructors) ────────────── */}
        {!isInstructorOrAdmin && (
          <>
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
                        data-testid="practice-button"
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

            {/* ── SECTION-GROUPED ASSIGNMENTS ──────────────────────────── */}
            {sections.length > 0 && (
              <Box
                id="section-list"
                component="nav"
                aria-label="Your enrolled sections"
                data-tour="dashboard-sections"
                sx={{ mb: 4 }}
              >
                {/* Global "Up Next" banner — most urgent across all sections */}
                {(() => {
                  const globalEffectiveDue = (a) => {
                    const iso =
                      getEffectiveDueDate(
                        a.dueDate,
                        accommodationBySectionId[a.sectionID],
                      ) || a.dueDate;
                    return iso ? new Date(iso).getTime() : Infinity;
                  };
                  const globalUpNext = allAssignments
                    .filter(
                      (a) =>
                        !myGradeMap[a.unitID]?.length && !isLocked(a.unitID),
                    )
                    .sort(
                      (a, b) => globalEffectiveDue(a) - globalEffectiveDue(b),
                    )[0];
                  if (!globalUpNext) return null;
                  const upNextSection = sections.find(
                    (s) => s.id === globalUpNext.sectionID,
                  );
                  const upNextUnit = units[globalUpNext.unitID];
                  const dueStatus = getDueStatus(
                    getEffectiveDueDate(
                      globalUpNext.dueDate,
                      accommodationBySectionId[globalUpNext.sectionID],
                    ) || globalUpNext.dueDate,
                  );
                  return (
                    <Paper
                      elevation={0}
                      sx={{
                        mb: 3,
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor:
                          dueStatus.color === "error"
                            ? "error.light"
                            : dueStatus.color === "warning"
                              ? "warning.light"
                              : "primary.light",
                        bgcolor:
                          dueStatus.color === "error"
                            ? "error.50"
                            : dueStatus.color === "warning"
                              ? "warning.50"
                              : "primary.50",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        flexWrap: "wrap",
                      }}
                      role="status"
                      aria-live="polite"
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          flexShrink: 0,
                          display: "grid",
                          placeItems: "center",
                          borderRadius: 1.5,
                          bgcolor: "background.paper",
                          color: "primary.main",
                        }}
                        aria-hidden="true"
                      >
                        <SchoolIcon />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="overline"
                          sx={{
                            fontWeight: 800,
                            color: "primary.main",
                            lineHeight: 1.2,
                          }}
                        >
                          Your next step
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 700 }}
                        >
                          {upNextUnit?.name || "Assignment"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {upNextSection?.name || "Your class"}
                        </Typography>
                      </Box>
                      <Chip
                        label={dueStatus.label}
                        color={dueStatus.color}
                        size="small"
                        variant="outlined"
                        sx={{ flexShrink: 0, fontWeight: 700 }}
                      />
                      <PrefetchButton
                        data-testid="dashboard-next-step"
                        variant="contained"
                        size="small"
                        href={`/workbook/${globalUpNext.unitID}`}
                        startIcon={<EditNoteIcon />}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: 2,
                        }}
                      >
                        Start
                      </PrefetchButton>
                    </Paper>
                  );
                })()}

                {/* Section panels — ordered by nearest due date */}
                {[...sections]
                  .sort((a, b) => {
                    const aNext =
                      allAssignments
                        .filter(
                          (as) =>
                            as.sectionID === a.id &&
                            !myGradeMap[as.unitID]?.length,
                        )
                        .map((as) =>
                          as.dueDate
                            ? new Date(as.dueDate).getTime()
                            : Infinity,
                        )
                        .sort((x, y) => x - y)[0] || Infinity;
                    const bNext =
                      allAssignments
                        .filter(
                          (as) =>
                            as.sectionID === b.id &&
                            !myGradeMap[as.unitID]?.length,
                        )
                        .map((as) =>
                          as.dueDate
                            ? new Date(as.dueDate).getTime()
                            : Infinity,
                        )
                        .sort((x, y) => x - y)[0] || Infinity;
                    return aNext - bNext;
                  })
                  .map((section, idx) => {
                    const sectionAssignments = allAssignments.filter(
                      (a) => a.sectionID === section.id,
                    );
                    // Find active chapter for this section
                    const sectionChapter = (activeChallenges || []).find(
                      (c) => c.sectionID === section.id,
                    );

                    return (
                      <SectionPanel
                        key={section.id}
                        section={section}
                        assignments={sectionAssignments}
                        units={units}
                        gradeMap={myGradeMap}
                        activeChapterTitle={sectionChapter?.title || null}
                        isLocked={isLocked}
                        getLockStatus={getLockStatus}
                        sectionLevel={sectionLevel}
                        defaultExpanded={idx === 0}
                        accommodation={accommodationBySectionId[section.id]}
                        campaignTimeline={
                          campaignChapters.length > 0 ? (
                            <Box sx={{ mb: 2 }}>
                              <CampaignTimeline
                                chapters={campaignChapters}
                                compact
                              />
                            </Box>
                          ) : null
                        }
                        campaignBriefing={
                          sectionChapter ? (
                            <CampaignBriefing
                              title={sectionChapter.title}
                              setting={sectionChapter.setting}
                              stakes={sectionChapter.stakes}
                              compact
                              collapsible
                              defaultExpanded={false}
                            />
                          ) : null
                        }
                        onOpenDrill={openDrill}
                        onRequestGuidance={async (referenceId, sectionID) => {
                          try {
                            const result = await createPeerReviewRoom(
                              referenceId,
                              [],
                              sectionID,
                              userId,
                            );
                            if (result?.success && result.roomId) {
                              router.push(`/review/${result.roomId}`);
                            }
                          } catch (e) {
                            console.error("[Index] guidance room error:", e);
                          }
                        }}
                        onCreateReviewRoom={handleCreateReviewRoom}
                        onRoomCreated={(roomId) =>
                          router.push(`/review/${roomId}`)
                        }
                      />
                    );
                  })}
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
                        "&:hover": {
                          boxShadow: 6,
                          transform: "translateY(-2px)",
                        },
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

            {/* ── GAMIFICATION (boss battles & achievements) ─────────────── */}
            <Box data-tour="dashboard-gamification" sx={{ mt: 2 }}>
              {progressModules?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <ProgressRings modules={progressModules} />
                </Box>
              )}

              {campaign && !sections.length && (
                <Box sx={{ mb: 3 }}>
                  <CampaignBriefing
                    title={campaign.title}
                    setting={campaign.setting}
                    stakes={campaign.stakes}
                  />
                </Box>
              )}

              {campaignChapters.length > 0 && !sections.length && (
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
                        contributors={(challenge.contributions || []).map(
                          (c) => ({
                            userId: c.studentId,
                            displayName: c.studentId,
                            xpContributed: c.xpContributed,
                          }),
                        )}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              {xpNailedItBlocks?.length > 0 && !sections.length && (
                <Box sx={{ mb: 3 }}>
                  <NailedItWall blocks={xpNailedItBlocks} />
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>

      <CollaborativeChatWrapper />
    </>
  );
}

function WrappedPage({
  signOut,
  user,
  initialSections,
  initialAssignments,
  initialGrades,
  ...args
}) {
  return (
    <GamificationProviderWrapper>
      <FilesProvider>
        <Index
          signOut={signOut}
          user={user}
          initialSections={initialSections}
          initialAssignments={initialAssignments}
          initialGrades={initialGrades}
          {...args}
        />
      </FilesProvider>
    </GamificationProviderWrapper>
  );
}

export default WrappedPage;
