"use client";

/**
 * ChatMessageList — Presentational AI chat transcript.
 *
 * Renders the same visual language as ChatSidebar's message feed (user gradient
 * bubbles, assistant bubbles with a bot avatar, and full-width tool-call preview
 * cards) from the documented AI SDK `message.parts` format — but with no app
 * context, AI SDK, or data client. Use it to display a chat transcript anywhere
 * a read-only rendering is enough (showcase, previews, tests).
 *
 * @module Chat/ChatMessageList
 */

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { useTranslations } from "next-intl";
import { BotAvatar } from "../BotAvatar";

/** A single AI SDK message part (text or `tool-*`). */
export interface ChatMessagePart {
  type: string;
  text?: string;
  toolCallId?: string;
  toolName?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
}

/** A chat message in AI SDK v6 `parts` shape. */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: ChatMessagePart[];
}

export interface ChatMessageListProps {
  messages: ChatMessage[];
  /** Show a "thinking" indicator after the last message. */
  isLoading?: boolean;
  /**
   * Render a `tool-*` part yourself (e.g. a real SearchResults / editable block
   * preview). Return null/undefined to fall back to the built-in tool card.
   */
  renderToolPart?: (part: ChatMessagePart) => React.ReactNode;
}

function textOf(parts: ChatMessagePart[]): string {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

function toolPartsOf(parts: ChatMessagePart[]): ChatMessagePart[] {
  return parts.filter((p) => p.type?.startsWith("tool-"));
}

function humanizeToolName(name: string): string {
  return name.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(formatValue).join(", ");
  return JSON.stringify(v);
}

/** Render an object as a key → value list, or a primitive/array as one line. */
function ToolValue({ value }: { value: unknown }) {
  const entries =
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.entries(value as Record<string, unknown>)
      : null;
  if (!entries) {
    return (
      <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
        {formatValue(value)}
      </Typography>
    );
  }
  return (
    <Stack spacing={0.5}>
      {entries.map(([k, v]) => (
        <Stack key={k} direction="row" spacing={1} alignItems="baseline">
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontFamily: "monospace",
              minWidth: 92,
              flexShrink: 0,
            }}
          >
            {k}
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
            {formatValue(v)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function ToolCallCard({ part }: { part: ChatMessagePart }) {
  const t = useTranslations("components");
  const toolName = humanizeToolName(
    part.type?.replace(/^tool-/, "") || part.toolName || "tool",
  );
  const running =
    part.state === "input-streaming" || part.state === "input-available";
  const isError = part.state === "output-error";
  const done = part.state === "output-available";
  const hasInput = part.input != null;
  const hasOutput = part.output != null;

  return (
    <Box
      sx={{
        width: "100%",
        my: 1,
        borderRadius: 2,
        border: "1px solid",
        borderColor: isError ? "error.main" : "divider",
        bgcolor: "background.paper",
        boxShadow: 1,
        overflow: "hidden",
      }}
    >
      {/* Header bar */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ px: 1.5, py: 1, bgcolor: "action.hover" }}
      >
        {running ? (
          <CircularProgress size={16} />
        ) : isError ? (
          <ErrorOutlineRoundedIcon fontSize="small" color="error" />
        ) : (
          <BuildRoundedIcon fontSize="small" color="primary" />
        )}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
          {toolName}
        </Typography>
        {done && !isError && (
          <CheckCircleRoundedIcon fontSize="small" color="success" />
        )}
        <Chip
          label={t("chatMessageList.tool")}
          size="small"
          variant="outlined"
        />
      </Stack>

      {/* Params / result */}
      {(hasInput || hasOutput) && (
        <Box sx={{ px: 1.5, py: 1 }}>
          {hasInput && (
            <Box sx={{ mb: hasOutput ? 1.5 : 0 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ display: "block", lineHeight: 1.6 }}
              >
                {t("chatMessageList.input")}
              </Typography>
              <ToolValue value={part.input} />
            </Box>
          )}
          {hasOutput && (
            <Box>
              <Typography
                variant="overline"
                color={isError ? "error" : "text.secondary"}
                sx={{ display: "block", lineHeight: 1.6 }}
              >
                {t("chatMessageList.result")}
              </Typography>
              <ToolValue value={part.output} />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export function ChatMessageList({
  messages,
  isLoading = false,
  renderToolPart,
}: ChatMessageListProps) {
  const t = useTranslations("components");
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, p: 1.5 }}>
      {messages.map((message, index) => {
        const text = textOf(message.parts);
        const tools = toolPartsOf(message.parts);
        const isUser = message.role === "user";

        if (message.role === "system") {
          return (
            <Box
              key={message.id || index}
              sx={{ textAlign: "center", py: 0.5 }}
            >
              <Typography variant="caption" color="text.disabled">
                {text}
              </Typography>
            </Box>
          );
        }

        return (
          <Box key={message.id || index} sx={{ width: "100%", mb: 1 }}>
            {text && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                  ...(isUser ? { justifyContent: "flex-end" } : {}),
                }}
              >
                {message.role === "assistant" && <BotAvatar size={48} />}
                <Box
                  sx={{
                    m: 0.75,
                    p: "0.75rem 1rem",
                    borderRadius: "1rem",
                    maxWidth: "85%",
                    wordWrap: "break-word",
                    whiteSpace: "pre-wrap",
                    ...(isUser
                      ? {
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "white",
                          marginLeft: "auto",
                          borderBottomRightRadius: "0.25rem",
                        }
                      : {
                          bgcolor: "custom.chatBubbleAssistant",
                          color: "text.primary",
                          borderBottomLeftRadius: "0.25rem",
                          border: 1,
                          borderColor: "divider",
                        }),
                  }}
                >
                  <Typography variant="body2">{text}</Typography>
                </Box>
              </Box>
            )}

            {tools.map((part, toolIdx) => {
              const custom = renderToolPart?.(part);
              return custom != null ? (
                <Box key={part.toolCallId || toolIdx} sx={{ my: 1 }}>
                  {custom}
                </Box>
              ) : (
                <ToolCallCard key={part.toolCallId || toolIdx} part={part} />
              );
            })}
          </Box>
        );
      })}

      {isLoading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BotAvatar size={48} />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: "italic" }}
          >
            {t("chatMessageList.thinking")}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ChatMessageList;
