"use client";

import React from "react";
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import { useTourSafe } from "../context/tourContext";
import { SEMANTIC_THEME } from "../themes/semanticTheme";

const TOUR_COPY = {
  fallbackTitle: "Guided tour",
  label: "Guided walkthrough",
  unavailable:
    "The target is not available yet. Complete the current page action to continue.",
  next: "Next",
  skip: "Skip",
  done: "Done",
};

function getTooltipPosition(targetRect, preferred = "bottom", containerRect) {
  if (!targetRect || !containerRect) return null;

  const cardWidth = 320;
  const cardHeight = 230;
  const gap = 16;
  const width = containerRect.width;
  const height = containerRect.height;
  const positions = {
    bottom: {
      top: targetRect.top + targetRect.height + gap,
      left: targetRect.left,
    },
    top: {
      top: targetRect.top - cardHeight - gap,
      left: targetRect.left,
    },
    right: {
      top: targetRect.top,
      left: targetRect.left + targetRect.width + gap,
    },
    left: {
      top: targetRect.top,
      left: targetRect.left - cardWidth - gap,
    },
    center: {
      top: height / 2 - cardHeight / 2,
      left: width / 2 - cardWidth / 2,
    },
  };
  const order = {
    bottom: ["bottom", "top", "right", "left"],
    top: ["top", "bottom", "right", "left"],
    right: ["right", "left", "bottom", "top"],
    left: ["left", "right", "bottom", "top"],
    center: ["center", "bottom", "top", "right", "left"],
  }[preferred] || ["bottom", "top", "right", "left"];
  const fits = ({ top, left }) =>
    top >= 12 &&
    left >= 12 &&
    top + cardHeight <= height - 12 &&
    left + cardWidth <= width - 12;
  const chosen =
    order.map((side) => positions[side]).find(fits) || positions[order[0]];

  return {
    top: Math.max(12, Math.min(chosen.top, height - cardHeight - 12)),
    left: Math.max(12, Math.min(chosen.left, width - cardWidth - 12)),
  };
}

