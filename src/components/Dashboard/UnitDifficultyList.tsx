"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { CompletionBar } from "./GradeRangeBar";

export interface UnitDifficultyListProps {
  /** Units sorted hardest (lowest avg) first. */
  units: {
    unitID: string;
    name: string;
    avg: number;
    studentCount: number;
  }[];
}

const LOW_AVG_THRESHOLD = 70;

/** Ranked list of the hardest units across every section — the same unit taught in multiple sections is already merged by the caller. */
export function UnitDifficultyList({ units }: UnitDifficultyListProps) {
  const t = useTranslations("components");
  if (units.length === 0) return null;

  return (
    <Stack spacing={1.5}>
      {units.map((unit, i) => (
        <Box key={unit.unitID}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 0.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: "text.disabled", width: 16 }}
            >
              {i + 1}
            </Typography>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {unit.name}
            </Typography>
            {unit.avg < LOW_AVG_THRESHOLD && (
              <Chip
                label={t("unitDifficultyList.lowAvg")}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ height: 18, fontSize: "0.6rem" }}
              />
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: "auto", flexShrink: 0 }}
            >
              {t("unitDifficultyList.studentCount", {
                count: unit.studentCount,
              })}
            </Typography>
          </Box>
          <CompletionBar pct={unit.avg} />
        </Box>
      ))}
    </Stack>
  );
}
