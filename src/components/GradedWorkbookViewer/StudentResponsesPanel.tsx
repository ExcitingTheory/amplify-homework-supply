"use client";

/**
 * Every answer of one grade attempt as the student gave it: typed text,
 * recording (with its transcript), photo, or drawing strokes in drawing
 * order, next to the verdict and a needs-review flag.
 *
 * Answers come from GradeResponse items. Grades saved before those existed
 * fall back to whatever the block data kept (quiz choices, userResponse,
 * per-question audio keys). Recordings and photos are fetched with signed
 * URLs: instructors through getStudentSubmissionUrls (one call per grade),
 * students straight from their own private storage.
 */

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import { getAmplifyClient } from "../../utils/amplifyClient";
import getCachedUrl from "../../utils/getCachedUrl";
import {
  INPUT_METHOD,
  listBlockResponses,
  submissionKeysFor,
} from "../../utils/studentResponses";
import {
  fromGradeResponse,
  listGradeResponses,
  type GradeResponseClient,
} from "../../utils/gradeResponses";
import { getSubmissionUrlsInBatches } from "../../utils/submissionUrlBatches";
import { getStudentSubmissionUrls } from "../../../app/actions/storage";
import { StrokeOrderView } from "./StrokeOrderView";

export type ViewerRole = "instructor" | "student";

interface PanelGrade {
  id: string;
  data?: Record<string, unknown> | string | null;
}

interface AnswerRow {
  blockKey: string;
  questionKey: string;
  record: any;
  legacy: boolean;
}

interface StudentResponsesPanelProps {
  grade: PanelGrade | null | undefined;
  viewerRole?: ViewerRole;
}

const VERDICT_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  correct: "success",
  misspelled: "warning",
  incorrect: "error",
  error: "default",
};
const AUDIO_PRELOAD = "none";
const AUDIO_STYLE = { width: "100%" } as const;
const IMAGE_STYLE = { maxWidth: "100%", maxHeight: 220, borderRadius: 4 } as const;

function parseData(data: PanelGrade["data"]): Record<string, unknown> {
  if (!data) return {};
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
}

async function loadAnswers(gradeId: string, data: PanelGrade["data"]) {
  // Structural type: keeps gradeResponses.ts free of generated schema types.
  const client = getAmplifyClient() as unknown as GradeResponseClient;
  const items = await listGradeResponses(client, gradeId);
  const rows: AnswerRow[] = items.map((item: any) => ({
    blockKey: item.blockKey,
    questionKey: item.questionKey,
    record: fromGradeResponse(item),
    legacy: false,
  }));

  // Keep legacy answers unless that exact block/question has a response item.
  const withItems = new Set(
    rows.map((r) => JSON.stringify([r.blockKey, r.questionKey])),
  );
  const knownAudio = new Set(rows.map((r) => r.record?.audioPath).filter(Boolean));
  for (const [blockKey, blockData] of Object.entries(parseData(data))) {
    for (const entry of listBlockResponses(blockData)) {
      if (withItems.has(JSON.stringify([blockKey, entry.key]))) continue;
      if (entry.record.audioPath && knownAudio.has(entry.record.audioPath)) continue;
      rows.push({ blockKey, questionKey: entry.key, record: entry.record, legacy: true });
      withItems.add(JSON.stringify([blockKey, entry.key]));
      if (entry.record.audioPath) knownAudio.add(entry.record.audioPath);
    }
  }
  return rows;
}

async function signFiles(gradeId: string, rows: AnswerRow[], role: ViewerRole) {
  const keys = submissionKeysFor(rows.map((r) => r.record));
  if (!keys.length) return {};
  if (role === "student") {
    const pairs = await Promise.all(
      keys.map(async (key) => [key, await getCachedUrl(key).catch(() => null)] as const),
    );
    return Object.fromEntries(pairs) as Record<string, string | null>;
  }
  return getSubmissionUrlsInBatches(keys, async (batch) => {
    const result = await getStudentSubmissionUrls(gradeId, batch);
    return result.urls;
  });
}

