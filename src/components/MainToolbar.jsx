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
import { DiceBearAvatar } from "./Gamification/DiceBearAvatar";
import { useAvatarConfig } from "../hooks/useAvatarConfig";
import SyncStatusIndicator from "./SyncStatusIndicator";
import { useXP } from "../context/gamificationContext";
import AuthContext from "../context/authContext";
import EditNoteIcon from "@mui/icons-material/EditNote";
import RateReviewIcon from "@mui/icons-material/RateReview";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import TuneIcon from "@mui/icons-material/Tune";
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
  const { user } = React.useContext(AuthContext);
  const {
    style: avatarStyle,
    overrides: avatarOverrides,
    seed: configSeed,
    isLoaded,
    glowRing,
  } = useAvatarConfig();
  const avatarSeed =
    configSeed || user?.username || user?.attributes?.sub || "";
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
      >
        {/**
         * @todo Replace this with the user's name.
         */}
        {/* <ProfileIcon />&nbsp;{username} */}
        {avatarSeed && isLoaded ? (
          <DiceBearAvatar
            seed={avatarSeed}
            size={28}
            style={avatarStyle}
            overrides={avatarOverrides}
            glowRing={glowRing}
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
        {/* Lazy render menu items only when open - prevents translation calls during initial render */}
        {open && (
          <>
            <MenuItem
              onClick={() => {
                router.push("/profile");
              }}
            >
              <UserIcon />
              &nbsp;{tCommon("navigation.profile")}
            </MenuItem>
            <MenuItem
              onClick={() => {
                router.push("/profile/notifications");
                handleClose();
              }}
            >
              <NotificationBadge>
                <NotificationsIcon />
              </NotificationBadge>
              &nbsp;{tCommon("navigation.notifications", "Notifications")}
            </MenuItem>
            <MenuItem
              onClick={() => {
                router.push("/settings");
              }}
            >
              <SettingsBrightnessIcon />
              &nbsp;{tCommon("navigation.settings")}
            </MenuItem>
            <MenuItem
              onClick={() => {
                signOut();
              }}
            >
              <LogoutIcon />
              &nbsp;{tAuth("sign_out")}
            </MenuItem>
          </>
        )}
      </Menu>
    </div>
  );
}

