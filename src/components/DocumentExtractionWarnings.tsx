import { Alert, Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { groupReviewWarnings, readReviewWarnings } from "../utils/reviewWarnings";

interface DocumentExtractionWarningsProps {
  metadata?: unknown;
  /** How many entries in the list below carry a warning. */
  flaggedCount?: number;
  /** What the flagged entries are, for the count: "words" or "questions". */
  itemLabel?: string;
}

/**
 * Says how much of a document's extraction needs checking. The reasons
 * themselves are shown on the entries they are about, which are listed first,
 * so this stays a short summary rather than a wall of text.
 */
export default function DocumentExtractionWarnings({
  metadata,
  flaggedCount,
  itemLabel,
}: DocumentExtractionWarningsProps) {
  const t = useTranslations("editor.files");
  const warnings = readReviewWarnings(metadata);
  if (warnings.length === 0) return null;

  const grouped = groupReviewWarnings(warnings);
  const count = flaggedCount ?? grouped.flaggedCount;
  const label = itemLabel ?? t("fileManager2.fileDetails.reviewItems");
  const summary = t("fileManager2.fileDetails.reviewCount", { count, items: label });
  const message = t("fileManager2.fileDetails.humanReviewMessage");

  return (
    <Alert severity="warning" sx={{ mt: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {summary}
      </Typography>
      <Typography variant="body2">{message}</Typography>
      {grouped.document.length > 0 && (
        <Box component="ul" sx={{ pl: 2, mb: 0, mt: 1 }}>
          {grouped.document.slice(0, 5).map((warning, index) => (
            <li key={index}>
              <Typography variant="caption">{warning}</Typography>
            </li>
          ))}
        </Box>
      )}
    </Alert>
  );
}
