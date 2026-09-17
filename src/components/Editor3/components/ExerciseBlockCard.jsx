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
};

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

export function ExerciseBlockCard({
  blockType,
  accuracy,
  graded = false,
  selected = false,
  className,
  dataTour,
  children,
  sx,
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
          const rail = `inset 4px 0 0 0 ${accentColor}`;
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

export default ExerciseBlockCard;
