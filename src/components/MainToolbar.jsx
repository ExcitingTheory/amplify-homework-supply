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
import Typography from "@mui/material/Typography";
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
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import BatteryUnknownIcon from "@mui/icons-material/BatteryUnknown";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ClassIcon from "@mui/icons-material/Class";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GroupsIcon from "@mui/icons-material/Groups";
import HandshakeIcon from "@mui/icons-material/Handshake";
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
import { trackEvent, AnalyticsEvents } from "../utils/analytics";
import { getOwnerIdentifiers, partitionByAccess } from "../utils/ownership";
import { useColorMode } from "../hooks/useColorMode";
import { LevelBadge } from "./Gamification/LevelBadge";
import { AvatarDisplay } from "./Gamification/AvatarDisplay";
import { StreakIndicator } from "./Gamification/StreakIndicator";
import { StreakShield } from "./Gamification/StreakShield";
import { useAvatarConfig } from "../hooks/useAvatarConfig";
import SyncStatusIndicator from "./SyncStatusIndicator";
import { useXP, useProgress, useSquad } from "../context/gamificationContext";
import { useNotifications } from "../context/notificationContext";
import AuthContext from "../context/authContext";
import { SEMANTIC_THEME } from "../themes/semanticTheme";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import TuneIcon from "@mui/icons-material/Tune";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SchoolIcon from "@mui/icons-material/School";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import FlagIcon from "@mui/icons-material/Flag";
import InsightsIcon from "@mui/icons-material/Insights";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import SpellcheckIcon from "@mui/icons-material/Spellcheck";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import QuizIcon from "@mui/icons-material/Quiz";
import HistoryIcon from "@mui/icons-material/History";
import { Link } from "../i18n/navigation";
import CollaborationDialog from "./CollaborationDialog";
import NotificationBadge from "./NotificationBadge";
import NotificationsIcon from "@mui/icons-material/Notifications";
import GlobalSearchBar from "./GlobalSearchBar";

// Uncategorized (total-count) notification badges read as black so they stay
// visually distinct from the red category badges used on nav items.
const blackNotificationBadgeSx = {
  "& .MuiBadge-badge": { bgcolor: "common.black", color: "common.white" },
};

const DRAWER_ANCHORS = ["left"];

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
        // eslint-disable-next-line i18next/no-literal-string -- ARIA id reference
        aria-controls={open ? "settings-menu" : undefined}
        // eslint-disable-next-line i18next/no-literal-string -- ARIA boolean value
        aria-haspopup="true"
        // eslint-disable-next-line i18next/no-literal-string -- ARIA boolean value
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
          label={t("mainToolbar.settings.disableNotifications")}
        />
        <MenuItem>
          <ListItemText primary={t("mainToolbar.settings.colorMode")} />
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
          label={t("mainToolbar.settings.experimentalFeatures")}
        />
        <ToggleMenuItem label={t("mainToolbar.settings.studentMode")} />

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
        // eslint-disable-next-line i18next/no-literal-string -- ARIA id reference
        aria-controls={open ? "help-menu" : undefined}
        // eslint-disable-next-line i18next/no-literal-string -- ARIA boolean value
        aria-haspopup="true"
        // eslint-disable-next-line i18next/no-literal-string -- ARIA boolean value
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
        <MenuItem onClick={handleHelp}>{t("mainToolbar.help")}</MenuItem>
      </Menu>
    </div>
  );
}

// Highest-privilege group first; the first match is the role shown to the user.
const ROLE_PRIORITY = [
  ["Admins", "roleAdmin"],
  ["Moderators", "roleModerator"],
  ["Instructors", "roleInstructor"],
  ["Learners", "roleLearner"],
];

