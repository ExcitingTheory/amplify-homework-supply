/** Sidebar-only block previews with explicit accept and reject actions. */
import React from "react";
import { Alert, Box, List, ListItem, Typography, Skeleton, Button } from "@mui/material";
import { AutoAwesome as AutoAwesomeIcon } from "@mui/icons-material";
import { useTranslations } from "next-intl";
import SuggestionMarkdown from "./SuggestionMarkdown";

export default function BlockSuggestionMenu({
  suggestions,
  onSelect,
  onReject,
  isLoadingAI = false,
  useAI = false,
  onRequestMore,
  error,
}) {
  const t = useTranslations("editor.ai");
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {isLoadingAI ? (
        <Box role="status" aria-label={t("aiContentSuggestion.generating")} sx={{ p: 4 }}>
          <Skeleton variant="rounded" height={100} />
        </Box>
      ) : !suggestions?.length ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          {t("blockSuggestionMenu.emptyState")}
        </Typography>
      ) : (
        <List disablePadding>
          {suggestions.map((suggestion, index) => (
            <ListItem key={index} sx={{ display: "block", borderBottom: 1, borderColor: "divider", py: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {suggestion.label}
              </Typography>
              {suggestion.markdown && (
                <Box sx={{ mb: 2, overflowWrap: "anywhere" }}>
                  <SuggestionMarkdown
                    markdown={suggestion.markdown}
                    referenceContext={suggestion.referenceContext}
                  />
                </Box>
              )}
              {suggestion.reasoning && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {suggestion.reasoning}
                </Typography>
              )}
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button size="small" variant="contained" onClick={() => onSelect(index)}>
                  {t("blockSuggestionMenu.accept")}
                </Button>
                <Button size="small" variant="outlined" onClick={() => onReject?.(index)}>
                  {t("blockSuggestionMenu.reject")}
                </Button>
              </Box>
            </ListItem>
          ))}
        </List>
      )}
      {useAI && onRequestMore && (
        <Button
          variant="outlined"
          startIcon={<AutoAwesomeIcon />}
          onClick={onRequestMore}
          disabled={isLoadingAI}
        >
          {t("blockSuggestionMenu.generateMore")}
        </Button>
      )}
    </Box>
  );
}
