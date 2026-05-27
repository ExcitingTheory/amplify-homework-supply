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
  CardMedia,
  Chip,
  Skeleton,
} from "@mui/material";

import PeopleIcon from "@mui/icons-material/People";
import EditIcon from "@mui/icons-material/Edit";
import EditNoteIcon from "@mui/icons-material/EditNote";
import MyAuth from "@/components/AmplifyAuthenticator";
import LazyCardMedia from "@/components/LazyCardMedia";
import HistoryIcon from "@mui/icons-material/History";
import AverageIcon from "@mui/icons-material/Timeline";
import HighIcon from "@mui/icons-material/ArrowUpward";
import StarIcon from "@mui/icons-material/Star";
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
import { SkillTree } from "@/components/Gamification/SkillTree";
import {
  useXP,
  useProgress,
  useCampaign,
  useBadges,
  useSkillTree,
} from "@/context/gamificationContext";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import Divider from "@mui/material/Divider";
import { useRouter, useParams } from "next/navigation";
import { PrefetchButton } from "@/components/PrefetchButton";

function getColor(grade = 0) {
  let gradeColor = "";

  if (Math.round(grade) > 80) {
    gradeColor = "success";
  } else if (Math.round(grade) > 60) {
    gradeColor = "warning";
  } else if (Math.round(grade) > 50) {
    gradeColor = "error";
  }

  return gradeColor;
}

function getUserId(user) {
  return (
    user?.signInUserSession?.idToken?.payload?.sub ||
    user?.userId ||
    user?.username
  );
}

