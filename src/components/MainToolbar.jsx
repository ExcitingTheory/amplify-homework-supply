"use client";
/**
 * @module MainToolbar
 * @category Components
 * @description MainToolbar component
 *
 * MainToolbar component for the app
 * @todo Add a dropdown for the user.
 * @todo Add a dropdown for the settings.
 * @todo Add a dropdown for the help.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
// import AppBar from '@mui/material/AppBar';
// import Box from '@mui/material/Box';
import Toolbar from "@mui/material/Toolbar";
// import Typography from '@mui/material/Typography';
// import Button from '@mui/material/Button';
import IconButton from "@mui/material/IconButton";
import ProfileIcon from "@mui/icons-material/AccountCircle";
import UserIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import BatteryUnknownIcon from "@mui/icons-material/BatteryUnknown";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PeopleIcon from "@mui/icons-material/People";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GroupsIcon from "@mui/icons-material/Groups";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import Collapse from "@mui/material/Collapse";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import PublishIcon from "@mui/icons-material/Publish";
import DraftsIcon from "@mui/icons-material/Drafts";
import { AppShellContext } from "./AppShellContext";
import { signOut } from "aws-amplify/auth";
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import Switch from "@mui/material/Switch";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SettingsBrightnessIcon from "@mui/icons-material/SettingsBrightness";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Menu,
} from "@mui/material";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Help, Settings } from "@mui/icons-material";
import { getAmplifyClient } from "../utils/amplifyClient";
import { joinSection } from "../../app/actions/section";
import { useColorMode } from "../hooks/useColorMode";
import { LevelBadge } from "./Gamification/LevelBadge";
import { AvatarDisplay } from "./Gamification/AvatarDisplay";
import { StreakIndicator } from "./Gamification/StreakIndicator";
import { StreakShield } from "./Gamification/StreakShield";
import { useAvatarConfig } from "../hooks/useAvatarConfig";
import SyncStatusIndicator from "./SyncStatusIndicator";
import { useXP, useProgress, useSquad } from "../context/gamificationContext";
import AuthContext from "../context/authContext";
import EditNoteIcon from "@mui/icons-material/EditNote";
import RateReviewIcon from "@mui/icons-material/RateReview";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import TuneIcon from "@mui/icons-material/Tune";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import JoinPracticeDialog from "./PracticeDrill/JoinPracticeDialog";
import { JoinWorkbookDialog } from "./Workbook";
import { JoinPeerReviewDialog } from "./PeerReview";
import NotificationBadge from "./NotificationBadge";
import { useUnseenCount } from "../context/notificationContext";
import NotificationsIcon from "@mui/icons-material/Notifications";

function ToggleMenuItem(props) {
  const [checked, setChecked] = React.useState(true);

  const handleChange = (event) => {
    setChecked(event.target.checked);
  };

  return (
    <MenuItem>
      <ListItemText primary={props.label} />
      <Switch
        edge="end"
        onChange={handleChange}
        checked={checked}
        inputProps={{ "aria-labelledby": "switch-list-label-wifi" }}
      />
    </MenuItem>
  );
}

export function SettingsMenu() {
  const t = useTranslations("common");
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const router = useRouter();
  const { mode: colorMode, setColorMode } = useColorMode();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSettings = () => {
    // router.push('/settings')
    handleClose();
  };

  return (
    <div>
      <Button
        id="settings-button"
        color="inherit"
        aria-label={t("common.settings")}
        aria-controls={open ? "settings-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      >
        <Settings />
      </Button>
      <Menu
        id="settings-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        <ToggleMenuItem
          label={t(
            "mainToolbar.settings.disableNotifications",
            "Disable notifications",
          )}
        />
        <MenuItem>
          <ListItemText
            primary={t("mainToolbar.settings.colorMode", "Color mode")}
          />
          <ToggleButtonGroup
            value={colorMode}
            exclusive
            onChange={(e, val) => val && setColorMode(val)}
            size="small"
            sx={{ ml: 1 }}
          >
            <ToggleButton value="light" aria-label={t("darkMode.light")}>
              <LightModeIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="auto" aria-label={t("darkMode.system")}>
              <SettingsBrightnessIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="dark" aria-label={t("darkMode.dark")}>
              <DarkModeIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </MenuItem>
        <ToggleMenuItem
          label={t(
            "mainToolbar.settings.experimentalFeatures",
            "Experimental features",
          )}
        />
        <ToggleMenuItem
          label={t("mainToolbar.settings.studentMode", "Student mode")}
        />

        {/* <MenuItem onClick={handleSettings}>Change password</MenuItem> */}
      </Menu>
    </div>
  );
}

