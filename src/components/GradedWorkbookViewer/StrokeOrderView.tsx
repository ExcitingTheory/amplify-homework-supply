"use client";

/**
 * Shows a drawing from its stored strokes (GradeResponse.strokes), numbered
 * in the order the student drew them, with a replay and a download that
 * opens in Excalidraw. Nothing is fetched: the strokes are the drawing.
 */

import * as React from "react";
import { useTranslations } from "next-intl";
import { Box, Button, Stack, Typography } from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import DownloadIcon from "@mui/icons-material/Download";
import {
  buildDrawingFile,
  decodeStrokes,
  elementsFromStrokes,
} from "../../utils/strokeLog";

interface StrokeOrderViewProps {
  /** encodeStrokes() output as stored on the GradeResponse item */
  strokes: any;
  /** Used for the download's file name */
  fileName?: string;
  height?: number;
}

const PAD = 16;

// SVG presentation values kept out of JSX so they are not read as UI text.
const LINE_PROPS = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;
const MARKER_PROPS = {
  fill: "var(--mui-palette-primary-main, #1976d2)",
  opacity: 0.9,
} as const;
const LABEL_PROPS = {
  textAnchor: "middle",
  dominantBaseline: "central",
  fill: "#fff",
} as const;
const SVG_WIDTH = "100%";
const FRAME_SX = {
  border: 1,
  borderColor: "divider",
  borderRadius: 1,
  bgcolor: "background.paper",
  color: "text.primary",
  "@keyframes hsStrokeDraw": {
    from: { strokeDashoffset: 1 },
    to: { strokeDashoffset: 0 },
  },
} as const;
const DRAW_MS = { min: 150, max: 1200 };
const GAP_MS = 150;

export function StrokeOrderView({
  strokes,
  fileName = "drawing",
  height = 180,
}: StrokeOrderViewProps) {
  const t = useTranslations("components");
  const [replayKey, setReplayKey] = React.useState(0);

  const drawn = React.useMemo(() => {
    const log = decodeStrokes(strokes);
    if (!log) return null;
    const kept = log.strokes
      .filter((s: any) => s.deletedAt == null && s.points.length)
      .sort((a: any, b: any) => a.order - b.order)
      .map((s: any) => ({
        width: s.width || 2,
        durationMs: Math.max(0, s.endedAt - s.startedAt),
        points: s.points.map(([px, py]: number[]) => [s.x + px, s.y + py]),
      }));
    if (!kept.length) return null;
    const xs = kept.flatMap((s: any) => s.points.map((p: number[]) => p[0]));
    const ys = kept.flatMap((s: any) => s.points.map((p: number[]) => p[1]));
    const minX = Math.min(...xs) - PAD;
    const minY = Math.min(...ys) - PAD;
    const w = Math.max(...xs) - Math.min(...xs) + PAD * 2;
    const h = Math.max(...ys) - Math.min(...ys) + PAD * 2;
    // Replay with compressed timing: each stroke takes its own drawing time
    // (clamped), with a short pause between strokes.
    let delay = 0;
    const timed = kept.map((s: any) => {
      const duration = Math.min(DRAW_MS.max, Math.max(DRAW_MS.min, s.durationMs));
      const item = { ...s, delay, duration };
      delay += duration + GAP_MS;
      return item;
    });
    return { log, strokes: timed, viewBox: `${minX} ${minY} ${w} ${h}`, scale: Math.max(w, h) / 300 };
  }, [strokes]);

  const download = React.useCallback(() => {
    if (!drawn) return;
    const file = buildDrawingFile({
      elements: elementsFromStrokes(drawn.log),
      strokeLog: drawn.log,
    });
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(file)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.excalidraw`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [drawn, fileName]);

  if (!drawn) return null;
  const marker = 9 * drawn.scale;

  return (
    <Box>
      <Box sx={FRAME_SX}>
        <svg
          key={replayKey}
          viewBox={drawn.viewBox}
          width={SVG_WIDTH}
          height={height}
          role="img"
          aria-label={t("studentResponses.strokeOrderAlt", {
            count: drawn.strokes.length,
          })}
        >
          {drawn.strokes.map((s: any, i: number) => (
            <polyline
              key={`line-${i}`}
              points={s.points.map((p: number[]) => p.join(",")).join(" ")}
              {...LINE_PROPS}
              strokeWidth={Math.max(1.5, s.width * 1.5) * drawn.scale}
              pathLength={1}
              strokeDasharray={replayKey ? 1 : undefined}
              style={
                replayKey
                  ? {
                      strokeDashoffset: 1,
                      animation: `hsStrokeDraw ${s.duration}ms linear ${s.delay}ms forwards`,
                    }
                  : undefined
              }
            />
          ))}
          {drawn.strokes.map((s: any, i: number) => (
            <g key={`n-${i}`}>
              <circle
                cx={s.points[0][0]}
                cy={s.points[0][1]}
                r={marker}
                {...MARKER_PROPS}
              />
              <text
                x={s.points[0][0]}
                y={s.points[0][1]}
                fontSize={marker * 1.2}
                {...LABEL_PROPS}
              >
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
      </Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {t("studentResponses.strokeCount", { count: drawn.strokes.length })}
        </Typography>
        <Button
          size="small"
          startIcon={<ReplayIcon fontSize="small" />}
          onClick={() => setReplayKey((k) => k + 1)}
        >
          {t("studentResponses.replay")}
        </Button>
        <Button
          size="small"
          startIcon={<DownloadIcon fontSize="small" />}
          onClick={download}
        >
          {t("studentResponses.downloadExcalidraw")}
        </Button>
      </Stack>
    </Box>
  );
}

export default StrokeOrderView;
