"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { getAmplifyClient } from "@/utils/amplifyClient";
import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import { uploadData } from "aws-amplify/storage";
import { listSectionStudents } from "../../../actions/section";
import { formatLastFirst, getInitials } from "@/utils/formatUserName";
import { trackGradeSubmitted, trackGuildViewed } from "@/utils/analytics";
import { useAppShell } from "@/components/AppShellContext";
import { useScrolledAppBar } from "@/hooks/useScrolledAppBar";
import { useReducedMotion } from "@/hooks/useReducedMotion";

import {
  Button,
  Box,
  Card,
  Typography,
  CardMedia,
  CardActions,
  Container,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Paper,
  IconButton,
  Slide,
  List,
  ListItem,
  ListItemText,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Menu,
  Alert,
  FormControl,
  InputLabel,
  Skeleton,
  Chip,
  Tooltip,
  Divider,
  Tabs,
  Tab,
  Checkbox,
  Toolbar,
  InputAdornment,
  Popover,
  Radio,
  RadioGroup,
  FormLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { fuzzyMatch } from "@/utils/fuzzyMatch";
import { maskEmail } from "@/utils/maskEmail";

import PrefetchBadge from "@/components/PrefetchBadge";
import {
  InlineGradeCell,
  createEmptyHistoryState,
  createGradeCellRegistry,
  GradeCellRegistryContext,
} from "@/components/InlineGradeCell";

import DeleteIcon from "@mui/icons-material/Delete";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import getCachedUrl from "@/utils/getCachedUrl";
import { getResponsiveImageUrls } from "@/utils/getResponsiveImageUrls";
import { AssignmentFeedCard } from "./components/AssignmentFeedCard";
import {
  SectionTitleBar,
  TITLE_BAR_SETTLE_MS,
} from "./components/SectionTitleBar";
import { SEMANTIC_THEME } from "@/themes/semanticTheme";
import { EmptyState } from "@/components/EmptyState";
import { FiImage } from "react-icons/fi";
import FilesContext from "@/context/fileContext";
import UnitContext from "@/context/unitContext";
import { useChatPageContext } from "@/hooks/useChatPageContext";
import { CompletionGrid } from "@/components/Leaderboard/CompletionGrid";
import { LeaderboardTable } from "@/components/Leaderboard/LeaderboardTable";
import { SquadLeaderboard } from "@/components/Gamification/SquadLeaderboard";
import { OpenCollaborationRooms } from "@/components/PeerReview/OpenCollaborationRooms";
import {
  createPeerReviewRoom,
  randomAssignPeerReview,
  awardTopReviewerXP,
} from "../../../actions/peerReview";
import { useRouter, useParams } from "next/navigation";
import { GradeReviewDrawer } from "@/components/GradeReviewDrawer";
import { SkillTreePopupButton } from "@/components/SkillTreePopupButton";
import { useContentLock, useCampaign } from "@/context/gamificationContext";
import { ContentLockCard } from "@/components/Gamification/ContentLockCard";
import { CampaignTimeline } from "@/components/Gamification/CampaignTimeline";
import { GamificationQuickPanel } from "@/components/Section/GamificationQuickPanel";
import { ChapterDetailPopover } from "@/components/Gamification/ChapterDetailPopover";
import LockIcon from "@mui/icons-material/Lock";
import { AssignmentComposer } from "@/components/AssignmentComposer";
import AddIcon from "@mui/icons-material/Add";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import { NeedsAttention } from "@/components/Section/NeedsAttention";
import { RosterEnrollDialog } from "@/components/Section/RosterEnrollDialog";
import { AccommodationsDialog } from "@/components/Section/AccommodationsDialog";
import { BulkDueDateDialog } from "@/components/Section/BulkDueDateDialog";
import { removeStudentFromSection } from "../../../actions/section";
import {
  parseAccommodations,
  getStudentAccommodation,
  hasAccommodation,
} from "@/utils/accommodations";
import { openDiscussion } from "@/utils/chatDiscussBus";

// import { fetchAuthSession } from '@aws-amplify/auth';

function HighlightedText({ text, indices }) {
  if (!indices?.length) return text;
  const marked = new Set(indices);
  const segments = [];
  for (let i = 0; i < text.length; i++) {
    const match = marked.has(i);
    const last = segments[segments.length - 1];
    if (last && last.match === match) last.text += text[i];
    else segments.push({ text: text[i], match });
  }
  return segments.map((segment, i) =>
    segment.match ? (
      <Box
        key={i}
        component="mark"
        sx={{
          bgcolor: "warning.light",
          color: "warning.contrastText",
          borderRadius: 0.5,
        }}
      >
        {segment.text}
      </Box>
    ) : (
      <React.Fragment key={i}>{segment.text}</React.Fragment>
    ),
  );
}

function FeaturedImage({ style, s3Key, identityId }) {
  const [url, setUrl] = React.useState(null);
  const [srcSet, setSrcSet] = React.useState(null);
  const [sizes, setSizes] = React.useState(null);
  const [loaded, setLoaded] = React.useState(false);
  const containerRef = React.useRef(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isVisible || !s3Key) return;
    setLoaded(false);
    let cancelled = false;

    const fetchUrl = async () => {
      const _url = await getCachedUrl(s3Key);
      if (!cancelled) setUrl(_url);
    };
    fetchUrl();

    if (identityId) {
      // Extract fileId from s3Key path (e.g. "protected/{id}/files/{fileId}/original.webp")
      const parts = s3Key.split("/");
      const filesIdx = parts.indexOf("files");
      const fileId = filesIdx >= 0 ? parts[filesIdx + 1] : null;
      if (fileId) {
        getResponsiveImageUrls(fileId, identityId)
          .then((result) => {
            if (!cancelled && result) {
              setSrcSet(result.srcSet);
              setSizes(result.sizes);
            }
          })
          .catch(() => {});
      }
    }

    return () => {
      cancelled = true;
    };
  }, [isVisible, s3Key, identityId]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: 200,
        overflow: "hidden",
      }}
    >
      {isVisible && url && (
        <img
          src={url}
          srcSet={srcSet || undefined}
          sizes={sizes || undefined}
          loading="lazy"
          decoding="async"
          style={{
            ...style,
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
          onLoad={() => setLoaded(true)}
        />
      )}
      {!loaded && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          width="100%"
          height="100%"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            borderRadius: 0,
          }}
        />
      )}
    </div>
  );
}

