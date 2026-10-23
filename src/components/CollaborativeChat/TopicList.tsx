"use client";

/**
 * TopicList — Displays chat topics filtered by current scope.
 *
 * Shows pinned topics at top, filterable by section/unit/workbook context.
 * Includes a "Create Topic" button and online user indicators.
 *
 * @module CollaborativeChat/TopicList
 */

import React, { useState, useMemo } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Badge,
  Divider,
  InputAdornment,
} from "@mui/material";
import TagIcon from "@mui/icons-material/Tag";
import PushPinIcon from "@mui/icons-material/PushPin";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import CircleIcon from "@mui/icons-material/Circle";
import { useTranslations } from "next-intl";
import type { ChatTopic, TopicScope, ChatUser } from "./types";

export interface TopicListProps {
  topics: ChatTopic[];
  selectedTopicId: string | null;
  onSelectTopic: (topicId: string) => void;
  onCreateTopic: (name: string, scope: TopicScope) => void;
  onPinTopic?: (topicId: string, pinned: boolean) => void;
  currentScope: TopicScope;
  onlineUsers?: ChatUser[];
}

export default function TopicList({
  topics,
  selectedTopicId,
  onSelectTopic,
  onCreateTopic,
  onPinTopic,
  currentScope,
  onlineUsers = [],
}: TopicListProps) {
  const t = useTranslations("components");
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");

  const filteredTopics = useMemo(() => {
    let filtered = topics.filter(
      (topic) => topic.scope === "section" || topic.scope === currentScope,
    );
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter((topic) =>
        topic.name.toLowerCase().includes(lower),
      );
    }
    // Pinned first, then by creation date descending
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [topics, currentScope, search]);

  const handleCreate = () => {
    if (!newTopicName.trim()) return;
    onCreateTopic(newTopicName.trim(), currentScope);
    setNewTopicName("");
    setCreateDialogOpen(false);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            {t("topicList.header")}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {onlineUsers.length > 0 && (
              <Chip
                size="small"
                icon={
                  <CircleIcon sx={{ fontSize: 8, color: "success.main" }} />
                }
                label={onlineUsers.length}
                variant="outlined"
                sx={{ height: 24 }}
              />
            )}
            <IconButton
              size="small"
              onClick={() => setCreateDialogOpen(true)}
              aria-label={t("topicList.createTopicAriaLabel")}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <TextField
          size="small"
          fullWidth
          placeholder={t("topicList.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Divider />

      {/* Topic List */}
      <List sx={{ flex: 1, overflow: "auto", py: 0 }}>
        {filteredTopics.length === 0 && (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {t("topicList.emptyStateCta")}
            </Typography>
          </Box>
        )}
        {filteredTopics.map((topic) => (
          <ListItemButton
            key={topic.id}
            selected={topic.id === selectedTopicId}
            onClick={() => onSelectTopic(topic.id)}
            sx={{ py: 0.75, px: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {topic.pinned ? (
                <PushPinIcon fontSize="small" color="primary" />
              ) : (
                <TagIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={topic.name}
              secondary={topic.scope !== "section" ? topic.scope : undefined}
              primaryTypographyProps={{ variant: "body2", noWrap: true }}
              secondaryTypographyProps={{ variant: "caption", noWrap: true }}
            />
          </ListItemButton>
        ))}
      </List>

      {/* Create Topic Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("topicList.createDialogTitle")}</DialogTitle>
        <DialogContent>
          <TextField
            data-testid="new-topic-input"
            autoFocus
            fullWidth
            label={t("topicList.topicNameLabel")}
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder={t("topicList.topicNamePlaceholder")}
            sx={{ mt: 1 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">#</InputAdornment>
                ),
              },
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            {t("topicList.scope", { scope: currentScope })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            {t("topicList.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!newTopicName.trim()}
          >
            {t("topicList.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
