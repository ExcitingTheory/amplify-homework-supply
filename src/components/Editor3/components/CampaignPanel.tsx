"use client";
import React, { useEffect, useState, useCallback } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import UnitContext from "../../../context/unitContext";
import SectionContext from "../../../context/sectionContext";
import { getAmplifyClient } from "../../../utils/amplifyClient";
import {
  GroupChallengeEditor,
  type GroupChallengeEditorData,
} from "../../GroupChallengeEditor";

interface ChapterReference {
  id: string;
  title: string;
  cohortId: string;
  setting?: string | null;
  stakes?: string | null;
  systemPromptSeed?: string | null;
  active: boolean;
  chapterOrder?: number | null;
  targetXP: number;
  currentXP: number;
  bonusMultiplier: number;
  deadline?: string | null;
  startDate?: string | null;
  featuredImage?: string | null;
  linkedUnitIds: string[];
  _version?: number;
}

export default function CampaignPanel() {
  const { unit } = React.useContext(UnitContext);
  const { sections } = React.useContext(SectionContext);
  const client = getAmplifyClient();

  const [loading, setLoading] = useState(true);
  const [allChapters, setAllChapters] = useState<ChapterReference[]>([]);
  const [linkedChapters, setLinkedChapters] = useState<ChapterReference[]>([]);
  const [unlinkedChapters, setUnlinkedChapters] = useState<ChapterReference[]>(
    [],
  );
  const [selectedChapter, setSelectedChapter] =
    useState<ChapterReference | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createCohortId, setCreateCohortId] = useState<string>("");

  const unitId = unit?.id;

  const fetchChapters = useCallback(async () => {
    if (!unitId) return;
    setLoading(true);
    try {
      const { data } = await (client.models as any).GroupChallenge.list();
      const valid: ChapterReference[] = (data ?? [])
        .filter((c: any) => c != null && c.id != null)
        .map((c: any) => ({
          id: c.id,
          title: c.title,
          cohortId: c.cohortId,
          setting: c.setting,
          stakes: c.stakes,
          systemPromptSeed: c.systemPromptSeed,
          active: c.active !== false,
          chapterOrder: c.chapterOrder,
          targetXP: c.targetXP ?? 0,
          currentXP: c.currentXP ?? 0,
          bonusMultiplier: c.bonusMultiplier ?? 1.5,
          deadline: c.deadline,
          startDate: c.startDate,
          featuredImage: c.featuredImage,
          linkedUnitIds: c.linkedUnitIds ?? [],
          _version: c._version,
        }));

      setAllChapters(valid);
      setLinkedChapters(valid.filter((c) => c.linkedUnitIds.includes(unitId)));
      setUnlinkedChapters(
        valid.filter((c) => !c.linkedUnitIds.includes(unitId)),
      );
    } catch (err) {
      console.warn("[CampaignPanel] Failed to load chapters:", err);
    } finally {
      setLoading(false);
    }
  }, [client, unitId]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  const handleAddToChapter = async () => {
    if (!selectedChapter || !unitId) return;
    setSaving(true);
    try {
      const newLinkedIds = [...(selectedChapter.linkedUnitIds || []), unitId];
      await (client.models as any).GroupChallenge.update({
        id: selectedChapter.id,
        linkedUnitIds: newLinkedIds,
        _version: selectedChapter._version,
      });
      setSelectedChapter(null);
      await fetchChapters();
    } catch (err) {
      console.error("[CampaignPanel] Failed to link unit:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromChapter = async (chapter: ChapterReference) => {
    if (!unitId) return;
    setSaving(true);
    try {
      const newLinkedIds = chapter.linkedUnitIds.filter((id) => id !== unitId);
      await (client.models as any).GroupChallenge.update({
        id: chapter.id,
        linkedUnitIds: newLinkedIds,
        _version: chapter._version,
      });
      await fetchChapters();
    } catch (err) {
      console.error("[CampaignPanel] Failed to unlink unit:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateChapter = async (data: GroupChallengeEditorData) => {
    if (!unitId || !createCohortId) return;
    setSaving(true);
    try {
      await (client.models as any).GroupChallenge.create({
        ...data,
        cohortId: createCohortId,
        linkedUnitIds: [unitId],
      });
      setShowCreate(false);
      setCreateCohortId("");
      await fetchChapters();
    } catch (err) {
      console.error("[CampaignPanel] Failed to create chapter:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateChapter = async (
    chapter: ChapterReference,
    data: GroupChallengeEditorData,
  ) => {
    setSaving(true);
    try {
      await (client.models as any).GroupChallenge.update({
        id: chapter.id,
        _version: chapter._version,
        ...data,
      });
      setEditingChapterId(null);
      await fetchChapters();
    } catch (err) {
      console.error("[CampaignPanel] Failed to update chapter:", err);
    } finally {
      setSaving(false);
    }
  };

  const progressPct = (ch: ChapterReference) =>
    ch.targetXP > 0
      ? Math.min(100, Math.round((ch.currentXP / ch.targetXP) * 100))
      : 0;

  if (!unitId) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Save the unit first to manage campaign links.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
        Campaign Chapters
      </Typography>

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Loading chapters…
          </Typography>
        </Box>
      )}

      {/* Linked chapters list */}
      {!loading && linkedChapters.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1 }}
          >
            Linked to {linkedChapters.length} chapter
            {linkedChapters.length > 1 ? "s" : ""}:
          </Typography>

          {linkedChapters.map((ch) => (
            <Box
              key={ch.id}
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
                  {ch.title}
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
                  {progressPct(ch)}% complete · {ch.currentXP}/{ch.targetXP} XP
                </Typography>
              )}

              <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon fontSize="small" />}
                  onClick={() =>
                    setEditingChapterId(
                      editingChapterId === ch.id ? null : ch.id,
                    )
                  }
                  sx={{ textTransform: "none", fontSize: "0.7rem", py: 0.25 }}
                >
                  {editingChapterId === ch.id ? "Close" : "Edit"}
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<LinkOffIcon fontSize="small" />}
                  onClick={() => handleRemoveFromChapter(ch)}
                  disabled={saving}
                  sx={{ textTransform: "none", fontSize: "0.7rem", py: 0.25 }}
                >
                  Unlink
                </Button>
              </Box>

              {/* Inline editor for this chapter */}
              <Collapse in={editingChapterId === ch.id}>
                <Box sx={{ mt: 1.5 }}>
                  <GroupChallengeEditor
                    initialData={{
                      title: ch.title,
                      targetXP: ch.targetXP,
                      currentXP: ch.currentXP,
                      deadline: ch.deadline || undefined,
                      startDate: ch.startDate || undefined,
                      bonusMultiplier: ch.bonusMultiplier,
                      setting: ch.setting || undefined,
                      stakes: ch.stakes || undefined,
                      systemPromptSeed: ch.systemPromptSeed || undefined,
                      active: ch.active,
                      featuredImage: ch.featuredImage || undefined,
                      linkedUnitIds: ch.linkedUnitIds,
                    }}
                    onSubmit={(data) => handleUpdateChapter(ch, data)}
                    submitting={saving}
                    availableUnits={[
                      { id: unitId, name: unit?.name || "This unit" },
                    ]}
                  />
                </Box>
              </Collapse>
            </Box>
          ))}
        </Box>
      )}

      {/* Add unit to existing chapter */}
      {!loading && unlinkedChapters.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Add to existing chapter
          </Typography>
          <Autocomplete
            size="small"
            options={unlinkedChapters}
            getOptionLabel={(ch) =>
              ch.chapterOrder != null
                ? `Ch. ${ch.chapterOrder}: ${ch.title}`
                : ch.title
            }
            value={selectedChapter}
            onChange={(_e, v) => setSelectedChapter(v)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select a chapter…" />
            )}
            sx={{ mb: 1 }}
          />
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddToChapter}
            disabled={!selectedChapter || saving}
            sx={{ textTransform: "none" }}
          >
            {saving ? "Saving…" : "Link unit to chapter"}
          </Button>
        </>
      )}

      {/* Create new chapter */}
      <Divider sx={{ my: 2 }} />
      {!showCreate ? (
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setShowCreate(true)}
          sx={{ textTransform: "none" }}
        >
          Create new chapter
        </Button>
      ) : (
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              New Chapter
            </Typography>
            <Button
              size="small"
              onClick={() => setShowCreate(false)}
              sx={{ textTransform: "none", fontSize: "0.7rem" }}
            >
              Cancel
            </Button>
          </Box>

          {sections && sections.length > 0 && (
            <Autocomplete
              size="small"
              options={sections}
              getOptionLabel={(s: any) => s.name || s.id}
              value={sections.find((s: any) => s.id === createCohortId) || null}
              onChange={(_e, v: any) => setCreateCohortId(v?.id || "")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Section"
                  placeholder="Select section for this chapter…"
                />
              )}
              sx={{ mb: 2 }}
            />
          )}

          {createCohortId && (
            <GroupChallengeEditor
              onSubmit={handleCreateChapter}
              submitting={saving}
              availableUnits={[{ id: unitId, name: unit?.name || "This unit" }]}
            />
          )}

          {!createCohortId && sections && sections.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              Select a section to create a chapter in.
            </Typography>
          )}

          {(!sections || sections.length === 0) && (
            <Typography variant="caption" color="text.secondary">
              No sections available. Create a section first.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
