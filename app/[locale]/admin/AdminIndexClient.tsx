"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import FlagIcon from "@mui/icons-material/Flag";
import InsightsIcon from "@mui/icons-material/Insights";
import SpellcheckIcon from "@mui/icons-material/Spellcheck";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import QuizIcon from "@mui/icons-material/Quiz";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import TuneIcon from "@mui/icons-material/Tune";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AdminRouteGuard from "./_components/AdminRouteGuard";
import { alpha } from "@mui/material/styles";
import { DASHBOARD_TOKENS } from "@/components/Dashboard/constants";

interface AdminTool {
  key: string;
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  // Omit for tools without a cheap/meaningful triage count.
  count?: number;
  countLabel?: string;
  countColor?: "error" | "warning" | "default";
}

export default function AdminIndexClient({
  flaggedCount,
  recycleBinCount,
}: {
  flaggedCount: number;
  recycleBinCount: number;
}) {
  const tools: AdminTool[] = [
    {
      key: "moderation",
      href: "/admin/moderation",
      icon: <FlagIcon />,
      title: "Moderation",
      description: "Review flagged grades, units, words, and questions.",
      count: flaggedCount,
      countLabel: "flagged",
      countColor: flaggedCount > 0 ? "error" : "default",
    },
    {
      key: "analytics",
      href: "/admin/analytics",
      icon: <InsightsIcon />,
      title: "Analytics",
      description: "Class-wide performance, engagement, and usage trends.",
    },
    {
      key: "words",
      href: "/admin/words",
      icon: <SpellcheckIcon />,
      title: "Words",
      description:
        "Vocabulary health: missing audio, definitions, or embeddings.",
    },
    {
      key: "files",
      href: "/admin/files",
      icon: <InsertDriveFileIcon />,
      title: "Files",
      description: "Storage health: orphaned, oversized, or unlabeled files.",
    },
    {
      key: "questions",
      href: "/admin/questions",
      icon: <QuizIcon />,
      title: "Questions",
      description: "Question bank health: missing audio, answers, embeddings.",
    },
    {
      key: "archives",
      href: "/admin/archives",
      icon: <Inventory2Icon />,
      title: "Archives",
      description: "Browse and restore permanently deleted records.",
    },
    {
      key: "recycle-bin",
      href: "/recycle-bin",
      icon: <DeleteOutlineIcon />,
      title: "Recycle Bin",
      description: "Restore recently soft-deleted content.",
      count: recycleBinCount,
      countLabel: "deleted",
      countColor: recycleBinCount > 0 ? "warning" : "default",
    },
    {
      key: "settings",
      href: "/admin/settings",
      icon: <TuneIcon />,
      title: "Platform Settings",
      description: "AI feature toggles and gamification configuration.",
    },
  ];

  const needsAttention = tools.filter((tool) => (tool.count || 0) > 0);

  return (
    <AdminRouteGuard>
      <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Platform-wide tools for moderation, content health, and account
          maintenance.
        </Typography>

        {needsAttention.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: 2.5,
              borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
              border: DASHBOARD_TOKENS.border.divider,
              borderColor: "warning.light",
              bgcolor: (theme) => alpha(theme.palette.warning.main, 0.06),
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Needs attention
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {needsAttention.map((tool) => (
                <Chip
                  key={tool.key}
                  component="a"
                  href={tool.href}
                  clickable
                  color={tool.countColor === "error" ? "error" : "warning"}
                  variant="outlined"
                  icon={tool.icon as React.ReactElement}
                  label={`${tool.count} ${tool.countLabel} — ${tool.title}`}
                />
              ))}
            </Box>
          </Paper>
        )}

        <Grid container spacing={2.5}>
          {tools.map((tool) => (
            <Grid key={tool.key} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
                  border: DASHBOARD_TOKENS.border.divider,
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ color: "text.secondary", display: "flex" }}>
                      {tool.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {tool.title}
                    </Typography>
                  </Box>
                  {tool.count != null && (
                    <Chip
                      label={`${tool.count}${tool.count >= 100 ? "+" : ""}`}
                      size="small"
                      color={
                        tool.countColor === "default"
                          ? undefined
                          : tool.countColor
                      }
                      variant={
                        tool.countColor === "default" ? "outlined" : "filled"
                      }
                    />
                  )}
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ flex: 1, mb: 2 }}
                >
                  {tool.description}
                </Typography>
                <Button
                  component="a"
                  href={tool.href}
                  size="small"
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Open
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </AdminRouteGuard>
  );
}
