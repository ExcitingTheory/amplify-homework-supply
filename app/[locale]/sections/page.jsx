"use client";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getAmplifyClient } from "@/utils/amplifyClient";
import SectionContext, { SectionProvider } from "@/context/sectionContext";
import { createSection } from "../../actions/section";

import PeopleIcon from "@mui/icons-material/People";

import {
  Button,
  Box,
  AppBar,
  Card,
  Typography,
  TextField,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CardContent,
  CardMedia,
  Chip,
  Snackbar,
  Alert,
  Skeleton,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

import MainToolbar from "@/components/MainToolbar";
import MyAuth from "@/components/AmplifyAuthenticator";
import AppSkeleton from "@/components/AppSkeleton";
import getCachedUrl from "@/utils/getCachedUrl";
import InstructorDashboard from "@/components/InstructorDashboard";
import { useChatPageContext } from "@/hooks/useChatPageContext";

function CardMediaComponent({ s3Key, identityId, level = "protected" }) {
  const [url, setUrl] = React.useState(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    setLoaded(false);
    const asyncFunc = async () => {
      const _url = await getCachedUrl(s3Key);
      setUrl(_url);
    };
    asyncFunc();
  }, [s3Key]);

  return (
    <Box
      sx={{
        position: "relative",
        width: 400,
        alignSelf: "left",
        flexShrink: 0,
      }}
    >
      <img
        src={url || undefined}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          visibility: loaded ? "visible" : "hidden",
        }}
        onLoad={() => setLoaded(true)}
      />
      {!loaded && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      )}
    </Box>
  );
}

function getUserGroups(user) {
  return (
    user?.signInUserSession?.accessToken?.payload?.["cognito:groups"] ||
    user?.signInUserSession?.idToken?.payload?.["cognito:groups"] ||
    user?.groups ||
    []
  );
}

function getUserId(user) {
  return (
    user?.signInUserSession?.idToken?.payload?.sub ||
    user?.userId ||
    user?.username
  );
}

