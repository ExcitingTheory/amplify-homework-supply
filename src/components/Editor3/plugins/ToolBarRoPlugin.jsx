/**
 * @fileoverview ToolBarRoPlugin - Read-only toolbar for viewing educational content.
 * @module ToolBarRoPlugin
 *
 * Provides a read-only toolbar that displays unit information and a countdown timer.
 * Used when displaying content in read-only/student view mode.
 */

import * as React from "react";
import { useEffect, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { Box, Toolbar, Typography, Chip, Stack, Popover } from "@mui/material";
import { useTranslations } from "next-intl";
// import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { useToolbarScroll } from "../../../hooks/useToolbarScroll";
import ToolbarScrollButton from "../../ToolbarScrollButton";
import { useAppShell } from "../../AppShellContext";

import TimerIcon from "@mui/icons-material/Timer";
import { ConnectionStatus } from "../../Workbook";

const drawerWidth = 400;

export const CAN_USE_DOM =
  typeof window !== "undefined" &&
  typeof window.document !== "undefined" &&
  typeof window.document.createElement !== "undefined";
export const IS_APPLE =
  CAN_USE_DOM && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

import { $isAtNodeEnd } from "@lexical/selection";
import UnitContext from "../../../context/unitContext";
import SectionContext from "../../../context/sectionContext";
import {
  getStudentAccommodation,
  getEffectiveTimeAllowance,
} from "../../../utils/accommodations";
import { useXP } from "../../../context/gamificationContext";
import { StreakIndicator } from "../../Gamification/StreakIndicator";
import GlobalSearchBar from "../../GlobalSearchBar";
import { SEMANTIC_THEME } from "../../../themes/semanticTheme";

const workbookChipSx = {
  borderRadius: `${SEMANTIC_THEME.radius.chip}px`,
};

function OverflowRevealText({ text, variant, component = "div", sx }) {
  const containerRef = React.useRef(null);
  const textRef = React.useRef(null);
  const [isClipped, setIsClipped] = React.useState(false);
  const [marqueeDistance, setMarqueeDistance] = React.useState(0);
  const [anchorEl, setAnchorEl] = React.useState(null);

  React.useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const textElement = textRef.current;
      if (!container || !textElement) return;

      const overflow = textElement.scrollWidth - container.clientWidth;
      setIsClipped(overflow > 1);
      setMarqueeDistance(Math.max(0, overflow + 12));
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (textRef.current) resizeObserver.observe(textRef.current);
    return () => resizeObserver.disconnect();
  }, [text]);

  const handleClick = (event) => {
    if (isClipped) setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <Typography
        ref={containerRef}
        variant={variant}
        component={component}
        onClick={handleClick}
        aria-haspopup={isClipped ? "dialog" : undefined}
        sx={{
          ...sx,
          cursor: isClipped ? "pointer" : "default",
          "&:hover .overflow-reveal-text": isClipped
            ? { transform: `translateX(-${marqueeDistance}px)` }
            : undefined,
        }}
      >
        <Box
          className="overflow-reveal-text"
          component="span"
          ref={textRef}
          sx={{
            display: "inline-block",
            maxWidth: "none",
            transition: isClipped
              ? `transform ${Math.min(6, Math.max(1.6, marqueeDistance / 42))}s linear`
              : undefined,
            willChange: isClipped ? "transform" : undefined,
          }}
        >
          {text}
        </Box>
      </Typography>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Typography sx={{ p: 1.5, maxWidth: 360 }}>{text}</Typography>
      </Popover>
    </>
  );
}

/**
 * @param {number} countDown
 * @returns {number[]} [hours, minutes, seconds]
 *
 * @example
 * formatTime(1000) // [0, 0, 1]
 *
 * @example
 * formatTime(1000 * 60 * 60 * 24) // [24, 0, 0]
 *
 * @description
 * Convert milliseconds to hours, minutes, seconds
 *
 */