function SectionDetail({
  user,
  signOut,
  initialSection = null,
  initialAssignments = [],
}) {
  const client = getAmplifyClient();
  const t = useTranslations("pages");
  const tCommon = useTranslations("common");
  const { toolbarPortalRef, appBarHeight } = useAppShell();
  const isAppBarScrolled = useScrolledAppBar();
  const reducedMotion = useReducedMotion();
  // Hide the sticky notice while the AppBar resizes so it doesn't trail the bar.
  const [noticeTucked, setNoticeTucked] = React.useState(false);
  const previousAppBarScrolledRef = React.useRef(isAppBarScrolled);
  React.useEffect(() => {
    if (previousAppBarScrolledRef.current === isAppBarScrolled) return;
    previousAppBarScrolledRef.current = isAppBarScrolled;
    if (reducedMotion) return;
    setNoticeTucked(true);
    const timer = setTimeout(() => setNoticeTucked(false), TITLE_BAR_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [isAppBarScrolled, reducedMotion]);

  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [userAttributes, setUserAttributes] = useState(null);
  const [section, setSection] = useState(initialSection);
  const [sectionStudents, setSectionStudents] = useState([]);
  const [units, setUnits] = useState({});
  const [myGrades, setMyGrades] = useState([]);
  const [gradeMap, setGradeMap] = useState({});
  const [myGradeMap, setMyGradeMap] = useState({});
  const [allGradeMap, setAllGradeMap] = useState({});
  const [grades, setGrades] = useState([]);
  const [sectionAssignments, setSectionAssignments] =
    useState(initialAssignments);
  const [work, setIsWorking] = useState(false);
  const [open, setOpen] = React.useState(false);
  const [isOwner, setIsOwner] = React.useState(false);
  const [isTeacher, setIsTeacher] = React.useState(false);
  const [ownerId, setOwnerId] = React.useState("");
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [inProgress, setInProgress] = React.useState(false);
  const [curveSettings, setCurveSettings] = React.useState({}); // { [unitID]: { method: 'scale-to-top' | 'linear-adjustment' } }
  const hasCurve = Object.keys(curveSettings).length > 0;
  // Draft state for the unified "Apply Curve" control (type + target columns)
  const [curveMethodDraft, setCurveMethodDraft] =
    React.useState("scale-to-top");
  const [curveTargetDraft, setCurveTargetDraft] = React.useState([]);
  const [curveMenuAnchorEl, setCurveMenuAnchorEl] = React.useState(null);
  const [showFutureAssignments, setShowFutureAssignments] =
    React.useState(false);
  const [showDraftAssignments, setShowDraftAssignments] = React.useState(false);
  const [clientNow, setClientNow] = React.useState(null);
  const [leaderboardEnabledLocal, setLeaderboardEnabledLocal] =
    React.useState(true);
  const [gradeOverrideOpen, setGradeOverrideOpen] = React.useState(false);
  const [overrideData, setOverrideData] = React.useState({
    student: null,
    assignment: null,
    currentGrade: null,
  });
  const [overrideScore, setOverrideScore] = React.useState("");
  const [gradeOverrides, setGradeOverrides] = React.useState({}); // { [studentId]: { [unitID]: { score, updatedAt } } }
  const gradebookHistoryRef = React.useRef(createEmptyHistoryState());
  const gradeCellRegistryRef = React.useRef(createGradeCellRegistry());
  const curveSettingsLoadedRef = React.useRef(false); // true after first server load
  const gradeOverridesLoadedRef = React.useRef(false); // true after first server load
  // Grade review drawer state
  const [gradeDrawerOpen, setGradeDrawerOpen] = React.useState(false);
  const [gradeDrawerData, setGradeDrawerData] = React.useState({
    gradeId: null,
    unitId: null,
    studentName: "",
    gradeIds: [],
    currentIndex: 0,
  });
  // Chapter detail popover state
  const [chapterPopoverAnchor, setChapterPopoverAnchor] = React.useState(null);
  const [chapterPopoverData, setChapterPopoverData] = React.useState(null);
  const [selectedRow, setSelectedRow] = React.useState(null);
  const [viewAsStudent, setViewAsStudent] = React.useState(false);
  const [viewModeNoticeDismissed, setViewModeNoticeDismissed] =
    React.useState(false);
  const handleViewAsStudentChange = (nextMode) => {
    if (nextMode !== viewAsStudent) setViewModeNoticeDismissed(false);
    setViewAsStudent(nextMode);
  };
  const [activeTab, setActiveTab] = React.useState("assignments");
  // Instructors (and teacher collaborators) see the full gradebook under the
  // "Gradebook" tab; students (and instructors previewing student view) see
  // their own assignment/grade table under "Assignments" instead.
  const gradebookTabKey =
    (isOwner || isTeacher) && !viewAsStudent ? "gradebook" : "assignments";
  const [leaderboardEntries, setLeaderboardEntries] = React.useState([]);
  const [sectionSquads, setSectionSquads] = React.useState([]);
  const [openRooms, setOpenRooms] = React.useState([]);
  // Student sort: "natural" (original order), "first" (first name A-Z), "last" (last name A-Z)
  const [studentSort, setStudentSort] = React.useState("natural");
  const [studentQuery, setStudentQuery] = React.useState("");

  const { id, locale } = useParams();

  // The quick-nav sidebar (MainToolbar) jumps straight to a heading id; since
  // that content now lives behind Tabs, switch tabs first, then scroll once
  // the target section has rendered.
  const pendingScrollIdRef = React.useRef(null);
  React.useEffect(() => {
    const headingToTab = {
      "nav-section-students": "students",
      "nav-section-gradebook": "gradebook",
      "nav-section-completion": "gradebook",
      "nav-section-leaderboard": "leaderboard",
      "nav-section-assignments": "assignments",
    };
    function handleNavJump(event) {
      const headingId = event?.detail?.headingId;
      const targetTab = headingId && headingToTab[headingId];
      if (!targetTab) return;
      pendingScrollIdRef.current = headingId;
      setActiveTab(targetTab);
    }
    window.addEventListener("section-detail-nav", handleNavJump);
    return () =>
      window.removeEventListener("section-detail-nav", handleNavJump);
  }, []);
  React.useEffect(() => {
    if (!pendingScrollIdRef.current) return;
    const headingId = pendingScrollIdRef.current;
    pendingScrollIdRef.current = null;
    const raf = requestAnimationFrame(() => {
      document
        .getElementById(headingId)
        ?.scrollIntoView({ behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [activeTab]);

  // Emit a section-viewed engagement event once per section id
  const guildViewTrackedRef = React.useRef(null);
  React.useEffect(() => {
    if (!id || guildViewTrackedRef.current === id) return;
    guildViewTrackedRef.current = id;
    trackGuildViewed(id, "section");
  }, [id]);

  const [isDragging, setIsDragging] = React.useState(false);
  const [filesToUpload, setFilesToUpload] = React.useState([]);
  const [fileOperations, setFileOperations] = React.useState([]);
  const [coverVideoUrlInput, setCoverVideoUrlInput] = React.useState("");
  const [coverVideoDialogOpen, setCoverVideoDialogOpen] = React.useState(false);
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
  const [skillTreeOpen, setSkillTreeOpen] = React.useState(false);
  const [configureAnchorEl, setConfigureAnchorEl] = React.useState(null);
  const [joinCodeCopied, setJoinCodeCopied] = React.useState(false);
  const imageFileInputRef = React.useRef(null);
  const [sectionNameInput, setSectionNameInput] = React.useState("");
  const [sectionDescriptionInput, setSectionDescriptionInput] =
    React.useState("");

  // Keep the editable title/description fields in sync with the live section
  // record (e.g. after a subscription update from another tab/collaborator).
  React.useEffect(() => {
    setSectionNameInput(section?.name || "");
  }, [section?.name]);
  React.useEffect(() => {
    setSectionDescriptionInput(section?.description || "");
  }, [section?.description]);

  const { session } = React.useContext(FilesContext);

  // Assignment composer state for section-first flow (Item 3 & 4)
  const [assignmentComposerOpen, setAssignmentComposerOpen] =
    React.useState(false);
  // Roster batch actions & accommodations (Section Roster Batch Actions)
  const [enrollDialogOpen, setEnrollDialogOpen] = React.useState(false);
  const [accommodationsDialogOpen, setAccommodationsDialogOpen] =
    React.useState(false);
  const [bulkDueDateOpen, setBulkDueDateOpen] = React.useState(false);
  const [accommodations, setAccommodations] = React.useState({});
  const [rosterRefreshKey, setRosterRefreshKey] = React.useState(0);
  const { units: allUnits = [] } = React.useContext(UnitContext) || {};

  // Content lock and campaign hooks for student progression view
  const { isLocked, getLockStatus } = useContentLock();
  const { activeChallenges, completedChallenges } = useCampaign();

  // Register page context with global chat
  useChatPageContext({
    sections: section ? [section] : [],
  });

  // Set client-side date after hydration to avoid SSR mismatch
  React.useEffect(() => {
    setClientNow(new Date());
  }, []);

  // Seed from IndexedDB cache when offline
  React.useEffect(() => {
    if (typeof navigator === "undefined" || navigator.onLine || !id) return;
    let mounted = true;
    (async () => {
      try {
        const { getCachedSection, getCachedAssignmentsForSection } =
          await import("@/offline/OfflineDataStore");
        const [cachedSection, cachedAssignments] = await Promise.all([
          getCachedSection(id),
          getCachedAssignmentsForSection(id),
        ]);
        if (!mounted) return;
        if (cachedSection) setSection(cachedSection);
        if (cachedAssignments.length > 0)
          setSectionAssignments(cachedAssignments);
      } catch {
        // IndexedDB not available — noop
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Fetch current user on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        const attributes = await fetchUserAttributes();
        setUserAttributes(attributes);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }
    fetchUser();
  }, []);

  const handleDeleteSection = async () => {
    console.log("handleDeleteSection");
    setDeleteOpen(false);
    if (confirm(t("sectionDetail.deleteSectionConfirm"))) {
      const { errors } = await client.models.Section.delete({ id: section.id });
      if (errors) {
        console.error("Error deleting section:", errors);
      } else {
        router.push("/sections");
      }
    }
  };

  React.useEffect(() => {
    const asyncFunc = async () => {
      // when audio files change, upload them to S3
      // and update the entry in the database

      if (filesToUpload.length === 0) {
        return;
      }

      const identityId = session.identityId;

      let newFilename;
      // show loading indicator
      setInProgress(true);

      const fileKeys = await Promise.allSettled(
        filesToUpload.map(async (fileInput) => {
          const { file } = fileInput;
          console.log("file", file);

          if (file?.type?.includes("image")) {
            newFilename = `featured-images/${file.name}`;
          }

          if (!newFilename) {
            throw new Error(t("sectionDetail.uploadImageInvalidFile"));
          }

          // TODO - add support for featured video and featured audio
          /**else if (isMimeType(file, ACCEPTABLE_AUDIO_TYPES)) {
            newFilename = `audio/${_uuid}-${file.name}`
            // Way to determine length of audio file?
        } else if (isMimeType(file, ACCEPTABLE_FILE_TYPES)) {
            newFilename = `files/${_uuid}-${file.name}`
        }*/

          console.log("uploading newFilename", newFilename);
          console.log("uploading file", fileInput);
          console.log("fileOperations", fileOperations);

          const result = await uploadData({
            key: newFilename,
            data: file,
            options: {
              contentType: file.type,
              contentLength: file.size,
              accessLevel: "protected",
              identityId,
              progressCallback(progress) {
                console.log(`Uploaded: ${progress.loaded}/${progress.total}`);

                setFileOperations((prev) => {
                  const newFileOperations = [...prev];
                  newFileOperations[fileInput.index].progress =
                    Math.round((progress.loaded / progress.total) * 100) + "%";
                  return newFileOperations;
                });
              },
            },
          });
        }),
      );

      // timeout to allow for S3? to update
      setTimeout(async () => {
        setFilesToUpload([]);
        setFileOperations([]);

        // Hide loading indicator

        try {
          // update the section with the new file
          const { errors } = await client.models.Section.update({
            id: section.id,
            featuredImage: newFilename,
            _version: section._version,
          });

          if (errors) {
            console.error("Error updating section:", errors);
          }
        } catch (error) {
          console.error(error);
        }

        setInProgress(false);
      }, 10000);
    };

    asyncFunc();
  }, [filesToUpload]);

  const handleDragOver = (e) => {
    console.log("handleDragOver");
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Shared by drag-drop and the "browse files" input in the empty state.
  const processFiles = (files) => {
    const _toupload = files.map((f, index) => ({ file: f, index }));
    const _fileOperations = files.map((f) => ({
      name: f.name,
      progress: "0%",
    }));
    setFilesToUpload(_toupload);
    setFileOperations(_fileOperations);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    processFiles(Array.from(event.dataTransfer.files));
    setIsDragging(false);
  };

  const handleImageFileInputChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length) processFiles(files);
    event.target.value = "";
  };

  const handleRemoveSectionFeaturedImage = async () => {
    if (!section?.id) return;
    try {
      await client.models.Section.update({
        id: section.id,
        featuredImage: null,
        _version: section._version,
      });
    } catch (error) {
      console.error("Error removing section featured image:", error);
    }
  };

  const handleCopyJoinCode = async () => {
    if (!section?.code) return;
    try {
      await navigator.clipboard.writeText(section.code);
      setJoinCodeCopied(true);
      setTimeout(() => setJoinCodeCopied(false), 2000);
    } catch (error) {
      console.error("Error copying join code:", error);
    }
  };

  const handleSaveSectionCoverVideo = async () => {
    const url = coverVideoUrlInput.trim();
    if (!url || !section?.id) return;
    try {
      await client.models.Section.update({
        id: section.id,
        featuredVideo: url,
        _version: section._version,
      });
      setCoverVideoUrlInput("");
    } catch (error) {
      console.error("Error saving section cover video:", error);
    }
  };

  const handleRemoveSectionCoverVideo = async () => {
    if (!section?.id) return;
    try {
      await client.models.Section.update({
        id: section.id,
        featuredVideo: null,
        _version: section._version,
      });
    } catch (error) {
      console.error("Error removing section cover video:", error);
    }
  };

  const handleSaveSectionName = async () => {
    const trimmed = sectionNameInput.trim();
    if (!section?.id || !trimmed || trimmed === section?.name) {
      setSectionNameInput(section?.name || "");
      return;
    }
    try {
      await client.models.Section.update({
        id: section.id,
        name: trimmed,
        _version: section._version,
      });
    } catch (error) {
      console.error("Error saving section name:", error);
      setSectionNameInput(section?.name || "");
    }
  };

  const handleSaveSectionDescription = async () => {
    const trimmed = sectionDescriptionInput.trim();
    if (!section?.id || trimmed === (section?.description || "")) return;
    try {
      await client.models.Section.update({
        id: section.id,
        description: trimmed,
        _version: section._version,
      });
    } catch (error) {
      console.error("Error saving section description:", error);
      setSectionDescriptionInput(section?.description || "");
    }
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleDeleteOpen = () => {
    setDeleteOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddAssignment = () => {
    console.log("handleAddAssignment");
  };

  const handleDeleteAssignment = async (assignment) => {
    console.log("handleDeleteAssignment");
    const { errors } = await client.models.Assignment.delete({
      id: assignment.id,
    });
    if (errors) {
      console.error("Error deleting assignment:", errors);
    }
  };

  const refreshRoster = React.useCallback(() => {
    setRosterRefreshKey((k) => k + 1);
  }, []);

  // Remove a student from the section's learner group (instructor action).
  const handleDelete = async (student) => {
    if (!student?.id || !section?.id) return;
    const label = student.name || student.email || student.id;
    if (
      !confirm(
        t("sectionDetail.removeStudentConfirm", {
          name: label,
          defaultValue: `Remove ${label} from this section?`,
        }),
      )
    ) {
      return;
    }
    try {
      const res = await removeStudentFromSection(section.id, student.id);
      if (!res.success) {
        console.error("Error removing student:", res.error);
        return;
      }
      // Optimistically drop from local roster, then refetch to confirm.
      setSectionStudents((current) => {
        if (Array.isArray(current)) {
          return current.filter((s) => s.id !== student.id);
        }
        const next = { ...current };
        delete next[student.id];
        return next;
      });
      refreshRoster();
    } catch (err) {
      console.error("Error removing student:", err);
    }
  };

  // Persist per-student accommodations to the section record.
  const saveAccommodations = async (nextAccommodations) => {
    if (!section?.id) return;
    setAccommodations(nextAccommodations);
    try {
      await client.models.Section.update({
        id: section.id,
        accommodations: JSON.stringify(nextAccommodations),
        _version: section._version,
      });
    } catch (err) {
      console.error("Error saving accommodations:", err);
    }
  };

  const getUnitName = React.useCallback(
    (unitID) => units?.[unitID]?.name || "",
    [units],
  );

  const handleImageUpload = async (event) => {
    setIsWorking(true);
    event.preventDefault();

    console.log("event", event);

    // const form = new FormData(event.target)
    // let response

    // try {
    //   const createInput = {
    //     name: form.get('name').toString(),
    //     description: form.get('description').toString(),
    //     // file
    //   }

    //   console.log('createInput', createInput);

    //   response = await client.graphql({
    //     query: createSectionGroup,
    //     variables: createInput,
    //   })

    // } catch (errors) {
    //   console.error(errors)
    //   //   throw new Error(errors[0].message)
    // }
  };

  // Get the unit data
  useEffect(() => {
    const subscription = client.models.Unit.observeQuery({
      // filter: { status: { eq: 'PUBLISHED' } } // Uncomment if needed
    }).subscribe({
      next: ({ items }) => {
        const unitMap = {};
        console.log("unitUpdate", { items });
        items.forEach((unit) => {
          unitMap[unit.id] = unit;
        });

        console.log("unitMap", unitMap);
        setUnits(unitMap);
      },
      error: (err) => console.error("Unit subscription error:", err),
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Get the section data
  useEffect(() => {
    console.log("[SectionDetail] Section query useEffect - id:", id);
    if (!id) return;

    const subscription = client.models.Section.observeQuery({
      filter: { id: { eq: id } },
    }).subscribe({
      next: ({ items }) => {
        console.log("sectionData", items);
        if (items.length > 0) {
          const sectionData = items[0];
          setSection(sectionData);

          // Load curve settings from section — schema stores as array [{unitID, method}]
          if (sectionData.curveSettings) {
            let raw = sectionData.curveSettings;
            // Handle legacy JSON string format
            if (typeof raw === "string") {
              try {
                raw = JSON.parse(raw);
              } catch {
                raw = [];
              }
            }
            // Convert array format to internal { [unitID]: { method } } map
            if (Array.isArray(raw)) {
              const map = {};
              raw.forEach((item) => {
                if (item?.unitID)
                  map[item.unitID] = { method: item.method || "scale-to-top" };
              });
              setCurveSettings((prev) => {
                if (JSON.stringify(prev) === JSON.stringify(map)) return prev;
                return map;
              });
            } else if (typeof raw === "object" && raw !== null) {
              setCurveSettings((prev) => {
                if (JSON.stringify(prev) === JSON.stringify(raw)) return prev;
                return raw;
              });
            }
          }
          // Mark curve settings as server-loaded (skip first auto-save)
          if (!curveSettingsLoadedRef.current)
            curveSettingsLoadedRef.current = true;
          // Load grade overrides from section
          if (sectionData.gradeOverrides) {
            const parsed =
              typeof sectionData.gradeOverrides === "string"
                ? JSON.parse(sectionData.gradeOverrides)
                : sectionData.gradeOverrides;
            setGradeOverrides((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(parsed)) return prev;
              return parsed;
            });
          }
          // Mark grade overrides as server-loaded (skip first auto-save)
          if (!gradeOverridesLoadedRef.current)
            gradeOverridesLoadedRef.current = true;
          // Load per-student accommodations from section
          {
            const parsedAccommodations = parseAccommodations(
              sectionData.accommodations,
            );
            setAccommodations((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(parsedAccommodations))
                return prev;
              return parsedAccommodations;
            });
          }
          if (sectionData.leaderboardEnabled !== undefined) {
            setLeaderboardEnabledLocal(sectionData.leaderboardEnabled);
          }
        }
      },
      error: (err) => console.error("Section subscription error:", err),
    });

    return function cleanup() {
      subscription.unsubscribe();
    };
  }, [id]);

  // Get MY grades (learner view only - shows their personal progress)
  // AND all grades (for gradebook + completion grid)
  // Single unfiltered subscription — client-side filtering
  useEffect(() => {
    if (!currentUser?.username) return;

    const subscription = client.models.Grade.observeQuery().subscribe({
      next: ({ items: allItems }) => {
        // Filter out null items
        const validGrades = allItems.filter((grade) => {
          if (!grade || !grade.id) return false;
          return !sectionAssignments.some(
            (assignment) =>
              assignment.unitID === grade.unitID &&
              assignment.lateStatus === "DROPPED" &&
              (!assignment.studentID || assignment.studentID === grade.owner),
          );
        });

        // --- My grades (learner view) ---
        const myCompleted = validGrades.filter(
          (g) => g.owner === currentUser.username && g.complete,
        );
        setMyGrades(myCompleted);

        const gradesByUnit = {};
        myCompleted.forEach((grade) => {
          if (!gradesByUnit[grade.unitID]) {
            gradesByUnit[grade.unitID] = {
              last: grade,
              highest: grade,
              average: 0,
              sum: 0,
              count: 0,
            };
          }
          if (grade.updatedAt > gradesByUnit[grade.unitID].last.updatedAt) {
            gradesByUnit[grade.unitID].last = grade;
          }
          if (grade.accuracy > gradesByUnit[grade.unitID].highest.accuracy) {
            gradesByUnit[grade.unitID].highest = grade;
          }
          gradesByUnit[grade.unitID].sum += grade.accuracy;
          gradesByUnit[grade.unitID].count += 1;
          if (gradesByUnit[grade.unitID].count > 0) {
            gradesByUnit[grade.unitID].average =
              gradesByUnit[grade.unitID].sum / gradesByUnit[grade.unitID].count;
          }
        });
        setMyGradeMap(gradesByUnit);

        // --- All grades (gradebook + completion grid) ---
        // Gradebook uses only completed grades with accuracy
        const completedGrades = validGrades.filter(
          (g) => g.complete && g.accuracy != null,
        );

        const gradesByUserUnit = {};
        completedGrades.forEach((grade) => {
          if (!gradesByUserUnit[grade.owner]) {
            gradesByUserUnit[grade.owner] = {};
          }
          if (!gradesByUserUnit[grade.owner][grade.unitID]) {
            gradesByUserUnit[grade.owner][grade.unitID] = {
              highest: grade,
              average: 0,
              sum: 0,
              count: 0,
            };
          }
          if (grade.updatedAt > units[grade.unitID]?.dueDate) {
            return;
          }
          if (
            grade.accuracy >
            gradesByUserUnit[grade.owner][grade.unitID].highest.accuracy
          ) {
            gradesByUserUnit[grade.owner][grade.unitID].highest = grade;
          }
          gradesByUserUnit[grade.owner][grade.unitID].sum += grade.accuracy;
          gradesByUserUnit[grade.owner][grade.unitID].count += 1;
          if (gradesByUserUnit[grade.owner][grade.unitID].count > 0) {
            gradesByUserUnit[grade.owner][grade.unitID].average =
              gradesByUserUnit[grade.owner][grade.unitID].sum /
              gradesByUserUnit[grade.owner][grade.unitID].count;
          }
        });

        setGrades(completedGrades);
        setGradeMap(gradesByUserUnit);

        // --- All grades map (includes incomplete — for completion grid) ---
        const allGradesByUserUnit = {};
        validGrades.forEach((grade) => {
          if (!allGradesByUserUnit[grade.owner]) {
            allGradesByUserUnit[grade.owner] = {};
          }
          if (!allGradesByUserUnit[grade.owner][grade.unitID]) {
            allGradesByUserUnit[grade.owner][grade.unitID] = {
              hasComplete: false,
              hasAny: true,
            };
          }
          if (grade.complete) {
            allGradesByUserUnit[grade.owner][grade.unitID].hasComplete = true;
          }
        });
        setAllGradeMap(allGradesByUserUnit);
      },
      error: (err) => {
        const msg =
          err?.message || err?.errors?.[0]?.message || JSON.stringify(err);
        if (
          msg === "{}" ||
          msg === "undefined" ||
          msg.includes("DuplicatedOperationError") ||
          msg.includes("Not Authorized")
        ) {
          console.warn("Grades subscription: transient error (safe to ignore)");
          return;
        }
        console.error("Grades subscription error:", err);
      },
    });

    return function cleanup() {
      subscription.unsubscribe();
    };
  }, [currentUser?.username, units, sectionAssignments]);

  useEffect(() => {
    if (!id) return;

    const subscription = client.models.Assignment.observeQuery({
      filter: { sectionID: { eq: id } },
    }).subscribe({
      next: ({ items }) => {
        setSectionAssignments(items);
      },
      error: (err) => console.error("Assignments subscription error:", err),
    });

    return function cleanup() {
      subscription.unsubscribe();
    };
  }, [id]);

  // get all students in this section if the user owns the section
  useEffect(() => {
    if (!section?.code) return;
    // if (!isTeacher || !isOwner) return

    fetchSectionStudents();
    async function fetchSectionStudents() {
      // use ampllify api to get all students in this section
      const currentUserAttributes =
        userAttributes || (await fetchUserAttributes());

      if (currentUserAttributes?.sub !== section.owner) {
        console.log(
          "fetchSectionStudents - not owner",
          currentUserAttributes?.sub,
          section.owner,
        );
        setSectionStudents([
          {
            id: currentUserAttributes?.sub,
            email: currentUserAttributes?.email, // TODO: Determine if email is something we want to expose?
            name: currentUserAttributes?.name || currentUserAttributes?.sub,
            firstName: currentUserAttributes?.given_name || "",
            lastName: currentUserAttributes?.family_name || "",
            preferredName: currentUserAttributes?.preferred_username || "",
          },
        ]);
        return;
      }

      // console.log('fetchSectionStudents.user.username === section.owner', user.username, section.owner)

      const result = await listSectionStudents(section.code);

      console.log("_sectionStudents", result);

      const sectionStudentsData = {};
      console.log("_sectionStudents", result.students);

      // Check if data exists before processing
      if (result.success && result.students) {
        result.students.forEach((sectionStudent) => {
          sectionStudentsData[sectionStudent.id] = sectionStudent;
        });
      }

      console.log("fetchSectionStudents", sectionStudentsData);

      setSectionStudents(sectionStudentsData);
      setIsOwner(true);
    }
  }, [section?.code, rosterRefreshKey]);

  // Fetch leaderboard entries for this section
  useEffect(() => {
    if (!id) return;
    const client = getAmplifyClient();

    const subscription = client.models.StudentProfile.observeQuery({
      filter: { sectionID: { eq: id } },
    }).subscribe({
      next: ({ items }) => {
        const valid = items.filter((item) => item != null && item.id != null);
        setLeaderboardEntries(
          valid.map((e) => ({
            studentId: e.studentId,
            studentName: e.studentName || e.studentId,
            avatarColor: "#6366f1",
            totalXP: e.totalXP || 0,
            level: e.level || 1,
            currentStreak: e.currentStreak || 0,
          })),
        );
      },
      error: (error) => {
        if (error?.message?.includes("exceeds maximum value limit")) {
          console.warn(
            "[SectionDetail] Leaderboard filter limit — using client filtering",
          );
          return;
        }
        if (error?.message?.includes("DuplicatedOperationError")) return;
        console.error("[SectionDetail] Leaderboard subscription error:", error);
      },
    });
    return () => subscription.unsubscribe();
  }, [id]);

  // Fetch squads for this section (by sectionID)
  useEffect(() => {
    if (!id) return;
    const client = getAmplifyClient();
    const subscription = client.models.Squad.observeQuery({
      filter: { sectionID: { eq: id } },
    }).subscribe({
      next: ({ items }) => {
        const valid = items.filter((item) => item != null && item.id != null);
        setSectionSquads(
          valid
            .map((g) => ({
              id: g.id,
              name: g.name,
              totalXP: g.totalXP || 0,
              memberCount: Array.isArray(g.members) ? g.members.length : 0,
            }))
            .sort((a, b) => b.totalXP - a.totalXP),
        );
      },
      error: (error) => {
        if (error?.message?.includes("exceeds maximum value limit")) {
          console.warn(
            "[SectionDetail] Squad filter limit — using client filtering",
          );
          return;
        }
        if (error?.message?.includes("DuplicatedOperationError")) return;
        console.error("[SectionDetail] Squad subscription error:", error);
      },
    });
    return () => subscription.unsubscribe();
  }, [id]);

  // Fetch open collaboration rooms for this section
  useEffect(() => {
    if (!id) return;
    const client = getAmplifyClient();
    const subscription = client.models.HomeworkRoom.observeQuery({
      filter: { sectionID: { eq: id } },
      selectionSet: [
        "id",
        "gradeId",
        "ownerId",
        "sectionID",
        "status",
        "code",
        "invitedUserIds",
        "createdAt",
        "updatedAt",
        "_version",
      ],
    }).subscribe({
      next: ({ items }) => {
        const valid = items.filter(
          (item) =>
            item != null &&
            item.id != null &&
            (item.status === "OPEN" || item.status === "IN_REVIEW"),
        );
        setOpenRooms(
          valid.map((r) => ({
            id: r.id,
            gradeId: r.gradeId,
            ownerId: r.ownerId,
            code: r.code,
            status: r.status,
            invitedUserIds: r.invitedUserIds ?? [],
            createdAt: r.createdAt,
          })),
        );
      },
      error: (error) => {
        const errorMessage =
          error?.message ||
          error?.errors?.[0]?.message ||
          error?.error?.errors?.[0]?.message ||
          "";

        if (errorMessage.includes("exceeds maximum value limit")) return;
        if (errorMessage.includes("DuplicatedOperationError")) return;
        if (
          !errorMessage &&
          error &&
          typeof error === "object" &&
          Object.keys(error).length === 0
        ) {
          console.warn(
            "[SectionDetail] HomeworkRoom subscription: transient empty error payload (safe to ignore)",
          );
          return;
        }

        console.error(
          "[SectionDetail] HomeworkRoom subscription error:",
          error,
        );
      },
    });
    return () => subscription.unsubscribe();
  }, [id]);

  // Filter assignments based on visibility settings
  const visibleAssignments = React.useMemo(() => {
    return sectionAssignments.filter((assignment) => {
      if (
        !isOwner &&
        assignment.studentID &&
        assignment.studentID !== currentUser?.username
      ) {
        return false;
      }
      if (assignment.lateStatus === "DROPPED") return false;
      if (!clientNow) return true;
      // Students cannot see draft assignments
      if (assignment.status === "DRAFT") {
        return isOwner && showDraftAssignments;
      }

      // Filter by due date (assignments with future due dates)
      // Only apply this filter for instructors who have the toggle
      if (assignment.dueDate) {
        const dueDate = new Date(assignment.dueDate);
        if (dueDate > clientNow) {
          return isOwner && showFutureAssignments;
        }
      }

      return true;
    });
  }, [
    sectionAssignments,
    showFutureAssignments,
    showDraftAssignments,
    isOwner,
    clientNow,
    currentUser?.username,
  ]);

  const totalAssignments = sectionAssignments.length;
  const visibleAssignmentsCount = visibleAssignments.length;

  // Calculate curve data for each assignment (using per-assignment method from curveSettings)
  const calculateCurveData = () => {
    const curveData = {};

    visibleAssignments.forEach((assignment) => {
      const setting = curveSettings[assignment.unitID];
      if (!setting) return; // Not curved

      const grades = [];
      Object.values(sectionStudents).forEach((student) => {
        const grade =
          gradeMap[student.id]?.[assignment.unitID]?.highest?.accuracy;
        if (grade !== undefined && grade !== null && !isNaN(grade)) {
          grades.push(grade);
        }
      });

      if (grades.length === 0) {
        curveData[assignment.unitID] = {
          maxScore: 0,
          avgScore: 0,
          adjustment: 0,
          method: setting.method,
        };
        return;
      }

      const maxScore = Math.max(...grades);
      const avgScore = grades.reduce((sum, g) => sum + g, 0) / grades.length;

      // Per-assignment curve method
      let adjustment = 0;
      if (setting.method === "scale-to-top") {
        adjustment = maxScore > 0 ? 100 / maxScore : 1;
      } else if (setting.method === "linear-adjustment") {
        adjustment = 75 - avgScore;
      }

      curveData[assignment.unitID] = {
        maxScore,
        avgScore,
        adjustment,
        method: setting.method,
      };
    });

    return curveData;
  };

  const curveData = calculateCurveData();

  // Apply curve to a grade
  const applyCurve = (grade, assignmentId) => {
    if (!grade || isNaN(grade)) return grade;

    // Only apply curve if this assignment has a curve setting
    const curve = curveData[assignmentId];
    if (!curve) return grade;

    if (curve.method === "scale-to-top") {
      return Math.min(100, Math.round(grade * curve.adjustment));
    } else if (curve.method === "linear-adjustment") {
      return Math.min(100, Math.max(0, Math.round(grade + curve.adjustment)));
    }

    return grade;
  };

  // Resolve a curve method key to a human-readable name for tooltips/labels.
  const getCurveMethodLabel = (method) => {
    if (method === "scale-to-top") return t("sectionDetail.scaleToTopMethod");
    if (method === "linear-adjustment")
      return t("sectionDetail.linearAdjustmentMethod");
    return method;
  };

  // Apply the drafted curve type to every selected target column — "no-curve"
  // clears those columns instead of setting a method.
  const handleApplyCurve = () => {
    setCurveSettings((prev) => {
      const next = { ...prev };
      curveTargetDraft.forEach((unitId) => {
        if (curveMethodDraft === "no-curve") {
          delete next[unitId];
        } else {
          next[unitId] = { method: curveMethodDraft };
        }
      });
      return next;
    });
    setCurveMenuAnchorEl(null);
  };

  const appliedCurveMethods = [
    ...new Set(Object.values(curveSettings).map((setting) => setting.method)),
  ];
  const curveButtonLabel =
    appliedCurveMethods.length === 0
      ? t("sectionDetail.noCurve", "No Curve")
      : appliedCurveMethods.length === 1
        ? getCurveMethodLabel(appliedCurveMethods[0])
        : t("sectionDetail.mixedCurves", "Mixed curves");

  // Save curve settings to section when they change
  useEffect(() => {
    if (!section?.id || !isOwner) return;
    // Skip saving until server data has been loaded at least once
    if (!curveSettingsLoadedRef.current) return;

    const saveCurveSettings = async () => {
      try {
        // Convert internal format { [unitID]: { method } } to schema format [{ unitID, method }]
        const curveSettingsArray = Object.entries(curveSettings).map(
          ([unitID, setting]) => ({
            unitID,
            method: setting.method || "scale-to-top",
          }),
        );
        const { errors } = await client.models.Section.update({
          id: section.id,
          curveSettings: curveSettingsArray,
          _version: section._version,
        });

        if (errors?.length) {
          console.error("Error saving curve settings:", errors);
        }
      } catch (error) {
        console.error("Error saving curve settings:", error);
      }
    };

    // Debounce the save to avoid too many updates
    const timeoutId = setTimeout(saveCurveSettings, 500);
    return () => clearTimeout(timeoutId);
  }, [curveSettings, section?.id, isOwner]);

  // Save gradeOverrides to section (debounced)
  useEffect(() => {
    if (!section?.id || !isOwner || Object.keys(gradeOverrides).length === 0)
      return;
    // Skip saving until server data has been loaded at least once
    if (!gradeOverridesLoadedRef.current) return;

    const saveOverrides = async () => {
      try {
        const { errors } = await client.models.Section.update({
          id: section.id,
          gradeOverrides: JSON.stringify(gradeOverrides),
          _version: section._version,
        });
        if (errors) {
          console.error("Error saving grade overrides:", errors);
        }
      } catch (error) {
        console.error("Error saving grade overrides:", error);
      }
    };

    const timeoutId = setTimeout(saveOverrides, 500);
    return () => clearTimeout(timeoutId);
  }, [gradeOverrides, section?.id, isOwner]);

  // Inline grade override helpers (used by InlineGradeCell)
  const handleInlineOverride = React.useCallback((studentId, unitId, score) => {
    setGradeOverrides((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [unitId]: { score, updatedAt: new Date().toISOString() },
      },
    }));
  }, []);

  const handleInlineRemoveOverride = React.useCallback((studentId, unitId) => {
    setGradeOverrides((prev) => {
      const next = { ...prev };
      if (next[studentId]) {
        const studentOverrides = { ...next[studentId] };
        delete studentOverrides[unitId];
        if (Object.keys(studentOverrides).length === 0) {
          delete next[studentId];
        } else {
          next[studentId] = studentOverrides;
        }
      }
      return next;
    });
  }, []);

  const handleGradeCellClick = (student, assignment, currentGrade) => {
    if (!isOwner) return; // Only instructors can override grades

    // If there's a completed grade, open the grade review drawer
    if (currentGrade?.id && currentGrade?.complete) {
      // Build ordered grade IDs for same assignment across all sorted students
      const gradeIds = sortedStudents
        .map((s) => gradeMap[s.id]?.[assignment.unitID]?.highest)
        .filter((g) => g?.id && g?.complete)
        .map((g) => g.id);
      const currentIndex = gradeIds.indexOf(currentGrade.id);

      setGradeDrawerData({
        gradeId: currentGrade.id,
        unitId: assignment.unitID,
        studentName: formatLastFirst(student),
        gradeIds,
        currentIndex: Math.max(0, currentIndex),
      });
      setGradeDrawerOpen(true);
      return;
    }

    // Otherwise open the quick override dialog
    setOverrideData({ student, assignment, currentGrade });
    setOverrideScore(currentGrade?.accuracy?.toString() || "");
    setGradeOverrideOpen(true);
  };

  const handleGradeOverrideClose = () => {
    setGradeOverrideOpen(false);
    setOverrideData({ student: null, assignment: null, currentGrade: null });
    setOverrideScore("");
  };

  const handleGradeOverrideSave = async () => {
    const score = parseFloat(overrideScore);

    if (isNaN(score) || score < 0 || score > 100) {
      alert(t("sectionDetail.overrideGrade.invalidScore"));
      return;
    }

    try {
      const { student, assignment, currentGrade } = overrideData;

      if (currentGrade) {
        // Update existing grade
        const { errors } = await client.models.Grade.update({
          id: currentGrade.id,
          accuracy: score,
          percentComplete: 100,
          complete: true,
        });

        if (errors) {
          console.error("Error updating grade:", errors);
          alert(t("sectionDetail.overrideGrade.saveFailed"));
          return;
        }
        trackGradeSubmitted(assignment.unitID, currentGrade.id, score, {
          sectionId: assignment.sectionID || undefined,
          overridden: true,
        });
      } else {
        // Create new grade for this student
        const { data: newGrade, errors } = await client.models.Grade.create({
          unitID: assignment.unitID,
          assignmentID: assignment.id,
          owner: student.id, // Student owns the grade so they can see it
          instructor: currentUser?.username,
          accuracy: score,
          percentComplete: 100,
          complete: true,
          data: JSON.stringify({}), // Empty data for manual override
        });

        if (errors) {
          console.error("Error creating grade:", errors);
          alert(t("sectionDetail.overrideGrade.saveFailed"));
          return;
        }
        trackGradeSubmitted(assignment.unitID, newGrade?.id || "", score, {
          sectionId: assignment.sectionID || undefined,
          overridden: true,
        });
      }

      handleGradeOverrideClose();
    } catch (error) {
      console.error("Error saving grade override:", error);
      alert(t("sectionDetail.overrideGrade.saveFailed"));
    }
  };

  // Sort students based on the selected sort mode
  const sortStudents = React.useCallback(
    (students) => {
      if (studentSort === "natural") return students;
      // Many roster records only carry the legacy `name` field, so derive
      // first/last from it when the structured fields are missing.
      const nameParts = (student) => {
        const parts = (student.name || "").trim().split(/\s+/).filter(Boolean);
        const fallback = student.email || student.id || "";
        return {
          first: (
            student.preferredName ||
            student.firstName ||
            parts[0] ||
            fallback
          ).trim(),
          last: (
            student.lastName ||
            parts[parts.length - 1] ||
            fallback
          ).trim(),
        };
      };
      const compare = (x, y) =>
        x.localeCompare(y, undefined, { sensitivity: "base" });
      return [...students].sort((a, b) => {
        const nameA = nameParts(a);
        const nameB = nameParts(b);
        return studentSort === "first"
          ? compare(nameA.first, nameB.first) || compare(nameA.last, nameB.last)
          : compare(nameA.last, nameB.last) ||
              compare(nameA.first, nameB.first);
      });
    },
    [studentSort],
  );

  const sortedStudents = React.useMemo(
    () => sortStudents(Object.values(sectionStudents)),
    [sectionStudents, sortStudents],
  );

  const rosterRows = React.useMemo(
    () =>
      sortedStudents.flatMap((student) => {
        const name = formatLastFirst(student);
        // Search the masked value so the query can't reveal hidden characters.
        const email = maskEmail(student.email || "");
        const nameMatch = fuzzyMatch(studentQuery, name);
        const emailMatch = fuzzyMatch(studentQuery, email);
        if (!nameMatch && !emailMatch) return [];
        return [{ student, name, email, nameMatch, emailMatch }];
      }),
    [sortedStudents, studentQuery],
  );

  React.useEffect(() => {
    if (!isOwner || !sectionAssignments?.length) return;
    sectionAssignments.slice(0, 5).forEach((assignment) => {
      if (assignment?.unitID) router.prefetch(`/unit/${assignment.unitID}`);
    });
  }, [isOwner, sectionAssignments, router]);

  return (
    <>
      {/* Title/description live in the main AppBar (same pattern as the Workbook/Unit editor) */}
      {section &&
        toolbarPortalRef?.current &&
        createPortal(
          <SectionTitleBar
            name={sectionNameInput}
            description={sectionDescriptionInput}
            editable={(isOwner || isTeacher) && !viewAsStudent}
            isScrolled={isAppBarScrolled}
            untitledLabel={t(
              "sectionDetail.untitledSection",
              "Untitled Section",
            )}
            addDescriptionLabel={t(
              "sectionDetail.descriptionPlaceholder",
              "Add a description…",
            )}
            onNameChange={setSectionNameInput}
            onNameBlur={handleSaveSectionName}
            onDescriptionChange={setSectionDescriptionInput}
            onDescriptionBlur={handleSaveSectionDescription}
          />,
          toolbarPortalRef.current,
        )}

      {section && (isOwner || isTeacher) && !viewModeNoticeDismissed && (
        <Alert
          severity={viewAsStudent ? "info" : "warning"}
          onClose={() => setViewModeNoticeDismissed(true)}
          sx={{
            position: "sticky",
            top: appBarHeight || 48,
            zIndex: (theme) => theme.zIndex.appBar - 1,
            transform: noticeTucked
              ? `translateY(calc(-100% - ${appBarHeight || 48}px))`
              : "none",
            transition: reducedMotion
              ? "none"
              : noticeTucked
                ? "transform 150ms cubic-bezier(0.4, 0, 1, 1)"
                : "transform 250ms cubic-bezier(0, 0, 0.2, 1)",
            width: "calc(100% - 2rem)",
            maxWidth: "80rem",
            mx: "auto",
            py: 0,
            borderRadius: 0,
            "& .MuiAlert-message": { py: 0.5 },
          }}
        >
          {viewAsStudent
            ? t(
                "sectionDetail.studentViewNotice",
                "You are previewing student view.",
              )
            : t(
                "sectionDetail.instructorViewNotice",
                "Instructor view is active.",
              )}
        </Alert>
      )}

      {/* Show skeleton while section data is loading — matches loading.tsx */}
      {!section && (
        <Box>
          {/* Section hero card */}
          <Box
            sx={{
              width: "90%",
              maxWidth: "80rem",
              margin: "5rem auto 2rem",
              borderRadius: 2,
              borderLeft: "4px solid",
              borderLeftColor: "primary.main",
              border: 1,
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            {/* Featured image area */}
            <Skeleton variant="rectangular" height={200} />
            {/* Card content */}
            <Box sx={{ p: 2 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}
              >
                <Skeleton variant="text" width="35%" height={32} />
                <Skeleton
                  variant="rectangular"
                  width={100}
                  height={24}
                  sx={{ borderRadius: 0.5 }}
                />
              </Box>
              <Skeleton variant="text" width="60%" height={20} />
            </Box>
          </Box>

          {/* Students table */}
          <Box sx={{ width: "90%", margin: "2rem auto" }}>
            <Skeleton variant="text" width={120} height={28} sx={{ mb: 1 }} />
            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              {/* Table header */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  px: 2,
                  py: 1.5,
                  borderBottom: 1,
                  borderColor: "divider",
                  backgroundColor: "action.hover",
                }}
              >
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="text" width="30%" height={20} />
                <Skeleton variant="text" width="20%" height={20} />
              </Box>
              {/* Table rows */}
              {[0, 1, 2, 3, 4].map((i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    gap: 2,
                    px: 2,
                    py: 1.5,
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  <Skeleton variant="text" width="40%" height={20} />
                  <Skeleton variant="text" width="30%" height={20} />
                  <Skeleton variant="text" width="20%" height={20} />
                </Box>
              ))}
            </Box>
          </Box>

          {/* Gradebook area */}
          <Box sx={{ width: "90%", margin: "2rem auto" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
              <Skeleton variant="text" width={120} height={28} />
              <Box sx={{ flexGrow: 1 }} />
              <Skeleton
                variant="rectangular"
                width={60}
                height={28}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                width={60}
                height={28}
                sx={{ borderRadius: 1 }}
              />
            </Box>
            <Skeleton
              variant="rectangular"
              height={200}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        </Box>
      )}

      {section && (
        <Card
          data-tour="section-card"
          variant="assignment"
          sx={{
            width: "90%",
            margin: "5rem auto",
            maxWidth: "80rem",
            // Keep the hover-lifted elevation while the Configure menu is open —
            // otherwise the mouse leaving for the (portaled) menu drops the card
            // back down mid-interaction, shifting the anchor and clipping the menu.
            ...(Boolean(configureAnchorEl) && {
              boxShadow: (theme) =>
                theme.shadows[SEMANTIC_THEME.elevation.cardHover],
              transform: "translateY(-2px)",
            }),
          }}
        >
          {/* {section?.featuredImage &&
          <CardMediaComponent
          s3Key={section?.featuredImage}
          owner={section?.owner}
        />
        }
        {!section?.featuredImage &&
          <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            // alignItems: 'center',
            // justifyContent: 'center',
            // padding: '1rem',
            // height: '100%',
            // width: '100%',
          }}
          > */}

          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              // padding: '1rem',
              // border: '1px solid black',
              // backgroundColor: 'rgb(255, 255, 255, 0.1)',
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={(e) => {
              console.log("onDragLeaveListItem");
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
          >
            {(isDragging || inProgress) && (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragLeave={(e) => {
                  console.log("onDragLeave");
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                style={{
                  color: "inherit",
                  fontSize: "2rem",
                  fontWeight: "bold",
                  textAlign: "center",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 100,
                  backgroundColor:
                    "var(--mui-palette-action-disabledBackground, rgba(0,0,0,0.12))",
                  backdropFilter: "blur(3px)",
                  verticalAlign: "middle",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  wrap: "wrap",
                }}
              >
                {inProgress && t("sectionDetail.uploadingImage")}
                {isDragging && t("sectionDetail.uploadImagePrompt")}
              </div>
            )}

            {
              section?.featuredImage && (
                <FeaturedImage
                  s3Key={section.featuredImage}
                  identityId={section?.identityId}
                  style={{
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                    maxHeight: "50vh",

                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "inherit",
                    backgroundColor: "transparent",
                  }}
                />
              )

              // </Box>
            }
            {!section?.featuredImage && (
              <EmptyState
                icon={<FiImage />}
                title={t("sectionDetail.noFeaturedImage")}
                description={t("sectionDetail.dragAndDropPrompt")}
                dense
                isDragActive={isDragging}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                ctaLabel={t("sectionDetail.browseFiles", "or browse files")}
                onCtaClick={() => imageFileInputRef.current?.click()}
                sx={{ m: 2 }}
              />
            )}
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageFileInputChange}
            />
          </div>

          {/* Cover video — display only; editing happens via the Configure menu's modal */}
          {section?.featuredVideo &&
            (isOwner || isTeacher) &&
            !viewAsStudent && (
              <Box sx={{ px: 2, pt: 2 }}>
                <Box
                  sx={{ width: "100%", borderRadius: 1, overflow: "hidden" }}
                >
                  <video
                    src={section.featuredVideo}
                    controls
                    style={{ width: "100%", maxHeight: 200, display: "block" }}
                  />
                </Box>
              </Box>
            )}

          {/* Footer — Configure (secondary, left) and Copy Join Code (primary, right) */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
              p: 2,
              mt: 1,
            }}
          >
            {isOwner || isTeacher ? (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<ArrowDropDownIcon />}
                  onClick={(event) => setConfigureAnchorEl(event.currentTarget)}
                >
                  {t("sectionDetail.configure", "Configure")}
                </Button>
                <Menu
                  anchorEl={configureAnchorEl}
                  open={Boolean(configureAnchorEl)}
                  onClose={() => setConfigureAnchorEl(null)}
                  // Force a real portal: Card always has `overflow: hidden`
                  // baked in by MUI, so an inline-rendered menu gets clipped
                  // at the card's edge (Storybook's MuiModal default even
                  // disables portals globally — override it here).
                  disablePortal={false}
                >
                  <MenuItem
                    onClick={() => {
                      setSkillTreeOpen(true);
                      setConfigureAnchorEl(null);
                    }}
                  >
                    <AccountTreeIcon fontSize="small" sx={{ mr: 1 }} />
                    {t("sectionDetail.skills", "Skills")}
                  </MenuItem>
                  {isOwner && [
                    <Divider key="view-mode-divider" />,
                    <MenuItem
                      key="instructor-view"
                      selected={!viewAsStudent}
                      onClick={() => {
                        handleViewAsStudentChange(false);
                        setConfigureAnchorEl(null);
                      }}
                    >
                      {t(
                        "sectionDetail.showInstructorView",
                        "Show Instructor View",
                      )}
                    </MenuItem>,
                    <MenuItem
                      key="student-view"
                      selected={viewAsStudent}
                      onClick={() => {
                        handleViewAsStudentChange(true);
                        setConfigureAnchorEl(null);
                      }}
                    >
                      {t("sectionDetail.showStudentView", "Show Student View")}
                    </MenuItem>,
                  ]}
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      setImageDialogOpen(true);
                      setConfigureAnchorEl(null);
                    }}
                  >
                    {t(
                      "sectionDetail.editFeaturedImage",
                      "Edit featured image",
                    )}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setCoverVideoUrlInput(section?.featuredVideo || "");
                      setCoverVideoDialogOpen(true);
                      setConfigureAnchorEl(null);
                    }}
                  >
                    {t(
                      "sectionDetail.editFeaturedVideo",
                      "Edit featured video",
                    )}
                  </MenuItem>
                  {isOwner && [
                    <Divider key="delete-divider" />,
                    <MenuItem
                      key="delete-section"
                      onClick={() => {
                        setConfigureAnchorEl(null);
                        handleDeleteSection();
                      }}
                      sx={{ color: "error.main" }}
                    >
                      <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                      {t("sectionDetail.deleteSection")}
                    </MenuItem>,
                  ]}
                </Menu>
                <React.Suspense fallback={null}>
                  {id && (
                    <SkillTreePopupButton
                      sectionId={id}
                      hideTrigger
                      open={skillTreeOpen}
                      onOpenChange={setSkillTreeOpen}
                    />
                  )}
                </React.Suspense>
              </>
            ) : (
              <span />
            )}
            <Tooltip
              title={
                joinCodeCopied
                  ? t("sectionDetail.copied", "Copied!")
                  : t("sectionDetail.copyJoinCode", "Copy Join Code")
              }
              arrow
            >
              <Button
                data-tour="join-code"
                variant="contained"
                size="small"
                startIcon={joinCodeCopied ? <CheckIcon /> : <ContentCopyIcon />}
                onClick={handleCopyJoinCode}
                aria-label={`${t("sectionDetail.copyJoinCode", "Copy Join Code")}: ${section?.code || ""}`}
                sx={{ fontFamily: "monospace", letterSpacing: "0.05em" }}
              >
                {section?.code || ""}
              </Button>
            </Tooltip>
          </Box>
        </Card>
      )}

      {/* Edit featured image — drop/upload target + remove */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t("sectionDetail.editFeaturedImage", "Edit featured image")}
        </DialogTitle>
        <DialogContent>
          {section?.featuredImage && (
            <Box sx={{ mb: 2, borderRadius: 1, overflow: "hidden" }}>
              <FeaturedImage
                s3Key={section.featuredImage}
                identityId={section?.identityId}
                style={{
                  objectFit: "cover",
                  width: "100%",
                  maxHeight: 200,
                  display: "block",
                }}
              />
            </Box>
          )}
          <EmptyState
            icon={<FiImage />}
            title={t("sectionDetail.noFeaturedImage")}
            description={t("sectionDetail.dragAndDropPrompt")}
            dense
            isDragActive={isDragging}
            onDragOver={handleDragOver}
            onDrop={(event) => {
              handleDrop(event);
              setImageDialogOpen(false);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            ctaLabel={t("sectionDetail.browseFiles", "or browse files")}
            onCtaClick={() => imageFileInputRef.current?.click()}
          />
        </DialogContent>
        <DialogActions>
          {section?.featuredImage && (
            <Button
              color="error"
              onClick={() => {
                handleRemoveSectionFeaturedImage();
                setImageDialogOpen(false);
              }}
              sx={{ mr: "auto" }}
            >
              {t("sectionDetail.removeFeaturedImage", "Remove image")}
            </Button>
          )}
          <Button onClick={() => setImageDialogOpen(false)}>
            {tCommon("actions.close", "Close")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={coverVideoDialogOpen}
        onClose={() => setCoverVideoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("sectionDetail.setCoverVideo")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            size="small"
            fullWidth
            label={t("sectionDetail.coverVideoUrlLabel")}
            placeholder={t("sectionDetail.coverVideoUrlPlaceholder")}
            value={coverVideoUrlInput}
            onChange={(e) => setCoverVideoUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && coverVideoUrlInput.trim()) {
                handleSaveSectionCoverVideo();
                setCoverVideoDialogOpen(false);
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          {section?.featuredVideo && (
            <Button
              color="error"
              onClick={() => {
                handleRemoveSectionCoverVideo();
                setCoverVideoDialogOpen(false);
              }}
              sx={{ mr: "auto" }}
            >
              {t("sectionDetail.removeCoverVideo")}
            </Button>
          )}
          <Button onClick={() => setCoverVideoDialogOpen(false)}>
            {tCommon("actions.cancel", "Cancel")}
          </Button>
          <Button
            variant="contained"
            disabled={!coverVideoUrlInput.trim()}
            onClick={() => {
              handleSaveSectionCoverVideo();
              setCoverVideoDialogOpen(false);
            }}
          >
            {t("sectionDetail.saveCoverVideo")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tab navigation — keeps the Gradebook/Leaderboard/Collaboration modules
          from all stacking on one scroll axis. Defaults to Assignments. */}
      {section && (
        <Box
          sx={{
            width: "90%",
            maxWidth: "80rem",
            mx: "auto",
            mt: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_event, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label={t("sectionDetail.assignments")} value="assignments" />
            {(isOwner || isTeacher) && !viewAsStudent && (
              <Tab label={t("sectionDetail.students")} value="students" />
            )}
            {(isOwner || isTeacher) && !viewAsStudent && (
              <Tab label={t("sectionDetail.gradebook")} value="gradebook" />
            )}
            {(isOwner || isTeacher) && !viewAsStudent && (
              <Tab
                label={t("sectionDetail.campaign", "Campaign")}
                value="campaign"
              />
            )}
            {leaderboardEnabledLocal && (
              <Tab
                label={t("sectionDetail.leaderboard", "Leaderboard")}
                value="leaderboard"
              />
            )}
            <Tab
              label={t("sectionDetail.collaboration", "Collaboration")}
              value="collaboration"
            />
          </Tabs>
        </Box>
      )}

      {/* Campaign progress panel — instructor only */}
      {section &&
        (isOwner || isTeacher) &&
        !viewAsStudent &&
        activeTab === "campaign" && (
          <Box
            id="gamification-section"
            sx={{ width: "90%", maxWidth: "80rem", mx: "auto", mt: 2 }}
          >
            <GamificationQuickPanel sectionId={id} locale={locale} />
          </Box>
        )}

      {Object.keys(sectionStudents).length > 0 &&
        (isOwner || isTeacher) &&
        !viewAsStudent &&
        activeTab === "students" && (
          <Paper
            id="nav-section-students"
            variant="outlined"
            sx={{
              width: "90%",
              maxWidth: "80rem",
              mx: "auto",
              mt: 2,
              mb: 6,
              overflow: "hidden",
            }}
          >
            <Toolbar
              disableGutters
              sx={{
                px: 1.5,
                py: 1,
                gap: 1,
                flexWrap: "wrap",
                minHeight: "auto !important",
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              {isOwner && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AccessibilityNewIcon />}
                  onClick={() => setAccommodationsDialogOpen(true)}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {t("sectionDetail.accommodations", "Accommodations")}
                </Button>
              )}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="student-sort-label">Sort by</InputLabel>
                <Select
                  labelId="student-sort-label"
                  value={studentSort}
                  label="Sort by"
                  onChange={(e) => setStudentSort(e.target.value)}
                >
                  <MenuItem value="natural">Original</MenuItem>
                  <MenuItem value="first">First Name</MenuItem>
                  <MenuItem value="last">Last Name</MenuItem>
                </Select>
              </FormControl>
              <TextField
                type="search"
                size="small"
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                placeholder={t(
                  "sectionDetail.searchStudents",
                  "Search students",
                )}
                sx={{ flex: "1 1 220px", minWidth: 180 }}
                slotProps={{
                  htmlInput: {
                    "aria-label": t(
                      "sectionDetail.searchStudents",
                      "Search students",
                    ),
                  },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              {isOwner && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAddAlt1Icon />}
                  onClick={() => setEnrollDialogOpen(true)}
                  sx={{ whiteSpace: "nowrap", ml: "auto" }}
                >
                  {t("sectionDetail.addStudents", "Add students")}
                </Button>
              )}
            </Toolbar>

            <TableContainer
              data-testid="roster-table"
              sx={{ overflowX: "auto" }}
            >
              <Table
                aria-label={t("sectionDetail.students")}
                size="small"
                sx={{
                  "& .MuiTableCell-root": { py: 0.5, whiteSpace: "nowrap" },
                  "& .roster-name, & .roster-actions": { width: "1%" },
                }}
              >
                <TableHead
                  sx={{
                    "& .MuiTableCell-head": {
                      typography: "subtitle1",
                      fontWeight: 600,
                      py: 1,
                    },
                  }}
                >
                  <TableRow>
                    <TableCell className="roster-name">
                      {t("sectionDetail.studentHeader")}
                    </TableCell>
                    <TableCell>{t("sectionDetail.emailHeader")}</TableCell>
                    <TableCell align="right" className="roster-actions">
                      {t("sectionDetail.actionsHeader")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rosterRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t(
                            "sectionDetail.noStudentsMatch",
                            "No students match your search.",
                          )}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {rosterRows.map(
                    ({ student, name, email, nameMatch, emailMatch }) => {
                      const accommodation = getStudentAccommodation(
                        accommodations,
                        student.id,
                      );
                      const showAccommodation = hasAccommodation(accommodation);
                      const accommodationLabel = showAccommodation
                        ? [
                            Number(accommodation.dueDateExtensionDays) > 0
                              ? `+${accommodation.dueDateExtensionDays}d`
                              : null,
                            Number(accommodation.timeMultiplier) > 1
                              ? `${accommodation.timeMultiplier}×`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : "";
                      return (
                        <TableRow
                          key={student.id}
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                            "&:nth-of-type(odd)": {
                              backgroundColor: "action.hover",
                            },
                            "& td, & th": { backgroundColor: "inherit" },
                          }}
                        >
                          <TableCell
                            component="th"
                            scope="row"
                            className="roster-name"
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <span>
                                <HighlightedText
                                  text={name}
                                  indices={nameMatch?.indices}
                                />
                              </span>
                              {showAccommodation && (
                                <Tooltip
                                  title={
                                    accommodation.note ||
                                    t(
                                      "sectionDetail.accommodations",
                                      "Accommodations",
                                    )
                                  }
                                >
                                  <Chip
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                    icon={
                                      <AccessibilityNewIcon fontSize="small" />
                                    }
                                    label={
                                      accommodationLabel ||
                                      t(
                                        "sectionDetail.accommodations",
                                        "Accommodations",
                                      )
                                    }
                                    onClick={
                                      isOwner
                                        ? () =>
                                            setAccommodationsDialogOpen(true)
                                        : undefined
                                    }
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <HighlightedText
                              text={email}
                              indices={emailMatch?.indices}
                            />
                          </TableCell>
                          <TableCell align="right" className="roster-actions">
                            <IconButton
                              size="small"
                              edge="end"
                              aria-label={tCommon("actions.delete")}
                              onClick={() => handleDelete(student)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    },
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

      {activeTab === gradebookTabKey && (
        <Box
          sx={{
            width: "90%",
            maxWidth: "80rem",
            padding: "1rem",
            marginBottom: "3rem",
            margin: "0 auto",
          }}
        >
          {/* Needs Attention strip — instructor action queue (Item 7) */}
          {isOwner && !viewAsStudent && (
            <NeedsAttention
              sectionID={section?.id}
              assignments={sectionAssignments}
              grades={grades}
              students={sortedStudents}
              openRooms={openRooms}
              onAssignUnit={() => setAssignmentComposerOpen(true)}
            />
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              padding: "1rem",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                id="nav-section-gradebook"
                variant="h5"
                component="div"
                sx={{ lineHeight: 1.2 }}
              >
                {t("sectionDetail.gradebook")}
              </Typography>
              {visibleAssignmentsCount < totalAssignments && isOwner && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component="div"
                >
                  {t("sectionDetail.showingAssignments", {
                    visible: visibleAssignmentsCount,
                    total: totalAssignments,
                  })}
                </Typography>
              )}
            </Box>

            {/* Instructor-only controls */}
            {isOwner && !viewAsStudent && (
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={showFutureAssignments}
                      onChange={(e) =>
                        setShowFutureAssignments(e.target.checked)
                      }
                      color="primary"
                      size="small"
                    />
                  }
                  label={t("sectionDetail.showFutureAssignments")}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={showDraftAssignments}
                      onChange={(e) =>
                        setShowDraftAssignments(e.target.checked)
                      }
                      color="primary"
                      size="small"
                    />
                  }
                  label={t("sectionDetail.showDraftAssignments")}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={leaderboardEnabledLocal}
                      onChange={async (e) => {
                        const checked = e.target.checked;
                        setLeaderboardEnabledLocal(checked);
                        try {
                          const client = getAmplifyClient();
                          await client.models.Section.update({
                            id: section.id,
                            leaderboardEnabled: checked,
                            _version: section._version,
                          });
                        } catch (err) {
                          console.error(
                            "Error updating leaderboardEnabled:",
                            err,
                          );
                          setLeaderboardEnabledLocal(!checked);
                        }
                      }}
                      color="primary"
                      size="small"
                    />
                  }
                  label={t(
                    "sectionDetail.leaderboardEnabled",
                    "Show Leaderboard",
                  )}
                />

                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setAssignmentComposerOpen(true)}
                  startIcon={<AddIcon />}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {t("sectionDetail.assignUnit", "Assign Unit")}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setBulkDueDateOpen(true)}
                  startIcon={<EditCalendarIcon />}
                  disabled={sectionAssignments.length === 0}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {t("sectionDetail.shiftDueDates", "Shift dates")}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ChatBubbleOutlineIcon />}
                  onClick={() =>
                    openDiscussion({
                      sectionID: section?.id,
                      scope: "section",
                      topicName: section?.name || "Section discussion",
                    })
                  }
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {t("sectionDetail.discuss", "Discuss")}
                </Button>
              </Box>
            )}
          </Box>

          {/* Curve controls — unified type + target dropdown replaces the old select/clear-all toggles */}
          {isOwner && !viewAsStudent && (
            <Box
              sx={{
                padding: "0 1rem 0.5rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant={hasCurve ? "contained" : "outlined"}
                size="small"
                endIcon={<ArrowDropDownIcon />}
                aria-haspopup="dialog"
                aria-expanded={Boolean(curveMenuAnchorEl)}
                onClick={(event) => setCurveMenuAnchorEl(event.currentTarget)}
                sx={{ whiteSpace: "nowrap" }}
              >
                {t("sectionDetail.curve", "Curve")}: {curveButtonLabel}
                {hasCurve &&
                  ` (${Object.keys(curveSettings).length}/${visibleAssignments.length})`}
              </Button>
              <Popover
                open={Boolean(curveMenuAnchorEl)}
                anchorEl={curveMenuAnchorEl}
                onClose={() => setCurveMenuAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                disablePortal={false}
                slotProps={{
                  paper: { sx: { p: 2, width: 320, maxWidth: "90vw" } },
                }}
              >
                <FormLabel
                  id="curve-method-label"
                  sx={{ typography: "subtitle2" }}
                >
                  {t("sectionDetail.curveType", "Curve type")}
                </FormLabel>
                <RadioGroup
                  aria-labelledby="curve-method-label"
                  value={curveMethodDraft}
                  onChange={(e) => setCurveMethodDraft(e.target.value)}
                  sx={{ mb: 1 }}
                >
                  <FormControlLabel
                    value="no-curve"
                    control={<Radio size="small" />}
                    label={t("sectionDetail.noCurve", "No Curve")}
                  />
                  <FormControlLabel
                    value="scale-to-top"
                    control={<Radio size="small" />}
                    label={t("sectionDetail.scaleToTopMethod")}
                  />
                  <FormControlLabel
                    value="linear-adjustment"
                    control={<Radio size="small" />}
                    label={t("sectionDetail.linearAdjustmentMethod")}
                  />
                </RadioGroup>
                <Divider sx={{ mb: 1 }} />
                <FormLabel component="div" sx={{ typography: "subtitle2" }}>
                  {t("sectionDetail.applyTo", "Apply to")}
                </FormLabel>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={
                        visibleAssignments.length > 0 &&
                        curveTargetDraft.length === visibleAssignments.length
                      }
                      indeterminate={
                        curveTargetDraft.length > 0 &&
                        curveTargetDraft.length < visibleAssignments.length
                      }
                      onChange={(e) =>
                        setCurveTargetDraft(
                          e.target.checked
                            ? visibleAssignments.map((a) => a.unitID)
                            : [],
                        )
                      }
                    />
                  }
                  label={t("sectionDetail.allAssignments", "All Assignments")}
                />
                <Box sx={{ pl: 2, maxHeight: 220, overflowY: "auto" }}>
                  {visibleAssignments.map((a) => {
                    const appliedMethod = curveSettings[a.unitID]?.method;
                    return (
                      <FormControlLabel
                        key={a.unitID}
                        sx={{ display: "flex", mr: 0 }}
                        control={
                          <Checkbox
                            size="small"
                            checked={curveTargetDraft.includes(a.unitID)}
                            onChange={(e) =>
                              setCurveTargetDraft((prev) =>
                                e.target.checked
                                  ? [...prev, a.unitID]
                                  : prev.filter((id) => id !== a.unitID),
                              )
                            }
                          />
                        }
                        label={
                          <Box
                            component="span"
                            sx={{ display: "flex", gap: 1 }}
                          >
                            <span>{units[a.unitID]?.name || a.unitID}</span>
                            {appliedMethod && (
                              <Typography
                                component="span"
                                variant="caption"
                                color="primary"
                              >
                                {getCurveMethodLabel(appliedMethod)}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    );
                  })}
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 1,
                    mt: 1,
                  }}
                >
                  <Button
                    size="small"
                    onClick={() => setCurveMenuAnchorEl(null)}
                  >
                    {tCommon("actions.cancel", "Cancel")}
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={curveTargetDraft.length === 0}
                    onClick={handleApplyCurve}
                  >
                    {t("sectionDetail.applyCurve", "Apply Curve")}
                  </Button>
                </Box>
              </Popover>
            </Box>
          )}

          {/* Curve Debug Information - only show for selected assignments */}
          {isOwner && !viewAsStudent && hasCurve && (
            <Box sx={{ padding: "0 1rem 1rem 1rem" }}>
              <Typography variant="caption" color="text.secondary">
                {t("sectionDetail.curveDebugInfo")}
                {Object.entries(curveSettings)
                  .map(([unitId, setting]) => {
                    const data = curveData[unitId];
                    if (!data) return "";
                    const unitName = units[unitId]?.name || unitId;
                    if (setting.method === "scale-to-top") {
                      return ` ${unitName}: max=${data.maxScore.toFixed(1)}%, scale=${data.adjustment.toFixed(2)}x`;
                    } else {
                      return ` ${unitName}: avg=${data.avgScore.toFixed(1)}%, adjust=+${data.adjustment.toFixed(1)}%`;
                    }
                  })
                  .filter(Boolean)
                  .join(" | ")}
              </Typography>
            </Box>
          )}

          {/* Student View - Assignments with lock progression + Chapters */}
          {(!isOwner || viewAsStudent) && (
            <>
              <TableContainer
                component={Paper}
                sx={{ overflowX: "auto" }}
                data-testid="student-grade-table"
              >
                <Table
                  aria-label={t("sectionDetail.gradebook")}
                  size="small"
                  sx={{ minWidth: 400 }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        {t("sectionDetail.assignmentHeader")}
                      </TableCell>
                      <TableCell>
                        {t("sectionDetail.chapterHeader", {
                          defaultValue: "Chapter",
                        })}
                      </TableCell>
                      <TableCell align="right">
                        {t("sectionDetail.gradeHeader")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleAssignments.map((assignment) => {
                      const isDraft = assignment.status === "DRAFT";
                      const isFuture =
                        clientNow &&
                        assignment.dueDate &&
                        new Date(assignment.dueDate) > clientNow;
                      const canHaveGrades = !isDraft && !isFuture;

                      const locked = isLocked(assignment.unitID);
                      const lockStatus = getLockStatus(assignment.unitID);

                      const studentId = currentUser?.username;
                      const rawHighest = canHaveGrades
                        ? myGradeMap[assignment.unitID]?.highest?.accuracy
                        : undefined;
                      const grade =
                        rawHighest !== undefined &&
                        rawHighest !== null &&
                        !isNaN(rawHighest)
                          ? `${Math.round(rawHighest)}%`
                          : "-";

                      // Find which campaign chapter links to this unit
                      const rowLinkedChapter = [
                        ...(activeChallenges || []),
                        ...(completedChallenges || []),
                      ]
                        .filter((c) => c.sectionID === id)
                        .find(
                          (c) =>
                            Array.isArray(c.linkedUnitIds) &&
                            c.linkedUnitIds.includes(assignment.unitID),
                        );

                      return (
                        <TableRow
                          key={assignment.id}
                          onClick={() =>
                            !locked &&
                            setSelectedRow(
                              selectedRow === assignment.id
                                ? null
                                : assignment.id,
                            )
                          }
                          sx={{
                            cursor: locked ? "not-allowed" : "pointer",
                            opacity: locked ? 0.6 : 1,
                            backgroundColor:
                              selectedRow === assignment.id
                                ? "action.selected"
                                : "transparent",
                            "&:nth-of-type(odd)": {
                              backgroundColor:
                                selectedRow === assignment.id
                                  ? "action.selected"
                                  : "action.hover",
                            },
                            "&:hover": {
                              backgroundColor: locked
                                ? "transparent"
                                : selectedRow === assignment.id
                                  ? "action.selected"
                                  : "action.hover",
                            },
                            "& td": { backgroundColor: "inherit" },
                            transition: "background-color 0.2s ease",
                          }}
                        >
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                minWidth: 0,
                                gap: 1,
                              }}
                            >
                              <Box
                                component="span"
                                sx={{
                                  minWidth: 0,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {units[assignment.unitID]?.name}
                              </Box>
                              {locked && (
                                <Tooltip
                                  title={
                                    lockStatus?.unlockDate
                                      ? `Unlocks on ${new Date(lockStatus.unlockDate).toLocaleDateString()}`
                                      : lockStatus?.requiredPriorUnitName
                                        ? `Complete "${lockStatus.requiredPriorUnitName}" first`
                                        : "Complete the previous assignment first"
                                  }
                                >
                                  <LockIcon fontSize="small" color="action" />
                                </Tooltip>
                              )}
                              {!locked && (
                                <PrefetchBadge
                                  unitId={assignment.unitID}
                                  client={client}
                                  username={currentUser?.username}
                                  section={section}
                                  assignment={assignment}
                                  iconOnly
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {rowLinkedChapter ? (
                              <Chip
                                label={
                                  rowLinkedChapter.chapterOrder != null
                                    ? `Ch. ${rowLinkedChapter.chapterOrder}: ${rowLinkedChapter.title}`
                                    : rowLinkedChapter.title
                                }
                                size="small"
                                color="primary"
                                variant="outlined"
                                clickable
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setChapterPopoverAnchor(e.currentTarget);
                                  setChapterPopoverData(rowLinkedChapter);
                                }}
                                sx={{
                                  fontSize: "0.7rem",
                                  height: 22,
                                  cursor: "pointer",
                                }}
                              />
                            ) : (
                              <Typography
                                variant="caption"
                                color="text.disabled"
                              >
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: 0.5,
                              }}
                            >
                              {locked ? (
                                <Chip
                                  size="small"
                                  label={
                                    lockStatus?.unlockDate
                                      ? `Unlocks ${new Date(lockStatus.unlockDate).toLocaleDateString()}`
                                      : "Locked"
                                  }
                                  color="default"
                                  variant="outlined"
                                  icon={<LockIcon />}
                                />
                              ) : (
                                <>
                                  {grade}
                                  {canHaveGrades && (
                                    <Tooltip title="Open Workbook">
                                      <IconButton
                                        size="small"
                                        component="a"
                                        href={`/workbook/${assignment.unitID}`}
                                        onClick={(e) => e.stopPropagation()}
                                        sx={{ p: 0.25 }}
                                      >
                                        <MenuBookIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Total Row */}
                    <TableRow
                      sx={{
                        backgroundColor: "action.hover",
                        "& td": { backgroundColor: "inherit" },
                      }}
                    >
                      <TableCell sx={{ fontWeight: "bold" }}>
                        {t("sectionDetail.totalAverage")}
                      </TableCell>
                      <TableCell />
                      {/* Chapter column — no total */}
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        {(() => {
                          let totalGrade = 0;
                          let completedCount = 0;

                          visibleAssignments.forEach((assignment) => {
                            const isDraft = assignment.status === "DRAFT";
                            const isFuture =
                              clientNow &&
                              assignment.dueDate &&
                              new Date(assignment.dueDate) > clientNow;
                            const canHaveGrades = !isDraft && !isFuture;

                            if (canHaveGrades) {
                              const grade =
                                myGradeMap[assignment.unitID]?.highest
                                  ?.accuracy;
                              if (
                                grade !== undefined &&
                                grade !== null &&
                                !isNaN(grade)
                              ) {
                                totalGrade += grade;
                                completedCount++;
                              }
                            }
                          });

                          const average =
                            completedCount > 0
                              ? Math.round(totalGrade / completedCount)
                              : 0;
                          const completion =
                            visibleAssignments.length > 0
                              ? Math.round(
                                  (completedCount / visibleAssignments.length) *
                                    100,
                                )
                              : 0;

                          return completedCount > 0
                            ? `${average}% (${completion}% complete)`
                            : "- (0% complete)";
                        })()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Campaign Chapters */}
              {(() => {
                const allChallenges = [
                  ...(activeChallenges || []),
                  ...(completedChallenges || []),
                ];
                const sectionChallenges = allChallenges.filter(
                  (ch) => ch.sectionID === id,
                );
                if (sectionChallenges.length === 0) return null;

                const chapters = sectionChallenges
                  .sort((a, b) => (a.chapterOrder ?? 0) - (b.chapterOrder ?? 0))
                  .map((ch) => {
                    const challengeLocked = isLocked(ch.id);
                    return {
                      id: ch.id,
                      title: ch.title,
                      setting: ch.setting || undefined,
                      targetXP: ch.targetXP,
                      currentXP: ch.currentXP || 0,
                      // If locked by progression, override active to false so timeline shows lock icon
                      active: challengeLocked ? false : ch.active,
                    };
                  });

                return (
                  <Box sx={{ mt: 3 }}>
                    <CampaignTimeline chapters={chapters} />
                  </Box>
                );
              })()}
            </>
          )}

          {/* Instructor View - Full Gradebook */}
          {isOwner && !viewAsStudent && (
            <GradeCellRegistryContext.Provider
              value={gradeCellRegistryRef.current}
            >
              <TableContainer
                component={Paper}
                sx={{ overflowX: "auto" }}
                data-testid="gradebook-table"
              >
                <Table
                  aria-label={t("sectionDetail.assignments")}
                  size="small"
                  sx={{ minWidth: 650, tableLayout: "auto" }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          position: "sticky",
                          left: 0,
                          top: 0,
                          backgroundColor: "background.paper",
                          zIndex: 11,
                          minWidth: 150,
                          boxSizing: "border-box",
                          boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
                          borderRight: 2,
                          borderRightColor: "divider",
                        }}
                      >
                        {t("sectionDetail.learnerHeader")}
                      </TableCell>
                      {visibleAssignments.map((assignment) => {
                        const unitName = units[assignment.unitID]?.name;
                        const isDraft = assignment.status === "DRAFT";
                        const isFuture =
                          clientNow &&
                          assignment.dueDate &&
                          new Date(assignment.dueDate) > clientNow;
                        const curveMethod =
                          curveSettings[assignment.unitID]?.method || "";

                        return (
                          <TableCell
                            align="right"
                            key={assignment.id}
                            sx={{
                              position: "sticky",
                              top: 0,
                              zIndex: 2,
                              backgroundColor: curveMethod
                                ? "primary.50"
                                : "background.paper",
                              ...(curveMethod && {
                                borderBottom: "2px solid",
                                borderBottomColor: "primary.main",
                              }),
                            }}
                          >
                            <Tooltip
                              title={
                                curveMethod
                                  ? `${t("sectionDetail.curveApplied", "Curve applied")}: ${getCurveMethodLabel(curveMethod)}`
                                  : ""
                              }
                              arrow
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-end",
                                  gap: 0.5,
                                }}
                              >
                                {unitName}
                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                  {isDraft && (
                                    <Chip
                                      label="Draft"
                                      size="small"
                                      color="warning"
                                    />
                                  )}
                                  {isFuture && (
                                    <Chip
                                      label="Future"
                                      size="small"
                                      color="info"
                                    />
                                  )}
                                  {assignment.lateStatus && (
                                    <Chip
                                      label={`Late: ${assignment.lateStatus}`}
                                      size="small"
                                      color={
                                        assignment.lateStatus === "DROPPED"
                                          ? "default"
                                          : "warning"
                                      }
                                    />
                                  )}
                                </Box>
                                {curveMethod && (
                                  <Typography
                                    variant="caption"
                                    color="primary"
                                    sx={{ fontWeight: 600 }}
                                  >
                                    {getCurveMethodLabel(curveMethod)}
                                  </Typography>
                                )}
                              </Box>
                            </Tooltip>
                          </TableCell>
                        );
                      })}
                      <TableCell
                        align="right"
                        sx={{
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                          fontWeight: "bold",
                          backgroundColor: "action.hover",
                        }}
                      >
                        {t("sectionDetail.totalHeader", "Total")}{" "}
                        <Typography
                          component="span"
                          variant="inherit"
                          sx={{ fontWeight: 400, color: "text.disabled" }}
                        >
                          ({t("sectionDetail.completionHeader", "Completion")})
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedStudents.map((student, studentKey) => {
                      // Calculate totals for this student
                      let totalGrade = 0;
                      let totalCurvedGrade = 0;
                      let completedAssignments = 0;

                      visibleAssignments.forEach((assignment) => {
                        // Only count grades for published, non-future assignments
                        const isDraft = assignment.status === "DRAFT";
                        const isFuture =
                          clientNow &&
                          assignment.dueDate &&
                          new Date(assignment.dueDate) > clientNow;
                        const canHaveGrades = !isDraft && !isFuture;

                        if (canHaveGrades) {
                          const highest =
                            gradeMap[student.id]?.[assignment.unitID]?.highest
                              ?.accuracy;
                          if (
                            highest !== undefined &&
                            highest !== null &&
                            !isNaN(highest)
                          ) {
                            totalGrade += highest;
                            const curvedGrade = applyCurve(
                              highest,
                              assignment.unitID,
                            );
                            totalCurvedGrade += curvedGrade;
                            completedAssignments++;
                          }
                        }
                      });

                      const averageGrade =
                        completedAssignments > 0
                          ? Math.round(totalGrade / completedAssignments)
                          : 0;
                      const averageCurvedGrade =
                        completedAssignments > 0
                          ? Math.round(totalCurvedGrade / completedAssignments)
                          : 0;
                      const completionPercentage =
                        visibleAssignments.length > 0
                          ? Math.round(
                              (completedAssignments /
                                visibleAssignments.length) *
                                100,
                            )
                          : 0;

                      const displayAverage = hasCurve
                        ? averageCurvedGrade
                        : averageGrade;

                      return (
                        <TableRow
                          key={student.id}
                          onClick={() =>
                            setSelectedRow(
                              selectedRow === student.id ? null : student.id,
                            )
                          }
                          sx={{
                            "&:last-child td, &:last-child th": {
                              borderBottom: 0,
                            },
                            cursor: "pointer",
                            backgroundColor:
                              selectedRow === student.id
                                ? "action.selected"
                                : "background.paper",
                            "&:nth-of-type(odd)": {
                              backgroundColor:
                                selectedRow === student.id
                                  ? "action.selected"
                                  : "action.hover",
                            },
                            "&:hover": {
                              backgroundColor:
                                selectedRow === student.id
                                  ? "action.selected"
                                  : "action.hover",
                            },
                            "& td, & th": { backgroundColor: "inherit" },
                            transition: "background-color 0.2s ease",
                          }}
                        >
                          <TableCell
                            component="th"
                            scope="row"
                            key={studentKey}
                            sx={{
                              position: "sticky",
                              left: 0,
                              backgroundColor: "inherit",
                              zIndex: 9,
                              minWidth: 150,
                              boxSizing: "border-box",
                              boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
                              borderRight: 2,
                              borderRightColor: "divider",
                            }}
                          >
                            {formatLastFirst(student)}
                          </TableCell>
                          {visibleAssignments.map((assignment, colIndex) => {
                            console.log("student.id", student.id);
                            console.log("assignment.unitID", assignment.unitID);

                            // Future and draft assignments cannot have grades yet
                            const isDraft = assignment.status === "DRAFT";
                            const isFuture =
                              clientNow &&
                              assignment.dueDate &&
                              new Date(assignment.dueDate) > clientNow;
                            const canHaveGrades = !isDraft && !isFuture;

                            console.log(
                              "gradeMap[student.id]?.[assignment.unitID]",
                              gradeMap[student.id]?.[assignment.unitID],
                            );
                            const rawHighest = canHaveGrades
                              ? gradeMap[student.id]?.[assignment.unitID]
                                  ?.highest?.accuracy
                              : undefined;
                            const rawAverage = canHaveGrades
                              ? gradeMap[student.id]?.[assignment.unitID]
                                  ?.average
                              : undefined;

                            const highest =
                              rawHighest !== undefined &&
                              rawHighest !== null &&
                              !isNaN(rawHighest)
                                ? Math.round(
                                    applyCurve(rawHighest, assignment.unitID),
                                  )
                                : "-";
                            const average =
                              rawAverage !== undefined &&
                              rawAverage !== null &&
                              !isNaN(rawAverage)
                                ? Math.round(
                                    applyCurve(rawAverage, assignment.unitID),
                                  )
                                : "-";

                            // Debug logging for curve verification
                            if (
                              hasCurve &&
                              rawHighest !== undefined &&
                              rawHighest !== null
                            ) {
                              console.log(
                                `[CURVE] Student: ${student.name}, Assignment: ${units[assignment.unitID]?.name}`,
                              );
                              console.log(
                                `  Raw Highest: ${rawHighest}%, Curved: ${highest}%`,
                              );
                              console.log(
                                `  Curve Data:`,
                                curveData[assignment.unitID],
                              );
                            }

                            const colGrade =
                              highest !== "-" ? `${highest}%` : "—";
                            const gradeRecord =
                              gradeMap[student.id]?.[assignment.unitID]
                                ?.highest;
                            const override =
                              gradeOverrides[student.id]?.[assignment.unitID];
                            const preCurveLabel =
                              rawHighest !== undefined &&
                              rawHighest !== null &&
                              !isNaN(rawHighest)
                                ? `${Math.round(rawHighest)}%`
                                : undefined;

                            return (
                              <TableCell align="right" key={assignment.id}>
                                <InlineGradeCell
                                  computedGrade={colGrade}
                                  rawHighest={rawHighest}
                                  preCurveLabel={preCurveLabel}
                                  curveApplied={Boolean(
                                    curveSettings[assignment.unitID],
                                  )}
                                  overrideScore={override?.score}
                                  sharedHistory={gradebookHistoryRef.current}
                                  isOwner={isOwner}
                                  row={studentKey}
                                  col={colIndex}
                                  onOverride={(score) =>
                                    handleInlineOverride(
                                      student.id,
                                      assignment.unitID,
                                      score,
                                    )
                                  }
                                  onRemoveOverride={() =>
                                    handleInlineRemoveOverride(
                                      student.id,
                                      assignment.unitID,
                                    )
                                  }
                                  onGradeClick={() =>
                                    handleGradeCellClick(
                                      student,
                                      assignment,
                                      gradeRecord,
                                    )
                                  }
                                />
                              </TableCell>
                            );
                          })}
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: "bold",
                              backgroundColor: "action.hover",
                              color:
                                completionPercentage === 100
                                  ? "success.main"
                                  : "text.secondary",
                            }}
                          >
                            {completedAssignments > 0
                              ? `${displayAverage}%`
                              : "-"}{" "}
                            <Typography
                              component="span"
                              variant="inherit"
                              sx={{ fontWeight: 400, color: "text.disabled" }}
                            >
                              ({completionPercentage}%)
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </GradeCellRegistryContext.Provider>
          )}
        </Box>
      )}

      {/* Completion Grid — folded into the Gradebook/Assignments tab content
          (same data scope as the grid above) instead of a separate module. */}
      {activeTab === gradebookTabKey &&
        sectionAssignments &&
        Object.keys(sectionStudents).length > 0 && (
          <Box
            sx={{ width: "90%", maxWidth: "80rem", mx: "auto", mt: 2, mb: 3 }}
          >
            <Typography id="nav-section-completion" variant="h6" sx={{ mb: 1 }}>
              {t("sectionDetail.completionGrid", "Completion Overview")}
            </Typography>
            <CompletionGrid
              assignments={visibleAssignments.map((a) => ({
                id: a.id || a.unitID,
                title: units[a.unitID]?.name || a.unitID,
              }))}
              students={((isOwner || isTeacher) && !viewAsStudent
                ? sortedStudents
                : sortedStudents.filter(
                    (student) => student.id === currentUser?.username,
                  )
              ).map((student) => ({
                studentId: student.id,
                studentName: formatLastFirst(student),
                assignments: visibleAssignments.reduce((acc, assignment) => {
                  const allGrade = allGradeMap[student.id]?.[assignment.unitID];
                  if (allGrade?.hasComplete) {
                    acc[assignment.id || assignment.unitID] = "completed";
                  } else if (allGrade?.hasAny) {
                    acc[assignment.id || assignment.unitID] = "in_progress";
                  } else {
                    acc[assignment.id || assignment.unitID] = "not_started";
                  }
                  return acc;
                }, {}),
              }))}
              currentStudentId={currentUser?.username || ""}
            />
          </Box>
        )}

      {/* Leaderboard — XP-based ranking per section (shows when enabled) */}
      {activeTab === "leaderboard" && leaderboardEnabledLocal && (
        <Box sx={{ p: 2, mx: "auto", maxWidth: "80rem", mt: 2 }}>
          <Typography id="nav-section-leaderboard" variant="h6" sx={{ mb: 1 }}>
            {t("sectionDetail.leaderboard", "Leaderboard")}
          </Typography>
          {leaderboardEntries.length > 0 ? (
            <LeaderboardTable
              entries={leaderboardEntries}
              currentStudentId={currentUser?.username || ""}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t(
                "sectionDetail.noLeaderboardEntries",
                "No leaderboard data yet. Students will appear here as they earn XP.",
              )}
            </Typography>
          )}
        </Box>
      )}

      {/* Squads — show squads belonging to this section */}
      {activeTab === "leaderboard" && isOwner && sectionSquads.length > 0 && (
        <Box sx={{ p: 2, mx: "auto", maxWidth: "80rem", mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t("sectionDetail.squads", "Squads")}
          </Typography>
          <SquadLeaderboard squads={sectionSquads} />
        </Box>
      )}

      {/* Open Collaboration Rooms */}
      {activeTab === "collaboration" && (
        <Box
          sx={{
            p: 2,
            mx: "auto",
            maxWidth: "80rem",
            mt: 2,
            bgcolor: "action.hover",
            borderRadius: `${SEMANTIC_THEME.radius.panel}px`,
          }}
        >
          <OpenCollaborationRooms
            rooms={openRooms}
            grades={grades}
            units={units}
            sectionStudents={sectionStudents || {}}
            sectionId={id}
            isInstructor={isOwner}
            onJoinRoom={(roomId) => router.push(`/review/${roomId}`)}
            onAssignPeerReview={async (gradeId, ownerId, reviewerIds) => {
              const result = await createPeerReviewRoom(
                gradeId,
                reviewerIds,
                id,
                ownerId,
              );
              if (!result.success)
                throw new Error(result.error || "Failed to create room");
            }}
            onRandomAssign={async (unitId) => {
              const result = await randomAssignPeerReview(id, unitId);
              if (!result.success)
                throw new Error(result.error || "Failed to random assign");
            }}
            onAwardTopReviewer={async (unitId) => {
              const result = await awardTopReviewerXP(id, unitId);
              if (!result.success)
                throw new Error(result.error || "Failed to award XP");
            }}
          />
        </Box>
      )}

      {!sectionAssignments && section && activeTab === "assignments" && (
        <Box sx={{ p: 3, maxWidth: "80rem", mx: "auto" }}>
          <Skeleton variant="text" width="30%" height={36} sx={{ mb: 2 }} />
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={80}
              sx={{ borderRadius: 1, mb: 2 }}
            />
          ))}
        </Box>
      )}
      {sectionAssignments && activeTab === "assignments" && (
        <Box
          data-tour="assignments-section"
          style={{
            padding: "1rem",
            marginBottom: "3rem",
            margin: "1rem auto",
            maxWidth: "80rem",
          }}
        >
          <Typography
            id="nav-section-assignments"
            variant="h5"
            component="div"
            sx={{ flexGrow: 1, padding: "1rem", margin: "1rem auto" }}
          >
            {t("sectionDetail.assignments")}
          </Typography>

          {[...sectionAssignments]
            .sort((a, b) => {
              // Chronological order; undated assignments sink to the bottom.
              const aTime = a.dueDate
                ? new Date(a.dueDate).getTime()
                : Infinity;
              const bTime = b.dueDate
                ? new Date(b.dueDate).getTime()
                : Infinity;
              return aTime - bTime;
            })
            .map(function (assignment) {
              const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              const dueLabel = assignment.dueDate
                ? `Due: ${new Date(assignment.dueDate).toLocaleString(undefined, { timeZone })}`
                : t("sectionDetail.noDueDate", "No due date");
              const featuredImage = units[assignment.unitID]?.featuredImage;
              const identityId = units[assignment.unitID]?.identityId;

              const workbookUrl = `/workbook/${assignment.unitID}`;

              // Find which campaign chapter links to this unit
              const allSectionChallenges = [
                ...(activeChallenges || []),
                ...(completedChallenges || []),
              ].filter((c) => c.sectionID === id);
              const linkedChapter = allSectionChallenges.find(
                (c) =>
                  Array.isArray(c.linkedUnitIds) &&
                  c.linkedUnitIds.includes(assignment.unitID),
              );

              return (
                <AssignmentFeedCard
                  key={assignment.id || assignment.unitID}
                  unitName={units[assignment.unitID]?.name}
                  description={units[assignment.unitID]?.description}
                  dueLabel={dueLabel}
                  featuredImage={featuredImage}
                  identityId={identityId}
                  workbookUrl={workbookUrl}
                  viewWorkbookLabel={t("sectionDetail.viewWorkbook")}
                  disabled={work}
                  linkedChapter={linkedChapter}
                  onOpenChapter={(event) => {
                    setChapterPopoverAnchor(event.currentTarget);
                    setChapterPopoverData(linkedChapter);
                  }}
                  editUnitUrl={
                    (isOwner || isTeacher) && !viewAsStudent
                      ? `/unit/${assignment.unitID}`
                      : undefined
                  }
                  editUnitLabel={t("sectionDetail.editUnit", "Edit Unit")}
                />
              );
            })}
        </Box>
      )}

      {/* Grade Override Dialog */}
      <Dialog open={gradeOverrideOpen} onClose={handleGradeOverrideClose}>
        <DialogTitle>{t("sectionDetail.overrideGrade.title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {overrideData.student && overrideData.assignment && (
              <>
                {t("sectionDetail.overrideGrade.student")}{" "}
                <strong>
                  {overrideData.student &&
                    formatLastFirst(overrideData.student)}
                </strong>
                <br />
                {t("sectionDetail.overrideGrade.assignment")}{" "}
                <strong>{units[overrideData.assignment.unitID]?.name}</strong>
                <br />
                {t("sectionDetail.overrideGrade.currentGrade")}{" "}
                <strong>
                  {overrideData.currentGrade?.accuracy
                    ? `${Math.round(overrideData.currentGrade.accuracy)}%`
                    : t("sectionDetail.overrideGrade.noGrade")}
                </strong>
                <br />
                <br />
                {t("sectionDetail.overrideGrade.prompt")}
              </>
            )}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label={t("sectionDetail.overrideGrade.label")}
            type="number"
            fullWidth
            variant="outlined"
            value={overrideScore}
            onChange={(e) => setOverrideScore(e.target.value)}
            inputProps={{ min: 0, max: 100, step: 0.01 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleGradeOverrideClose}>
            {t("sectionDetail.overrideGrade.cancel")}
          </Button>
          <Button
            onClick={handleGradeOverrideSave}
            variant="contained"
            color="primary"
          >
            {t("sectionDetail.overrideGrade.save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Grade Review Drawer */}
      <GradeReviewDrawer
        open={gradeDrawerOpen}
        onClose={() => setGradeDrawerOpen(false)}
        gradeId={gradeDrawerData.gradeId}
        unitId={gradeDrawerData.unitId}
        studentName={gradeDrawerData.studentName}
        gradeIds={gradeDrawerData.gradeIds}
        currentIndex={gradeDrawerData.currentIndex}
        onNavigate={(index) => {
          const nextGradeId = gradeDrawerData.gradeIds[index];
          if (!nextGradeId) return;
          // Find the student name for the navigated grade
          const studentForGrade = sortedStudents.find(
            (s) =>
              gradeMap[s.id]?.[gradeDrawerData.unitId]?.highest?.id ===
              nextGradeId,
          );
          setGradeDrawerData((prev) => ({
            ...prev,
            gradeId: nextGradeId,
            currentIndex: index,
            studentName: studentForGrade
              ? formatLastFirst(studentForGrade)
              : prev.studentName,
          }));
        }}
      />

      {/* Chapter Detail Popover */}
      <ChapterDetailPopover
        anchorEl={chapterPopoverAnchor}
        onClose={() => {
          setChapterPopoverAnchor(null);
          setChapterPopoverData(null);
        }}
        chapter={chapterPopoverData}
      />

      {/* Assignment Composer — section-first workflow (Item 3 & 4) */}
      <AssignmentComposer
        open={assignmentComposerOpen}
        onClose={() => setAssignmentComposerOpen(false)}
        units={allUnits}
        sections={[section].filter(Boolean)}
        onSuccess={() => {
          // Trigger refetch of assignments if needed
          // The subscription will auto-update
        }}
      />

      {/* Roster batch enrollment */}
      <RosterEnrollDialog
        open={enrollDialogOpen}
        onClose={() => setEnrollDialogOpen(false)}
        sectionId={section?.id}
        onEnrolled={refreshRoster}
      />

      {/* Per-student accommodations */}
      <AccommodationsDialog
        open={accommodationsDialogOpen}
        onClose={() => setAccommodationsDialogOpen(false)}
        students={sortedStudents}
        accommodations={accommodations}
        onSave={saveAccommodations}
        formatName={formatLastFirst}
      />

      {/* Bulk assignment due-date shifts */}
      <BulkDueDateDialog
        open={bulkDueDateOpen}
        onClose={() => setBulkDueDateOpen(false)}
        assignments={sectionAssignments}
        getUnitName={getUnitName}
        onUpdated={() => {
          // Assignment subscription auto-updates the gradebook.
        }}
      />
    </>
  );
}
function WrappedPage({ initialSection, initialAssignments }) {
  return (
    <SectionDetail
      initialSection={initialSection}
      initialAssignments={initialAssignments}
    />
  );
}

export default WrappedPage;
export { SectionDetail };
