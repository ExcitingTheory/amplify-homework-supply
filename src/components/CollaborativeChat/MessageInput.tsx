"use client";

/**
 * MessageInput — Chat message input with @mention autocomplete.
 *
 * Features:
 * - Text input with Enter-to-send (Shift+Enter for newline)
 * - @mention autocomplete popup showing section members
 * - @kai shortcut for AI bot invocation
 * - Typing indicator (sets awareness state)
 *
 * @module CollaborativeChat/MessageInput
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  Box,
  TextField,
  IconButton,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Popper,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CircleIcon from "@mui/icons-material/Circle";
import type { MemberInfo } from "./types";

export interface MessageInputProps {
  onSend: (content: string) => void;
  onTypingChange?: (typing: boolean) => void;
  members?: MemberInfo[];
  placeholder?: string;
  disabled?: boolean;
  replyingTo?: string | null;
  onCancelReply?: () => void;
}

export default function MessageInput({
  onSend,
  onTypingChange,
  members = [],
  placeholder = "Type a message...",
  disabled = false,
  replyingTo,
  onCancelReply,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAnchor, setMentionAnchor] = useState<HTMLElement | null>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute mention suggestions (always include @kai at top)
  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const query = mentionQuery.toLowerCase();
    const kaiBotEntry: MemberInfo = {
      username: "kai",
      displayName: "Kai (AI Assistant)",
      online: true,
    };
    const allMembers = [kaiBotEntry, ...members];
    if (!query) return allMembers.slice(0, 8);
    return allMembers
      .filter(
        (m) =>
          m.displayName.toLowerCase().includes(query) ||
          m.username.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [mentionQuery, members]);

  // Handle typing indicator
  const signalTyping = useCallback(() => {
    onTypingChange?.(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTypingChange?.(false);
    }, 2000);
  }, [onTypingChange]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    onTypingChange?.(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [text, onSend, onTypingChange]);

  const insertMention = useCallback(
    (member: MemberInfo) => {
      const mentionText =
        member.username === "kai"
          ? "@kai "
          : member.displayName.includes(" ")
            ? `@"${member.displayName}" `
            : `@${member.username} `;

      // Replace the @query portion in text
      const atIndex = text.lastIndexOf("@");
      if (atIndex !== -1) {
        const before = text.slice(0, atIndex);
        setText(before + mentionText);
      } else {
        setText(text + mentionText);
      }

      setMentionQuery(null);
      setSelectedMentionIndex(0);
      inputRef.current?.focus();
    },
    [text],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setText(value);
    signalTyping();

    // Detect @mention trigger
    const cursorPos = e.target.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionAnchor(e.target);
      setSelectedMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Mention navigation
    if (mentionQuery !== null && mentionSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((i) =>
          Math.min(i + 1, mentionSuggestions.length - 1),
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(mentionSuggestions[selectedMentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }

    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const mentionPopperOpen =
    mentionQuery !== null && mentionSuggestions.length > 0;

  return (
    <Box sx={{ position: "relative" }}>
      {/* Reply indicator */}
      {replyingTo && (
        <Box
          sx={{
            px: 2,
            py: 0.5,
            bgcolor: "action.hover",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Replying to message
          </Typography>
          <Typography
            variant="caption"
            color="primary"
            sx={{ cursor: "pointer" }}
            onClick={onCancelReply}
          >
            Cancel
          </Typography>
        </Box>
      )}

      {/* Input */}
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, p: 1 }}>
        <TextField
          inputRef={inputRef}
          data-testid="chat-message-input"
          fullWidth
          multiline
          maxRows={4}
          size="small"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          aria-label="Send message"
        >
          <SendIcon />
        </IconButton>
      </Box>

      {/* Mention autocomplete dropdown */}
      <Popper
        open={mentionPopperOpen}
        anchorEl={mentionAnchor}
        placement="top-start"
        sx={{ zIndex: 1300 }}
      >
        <Paper
          elevation={4}
          sx={{ maxHeight: 240, overflow: "auto", minWidth: 200 }}
        >
          <List dense>
            {mentionSuggestions.map((member, index) => (
              <ListItemButton
                key={member.username}
                selected={index === selectedMentionIndex}
                onClick={() => insertMention(member)}
                dense
              >
                <ListItemAvatar sx={{ minWidth: 36 }}>
                  {member.username === "kai" ? (
                    <Avatar
                      sx={{ width: 24, height: 24, bgcolor: "primary.main" }}
                    >
                      <SmartToyIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                  ) : (
                    <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                      {member.displayName[0]}
                    </Avatar>
                  )}
                </ListItemAvatar>
                <ListItemText
                  primary={member.displayName}
                  secondary={
                    member.username === "kai" ? "AI Bot" : `@${member.username}`
                  }
                  primaryTypographyProps={{ variant: "body2" }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
                {member.online && (
                  <CircleIcon
                    sx={{ fontSize: 8, color: "success.main", ml: 1 }}
                  />
                )}
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Popper>
    </Box>
  );
}