const formatTime = (countDown) => {
  const hours = Math.floor(
    (countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

  return [hours, minutes, seconds];
};

/**
 *
 * @param {number} timerStartedAt
 * @param {number} timeLimitSeconds
 * @returns {JSX.Element}
 *
 * @example
 * <TimeLeft timerStartedAt={1634170800000} timeLimitSeconds={60} />
 *
 * @description
 * Display a countdown timer. Input is a timestamp and a number of seconds.
 */
const TimeLeft = React.memo(() => {
  const { grade, unit, sectionId, session } = useContext(UnitContext);
  const { sectionMap } = useContext(SectionContext);

  const baseTimeLimitSeconds = unit?.timeLimitSeconds || 0;
  // Apply this learner's timed-allowance accommodation (e.g. 1.5× time).
  const accommodation = getStudentAccommodation(
    sectionMap?.[sectionId]?.accommodations,
    session?.username,
  );
  const timeLimitSeconds =
    getEffectiveTimeAllowance(baseTimeLimitSeconds, accommodation) ||
    baseTimeLimitSeconds;
  const timerStartedAt = grade?.createdAt;

  const [countDown, setCountDown] = useState(timeLimitSeconds * 1000);

  useEffect(() => {
    if (!timerStartedAt) {
      setCountDown(timeLimitSeconds * 1000);
    } else if (timeLimitSeconds > 0 && timerStartedAt) {
      // Add the full allowance in one go (avoids the h/m/s truncation bug).
      const countDownDate =
        new Date(timerStartedAt).getTime() + timeLimitSeconds * 1000;

      const interval = setInterval(() => {
        const timeRemaining = countDownDate - new Date().getTime();
        if (timeRemaining <= 0) {
          setCountDown(0);
          clearInterval(interval);
        } else {
          setCountDown(timeRemaining);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timeLimitSeconds, timerStartedAt]);

  const [hoursLeft, minutesLeft, secondsLeft] = formatTime(countDown);
  const timeString = [
    hoursLeft.toString().padStart(2, "0"),
    minutesLeft.toString().padStart(2, "0"),
    secondsLeft.toString().padStart(2, "0"),
  ].join(":");

  const isOutOfTime = 0 >= hoursLeft && 0 >= minutesLeft && 0 >= secondsLeft;

  const chipColor = !isOutOfTime ? "primary" : undefined;

  return (
    <>
      {timeLimitSeconds > 0 && (
        <Chip
          icon={
            <TimerIcon sx={{ display: { xs: "none", sm: "inline-flex" } }} />
          }
          label={timeString}
          color={chipColor}
          sx={{
            ...workbookChipSx,
            "& .MuiChip-icon": {
              display: { xs: "none", sm: "inline-flex" },
            },
          }}
        />
      )}
    </>
  );
});

export function getSelectedNode(selection) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? anchorNode : focusNode;
  }
}

export default function ToolBarRoPlugin({
  open,
  setOpen,
  setTabValue,
  isScrolled = false,
}) {
  const t = useTranslations("workbook");
  const { unit, finishedQuestions, rubric } = React.useContext(UnitContext);
  const { toolbarPortalRef, toolbarChildrenPortalRef, appBarHeight } =
    useAppShell();
  const { xpLogs } = useXP();
  // Derive current streak from XP logs (latest streak entry)
  const currentStreak = React.useMemo(() => {
    const streakLogs = xpLogs.filter(
      (l) => l.reason === "STREAK_3DAY" || l.reason === "STREAK_7DAY",
    );
    return streakLogs.length > 0 ? (streakLogs.length >= 2 ? 7 : 3) : 0;
  }, [xpLogs]);

  const name = unit?.name;
  const description = unit?.description;

  const { toolbarRef, showLeftArrow, showRightArrow, scrollToolbar } =
    useToolbarScroll();

  const firstAppBarRef = React.useRef(null);
  const [firstAppBarHeight, setFirstAppBarHeight] = React.useState(0);

  // Sync --app-bar-height CSS variable from AppShell's measured height
  React.useEffect(() => {
    if (appBarHeight > 0) {
      document.documentElement.style.setProperty(
        "--app-bar-height",
        `${appBarHeight}px`,
      );
    }
  }, [appBarHeight]);

  return (
    <>
      <style global jsx>{`
        .editor-toolbar button {
          min-width: 1rem;
        }
      `}</style>
      {toolbarPortalRef?.current &&
        createPortal(
          <Box
            ref={firstAppBarRef}
            sx={{
              flexGrow: 1,
              overflowX: "hidden",
              transition: "all 0.3s ease",
              display: "contents",
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                margin: isScrolled ? "0.5rem 1rem" : "0.5rem 1rem",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1,
                width: "100%",
                maxWidth: "100%",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              <Box
                sx={{
                  flex: { xs: "0 0 auto", sm: "1 1 18rem" },
                  width: { xs: "100%", sm: "auto" },
                  minWidth: 0,
                  display: "block",
                  "& .MuiBox-root": {
                    maxWidth: { xs: "none", sm: 400 },
                  },
                }}
              >
                <GlobalSearchBar />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                  minWidth: 0,
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {showLeftArrow && (
                  <ToolbarScrollButton
                    direction="left"
                    onClick={() => scrollToolbar("left")}
                    ariaLabel={t("toolBarRoPlugin.scrollLeft", "Scroll left")}
                    height={isScrolled ? "1.5rem" : "2rem"}
                  />
                )}
                <Stack
                  ref={toolbarRef}
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    flex: 1,
                    minWidth: 0,
                    maxWidth: "100%",
                    overflowX: "hidden",
                    scrollSnapType: "x mandatory",
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                    msOverflowStyle: "none",
                    "& > *": {
                      scrollSnapAlign: "start",
                      flexShrink: 0,
                    },
                  }}
                >
                  <TimeLeft />
                  <StreakIndicator currentStreak={currentStreak} size="small" />
                  <ConnectionStatus
                    size={isScrolled ? "small" : "small"}
                    showLabel={!isScrolled}
                  />
                  <Chip
                    label={
                      <Box component="span">
                        {`${finishedQuestions} of ${rubric?.length || 0}`}
                        <Box
                          component="span"
                          sx={{
                            display: { xs: "none", sm: "inline" },
                            ml: 0.5,
                          }}
                        >
                          Questions Completed
                        </Box>
                      </Box>
                    }
                    variant="outlined"
                    size={isScrolled ? "small" : "medium"}
                    sx={workbookChipSx}
                  />
                </Stack>
                {showRightArrow && (
                  <ToolbarScrollButton
                    direction="right"
                    onClick={() => scrollToolbar("right")}
                    ariaLabel={t("toolBarRoPlugin.scrollRight", "Scroll right")}
                    height={isScrolled ? "1.5rem" : "2rem"}
                  />
                )}
              </Box>
            </Box>
          </Box>,
          toolbarPortalRef.current,
        )}
      {toolbarChildrenPortalRef?.current &&
        createPortal(
          <Box
            sx={{
              mx: 1,
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            <title>{name}</title>
            <OverflowRevealText
              text={name || t("toolBarRoPlugin.untitledUnit")}
              variant="body1"
              component="div"
              sx={{
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            />
            <OverflowRevealText
              text={description || t("toolBarRoPlugin.noDescription")}
              variant="caption"
              component="div"
              sx={{
                display: "block",
                color: "text.secondary",
                lineHeight: 1.15,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            />
          </Box>,
          toolbarChildrenPortalRef.current,
        )}
    </>
  );
}
