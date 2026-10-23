/**
 * @fileoverview TimelineCard — individual dialogue card on the horizontal timeline.
 *
 * Rendered inside HorizontalTimeline, one per dialogue line. Shows truncated
 * text, direction note, emotion chip, and a mini waveform when a take exists.
 * Clicking a card selects it; dragging horizontally repositions it in time,
 * clamped to the gaps left by neighboring cards on the same speaker track.
 */

import React, { useRef, useState, useCallback } from "react";
import { Box, Chip, Typography, Tooltip } from "@mui/material";
import { GraphicEq as WaveformIcon } from "@mui/icons-material";
import { useTranslations } from "next-intl";

/** Pixel movement below this threshold is treated as a click, not a drag. */
const DRAG_THRESHOLD_PX = 4;

interface TimelineCardProps {
  line: any;
  speaker: any;
  isSelected: boolean;
  left: number;
  width: number;
  /** Pixels-per-second at the current zoom level, used to convert drag deltas to time. */
  pxPerSec: number;
  /** Earliest start time (seconds) this card may be dragged to — bounded by the previous card. */
  minStart?: number;
  /** Latest start time (seconds) this card may be dragged to — bounded by the next card. */
  maxStart?: number;
  readOnly?: boolean;
  onClick: (id: string) => void;
  /** Called once a drag finishes with the new start/end (seconds) for this dialogue line. */
  onDragEnd?: (id: string, start: number, end: number) => void;
}

export default function TimelineCard({
  line,
  speaker,
  isSelected,
  left,
  width,
  pxPerSec,
  minStart = 0,
  maxStart = Infinity,
  readOnly = false,
  onClick,
  onDragEnd,
}: TimelineCardProps) {
  const t = useTranslations("components");
  const activeTake =
    line.activeTakeIndex !== null && line.takes?.[line.activeTakeIndex];

  const duration = line.timing.end - line.timing.start;
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    originalStart: number;
    moved: boolean;
  } | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (readOnly || !onDragEnd) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        originalStart: line.timing.start,
        moved: false,
      };
    },
    [readOnly, onDragEnd, line.timing.start],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const deltaPx = e.clientX - drag.startClientX;
      if (!drag.moved && Math.abs(deltaPx) < DRAG_THRESHOLD_PX) return;
      drag.moved = true;
      const deltaSec = deltaPx / pxPerSec;
      const newStart = Math.min(
        maxStart,
        Math.max(minStart, drag.originalStart + deltaSec),
      );
      setDragStart(newStart);
    },
    [pxPerSec, minStart, maxStart],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
      if (drag.moved) {
        const finalStart = dragStart ?? drag.originalStart;
        setDragStart(null);
        if (onDragEnd && finalStart !== drag.originalStart) {
          onDragEnd(line.id, finalStart, finalStart + duration);
        }
      } else {
        setDragStart(null);
        onClick(line.id);
      }
    },
    [dragStart, duration, line.id, onClick, onDragEnd],
  );

  const displayLeft = dragStart !== null ? dragStart * pxPerSec : left;

  return (
    <Tooltip
      title={line.text || t("timelineCard.emptyText")}
      enterDelay={400}
      placement="top"
    >
      <Box
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClick(line.id);
        }}
        aria-label={t("timelineCard.ariaLabel", {
          speaker: speaker?.name || t("timelineCard.unknownSpeaker"),
          text: line.text || t("timelineCard.emptyAriaText"),
        })}
        sx={{
          position: "absolute",
          left: displayLeft,
          width: Math.max(width, 60),
          top: 4,
          bottom: 4,
          borderRadius: 1,
          bgcolor: isSelected ? "primary.main" : "primary.light",
          color: isSelected ? "primary.contrastText" : "text.primary",
          opacity: isSelected ? 1 : 0.85,
          border: isSelected ? 2 : 1,
          borderColor: isSelected ? "primary.dark" : "divider",
          cursor:
            readOnly || !onDragEnd
              ? "pointer"
              : dragStart !== null
                ? "grabbing"
                : "grab",
          overflow: "hidden",
          px: 0.75,
          py: 0.5,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          transition:
            dragStart !== null ? "none" : "opacity 0.15s, border-color 0.15s",
          touchAction: "none",
          "&:hover": { opacity: 1, borderColor: "primary.main" },
        }}
      >
        {/* Dialogue text */}
        <Typography
          variant="caption"
          noWrap
          sx={{ fontWeight: 500, lineHeight: 1.3 }}
        >
          {line.text || t("timelineCard.emptyText")}
        </Typography>

        {/* Direction note (italic sub-line) */}
        {line.direction && (
          <Typography
            variant="caption"
            noWrap
            sx={{
              fontStyle: "italic",
              opacity: 0.7,
              fontSize: "0.65rem",
              lineHeight: 1.2,
            }}
          >
            {line.direction}
          </Typography>
        )}

        {/* Bottom row: emotion chip + waveform indicator */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
          {line.emotion && (
            <Chip
              label={line.emotion}
              size="small"
              sx={{
                height: 16,
                fontSize: "0.6rem",
                "& .MuiChip-label": { px: 0.5 },
              }}
            />
          )}
          {activeTake && <WaveformIcon sx={{ fontSize: 12, opacity: 0.6 }} />}
        </Box>
      </Box>
    </Tooltip>
  );
}
