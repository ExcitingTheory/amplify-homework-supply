"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Alert, Box, Button, Skeleton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link } from "@/i18n/navigation";
import AuthContext from "@/context/authContext";
import { getAmplifyClient } from "@/utils/amplifyClient";
import {
  GradedWorkbookViewer,
  type GradeAttempt,
} from "@/components/GradedWorkbookViewer/GradedWorkbookViewer";

interface StudentReviewClientProps {
  unitId: string;
  contentJson: string;
}

function parseJson(value: unknown) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
}

const VIEWER_MAX_HEIGHT = "calc(100vh - 160px)";
const VIEWER_ROLE = "student" as const;

/**
 * The student's own attempts at one unit, read-only. Grade auth (owner)
 * limits the list to this student's grades; GradeResponse items carry the
 * answers, and recordings load from the student's own private storage.
 */
export default function StudentReviewClient({
  unitId,
  contentJson,
}: StudentReviewClientProps) {
  const t = useTranslations("components");
  const { user } = React.useContext(AuthContext) as {
    user?: { attributes?: Record<string, string> };
  };
  const [grades, setGrades] = React.useState<GradeAttempt[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const client = getAmplifyClient();
        const all: any[] = [];
        let nextToken: string | null | undefined = null;
        do {
          const page: any = await client.models.Grade.list({
            filter: { unitID: { eq: unitId } },
            nextToken,
          });
          all.push(...(page?.data || []).filter(Boolean));
          nextToken = page?.nextToken;
        } while (nextToken);
        if (cancelled) return;
        const sorted = all
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .map((g, index, arr) => ({
            id: g.id,
            attempt: arr.length - index,
            accuracy: g.accuracy || 0,
            percentComplete: g.percentComplete || 0,
            complete: g.complete || false,
            timerStarted: g.timerStarted,
            data: parseJson(g.data) || {},
            feedback: parseJson(g.feedback) || undefined,
            createdAt: g.createdAt,
            updatedAt: g.updatedAt,
          }));
        setGrades(sorted);
      } catch (error) {
        console.error("[StudentReviewClient] Loading grades failed:", error);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unitId]);

  const name =
    user?.attributes?.preferred_username ||
    user?.attributes?.name ||
    user?.attributes?.email ||
    "";

  return (
    <Box sx={{ p: 2, maxWidth: 1400, mx: "auto" }}>
      <Button
        component={Link}
        href={`/workbook/${unitId}`}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 1 }}
      >
        {t("studentResponses.backToWorkbook")}
      </Button>
      {failed ? (
        <Alert severity="error">{t("studentResponses.loadError")}</Alert>
      ) : grades === null ? (
        <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 1 }} />
      ) : grades.length === 0 || !contentJson ? (
        <Alert severity="info">{t("studentResponses.reviewEmpty")}</Alert>
      ) : (
        <GradedWorkbookViewer
          contentJson={contentJson}
          studentName={name}
          grades={grades}
          viewerRole={VIEWER_ROLE}
          maxHeight={VIEWER_MAX_HEIGHT}
        />
      )}
    </Box>
  );
}
