/**
 * LeaderboardTable — Mode A: XP-ranked leaderboard for a cohort.
 *
 * Always pins the current student's row even if they're far down.
 * Top 3 get medal emojis.
 *
 * @module LeaderboardTable
 */

import React from "react";
import { useTranslations } from "next-intl";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { AvatarDisplay } from "../Gamification/AvatarDisplay";
import { Medallion } from "../Gamification/Medallion";
import { getMetals, type MetalKey } from "@/themes/heraldry";
import type {
  AvatarStyleTier,
  AvatarOverrides,
} from "../Gamification/DiceBearAvatar";

export interface LeaderboardEntry {
  profileHidden?: boolean;
  studentId: string;
  studentName: string;
  avatarColor: string;
  totalXP: number;
  level: number;
  currentStreak: number;
  /** DiceBear style tier from the student's saved config. When undefined, avatar is not yet loaded. */
  avatarStyle?: AvatarStyleTier;
  /** DiceBear overrides from the student's saved config. */
  avatarOverrides?: AvatarOverrides;
  /** Seed string for DiceBear generation. Falls back to studentId. */
  avatarSeed?: string;
  /** Whether this entry's avatar config has been resolved (true = render avatar, false/undefined = show placeholder). */
  avatarLoaded?: boolean;
}

export interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentStudentId: string;
  /** Number of top rows to always show. Defaults to 5. */
  topN?: number;
  /** "table" (default, full columns incl. Lvl/Streak) or "compact" (narrow sidebar-card list). */
  variant?: "table" | "compact";
}

// Ranks #1-#3 read as gold/silver/bronze heraldic medallions (shared finish with LevelBadge/StreakShield).
const RANK_METALS: MetalKey[] = ["gold", "silver", "bronze"];

function RankBadge({ rank }: { rank: number }) {
  const t = useTranslations("components");
  const theme = useTheme();
  if (rank > 3) {
    return (
      <Typography variant="body2" sx={{ textAlign: "center", fontWeight: 600 }}>
        {rank}
      </Typography>
    );
  }
  const metal = getMetals(theme)[RANK_METALS[rank - 1]];
  return (
    <Medallion
      shape="disc"
      size={26}
      rimMetal={metal}
      fieldColor={metal.mid}
      ariaLabel={t("leaderboardTable.rankAriaLabel", { rank })}
      charge={
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            fontSize: "0.7rem",
            color: theme.palette.getContrastText(metal.mid),
          }}
        >
          {rank}
        </Typography>
      }
    />
  );
}

function StudentAvatar({ entry }: { entry: LeaderboardEntry }) {
  if (!entry.avatarLoaded) {
    return <Skeleton variant="circular" width={24} height={24} />;
  }
  return (
    <AvatarDisplay
      profileUsername={entry.profileHidden ? undefined : entry.studentId}
      label={entry.studentName}
      seed={entry.avatarSeed || entry.studentId}
      size={24}
      style={entry.avatarStyle || "simple"}
      overrides={entry.avatarOverrides}
    />
  );
}

/** Single sidebar-card row: rank medallion, avatar, name, XP — no Lvl/Streak columns. */
const GAP_INDICATOR = "⋯";

function CompactRow({
  entry,
  rank,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
}) {
  const t = useTranslations("components");
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 1,
        py: 0.75,
        borderRadius: 1,
        bgcolor: isCurrentUser ? "action.selected" : undefined,
      }}
    >
      <RankBadge rank={rank} />
      <StudentAvatar entry={entry} />
      <Typography
        variant="body2"
        fontWeight={isCurrentUser ? 700 : 500}
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {isCurrentUser
          ? t("leaderboardTable.currentUserName", { name: entry.studentName })
          : entry.studentName}
      </Typography>
      <Typography variant="body2" fontWeight={700} color="primary.main">
        {entry.totalXP}
      </Typography>
    </Box>
  );
}

export function LeaderboardTable({
  entries,
  currentStudentId,
  topN = 5,
  variant = "table",
}: LeaderboardTableProps) {
  const t = useTranslations("components");
  const sorted = [...entries].sort((a, b) => b.totalXP - a.totalXP);
  const currentIndex = sorted.findIndex(
    (e) => e.studentId === currentStudentId,
  );

  // Determine which rows to show
  const topRows = sorted.slice(0, topN);
  const showGap = currentIndex >= topN;
  const currentRow = showGap ? sorted[currentIndex] : null;

  if (variant === "compact") {
    return (
      <Paper
        variant="outlined"
        data-testid="leaderboard-table"
        sx={{ p: 1, maxWidth: 320 }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 700, px: 1, display: "block" }}
        >
          {t("leaderboardTable.topStudents")}
        </Typography>
        {topRows.map((entry, index) => (
          <CompactRow
            key={entry.studentId}
            entry={entry}
            rank={index + 1}
            isCurrentUser={entry.studentId === currentStudentId}
          />
        ))}
        {showGap && currentRow && (
          <>
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: "block", textAlign: "center", py: 0.5 }}
            >
              {GAP_INDICATOR}
            </Typography>
            <CompactRow
              entry={currentRow}
              rank={currentIndex + 1}
              isCurrentUser
            />
          </>
        )}
      </Paper>
    );
  }

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      data-testid="leaderboard-table"
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>{t("leaderboardTable.studentHeader")}</TableCell>
            <TableCell align="right">XP</TableCell>
            <TableCell align="right">
              {t("leaderboardTable.levelHeader")}
            </TableCell>
            <TableCell align="right">
              {t("leaderboardTable.streakHeader")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {topRows.map((entry, index) => {
            const isCurrentUser = entry.studentId === currentStudentId;
            const rank = index + 1;
            return (
              <TableRow
                key={entry.studentId}
                sx={{
                  backgroundColor: isCurrentUser
                    ? "action.selected"
                    : undefined,
                  fontWeight: isCurrentUser ? 700 : 400,
                }}
              >
                <TableCell>
                  <RankBadge rank={rank} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <StudentAvatar entry={entry} />
                    <Typography
                      variant="body2"
                      fontWeight={isCurrentUser ? 700 : 400}
                    >
                      {isCurrentUser
                        ? t("leaderboardTable.currentUserName", {
                            name: entry.studentName,
                          })
                        : entry.studentName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">{entry.totalXP}</TableCell>
                <TableCell align="right">{entry.level}</TableCell>
                <TableCell align="right">
                  {entry.currentStreak > 0
                    ? t("leaderboardTable.streakDays", {
                        days: entry.currentStreak,
                      })
                    : "—"}
                </TableCell>
              </TableRow>
            );
          })}

          {showGap && currentRow && (
            <>
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 0.5 }}>
                  <Typography variant="caption" color="text.disabled">
                    ···
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow sx={{ backgroundColor: "action.selected" }}>
                <TableCell>{currentIndex + 1}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <StudentAvatar entry={currentRow} />
                    <Typography variant="body2" fontWeight={700}>
                      {t("leaderboardTable.currentUserName", {
                        name: currentRow.studentName,
                      })}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">{currentRow.totalXP}</TableCell>
                <TableCell align="right">{currentRow.level}</TableCell>
                <TableCell align="right">
                  {currentRow.currentStreak > 0
                    ? t("leaderboardTable.streakDays", {
                        days: currentRow.currentStreak,
                      })
                    : "—"}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default LeaderboardTable;
