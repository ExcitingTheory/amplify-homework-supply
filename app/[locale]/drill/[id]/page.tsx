"use client";

/**
 * Practice Drill Page — Renders a drill session in the same container/context
 * stack as the regular Workbook page. This ensures custom blocks (answer,
 * meaning-association, custom-answer, quiz) render identically.
 *
 * Route: /drill/[id] where [id] is the unitId to generate a drill for.
 *
 * Query params:
 *   - drillType: 'mixed' | 'quiz' | 'answer' | 'meaning-association' | 'custom-answer'
 *   - count: number of blocks to generate (default 10)
 *   - sessionId: optional existing session to resume
 */

import React, { useCallback, useState, useContext, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import AddIcon from "@mui/icons-material/Add";

import { Workbook } from "@/components/Editor3/Workbook";
import { FilesProvider } from "@/context/fileContext";
import { DictionaryProvider } from "@/context/dictionaryContext";
import { UnitProvider } from "@/context/unitContext";
import UnitContext from "@/context/unitContext";
import { SectionProvider } from "@/context/sectionContext";
import DrillGradeAdapter from "@/components/PracticeDrill/DrillGradeAdapter";
import PracticeDrillProgress from "@/components/PracticeDrill/PracticeDrillProgress";
import { usePracticeDrill } from "@/components/PracticeDrill/usePracticeDrill";
import { useDrillLibrary } from "@/components/PracticeDrill/useDrillLibrary";
import { previewXP } from "@/utils/practiceXPCalculator";
import type { DrillStats } from "@/components/PracticeDrill/DrillGradeAdapter";
import PracticeDrillConfigPopup from "@/components/PracticeDrill/PracticeDrillConfigPopup";
import type { DrillConfig } from "@/components/PracticeDrill/PracticeDrillConfigPopup";

// ============================================================================
// Library selection — shown before starting/resuming a drill
// ============================================================================

function DrillLibraryPicker({
  unitId,
  onGenerate,
  onResume,
  onReplay,
}: {
  unitId: string;
  onGenerate: (config: DrillConfig) => void;
  onResume: (sessionId: string) => void;
  onReplay: (templateId: string) => void;
}) {
  const t = useTranslations("components");
  const { ownIncomplete, templates, loading } = useDrillLibrary(unitId);
  const { unit, dictionary, questionBank } = useContext(UnitContext);
  const [configOpen, setConfigOpen] = useState(false);

  const vocabularyCount = dictionary ? Object.keys(dictionary).length : 0;
  const questionCount = questionBank ? Object.keys(questionBank).length : 0;

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", flexDirection: "column", gap: 2 }}>
        <Skeleton variant="rectangular" height={56} />
        <Skeleton variant="rectangular" height={56} />
        <Skeleton variant="rectangular" height={56} />
      </Box>
    );
  }

  const hasOptions = ownIncomplete || templates.length > 0;

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      {/* Resume own incomplete */}
      {ownIncomplete && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t("practiceDrill.library.resumeTitle")}
          </Typography>
          <ListItemButton
            onClick={() => onResume(ownIncomplete.id)}
            sx={{ border: 1, borderColor: "primary.main", borderRadius: 1 }}
          >
            <PlayArrowIcon color="primary" sx={{ mr: 2 }} />
            <ListItemText
              primary={t("practiceDrill.library.resumeLabel", {
                completed: ownIncomplete.blocksCompleted,
                total: ownIncomplete.blockCount,
                defaultMessage: `Resume (${ownIncomplete.blocksCompleted}/${ownIncomplete.blockCount} completed)`,
              })}
              secondary={ownIncomplete.drillType}
            />
          </ListItemButton>
        </Box>
      )}

      {/* Replay templates from library */}
      {templates.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t("practiceDrill.library.templatesTitle")}
          </Typography>
          <List disablePadding>
            {templates.slice(0, 10).map((tmpl) => (
              <React.Fragment key={tmpl.id}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => onReplay(tmpl.id)}>
                    <ReplayIcon sx={{ mr: 2, color: "text.secondary" }} />
                    <ListItemText
                      primary={`${tmpl.blockCount} blocks · ${tmpl.drillType.toLowerCase()}`}
                      secondary={
                        tmpl.accuracy != null
                          ? `${Math.round(tmpl.accuracy)}% avg accuracy · ${tmpl.xpAwarded} XP`
                          : tmpl.createdAt
                            ? new Date(tmpl.createdAt).toLocaleDateString()
                            : undefined
                      }
                    />
                    <Chip label="Replay" size="small" variant="outlined" />
                  </ListItemButton>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}

      {/* Generate new */}
      <Divider sx={{ my: hasOptions ? 2 : 0 }} />
      <Button
        variant={hasOptions ? "outlined" : "contained"}
        startIcon={<AddIcon />}
        onClick={() => setConfigOpen(true)}
        fullWidth
        sx={{ mt: 1 }}
      >
        {t("practiceDrill.library.generateNew")}
      </Button>

      {/* Configuration popup */}
      <PracticeDrillConfigPopup
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        onStart={(config) => {
          setConfigOpen(false);
          onGenerate(config);
        }}
        unitName={unit?.name || ""}
        vocabularyCount={vocabularyCount}
        questionCount={questionCount}
        textBlockCount={0}
        documentCount={0}
      />
    </Box>
  );
}

