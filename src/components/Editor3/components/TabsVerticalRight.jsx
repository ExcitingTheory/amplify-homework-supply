import * as React from "react";
import { useTranslations } from "next-intl";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import FileManager2 from "./FileManager2";
import { DictionaryEditor2 } from "../../DictionaryEditor2";
import { QuestionEditor2 } from "../../QuestionEditor2";
import { AudioPlayerProvider } from "../context/AudioPlayerContext";
import { useSuggestions } from "../context/SuggestionContext";

import ChatSidebar from "../../ChatSidebar";
import { ChatPanel } from "../../CollaborativeChat";
import BlockSuggestionMenu from "./BlockSuggestionMenu";
import UnitContext from "../../../context/unitContext";

import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";

import DictionaryIcon from "@mui/icons-material/LibraryBooks";
import ChatIcon from "@mui/icons-material/Chat";
import FolderIcon from "@mui/icons-material/Folder";
import ConfigIcon from "@mui/icons-material/Settings";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import GradeIcon from "@mui/icons-material/Assessment";
import ForumIcon from "@mui/icons-material/Forum";

import FileManager from "./FileManager2";
import ConfigurationManager from "./ConfigurationManager";
import AssignmentConfiguration from "./AssignmentConfiguration";
import { QuestionMarkOutlined } from "@mui/icons-material";

