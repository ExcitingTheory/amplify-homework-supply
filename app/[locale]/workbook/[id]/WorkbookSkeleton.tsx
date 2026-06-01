"use client";

/**
 * WorkbookSkeleton — Shows server-rendered HTML content while the full
 * interactive Workbook component loads. This gives students instant
 * content visibility (no blank page waiting for JS).
 *
 * The HTML is generated server-side from Lexical JSON via @lexical/headless.
 * Interactive blocks (quizzes, answers) render as placeholder divs with
 * data attributes that the full Workbook will replace when it hydrates.
 *
 * Hides itself once the WorkbookClient mounts (via #workbook-client-root sibling).
 */

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

interface WorkbookSkeletonProps {
  html: string;
  unitName?: string;
}

export function WorkbookSkeleton({ html, unitName }: WorkbookSkeletonProps) {
  return (
    <Box
      sx={{
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Toolbar skeleton */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          backgroundColor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          p: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          height: "64px",
        }}
      >
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width={200} height={32} />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
      </Box>

      {/* Content area with pre-rendered HTML */}
      <Box
        sx={{
          pt: "80px",
          px: 3,
          height: "100vh",
          overflowY: "auto",
          "& h1, & h2, & h3, & h4, & h5, & h6": {
            mt: 2,
            mb: 1,
          },
          "& p": {
            my: 1,
            lineHeight: 1.6,
          },
          "& ul, & ol": {
            pl: 3,
          },
          "& img": {
            maxWidth: "100%",
            height: "auto",
            borderRadius: 1,
          },
          "& [data-lexical-quiz], & [data-lexical-answer], & [data-lexical-custom-answer], & [data-lexical-meaning-association]":
            {
              my: 2,
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              backgroundColor: "action.hover",
              minHeight: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              "&::after": {
                content: '"Loading interactive content..."',
                color: "text.secondary",
                fontStyle: "italic",
              },
            },
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Box>
  );
}