export function StudentResponsesPanel({
  grade,
  viewerRole = "instructor",
}: StudentResponsesPanelProps) {
  const t = useTranslations("components");
  const [rows, setRows] = React.useState<AnswerRow[]>([]);
  const [urls, setUrls] = React.useState<Record<string, string | null>>({});
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [reviewOnly, setReviewOnly] = React.useState(false);

  const gradeId = grade?.id;
  const gradeData = grade?.data;
  React.useEffect(() => {
    if (!gradeId) return;
    let cancelled = false;
    setStatus("loading");
    (async () => {
      try {
        const loaded = await loadAnswers(gradeId, gradeData);
        if (cancelled) return;
        setRows(loaded);
        setStatus("ready");
        // Answers show even if files can't be signed (for example a grade
        // created before identityId was saved); those show "not available".
        try {
          const signed = await signFiles(gradeId, loaded, viewerRole);
          if (!cancelled) setUrls(signed);
        } catch (error) {
          console.warn("[StudentResponsesPanel] Signing files failed:", error);
        }
      } catch (error) {
        console.error("[StudentResponsesPanel] Loading answers failed:", error);
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gradeId, gradeData, viewerRole]);

  const blocks = React.useMemo(() => {
    const order: string[] = [];
    const byBlock = new Map<string, AnswerRow[]>();
    for (const row of rows) {
      if (reviewOnly && !row.record?.needsReview) continue;
      if (!byBlock.has(row.blockKey)) {
        byBlock.set(row.blockKey, []);
        order.push(row.blockKey);
      }
      byBlock.get(row.blockKey)!.push(row);
    }
    return order.map((blockKey) => ({ blockKey, rows: byBlock.get(blockKey)! }));
  }, [rows, reviewOnly]);

  const reviewCount = rows.filter((r) => r.record?.needsReview).length;

  if (!gradeId) return null;
  if (status === "loading") {
    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 2 }}>
        <CircularProgress size={18} />
        <Typography variant="body2" color="text.secondary">
          {t("studentResponses.loading")}
        </Typography>
      </Stack>
    );
  }
  if (status === "error") {
    return (
      <Alert severity="error" sx={{ m: 1 }}>
        {t("studentResponses.loadError")}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle2">
          {t("studentResponses.title", { count: rows.length })}
        </Typography>
        {reviewCount > 0 && (
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={reviewOnly}
                onChange={(e) => setReviewOnly(e.target.checked)}
              />
            }
            label={t("studentResponses.needsReviewOnly", { count: reviewCount })}
          />
        )}
      </Stack>

      {rows.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {t("studentResponses.noAnswers")}
        </Typography>
      )}

      <Stack spacing={1.5}>
        {blocks.map(({ blockKey, rows: blockRows }, blockIndex) => (
          <Box key={blockKey}>
            <Typography variant="overline" color="text.secondary">
              {t("studentResponses.block", { n: blockIndex + 1 })}
            </Typography>
            <Stack spacing={1}>
              {blockRows.map((row) => (
                <AnswerCard
                  key={`${row.blockKey}:${row.questionKey}`}
                  row={row}
                  urls={urls}
                  t={t}
                />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function AnswerCard({
  row,
  urls,
  t,
}: {
  row: AnswerRow;
  urls: Record<string, string | null>;
  t: ReturnType<typeof useTranslations>;
}) {
  const r = row.record || {};
  const audioUrl = r.audioPath ? urls[r.audioPath] : null;
  const imageUrl = r.imagePath ? urls[r.imagePath] : null;
  const isAudio = r.inputMethod === INPUT_METHOD.audio;

  return (
    <Paper variant="outlined" sx={{ p: 1.25 }}>
      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
        {r.verdict && (
          <Chip
            size="small"
            color={VERDICT_COLOR[r.verdict] ?? "default"}
            label={t(`studentResponses.verdict.${r.verdict}`)}
          />
        )}
        {r.needsReview && (
          <Chip
            size="small"
            variant="outlined"
            color="warning"
            icon={<FlagOutlinedIcon />}
            label={t("studentResponses.needsReview")}
          />
        )}
        <Typography variant="caption" color="text.secondary">
          {t(`studentResponses.input.${r.inputMethod || INPUT_METHOD.text}`)}
        </Typography>
        {r.attempts > 1 && (
          <Typography variant="caption" color="text.secondary">
            {t("studentResponses.attempts", { count: r.attempts })}
          </Typography>
        )}
      </Stack>

      {r.prompt && (
        <Typography variant="caption" component="p" color="text.secondary" sx={{ mt: 0.75 }}>
          {t("studentResponses.prompt", { prompt: r.prompt })}
        </Typography>
      )}

      {r.text && (
        <Typography
          variant="body2"
          sx={{ mt: 0.75, pl: 1, borderLeft: 3, borderColor: "divider", whiteSpace: "pre-wrap" }}
        >
          {r.text}
        </Typography>
      )}

      {r.audioPath &&
        (audioUrl ? (
          <Box sx={{ mt: 0.75 }}>
            <audio controls preload={AUDIO_PRELOAD} src={audioUrl} style={AUDIO_STYLE} />
          </Box>
        ) : (
          <Typography variant="caption" component="p" color="text.secondary" sx={{ mt: 0.75 }}>
            {t("studentResponses.fileUnavailable")}
          </Typography>
        ))}

      {(isAudio || r.transcript) && (
        <Typography variant="body2" sx={{ mt: 0.5, fontStyle: "italic" }}>
          {r.transcript
            ? t("studentResponses.transcript", { transcript: r.transcript })
            : t("studentResponses.noTranscript")}
        </Typography>
      )}

      {r.imagePath &&
        (imageUrl ? (
          <Box sx={{ mt: 0.75 }}>
            <img src={imageUrl} alt={t("studentResponses.photoAlt")} style={IMAGE_STYLE} />
          </Box>
        ) : (
          <Typography variant="caption" component="p" color="text.secondary" sx={{ mt: 0.75 }}>
            {t("studentResponses.fileUnavailable")}
          </Typography>
        ))}

      {r.strokes && (
        <Box sx={{ mt: 0.75 }}>
          <StrokeOrderView strokes={r.strokes} fileName={`${row.blockKey}-${row.questionKey}`} />
        </Box>
      )}

      {r.reason && (
        <Typography variant="caption" component="p" sx={{ mt: 0.75 }}>
          {r.reason}
        </Typography>
      )}

      {row.legacy && (
        <Typography variant="caption" component="p" color="text.disabled" sx={{ mt: 0.5 }}>
          {t("studentResponses.legacy")}
        </Typography>
      )}
    </Paper>
  );
}

export default StudentResponsesPanel;
