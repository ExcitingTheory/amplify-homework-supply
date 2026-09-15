"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { WifiOff, MenuBook, ChevronRight } from "@mui/icons-material";
import { RefreshButton } from "./RefreshButton";
import {
  getAllCachedAssignments,
  type CachedAssignment,
} from "@/offline/OfflineDataStore";

/**
 * Client body of the offline fallback page. Lists the assignments that were
 * prefetched into the OfflineDataStore (IndexedDB) so a student can keep
 * working without connectivity. `null` = still loading local cache.
 */
export function OfflinePageContent() {
  const [assignments, setAssignments] = useState<CachedAssignment[] | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    getAllCachedAssignments()
      .then((items) => {
        if (cancelled) return;
        const sorted = [...items].sort(
          (a, b) => (b.cachedAt || 0) - (a.cachedAt || 0),
        );
        setAssignments(sorted);
      })
      .catch(() => {
        if (!cancelled) setAssignments([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasAssignments = (assignments?.length ?? 0) > 0;

  return (
    <Container maxWidth="sm" data-tour="offline-page">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
          textAlign: "center",
          gap: 3,
          py: 4,
        }}
      >
        <WifiOff sx={{ fontSize: 64, color: "text.secondary" }} />
        <Typography variant="h4" component="h1">
          You&apos;re offline
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your saved work is safe and will sync when you reconnect.
        </Typography>

        {hasAssignments ? (
          <Box sx={{ width: "100%", textAlign: "left" }}>
            <Typography
              variant="overline"
              color="text.secondary"
              component="h2"
              sx={{ display: "block", mb: 1 }}
            >
              Available offline
            </Typography>
            <List
              disablePadding
              sx={{
                width: "100%",
                bgcolor: "background.paper",
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
              }}
            >
              {assignments!.map((assignment, index) => (
                <ListItem
                  key={assignment.id}
                  disablePadding
                  divider={index < assignments!.length - 1}
                >
                  <ListItemButton
                    component={Link}
                    href={`/workbook/${assignment.unitID}`}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <MenuBook color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={assignment.unitName || "Assignment"}
                      secondary={
                        assignment.dueDate
                          ? `Due ${new Date(
                              assignment.dueDate,
                            ).toLocaleDateString()}`
                          : "Cached for offline use"
                      }
                    />
                    <ChevronRight color="action" />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        ) : assignments !== null ? (
          <Typography variant="body2" color="text.secondary">
            No assignments are cached yet. Open an assignment while online and
            it&apos;ll be available here offline.
          </Typography>
        ) : null}

        <RefreshButton />
      </Box>
    </Container>
  );
}
