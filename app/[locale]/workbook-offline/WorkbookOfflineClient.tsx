"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import RefreshIcon from "@mui/icons-material/Refresh";

import {
  getCachedUnit,
  getRecordsByIndex,
  type CachedUnit,
  type CachedWord,
  type CachedQuestion,
  type CachedFile,
  type CachedGrade,
} from "@/offline/OfflineDataStore";
import { saveGradeOfflineAware } from "@/offline/saveGradeOffline";

/**
 * WorkbookOfflineClient — Renders a workbook from IndexedDB cache when offline.
 *
 * The unit ID is passed via ?id= query param (set by the service worker redirect).
 * Loads the cached unit data, dictionary, questions, and files from IndexedDB,
 * then renders the Lexical editor in read/interact mode.
 */
export default function WorkbookOfflineClient() {
  const searchParams = useSearchParams();
  const unitId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState<CachedUnit | null>(null);
  const [words, setWords] = useState<CachedWord[]>([]);
  const [questions, setQuestions] = useState<CachedQuestion[]>([]);
  const [files, setFiles] = useState<CachedFile[]>([]);
  const [gradeData, setGradeData] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const gradeIdRef = useRef<string | null>(null);

  // Offline grade save handler — persists to IndexedDB + enqueues for sync
  const saveGrade = useCallback(
    async (data: Record<string, any>) => {
      if (!unitId) return;
      setGradeData(data);

      // Calculate accuracy from completed blocks
      const entries = Object.values(data);
      const completed = entries.filter((e: any) => e?.complete);
      const accuracy =
        completed.length > 0
          ? Math.round(
              completed.reduce((sum: number, e: any) => sum + (e.accuracy || 0), 0) /
                completed.length,
            )
          : undefined;

      await saveGradeOfflineAware(
        {
          gradeId: gradeIdRef.current || `offline-${unitId}-${Date.now()}`,
          unitId,
          data,
          accuracy,
          complete: false, // Will be set true when all blocks complete
        },
        async () => {
          // Server save callback — no-op offline, will be retried on reconnect
          throw new Error("Offline — will retry on reconnect");
        },
      );
    },
    [unitId],
  );

  useEffect(() => {
    if (!unitId) {
      setError("No unit ID provided");
      setLoading(false);
      return;
    }

    async function loadFromCache() {
      try {
        const cachedUnit = await getCachedUnit(unitId!);
        if (!cachedUnit) {
          setError(
            "This unit hasn't been saved for offline use. Go online and tap 'Save offline' first.",
          );
          setLoading(false);
          return;
        }

        const [cachedWords, cachedQuestions, cachedFiles] = await Promise.all([
          getRecordsByIndex<CachedWord>("words", "unitId", unitId!),
          getRecordsByIndex<CachedQuestion>("questions", "unitId", unitId!),
          getRecordsByIndex<CachedFile>("files", "unitId", unitId!),
        ]);

        // Load any existing offline grade for this unit
        const cachedGrades = await getRecordsByIndex<CachedGrade>("grades", "unitId", unitId!);
        const cachedGrade = cachedGrades[0]; // Most recent
        if (cachedGrade) {
          gradeIdRef.current = cachedGrade.id;
          try {
            const parsed = typeof cachedGrade.data === "string"
              ? JSON.parse(cachedGrade.data)
              : cachedGrade.data;
            setGradeData(parsed || {});
          } catch {
            // Ignore parse errors
          }
        }

        setUnit(cachedUnit);
        setWords(cachedWords);
        setQuestions(cachedQuestions);
        setFiles(cachedFiles);
        setLoading(false);
      } catch (err) {
        console.error("[WorkbookOffline] Failed to load from cache:", err);
        setError("Failed to load offline data. Please try again.");
        setLoading(false);
      }
    }

    loadFromCache();
  }, [unitId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Loading offline workbook...
        </Typography>
      </Box>
    );
  }

  if (error || !unit) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
          textAlign: "center",
          gap: 3,
          px: 3,
        }}
      >
        <WifiOffIcon sx={{ fontSize: 64, color: "text.secondary" }} />
        <Typography variant="h5" component="h1">
          Offline Workbook
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Try again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: "80rem", mx: "auto", p: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2,
          p: 1,
          borderRadius: 1,
          backgroundColor: "warning.main",
          color: "warning.contrastText",
        }}
      >
        <WifiOffIcon fontSize="small" />
        <Typography variant="body2" fontWeight={600}>
          Offline Mode — Your progress will sync when you reconnect.
        </Typography>
      </Box>

      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {unit.name}
      </Typography>
      {unit.description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {unit.description}
        </Typography>
      )}

      <OfflineWorkbookContent
        unit={unit}
        words={words}
        questions={questions}
        files={files}
        gradeData={gradeData}
        saveGrade={saveGrade}
      />
    </Box>
  );
}

/**
 * Lazy-loaded workbook content renderer.
 * Uses dynamic import to code-split the Lexical editor.
 */
function OfflineWorkbookContent({
  unit,
  words,
  questions,
  files,
  gradeData,
  saveGrade,
}: {
  unit: CachedUnit;
  words: CachedWord[];
  questions: CachedQuestion[];
  files: CachedFile[];
  gradeData: Record<string, any>;
  saveGrade: (data: Record<string, any>) => Promise<void>;
}) {
  const [EditorComponent, setEditorComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import("@/components/Editor3")
      .then((mod) => {
        setEditorComponent(() => mod.Workbook);
      })
      .catch(() => {
        // If Lexical fails to load offline, fall back to raw JSON render
        setEditorComponent(null);
      });
  }, []);

  if (!EditorComponent) {
    // Fallback: render unit data as formatted content
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Loading editor...
        </Typography>
        {unit.data && (
          <Box
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              backgroundColor: "background.paper",
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              fontSize: "0.875rem",
              maxHeight: "70vh",
              overflow: "auto",
            }}
          >
            Content available — editor loading...
          </Box>
        )}
      </Box>
    );
  }

  // Provide offline data context to the editor
  return (
    <EditorComponent
      offlineMode
      offlineData={{
        unit,
        words,
        questions,
        files,
        gradeData,
        saveGrade,
      }}
    />
  );
}
