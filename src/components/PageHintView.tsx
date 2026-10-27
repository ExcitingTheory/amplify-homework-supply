import React from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";

export interface PageHintViewAction {
  id: string;
  label: string;
}

export interface PageHintViewProps {
  title: string;
  body: string;
  actions?: PageHintViewAction[];
  /** Accessible name of the close icon (dismisses only this hint). */
  dismissLabel: string;
  optOutLabel: string;
  onAction: (actionId: string) => void;
  onDismiss: () => void;
  onOptOut: () => void;
}

export function PageHintView({
  title,
  body,
  actions = [],
  dismissLabel,
  optOutLabel,
  onAction,
  onDismiss,
  onOptOut,
}: PageHintViewProps) {
  return (
    <Box
      data-tour="page-hint"
      sx={{ px: { xs: 2, md: 3 }, pt: 2, boxSizing: "border-box" }}
    >
      <Alert severity="info" onClose={onDismiss} closeText={dismissLabel}>
        <Typography variant="subtitle1" component="h2" fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {body}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          alignItems="center"
        >
          {actions.map((action) => (
            <Button
              key={action.id}
              size="small"
              variant="outlined"
              onClick={() => onAction(action.id)}
            >
              {action.label}
            </Button>
          ))}
          <Button size="small" color="inherit" onClick={onOptOut}>
            {optOutLabel}
          </Button>
        </Stack>
      </Alert>
    </Box>
  );
}