function TabPanel(props) {
  const { children, value, index, overflowY, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      style={{
        width: "100%",
        minWidth: 0,
        height: "calc(100vh - var(--app-bar-height, 11rem))",
        overflow: overflowY === "hidden" ? "hidden" : "auto",
        direction: "rtl", // Flips scrollbar to left
      }}
      {...other}
    >
      {value === index && (
        <div style={{ direction: "ltr", height: "100%" }}>
          {" "}
          {/* Flip content back to normal */}
          {children}
        </div>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `vertical-tab-${index}`,
    "aria-controls": `vertical-tabpanel-${index}`,
    "aria-label": index,
  };
}

export default function TabsVerticalRight({
  setOpen,
  open,
  value,
  setValue,
  setDrawerWidth,
}) {
  const t = useTranslations("editor.authoring");
  const [isResizing, setIsResizing] = React.useState(false);
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(0);
  const wasClosedRef = React.useRef(false);

  // Get suggestion state from context
  const {
    suggestions,
    isLoadingAI,
    useAI,
    insertSuggestion,
    requestMoreSuggestions,
  } = useSuggestions();
  const {
    recentGrades = [],
    sectionId,
    session,
    unit,
  } = React.useContext(UnitContext) || {};
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Handler for when a suggestion is clicked
  const handleSuggestionClick = React.useCallback(
    (index) => {
      setSelectedIndex(index);
      const suggestion = suggestions[index];
      if (suggestion && insertSuggestion) {
        insertSuggestion(suggestion);
      }
    },
    [suggestions, insertSuggestion],
  );

  const handleTabClick = (newValue) => {
    if (value === newValue && open) {
      // Clicking the already-active tab closes the drawer
      setOpen(false);
    } else {
      // Clicking a different tab opens drawer and switches to it
      setOpen(true);
      setValue(newValue);
    }
  };

  const handleMouseDown = (e) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    wasClosedRef.current = !open;

    if (!open) {
      // Opening from closed state
      setOpen(true);
      startWidthRef.current = 350; // Default width
    } else {
      // Store the current width from the parent's drawer ref
      const drawerElement = e.currentTarget.closest(".MuiDrawer-root");
      if (drawerElement) {
        startWidthRef.current = drawerElement.offsetWidth;
      }
    }
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const handleMouseMove = React.useCallback(
    (e) => {
      if (!isResizing) return;

      // Calculate the change in X position (reversed for right drawer)
      const deltaX = startXRef.current - e.clientX;
      // Moving mouse left should increase drawer width
      const newWidth = startWidthRef.current + deltaX;

      if (newWidth < 250) {
        // Close the drawer if dragged below minimum
        setOpen(false);
        setIsResizing(false);
      } else if (newWidth <= 800 && setDrawerWidth) {
        setDrawerWidth(newWidth);
      }
    },
    [isResizing, setDrawerWidth, setOpen],
  );

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "row",
        borderLeft: "1px solid",
        borderColor: "divider",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "5px",
          cursor: "ew-resize",
          backgroundColor: isResizing
            ? "var(--mui-palette-primary-main, #1976d2)"
            : "transparent",
          zIndex: 1000,
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor =
            "var(--mui-palette-primary-main, #1976d2)")
        }
        onMouseLeave={(e) =>
          !isResizing && (e.currentTarget.style.backgroundColor = "transparent")
        }
      />
      <Box sx={{ flexGrow: 1, minWidth: 0, order: 1 }}>
        <TabPanel value={value} index={5} overflowY="hidden">
          <ChatSidebar />
        </TabPanel>
        <TabPanel value={value} index={7}>
          <Box
            sx={{
              p: 3,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 2,
              m: 2,
              mb: 3,
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "white",
                fontWeight: 600,
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 28 }} />
              {t("tabsVerticalRight.aiSuggestionsHeading")}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.95)", lineHeight: 1.6 }}
            >
              {t("tabsVerticalRight.aiSuggestionsDesc")}
            </Typography>
          </Box>
          <Box sx={{ px: 2 }}>
            {/** Add unit suggestions list here in the future */}
            {/**  Add block suggestions list here */}
            <BlockSuggestionMenu
              suggestions={suggestions}
              selectedIndex={selectedIndex}
              onSelect={handleSuggestionClick}
              isLoadingAI={isLoadingAI}
              useAI={useAI}
              onRequestMore={requestMoreSuggestions}
            />
            {/*  Each suggestion shows preview of what it will look like in the editor as semi-transparent when the mouse hovers, clicking the suggestion will add. Important node when suggesting custom blocks we need ot add to the prompt the parameters too, for instance if something takes a list of questionIds or wordIds these need to be suggested as well */}
          </Box>
        </TabPanel>
        <TabPanel value={value} index={8}>
          <Box
            sx={{
              p: 3,
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              borderRadius: 2,
              m: 2,
              mb: 3,
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "white",
                fontWeight: 600,
              }}
            >
              <GradeIcon sx={{ fontSize: 28 }} />
              {t("tabsVerticalRight.gradesHeading")}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.95)", lineHeight: 1.6 }}
            >
              {t("tabsVerticalRight.gradesDesc")}
            </Typography>
          </Box>
          <Box sx={{ px: 2 }}>
            {recentGrades.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic", textAlign: "center", mt: 2 }}
              >
                {t("tabsVerticalRight.noGrades", "No completed grades yet.")}
              </Typography>
            ) : (
              recentGrades.map((g) => (
                <Box
                  key={g.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1.5,
                    mb: 1,
                    borderRadius: 1,
                    bgcolor: "background.default",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {g.owner || t("tabsVerticalRight.anonymous", "Student")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {g.createdAt
                        ? new Date(g.createdAt).toLocaleDateString()
                        : ""}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color:
                        (g.accuracy || 0) >= 80
                          ? "success.main"
                          : (g.accuracy || 0) >= 60
                            ? "warning.main"
                            : "error.main",
                    }}
                  >
                    {g.accuracy != null ? `${Math.round(g.accuracy)}%` : "—"}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </TabPanel>
        <TabPanel value={value} index={9} overflowY="hidden">
          {sectionId ? (
            <ChatPanel
              sectionId={sectionId}
              user={{
                username: session?.username || "",
                displayName: session?.username || "",
              }}
              scopeContext={{ sectionId, unitId: unit?.id }}
              height="100%"
            />
          ) : (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                {t(
                  "tabsVerticalRight.noSection",
                  "Assign this unit to a section to enable cohort chat.",
                )}
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Box>
      <Tabs
        orientation="vertical"
        variant="scrollable"
        scrollButtons="auto"
        value={value}
        aria-label={t("tabsVerticalRight.gradesTab")}
        sx={{
          minWidth: "2.5rem",
          maxWidth: "2.5rem",
          order: 2,
          borderLeft: "1px solid",
          borderLeftColor: "divider",
          "& .MuiTab-root": {
            minWidth: "2.5rem",
            maxWidth: "2.5rem",
            padding: "8px 4px",
            margin: 0,
            color: "text.secondary",
            "&.Mui-selected": {
              color: "primary.main",
            },
          },
          "& .MuiTabs-scroller": {
            margin: 0,
          },
          "& .MuiTabs-indicator": {
            left: 0,
            right: "auto",
          },
          "& .MuiTabScrollButton-root": {
            width: "2.5rem",
            "&.Mui-disabled": {
              opacity: 0.3,
            },
          },
        }}
      >
        <Tab
          value={5}
          onClick={() => handleTabClick(5)}
          label={<ChatIcon />}
          data-testid="editor-chat-tab"
          {...a11yProps(t("tabsVerticalRight.aiAssistantTab"))}
        />
        <Tab
          value={7}
          onClick={() => handleTabClick(7)}
          label={<AutoAwesomeIcon />}
          {...a11yProps(t("tabsVerticalRight.aiSuggestionsTab"))}
        />
        <Tab
          value={8}
          onClick={() => handleTabClick(8)}
          label={<GradeIcon />}
          {...a11yProps(t("tabsVerticalRight.gradesTab"))}
          data-tour="grades-tab"
        />
        <Tab
          value={9}
          onClick={() => handleTabClick(9)}
          label={<ForumIcon />}
          {...a11yProps(t("tabsVerticalRight.cohortChatTab"))}
        />
      </Tabs>
    </Box>
  );
}
