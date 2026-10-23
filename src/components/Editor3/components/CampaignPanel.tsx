"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import UnitContext from "../../../context/unitContext";
import SectionContext from "../../../context/sectionContext";
import { getAmplifyClient } from "../../../utils/amplifyClient";
import { CampaignBriefing } from "../../Gamification/CampaignBriefing";
import {
  GroupChallengeEditor,
  type GroupChallengeEditorData,
} from "../../GroupChallengeEditor";

const PRIMARY_COLOR = "primary";
const DEFAULT_COLOR = "default";

interface ChapterReference {
  id: string;
  title: string;
  sectionID: string;
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
  const t = useTranslations("editor.authoring");
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
  const [createSectionID, setCreateSectionID] = useState<string>("");
  const [previewChapter, setPreviewChapter] = useState<ChapterReference | null>(
    null,
  );
  const [requiredXPInput, setRequiredXPInput] = useState("");
  const [savingLock, setSavingLock] = useState(false);

  const unitId = unit?.id;

  useEffect(() => {
    setRequiredXPInput(unit?.requiredXP ? String(unit.requiredXP) : "");
  }, [unit?.requiredXP]);

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
          sectionID: c.sectionID,
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
    if (!unitId || !createSectionID) return;
    setSaving(true);
    try {
      await (client.models as any).GroupChallenge.create({
        ...data,
        sectionID: createSectionID,
        linkedUnitIds: [unitId],
      });
      setShowCreate(false);
      setCreateSectionID("");
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

  const handleSaveContentLock = async () => {
    if (!unitId) return;
    setSavingLock(true);
    try {
      const parsed =
        requiredXPInput.trim() === "" ? null : Number(requiredXPInput);
      await client.models.Unit.update({
        id: unitId,
        requiredXP: parsed,
        _version: unit._version,
      });
    } catch (err) {
      console.error("[CampaignPanel] Failed to update content lock:", err);
    } finally {
      setSavingLock(false);
    }
  };

  if (!unitId) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t("campaignPanel.saveUnitFirst")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
        {t("campaignPanel.heading")}
      </Typography>

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            {t("campaignPanel.loadingChapters")}
          </Typography>
        </Box>
      )}

      {/* Warning when this unit has no campaign context (Phase 3.2) */}
      {!loading && linkedChapters.length === 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon fontSize="small" />}
          sx={{ mb: 2, fontSize: "0.8rem" }}
        >
          {t("campaignPanel.noLinkedChaptersWarning")}
        </Alert>
      )}

      {/* Linked chapters list */}
      {!loading && linkedChapters.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1 }}
          >
            {t("campaignPanel.linkedToChapters", {
              count: linkedChapters.length,
            })}
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
                    label={t("campaignPanel.chapterNumber", {
                      order: ch.chapterOrder,
                    })}
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
                  label={
                    ch.active
                      ? t("campaignPanel.statusActive")
                      : t("campaignPanel.statusDone")
                  }
                  size="small"
                  color={ch.active ? PRIMARY_COLOR : DEFAULT_COLOR}
                  sx={{ height: 18, fontSize: "0.65rem" }}
                />
              </Box>

              {ch.setting && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", fontStyle: "italic", mb: 0.75 }}
                >
                  {t("campaignPanel.quotedSetting", { setting: ch.setting })}
                </Typography>
              )}

              {ch.active && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 0.75 }}
                >
                  {t("campaignPanel.chapterProgress", {
                    percent: progressPct(ch),
                    currentXP: ch.currentXP,
                    targetXP: ch.targetXP,
                  })}
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
                  sx={{ fontSize: "0.7rem", py: 0.25 }}
                >
                  {editingChapterId === ch.id
                    ? t("campaignPanel.close")
                    : t("campaignPanel.edit")}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<VisibilityIcon fontSize="small" />}
                  onClick={() => setPreviewChapter(ch)}
                  sx={{ fontSize: "0.7rem", py: 0.25 }}
                >
                  {t("campaignPanel.preview")}
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<LinkOffIcon fontSize="small" />}
                  onClick={() => handleRemoveFromChapter(ch)}
                  disabled={saving}
                  sx={{ fontSize: "0.7rem", py: 0.25 }}
                >
                  {t("campaignPanel.unlink")}
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
                      {
                        id: unitId,
                        name: unit?.name || t("campaignPanel.thisUnit"),
                      },
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
            {t("campaignPanel.addToExistingChapter")}
          </Typography>
          <Autocomplete
            size="small"
            options={unlinkedChapters}
            getOptionLabel={(ch) =>
              ch.chapterOrder != null
                ? t("campaignPanel.chapterOptionLabel", {
                    order: ch.chapterOrder,
                    title: ch.title,
                  })
                : ch.title
            }
            value={selectedChapter}
            onChange={(_e, v) => setSelectedChapter(v)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={t("campaignPanel.selectChapterPlaceholder")}
              />
            )}
            sx={{ mb: 1 }}
          />
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddToChapter}
            disabled={!selectedChapter || saving}
          >
            {saving
              ? t("campaignPanel.saving")
              : t("campaignPanel.linkUnitToChapter")}
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
        >
          {t("campaignPanel.createNewChapter")}
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
              {t("campaignPanel.newChapter")}
            </Typography>
            <Button
              size="small"
              onClick={() => setShowCreate(false)}
              sx={{ fontSize: "0.7rem" }}
            >
              {t("campaignPanel.cancel")}
            </Button>
          </Box>

          {sections && sections.length > 0 && (
            <Autocomplete
              size="small"
              options={sections}
              getOptionLabel={(s: any) => s.name || s.id}
              value={
                sections.find((s: any) => s.id === createSectionID) || null
              }
              onChange={(_e, v: any) => setCreateSectionID(v?.id || "")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("campaignPanel.sectionLabel")}
                  placeholder={t("campaignPanel.selectSectionPlaceholder")}
                />
              )}
              sx={{ mb: 2 }}
            />
          )}

          {createSectionID && (
            <GroupChallengeEditor
              onSubmit={handleCreateChapter}
              submitting={saving}
              availableUnits={[
                { id: unitId, name: unit?.name || t("campaignPanel.thisUnit") },
              ]}
            />
          )}

          {!createSectionID && sections && sections.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {t("campaignPanel.selectSectionHint")}
            </Typography>
          )}

          {(!sections || sections.length === 0) && (
            <Typography variant="caption" color="text.secondary">
              {t("campaignPanel.noSections")}
            </Typography>
          )}
        </Box>
      )}

      {/* Content lock (Phase 4.2) */}
      <Divider sx={{ my: 2 }} />
      <Typography
        variant="subtitle2"
        fontWeight={600}
        sx={{ mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}
      >
        <LockIcon fontSize="small" /> {t("campaignPanel.contentLock")}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <TextField
          size="small"
          type="number"
          label={t("campaignPanel.requiredXP")}
          value={requiredXPInput}
          onChange={(e) => setRequiredXPInput(e.target.value)}
          onBlur={handleSaveContentLock}
          sx={{ maxWidth: 160 }}
        />
        {savingLock && <CircularProgress size={16} />}
      </Box>
      {(unit?.requiredBadgeId || unit?.requiredModuleCompletion) && (
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1 }}>
          {unit?.requiredBadgeId && (
            <Chip
              size="small"
              label={t("campaignPanel.badgeLock", {
                badgeId: unit.requiredBadgeId,
              })}
              variant="outlined"
              sx={{ fontSize: "0.65rem" }}
            />
          )}
          {unit?.requiredModuleCompletion && (
            <Chip
              size="small"
              label={t("campaignPanel.moduleCompletionLock", {
                percent: unit.requiredModuleCompletion,
              })}
              variant="outlined"
              sx={{ fontSize: "0.65rem" }}
            />
          )}
        </Box>
      )}
      <Typography variant="caption" color="text.secondary">
        {t("campaignPanel.locksManagedHint")}
      </Typography>

      {/* Preview student narrative (Phase 3.2 / 4.2) */}
      <Dialog
        open={!!previewChapter}
        onClose={() => setPreviewChapter(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {t("campaignPanel.studentPreview")}
          <IconButton size="small" onClick={() => setPreviewChapter(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewChapter && (
            <CampaignBriefing
              title={previewChapter.title}
              setting={previewChapter.setting || undefined}
              stakes={previewChapter.stakes || undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
