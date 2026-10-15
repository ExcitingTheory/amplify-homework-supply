"use client";

/**
 * NotificationList — Filterable list of notifications with category tabs,
 * "mark all as read" button, and empty state.
 */

import React, { useState, useMemo, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Collapse from "@mui/material/Collapse";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import ChecklistIcon from "@mui/icons-material/Checklist";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import WorkIcon from "@mui/icons-material/Work";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useNotifications } from "../context/notificationContext";
import AuthContext from "../context/authContext";
import NotificationCard from "./NotificationCard";
import JobsDashboard from "./JobsDashboard";

const CATEGORIES = [
  "ALL",
  "ASSIGNMENT",
  "COLLABORATION",
  "GAMIFICATION",
  "MODERATION",
  "SQUAD",
  "GUILD",
  "CHAT",
  "SYSTEM",
] as const;

interface NotificationListProps {
  onNavigate?: (path: string) => void;
}

export default function NotificationList({
  onNavigate,
}: NotificationListProps) {
  const t = useTranslations("components");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const navigate = onNavigate ?? ((path: string) => router.push(path));
  const {
    notifications,
    unseenCount,
    unseenByCategory,
    loading,
    markSeen,
    markInteracted,
    markAllSeen,
    deleteNotification,
    hideNotifications,
    restoreNotification,
    restoreNotifications,
    deleteNotificationForever,
    deleteNotificationsForever,
  } = useNotifications();
  const { session } = React.useContext(AuthContext);

  const isAdminOrInstructor = useMemo(() => {
    const groups: string[] = (session as any)?.groups ?? [];
    return groups.includes("Admins") || groups.includes("Instructors");
  }, [session]);

  // JOBS_TAB_INDEX is one past the last CATEGORIES index
  const JOBS_TAB_INDEX = CATEGORIES.length;

  const [selectedCategory, setSelectedCategory] = useState(0);
  const [view, setView] = useState<"inbox" | "recycleBin">("inbox");
  const [viewedExpanded, setViewedExpanded] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    body: string;
    onConfirm: () => void;
  } | null>(null);

  const activeNotifications = useMemo(
    () => notifications.filter((n) => !n.hiddenAt),
    [notifications],
  );
  const hiddenNotifications = useMemo(
    () => notifications.filter((n) => n.hiddenAt),
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    if (selectedCategory === 0) return activeNotifications;
    const cat = CATEGORIES[selectedCategory];
    return activeNotifications.filter((n) => n.category === cat);
  }, [activeNotifications, selectedCategory]);

  const unseenList = useMemo(
    () => filteredNotifications.filter((n) => !n.seen),
    [filteredNotifications],
  );
  const viewedList = useMemo(
    () => filteredNotifications.filter((n) => n.seen),
    [filteredNotifications],
  );

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const visibleIdsForSelectAll = useMemo(() => {
    if (view === "recycleBin") return hiddenNotifications.map((n) => n.id);
    return [...unseenList, ...viewedList].map((n) => n.id);
  }, [view, hiddenNotifications, unseenList, viewedList]);

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === visibleIdsForSelectAll.length
        ? new Set()
        : new Set(visibleIdsForSelectAll),
    );
  }, [visibleIdsForSelectAll]);

  // Switching between Inbox/Recycle Bin or categories should clear any active selection.
  const handleViewChange = useCallback(
    (_: unknown, next: "inbox" | "recycleBin" | null) => {
      if (!next) return;
      setView(next);
      exitSelectMode();
    },
    [exitSelectMode],
  );

  const selectedCount = selectedIds.size;

  const handleDeleteSelected = () => {
    hideNotifications?.(Array.from(selectedIds));
    exitSelectMode();
  };

  const handleRestoreSelected = () => {
    restoreNotifications?.(Array.from(selectedIds));
    exitSelectMode();
  };

  const handleDeleteForeverSelected = () => {
    const ids = Array.from(selectedIds);
    setConfirmDialog({
      title: t("notification.confirmDeleteForeverTitle"),
      body: t("notification.confirmDeleteForeverBody"),
      onConfirm: () => {
        deleteNotificationsForever?.(ids);
        exitSelectMode();
        setConfirmDialog(null);
      },
    });
  };

  const handleDeleteAllViewed = () => {
    hideNotifications?.(viewedList.map((n) => n.id));
  };

  const handleEmptyRecycleBin = () => {
    const ids = hiddenNotifications.map((n) => n.id);
    setConfirmDialog({
      title: t("notification.confirmEmptyRecycleBinTitle"),
      body: t("notification.confirmEmptyRecycleBinBody", { count: ids.length }),
      onConfirm: () => {
        deleteNotificationsForever?.(ids);
        setConfirmDialog(null);
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={72}
            sx={{ borderRadius: 1, mb: 1 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          pb: 1,
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h5">
            {view === "inbox"
              ? t("notification.title")
              : t("notification.recycleBin")}
          </Typography>
          {view === "inbox" && unseenCount > 0 && (
            <Chip label={unseenCount} size="small" color="error" />
          )}
          {view === "recycleBin" && hiddenNotifications.length > 0 && (
            <Chip label={hiddenNotifications.length} size="small" />
          )}
        </Box>

        {selectMode ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="body2" color="text.secondary">
              {t("notification.selectedCount", { count: selectedCount })}
            </Typography>
            <Button size="small" onClick={handleSelectAll}>
              {t("notification.selectAll")}
            </Button>
            {view === "inbox" ? (
              <Button
                size="small"
                disabled={selectedCount === 0}
                startIcon={<DeleteOutlineIcon />}
                onClick={handleDeleteSelected}
              >
                {t("notification.deleteSelected")}
              </Button>
            ) : (
              <>
                <Button
                  size="small"
                  disabled={selectedCount === 0}
                  onClick={handleRestoreSelected}
                >
                  {t("notification.restoreSelected")}
                </Button>
                <Button
                  size="small"
                  color="error"
                  disabled={selectedCount === 0}
                  onClick={handleDeleteForeverSelected}
                >
                  {t("notification.deleteForeverSelected")}
                </Button>
              </>
            )}
            <Button size="small" onClick={exitSelectMode}>
              {tCommon("actions.cancel")}
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {view === "inbox" && unseenCount > 0 && (
              <Button
                size="small"
                startIcon={<DoneAllIcon />}
                onClick={markAllSeen}
              >
                {t("notification.markAllRead")}
              </Button>
            )}
            {view === "recycleBin" && hiddenNotifications.length > 0 && (
              <Button
                size="small"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={handleEmptyRecycleBin}
              >
                {t("notification.emptyRecycleBinAction")}
              </Button>
            )}
            <Tooltip title={t("notification.select")}>
              <IconButton size="small" onClick={() => setSelectMode(true)}>
                <ChecklistIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Inbox / Recycle bin toggle */}
      <Box sx={{ px: 2, pb: 1 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={handleViewChange}
        >
          <ToggleButton value="inbox">{t("notification.inbox")}</ToggleButton>
          <ToggleButton value="recycleBin">
            {t("notification.recycleBin")}
            {hiddenNotifications.length > 0 && (
              <Chip
                label={hiddenNotifications.length}
                size="small"
                sx={{ ml: 0.75, height: 18, fontSize: "0.65rem" }}
              />
            )}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {view === "inbox" && (
        <Tabs
          value={selectedCategory}
          onChange={(_, v) => setSelectedCategory(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
        >
          {CATEGORIES.map((cat) => {
            const count =
              cat === "ALL" ? unseenCount : unseenByCategory[cat] || 0;
            return (
              <Tab
                key={cat}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {t(`notification.category.${cat.toLowerCase()}`)}
                    {count > 0 && (
                      <Chip
                        label={count}
                        size="small"
                        color="error"
                        sx={{ height: 18, fontSize: "0.65rem" }}
                      />
                    )}
                  </Box>
                }
              />
            );
          })}
          {isAdminOrInstructor && (
            <Tab
              key="jobs"
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <WorkIcon sx={{ fontSize: 16 }} />
                  Jobs
                </Box>
              }
            />
          )}
        </Tabs>
      )}

      {view === "recycleBin" ? (
        hiddenNotifications.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 6,
              px: 2,
            }}
          >
            <DeleteOutlineIcon
              sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
            />
            <Typography variant="body1" color="text.secondary">
              {t("notification.emptyRecycleBin")}
            </Typography>
            <Typography variant="body2" color="text.disabled">
              {t("notification.emptyRecycleBinDescription")}
            </Typography>
          </Box>
        ) : (
          <Box>
            {hiddenNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onRestore={restoreNotification}
                onDeleteForever={deleteNotificationForever}
                selectable={selectMode}
                selected={selectedIds.has(notification.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </Box>
        )
      ) : isAdminOrInstructor && selectedCategory === JOBS_TAB_INDEX ? (
        <JobsDashboard compact />
      ) : selectedCategory < CATEGORIES.length &&
        unseenList.length === 0 &&
        viewedList.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 6,
            px: 2,
          }}
        >
          <NotificationsNoneIcon
            sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
          />
          <Typography variant="body1" color="text.secondary">
            {t("notification.empty")}
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {t("notification.emptyDescription")}
          </Typography>
        </Box>
      ) : selectedCategory < CATEGORIES.length ? (
        <Box>
          {unseenList.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkSeen={markSeen}
              onMarkInteracted={markInteracted}
              onDelete={deleteNotification}
              onNavigate={navigate}
              selectable={selectMode}
              selected={selectedIds.has(notification.id)}
              onToggleSelect={toggleSelect}
            />
          ))}

          {viewedList.length > 0 && (
            <>
              <Box
                onClick={() => setViewedExpanded((prev) => !prev)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1,
                  cursor: "pointer",
                  borderBottom: 1,
                  borderColor: "divider",
                  "&:hover": { backgroundColor: "action.hover" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {viewedExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  <Typography variant="subtitle2" color="text.secondary">
                    {t("notification.viewed")} ({viewedList.length})
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAllViewed();
                  }}
                >
                  {t("notification.deleteAll")}
                </Button>
              </Box>
              <Collapse in={viewedExpanded}>
                {viewedList.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkSeen={markSeen}
                    onMarkInteracted={markInteracted}
                    onDelete={deleteNotification}
                    onNavigate={navigate}
                    selectable={selectMode}
                    selected={selectedIds.has(notification.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </Collapse>
            </>
          )}
        </Box>
      ) : null}

      <Dialog open={Boolean(confirmDialog)} onClose={() => setConfirmDialog(null)}>
        <DialogTitle>{confirmDialog?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog?.body}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>
            {tCommon("actions.cancel")}
          </Button>
          <Button color="error" onClick={() => confirmDialog?.onConfirm()}>
            {tCommon("actions.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
