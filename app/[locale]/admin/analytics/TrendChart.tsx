"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import type { TrendPoint } from "./analyticsInsights";

export interface TrendChartProps {
  title: string;
  points: TrendPoint[];
  formatValue: (value: number) => string;
  color?: string;
  anomalyDates?: Set<string>;
  loading?: boolean;
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 100;
const PADDING = 10;

/** Minimal dependency-free SVG line/area trend chart with anomaly markers. */
export function TrendChart({
  title,
  points,
  formatValue,
  color = "#1976d2",
  anomalyDates,
  loading,
}: TrendChartProps) {
  if (loading) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardContent>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Skeleton variant="rectangular" height={CHART_HEIGHT} />
        </CardContent>
      </Card>
    );
  }

  if (points.length === 0) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardContent>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No data for this range
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX =
    points.length > 1 ? (CHART_WIDTH - PADDING * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => ({
    ...p,
    x: PADDING + i * stepX,
    y:
      CHART_HEIGHT -
      PADDING -
      ((p.value - min) / range) * (CHART_HEIGHT - PADDING * 2),
  }));

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(2)},${CHART_HEIGHT - PADDING} L${coords[0].x.toFixed(2)},${CHART_HEIGHT - PADDING} Z`;

  const latest = points[points.length - 1];

  return (
    <Card
      variant="outlined"
      sx={{ height: "100%" }}
      data-testid="analytics-chart"
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="subtitle2">
            {formatValue(latest.value)}
          </Typography>
        </Box>
        <Box
          component="svg"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          width="100%"
          height={CHART_HEIGHT}
          role="img"
          aria-label={`${title} trend from ${points[0].date} to ${latest.date}`}
          sx={{ mt: 1, display: "block" }}
        >
          <path d={areaPath} fill={color} fillOpacity={0.12} stroke="none" />
          <path d={linePath} fill="none" stroke={color} strokeWidth={2} />
          {coords.map((c) => {
            const isAnomaly = anomalyDates?.has(c.date) ?? false;
            return (
              <circle
                key={c.date}
                cx={c.x}
                cy={c.y}
                r={isAnomaly ? 4 : 2}
                fill={isAnomaly ? "#d32f2f" : color}
                stroke={isAnomaly ? "#d32f2f" : "none"}
              >
                <title>
                  {c.date}: {formatValue(c.value)}
                  {isAnomaly ? " (anomaly)" : ""}
                </title>
              </circle>
            );
          })}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            {points[0].date}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {latest.date}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