// ============================================================================
// Inner content — renders once UnitContext is available
// ============================================================================

function DrillWorkbookContent() {
  const t = useTranslations("components");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { unit } = useContext(UnitContext);
  const unitId = unit?.id || "";
  const unitName = unit?.name || "";

  const {
    session,
    generating,
    error,
    generateDrill,
    resumeSession,
    replayTemplate,
    completeDrill,
    reset,
  } = usePracticeDrill(unitName);

  const [drillStats, setDrillStats] = useState<DrillStats>({
    blocksCompleted: 0,
    accuracy: 0,
    complete: false,
  });
  const [showLibrary, setShowLibrary] = useState(true);

  const xpPreview = previewXP(0, drillStats.accuracy);

  // If sessionId is in URL, resume directly (skip library)
  const sessionIdParam = searchParams.get("sessionId");
  useEffect(() => {
    if (sessionIdParam && session.blocks.length === 0 && !generating && !error) {
      setShowLibrary(false);
      resumeSession(sessionIdParam);
    }
  }, [sessionIdParam, session.blocks.length, generating, error, resumeSession]);

  const handleGenerate = useCallback((cfg: DrillConfig) => {
    setShowLibrary(false);
    if (unitId) generateDrill(unitId, cfg);
  }, [unitId, generateDrill]);

  const handleResume = useCallback((sessionId: string) => {
    setShowLibrary(false);
    resumeSession(sessionId);
  }, [resumeSession]);

  const handleReplay = useCallback((templateId: string) => {
    setShowLibrary(false);
    if (unitId) replayTemplate(templateId, unitId);
  }, [unitId, replayTemplate]);

  const handleStatsChange = useCallback((stats: DrillStats) => {
    setDrillStats(stats);
  }, []);

  // Award XP when all blocks are complete
  const completedRef = React.useRef(false);
  useEffect(() => {
    if (drillStats.complete && !session.complete && !completedRef.current) {
      completedRef.current = true;
      completeDrill();
    }
  }, [drillStats.complete, session.complete, completeDrill]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Library selection screen (before starting)
  if (showLibrary && !sessionIdParam && session.blocks.length === 0 && !generating) {
    return (
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2, borderBottom: 1, borderColor: "divider" }}>
          <IconButton onClick={handleBack} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">
            {t("practiceDrill.library.title")}
          </Typography>
        </Box>
        <DrillLibraryPicker
          unitId={unitId}
          onGenerate={handleGenerate}
          onResume={handleResume}
          onReplay={handleReplay}
        />
      </Box>
    );
  }

  // Loading state
  if (generating) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 2,
          py: 8,
        }}
      >
        <Skeleton variant="circular" width={48} height={48} />
        <Skeleton variant="text" width={240} height={24} />
        <Typography color="text.secondary">
          {t("practiceDrill.dialog.generating")}
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button
            size="small"
            onClick={() => { reset(); setShowLibrary(true); }}
            sx={{ ml: 1 }}
          >
            {t("practiceDrill.dialog.retry")}
          </Button>
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          {t("practiceDrill.dialog.back")}
        </Button>
      </Box>
    );
  }

  // No blocks yet
  if (session.blocks.length === 0) {
    return null;
  }

  return (
    <>
      {/* Progress header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <IconButton onClick={handleBack} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ flex: 1 }}>
          {unitName
            ? t("practiceDrill.dialog.titleWithUnit", {
                unit: unitName,
                defaultMessage: `Practice: ${unitName}`,
              })
            : t("practiceDrill.dialog.title")}
        </Typography>
        <PracticeDrillProgress
          blockCount={session.blocks.length}
          blocksCompleted={drillStats.blocksCompleted}
          xpEarned={session.complete ? session.xpAwarded : xpPreview.total}
          xpDiminished={false}
        />
      </Box>

      {/* Completion banner */}
      {drillStats.complete && (
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mx: 2, mt: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {t("practiceDrill.dialog.complete")}
          </Typography>
          <Typography variant="body2">
            {t("practiceDrill.dialog.completeSummary", {
              accuracy: drillStats.accuracy,
              xp: session.xpAwarded,
            })}
          </Typography>
        </Alert>
      )}

      {/* Workbook — renders via existing Lexical graded block plugins */}
      <DrillGradeAdapter
        sessionId={session.id || ""}
        blocks={
          session.blocks as import("@/components/PracticeDrill/buildDrillEditorState").PracticeDrillBlock[]
        }
        onGradeChange={(_data, stats) => handleStatsChange(stats)}
      >
        <Workbook />
      </DrillGradeAdapter>
    </>
  );
}

// ============================================================================
// Page — wraps with the same context stack as the regular workbook
// ============================================================================

export default function DrillPage() {
  const { id } = useParams() as { id: string };

  return (
    <SectionProvider unitId={id}>
      <FilesProvider>
        <DictionaryProvider>
          <UnitProvider id={id}>
            <DrillWorkbookContent />
          </UnitProvider>
        </DictionaryProvider>
      </FilesProvider>
    </SectionProvider>
  );
}