function Index({ signOut, user }) {
  const t = useTranslations("pages");
  /**
   * Grades is a page that displays a list of grades.
   * For Instructor users, it displays a list of grades organized by section like a gradebook but for all users in the section.
   * Section id is passed in as a query parameter.
   * For Student users, it displays a list of grades organized by section like a gradebook, but only for their own grades.
   */
  const [sections, setSections] = useState([]);
  const [mySections, setMySections] = useState([]);
  const [work, setIsWorking] = useState(false);
  const [assignments, setAssignment] = useState([]);
  const [myAssignments, setMyAssignment] = useState([]);
  const [units, setUnits] = useState([]);
  const router = useRouter();
  // const { id } = useParams();

  const [myGradeMap, setMyGradeMap] = React.useState({});
  const [myGrades, setMyGrades] = React.useState([]);
  const [myAssignmentNeedsGrading, setMyAssignmentNeedsGrading] =
    React.useState([]);
  const { totalXP, xpLogs } = useXP();
  const { modules: progressModules, streak } = useProgress();
  const { campaign, activeChallenges, completedChallenges } = useCampaign();
  const { badges: earnedBadges } = useBadges();
  const { skillNodes } = useSkillTree();
  const [nailedItBlocks, setNailedItBlocks] = React.useState([]);
  const gradeCountRef = useRef(0);
  const assignmentCountRef = useRef(0);
  const sectionCountRef = useRef(0);

  // Register page context with global chat
  useChatPageContext({
    sections: mySections,
  });

  // Streak & progress data now come from useProgress() hook via GamificationProvider

  useEffect(() => {
    const myUserId = getUserId(user);
    if (!myUserId) return;
    const client = getAmplifyClient();

    const subscription = client.models.Grade.observeQuery().subscribe({
      next: ({ items }) => {
        // Filter out null items before processing
        items = items.filter((item) => item != null && item.id != null);

        // Skip if count unchanged (dedup initial echo)
        if (items.length === gradeCountRef.current && gradeCountRef.current > 0)
          return;
        gradeCountRef.current = items.length;

        // Process my grades (complete only)
        const myCompletedGrades = items.filter(
          (g) => g.complete === true && g.owner === myUserId,
        );
        setMyGrades(myCompletedGrades);

        // Build grade map keyed by unitID for display
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
        console.error("[Index] Grade subscription error:", error);
      },
    });

    return function cleanup() {
      subscription.unsubscribe();
    };
  }, [user?.username]);

  // Consolidated Assignment observer - handles both my and others' assignments
  useEffect(() => {
    const myUserId = getUserId(user);
    if (!myUserId) return;
    const client = getAmplifyClient();

    const subscription = client.models.Assignment.observeQuery().subscribe({
      next: ({ items }) => {
        // Filter out null items before processing
        items = items.filter((item) => item != null && item.id != null);

        // Skip if count unchanged (dedup initial echo)
        if (
          items.length === assignmentCountRef.current &&
          assignmentCountRef.current > 0
        )
          return;
        assignmentCountRef.current = items.length;

        const myAssignments = items.filter((a) => a.owner === myUserId);
        const othersAssignments = items.filter((a) => a.owner !== myUserId);

        setMyAssignment(myAssignments);
        setAssignment(othersAssignments);
      },
      error: (error) => {
        console.error("[Index] Assignment subscription error:", error);
      },
    });

    return function cleanup() {
      subscription.unsubscribe();
    };
  }, [user?.username]);

  // Consolidated Section observer - handles both my and others' sections
  useEffect(() => {
    const myUserId = getUserId(user);
    if (!myUserId) return;
    const myGroups = user?.groups || []; // Cognito groups the user belongs to
    const client = getAmplifyClient();

    const subscription = client.models.Section.observeQuery().subscribe({
      next: ({ items }) => {
        // Filter out null items that can appear during subscription updates
        const validItems = items.filter(
          (item) => item != null && item.id != null,
        );

        // Skip if count unchanged (dedup initial echo)
        if (
          validItems.length === sectionCountRef.current &&
          sectionCountRef.current > 0
        )
          return;
        sectionCountRef.current = validItems.length;

        // Sections I own (I'm the instructor)
        const mySections = validItems.filter((s) => s.owner === myUserId);
        // Sections where I'm a student (I'm in the learner group)
        const othersSections = validItems.filter(
          (s) =>
            s.owner !== myUserId && s.learner && myGroups.includes(s.learner),
        );

        setMySections(mySections);
        setSections(othersSections);
      },
      error: (error) => {
        console.error("[Index] Section subscription error:", error);
      },
    });

    return function cleanup() {
      subscription.unsubscribe();
    };
  }, [user?.username]);

  useEffect(() => {
    const myUserId = getUserId(user);
    if (!myUserId) {
      return;
    }
    const client = getAmplifyClient();

    const subscription = client.models.Unit.observeQuery().subscribe({
      next: ({ items }) => {
        const unitsById = {};
        items.forEach(function (unit) {
          unitsById[unit.id] = unit;
        });
        setUnits(unitsById);
      },
      error: (error) => {
        console.error("[Index] Unit subscription error:", error);
      },
    });

    return function cleanup() {
      subscription.unsubscribe();
    };
  }, [user?.username]);

  // Fetch nailed-it blocks for dashboard
  useEffect(() => {
    const myUserId = getUserId(user);
    if (!myUserId) return;
    const client = getAmplifyClient();

    const nailedItSub = client.models.NailedIt?.observeQuery?.({
      filter: { owner: { eq: myUserId } },
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

    return () => {
      nailedItSub?.unsubscribe?.();
    };
  }, [user?.username]);

  // Build campaign timeline chapters from active + completed challenges
  const campaignChapters = React.useMemo(() => {
    const all = [...(activeChallenges || []), ...(completedChallenges || [])];
    if (all.length === 0) return [];
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

  // Prefetch workbook routes for visible assignments (first 3)
  useEffect(() => {
    if (!myAssignments?.length) return;
    const toPrefetch = myAssignments.slice(0, 3);
    toPrefetch.forEach((assignment) => {
      if (assignment.unitID) {
        router.prefetch(`/workbook/${assignment.unitID}`);
      }
    });
  }, [myAssignments, router]);

  return (
    <>
      <Box sx={{ width: "100%", maxWidth: "80rem", mx: "auto", px: 2 }}>
        {/* ── Gamification Dashboard ─────────────────────────────── */}
        <Box sx={{ py: 3 }}>
          {/* Streak & Progress */}
          {streak && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 2,
                flexWrap: "wrap",
              }}
            >
              <StreakIndicator
                current={streak.current}
                longest={streak.longest}
              />
              {streak.freezesAvailable > 0 && (
                <StreakShield freezesAvailable={streak.freezesAvailable} />
              )}
            </Box>
          )}

          {progressModules?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <ProgressRings modules={progressModules} />
            </Box>
          )}

          {/* Campaign Narrative */}
          {campaign && (
            <Box sx={{ mb: 3 }}>
              <CampaignBriefing
                title={campaign.title}
                setting={campaign.setting}
                stakes={campaign.stakes}
              />
            </Box>
          )}

          {/* Campaign Timeline (chapter progression) */}
          {campaignChapters.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <CampaignTimeline chapters={campaignChapters} />
            </Box>
          )}

          {/* Active Boss Battles */}
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

          {/* Skill Tree — full width */}
          {skillNodes?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                {t("index.learningPathway", "Learning Pathway")}
              </Typography>
              <SkillTree
                skills={skillNodes}
                onSkillClick={(skillId) => router.push("/skills")}
                height={450}
              />
            </Box>
          )}

          {/* Badges */}
          {earnedBadges?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <BadgeShelf earnedBadges={earnedBadges} columns={4} earnedOnly />
            </Box>
          )}

          {/* Nailed It Wall */}
          {nailedItBlocks?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <NailedItWall blocks={nailedItBlocks} />
            </Box>
          )}

          <Divider sx={{ my: 3 }} />
        </Box>

        {/* ── Assignments & Sections ────────────────────────────── */}
        <Box>
          {assignments?.length > 0 &&
            units &&
            Object.values(myGradeMap).length > 0 && (
              <Box
                data-tour="my-grades"
                style={{
                  padding: "1rem",
                  marginBottom: "3rem",
                  margin: "1rem auto",
                  maxWidth: "80rem",
                }}
              >
                <Typography
                  variant="h3"
                  component="div"
                  sx={{
                    flexGrow: 1,
                    padding: "1rem",
                    margin: "1rem auto",
                  }}
                >
                  {t("index.completedAssignments")}
                </Typography>

                {assignments?.map(function (assignment, index) {
                  // get local time from UTC
                  // get timezone from client browser
                  const timeZone =
                    Intl.DateTimeFormat().resolvedOptions().timeZone;
                  // get timezone from user profile TBD
                  // Convert time
                  const localTime = new Date(assignment.dueDate).toLocaleString(
                    undefined,
                    {
                      timeZone,
                    },
                  );
                  const itemPrimary = `${localTime} - ${units[assignment.unitID]?.name}`;
                  const itemSecondary = units[assignment.unitID]?.description;
                  const featuredImage = units[assignment.unitID]?.featuredImage;
                  const identityId = units[assignment.unitID]?.identityId;

                  const workbookUrl = `/workbook/${assignment.unitID}`;
                  const unitUrl = `/unit/${assignment.unitID}`;

                  const gradesForUnit = myGradeMap[assignment?.unitID];

                  return (
                    <Card key={assignment.id || index} sx={{ mb: 1, mx: 1 }}>
                      <CardContent
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          py: 1,
                          "&:last-child": { pb: 1 },
                        }}
                      >
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1">{itemPrimary}</Typography>
                          {itemSecondary && (
                            <Typography variant="body2" color="text.secondary">
                              {itemSecondary}
                            </Typography>
                          )}
                        </Box>
                        <PrefetchButton
                          href={workbookUrl}
                          size="small"
                          variant="outlined"
                        >
                          Review
                        </PrefetchButton>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}

          {myAssignments?.length > 0 && units && (
            <Box
              style={{
                padding: "1rem",
                marginBottom: "3rem",
                margin: "1rem auto",
                maxWidth: "80rem",
              }}
            >
              <Typography
                variant="h3"
                component="div"
                sx={{
                  flexGrow: 1,
                  padding: "1rem",
                  margin: "1rem auto",
                }}
              >
                {t("index.myAssignments")}
              </Typography>

              {myAssignments?.map(function (assignment, index) {
                const timeZone =
                  Intl.DateTimeFormat().resolvedOptions().timeZone;
                // get timezone from user profile TBD
                // Convert time
                const localTime = new Date(assignment.dueDate).toLocaleString(
                  undefined,
                  {
                    timeZone,
                  },
                );

                const itemPrimary = `${localTime} - ${units[assignment.unitID]?.name}`;
                const itemSecondary = units[assignment.unitID]?.description;
                const featuredImage = units[assignment.unitID]?.featuredImage;
                const identityId = units[assignment.unitID]?.identityId;

                const workbookUrl = `/workbook/${assignment.unitID}`;
                const unitUrl = `/unit/${assignment.unitID}`;

                return (
                  <>
                    <Card
                      elevation={2}
                      key={index}
                      sx={{
                        display: "flex",
                        margin: "1rem auto",
                        width: "90vw",
                        maxWidth: "80rem",
                        borderRadius: 2,
                        borderLeft: "4px solid",
                        borderLeftColor: "text.primary",
                        transition: "all 0.3s ease-in-out",
                        "&:hover": {
                          elevation: 6,
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          flexGrow: "1",
                          p: 0.5,
                        }}
                      >
                        <CardContent sx={{ flex: "1 0 auto", pb: 1 }}>
                          <Typography
                            component="div"
                            variant="h5"
                            sx={{ fontWeight: 600, mb: 0.5 }}
                          >
                            {itemPrimary}
                          </Typography>
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            component="div"
                            sx={{ lineHeight: 1.6 }}
                          >
                            {itemSecondary}
                          </Typography>
                        </CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            pl: 2,
                            pb: 1.5,
                          }}
                        >
                          <PrefetchButton
                            variant="outlined"
                            href={workbookUrl}
                            disabled={work}
                            startIcon={<EditNoteIcon />}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              px: 3,
                              py: 1,
                              mr: 1,
                              borderRadius: 2,
                              boxShadow: 2,
                              color: "text.primary",
                              borderColor: "text.primary",
                              "&:hover": {
                                boxShadow: 4,
                                borderColor: "text.primary",
                                backgroundColor: "action.hover",
                              },
                            }}
                          >
                            {t("index.viewWorkbook")}
                          </PrefetchButton>

                          <PrefetchButton
                            variant="outlined"
                            href={unitUrl}
                            disabled={work}
                            startIcon={<EditIcon />}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              px: 3,
                              py: 1,
                              borderRadius: 2,
                              boxShadow: 2,
                              color: "text.primary",
                              borderColor: "text.primary",
                              "&:hover": {
                                boxShadow: 4,
                                borderColor: "text.primary",
                                backgroundColor: "action.hover",
                              },
                            }}
                          >
                            {t("index.editUnit")}
                          </PrefetchButton>
                        </Box>
                      </Box>
                      {/* <CardMedia
                                component="img"
                                sx={{ width: 151 }}
                                image="/static/images/cards/live-from-space.jpg"
                                alt="Live from space album cover"
                              /> */}
                      {featuredImage && (
                        <LazyCardMedia
                          s3Key={featuredImage}
                          identityId={identityId}
                        />
                      )}
                    </Card>
                  </>
                );
              })}
            </Box>
          )}

          {sections?.length == 0 && mySections?.length == 0 && (
            //embed url to create a new section
            <Card
              elevation={3}
              sx={{
                display: "flex",
                margin: "3rem auto",
                width: "fit-content",
                maxWidth: "500px",
                minHeight: "300px",
                borderRadius: 3,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  flexGrow: "1",
                  p: 4,
                }}
              >
                <CardContent
                  sx={{
                    flex: "1 1 auto",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <Typography component="div" variant="h5" sx={{ mb: 3 }}>
                    {t("index.noSectionsYet")}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      width: "100%",
                    }}
                  >
                    <PrefetchButton
                      variant="outlined"
                      color="primary"
                      href="sections"
                      disabled={work}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                      }}
                    >
                      {t("index.joinSection")}
                    </PrefetchButton>

                    <PrefetchButton
                      variant="outlined"
                      color="primary"
                      href="sections"
                      disabled={work}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                      }}
                    >
                      {t("index.createNewSection")}
                    </PrefetchButton>
                  </Box>
                </CardContent>
              </Box>
            </Card>
          )}
          {mySections?.length > 0 && (
            <Box
              style={{
                padding: "1rem",
                marginBottom: "3rem",
                margin: "1rem auto",
                maxWidth: "80rem",
              }}
            >
              <Typography
                variant="h3"
                component="div"
                sx={{
                  flexGrow: 1,
                  padding: "1rem",
                  margin: "1rem auto",
                }}
              >
                {t("index.mySections")}
              </Typography>

              {mySections?.map(function (section, index) {
                return (
                  <Card
                    key={index}
                    elevation={2}
                    sx={{
                      display: "flex",
                      margin: "1rem auto",
                      width: "ƒ",
                      maxWidth: "80rem",
                      borderRadius: 2,
                      borderLeft: "4px solid",
                      borderLeftColor: "text.primary",
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        elevation: 6,
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        flexGrow: "1",
                        p: 0.5,
                      }}
                    >
                      <CardContent sx={{ flex: "1 0 auto", pb: 1 }}>
                        <Typography
                          component="div"
                          variant="h5"
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          {section?.name || t("index.untitledSection")}
                        </Typography>
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          component="div"
                          sx={{ lineHeight: 1.6 }}
                        >
                          {section?.description || t("index.noDescription")}
                        </Typography>
                      </CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          pl: 2,
                          pb: 1.5,
                        }}
                      >
                        <PrefetchButton
                          variant="outlined"
                          href={`section/${section.id}`}
                          disabled={work}
                          startIcon={<PeopleIcon />}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            px: 3,
                            py: 1,
                            borderRadius: 2,
                            boxShadow: 2,
                            color: "text.primary",
                            borderColor: "text.primary",
                            "&:hover": {
                              boxShadow: 4,
                              borderColor: "text.primary",
                              backgroundColor: "action.hover",
                            },
                          }}
                        >
                          {t("index.viewSection")}
                        </PrefetchButton>
                      </Box>
                    </Box>
                    {/* <CardMedia
                  component="img"
                  sx={{ width: 151 }}
                  image="/static/images/cards/live-from-space.jpg"
                  alt="Live from space album cover"
                /> */}
                    {section?.featuredImage && (
                      <LazyCardMedia
                        s3Key={section.featuredImage}
                        identityId={section.identityId}
                      />
                    )}
                  </Card>
                );
              })}
            </Box>
          )}

          {sections?.length > 0 && (
            <Box
              style={{
                padding: "1rem",
                marginBottom: "3rem",
                margin: "1rem auto",
                maxWidth: "80rem",
              }}
            >
              <Typography
                variant="h3"
                component="div"
                sx={{
                  flexGrow: 1,
                  padding: "1rem",
                  margin: "1rem auto",
                }}
              >
                {t("index.sections")}
              </Typography>

              {sections?.map(function (section, index) {
                return (
                  <Card
                    key={index}
                    elevation={2}
                    sx={{
                      display: "flex",
                      margin: "1rem auto",
                      width: "90vw",
                      maxWidth: "80rem",
                      borderRadius: 2,
                      borderLeft: "4px solid",
                      borderLeftColor: "text.primary",
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        elevation: 6,
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        flexGrow: "1",
                        p: 0.5,
                      }}
                    >
                      <CardContent sx={{ flex: "1 0 auto", pb: 1 }}>
                        <Typography
                          component="div"
                          variant="h5"
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          {section?.name || t("index.untitledSection")}
                        </Typography>
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          component="div"
                          sx={{ lineHeight: 1.6 }}
                        >
                          {section?.description || t("index.noDescription")}
                        </Typography>
                      </CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          pl: 2,
                          pb: 1.5,
                        }}
                      >
                        <PrefetchButton
                          variant="outlined"
                          href={`section/${section.id}`}
                          disabled={work}
                          startIcon={<EditNoteIcon />}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            px: 3,
                            py: 1,
                            borderRadius: 2,
                            boxShadow: 2,
                            color: "text.primary",
                            borderColor: "text.primary",
                            "&:hover": {
                              boxShadow: 4,
                              borderColor: "text.primary",
                              backgroundColor: "action.hover",
                            },
                          }}
                        >
                          {t("index.viewSection")}
                        </PrefetchButton>
                      </Box>
                    </Box>
                    {/* <CardMedia
                              component="img"
                              sx={{ width: 151 }}
                              image="/static/images/cards/live-from-space.jpg"
                              alt="Live from space album cover"
                            /> */}
                    {section?.featuredImage && (
                      <LazyCardMedia
                        s3Key={section.featuredImage}
                        identityId={section.identityId}
                      />
                    )}
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
}

function WrappedPage({ signOut, user, ...args }) {
  return (
    <MyAuth>
      <GamificationProviderWrapper>
        <FilesProvider>
          <Index signOut={signOut} user={user} {...args} />
        </FilesProvider>
      </GamificationProviderWrapper>
    </MyAuth>
  );
}

export default WrappedPage;