export function UserMenu({ onJoinSection }) {
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const { level, totalXP } = useXP();
  const { streak } = useProgress();
  const { mySquad } = useSquad();
  const { openPanel } = useNotifications();
  const { user, session: authSession } = React.useContext(AuthContext);
  const attributes = user?.attributes;
  const fullName = [attributes?.given_name, attributes?.family_name]
    .filter(Boolean)
    .join(" ");
  const menuDisplayName =
    attributes?.preferred_username ||
    fullName ||
    attributes?.name ||
    attributes?.email?.split("@")[0] ||
    tCommon("navigation.profile");
  const roleKey = ROLE_PRIORITY.find(([group]) =>
    (authSession?.groups || []).includes(group),
  )?.[1];
  const currentStreak = streak?.currentStreak || 0;
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
            outline
            sheen
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
          // A disabled item keeps the header out of keyboard focus and menu
          // typeahead; the opacity override keeps it fully legible.
          <MenuItem
            key="summary"
            disabled
            sx={{
              display: "block",
              minWidth: 260,
              whiteSpace: "normal",
              "&.Mui-disabled": { opacity: 1 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {avatarSeed && isLoaded ? (
                <AvatarDisplay
                  seed={avatarSeed}
                  size={40}
                  style={avatarStyle}
                  overrides={avatarOverrides}
                  glowRing={glowRing}
                  outline
                  sheen
                  guildCrestSvg={mySquad?.crestSvg ?? null}
                  guildName={mySquad?.name}
                  guildId={mySquad?.id}
                />
              ) : (
                <ProfileIcon sx={{ fontSize: 40 }} />
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  {menuDisplayName}
                </Typography>
                {roleKey && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={tCommon(`userMenu.${roleKey}`)}
                  />
                )}
              </Box>
            </Box>
            <Box sx={{ mt: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {tCommon("userMenu.level", {
                    level: level.level,
                    label: level.label,
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {tCommon("userMenu.totalXP", {
                    xp: totalXP.toLocaleString(),
                  })}
                </Typography>
              </Box>
              {level.xpForNextLevel !== null && (
                <LinearProgress
                  variant="determinate"
                  value={level.progress}
                  aria-label={tCommon("userMenu.levelProgress")}
                  sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                />
              )}
              {currentStreak > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  {tCommon("userMenu.streakDays", { count: currentStreak })}
                </Typography>
              )}
            </Box>
          </MenuItem>,
          <Divider key="summary-divider" />,
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
            key="xp-history"
            component={Link}
            href="/xp-history"
            onClick={handleClose}
          >
            <HistoryIcon />
            &nbsp;{tCommon("navigation.xpHistory")}
          </MenuItem>,
          <MenuItem
            key="join-section"
            data-tour="join-section-button"
            onClick={() => {
              onJoinSection?.();
              handleClose();
            }}
          >
            <PersonAddIcon />
            &nbsp;{tCommon("mainToolbar.addToSection.title")}
          </MenuItem>,
          <MenuItem
            key="notifications"
            onClick={() => {
              openPanel();
              handleClose();
            }}
          >
            <NotificationBadge sx={blackNotificationBadgeSx}>
              <NotificationsIcon />
            </NotificationBadge>
            &nbsp;{tCommon("navigation.notifications")}
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
            onClick={async () => {
              handleClose();
              try {
                await signOut();
              } finally {
                // The signed-out page re-stores its own path as returnUrl, which
                // would send the next user (e.g. an instructor after an admin)
                // back to it. Drop it and reload "/" so the next login is
                // routed by role.
                sessionStorage.removeItem("returnUrl");
                window.location.assign("/");
              }
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
  const t = useTranslations("common");
  const tComponents = useTranslations("components");
  const tEditorAuth = useTranslations("editor.authoring");
  const { level, sectionLevel } = useXP();
  const { streak } = useProgress();
  const { mySquad } = useSquad();
  const { openPanel } = useNotifications();
  const { session: authSession, user } = React.useContext(AuthContext);
  const {
    style: avatarStyle,
    overrides: avatarOverrides,
    isLoaded: isAvatarLoaded,
    glowRing,
  } = useAvatarConfig();
  const avatarSeed = user?.attributes?.sub || "";
  const displayName =
    user?.attributes?.name ||
    user?.attributes?.email?.split("@")[0] ||
    t("navigation.profile");
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
  const appBarOffset = hasAppShell ? appShell.appBarHeight || 48 : 64;

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

  // Drag handle for the desktop nav rail: drag right -> full, middle -> icon
  // rail, far left -> hidden (mobile-style temporary overlay). Snaps by pointer X.
  const RAIL_SNAP_X = 160;
  const HIDE_SNAP_X = 24;
  const navDraggingRef = React.useRef(false);

  // Snap the nav to hidden / rail / full based on the pointer's X position.
  const applyNavSnap = React.useCallback(
    (x) => {
      if (x < HIDE_SNAP_X) {
        appShell.setHidden?.(true);
        setDrawerOpen(false);
      } else if (x < RAIL_SNAP_X) {
        appShell.setHidden?.(false);
        appShell.setCollapsed?.(true);
        setDrawerOpen(true);
      } else {
        appShell.setHidden?.(false);
        appShell.setCollapsed?.(false);
        setDrawerOpen(true);
      }
    },
    [appShell, setDrawerOpen],
  );

  // Keep the latest snap handler in a ref so window listeners attached at drag
  // start always see current state setters without re-binding.
  const applyNavSnapRef = React.useRef(applyNavSnap);
  React.useEffect(() => {
    applyNavSnapRef.current = applyNavSnap;
  }, [applyNavSnap]);

  // Use document-level listeners rather than pointer capture: the handle lives
  // in a portal whose position and mount condition change mid-drag, which drops
  // pointer capture. Window listeners keep the drag alive and let us suppress
  // text selection for the duration.
  const handleNavHandleDown = React.useCallback(
    (e) => {
      if (!hasAppShell || !appShell.isDesktop) return;
      if (typeof document === "undefined") return;
      e.preventDefault();
      navDraggingRef.current = true;

      const prevUserSelect = document.body.style.userSelect;
      const prevCursor = document.body.style.cursor;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";

      const onMove = (ev) => {
        if (!navDraggingRef.current) return;
        applyNavSnapRef.current(ev.clientX);
      };
      const onUp = () => {
        navDraggingRef.current = false;
        document.body.style.userSelect = prevUserSelect;
        document.body.style.cursor = prevCursor;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [hasAppShell, appShell.isDesktop],
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
  const hasSectionParam = Boolean(currentSearchParams.get("sectionId"));
  const usesContextualToolbarSearch =
    currentPathname?.includes("/workbook/") ||
    currentPathname?.includes("/unit/");

  const [work, setIsWorking] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  const [openAddStudentToSection, setOpenAddStudentToSection] =
    React.useState(false);
  const [openCollaboration, setOpenCollaboration] = React.useState(false);

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
    isInstructorOrAdmin,
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
      alert(t("mainToolbar.debugModeEnabled"));
    }
  }, [t]);

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
      trackEvent(AnalyticsEvents.ENGAGED_TIME_UPDATE, {
        action: "join_section",
        ...(joinedSectionId && { sectionId: joinedSectionId }),
      });
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

  // Published/draft groups only hold records the user owns. Other records are
  // "Attending" when a learner group grants access, otherwise "Administering".
  const ownerIds = React.useMemo(
    () => getOwnerIdentifiers(authSession),
    [authSession],
  );
  const userGroupNames = authSession?.groups || [];
  const sectionPartition = partitionByAccess(
    navSections.filter((s) => s.status !== "ARCHIVED"),
    ownerIds,
    userGroupNames,
  );
  const attendedSectionIds = new Set(
    sectionPartition.attending.map((s) => s.id),
  );

  // Assignments for the open section, shown only for sections the user attends
  const [attendedAssignments, setAttendedAssignments] = React.useState({});
  const currentAttendedSectionId =
    currentSectionId && attendedSectionIds.has(currentSectionId)
      ? currentSectionId
      : null;
  const learnerSub = authSession?.idToken?.payload?.sub;

  React.useEffect(() => {
    if (!currentAttendedSectionId || !learnerSub) return;
    if (attendedAssignments[currentAttendedSectionId]) return;
    let cancelled = false;
    const client = getAmplifyClient();

    async function fetchAssignments() {
      try {
        const { data } = await client.models.Assignment.list({
          filter: { sectionID: { eq: currentAttendedSectionId } },
          limit: 200,
        });
        const mine = (data || []).filter(
          (a) =>
            a != null &&
            a.deletedAt == null &&
            a.status !== "DRAFT" &&
            a.lateStatus !== "DROPPED" &&
            (!a.studentID || a.studentID === learnerSub),
        );
        const unitIds = [...new Set(mine.map((a) => a.unitID))];
        const units = await Promise.all(
          unitIds.map((id) =>
            client.models.Unit.get({ id }).then((res) => res.data),
          ),
        );
        const unitNames = new Map(
          units.filter(Boolean).map((u) => [u.id, u.name]),
        );
        if (cancelled) return;
        const items = mine
          .filter((a) => unitNames.has(a.unitID))
          .map((a) => ({
            id: a.id,
            unitID: a.unitID,
            name: unitNames.get(a.unitID),
          }));
        setAttendedAssignments((prev) => ({
          ...prev,
          [currentAttendedSectionId]: items,
        }));
      } catch (err) {
        console.warn("[MainToolbar] Failed to fetch assignments:", err);
      }
    }

    fetchAssignments();
    return () => {
      cancelled = true;
    };
  }, [currentAttendedSectionId, learnerSub, attendedAssignments]);

  const [sectionGroupsExpanded, setSectionGroupsExpanded] = React.useState({
    published: true,
    drafts: true,
    attending: true,
    administering: true,
  });
  const [unitGroupsExpanded, setUnitGroupsExpanded] = React.useState({
    published: true,
    drafts: false,
    attending: false,
    administering: false,
  });

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

  const renderNavSection = (section) => {
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
          sectionHeadings
            .filter((heading) => {
              if (!isInstructorOrAdmin) {
                return heading.id !== "nav-section-students";
              }
              return true;
            })
            .map((heading) => (
              <ListItem key={heading.id} disablePadding>
                <ListItemButton
                  sx={{ pl: 6 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Section detail content is now tabbed — ask the
                    // page to switch to the right tab before scrolling.
                    window.dispatchEvent(
                      new CustomEvent("section-detail-nav", {
                        detail: { headingId: heading.id },
                      }),
                    );
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
        {isCurrent &&
          attendedAssignments[section.id]?.map((assignment) => (
            <ListItem key={assignment.id} disablePadding>
              <ListItemButton
                component="a"
                href={`/workbook/${assignment.unitID}`}
                sx={{ pl: 7 }}
              >
                <ListItemText
                  primary={assignment.name}
                  primaryTypographyProps={{
                    variant: "caption",
                    noWrap: true,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
      </React.Fragment>
    );
  };

  const renderNavUnit = (unit, italic = false) => {
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
              fontStyle: italic ? "italic" : undefined,
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
  };

  const buildNavGroups = ({
    owned,
    attending,
    administering,
    expandedState,
    setExpanded,
  }) =>
    [
      {
        key: "published",
        label: t("navigation.published"),
        Icon: PublishIcon,
        items: owned.filter((item) => item.status === "PUBLISHED"),
      },
      {
        key: "drafts",
        label: t("navigation.drafts"),
        Icon: DraftsIcon,
        italic: true,
        items: owned.filter((item) => item.status !== "PUBLISHED"),
      },
      {
        key: "attending",
        label: t("navigation.attending"),
        Icon: GroupsIcon,
        items: attending,
      },
      {
        key: "administering",
        label: t("navigation.administering"),
        Icon: SupervisorAccountIcon,
        items: administering,
      },
    ].map((group) => ({
      ...group,
      expanded: expandedState[group.key],
      onToggle: () =>
        setExpanded((prev) => ({ ...prev, [group.key]: !prev[group.key] })),
    }));

  const sectionNavGroups = buildNavGroups({
    ...sectionPartition,
    expandedState: sectionGroupsExpanded,
    setExpanded: setSectionGroupsExpanded,
  }).map((group) => ({
    ...group,
    groupId: `section-${group.key}`,
    renderItem: renderNavSection,
  }));

  const unitNavGroups = buildNavGroups({
    ...partitionByAccess(navUnits, ownerIds, userGroupNames),
    // Units reached as a learner appear as assignments under their section.
    attending: [],
    expandedState: unitGroupsExpanded,
    setExpanded: setUnitGroupsExpanded,
  }).map((group) => ({
    ...group,
    groupId: `unit-${group.key}`,
    renderItem: (unit) => renderNavUnit(unit, group.italic),
  }));

  const renderNavGroup = ({
    groupId,
    label,
    Icon,
    items,
    expanded,
    onToggle,
    renderItem,
  }) => {
    if (items.length === 0) return null;
    return (
      <React.Fragment key={groupId}>
        <ListItemButton onClick={onToggle} sx={{ pl: 4, py: 0.25 }}>
          <ListItemIcon sx={{ minWidth: 24 }}>
            <Icon sx={{ fontSize: 14, color: "text.secondary" }} />
          </ListItemIcon>
          <ListItemText
            primary={label}
            primaryTypographyProps={{
              fontSize: "0.7rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "text.secondary",
            }}
          />
          {expanded ? (
            <ExpandLess sx={{ fontSize: 16 }} />
          ) : (
            <ExpandMore sx={{ fontSize: 16 }} />
          )}
        </ListItemButton>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {items.map(renderItem)}
        </Collapse>
      </React.Fragment>
    );
  };

  // Extracted drawer navigation content - shared between persistent and temporary drawers
  const drawerNavContent = (
    <>
      <List sx={{ color: "text.primary" }}>
        <ListItem disablePadding>
          <ListItemButton component="a" href="/">
            <ListItemIcon sx={{ color: "text.primary" }}>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary={t("navigation.home")} />
          </ListItemButton>
        </ListItem>

        {/* Sections — expandable nav with sub-items */}
        <ListItem disablePadding sx={{ gap: 0 }}>
          <ListItemButton
            component="a"
            href="/sections"
            sx={{ flex: 1, minWidth: 0 }}
          >
            <ListItemIcon sx={{ color: "text.primary" }}>
              <NotificationBadge category="ASSIGNMENT">
                <ClassIcon />
              </NotificationBadge>
            </ListItemIcon>
            <ListItemText
              primary={t("navigation.sections")}
              primaryTypographyProps={{ noWrap: true }}
            />
          </ListItemButton>
          <IconButton
            edge="end"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setSectionsExpanded(!sectionsExpanded);
            }}
            sx={{ color: "text.primary", flexShrink: 0, mr: 0.5 }}
            aria-label={
              sectionsExpanded ? "collapse sections" : "expand sections"
            }
          >
            {sectionsExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </ListItem>
        <Collapse
          in={sectionsExpanded}
          timeout="auto"
          unmountOnExit
          onClick={(e) => e.stopPropagation()}
        >
          <List component="div" disablePadding>
            {sectionNavGroups.map(renderNavGroup)}
          </List>
        </Collapse>

        {/* Units — expandable nav with published/draft grouping (instructors only) */}
        {isInstructorOrAdmin && (
          <ListItem disablePadding sx={{ gap: 0 }}>
            <ListItemButton
              component="a"
              href="/units"
              sx={{ flex: 1, minWidth: 0 }}
            >
              <ListItemIcon sx={{ color: "text.primary" }}>
                <MenuBookIcon />
              </ListItemIcon>
              <ListItemText
                primary={t("navigation.units")}
                primaryTypographyProps={{ noWrap: true }}
              />
            </ListItemButton>
            <IconButton
              edge="end"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setUnitsExpanded(!unitsExpanded);
              }}
              sx={{ color: "text.primary", flexShrink: 0, mr: 0.5 }}
              aria-label={unitsExpanded ? "collapse units" : "expand units"}
            >
              {unitsExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
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
              {unitNavGroups.map(renderNavGroup)}
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
            <ListItemText primary={t("navigation.leaderboard")} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component="a" href="/squads">
            <ListItemIcon sx={{ color: "text.primary" }}>
              <NotificationBadge category="SQUAD">
                <GroupsIcon />
              </NotificationBadge>
            </ListItemIcon>
            <ListItemText primary={t("navigation.squads")} />
          </ListItemButton>
        </ListItem>
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <ListItemButton component="a" href="/instructor">
              <ListItemIcon sx={{ color: "text.primary" }}>
                <SchoolIcon />
              </ListItemIcon>
              <ListItemText
                primary={t("mainToolbar.nav.instructorDashboard")}
              />
            </ListItemButton>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <ListItemButton component="a" href="/admin">
              <ListItemIcon sx={{ color: "text.primary" }}>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary={t("mainToolbar.nav.adminDashboard")} />
            </ListItemButton>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <ListItemButton component="a" href="/admin/moderation">
              <ListItemIcon sx={{ color: "text.primary" }}>
                <FlagIcon />
              </ListItemIcon>
              <ListItemText primary={t("mainToolbar.nav.moderation")} />
            </ListItemButton>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <ListItemButton component="a" href="/admin/analytics">
              <ListItemIcon sx={{ color: "text.primary" }}>
                <InsightsIcon />
              </ListItemIcon>
              <ListItemText primary={t("mainToolbar.nav.analytics")} />
            </ListItemButton>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <ListItemButton component="a" href="/admin/words">
              <ListItemIcon sx={{ color: "text.primary" }}>
                <SpellcheckIcon />
              </ListItemIcon>
              <ListItemText primary={t("mainToolbar.nav.words")} />
            </ListItemButton>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <ListItemButton component="a" href="/admin/files">
              <ListItemIcon sx={{ color: "text.primary" }}>
                <InsertDriveFileIcon />
              </ListItemIcon>
              <ListItemText primary={t("mainToolbar.nav.files")} />
            </ListItemButton>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <ListItemButton component="a" href="/admin/questions">
              <ListItemIcon sx={{ color: "text.primary" }}>
                <QuizIcon />
              </ListItemIcon>
              <ListItemText primary={t("mainToolbar.nav.questions")} />
            </ListItemButton>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <ListItemButton component="a" href="/admin/archives">
              <ListItemIcon sx={{ color: "text.primary" }}>
                <Inventory2Icon />
              </ListItemIcon>
              <ListItemText primary={t("mainToolbar.nav.archives")} />
            </ListItemButton>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <ListItemButton component="a" href="/admin/settings">
              <ListItemIcon sx={{ color: "text.primary" }}>
                <TuneIcon />
              </ListItemIcon>
              <ListItemText primary={t("navigation.gamification")} />
            </ListItemButton>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <ListItemButton component="a" href="/recycle-bin">
              <ListItemIcon sx={{ color: "text.primary" }}>
                <DeleteOutlineIcon />
              </ListItemIcon>
              <ListItemText primary={t("mainToolbar.nav.recycleBin")} />
            </ListItemButton>
          </ListItem>
        )}
      </List>
      <Divider />
      <List sx={{ color: "text.primary" }}>
        <ListItem disablePadding sx={{ display: { xs: "block", md: "none" } }}>
          <ListItemButton component="a" href="/profile">
            <ListItemIcon sx={{ color: "text.primary" }}>
              <UserIcon />
            </ListItemIcon>
            <ListItemText primary={t("navigation.profile")} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ display: { xs: "block", md: "none" } }}>
          <ListItemButton
            onClick={() => {
              openPanel();
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon sx={{ color: "text.primary" }}>
              <NotificationBadge sx={blackNotificationBadgeSx}>
                <NotificationsIcon />
              </NotificationBadge>
            </ListItemIcon>
            <ListItemText primary={t("navigation.notifications")} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ display: { xs: "block", md: "none" } }}>
          <ListItemButton
            onClick={(e) => {
              e.stopPropagation();
              setOpenAddStudentToSection(true);
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon sx={{ color: "text.primary" }}>
              <NotificationBadge category="ASSIGNMENT">
                <PersonAddIcon />
              </NotificationBadge>
            </ListItemIcon>
            <ListItemText primary={t("mainToolbar.addToSection.title")} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ display: { xs: "block", md: "none" } }}>
          <ListItemButton component="a" href="/settings">
            <ListItemIcon sx={{ color: "text.primary" }}>
              <SettingsBrightnessIcon />
            </ListItemIcon>
            <ListItemText primary={t("navigation.settings")} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={(e) => {
              e.stopPropagation();
              setOpenCollaboration(true);
            }}
          >
            <ListItemIcon sx={{ color: "text.primary" }}>
              <HandshakeIcon />
            </ListItemIcon>
            <ListItemText
              primary={t("navigation.collaboration")}
              secondary={t("navigation.collaborationDesc")}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  // Avatar + gamification pills, pinned to the bottom of the drawer/slideout
  // — shown whenever the topbar's own pill row is hidden (below the md
  // breakpoint), so they aren't lost, just relocated.
  const mobileGamificationFooter = (
    <Box
      sx={{
        display: { xs: "flex", md: "none" },
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1.5,
        flexShrink: 0,
        borderTop: "1px solid",
        borderColor: "divider",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Box
        component="a"
        href="/profile"
        onClick={() => setDrawerOpen(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          width: "100%",
          minWidth: 0,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        {avatarSeed && isAvatarLoaded ? (
          <AvatarDisplay
            seed={avatarSeed}
            size={32}
            style={avatarStyle}
            overrides={avatarOverrides}
            glowRing={glowRing}
            outline
            sheen
            guildCrestSvg={mySquad?.crestSvg ?? null}
            guildName={mySquad?.name}
            guildId={mySquad?.id}
          />
        ) : (
          <ProfileIcon />
        )}
        <Typography variant="body2" fontWeight={600} noWrap>
          {displayName}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <StreakIndicator
          currentStreak={streak?.currentStreak || 0}
          pill
          showEmpty={!isInstructorOrAdmin}
        />
        <StreakShield
          freezesRemaining={streak?.freezesRemaining || 0}
          freezesUsed={streak?.freezesUsed || 0}
          pill
          showEmpty={!isInstructorOrAdmin}
        />
        <LevelBadge
          level={hasSectionParam ? sectionLevel : level}
          showProgress={false}
        />
        <IconButton
          color="inherit"
          aria-label={t("navigation.notifications")}
          size="small"
          onClick={() => openPanel()}
        >
          <NotificationBadge sx={blackNotificationBadgeSx}>
            <NotificationsIcon />
          </NotificationBadge>
        </IconButton>
      </Box>
    </Box>
  );

  // Collapsed icon-only rail — shows tooltips ("popup names") on hover.
  const railItemSx = {
    justifyContent: "center",
    px: 0,
    minHeight: 48,
    "& .MuiListItemIcon-root": { minWidth: 0, justifyContent: "center" },
  };
  const railNavContent = (
    <>
      <List sx={{ color: "text.primary" }}>
        <ListItem disablePadding>
          <Tooltip title={t("navigation.home")} placement="right" arrow>
            <ListItemButton component="a" href="/" sx={railItemSx}>
              <ListItemIcon sx={{ color: "text.primary" }}>
                <HomeIcon />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        </ListItem>
        <ListItem disablePadding>
          <Tooltip title={t("navigation.sections")} placement="right" arrow>
            <ListItemButton component="a" href="/sections" sx={railItemSx}>
              <ListItemIcon sx={{ color: "text.primary" }}>
                <NotificationBadge category="ASSIGNMENT">
                  <ClassIcon />
                </NotificationBadge>
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        </ListItem>
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <Tooltip title={t("navigation.units")} placement="right" arrow>
              <ListItemButton component="a" href="/units" sx={railItemSx}>
                <ListItemIcon sx={{ color: "text.primary" }}>
                  <MenuBookIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        )}
        <ListItem disablePadding>
          <Tooltip title={t("navigation.leaderboard")} placement="right" arrow>
            <ListItemButton component="a" href="/leaderboard" sx={railItemSx}>
              <ListItemIcon sx={{ color: "text.primary" }}>
                <NotificationBadge category="GAMIFICATION">
                  <LeaderboardIcon />
                </NotificationBadge>
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        </ListItem>
        <ListItem disablePadding>
          <Tooltip title={t("navigation.squads")} placement="right" arrow>
            <ListItemButton component="a" href="/squads" sx={railItemSx}>
              <ListItemIcon sx={{ color: "text.primary" }}>
                <NotificationBadge category="SQUAD">
                  <GroupsIcon />
                </NotificationBadge>
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        </ListItem>
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <Tooltip
              title={t("mainToolbar.nav.instructorDashboard")}
              placement="right"
              arrow
            >
              <ListItemButton component="a" href="/instructor" sx={railItemSx}>
                <ListItemIcon sx={{ color: "text.primary" }}>
                  <SchoolIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <Tooltip
              title={t("mainToolbar.nav.adminDashboard")}
              placement="right"
              arrow
            >
              <ListItemButton component="a" href="/admin" sx={railItemSx}>
                <ListItemIcon sx={{ color: "text.primary" }}>
                  <DashboardIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <Tooltip
              title={t("mainToolbar.nav.moderation")}
              placement="right"
              arrow
            >
              <ListItemButton
                component="a"
                href="/admin/moderation"
                sx={railItemSx}
              >
                <ListItemIcon sx={{ color: "text.primary" }}>
                  <FlagIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <Tooltip
              title={t("mainToolbar.nav.analytics")}
              placement="right"
              arrow
            >
              <ListItemButton
                component="a"
                href="/admin/analytics"
                sx={railItemSx}
              >
                <ListItemIcon sx={{ color: "text.primary" }}>
                  <InsightsIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <Tooltip title={t("mainToolbar.nav.words")} placement="right" arrow>
              <ListItemButton component="a" href="/admin/words" sx={railItemSx}>
                <ListItemIcon sx={{ color: "text.primary" }}>
                  <SpellcheckIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <Tooltip title={t("mainToolbar.nav.files")} placement="right" arrow>
              <ListItemButton component="a" href="/admin/files" sx={railItemSx}>
                <ListItemIcon sx={{ color: "text.primary" }}>
                  <InsertDriveFileIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <Tooltip
              title={t("mainToolbar.nav.questions")}
              placement="right"
              arrow
            >
              <ListItemButton
                component="a"
                href="/admin/questions"
                sx={railItemSx}
              >
                <ListItemIcon sx={{ color: "text.primary" }}>
                  <QuizIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <Tooltip
              title={t("mainToolbar.nav.archives")}
              placement="right"
              arrow
            >
              <ListItemButton
                component="a"
                href="/admin/archives"
                sx={railItemSx}
              >
                <ListItemIcon sx={{ color: "text.primary" }}>
                  <Inventory2Icon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <Tooltip
              title={t("navigation.gamification")}
              placement="right"
              arrow
            >
              <ListItemButton
                component="a"
                href="/admin/settings"
                sx={railItemSx}
              >
                <ListItemIcon sx={{ color: "text.primary" }}>
                  <TuneIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        )}
        {isInstructorOrAdmin && (
          <ListItem disablePadding>
            <Tooltip
              title={t("mainToolbar.nav.recycleBin")}
              placement="right"
              arrow
            >
              <ListItemButton component="a" href="/recycle-bin" sx={railItemSx}>
                <ListItemIcon sx={{ color: "text.primary" }}>
                  <DeleteOutlineIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        )}
      </List>
      <Divider />
      <List sx={{ color: "text.primary" }}>
        <ListItem disablePadding>
          <Tooltip
            title={t("navigation.collaboration")}
            placement="right"
            arrow
          >
            <ListItemButton
              sx={railItemSx}
              onClick={(e) => {
                e.stopPropagation();
                setOpenCollaboration(true);
              }}
            >
              <ListItemIcon sx={{ color: "text.primary" }}>
                <HandshakeIcon />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
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
          // Storybook forces MuiModal disablePortal (.storybook/preview.jsx),
          // so the nav drawer below renders inline as this Toolbar's sibling
          // instead of escaping to document.body. A transparent Toolbar here
          // would only keep its own text/icons above the drawer while
          // showing the drawer through its background, so repaint the
          // AppBar's own glass background here too. No-op in production,
          // where the drawer portals to body and compares against the
          // AppBar instead.
          position: "relative",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "custom.glassNavbar",
          backdropFilter: SEMANTIC_THEME.surface.appBarBlur,
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
        {!usesContextualToolbarSearch && <GlobalSearchBar />}
        {/* </Typography> */}
        <Box sx={{ flexGrow: 1 }} />
        <Box
          sx={{
            display: { xs: "none", md: "contents" },
            "& > .MuiChip-root": { mx: 0.5 },
          }}
        >
          <SyncStatusIndicator />
          <StreakIndicator
            currentStreak={streak?.currentStreak || 0}
            pill
            showEmpty={!isInstructorOrAdmin}
          />
          <StreakShield
            freezesRemaining={streak?.freezesRemaining || 0}
            freezesUsed={streak?.freezesUsed || 0}
            pill
            showEmpty={!isInstructorOrAdmin}
          />
          <LevelBadge
            level={hasSectionParam ? sectionLevel : level}
            showProgress={false}
          />
        </Box>
        <IconButton
          color="inherit"
          aria-label={t("navigation.notifications")}
          data-tour="notification-bell"
          onClick={() => openPanel()}
          sx={{ display: { xs: "none", md: "inline-flex" } }}
        >
          <NotificationBadge sx={blackNotificationBadgeSx}>
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
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <UserMenu onJoinSection={() => setOpenAddStudentToSection(true)} />
        </Box>

        {/**
         * Dropdown for the user.
         */}
      </Toolbar>
      {DRAWER_ANCHORS.map((anchor) => (
        <React.Fragment key={anchor}>
          {/* Desktop with AppShell: persistent sidebar as fixed Box portaled to body */}
          {hasAppShell &&
            appShell.isDesktop &&
            !appShell.hidden &&
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
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  backdropFilter: SEMANTIC_THEME.surface.appBarBlur,
                  WebkitBackdropFilter: SEMANTIC_THEME.surface.appBarBlur,
                  backgroundColor: "custom.glassNavbar",
                  borderRight: "1px solid",
                  borderColor: "divider",
                  // Below the AppBar, and below theme.zIndex.modal so real dialogs win.
                  zIndex: (theme) => theme.zIndex.drawer,
                  transition: (theme) =>
                    theme.transitions.create("width", {
                      easing: theme.transitions.easing.sharp,
                      duration: theme.transitions.duration.enteringScreen,
                    }),
                }}
                role="presentation"
              >
                <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
                  {appShell.collapsed ? railNavContent : drawerNavContent}
                </Box>
                {!appShell.collapsed && mobileGamificationFooter}
              </Box>,
              document.body,
            )}

          {/* Desktop drag handle: right = full, middle = icon rail, far left = mobile mode.
              Always rendered on desktop so the nav can always be grabbed and restored,
              including from the hidden state (where it sits at the screen's left edge). */}
          {hasAppShell &&
            appShell.isDesktop &&
            typeof document !== "undefined" &&
            createPortal(
              <Box
                role="separator"
                // eslint-disable-next-line i18next/no-literal-string -- ARIA orientation value
                aria-orientation="vertical"
                tabIndex={0}
                aria-label={
                  appShell.hidden
                    ? t("mainToolbar.nav.showNavigation")
                    : appShell.collapsed
                      ? t("mainToolbar.nav.expandNavigation")
                      : t("mainToolbar.nav.collapseNavigation")
                }
                onPointerDown={handleNavHandleDown}
                onDoubleClick={() => {
                  if (appShell.hidden) {
                    appShell.setHidden?.(false);
                    setDrawerOpen(true);
                  } else {
                    appShell.setCollapsed?.(!appShell.collapsed);
                  }
                }}
                sx={{
                  position: "fixed",
                  top: `${appShell.appBarHeight || 48}px`,
                  // Track the *visible* nav width so toggling the drawer (e.g. the
                  // hamburger) moves the handle to the edge instead of stranding it.
                  // Offset by half the hit-area width so the grip stays centered on the edge.
                  left: `${Math.max(0, (isDrawerOpen ? appShell.drawerWidth : 0) - 12)}px`,
                  width: 24,
                  height: `calc(100% - ${appShell.appBarHeight || 48}px)`,
                  cursor: "col-resize",
                  touchAction: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  // Above the drawer itself, still below the AppBar and theme.zIndex.modal.
                  zIndex: (theme) => theme.zIndex.drawer + 1,
                  transition: (theme) =>
                    theme.transitions.create("left", {
                      easing: theme.transitions.easing.sharp,
                      duration: theme.transitions.duration.enteringScreen,
                    }),
                  "&:hover .nav-drag-grip, &:focus-visible .nav-drag-grip": {
                    opacity: 1,
                    width: 6,
                    backgroundColor: "primary.main",
                  },
                }}
              >
                <Box
                  className="nav-drag-grip"
                  sx={(theme) => ({
                    width: 3,
                    height: "100%",
                    borderRadius: 0,
                    backgroundColor: SEMANTIC_THEME.surface.lightDragHandle,
                    ...theme.applyStyles("dark", {
                      backgroundColor: SEMANTIC_THEME.surface.darkDragHandle,
                    }),
                    // Subtle at rest so it hides into the layout; pops out
                    // wider and fully opaque once the pointer is near enough
                    // to grab it (hover covers the full 24px hit zone).
                    opacity: 0.35,
                    transition:
                      "opacity 0.2s ease, background-color 0.2s ease, width 0.2s ease",
                  })}
                />
              </Box>,
              document.body,
            )}

          {/* Mobile, no AppShell, or desktop "hidden" mode: SwipeableDrawer */}
          {(!(hasAppShell && appShell.isDesktop) || appShell.hidden) && (
            <SwipeableDrawer
              data-tour="nav-drawer"
              anchor={anchor}
              open={isDrawerOpen}
              onClose={toggleDrawer(anchor, false)}
              onOpen={toggleDrawer(anchor, true)}
              sx={{
                // Below the AppBar, and below theme.zIndex.modal so real dialogs win.
                zIndex: (theme) => theme.zIndex.drawer,
              }}
              ModalProps={{
                keepMounted: true,
              }}
              slotProps={{
                backdrop: {
                  sx: (theme) => ({
                    top: 0,
                    bottom: 0,
                    height: "100dvh",
                    backgroundColor: SEMANTIC_THEME.surface.lightDrawerBackdrop,
                    ...theme.applyStyles("dark", {
                      backgroundColor:
                        SEMANTIC_THEME.surface.darkDrawerBackdrop,
                    }),
                    backdropFilter: `${SEMANTIC_THEME.surface.overlayBlur} saturate(1.15)`,
                    WebkitBackdropFilter: `${SEMANTIC_THEME.surface.overlayBlur} saturate(1.15)`,
                  }),
                },
              }}
              PaperProps={{
                sx: (theme) => ({
                  top: 0,
                  height: "100dvh",
                  maxHeight: "100dvh",
                  overflow: "hidden",
                  backdropFilter: SEMANTIC_THEME.surface.overlayBlur,
                  WebkitBackdropFilter: SEMANTIC_THEME.surface.overlayBlur,
                  backgroundColor: SEMANTIC_THEME.surface.lightDrawer,
                  ...theme.applyStyles("dark", {
                    backgroundColor: SEMANTIC_THEME.surface.darkDrawer,
                  }),
                  backgroundImage: "none",
                  borderRight: "1px solid",
                  borderColor: "divider",
                }),
              }}
            >
              <Box
                sx={{
                  width: 250,
                  height: "100%",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
                role="presentation"
                onClick={toggleDrawer(anchor, false)}
                onKeyDown={toggleDrawer(anchor, false)}
              >
                <Box
                  sx={{
                    height: `${appBarOffset}px`,
                    display: "flex",
                    alignItems: "center",
                    px: 1,
                    boxSizing: "border-box",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <IconButton
                    edge="start"
                    color="inherit"
                    aria-label={tEditorAuth("mainToolbar.menuAttribute")}
                    onClick={toggleDrawer(anchor, false)}
                  >
                    <MenuIcon />
                  </IconButton>
                </Box>
                <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
                  {drawerNavContent}
                </Box>
                {mobileGamificationFooter}
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
                  backdropFilter: SEMANTIC_THEME.surface.appBarBlur,
                  WebkitBackdropFilter: SEMANTIC_THEME.surface.appBarBlur,
                },
              },
            }}
          >
            <form onSubmit={addStudentToSection}>
              <DialogTitle id="form-dialog-title">
                {t("mainToolbar.addToSection.title")}
              </DialogTitle>
              <DialogContent>
                <DialogContentText>
                  {t("mainToolbar.addToSection.description")}
                </DialogContentText>
                <br />

                <TextField
                  sx={{ width: "100%" }}
                  required
                  id="code"
                  name="code"
                  data-tour="join-code-input"
                  label={t("mainToolbar.addToSection.codeLabel")}
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
                  {t("actions.cancel")}
                </Button>
                <Button disabled={work} type="submit" variant="contained">
                  {t("mainToolbar.addToSection.add")}
                </Button>
              </DialogActions>
            </form>
          </Dialog>

          {/* Collaboration Dialog (Practice, Workbook, Peer Review) */}
          <CollaborationDialog
            open={openCollaboration}
            onClose={() => setOpenCollaboration(false)}
            onJoinPractice={(sessionInfo) => {
              setOpenCollaboration(false);
              const params = new URLSearchParams({
                joinSession: sessionInfo.sessionId,
                joinRoom: sessionInfo.roomCode,
                joinUnit: sessionInfo.unitID,
              });
              router.push(`/units?${params.toString()}`);
            }}
            onJoinWorkbook={({ unitId }) => {
              setOpenCollaboration(false);
              router.push(`/workbook/${unitId}`);
            }}
            onJoinPeerReview={({ roomId }) => {
              setOpenCollaboration(false);
              router.push(`/review/${roomId}`);
            }}
          />
        </React.Fragment>
      ))}
    </>
  );
}
