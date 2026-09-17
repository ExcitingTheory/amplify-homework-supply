/**
 * EditorBlockCard — shared visual frame for custom editor blocks.
 *
 * Models the dashboard assignment card
 * (src/components/Dashboard/AssignmentCardView.tsx): a flat `Card` with a 1px
 * divider border, a 4px left accent, the semantic card radius, and a hover
 * shadow. The left accent reflects performance once the block is graded and
 * falls back to a per-block-type color otherwise.
 */

import * as React from "react";
import Card from "@mui/material/Card";
import { alpha } from "@mui/material/styles";
import { SEMANTIC_THEME } from "../../../themes/semanticTheme";

/** Default left-accent palette color per block type (ungraded state). */
const BLOCK_TYPE_ACCENT = {
  quiz: "primary.main",
  answer: "info.main",
  "custom-answer": "secondary.main",
  "custom-ai": "secondary.main",
  "meaning-association": "success.main",
  "word-block": "info.main",
  youtube: "error.main",
  playlist: "info.main",
  "conversation-playlist": "info.main",
  pdf: "warning.main",
  image: "text.secondary",
};

/**
 * Left-accent color, mirroring AssignmentCardView's `gradeColor` thresholds so
 * graded blocks read the same as dashboard cards. Kept local (3-line mirror)
 * to avoid pulling the dashboard card's dependency graph into editor blocks.
 *
 * @param {string} blockType - Block type key (e.g. "quiz").
 * @param {number|null|undefined} accuracy - Grade accuracy (0-100) when graded.
 * @param {boolean} graded - Whether a grade exists for this block.
 * @returns {string} MUI palette color path (e.g. "success.main").
 */
export function resolveBlockAccent(blockType, accuracy, graded) {
  if (graded && typeof accuracy === "number") {
    if (accuracy >= 80) return "success.main";
    if (accuracy >= 60) return "warning.main";
    return "error.main";
  }
  return BLOCK_TYPE_ACCENT[blockType] || "warning.main";
}

/** Resolve a MUI palette path like "success.main" to an actual color string. */
function getPaletteColor(theme, path) {
  const [group, shade = "main"] = String(path).split(".");
  return theme.palette?.[group]?.[shade] ?? theme.palette.primary.main;
}

export function EditorBlockCard({
  blockType,
  accuracy,
  graded = false,
  selected = false,
  className,
  dataTour,
  children,
  sx,
}) {
  const accentPath = resolveBlockAccent(blockType, accuracy, graded);
  return (
    <Card
      elevation={0}
      className={className}
      data-tour={dataTour}
      data-block-type={blockType}
      sx={[
        (theme) => {
          const accentColor = getPaletteColor(theme, accentPath);
          // Uniform 1px frame on all four sides (consistent against white or
          // black); the accent is an inset rail that follows the rounded
          // corners instead of a thick left border that miters at the corners.
          const rail = `inset 3px 0 0 0 ${accentColor}`;
          const cardHover = theme.shadows[SEMANTIC_THEME.elevation.cardHover];
          const overlay = theme.shadows[SEMANTIC_THEME.elevation.overlay];
          return {
            my: 2,
            pr: { xs: 1.75, sm: 2 },
            py: { xs: 1.75, sm: 2 },
            pl: { xs: 2.25, sm: 2.5 },
            border: "1px solid",
            borderColor: selected
              ? theme.palette.primary.main
              : alpha(theme.palette.text.primary, 0.23),
            borderRadius: `${SEMANTIC_THEME.radius.card}px`,
            bgcolor: "background.paper",
            boxShadow: selected ? `${rail}, ${overlay}` : rail,
            transition: "box-shadow 0.2s, border-color 0.2s",
            "&:hover": { boxShadow: `${rail}, ${cardHover}` },
          };
        },
        sx,
      ]}
    >
      {children}
    </Card>
  );
}

export default EditorBlockCard;