export function HelpMenu() {
  const t = useTranslations("common");
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const router = useRouter();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleHelp = () => {
    // router.push('/help')
    handleClose();
  };

  return (
    <div>
      <Button
        id="help-button"
        color="inherit"
        aria-label={t("common.help")}
        aria-controls={open ? "help-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        data-tour="help-menu"
      >
        <Help />
      </Button>
      <Menu
        id="help-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        <MenuItem onClick={handleHelp}>
          {t("mainToolbar.help", "Help")}
        </MenuItem>
      </Menu>
    </div>
  );
}

export function UserMenu() {
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const { level } = useXP();
  const { streak } = useProgress();
  const { mySquad } = useSquad();
  const { user } = React.useContext(AuthContext);
  const {
    style: avatarStyle,
    overrides: avatarOverrides,
    seed: configSeed,
    isLoaded,
    glowRing,
  } = useAvatarConfig();
  const avatarSeed = user?.attributes?.sub || "";
  const [anchorEl, setAnchorEl] = React.useState(null);
  // const [username, setUsername] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const router = useRouter();

  return (
    <div>
      <IconButton
        id="user-button"
        color="inherit"
        aria-label={tCommon("navigation.profile")}
        aria-controls={open ? "user-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        sx={{ overflow: "visible", px: 0.5 }}
      >
        {/**
         * @todo Replace this with the user's name.
         */}
        {/* <ProfileIcon />&nbsp;{username} */}
        {avatarSeed && isLoaded ? (
          <AvatarDisplay
            seed={avatarSeed}
            size={28}
            style={avatarStyle}
            overrides={avatarOverrides}
            glowRing={glowRing}
            guildCrestSvg={mySquad?.crestSvg ?? null}
            guildName={mySquad?.name}
            guildId={mySquad?.id}
          />
        ) : (
          <ProfileIcon />
        )}
      </IconButton>
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        {open && [
          <MenuItem
            key="profile"
            onClick={() => {
              router.push("/profile");
              handleClose();
            }}
          >
            <UserIcon />
            &nbsp;{tCommon("navigation.profile")}
          </MenuItem>,
          <MenuItem
            key="notifications"
            onClick={() => {
              router.push("/profile/notifications");
              handleClose();
            }}
          >
            <NotificationBadge>
              <NotificationsIcon />
            </NotificationBadge>
            &nbsp;{tCommon("navigation.notifications", "Notifications")}
          </MenuItem>,
          <MenuItem
            key="settings"
            onClick={() => {
              router.push("/settings");
              handleClose();
            }}
          >
            <SettingsBrightnessIcon />
            &nbsp;{tCommon("navigation.settings")}
          </MenuItem>,
          <MenuItem
            key="signout"
            onClick={() => {
              signOut();
              handleClose();
            }}
          >
            <LogoutIcon />
            &nbsp;{tAuth("sign_out")}
          </MenuItem>,
        ]}
      </Menu>
    </div>
  );
}

export default function MainToolbar({ children }) {
  const tCommon = useTranslations("common");
  const tComponents = useTranslations("components");
  const tEditorAuth = useTranslations("editor.authoring");
  const { level, sectionLevel } = useXP();
  const { streak } = useProgress();
  const { session: authSession } = React.useContext(AuthContext);
  const isInstructorOrAdmin = React.useMemo(() => {
    const groups = authSession?.groups || [];
    return groups.some((g) =>
      ["Admins", "Moderators", "Instructors"].includes(g),
    );
  }, [authSession?.groups]);

  // AppShell integration - when inside AppShell, use its context for drawer state
  const appShell = React.useContext(AppShellContext);
  const hasAppShell =
    appShell.isDesktop !== undefined && appShell.setDrawerOpen !== undefined;

  const [localDrawerState, setLocalDrawerState] = React.useState({
    left: false,
  });

  // Unified drawer open/close - delegates to AppShell when available
  const isDrawerOpen = hasAppShell
    ? appShell.drawerOpen
    : localDrawerState.left;
  const setDrawerOpen = React.useCallback(
    (open) => {
      if (hasAppShell) {
        appShell.setDrawerOpen(open);
      } else {
        setLocalDrawerState((prev) => ({ ...prev, left: open }));
      }
    },
    [hasAppShell, appShell],
  );

  const [state, setState] = React.useState({
    // top: false,
    left: false,
    // bottom: false,
    // right: false,
  });

  const router = useRouter();
  const currentPathname = usePathname();
  const currentSearchParams = useSearchParams();

  const [work, setIsWorking] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  const [openAddStudentToSection, setOpenAddStudentToSection] =
    React.useState(false);
  const [openJoinStudyGroup, setOpenJoinStudyGroup] = React.useState(false);
  const [openJoinWorkbook, setOpenJoinWorkbook] = React.useState(false);
  const [openJoinPeerReview, setOpenJoinPeerReview] = React.useState(false);

  // Expandable nav state
  const [sectionsExpanded, setSectionsExpanded] = React.useState(false);
  const [unitsExpanded, setUnitsExpanded] = React.useState(false);
  const [navSections, setNavSections] = React.useState([]);
  const [navUnits, setNavUnits] = React.useState([]);
  const [navDataLoaded, setNavDataLoaded] = React.useState(false);

  // Detect current detail pages
  const currentSectionId = React.useMemo(() => {
    const match = currentPathname?.match(/\/section\/([^/]+)/);
    return match ? match[1] : null;
  }, [currentPathname]);

  const currentUnitId = React.useMemo(() => {
    const match = currentPathname?.match(/\/unit\/([^/]+)/);
    return match ? match[1] : null;
  }, [currentPathname]);

  // Auto-expand when on detail pages
  React.useEffect(() => {
    if (currentSectionId) setSectionsExpanded(true);
    if (currentUnitId) setUnitsExpanded(true);
  }, [currentSectionId, currentUnitId]);

  // Fetch nav data lazily: when drawer opens or on detail pages
  React.useEffect(() => {
    const shouldFetch = isDrawerOpen || currentSectionId || currentUnitId;
    if (!shouldFetch || navDataLoaded || !authSession) return;

    const client = getAmplifyClient();

    async function fetchNavData() {
      try {
        const fetches = [client.models.Section.list()];
        // Only fetch units if the user is an instructor/admin
        if (isInstructorOrAdmin) {
          fetches.push(client.models.Unit.list());
        }
        const results = await Promise.allSettled(fetches);
        const sectionsResult =
          results[0].status === "fulfilled" ? results[0].value : { data: [] };
        const unitsResult =
          isInstructorOrAdmin && results[1]?.status === "fulfilled"
            ? results[1].value
            : { data: [] };
        if (results[0].status === "rejected") {
          console.warn(
            "[MainToolbar] Failed to fetch sections:",
            results[0].reason,
          );
        }
        if (isInstructorOrAdmin && results[1]?.status === "rejected") {
          console.warn(
            "[MainToolbar] Failed to fetch units:",
            results[1].reason,
          );
        }
        setNavSections(
          (sectionsResult.data || []).filter(
            (s) => s != null && s.id != null && s.deletedAt == null,
          ),
        );
        setNavUnits(
          (unitsResult.data || []).filter(
            (u) => u != null && u.id != null && u.deletedAt == null,
          ),
        );
        setNavDataLoaded(true);
      } catch (err) {
        console.error("[MainToolbar] Error fetching nav data:", err);
      }
    }

    fetchNavData();
  }, [
    isDrawerOpen,
    currentSectionId,
    currentUnitId,
    navDataLoaded,
    authSession,
  ]);

  // Section detail headings for scroll navigation
  const sectionHeadings = React.useMemo(
    () => [
      {
        id: "nav-section-students",
        label: tComponents("sectionDetail.students"),
      },
      {
        id: "nav-section-gradebook",
        label: tComponents("sectionDetail.gradebook"),
      },
      {
        id: "nav-section-completion",
        label: tComponents("sectionDetail.completionGrid"),
      },
      {
        id: "nav-section-leaderboard",
        label: tComponents("sectionDetail.leaderboard"),
      },
      {
        id: "nav-section-assignments",
        label: tComponents("sectionDetail.assignments"),
      },
    ],
    [tComponents],
  );

  // Secret debug mode activation: Click menu icon 7 times within 3 seconds
  const clickTimestamps = React.useRef([]);
  const handleSecretDebugActivation = React.useCallback(() => {
    const now = Date.now();
    clickTimestamps.current.push(now);

    // Keep only clicks from the last 3 seconds
    clickTimestamps.current = clickTimestamps.current.filter(
      (time) => now - time < 3000,
    );

    // If 7 clicks within 3 seconds, enable debug mode
    if (clickTimestamps.current.length >= 7) {
      localStorage.setItem("debug-mode-enabled", "true");
      clickTimestamps.current = [];
      alert(
        "🐛 Debug mode enabled! Refresh the page to activate the debug panel.\n\nUse Cmd/Ctrl + Shift + D to open the debug panel.",
      );
    }
  }, []);

  const toggleDrawer = (anchor, open) => (event) => {
    if (
      event &&
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setDrawerOpen(open);
    setState({ ...state, [anchor]: open });
  };

  // create a mui popup modal for adding a user to a section by section code

  async function addStudentToSection(event) {
    setIsWorking(true);
    event.preventDefault();
    console.log("addStudentToSection");

    console.log("event", event);

    const form = new FormData(event.target);
    let joinedSectionId = null;

    console.log("form", form);

    try {
      const createInput = {
        code: form.get("code").toString(),
      };

      console.log("addSelfToSection.createInput", createInput);

      // Primary: Server Action (no Lambda cold start)
      const response = await joinSection(createInput.code);
      console.log("joinSection.response", response);
      if (!response.success) {
        throw new Error(response.error || "Server Action returned failure");
      }
      joinedSectionId = response.sectionId;
    } catch (errors) {
      console.error(errors);
      //   throw new Error(errors[0].message)
    }

    // CognitoIdentityProviderClientConfig.setRefreshThreshold(100000);
    // AWSMobileClient.getInstance().getTokens();

    const { username, signInDetails } = await getCurrentUser({
      bypassCache: true,
    });

    const { tokens: session } = await fetchAuthSession({ forceRefresh: true });

    console.log("username", username);
    console.log("signInDetails", signInDetails);
    console.log("session", session);

    // Note: Gen2 doesn't use DataStore local cache, so clear is not needed
    // Gen2 client will automatically sync with backend

    setOpenAddStudentToSection(false);
    setIsWorking(false);

    // Navigate directly to the joined section if we have its ID
    if (joinedSectionId) {
      router.push(`/section/${joinedSectionId}`);
    } else if (
      currentPathname === "/sections" ||
      currentPathname.includes("/section/") ||
      currentPathname === "/"
    ) {
      window.location.reload();
    }
  }

  // Group units by published status for the nav tree
  const publishedNavUnits = navUnits.filter((u) => u.status === "PUBLISHED");
  const draftNavUnits = navUnits.filter((u) => u.status !== "PUBLISHED");
  const [publishedExpanded, setPublishedExpanded] = React.useState(true);
  const [draftsExpanded, setDraftsExpanded] = React.useState(false);

  // Handle unit click - scroll to card if on /units page, otherwise navigate
  const handleUnitClick = React.useCallback(
    (e, unit) => {
      const isOnUnitsPage =
        currentPathname === "/units" || currentPathname?.endsWith("/units");
      if (isOnUnitsPage) {
        e.preventDefault();
        const el = document.getElementById(`unit-${unit.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          // Brief highlight effect
          el.style.outline = "2px solid";
          el.style.outlineColor = "var(--mui-palette-primary-main, #1976d2)";
          el.style.borderRadius = "8px";
          setTimeout(() => {
            el.style.outline = "";
            el.style.borderRadius = "";
          }, 1500);
        }
        if (!hasAppShell || !appShell.isDesktop) {
          setDrawerOpen(false);
        }
      }
      // Otherwise, let the <a href> navigate naturally
    },
    [currentPathname, hasAppShell, appShell.isDesktop, setDrawerOpen],
  );

  // Extracted drawer navigation content - shared between persistent and temporary drawers
  const drawerNavContent = (
    <>
      <List sx={{ color: "text.primary" }}>
        <ListItem disablePadding>
          <ListItemButton component="a" href="/">
            <ListItemIcon sx={{ color: "text.primary" }}>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary={tCommon("navigation.home")} />
          </ListItemButton>
        </ListItem>

        {/* Sections — expandable nav with sub-items */}
        <ListItem
          disablePadding
          secondaryAction={
            <IconButton
              edge="end"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSectionsExpanded(!sectionsExpanded);
              }}
              sx={{ color: "text.primary" }}
              aria-label={
                sectionsExpanded ? "collapse sections" : "expand sections"
              }
            >
              {sectionsExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          }
        >
          <ListItemButton component="a" href="/sections">
            <ListItemIcon sx={{ color: "text.primary" }}>
              <NotificationBadge category="ASSIGNMENT">
                <PeopleIcon />
              </NotificationBadge>
            </ListItemIcon>
            <ListItemText primary={tCommon("navigation.sections")} />
          </ListItemButton>
        </ListItem>
        <Collapse
          in={sectionsExpanded}
          timeout="auto"
          unmountOnExit
          onClick={(e) => e.stopPropagation()}
        >
          <List component="div" disablePadding>
            {navSections.map((section) => {
              const isCurrent = section.id === currentSectionId;
              return (
                <React.Fragment key={section.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      component="a"
                      href={`/section/${section.id}`}
                      selected={isCurrent}
                      sx={{ pl: 4 }}
                      onClick={(e) => {
                        if (isCurrent) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    >
                      <ListItemText
                        primary={section.name}
                        secondary={!isCurrent ? section.description : undefined}
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: isCurrent ? 600 : 400,
                          noWrap: true,
                        }}
                        secondaryTypographyProps={{
                          variant: "caption",
                          noWrap: true,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  {isCurrent &&
                    sectionHeadings.map((heading) => (
                      <ListItem key={heading.id} disablePadding>
                        <ListItemButton
                          sx={{ pl: 6 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            document
                              .getElementById(heading.id)
                              ?.scrollIntoView({ behavior: "smooth" });
                            if (!hasAppShell || !appShell.isDesktop) {
                              setDrawerOpen(false);
                            }
                          }}
                        >
                          <ListItemText
                            primary={heading.label}
                            primaryTypographyProps={{
                              variant: "caption",
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                </React.Fragment>
              );
            })}
          </List>
        </Collapse>

        {/* Units — expandable nav with published/draft grouping (instructors only) */}
        {isInstructorOrAdmin && (
          <ListItem
            disablePadding
            secondaryAction={
              <IconButton
                edge="end"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setUnitsExpanded(!unitsExpanded);
                }}
                sx={{ color: "text.primary" }}
                aria-label={unitsExpanded ? "collapse units" : "expand units"}
              >
                {unitsExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            }
          >
            <ListItemButton component="a" href="/units">
              <ListItemIcon sx={{ color: "text.primary" }}>
                <MenuBookIcon />
              </ListItemIcon>
              <ListItemText primary={tCommon("navigation.units")} />
            </ListItemButton>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <Collapse
            in={unitsExpanded}
            timeout="auto"
            unmountOnExit
            onClick={(e) => e.stopPropagation()}
          >
            <List component="div" disablePadding>
              {/* Published units — expandable */}
              {publishedNavUnits.length > 0 && (
                <>
                  <ListItemButton
                    onClick={() => setPublishedExpanded(!publishedExpanded)}
                    sx={{ pl: 4, py: 0.25 }}
                  >
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <PublishIcon
                        sx={{ fontSize: 14, color: "text.secondary" }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={tCommon("navigation.published", "Published")}
                      primaryTypographyProps={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "text.secondary",
                      }}
                    />
                    {publishedExpanded ? (
                      <ExpandLess sx={{ fontSize: 16 }} />
                    ) : (
                      <ExpandMore sx={{ fontSize: 16 }} />
                    )}
                  </ListItemButton>
                  <Collapse in={publishedExpanded} timeout="auto" unmountOnExit>
                    {publishedNavUnits.map((unit) => {
                      const isCurrent = unit.id === currentUnitId;
                      return (
                        <ListItem key={unit.id} disablePadding>
                          <ListItemButton
                            component="a"
                            href={`/unit/${unit.id}`}
                            selected={isCurrent}
                            sx={{ pl: 5 }}
                            onClick={(e) => handleUnitClick(e, unit)}
                          >
                            <ListItemText
                              primary={unit.name}
                              primaryTypographyProps={{
                                variant: "body2",
                                fontWeight: isCurrent ? 600 : 400,
                                noWrap: true,
                              }}
                              secondaryTypographyProps={{
                                variant: "caption",
                                noWrap: true,
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </Collapse>
                </>
              )}
              {/* Draft / Unpublished units — expandable */}
              {draftNavUnits.length > 0 && (
                <>
                  <ListItemButton
                    onClick={() => setDraftsExpanded(!draftsExpanded)}
                    sx={{ pl: 4, py: 0.25 }}
                  >
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <DraftsIcon
                        sx={{ fontSize: 14, color: "text.secondary" }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={tCommon("navigation.drafts", "Drafts")}
                      primaryTypographyProps={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "text.secondary",
                      }}
                    />
                    {draftsExpanded ? (
                      <ExpandLess sx={{ fontSize: 16 }} />
                    ) : (
                      <ExpandMore sx={{ fontSize: 16 }} />
                    )}
                  </ListItemButton>
                  <Collapse in={draftsExpanded} timeout="auto" unmountOnExit>
                    {draftNavUnits.map((unit) => {
                      const isCurrent = unit.id === currentUnitId;
                      return (
                        <ListItem key={unit.id} disablePadding>
                          <ListItemButton
                            component="a"
                            href={`/unit/${unit.id}`}
                            selected={isCurrent}
                            sx={{ pl: 5 }}
                            onClick={(e) => handleUnitClick(e, unit)}
                          >
                            <ListItemText
                              primary={unit.name}
                              primaryTypographyProps={{
                                variant: "body2",
                                fontWeight: isCurrent ? 600 : 400,
                                fontStyle: "italic",
                                noWrap: true,
                              }}
                              secondaryTypographyProps={{
                                variant: "caption",
                                noWrap: true,
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </Collapse>
                </>
              )}
            </List>
          </Collapse>
        )}

        <ListItem disablePadding>
          <ListItemButton component="a" href="/leaderboard">
            <ListItemIcon sx={{ color: "text.primary" }}>
              <NotificationBadge category="GAMIFICATION">
                <LeaderboardIcon />
              </NotificationBadge>
            </ListItemIcon>
            <ListItemText primary={tCommon("navigation.leaderboard")} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component="a" href="/squads">
            <ListItemIcon sx={{ color: "text.primary" }}>
              <NotificationBadge category="SQUAD">
                <GroupsIcon />
              </NotificationBadge>
            </ListItemIcon>
            <ListItemText primary={tCommon("navigation.squads")} />
          </ListItemButton>
        </ListItem>
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <ListItemButton component="a" href="/admin/settings">
              <ListItemIcon sx={{ color: "text.primary" }}>
                <TuneIcon />
              </ListItemIcon>
              <ListItemText primary={tCommon("navigation.gamification")} />
            </ListItemButton>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <ListItemButton component="a" href="/recycle-bin">
              <ListItemIcon sx={{ color: "text.primary" }}>
                <DeleteOutlineIcon />
              </ListItemIcon>
              <ListItemText primary="Recycle Bin" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
      <Divider />
      <List sx={{ color: "text.primary" }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={(e) => {
              e.stopPropagation();
              setOpenJoinStudyGroup(true);
            }}
          >
            <ListItemIcon sx={{ color: "text.primary" }}>
              <GroupsIcon />
            </ListItemIcon>
            <ListItemText
              primary={tCommon("navigation.joinStudyGroup")}
              secondary={tCommon("navigation.joinStudyGroupDesc")}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={(e) => {
              e.stopPropagation();
              setOpenJoinWorkbook(true);
            }}
          >
            <ListItemIcon sx={{ color: "text.primary" }}>
              <EditNoteIcon />
            </ListItemIcon>
            <ListItemText
              primary={tCommon("navigation.joinWorkbook")}
              secondary={tCommon("navigation.joinWorkbookDesc")}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={(e) => {
              e.stopPropagation();
              setOpenJoinPeerReview(true);
            }}
          >
            <ListItemIcon sx={{ color: "text.primary" }}>
              <RateReviewIcon />
            </ListItemIcon>
            <ListItemText
              primary={tCommon("navigation.joinPeerReview")}
              secondary={tCommon("navigation.joinPeerReviewDesc")}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  return (
    <>
      <Toolbar
        variant="dense"
        sx={{
          minHeight: "48px",
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <IconButton
          edge="start"
          color="inherit"
          aria-label={tEditorAuth("mainToolbar.menuAttribute")}
          onClick={(e) => {
            handleSecretDebugActivation();
            toggleDrawer("left", !isDrawerOpen)(e);
          }}
        >
          <MenuIcon />
        </IconButton>
        {/* <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}> */}
        {children && children}
        <div
          ref={appShell.toolbarChildrenPortalRef}
          style={{ display: "contents" }}
        />
        {/* </Typography> */}
        <Box sx={{ flexGrow: 1 }} />
        <SyncStatusIndicator />
        <StreakIndicator
          currentStreak={streak?.currentStreak || 0}
          size="small"
          showEmpty={!isInstructorOrAdmin}
        />
        <StreakShield
          freezesRemaining={streak?.freezesRemaining || 0}
          freezesUsed={streak?.freezesUsed || 0}
          size="small"
          showEmpty={!isInstructorOrAdmin}
        />
        <LevelBadge
          level={currentSearchParams.get("sectionId") ? sectionLevel : level}
          showProgress
          size="small"
        />
        <IconButton
          color="inherit"
          aria-label={tCommon("mainToolbar.joinStudyGroup")}
          data-tour="join-study-group-button"
          onClick={() => setOpenJoinStudyGroup(true)}
        >
          <NotificationBadge category="COLLABORATION">
            <GroupsIcon />
          </NotificationBadge>
        </IconButton>
        <IconButton
          color="inherit"
          aria-label={tCommon("mainToolbar.addToSection.title")}
          data-tour="join-section-button"
          onClick={() => setOpenAddStudentToSection(true)}
        >
          <NotificationBadge category="ASSIGNMENT">
            <PersonAddIcon />
          </NotificationBadge>
        </IconButton>
        <IconButton
          color="inherit"
          aria-label="Notifications"
          onClick={() => router.push("/profile/notifications")}
        >
          <NotificationBadge>
            <NotificationsIcon />
          </NotificationBadge>
        </IconButton>
        {/**
         * @todo Add a button for the settings menu.
         *
         * @todo Add a button for the page's help menu?
         * A component for the help dialog. And a walkthrough for the page. Video, text, and images?
         */}
        {/* <HelpMenu />
         <SettingsMenu /> */}
        <UserMenu />

        {/**
         * Dropdown for the user.
         */}
      </Toolbar>
      {["left"].map((anchor) => (
        <React.Fragment key={anchor}>
          {/* Desktop with AppShell: persistent sidebar as fixed Box portaled to body */}
          {hasAppShell &&
            appShell.isDesktop &&
            isDrawerOpen &&
            typeof document !== "undefined" &&
            createPortal(
              <Box
                sx={{
                  position: "fixed",
                  top: `${appShell.appBarHeight || 48}px`,
                  left: 0,
                  width: appShell.drawerWidth,
                  height: `calc(100% - ${appShell.appBarHeight || 48}px)`,
                  overflowY: "auto",
                  backdropFilter: "blur(7px)",
                  backgroundColor: "custom.glassNavbar",
                  borderRight: "1px solid",
                  borderColor: "divider",
                  zIndex: (theme) => theme.zIndex.modal + 1,
                }}
                role="presentation"
              >
                {drawerNavContent}
              </Box>,
              document.body,
            )}

          {/* Mobile or without AppShell: SwipeableDrawer */}
          {!(hasAppShell && appShell.isDesktop) && (
            <SwipeableDrawer
              anchor={anchor}
              open={isDrawerOpen}
              onClose={toggleDrawer(anchor, false)}
              onOpen={toggleDrawer(anchor, true)}
              sx={{
                marginTop: "4rem",
                zIndex: (theme) => theme.zIndex.drawer + 3,
              }}
              ModalProps={{
                keepMounted: true,
              }}
              slotProps={{
                backdrop: {
                  sx: {
                    backgroundColor: "transparent",
                    backdropFilter: "blur(4px)",
                  },
                },
              }}
              PaperProps={{
                sx: {
                  backdropFilter: "blur(7px)",
                  backgroundColor: "custom.glassNavbar",
                  backgroundImage: "none",
                  borderRight: "1px solid",
                  borderColor: "divider",
                },
              }}
            >
              <Box
                sx={{
                  marginTop: "4rem",
                  width: 250,
                }}
                role="presentation"
                onClick={toggleDrawer(anchor, false)}
                onKeyDown={toggleDrawer(anchor, false)}
              >
                {drawerNavContent}
              </Box>
            </SwipeableDrawer>
          )}

          {/**
           * Add a modal for adding a user to a section by section code
           */}

          <Dialog
            open={openAddStudentToSection}
            onClose={() => setOpenAddStudentToSection(false)}
            data-tour="join-section-dialog"
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
            <form onSubmit={addStudentToSection}>
              <DialogTitle id="form-dialog-title">
                {tCommon("mainToolbar.addToSection.title")}
              </DialogTitle>
              <DialogContent>
                <DialogContentText>
                  {tCommon("mainToolbar.addToSection.description")}
                </DialogContentText>
                <br />

                <TextField
                  sx={{ width: "100%" }}
                  required
                  id="code"
                  name="code"
                  data-tour="join-code-input"
                  label={tCommon("mainToolbar.addToSection.codeLabel")}
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
                  onClick={() => setOpenAddStudentToSection(false)}
                  color="primary"
                  variant="outlined"
                >
                  {tCommon("actions.cancel")}
                </Button>
                <Button disabled={work} type="submit" variant="contained">
                  {tCommon("mainToolbar.addToSection.add")}
                </Button>
              </DialogActions>
            </form>
          </Dialog>

          {/* Join Study Group Dialog */}
          <JoinPracticeDialog
            open={openJoinStudyGroup}
            onClose={() => setOpenJoinStudyGroup(false)}
            onJoin={(sessionInfo) => {
              setOpenJoinStudyGroup(false);
              // Navigate to units page with join params
              const params = new URLSearchParams({
                joinSession: sessionInfo.sessionId,
                joinRoom: sessionInfo.roomCode,
                joinUnit: sessionInfo.unitID,
              });
              router.push(`/units?${params.toString()}`);
            }}
          />

          {/* Join Workbook Session Dialog */}
          <JoinWorkbookDialog
            open={openJoinWorkbook}
            onClose={() => setOpenJoinWorkbook(false)}
            onJoin={({ unitId }) => {
              setOpenJoinWorkbook(false);
              router.push(`/workbook/${unitId}`);
            }}
          />

          {/* Join Peer Review Dialog */}
          <JoinPeerReviewDialog
            open={openJoinPeerReview}
            onClose={() => setOpenJoinPeerReview(false)}
            onJoin={({ roomId }) => {
              setOpenJoinPeerReview(false);
              router.push(`/review/${roomId}`);
            }}
          />
        </React.Fragment>
      ))}
    </>
  );
}
