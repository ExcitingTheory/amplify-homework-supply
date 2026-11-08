import * as React from "react";
import Card from "@mui/material/Card";
import { alpha } from "@mui/material/styles";

import { SEMANTIC_THEME } from "../../../themes/semanticTheme";

const BLOCK_TYPE_ACCENT = {
  quiz: "primary.main",
  answer: "text.primary",
  "custom-answer": "primary.main",
  "custom-ai": "primary.main",
  "meaning-association": "text.primary",
  "word-block": "text.primary",
};
const LESSON = SEMANTIC_THEME.editor.lesson;

export function resolveExerciseAccent(blockType, accuracy, graded) {
  if (graded && typeof accuracy === "number") {
    if (accuracy >= 80) return "success.main";
    if (accuracy >= 60) return "warning.main";
    return "error.main";
  }
  return BLOCK_TYPE_ACCENT[blockType] || "warning.main";
}

function getPaletteColor(theme, path) {
  const [group, shade = "main"] = String(path).split(".");
  return theme.palette?.[group]?.[shade] ?? theme.palette.primary.main;
}

/** @param {{ blockType: string, accuracy?: number, graded?: boolean, selected?: boolean, className?: string, dataTour?: string, children?: React.ReactNode, sx?: import("@mui/material").SxProps }} props */
export function ExerciseBlockCard({
  blockType,
  accuracy = undefined,
  graded = false,
  selected = false,
  className = undefined,
  dataTour = undefined,
  children,
  sx = undefined,
}) {
  const accentPath = resolveExerciseAccent(blockType, accuracy, graded);

  return (
    <Card
      elevation={0}
      className={className}
      data-tour={dataTour}
      data-block-type={blockType}
      sx={[
        (theme) => {
          const accentColor = getPaletteColor(theme, accentPath);
          const railWidth = theme.direction === "rtl"
            ? -LESSON.surface.accentWidth
            : LESSON.surface.accentWidth;
          const rail = `inset ${railWidth}px 0 0 0 ${alpha(accentColor, graded ? LESSON.surface.gradedAccentOpacity : LESSON.surface.accentOpacity)}`;

          return {
            my: `${LESSON.blockGap}px`,
            p: `${LESSON.padding.block}px`,
            // Override the dashboard card theme's independent centering.
            "&&": { width: "100%", maxWidth: "100%", marginInline: 0 },
            textAlign: "start",
            fontSize: theme.typography.body1.fontSize,
            lineHeight: LESSON.lineHeight,
            border: `${LESSON.surface.borderWidth}px solid`,
            borderColor: selected
              ? theme.palette.primary.main
              : alpha(theme.palette.text.primary, LESSON.surface.borderOpacity),
            borderRadius: `${SEMANTIC_THEME.radius.card}px`,
            bgcolor: alpha(theme.palette.text.primary, LESSON.surface.backgroundOpacity),
            backgroundImage: "none",
            boxShadow: selected
              ? `${rail}, 0 0 0 ${LESSON.surface.selectionWidth}px ${alpha(theme.palette.primary.main, LESSON.surface.selectionOpacity)}`
              : rail,
            transition: "box-shadow 0.2s, border-color 0.2s",
            "&:hover": {
              borderColor: selected
                ? theme.palette.primary.main
                : alpha(theme.palette.text.primary, LESSON.surface.hoverBorderOpacity),
            },
          };
        },
        sx,
      ]}
    >
      {children}
    </Card>
  );
}

export default ExerciseBlockCard;
