/**
 * WorkbookSSRSkeleton — Server-rendered HTML skeleton for the Workbook.
 *
 * Displays the pre-rendered Lexical HTML immediately on page load (via SSR)
 * while the full interactive client-side Workbook component is loading.
 * This gives users instant content visibility and provides SEO-friendly HTML.
 *
 * Pattern from: https://github.com/2wheeh/lexical-nextjs-ssr
 */

import Box from "@mui/material/Box";

interface WorkbookSSRSkeletonProps {
  /** Pre-rendered HTML string from the headless Lexical editor */
  html: string;
}

export function WorkbookSSRSkeleton({ html }: WorkbookSSRSkeletonProps) {
  if (!html) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
          opacity: 0.5,
        }}
      >
        Loading content...
      </Box>
    );
  }

  return (
    <Box
      className="workbook-ssr-skeleton"
      sx={{
        // Match the Workbook's content area styling
        "& .editor-paragraph": {
          margin: "0 0 8px",
        },
        "& h1, & h2, & h3, & h4, & h5, & h6": {
          margin: "16px 0 8px",
        },
        "& ul, & ol": {
          paddingLeft: "24px",
        },
        "& img": {
          maxWidth: "100%",
          height: "auto",
        },
        "& a": {
          color: "primary.main",
          textDecoration: "underline",
        },
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
