"use client";
/**
 * @fileoverview CollaborationDialog — Unified dialog for viewing collaboration
 * invitations and joining sessions (Practice, Workbook, Peer Review).
 * Replaces the separate JoinPracticeDialog, JoinWorkbookDialog, and
 * JoinPeerReviewDialog with a single entry point.
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Skeleton,
  Alert,
  Tabs,
  Tab,
  Box,
  Badge,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import EditNoteIcon from "@mui/icons-material/EditNote";
import RateReviewIcon from "@mui/icons-material/RateReview";
import { useTranslations } from "next-intl";
import { getAmplifyClient } from "../utils/amplifyClient";
import { joinPeerReview as joinPeerReviewAction } from "../../app/actions/section";
import NotificationInvitations from "./Notifications/NotificationInvitations";
import { useNotifications } from "../context/notificationContext";

// ============================================================================
// Types
// ============================================================================

type JoinType = "practice" | "workbook" | "peerReview";

export interface CollaborationDialogProps {
  open: boolean;
  onClose: () => void;
  onJoinPractice: (session: {
    sessionId: string;
    roomCode: string;
    unitID: string;
    blockCount: number;
    maxParticipants: number;
    participantCount: number;
  }) => void;
  onJoinWorkbook: (info: { unitId: string; gradeId: string }) => void;
  onJoinPeerReview: (info: { roomId: string; gradeId?: string }) => void;
}

const COLLABORATION_TYPES = [
  "PRACTICE_SESSION_INVITE",
  "WORKBOOK_SESSION_INVITE",
  "PEER_REVIEW_INVITE",
  "HOMEWORK_ROOM_OPENED",
];

// ============================================================================
// Component
// ============================================================================

export default function CollaborationDialog({
  open,
  onClose,
  onJoinPractice,
  onJoinWorkbook,
  onJoinPeerReview,
}: CollaborationDialogProps) {
  const t = useTranslations("components");
  const tCommon = useTranslations("common");
  const { notifications } = useNotifications();

  // Compute invitation count for badge
  const invitationCount = useMemo(
    () =>
      notifications.filter(
        (n) =>
          typeof n.type === "string" &&
          COLLABORATION_TYPES.includes(n.type) &&
          !n.interacted,
      ).length,
    [notifications],
  );

  // Tab state: 0 = Invitations, 1 = Join
  const [tab, setTab] = useState(0);
  const [joinType, setJoinType] = useState<JoinType>("practice");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-switch to Invitations tab when there are pending invitations
  useEffect(() => {
    if (open && invitationCount > 0) {
      setTab(0);
    }
  }, [open, invitationCount]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setInput("");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      if (joinType === "practice") {
        value = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
      } else {
        value = value.trim();
      }
      setInput(value);
      setError(null);
    },
    [joinType],
  );

  const handleJoin = useCallback(async () => {
    if (!input) {
      setError(
        t(
          "collaboration.emptyInput",
          { defaultValue: "Please enter a code or link" },
        ),
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (joinType === "practice") {
        if (input.length < 4) {
          setError(
            t(
              "practiceDrill.join.codeTooShort",
              { defaultValue: "Room code must be at least 4 characters" },
            ),
          );
          setLoading(false);
          return;
        }
        const client = getAmplifyClient();
        const { data: sessions, errors } =
          await client.models.PracticeSession.listPracticeSessionByRoomCode({
            roomCode: input,
          });
        if (errors && errors.length > 0) {
          throw new Error(errors[0]?.message || "Failed to look up session");
        }
        const activeSession = (sessions || []).find(
          (s: any) => s != null && s.collaborative && !s.complete,
        );
        if (!activeSession) {
          setError(
            t(
              "practiceDrill.join.notFound",
              { defaultValue: "No active session found with that code" },
            ),
          );
          setLoading(false);
          return;
        }
        const participantIds: string[] = activeSession.participantIds
          ? typeof activeSession.participantIds === "string"
            ? JSON.parse(activeSession.participantIds)
            : activeSession.participantIds
          : [];
        const maxParticipants = activeSession.maxParticipants || 10;
        if (participantIds.length >= maxParticipants) {
          setError(t("practiceDrill.join.full", { max: maxParticipants }));
          setLoading(false);
          return;
        }
        onJoinPractice({
          sessionId: activeSession.id,
          roomCode: input,
          unitID: activeSession.unitID || "",
          blockCount: activeSession.blockCount || 0,
          maxParticipants,
          participantCount: participantIds.length,
        });
      } else if (joinType === "workbook") {
        let unitId = input;
        const urlMatch = input.match(/\/workbook\/([a-zA-Z0-9-]+)/);
        if (urlMatch) unitId = urlMatch[1];
        const client = getAmplifyClient();
        const { data: unit, errors } = await client.models.Unit.get({
          id: unitId,
        });
        if (errors?.length || !unit) {
          setError(
            t("workbook.joinDialog.notFound"),
          );
          setLoading(false);
          return;
        }
        onJoinWorkbook({ unitId: unit.id, gradeId: "" });
      } else if (joinType === "peerReview") {
        const result = await joinPeerReviewAction(input);
        if (!result.success) {
          throw new Error(result.error || "Failed to join peer review");
        }
        onJoinPeerReview({ roomId: result.roomId! });
      }

      // Reset on success
      setInput("");
      setError(null);
    } catch (err: any) {
      console.error("[CollaborationDialog] Error:", err);
      setError(
        err.message ||
          t("collaboration.error"),
      );
    } finally {
      setLoading(false);
    }
  }, [input, joinType, onJoinPractice, onJoinWorkbook, onJoinPeerReview, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && input && !loading) {
        handleJoin();
      }
    },
    [handleJoin, input, loading],
  );

  const handleInvitationJoin = useCallback(
    (notification: any) => {
      const meta = notification.metadata
        ? typeof notification.metadata === "string"
          ? JSON.parse(notification.metadata)
          : notification.metadata
        : {};
      const type: string = notification.type || "";

      if (type === "PRACTICE_SESSION_INVITE" && meta.roomCode) {
        setJoinType("practice");
        setInput(meta.roomCode);
        setTab(1);
      } else if (type === "WORKBOOK_SESSION_INVITE" && notification.linkPath) {
        const match = notification.linkPath.match(
          /\/workbook\/([a-zA-Z0-9-]+)/,
        );
        if (match) {
          onJoinWorkbook({ unitId: match[1], gradeId: "" });
          onClose();
        }
      } else if (type === "PEER_REVIEW_INVITE" && notification.linkPath) {
        const match = notification.linkPath.match(
          /\/review\/([a-zA-Z0-9-]+)/,
        );
        if (match) {
          onJoinPeerReview({ roomId: match[1] });
          onClose();
        }
      } else if (type === "HOMEWORK_ROOM_OPENED" && notification.linkPath) {
        // Navigate directly via the linkPath
        onClose();
        window.location.href = notification.linkPath;
      }
    },
    [onJoinWorkbook, onJoinPeerReview, onClose],
  );

  // Input label and placeholder vary by join type
  const inputConfig = useMemo(() => {
    switch (joinType) {
      case "practice":
        return {
          label: t("practiceDrill.join.codeLabel"),
          placeholder: "ABC123",
          inputProps: {
            maxLength: 8,
            style: {
              textAlign: "center" as const,
              fontSize: "1.5rem",
              letterSpacing: "0.3em",
              fontFamily: "monospace",
            },
          },
        };
      case "workbook":
        return {
          label: t("workbook.joinDialog.inputLabel"),
          placeholder: "https://...workbook/abc-123 or abc-123",
          inputProps: {},
        };
      case "peerReview":
        return {
          label: t("peerReview.joinDialog.codeLabel"),
          placeholder: "room-abc123",
          inputProps: {},
        };
    }
  }, [joinType, t]);

  // Join button icon
  const joinIcon = useMemo(() => {
    if (loading) return <Skeleton variant="circular" width={16} height={16} />;
    switch (joinType) {
      case "practice":
        return <GroupsIcon />;
      case "workbook":
        return <EditNoteIcon />;
      case "peerReview":
        return <RateReviewIcon />;
    }
  }, [joinType, loading]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="collaboration-dialog-title"
    >
      <DialogTitle
        id="collaboration-dialog-title"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <GroupsIcon color="primary" />
        {t("collaboration.title")}
      </DialogTitle>

      <DialogContent>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            label={
              <Badge
                badgeContent={invitationCount}
                color="error"
                max={99}
                sx={{ "& .MuiBadge-badge": { right: -12, top: 2 } }}
              >
                {t("collaboration.tabInvitations")}
              </Badge>
            }
          />
          <Tab label={t("collaboration.tabJoin")} />
        </Tabs>

        {/* --- Invitations Tab --- */}
        {tab === 0 && (
          <NotificationInvitations
            types={COLLABORATION_TYPES}
            onJoin={handleInvitationJoin}
            joinLabel={t("collaboration.joinButton")}
            emptyMessage={t(
              "collaboration.noInvitations",
              { defaultValue: "No pending collaboration invitations" },
            )}
          />
        )}

        {/* --- Join Tab --- */}
        {tab === 1 && (
          <Box>
            <ToggleButtonGroup
              value={joinType}
              exclusive
              onChange={(_, v) => {
                if (v) {
                  setJoinType(v);
                  setInput("");
                  setError(null);
                }
              }}
              size="small"
              fullWidth
              sx={{ mb: 2 }}
            >
              <ToggleButton value="practice">
                <GroupsIcon sx={{ mr: 0.5, fontSize: 18 }} />
                {t("collaboration.typePractice")}
              </ToggleButton>
              <ToggleButton value="workbook">
                <EditNoteIcon sx={{ mr: 0.5, fontSize: 18 }} />
                {t("collaboration.typeWorkbook")}
              </ToggleButton>
              <ToggleButton value="peerReview">
                <RateReviewIcon sx={{ mr: 0.5, fontSize: 18 }} />
                {t("collaboration.typePeerReview")}
              </ToggleButton>
            </ToggleButtonGroup>

            <TextField
              autoFocus
              fullWidth
              label={inputConfig.label}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={inputConfig.placeholder}
              disabled={loading}
              inputProps={inputConfig.inputProps}
              sx={{ mb: 1 }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {tCommon("actions.cancel", { defaultValue: "Cancel" })}
        </Button>
        {tab === 1 && (
          <Button
            variant="contained"
            onClick={handleJoin}
            disabled={!input || loading}
            startIcon={joinIcon}
          >
            {loading
              ? t("collaboration.joining")
              : t("collaboration.joinButton")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
