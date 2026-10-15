"use client";
import React from "react";
import { Box, Chip, Stack, Tooltip, Typography } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import BoltIcon from "@mui/icons-material/Bolt";
import FlagIcon from "@mui/icons-material/Flag";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { GradeDonut } from "./GradeDonut";

export interface ClassScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime?: string | null;
}

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours)) return time;
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return minutes
    ? `${hour12}:${String(minutes).padStart(2, "0")}${period}`
    : `${hour12}${period}`;
}

/** Groups meeting days that share the same time (e.g. Mon/Wed/Fri 9-9:50am) into one readable line per distinct time slot. */
export function formatClassSchedule(
  classSchedule?: ClassScheduleEntry[] | null,
): string | null {
  if (!classSchedule || classSchedule.length === 0) return null;

  const groups = new Map<string, number[]>();
  for (const entry of classSchedule) {
    if (!Number.isInteger(entry?.dayOfWeek) || !entry?.startTime) continue;
    const key = `${entry.startTime}|${entry.endTime || ""}`;
    const days = groups.get(key) || [];
    days.push(entry.dayOfWeek);
    groups.set(key, days);
  }
  if (groups.size === 0) return null;

  const parts: string[] = [];
  for (const [key, days] of groups) {
    const [startTime, endTime] = key.split("|");
    const dayLabels = [...new Set(days)]
      .sort((a, b) => a - b)
      .map((d) => DAY_ABBR[d]);
    const timeLabel = endTime
      ? `${formatTime(startTime)}\u2013${formatTime(endTime)}`
      : formatTime(startTime);
    parts.push(`${dayLabels.join(", ")} ${timeLabel}`);
  }
  return parts.join(" \u00b7 ");
}

export function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Tooltip title={copied ? "Copied!" : "Copy join code"}>
      <Chip
        label={code}
        size="small"
        variant="outlined"
        icon={<ContentCopyIcon sx={{ fontSize: "0.85rem !important" }} />}
        onClick={(event) => {
          // Stop the click from bubbling to the parent AccordionSummary toggle.
          event.stopPropagation();
          navigator.clipboard.writeText(code).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        sx={{ fontFamily: "monospace", fontWeight: 700, cursor: "pointer" }}
      />
    </Tooltip>
  );
}

export interface SectionHeaderProps {
  name: string;
  code?: string;
  description?: string;
  /** Recurring weekly class meeting times — rendered as a schedule line under the description. */
  classSchedule?: ClassScheduleEntry[] | null;
  /** 0-100 average grade, rendered as a donut ring next to the title */
  averageGrade?: number;
  studentCount: number;
  activeCount: number;
  flaggedCount?: number;
  atRiskCount?: number;
  excellingCount?: number;
}

/** Teacher-facing section Accordion summary content: identity, join code, and at-a-glance status chips. */
export function SectionHeader({
  name,
  code,
  description,
  classSchedule,
  averageGrade,
  studentCount,
  activeCount,
  flaggedCount = 0,
  atRiskCount = 0,
  excellingCount = 0,
}: SectionHeaderProps) {
  const scheduleText = formatClassSchedule(classSchedule);
  return (
    <Box
      sx={{
        px: 2.5,
        pt: 2,
        pb: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "flex-start" },
        gap: { xs: 1.5, sm: 2 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          flex: 1,
          minWidth: 0,
        }}
      >
        {averageGrade != null && <GradeDonut value={averageGrade} size={36} />}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {name}
            </Typography>
            {code && <CopyableCode code={code} />}
          </Box>
          {description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.25, lineHeight: 1.4 }}
            >
              {description}
            </Typography>
          )}
          {scheduleText && (
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
            >
              <AccessTimeIcon
                sx={{ fontSize: "0.9rem", color: "text.disabled" }}
              />
              <Typography variant="body2" color="text.secondary">
                {scheduleText}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexShrink={0}
        flexWrap="wrap"
        useFlexGap
      >
        <Chip
          icon={<PeopleIcon />}
          label={`${studentCount} students`}
          size="small"
          color="primary"
          variant="outlined"
        />
        <Chip
          icon={<BoltIcon />}
          label={`${activeCount} active`}
          size="small"
          color="info"
          variant="outlined"
        />
        {flaggedCount > 0 && (
          <Chip
            icon={<FlagIcon />}
            label={`${flaggedCount} flagged`}
            size="small"
            color="error"
          />
        )}
        {atRiskCount > 0 && (
          <Chip
            icon={<WarningAmberIcon />}
            label={`${atRiskCount} at risk`}
            size="small"
            color="warning"
          />
        )}
        {excellingCount > 0 && (
          <Chip
            icon={<EmojiEventsIcon />}
            label={`${excellingCount} excelling`}
            size="small"
            color="success"
          />
        )}
      </Stack>
    </Box>
  );
}