function Sections({ user }) {
  /**
   * Sections is a page that displays a list of sections.
   * For Instructor users, it displays a list of sections they are teaching.
   * For Student users, it displays a list of sections they are enrolled in.
   * For Admin users, it displays a list of all sections.
   *
   * Sections can be created by Instructors and Admins.
   * Sections can be edited by Instructors and Admins.
   * Sections can be deleted by Admins.
   *
   * Sections can be searched by name.
   * Sections can be filtered by status (draft, published, inactive, archived).
   * Sections can be sorted by name, status, and date created.
   *
   * Sections can be exported as a CSV file.
   * Sections can be imported as a CSV file.
   *
   * Sections can be archived by Instructors and Admins.
   * Sections can be unarchived by Instructors and Admins.
   *
   * Sections can be deleted by Admins.
   *
   * Sections can be copied by Instructors and Admins.
   *
   */
  const t = useTranslations("pages");
  const { sections, refetchSections } = React.useContext(SectionContext);
  const [work, setIsWorking] = useState(false);
  const [open, setOpen] = React.useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  // Register page context with global chat
  useChatPageContext({
    sections,
  });

  const userGroups = React.useMemo(() => getUserGroups(user), [user]);
  const isInstructor = React.useMemo(
    () => userGroups.includes("Instructors") || userGroups.includes("Admins"),
    [userGroups],
  );
  const userId = React.useMemo(() => getUserId(user), [user]);
  const ownedSections = React.useMemo(() => {
    if (!userId) return [];
    // Filter out null items explicitly before checking ownership
    const owned = sections.filter(
      (section) =>
        section != null &&
        section.id != null &&
        (section.owner === userId || section.instructor === userId),
    );
    // Filter for console.log to prevent "Cannot read properties of null" errors
    const validOwned = owned.filter((s) => s != null && s.id != null);
    console.log(
      "[sections.jsx] userId:",
      userId,
      "ownedSections:",
      validOwned.length,
      validOwned.map((s) => ({
        name: s.name,
        owner: s.owner,
        instructor: s.instructor,
      })),
    );
    return owned;
  }, [sections, userId]);
  const canViewInstructorDashboard = isInstructor || ownedSections.length > 0;

  console.log(
    "[sections.jsx] canViewInstructorDashboard:",
    canViewInstructorDashboard,
    "isInstructor:",
    isInstructor,
    "ownedSections.length:",
    ownedSections.length,
  );
  console.log("sections", sections);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  async function handleCreate(event) {
    setIsWorking(true);
    event.preventDefault();

    const form = new FormData(event.target);

    try {
      const name = form.get("name").toString();
      const description = form.get("description").toString();

      console.log("createInput", { name, description });

      const result = await createSection(name, description);

      console.log("createSection result:", result);

      if (!result.success) {
        throw new Error(result.error || "Failed to create section");
      }

      console.log("Section created:", result);

      // Refetch sections to get the newly created section
      // (subscriptions may not always deliver immediately)
      await refetchSections();

      setIsWorking(false);
      setOpen(false);
    } catch (error) {
      // Log detailed error information for debugging
      console.error("[Section Creation] Error:", error);
      console.error("[Section Creation] Error details:", {
        message: error?.message,
        stack: error?.stack,
        response: error?.response,
      });

      // Show generic user-friendly message (hide implementation details)
      setSnackbar({
        open: true,
        message: "Unable to create section. Please try again.",
        severity: "error",
      });
      setIsWorking(false);
    }
  }

  // Sections now come from SectionContext - no duplicate subscription needed

  // console.log('sections', sections)

  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        sx={{
          backgroundColor: "custom.glassNavbar",
          backdropFilter: "blur(8px)",
        }}
      >
        <MainToolbar>
          <Box sx={{ flexGrow: 1, margin: "1rem" }} />
        </MainToolbar>
      </AppBar>
      <Box
        data-tour="sections-page"
        style={{
          padding: "2rem 1rem",
        }}
      >
        <Dialog
          data-tour="section-form"
          open={open}
          onClose={handleClose}
          aria-labelledby="form-dialog-title"
          slotProps={{
            backdrop: {
              sx: {
                //Your style here....
                backdropFilter: "blur(1px)",
              },
            },
          }}
        >
          <form onSubmit={handleCreate}>
            <DialogTitle>{t("sections.newSection.title")}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {t("sections.newSection.description")}
              </DialogContentText>
              <br />

              <TextField
                sx={{ width: "100%" }}
                required
                id="name"
                name="name"
                label={t("sections.newSection.nameLabel")}
                variant="outlined"
              />
              <br />
              <br />
              <TextField
                sx={{ width: "100%" }}
                required
                multiline
                rows={4}
                id="description"
                name="description"
                label={t("sections.newSection.descriptionLabel")}
                variant="outlined"
              />
              <br />
              <br />

              <br />
              <br />
            </DialogContent>
            <DialogActions
              sx={{
                padding: "2rem",
              }}
            >
              <Button
                disabled={work}
                onClick={handleClose}
                color="primary"
                variant="outlined"
              >
                {t("sections.newSection.cancel")}
              </Button>
              <Button disabled={work} type="submit" variant="contained">
                {t("sections.newSection.create")}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            margin: "1rem auto",
          }}
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
              {t("sections.title")}&nbsp;
            </Typography>
            <Button
              data-tour="create-section-button"
              variant="outlined"
              color="primary"
              disabled={work}
              onClick={handleClickOpen}
            >
              <AddIcon />
              &nbsp;{t("sections.createNew")}
            </Button>
          </div>

          {/* Instructor Dashboard with aggregate stats and leaderboards */}
          {canViewInstructorDashboard && (
            <InstructorDashboard sections={ownedSections} />
          )}

          {!sections && <AppSkeleton variant="cards" />}

          {sections.length == 0 && (
            //embed url to create a new section
            <Card
              elevation={3}
              sx={{
                display: "flex",
                margin: "1rem auto",
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
                    {t("sections.noSectionsYet")}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleClickOpen}
                    disabled={work}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                    }}
                  >
                    {t("sections.createNewSection")}
                  </Button>
                </CardContent>
              </Box>
            </Card>
          )}
          {sections &&
            sections
              .filter((section) => section != null && section.id != null) // Filter out null/undefined sections and sections without ID
              .map(function (section) {
                console.log("!!!section", section);
                return (
                  <Card
                    key={section.id}
                    data-tour="section-card"
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
                          {section?.name || t("sections.untitledSection")}
                        </Typography>
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          component="div"
                          sx={{ lineHeight: 1.6 }}
                        >
                          {section?.description || ""}
                        </Typography>
                        {section?.code && (
                          <Box
                            sx={{
                              mt: 1.5,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontWeight: 500 }}
                            >
                              {t("sections.joinCode")}:
                            </Typography>
                            <Chip
                              data-tour="join-code"
                              label={section.code}
                              size="small"
                              sx={{
                                fontFamily: "monospace",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                backgroundColor: "action.selected",
                                border: "1px solid",
                                borderColor: "divider",
                              }}
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
                          href={`/section/${section.id}`}
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
                          {t("sections.viewSection")}
                        </Button>
                      </Box>
                    </Box>
                    {section?.featuredImage && (
                      <CardMediaComponent
                        s3Key={section?.featuredImage}
                        identityId={section?.identityId}
                      />
                    )}
                  </Card>
                );
              })}
        </Box>
      </Box>

      {/* Error/Success Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

function WrappedPage() {
  return (
    <MyAuth>
      <SectionProvider>
        <Sections />
      </SectionProvider>
    </MyAuth>
  );
}

export default WrappedPage;
