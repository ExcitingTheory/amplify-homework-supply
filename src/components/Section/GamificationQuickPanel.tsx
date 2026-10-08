"use client";
/**
 * GamificationQuickPanel — A compact summary card for instructors showing
 * active campaign chapters and their progress for a given section.
 * Sits inline on the section detail page. Chapter creation/editing happens
 * in an inline Drawer (Phase 4.1/4.4) so instructors never leave this page
 * for the common "customize the learning path" task; deep configuration
 * (skills, badges, squads) still links out to the full admin settings page.
 *
 * @module GamificationQuickPanel
 */

import React, { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import Tooltip from "@mui/material/Tooltip";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import TuneIcon from "@mui/icons-material/Tune";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useRouter } from "next/navigation";
import { generateClient } from "aws-amplify/data";
import {
  GroupChallengeEditor,
  type GroupChallengeEditorData,
} from "../GroupChallengeEditor";

const client = generateClient();

export interface GamificationQuickPanelProps {
  sectionId: string;
  locale?: string;
}

interface ChallengeSnapshot {
  id: string;
  title: string;
  targetXP: number;
  currentXP: number;
  active: boolean;
  deadline?: string | null;
  startDate?: string | null;
  bonusMultiplier?: number;
  setting?: string | null;
  stakes?: string | null;
  systemPromptSeed?: string | null;
  featuredImage?: string | null;
  linkedUnitIds?: string[];
  chapterOrder?: number | null;
  _version?: number;
}

export function GamificationQuickPanel({
  sectionId,
  locale = "en",
}: GamificationQuickPanelProps) {
  const router = useRouter();
  const [challenges, setChallenges] = useState<ChallengeSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] =
    useState<ChallengeSnapshot | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchChallenges = useCallback(async () => {
    if (!sectionId) return;
    try {
      const { data } = await (client.models as any).GroupChallenge.list({
        filter: { sectionID: { eq: sectionId } },
      });
      if (data) {
        const items = (data as any[])
          .filter((c) => c != null)
          .map((c) => ({
            id: c.id,
            title: c.title,
            targetXP: c.targetXP,
            currentXP: c.currentXP || 0,
            active: c.active ?? true,
            deadline: c.deadline,
            startDate: c.startDate,
            bonusMultiplier: c.bonusMultiplier,
            setting: c.setting,
            stakes: c.stakes,
            systemPromptSeed: c.systemPromptSeed,
            featuredImage: c.featuredImage,
            linkedUnitIds: c.linkedUnitIds ?? [],
            chapterOrder: c.chapterOrder,
            _version: c._version,
          }))
          .sort((a, b) => (a.chapterOrder ?? 999) - (b.chapterOrder ?? 999));
        setChallenges(items);
      }
    } catch (err) {
      console.warn("[GamificationQuickPanel] Failed to load challenges:", err);
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const openCreateDrawer = () => {
    setEditingChallenge(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (challenge: ChallengeSnapshot) => {
    setEditingChallenge(challenge);
    setDrawerOpen(true);
  };

  const handleSubmit = async (data: GroupChallengeEditorData) => {
    setSaving(true);
    try {
      if (editingChallenge) {
        await (client.models as any).GroupChallenge.update({
          id: editingChallenge.id,
          _version: editingChallenge._version,
          ...data,
        });
      } else {
        await (client.models as any).GroupChallenge.create({
          ...data,
          sectionID: sectionId,
        });
      }
      setDrawerOpen(false);
      setEditingChallenge(null);
      await fetchChallenges();
    } catch (err) {
      console.error("[GamificationQuickPanel] Failed to save chapter:", err);
    } finally {
      setSaving(false);
    }
  };

  const activeChallenges = challenges.filter((c) => c.active);
  const completedCount = challenges.filter((c) => !c.active).length;

  if (loading) return null;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EmojiEventsIcon color="primary" sx={{ fontSize: "1.3rem" }} />
            <Typography variant="subtitle1" fontWeight={700}>
              Campaign Progress
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              variant="contained"
              startIcon={<TuneIcon />}
              onClick={openCreateDrawer}
            >
              Customize Learning Path
            </Button>
            <Tooltip title="Skills, badges, squads, and other advanced gamification settings">
              <Button
                size="small"
                color="inherit"
                onClick={() =>
                  router.push(
                    `/${locale}/section/${sectionId}/settings/gamification`,
                  )
                }
                sx={{ textTransform: "none", color: "text.secondary" }}
              >
                Advanced settings
              </Button>
            </Tooltip>
          </Stack>
        </Box>

        {challenges.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No campaign chapters configured yet.
          </Typography>
        )}

        {activeChallenges.length > 0 && (
          <Stack spacing={1}>
            {activeChallenges.slice(0, 3).map((ch) => {
              const pct =
                ch.targetXP > 0
                  ? Math.min(
                      100,
                      Math.round((ch.currentXP / ch.targetXP) * 100),
                    )
                  : 0;
              return (
                <Box key={ch.id}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      noWrap
                      sx={{ maxWidth: "55%" }}
                    >
                      {ch.chapterOrder != null && `Ch.${ch.chapterOrder}: `}
                      {ch.title}
                    </Typography>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {ch.currentXP}/{ch.targetXP} XP ({pct}%)
                      </Typography>
                      <Tooltip title="Edit this chapter">
                        <IconButton
                          size="small"
                          onClick={() => openEditDrawer(ch)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{ height: 5, borderRadius: 2, mt: 0.5 }}
                  />
                </Box>
              );
            })}
            {activeChallenges.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                +{activeChallenges.length - 3} more active
              </Typography>
            )}
          </Stack>
        )}

        {completedCount > 0 && (
          <Chip
            size="small"
            label={`${completedCount} chapter${completedCount > 1 ? "s" : ""} completed`}
            color="success"
            variant="outlined"
            sx={{ mt: 1 }}
          />
        )}
      </CardContent>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: { xs: "100vw", sm: 420 }, p: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
            {editingChallenge ? "Edit Chapter" : "New Chapter"}
          </Typography>
          <GroupChallengeEditor
            initialData={
              editingChallenge
                ? {
                    title: editingChallenge.title,
                    targetXP: editingChallenge.targetXP,
                    currentXP: editingChallenge.currentXP,
                    deadline: editingChallenge.deadline || undefined,
                    startDate: editingChallenge.startDate || undefined,
                    bonusMultiplier: editingChallenge.bonusMultiplier ?? 1.5,
                    setting: editingChallenge.setting || undefined,
                    stakes: editingChallenge.stakes || undefined,
                    systemPromptSeed:
                      editingChallenge.systemPromptSeed || undefined,
                    active: editingChallenge.active,
                    featuredImage: editingChallenge.featuredImage || undefined,
                    linkedUnitIds: editingChallenge.linkedUnitIds,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            submitting={saving}
          />
        </Box>
      </Drawer>
    </Card>
  );
}

export default GamificationQuickPanel;
