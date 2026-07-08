"use client";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getAmplifyClient } from "@/utils/amplifyClient";
import SectionContext, { SectionProvider } from "@/context/sectionContext";
import { CollaborativeChatWrapper } from "@/components/Chat/CollaborativeChatWrapper";

import PeopleIcon from "@mui/icons-material/People";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import {
  Button,
  Box,
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
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Switch,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

import AppShell from "@/components/AppShell";
import { useAppShell } from "@/components/AppShellContext";
import LazyCardMedia from "@/components/LazyCardMedia";
import InstructorDashboard from "@/components/InstructorDashboard";
import { useChatPageContext } from "@/hooks/useChatPageContext";
import { CampaignSetupWizard } from "@/components/Gamification/CampaignSetupWizard";

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
  const { drawerOpen, drawerWidth, isDesktop } = useAppShell();
  const { sections, refetchSections } = React.useContext(SectionContext);
  const [work, setIsWorking] = useState(false);
  const [open, setOpen] = React.useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuSectionId, setMenuSectionId] = useState(null);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardSectionId, setWizardSectionId] = useState("");
  const [wizardSectionName, setWizardSectionName] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  // Mark sections as loaded once data arrives from subscription
  React.useEffect(() => {
    if (sections && sections.length > 0) {
      setSectionsLoaded(true);
    }
    // Also mark loaded after a brief timeout to handle genuinely empty state
    const timer = setTimeout(() => setSectionsLoaded(true), 2000);
    return () => clearTimeout(timer);
  }, [sections]);

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
    return owned;
  }, [sections, userId]);
  const canViewInstructorDashboard = isInstructor || ownedSections.length > 0;

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleMenuOpen = (event, sectionId) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuSectionId(sectionId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuSectionId(null);
  };

  async function handleArchiveToggle(section) {
    handleMenuClose();
    setIsWorking(true);
    try {
      const client = getAmplifyClient();
      const newStatus =
        section.status === "ARCHIVED" ? "PUBLISHED" : "ARCHIVED";
      await client.models.Section.update({
        id: section.id,
        status: newStatus,
      });
      setSnackbar({
        open: true,
        message:
          newStatus === "ARCHIVED"
            ? t("sections.archivedSuccess")
            : t("sections.unarchivedSuccess"),
        severity: "success",
      });
    } catch (error) {
      console.error("[Section Archive] Error:", error);
      setSnackbar({
        open: true,
        message: t("sections.archiveError"),
        severity: "error",
      });
    } finally {
      setIsWorking(false);
    }
  }

  const visibleSections = React.useMemo(() => {
    if (!sections) return [];
    const valid = sections.filter((s) => s != null && s.id != null);
    if (showArchived) return valid;
    return valid.filter((s) => s.status !== "ARCHIVED");
  }, [sections, showArchived]);

  const archivedCount = React.useMemo(() => {
    if (!sections) return 0;
    return sections.filter((s) => s != null && s.status === "ARCHIVED").length;
  }, [sections]);

  async function handleCreate(event) {
    setIsWorking(true);
    event.preventDefault();

    const form = new FormData(event.target);

    try {
      const name = form.get("name").toString();
      const description = form.get("description").toString();

      const client = getAmplifyClient();
      const { data, errors } = await client.mutations.createSectionGroup({
        name: name.trim(),
        description: description.trim() || null,
      });

      if (errors?.length) {
        throw new Error(errors[0]?.message || "Failed to create section");
      }

      const result = typeof data === "string" ? JSON.parse(data) : data;

      // Refetch sections to get the newly created section
      // (subscriptions may not always deliver immediately)
      await refetchSections();

      setIsWorking(false);
      setOpen(false);

      // Offer campaign narrative setup to instructors
      if (isInstructor && result?.sectionId) {
        setWizardSectionId(result.sectionId);
        setWizardSectionName(result.name || form.get("name").toString().trim());
        setWizardOpen(true);
      }
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {archivedCount > 0 && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={showArchived}
                      onChange={(e) => setShowArchived(e.target.checked)}
                      size="small"
                    />
                  }
                  label={t("sections.showArchived", { count: archivedCount })}
                  sx={{ mr: 1 }}
                />
              )}
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
            </Box>
          </div>

          {/* Instructor Dashboard with aggregate stats and leaderboards */}
          {canViewInstructorDashboard && (
            <InstructorDashboard sections={ownedSections} />
          )}

          {!sectionsLoaded && sections.length === 0 && (
            <>
              {[0, 1, 2].map((i) => (
                <Card
                  key={i}
                  elevation={2}
                  sx={{
                    display: "flex",
                    margin: "1rem auto",
                    width:
                      isDesktop && drawerOpen
                        ? `calc(90vw - ${drawerWidth}px)`
                        : "90vw",
                    maxWidth: "80rem",
                    borderRadius: 2,
                    borderLeft: "4px solid",
                    borderLeftColor: "text.primary",
                    p: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      flexGrow: 1,
                      gap: 1,
                    }}
                  >
                    <Skeleton variant="text" width="40%" height={36} />
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton
                      variant="rectangular"
                      width={140}
                      height={40}
                      sx={{ borderRadius: 2, mt: 1 }}
                    />
                  </Box>
                </Card>
              ))}
            </>
          )}

          {sectionsLoaded && sections.length === 0 && (
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
            visibleSections.map(function (section) {
              return (
                <Card
                  key={section.id}
                  data-tour="section-card"
                  elevation={2}
                  sx={{
                    display: "flex",
                    margin: "1rem auto",
                    width:
                      isDesktop && drawerOpen
                        ? `calc(90vw - ${drawerWidth}px)`
                        : "90vw",
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
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          component="div"
                          variant="h5"
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          {section?.name || t("sections.untitledSection")}
                          {section.status === "ARCHIVED" && (
                            <Chip
                              label={t("sections.archived")}
                              size="small"
                              color="default"
                              sx={{ ml: 1, verticalAlign: "middle" }}
                            />
                          )}
                        </Typography>
                        {(isInstructor || section.owner === userId) && (
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, section.id)}
                            disabled={work}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        )}
                      </Box>
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
                    <Box
                      sx={{
                        maxWidth: "50%",
                        flexShrink: 0,
                        maxHeight: 200,
                        overflow: "hidden",
                      }}
                    >
                      <LazyCardMedia
                        s3Key={section?.featuredImage}
                        identityId={section?.identityId}
                      />
                    </Box>
                  )}
                </Card>
              );
            })}

          {/* Section actions menu */}
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            {(() => {
              const menuSection = sections?.find(
                (s) => s?.id === menuSectionId,
              );
              if (!menuSection) return null;
              const isArchived = menuSection.status === "ARCHIVED";
              return (
                <MenuItem onClick={() => handleArchiveToggle(menuSection)}>
                  <ListItemIcon>
                    {isArchived ? (
                      <UnarchiveIcon fontSize="small" />
                    ) : (
                      <ArchiveIcon fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText>
                    {isArchived
                      ? t("sections.unarchive")
                      : t("sections.archive")}
                  </ListItemText>
                </MenuItem>
              );
            })()}
          </Menu>
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

      {/* Campaign narrative wizard — shown after section creation for instructors */}
      {wizardOpen && wizardSectionId && (
        <CampaignSetupWizard
          open={wizardOpen}
          sectionId={wizardSectionId}
          sectionName={wizardSectionName}
          onClose={() => setWizardOpen(false)}
          onCreated={() => setWizardOpen(false)}
        />
      )}
    </>
  );
}

function WrappedPage({ initialSections = [] }) {
  return (
    <SectionProvider initialSections={initialSections}>
      <Sections />
      <CollaborativeChatWrapper />
    </SectionProvider>
  );
}

export default WrappedPage;
