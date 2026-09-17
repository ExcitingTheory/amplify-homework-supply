import * as React from "react";
import { useDrag } from "react-dnd";
import { Box } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { alpha } from "@mui/material/styles";

import { SEMANTIC_THEME } from "../../themes/semanticTheme";

const onTouchMove = () => {
  window.navigator.vibrate(5);
};

export const DragBox = ({ answer, wordID, cardWidth = 140 }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "box",
    item: { answer, wordID },
    end: async (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        // Compare by word ID instead of phrase
        if (item.wordID === dropResult.targetWordID) {
          console.log(
            "Correct match! Dragged:",
            item.wordID,
            "Target:",
            dropResult.targetWordID,
          );
          dropResult.correctAnswer.sendPass();
          await dropResult.correctAnswer.progressAssignment(
            item.wordID,
            dropResult.targetWordID,
          );
        } else {
          console.log(
            "Incorrect match! Dragged:",
            item.wordID,
            "Target:",
            dropResult.targetWordID,
          );
          await dropResult.correctAnswer.sendFail(
            item.wordID,
            dropResult.targetWordID,
          );
        }
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <Box
      className="strokeorder"
      component="div"
      ref={drag}
      onTouchStart={onTouchMove}
      data-testid="drag-box"
      data-word-id={wordID}
      data-answer={answer}
      role="button"
      aria-label={`Drag ${answer}`}
      sx={(theme) => ({
        minHeight: 48,
        m: 0.5,
        px: 1,
        py: 0.75,
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.55 : 1,
        transform: isDragging ? "scale(0.98)" : "translateY(0)",
        borderRadius: `${SEMANTIC_THEME.radius.control}px`,
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, 0.55),
        bgcolor: "background.paper",
        color: "text.primary",
        fontSize: "1rem",
        fontWeight: SEMANTIC_THEME.typography.controlWeight,
        boxShadow: theme.shadows[1],
        touchAction: "none",
        transition: theme.transitions.create(
          [
            "box-shadow",
            "border-color",
            "background-color",
            "transform",
            "opacity",
          ],
          { duration: theme.transitions.duration.shorter },
        ),
        width: `${cardWidth}px`,
        minWidth: `${cardWidth}px`,
        maxWidth: `${cardWidth}px`,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "normal",
        wordBreak: "break-word",
        flexShrink: 0,
        justifyContent: "center",
        textAlign: "center",
        boxSizing: "border-box",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: alpha(theme.palette.primary.main, 0.07),
          boxShadow: theme.shadows[SEMANTIC_THEME.elevation.cardHover],
          transform: isDragging ? "scale(0.98)" : "translateY(-2px)",
        },
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
          transform: "none",
          "&:hover": { transform: "none" },
        },
      })}
    >
      <DragIndicatorIcon
        aria-hidden="true"
        sx={{ fontSize: 18, color: "text.disabled", flexShrink: 0 }}
      />
      <Box component="span" sx={{ minWidth: 0 }}>
        {answer}
      </Box>
    </Box>
  );
};