export default function TourOverlay({
  containerSelector,
  isNavigating = false,
}) {
  const tour = useTourSafe();
  const activeTour = tour
    ?.getAvailableTours()
    .find((item) => item.id === tour.currentTour);
  const steps = activeTour?.steps || [];
  const [stepIndex, setStepIndex] = React.useState(0);
  const [targetRect, setTargetRect] = React.useState(null);
  const [tooltipPosition, setTooltipPosition] = React.useState(null);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef(null);

  React.useEffect(() => {
    if (!tour?.isActive) {
      setStepIndex(0);
      setTargetRect(null);
      setDragOffset({ x: 0, y: 0 });
      return undefined;
    }

    const updateTarget = () => {
      const container = containerSelector
        ? document.querySelector(containerSelector)
        : null;
      const step = tour
        .getAvailableTours()
        .find((item) => item.id === tour.currentTour)?.steps?.[stepIndex];
      const targets = step?.target
        ? document.querySelectorAll(step.target)
        : [];
      const targetIndex = step?.targetIndex ?? (step?.targetLast ? -1 : 0);
      const target =
        targetIndex === -1 ? targets[targets.length - 1] : targets[targetIndex];
      const rect = target?.getBoundingClientRect();
      const containerRect = container?.getBoundingClientRect();
      const localRect =
        rect && containerRect
          ? {
              top: rect.top - containerRect.top,
              left: rect.left - containerRect.left,
              width: rect.width,
              height: rect.height,
            }
          : rect
            ? {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              }
            : null;
      setTargetRect(localRect);
      setTooltipPosition(
        getTooltipPosition(localRect, step?.tooltipPosition, containerRect),
      );
    };

    updateTarget();
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);
    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [containerSelector, tour?.isActive, tour?.currentTour, tour, stepIndex]);

  React.useEffect(() => {
    if (!tour?.isActive) return undefined;
    const activeTour = tour
      .getAvailableTours()
      .find((item) => item.id === tour.currentTour);
    const step = activeTour?.steps?.[stepIndex];
    if (!step?.target) return undefined;

    const targets = document.querySelectorAll(step.target);
    const targetIndex = step.targetIndex ?? (step.targetLast ? -1 : 0);
    const target =
      targetIndex === -1 ? targets[targets.length - 1] : targets[targetIndex];
    if (!target) return undefined;

    const handleTargetClick = (event) => {
      if (step.interactable) {
        const element = event.target;
        const tag = element?.tagName?.toLowerCase();
        const isFormField = ["input", "textarea", "select"].includes(tag);
        const isButton =
          tag === "button" ||
          element?.closest?.('button, [role="button"], [type="submit"]');
        if (isFormField || !isButton) return;
      }
      if (stepIndex >= steps.length - 1) {
        tour.stopTour();
      } else {
        setStepIndex((currentIndex) => currentIndex + 1);
      }
    };

    target.addEventListener("click", handleTargetClick);
    return () => target.removeEventListener("click", handleTargetClick);
  }, [steps.length, tour?.isActive, tour?.currentTour, tour, stepIndex]);

  React.useEffect(() => {
    if (!tour?.isActive) return undefined;

    const activeTour = tour
      .getAvailableTours()
      .find((item) => item.id === tour.currentTour);
    const step = activeTour?.steps?.[stepIndex];
    if (!step?.advanceWhenTargetAppears) return undefined;

    const selector = step.advanceWhenTargetAppears;
    const initialCount = document.querySelectorAll(selector).length;
    const advanceWhenNewTargetAppears = () => {
      if (document.querySelectorAll(selector).length > initialCount) {
        setStepIndex((currentIndex) => currentIndex + 1);
      }
    };
    const observer = new MutationObserver(advanceWhenNewTargetAppears);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [tour?.isActive, tour?.currentTour, tour, stepIndex]);

  const handleDragStart = (event) => {
    event.preventDefault();
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    };

    const handleMove = (moveEvent) => {
      if (!dragRef.current) return;
      setDragOffset({
        x: dragRef.current.offsetX + moveEvent.clientX - dragRef.current.startX,
        y: dragRef.current.offsetY + moveEvent.clientY - dragRef.current.startY,
      });
    };
    const handleEnd = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
  };

  if (!tour?.isActive) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;
  const isQuizMode = tour.currentMode === "quiz";
  const showSpotlight = !isQuizMode;
  const advancesFromInteraction = Boolean(
    step?.interactable || step?.advanceWhenTargetAppears,
  );

  return (
    <div
      style={{
        position: containerSelector ? "absolute" : "fixed",
        inset: 0,
        zIndex: 1400,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {targetRect && showSpotlight && (
        <Box
          aria-hidden={true}
          sx={{
            position: "absolute",
            zIndex: 1,
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            border: "1px solid #1976d2",
            borderRadius: `${SEMANTIC_THEME.radius.control}px`,
            boxShadow:
              "inset 0 0 5px 1px rgba(255, 255, 255, 0.92), inset 0 0 15px 4px rgba(0, 229, 255, 0.86), inset 0 0 32px 8px rgba(0, 145, 255, 0.58), 0 0 0 2px rgba(25, 118, 210, 0.9), 0 0 13px 2px rgba(25, 118, 210, 0.62), 0 0 0 9999px rgba(15, 23, 42, 0.52)",
            pointerEvents: "none",
            animation: "tour-electric-pulse 1.8s ease-in-out infinite",
            "@keyframes tour-electric-pulse": {
              "0%, 100%": {
                filter: "brightness(0.96)",
              },
              "50%": {
                filter: "brightness(1.18)",
              },
            },
            "@media (prefers-reduced-motion: reduce)": {
              animation: "none",
            },
          }}
        />
      )}
      <Paper
        component="aside"
        role="dialog"
        aria-label={activeTour?.title || TOUR_COPY.fallbackTitle}
        sx={{
          position: "absolute",
          zIndex: 2,
          ...(!isQuizMode && tooltipPosition
            ? {
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                right: "auto",
                bottom: "auto",
              }
            : { right: 24, bottom: 16 }),
          width: { xs: "min(320px, calc(100% - 32px))", sm: 320 },
          p: SEMANTIC_THEME.padding.cardDesktop / 8,
          borderRadius: `${SEMANTIC_THEME.radius.panel}px`,
          boxShadow: (theme) => theme.shadows[SEMANTIC_THEME.elevation.overlay],
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          pointerEvents: "auto",
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
        }}
      >
        <Box
          onMouseDown={handleDragStart}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mx: -2,
            mt: -2,
            px: 1.5,
            py: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
            cursor: "grab",
            userSelect: "none",
            "&:active": { cursor: "grabbing" },
          }}
        >
          <DragIndicatorIcon fontSize="small" color="disabled" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: SEMANTIC_THEME.typography.controlWeight }}
            >
              {activeTour?.title || TOUR_COPY.fallbackTitle}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {TOUR_COPY.label}
            </Typography>
          </Box>
          <Tooltip title="Exit tour">
            <IconButton
              size="small"
              aria-label="Exit tour"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={tour.stopTour}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <LinearProgress
          variant="determinate"
          value={steps.length ? ((stepIndex + 1) / steps.length) * 100 : 0}
          sx={{
            mx: -2,
            height: 4,
            bgcolor: "action.hover",
            "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
          }}
        />
        <Typography variant="body2" sx={{ my: 1.25 }}>
          {step?.instruction || step?.description}
        </Typography>
        {step?.actions?.length > 0 && (
          <Box component="ul" sx={{ pl: 2.5, my: 1 }}>
            {step.actions.map((action) => (
              <Typography component="li" variant="caption" key={action}>
                {action}
              </Typography>
            ))}
          </Box>
        )}
        {!targetRect && step?.target && (
          <Typography variant="caption" color="warning.main">
            {TOUR_COPY.unavailable}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {`Step ${Math.min(stepIndex + 1, steps.length)} of ${steps.length}`}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 2, justifyContent: "flex-end" }}
        >
          {!isLast && !advancesFromInteraction && !isNavigating && (
            <Button
              type="button"
              size="small"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => setStepIndex((index) => index + 1)}
            >
              {TOUR_COPY.next}
            </Button>
          )}
          {!isLast && (
            <Button
              type="button"
              size="small"
              variant="text"
              startIcon={<SkipNextIcon />}
              onClick={tour.stopTour}
            >
              {TOUR_COPY.skip}
            </Button>
          )}
          {isLast && (
            <Button
              type="button"
              size="small"
              variant="contained"
              endIcon={<CheckIcon />}
              onClick={tour.stopTour}
              disabled={isNavigating}
            >
              {TOUR_COPY.done}
            </Button>
          )}
        </Stack>
      </Paper>
    </div>
  );
}
