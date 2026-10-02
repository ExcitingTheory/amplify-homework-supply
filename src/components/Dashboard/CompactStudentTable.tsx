"use client";
import React from "react";
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { AvatarDisplay } from "../Gamification/AvatarDisplay";

const MEDALS = ["🥇", "🥈", "🥉"];

function gradeColor(pct: number): "success" | "warning" | "error" {
  if (pct >= 80) return "success";
  if (pct >= 60) return "warning";
  return "error";
}

export interface CompactStudentRow {
  studentId: string;
  name: string;
  average: number;
  unitsCompleted?: number;
}

export interface CompactStudentTableProps {
  students: CompactStudentRow[];
  /** Full roster size, when the table only shows a leading slice of it */
  totalCount?: number;
}

/** Condensed student leaderboard/roster — replaces per-student card tiles to cut vertical scroll. */
export function CompactStudentTable({
  students,
  totalCount,
}: CompactStudentTableProps) {
  if (students.length === 0) return null;
  const overflow = totalCount != null ? totalCount - students.length : 0;

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ borderRadius: 2, overflow: "hidden" }}
    >
      <Table size="small" aria-label="student performance matrix table">
        <TableHead sx={{ bgcolor: "action.hover" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">
              Units Completed
            </TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">
              Average
            </TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">
              Rank
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((row, idx) => (
            <TableRow key={row.studentId} hover>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <AvatarDisplay
                    seed={row.studentId}
                    size={28}
                    style="simple"
                  />
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: idx < 3 ? 700 : 600 }}
                    noWrap
                  >
                    {row.name}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" color="text.secondary">
                  {row.unitsCompleted ?? "—"}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    // Plain text for solid scores; color only flags scores that need attention.
                    color:
                      row.average < 80
                        ? `${gradeColor(row.average)}.main`
                        : "text.primary",
                  }}
                >
                  {Math.round(row.average)}%
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: "text.secondary" }}
                >
                  {MEDALS[idx] || `#${idx + 1}`}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {overflow > 0 && (
        <Box
          sx={{
            py: 1,
            textAlign: "center",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            +{overflow} more students
          </Typography>
        </Box>
      )}
    </TableContainer>
  );
}
