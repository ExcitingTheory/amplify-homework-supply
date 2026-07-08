"use client";
/**
 * CampaignContextWidget — Floating instructor panel shown in the unit editor.
 *
 * Displays which campaign chapters link to this unit, warns when none do,
 * and provides a quick link to each section's gamification settings.
 * Also exposes a quick-config surface (Phase 4.2) for adding the unit to
 * a chapter and previewing the student-facing narrative.
 *
 * Lazy-loads on first expand to avoid any subscription cost while the editor
 * is idle.
 *
 * @module CampaignContextWidget
 */

import React, { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CampaignIcon from "@mui/icons-material/Campaign";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { generateClient } from "aws-amplify/data";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const client = generateClient();

interface ChapterReference {
  challengeId: string;
  challengeTitle: string;
  cohortId: string;
  setting?: string | null;
  active: boolean;
  chapterOrder?: number | null;
  targetXP: number;
  currentXP: number;
}

export interface CampaignContextWidgetProps {
  unitId: string;
  locale?: string;
}

export function CampaignContextWidget({
  unitId,
  locale = "en",
}: CampaignContextWidgetProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState<ChapterReference[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Lazy-load linked chapters on first expand
  useEffect(() => {
    if (!expanded || loaded || !unitId) return;
    let cancelled = false;
    setLoading(true);

    async function fetchLinkedChapters() {
      try {
        // Gen 2 doesn't support array-contains filter — fetch all and filter
        // client-side. GroupChallenge count is small per-tenant.
        const { data } = await (client.models as any).GroupChallenge.list();
        if (cancelled) return;

        const linked: ChapterReference[] = (data ?? [])
          .filter(
            (c: any) =>
              c != null &&
              Array.isArray(c.linkedUnitIds) &&
              c.linkedUnitIds.includes(unitId),
          )
          .map((c: any) => ({
            challengeId: c.id,
            challengeTitle: c.title,
            cohortId: c.cohortId,
            setting: c.setting,
            active: c.active !== false,
            chapterOrder: c.chapterOrder,
            targetXP: c.targetXP ?? 0,
            currentXP: c.currentXP ?? 0,
          }));

        setChapters(linked);
        setLoaded(true);
      } catch (err) {
        console.warn("[CampaignContextWidget] Failed to load chapters:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLinkedChapters();
    return () => {
      cancelled = true;
    };
  }, [expanded, loaded, unitId]);

  const progressPct = (ch: ChapterReference) =>
    ch.targetXP > 0
      ? Math.min(100, Math.round((ch.currentXP / ch.targetXP) * 100))
      : 0;

  return (
    <Card
      variant="outlined"
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1200,
        width: expanded ? 340 : "auto",
        maxHeight: "70vh",
        overflowY: expanded ? "auto" : "hidden",
        borderRadius: 2,
        boxShadow: 4,
      }}
      role="complementary"
      aria-label="Campaign context for this unit"
    >
      {/* Toggle header */}
      <Box
        component="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={`campaign-ctx-${unitId}`}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          px: 2,
          py: 1.25,
          textAlign: "left",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <CampaignIcon color="primary" fontSize="small" />
        {expanded && (
          <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
            Campaign Context
          </Typography>
        )}
        <ExpandMoreIcon
          fontSize="small"
          sx={{
            transition: reducedMotion ? "none" : "transform 0.2s",
            transform: expanded ? "rotate(180deg)" : "none",
          }}
        />
      </Box>

      {/* Content */}
      <Collapse in={expanded} id={`campaign-ctx-${unitId}`}>
        <Divider />
        <CardContent sx={{ pt: 1.5 }}>
          {loading && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Loading…
              </Typography>
            </Box>
          )}

          {!loading && loaded && chapters.length === 0 && (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon fontSize="small" />}
              sx={{ mb: 1, fontSize: "0.8rem" }}
            >
              This unit isn&apos;t linked to any campaign chapters. Students
              won&apos;t see narrative framing here.
            </Alert>
          )}

          {!loading && chapters.length > 0 && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1 }}
              >
                Linked to {chapters.length} chapter
                {chapters.length > 1 ? "s" : ""}:
              </Typography>

              {chapters.map((ch) => (
                <Box
                  key={ch.challengeId}
                  sx={{
                    mb: 1.5,
                    p: 1.25,
                    bgcolor: "action.selected",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: ch.active ? "primary.light" : "divider",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      mb: 0.5,
                      flexWrap: "wrap",
                    }}
                  >
                    {ch.chapterOrder != null && (
                      <Chip
                        label={`Ch. ${ch.chapterOrder}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: "0.65rem" }}
                      />
                    )}
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ flex: 1, minWidth: 0 }}
                      noWrap
                    >
                      {ch.challengeTitle}
                    </Typography>
                    <Chip
                      label={ch.active ? "Active" : "Done"}
                      size="small"
                      color={ch.active ? "primary" : "default"}
                      sx={{ height: 18, fontSize: "0.65rem" }}
                    />
                  </Box>

                  {ch.setting && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", fontStyle: "italic", mb: 0.75 }}
                    >
                      &ldquo;{ch.setting}&rdquo;
                    </Typography>
                  )}

                  {ch.active && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.75 }}
                    >
                      {progressPct(ch)}% complete · {ch.currentXP}/
                      {ch.targetXP} XP
                    </Typography>
                  )}

                  <Tooltip title="Open gamification settings for this section">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<OpenInNewIcon fontSize="small" />}
                      onClick={() =>
                        router.push(
                          `/${locale}/section/${ch.cohortId}/settings/gamification`,
                        )
                      }
                      sx={{ textTransform: "none", fontSize: "0.7rem", py: 0.25 }}
                    >
                      Edit campaign
                    </Button>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          )}

          {loaded && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              To link this unit to a chapter, open the campaign settings for the
              relevant section and add it under{" "}
              <em>Linked Units</em>.
            </Typography>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
}

export default CampaignContextWidget;