export default function MainToolbar({ children }) {
  const tCommon = useTranslations("common");
  const tComponents = useTranslations("components");
  const tEditorAuth = useTranslations("editor.authoring");
  const { level, sectionLevel } = useXP();
  const { session: authSession } = React.useContext(AuthContext);
  const isInstructorOrAdmin = React.useMemo(() => {
    const groups = authSession?.groups || [];
    return groups.some((g) =>
      ["Admins", "Moderators", "Instructors"].includes(g),
    );
  }, [authSession?.groups]);
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
    const shouldFetch = state.left || currentSectionId || currentUnitId;
    if (!shouldFetch || navDataLoaded) return;

    const client = getAmplifyClient();

    async function fetchNavData() {
      try {
        const [sectionsResult, unitsResult] = await Promise.all([
          client.models.Section.list(),
          client.models.Unit.list(),
        ]);
        setNavSections(
          (sectionsResult.data || []).filter((s) => s != null && s.id != null),
        );
        setNavUnits(
          (unitsResult.data || []).filter((u) => u != null && u.id != null),
        );
        setNavDataLoaded(true);
      } catch (err) {
        console.error("[MainToolbar] Error fetching nav data:", err);
      }
    }

    fetchNavData();
  }, [state.left, currentSectionId, currentUnitId, navDataLoaded]);

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

    setState({ ...state, [anchor]: open });
  };

  // create a mui popup modal for adding a user to a section by section code

  async function addStudentToSection(event) {
    setIsWorking(true);
    event.preventDefault();
    console.log("addStudentToSection");

    console.log("event", event);

    const form = new FormData(event.target);
    let response;

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

    // If the path is sections then reload the page
    if (
      currentPathname === "/sections" ||
      currentPathname.includes("/section/") ||
      currentPathname === "/"
    ) {
      window.location.reload();
    }
  }

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
            toggleDrawer("left", true)(e);
          }}
        >
          <MenuIcon />
        </IconButton>
        {/* <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}> */}
        {children && children}
        {/* </Typography> */}
        <Box sx={{ flexGrow: 1 }} />
        <SyncStatusIndicator />
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
          {/* <Button onClick={toggleDrawer(anchor, true)}>{anchor}</Button> */}
          <SwipeableDrawer
            anchor={anchor}
            open={state[anchor]}
            onClose={toggleDrawer(anchor, false)}
            onOpen={toggleDrawer(anchor, true)}
            sx={{
              marginTop: "4rem",
              zIndex: (theme) => theme.zIndex.drawer + 3,
            }}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            slotProps={{
              backdrop: {
                sx: {
                  backgroundColor: "action.disabledBackground",
                },
              },
            }}
            PaperProps={{
              sx: {
                backdropFilter: "blur(7px)",
                backgroundColor: "custom.glassNavbar",
              },
            }}
          >
            <Box
              sx={{
                marginTop: "4rem",
                width: anchor === "top" || anchor === "bottom" ? "auto" : 250,
              }}
              role="presentation"
              onClick={toggleDrawer(anchor, false)}
              onKeyDown={toggleDrawer(anchor, false)}
            >
              <List
                sx={{
                  color: "text.primary",
                }}
              >
                <ListItem disablePadding>
                  <ListItemButton component="a" href="/">
                    <ListItemIcon
                      sx={{
                        color: "text.primary",
                      }}
                    >
                      <HomeIcon />
                    </ListItemIcon>
                    <ListItemText primary={tCommon("navigation.home")} />
                  </ListItemButton>
                </ListItem>
                {/* <ListItem disablePadding>
                  <ListItemButton component="a" href='/about'>
                    <ListItemIcon>
                      <BatteryUnknownIcon />
                    </ListItemIcon>
                    <ListItemText primary='About Us' />
                  </ListItemButton>
                </ListItem> */}
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
                        sectionsExpanded
                          ? "collapse sections"
                          : "expand sections"
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
                                secondary={
                                  !isCurrent ? section.description : undefined
                                }
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
                                    setState({ ...state, left: false });
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

                {/* Units — expandable nav with sub-items */}
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
                      aria-label={
                        unitsExpanded ? "collapse units" : "expand units"
                      }
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
                <Collapse
                  in={unitsExpanded}
                  timeout="auto"
                  unmountOnExit
                  onClick={(e) => e.stopPropagation()}
                >
                  <List component="div" disablePadding>
                    {navUnits.map((unit) => {
                      const isCurrent = unit.id === currentUnitId;
                      return (
                        <ListItem key={unit.id} disablePadding>
                          <ListItemButton
                            component="a"
                            href={`/unit/${unit.id}`}
                            selected={isCurrent}
                            sx={{ pl: 4 }}
                          >
                            <ListItemText
                              primary={unit.name}
                              secondary={unit.description}
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
                  </List>
                </Collapse>
                <ListItem disablePadding>
                  <ListItemButton component="a" href="/leaderboard">
                    <ListItemIcon
                      sx={{
                        color: "text.primary",
                      }}
                    >
                      <NotificationBadge category="GAMIFICATION">
                        <LeaderboardIcon />
                      </NotificationBadge>
                    </ListItemIcon>
                    <ListItemText primary={tCommon("navigation.leaderboard")} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component="a" href="/guilds">
                    <ListItemIcon
                      sx={{
                        color: "text.primary",
                      }}
                    >
                      <NotificationBadge category="GUILD">
                        <GroupsIcon />
                      </NotificationBadge>
                    </ListItemIcon>
                    <ListItemText primary={tCommon("navigation.guilds")} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component="a" href="/skills">
                    <ListItemIcon
                      sx={{
                        color: "text.primary",
                      }}
                    >
                      <AccountTreeIcon />
                    </ListItemIcon>
                    <ListItemText primary={tCommon("navigation.skills")} />
                  </ListItemButton>
                </ListItem>
                {isInstructorOrAdmin && (
                  <ListItem disablePadding>
                    <ListItemButton component="a" href="/gamification">
                      <ListItemIcon
                        sx={{
                          color: "text.primary",
                        }}
                      >
                        <TuneIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={tCommon("navigation.gamification")}
                      />
                    </ListItemButton>
                  </ListItem>
                )}
              </List>
              <Divider />
              <List
                sx={{
                  color: "text.primary",
                }}
              >
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
            </Box>
          </SwipeableDrawer>

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
