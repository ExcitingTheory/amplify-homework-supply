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
import { Box, Toolbar, Typography, Chip, Stack } from "@mui/material";
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
import { useXP } from "../../../context/gamificationContext";
import { StreakIndicator } from "../../Gamification/StreakIndicator";

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
  const { grade, unit } = useContext(UnitContext);

  const timeLimitSeconds = unit?.timeLimitSeconds || 0;
  const timerStartedAt = grade?.createdAt;

  const [countDown, setCountDown] = useState(timeLimitSeconds * 1000);

  useEffect(() => {
    if (!timerStartedAt) {
      setCountDown(timeLimitSeconds * 1000);
    } else if (timeLimitSeconds > 0 && timerStartedAt) {
      const [hours, minutes, seconds] = formatTime(timeLimitSeconds * 1000); //Convert to milliseconds
      let targetDate = new Date(timerStartedAt);

      targetDate.setMinutes(targetDate.getMinutes() + minutes); // timestamp
      targetDate.setSeconds(targetDate.getSeconds() + seconds); // timestamp

      const countDownDate = new Date(targetDate).getTime();

      const interval = setInterval(() => {
        console.log("TimeLeft.interval");
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
  const { toolbarChildrenPortalRef, appBarHeight } = useAppShell();
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
      {toolbarChildrenPortalRef?.current &&
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
                margin: isScrolled ? "0.5rem 1rem" : "1rem",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: isScrolled ? "center" : "flex-start",
                flexDirection: isScrolled ? "row" : "column",
                gap: isScrolled ? 2 : 0,
                width: "100%",
                maxWidth: "100%",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              <Box sx={{ flexGrow: 1, minWidth: 0, overflow: "hidden" }}>
                <title>{name}</title>
                <Typography
                  variant={isScrolled ? "body1" : "h6"}
                  component="div"
                  sx={{
                    flexGrow: 1,
                    transition: "all 0.3s ease",
                    fontWeight: isScrolled ? 500 : 400,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name || t("toolBarRoPlugin.untitledUnit")}
                </Typography>

                {!isScrolled && (
                  <Typography
                    variant="p"
                    component="div"
                    sx={{
                      flexGrow: 1,
                      transition: "opacity 0.3s ease",
                      display: { xs: "none", sm: "block" },
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {description || t("toolBarRoPlugin.noDescription")}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                  minWidth: 0,
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
          toolbarChildrenPortalRef.current,
        )}
    </>
  );
}
