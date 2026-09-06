import * as React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import FileManager2 from "./FileManager2";
import { DictionaryEditor2 } from "../../DictionaryEditor2";
import { QuestionEditor2 } from "../../QuestionEditor2";
import { AudioPlayerProvider } from "../context/AudioPlayerContext";
import { useTranslations } from "next-intl";

import ChatSidebar from "../../ChatSidebar";
import TableOfContents from "./TableOfContents";
import CampaignPanel from "./CampaignPanel";

import DictionaryIcon from "@mui/icons-material/LibraryBooks";
import ChatIcon from "@mui/icons-material/Chat";
import FolderIcon from "@mui/icons-material/Folder";
import ConfigIcon from "@mui/icons-material/Settings";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import TocIcon from "@mui/icons-material/Toc";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CampaignIcon from "@mui/icons-material/Campaign";
import { QuestionMarkOutlined } from "@mui/icons-material";

import ConfigurationManager from "./ConfigurationManager";
import AssignmentConfiguration from "./AssignmentConfiguration";

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
      }}
      {...other}
    >
      {value === index && <div style={{ height: "100%" }}>{children}</div>}
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

export default function TabsVerticalLeft({
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

      // Calculate the change in X position
      const deltaX = e.clientX - startXRef.current;
      // Moving mouse right should increase drawer width
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
        borderRight: "1px solid",
        borderColor: "divider",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "5px",
          cursor: "ew-resize",
          backgroundColor: isResizing ? "#1976d2" : "transparent",
          zIndex: 1000,
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#1976d2")
        }
        onMouseLeave={(e) =>
          !isResizing && (e.currentTarget.style.backgroundColor = "transparent")
        }
      />
      <Tabs
        orientation="vertical"
        variant="scrollable"
        scrollButtons="auto"
        value={value}
        aria-label={t("tabsVerticalLeft.tabs.configuration")}
        sx={{
          minWidth: "2.5rem",
          maxWidth: "2.5rem",
          "& .MuiTab-root": {
            minWidth: "2.5rem",
            maxWidth: "2.5rem",
            padding: "8px 4px",
            margin: 0,
          },
          "& .MuiTabs-scroller": {
            borderRight: "1px solid",
            borderRightColor: "divider",
            margin: 0,
          },
          "& .MuiTabScrollButton-root": {
            width: "2.5rem",
            "&.Mui-disabled": {
              opacity: 0.3,
            },
          },
        }}
      >
        <Tooltip
          title={t("tabsVerticalLeft.tabs.assignments")}
          placement="right"
        >
          <Tab
            onClick={() => handleTabClick(0)}
            data-tour="assignments-tab"
            label={<AssignmentIcon />}
            {...a11yProps(t("tabsVerticalLeft.tabs.assignments"))}
          />
        </Tooltip>
        <Tooltip
          title={t("tabsVerticalLeft.tabs.tableOfContents")}
          placement="right"
        >
          <Tab
            onClick={() => handleTabClick(1)}
            data-tour="table-of-contents-tab"
            label={<TocIcon />}
            {...a11yProps(t("tabsVerticalLeft.tabs.tableOfContents"))}
          />
        </Tooltip>
        <Tooltip
          title={t("tabsVerticalLeft.tabs.dictionary")}
          placement="right"
        >
          <Tab
            onClick={() => handleTabClick(2)}
            data-tour="dictionary-tab"
            label={<DictionaryIcon />}
            {...a11yProps(t("tabsVerticalLeft.tabs.dictionary"))}
          />
        </Tooltip>
        <Tooltip title={t("tabsVerticalLeft.tabs.questions")} placement="right">
          <Tab
            onClick={() => handleTabClick(3)}
            data-tour="questions-tab"
            label={<QuestionMarkOutlined />}
            {...a11yProps(t("tabsVerticalLeft.tabs.questions"))}
            overflow="hidden"
          />
        </Tooltip>
        <Tooltip title={t("tabsVerticalLeft.tabs.files")} placement="right">
          <Tab
            onClick={() => handleTabClick(4)}
            data-tour="files-tab"
            label={<FolderIcon />}
            {...a11yProps(t("tabsVerticalLeft.tabs.files"))}
          />
        </Tooltip>
        <Tooltip
          title={t("tabsVerticalLeft.tabs.campaign") || "Campaign"}
          placement="right"
        >
          <Tab
            onClick={() => handleTabClick(5)}
            data-tour="campaign-tab"
            label={<CampaignIcon />}
            {...a11yProps(t("tabsVerticalLeft.tabs.campaign") || "Campaign")}
          />
        </Tooltip>
        <Tooltip
          title={t("tabsVerticalLeft.tabs.configuration")}
          placement="right"
        >
          <Tab
            onClick={() => handleTabClick(6)}
            data-tour="configuration-tab"
            label={<ConfigIcon />}
            {...a11yProps(t("tabsVerticalLeft.tabs.configuration"))}
          />
        </Tooltip>
        {/* <Tab label="Item Five" {...a11yProps(4)} />
        <Tab label="Item Six" {...a11yProps(5)} />
        <Tab label="Item Seven" {...a11yProps(6)} /> */}
      </Tabs>
      <TabPanel value={value} index={0}>
        <AssignmentConfiguration />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <TableOfContents />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <DictionaryEditor2 />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <QuestionEditor2 />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <FileManager2 />
      </TabPanel>
      <TabPanel value={value} index={5}>
        <CampaignPanel />
      </TabPanel>
      <TabPanel value={value} index={6}>
        <ConfigurationManager />
      </TabPanel>
      {/*<TabPanel value={value} index={4}>
        Item Five
      </TabPanel>
      <TabPanel value={value} index={5}>
        Item Six
      </TabPanel>
      <TabPanel value={value} index={6}>
        Item Seven
      </TabPanel> */}
    </Box>
  );
}
