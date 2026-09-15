"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Chip,
  Divider,
  Grid,
  Alert,
} from "@mui/material";
import {
  Warning,
  CheckCircle,
  CompareArrows,
  CloudDone,
  Storage,
} from "@mui/icons-material";
import { resolveGradeConflict } from "../offline/conflictResolution";

export interface ConflictBlockData {
  userAnswer?: string;
  complete?: boolean;
  accuracy?: number;
  gradedOffline?: boolean;
  prompt?: string;
  expectedAnswer?: string;
  [key: string]: unknown;
}

export interface GradeConflictDetails {
  gradeId: string;
  localVersion?: number;
  serverVersion?: number;
  localData: Record<string, ConflictBlockData>;
  serverData: Record<string, ConflictBlockData>;
  requiresInstructorReview?: boolean;
}

export interface ConflictResolutionDialogProps {
  open: boolean;
  conflict: GradeConflictDetails | null;
  onClose: () => void;
  onResolve: (result: {
    strategy: "local-wins" | "server-wins" | "merge";
    mergedData: Record<string, ConflictBlockData>;
    requiresInstructorReview?: boolean;
  }) => Promise<void> | void;
}

/**
 * ConflictResolutionDialog — UI dialogue for resolving version & grade conflicts
 * during offline sync.
 *
 * Displays side-by-side comparison of local student submissions vs server state,
 * highlighting score discrepancies >15 points, and allows choosing resolution mode:
 * 1. Local Student Answers Win (canonical student work)
 * 2. Server Version Wins (override local)
 * 3. Smart Merge & Flag for Instructor Review
 */
export default function ConflictResolutionDialog({
  open,
  conflict,
  onClose,
  onResolve,
}: ConflictResolutionDialogProps) {
  const [strategy, setStrategy] = useState<
    "local-wins" | "server-wins" | "merge"
  >("local-wins");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (conflict?.requiresInstructorReview) {
      setStrategy("merge");
    } else {
      setStrategy("local-wins");
    }
  }, [conflict]);

  if (!conflict) return null;

  const { localData, serverData, localVersion, serverVersion } = conflict;
  const blockIds = Array.from(
    new Set([
      ...Object.keys(localData || {}),
      ...Object.keys(serverData || {}),
    ]),
  );

  // Compute merged result for preview
  const mergedResult = resolveGradeConflict(localData || {}, serverData || {});

  const handleApplyResolution = async () => {
    setSubmitting(true);
    try {
      let finalData: Record<string, ConflictBlockData>;
      let requiresReview = mergedResult.requiresInstructorReview ?? false;

      if (strategy === "local-wins") {
        finalData = { ...serverData, ...localData };
      } else if (strategy === "server-wins") {
        finalData = { ...localData, ...serverData };
        requiresReview = false;
      } else {
        finalData = mergedResult.mergedData as Record<
          string,
          ConflictBlockData
        >;
      }

      await onResolve({
        strategy,
        mergedData: finalData,
        requiresInstructorReview: requiresReview,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="conflict-resolution-dialog-title"
      data-testid="conflict-resolution-dialog"
    >
      <DialogTitle id="conflict-resolution-dialog-title" sx={{ m: 0, p: 2 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <CompareArrows color="warning" />
          <Typography variant="h6" component="span" fontWeight="bold">
            Sync Conflict Resolution
          </Typography>
          <Chip
            label={`Grade: ${conflict.gradeId.slice(0, 8)}...`}
            size="small"
            variant="outlined"
            sx={{ ml: "auto" }}
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {mergedResult.requiresInstructorReview && (
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
            Score discrepancy detected between local offline grade and server
            state (&gt;15 point difference). Resolution will flag this
            submission for instructor review.
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Local version (v{localVersion ?? "?"}) was modified offline while
            the server version (v{serverVersion ?? "?"}) had updates. Review the
            block differences below and choose a resolution strategy.
          </Typography>
        </Box>

        {/* Block Comparisons */}
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          Block Comparisons ({blockIds.length})
        </Typography>

        <Box display="flex" flexDirection="column" gap={2} sx={{ mb: 3 }}>
          {blockIds.map((blockId) => {
            const localBlock = localData[blockId];
            const serverBlock = serverData[blockId];
            const diffScore =
              localBlock?.accuracy != null && serverBlock?.accuracy != null
                ? Math.abs(localBlock.accuracy - serverBlock.accuracy)
                : 0;

            return (
              <Card
                key={blockId}
                variant="outlined"
                data-testid={`conflict-block-${blockId}`}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography variant="subtitle2" color="primary">
                      Block ID: {blockId}
                    </Typography>
                    {diffScore > 15 && (
                      <Chip
                        icon={<Warning />}
                        label={`Score diff: ${diffScore} pts`}
                        color="warning"
                        size="small"
                      />
                    )}
                  </Box>

                  {localBlock?.prompt && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1.5 }}
                    >
                      <strong>Prompt:</strong> {localBlock.prompt}
                    </Typography>
                  )}

                  <Grid container spacing={2}>
                    {/* Local (Offline) State */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: "action.hover",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={0.5}
                          mb={0.5}
                        >
                          <Storage fontSize="small" color="primary" />
                          <Typography
                            variant="caption"
                            fontWeight="bold"
                            color="primary"
                          >
                            Local Offline Version
                          </Typography>
                          {localBlock?.gradedOffline && (
                            <Chip
                              label="Offline Graded"
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 18,
                                fontSize: "0.65rem",
                                ml: "auto",
                              }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2">
                          <strong>Answer:</strong>{" "}
                          {localBlock?.userAnswer || "—"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Score:</strong>{" "}
                          {localBlock?.accuracy != null
                            ? `${localBlock.accuracy}%`
                            : "—"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Completed:</strong>{" "}
                          {localBlock?.complete ? "Yes" : "No"}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Server State */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: "action.hover",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={0.5}
                          mb={0.5}
                        >
                          <CloudDone fontSize="small" color="secondary" />
                          <Typography
                            variant="caption"
                            fontWeight="bold"
                            color="secondary"
                          >
                            Server Version
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          <strong>Answer:</strong>{" "}
                          {serverBlock?.userAnswer || "—"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Score:</strong>{" "}
                          {serverBlock?.accuracy != null
                            ? `${serverBlock.accuracy}%`
                            : "—"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Completed:</strong>{" "}
                          {serverBlock?.complete ? "Yes" : "No"}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Strategy Selection */}
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ fontWeight: "bold", mb: 1 }}>
            Select Conflict Resolution Strategy
          </FormLabel>
          <RadioGroup
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as any)}
            data-testid="strategy-radio-group"
          >
            <FormControlLabel
              value="local-wins"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    Keep Local Answers (Student Wins)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Preserves student&apos;s offline answers and scores as
                    canonical. Server feedback is retained.
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="merge"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    Smart Merge &amp; Flag for Review
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Merges local answers with server data and flags for
                    instructor review if scores conflict.
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="server-wins"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    Overwrite with Server Version
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Discards local offline edits and reverts completely to
                    server state.
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleApplyResolution}
          disabled={submitting}
          startIcon={<CheckCircle />}
          data-testid="apply-resolution-button"
        >
          {submitting ? "Applying..." : "Apply & Sync"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
