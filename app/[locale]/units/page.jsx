"use client";
import React, { useState, useEffect, useRef } from "react";
import { getAmplifyClient } from "@/utils/amplifyClient";
import { useTranslations } from "next-intl";
import {
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Skeleton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AppShell from "@/components/AppShell";

import IconEdit from "@mui/icons-material/Edit";
import EditNoteIcon from "@mui/icons-material/EditNote";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";

import LazyCardMedia from "@/components/LazyCardMedia";
import { useChatPageContext } from "@/hooks/useChatPageContext";
import AuthContext from "@/context/authContext";
import { BadgeShelf } from "@/components/Gamification/BadgeShelf";
import { ContentLockCard } from "@/components/Gamification/ContentLockCard";
import {
  useContentLock,
  useXP,
  useBadges,
} from "@/context/gamificationContext";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import {
  PracticeDrillConfigPopup,
  PracticeDrillDialog,
} from "@/components/PracticeDrill";

import { fetchAuthSession } from "aws-amplify/auth";
import { useRouter, useSearchParams } from "next/navigation";

function Units() {
  const t = useTranslations("pages");
  const { user, isLoading: authLoading } = React.useContext(AuthContext) || {
    user: undefined,
    isLoading: true,
  };

  /**
   * Units is a page that displays a list of units.
   * For Instructor users, it displays a list of units they are teaching.
   * For Student users, it displays a list of units they are enrolled in.
   * For Admin users, it displays a list of all units.
   *
   * Units can be created by Instructors and Admins.
   * Units can be edited by Instructors and Admins.
   * Units can be deleted by Admins.
   *
   * Units can be searched by name.
   * Units can be filtered by status (draft, published, inactive, archived).
   * Units can be sorted by name, status, and date created.
   *
   * Units can be exported as a CSV file.
   * Units can be imported as a CSV file.
   *
   * Units can be archived by Instructors and Admins.
   * Units can be unarchived by Instructors and Admins.
   * Units can be deleted by Admins.
   *
   * Units can be copied by Instructors and Admins.
   */
  const [draftUnits, setDraftUnits] = useState([]);
  const [publishedUnits, setPublishedUnits] = useState([]);
  const [archivedUnits, setArchivedUnits] = useState([]);
  const [unitsLoaded, setUnitsLoaded] = useState(false);

  const [work, setIsWorking] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get("q") || "";
  const { badges: earnedBadges } = useBadges();
  const { isLocked, getLockStatus } = useContentLock();
  const { totalXP } = useXP();
  // Practice drill state
  const [practiceConfigOpen, setPracticeConfigOpen] = useState(false);
  const [practiceDrillOpen, setPracticeDrillOpen] = useState(false);
  const [practiceUnit, setPracticeUnit] = useState(null);
  const [drillConfig, setDrillConfig] = useState(null);

  const handleOpenPractice = (unit) => {
    setPracticeUnit(unit);
    setPracticeConfigOpen(true);
  };

  const handleStartDrill = (config) => {
    setDrillConfig(config);
    setPracticeConfigOpen(false);
    setPracticeDrillOpen(true);
  };

  const handleCloseDrill = () => {
    setPracticeDrillOpen(false);
    setDrillConfig(null);
    setPracticeUnit(null);
  };

  // Group badges by sourceId (unit ID) for per-card display
  const badgesByUnit = React.useMemo(() => {
    const map = {};
    earnedBadges.forEach((b) => {
      if (!b.sourceId) return;
      if (!map[b.sourceId]) map[b.sourceId] = [];
      map[b.sourceId].push(b);
    });
    return map;
  }, [earnedBadges]);

  // Register page context with global chat
  // Combine all units for chat context
  const allUnits = React.useMemo(
    () => [...draftUnits, ...publishedUnits, ...archivedUnits],
    [draftUnits, publishedUnits, archivedUnits],
  );

  // Filter units by ?q= search param for URL-driven highlighting
  const filterBySearchQuery = React.useCallback(
    (units) => {
      if (!searchQuery) return units;
      const q = searchQuery.toLowerCase();
      return units.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.description?.toLowerCase().includes(q),
      );
    },
    [searchQuery],
  );

  useChatPageContext({
    // No specific unit, but chat can list/search all units
  });

  // Consolidated Unit observer - handles published, archived, and draft units with client-side filtering
  const unitVersionMapRef = useRef({});

  useEffect(() => {
    // Wait for authentication
    if (authLoading || !user) {
      console.log("[Units] Waiting for authentication...", {
        authLoading,
        hasUser: !!user,
      });
      return;
    }

    console.log(
      "[Units] Setting up Unit observeQuery for user:",
      user.username,
    );
    const client = getAmplifyClient();
    let cancelled = false;

    function updateUnitsState(items) {
      const published = items.filter((u) => u.status === "PUBLISHED");
      const archived = items.filter((u) => u.status === "ARCHIVED");
      const draft = items.filter(
        (u) => u.status !== "ARCHIVED" && u.status !== "PUBLISHED",
      );

      setPublishedUnits(published);
      setArchivedUnits(archived);
      setDraftUnits(draft);
    }

    // Single observeQuery replaces list() + 3 manual subscriptions
    const subscription = client.models.Unit.observeQuery().subscribe({
      next: ({ items }) => {
        if (cancelled) return;
        const validItems = (items || []).filter(
          (u) => u != null && u.id != null,
        );

        // Version map guard: skip if no item has a newer _version
        const hasChanges = validItems.some((item) => {
          const tracked = unitVersionMapRef.current[item.id];
          return tracked == null || item._version > tracked;
        });

        if (!hasChanges && Object.keys(unitVersionMapRef.current).length > 0) {
          return;
        }

        // Update version map
        unitVersionMapRef.current = {};
        validItems.forEach((item) => {
          unitVersionMapRef.current[item.id] = item._version;
        });

        console.log(
          "[Units] Unit observeQuery update:",
          validItems.length,
          "units",
        );
        updateUnitsState(validItems);
        setUnitsLoaded(true);
      },
      error: (error) => console.error("[Units] observeQuery error:", error),
    });

    return function cleanup() {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [user, authLoading]);

  async function createUnit(event) {
    setIsWorking(true);
    event.preventDefault();

    const { identityId } = await fetchAuthSession();

    try {
      const client = getAmplifyClient();
      const response = await client.models.Unit.create({
        name: "",
        description: "",
        identityId,
      });

      if (response.errors?.length > 0) {
        console.error("Error creating unit:", response.errors);
        throw new Error(response.errors[0].message);
      }

      console.log("newUnit", response.data);
      router.push(`/unit/${response.data.id}`);
    } catch (errors) {
      console.error(errors);
      setIsWorking(false);
    }
  }

  return (
    <>
      <Box
        data-tour="units-page"
        style={
          {
            // padding: '2rem 1rem',
          }
        }
      >
        <div
          style={{
            margin: "0",
            padding: "2rem",
            flexGrow: "1",
            minWidth: "min-content",
            // center the text both horizontally and vertically
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // maxWidth: '50rem'
          }}
        >
          <Typography
            variant="h2"
            component="div"
            sx={{
              flexGrow: 1,
            }}
          >
            {t("units.title")}&nbsp;
          </Typography>
          <Button
            data-tour="create-unit-button"
            variant="outlined"
            color="primary"
            disabled={work}
            onClick={createUnit}
          >
            <AddIcon />
            &nbsp;{t("units.createNew")}
          </Button>
        </div>
        <Box
          data-tour="units-list"
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            margin: "1rem auto",
          }}
        >
          {!unitsLoaded && (
            // Loading skeleton placeholders to prevent layout shift
            <>
              {[1, 2, 3].map((i) => (
                <Card
                  key={i}
                  elevation={2}
                  sx={{
                    display: "flex",
                    margin: "1rem auto",
                    width: "90vw",
                    maxWidth: "80rem",
                    borderRadius: 2,
                    borderLeft: "4px solid",
                    borderLeftColor: "action.disabled",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      flexGrow: "1",
                      p: 2,
                    }}
                  >
                    <Skeleton
                      variant="text"
                      width="60%"
                      height={32}
                      sx={{ mb: 1 }}
                    />
                    <Skeleton variant="text" width="90%" height={20} />
                    <Skeleton variant="text" width="40%" height={20} />
                    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                      <Skeleton variant="rounded" width={140} height={36} />
                      <Skeleton variant="rounded" width={100} height={36} />
                      <Skeleton variant="rounded" width={80} height={36} />
                    </Box>
                  </Box>
                </Card>
              ))}
            </>
          )}
          {unitsLoaded && publishedUnits.length == 0 && (
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
                    {t("units.noPublishedUnits")}
                  </Typography>
                  <Button
                    data-tour="create-unit-button"
                    variant="outlined"
                    color="primary"
                    onClick={createUnit}
                    disabled={work}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                    }}
                  >
                    {t("units.createNewUnit")}
                  </Button>
                </CardContent>
              </Box>
            </Card>
          )}
          {publishedUnits.length > 0 && (
            <>
              <Typography
                variant="h4"
                component="div"
                sx={{
                  flexGrow: 1,
                  width: "80vw",
                  margin: "1rem auto",
                }}
              >
                {t("units.publishedUnits")}
              </Typography>
              {publishedUnits.map(function (unit) {
                const lockStatus = getLockStatus(unit.id);
                const unitLocked = isLocked(unit.id);

                return (
                  <ContentLockCard
                    key={unit.id}
                    id={`unit-${unit.id}`}
                    title={unit.name || t("units.untitledUnit")}
                    isLocked={unitLocked}
                    requiredXP={lockStatus?.requiredXP}
                    currentXP={totalXP}
                    requiredCompletion={lockStatus?.requiredCompletion}
                    currentCompletion={lockStatus?.currentCompletion}
                    requiredBadge={lockStatus?.requiredBadge}
                    requiredPriorUnitId={lockStatus?.requiredPriorUnitId}
                  >
                    <Card
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
                            {unit.name || t("units.untitledUnit")}
                          </Typography>
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            component="div"
                            sx={{ lineHeight: 1.6 }}
                          >
                            {unit.description || ""}
                          </Typography>
                          {badgesByUnit[unit.id]?.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <BadgeShelf
                                earnedBadges={badgesByUnit[unit.id]}
                                columns={Math.min(
                                  badgesByUnit[unit.id].length,
                                  5,
                                )}
                                earnedOnly
                              />
                            </Box>
                          )}
                        </CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            pl: 2,
                            pb: 1.5,
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          <Button
                            variant="outlined"
                            href={`/workbook/${unit.id}`}
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
                            {t("units.viewWorkbook")}
                          </Button>
                          <Button
                            variant="outlined"
                            disabled={work}
                            onClick={() => handleOpenPractice(unit)}
                            startIcon={<FitnessCenterIcon />}
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
                            {t("units.practice", "Practice")}
                          </Button>
                          <Button
                            variant="outlined"
                            href={`/unit/${unit.id}`}
                            disabled={work}
                            startIcon={<IconEdit />}
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
                            {t("units.editUnit")}
                          </Button>
                        </Box>
                      </Box>
                      {unit?.featuredImage && (
                        <LazyCardMedia
                          s3Key={unit?.featuredImage}
                          identityId={unit?.identityId}
                        />
                      )}
                    </Card>
                  </ContentLockCard>
                );
              })}
            </>
          )}

          {draftUnits.length > 0 && (
            <>
              <Typography
                variant="h4"
                component="div"
                sx={{
                  flexGrow: 1,
                  width: "80vw",
                  margin: "1rem auto",
                }}
              >
                {t("units.myDrafts")}
              </Typography>
              {draftUnits.map(function (unit) {
                return (
                  <Card
                    key={unit.id}
                    id={`unit-${unit.id}`}
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
                          {unit.name || t("units.untitledUnit")}
                        </Typography>
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          component="div"
                          sx={{ lineHeight: 1.6 }}
                        >
                          {unit.description || ""}
                        </Typography>
                        {badgesByUnit[unit.id]?.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <BadgeShelf
                              earnedBadges={badgesByUnit[unit.id]}
                              columns={Math.min(
                                badgesByUnit[unit.id].length,
                                5,
                              )}
                              earnedOnly
                            />
                          </Box>
                        )}
                      </CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          pl: 2,
                          pb: 1.5,
                        }}
                      >
                        <Button
                          variant="outlined"
                          href={`/workbook/${unit.id}`}
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
                          {t("units.viewWorkbook")}
                        </Button>
                        <Button
                          variant="outlined"
                          href={`/unit/${unit.id}`}
                          disabled={work}
                          startIcon={<IconEdit />}
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
                          {t("units.editUnit")}
                        </Button>
                      </Box>
                    </Box>
                    {unit?.featuredImage && (
                      <LazyCardMedia
                        s3Key={unit?.featuredImage}
                        identityId={unit?.identityId}
                      />
                    )}
                  </Card>
                );
              })}
            </>
          )}

          {archivedUnits.length > 0 && (
            <>
              <Typography
                variant="h4"
                component="div"
                sx={{
                  flexGrow: 1,
                  width: "80vw",
                  margin: "1rem auto",
                }}
              >
                {t("units.archivedUnits")}
              </Typography>
              {archivedUnits.map(function (unit) {
                return (
                  <Card
                    key={unit.id}
                    id={`unit-${unit.id}`}
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
                          {unit.name || t("units.untitledUnit")}
                        </Typography>
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          component="div"
                          sx={{ lineHeight: 1.6 }}
                        >
                          {unit.description || ""}
                        </Typography>
                        {badgesByUnit[unit.id]?.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <BadgeShelf
                              earnedBadges={badgesByUnit[unit.id]}
                              columns={Math.min(
                                badgesByUnit[unit.id].length,
                                5,
                              )}
                              earnedOnly
                            />
                          </Box>
                        )}
                      </CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          pl: 2,
                          pb: 1.5,
                        }}
                      >
                        <Button
                          variant="outlined"
                          href={`/workbook/${unit.id}`}
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
                          {t("units.viewWorkbook")}
                        </Button>
                        <Button
                          variant="outlined"
                          href={`/unit/${unit.id}`}
                          disabled={work}
                          startIcon={<IconEdit />}
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
                          {t("units.editUnit")}
                        </Button>
                      </Box>
                    </Box>
                    {unit?.featuredImage && (
                      <LazyCardMedia
                        s3Key={unit?.featuredImage}
                        identityId={unit?.identityId}
                      />
                    )}
                  </Card>
                );
              })}
            </>
          )}
        </Box>
      </Box>

      {/* Practice Drill Config Popup */}
      {practiceUnit && (
        <PracticeDrillConfigPopup
          open={practiceConfigOpen}
          onClose={() => {
            setPracticeConfigOpen(false);
            setPracticeUnit(null);
          }}
          onStart={handleStartDrill}
          unitId={practiceUnit.id}
          unitName={practiceUnit.name || ""}
          vocabularyCount={0}
          questionCount={0}
          textBlockCount={0}
          documentCount={0}
        />
      )}

      {/* Practice Drill Dialog */}
      {drillConfig && practiceUnit && (
        <PracticeDrillDialog
          open={practiceDrillOpen}
          onClose={handleCloseDrill}
          unitId={practiceUnit.id}
          unitName={practiceUnit.name || ""}
          config={drillConfig}
        />
      )}
    </>
  );
}

function WrappedPage() {
  return (
    <GamificationProviderWrapper>
      <Units />
    </GamificationProviderWrapper>
  );
}

export default WrappedPage;
