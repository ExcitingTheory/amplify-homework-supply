"use client";
import React from "react";
import { Box, Chip, Stack, Tooltip, Typography } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import BoltIcon from "@mui/icons-material/Bolt";
import FlagIcon from "@mui/icons-material/Flag";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { GradeDonut } from "./GradeDonut";

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
  averageGrade,
  studentCount,
  activeCount,
  flaggedCount = 0,
  atRiskCount = 0,
  excellingCount = 0,
}: SectionHeaderProps) {
  return (
    <Box
      sx={{
        px: 2.5,
        pt: 2,
        pb: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {averageGrade != null && (
            <GradeDonut value={averageGrade} size={36} />
          )}
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
