"use client";

import React from "react";
import { Alert, AlertTitle, Button, Snackbar, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface ChecklistItem {
  label: string;
  href: string;
}

export interface FirstRunChecklistProps {
  role?: "learner" | "instructor";
  /** How long the toast stays before hiding itself. */
  autoHideDuration?: number;
}

const STORAGE_KEY = "homework-supply:first-run-complete";

/**
 * FirstRunChecklist — points a new user at their first couple of steps.
 *
 * Shown as a toast rather than a banner: it sits above the page instead of
 * shifting it, and it leaves on its own so it cannot become permanent
 * furniture. Dismissing it, or following one of its links, settles it for good.
 */
export default function FirstRunChecklist({
  role = "learner",
  autoHideDuration = 12000,
}: FirstRunChecklistProps) {
  const router = useRouter();
  const t = useTranslations("components");
  const [open, setOpen] = React.useState(false);

  const items: ChecklistItem[] =
    role === "instructor"
      ? [
          { label: t("firstRunChecklist.setupClass"), href: "/sections" },
          { label: t("firstRunChecklist.createUnit"), href: "/units" },
        ]
      : [
          { label: t("firstRunChecklist.joinClass"), href: "/sections" },
          { label: t("firstRunChecklist.openWork"), href: "/dashboard" },
        ];

  React.useEffect(() => {
    setOpen(window.localStorage.getItem(STORAGE_KEY) !== "1");
  }, []);

  /** Auto-hiding only closes the toast; it stays due on the next visit. */
  const close = React.useCallback((settled: boolean) => {
    if (settled) window.localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }, []);

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={(_, reason) => {
        // A stray click elsewhere should not count as reading it.
        if (reason === "clickaway") return;
        close(false);
      }}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <Alert
        severity="info"
        variant="filled"
        onClose={() => close(true)}
        sx={{ maxWidth: "32rem" }}
      >
        <AlertTitle>{t("firstRunChecklist.title")}</AlertTitle>
        {t("firstRunChecklist.description")}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          {items.map((item) => (
            <Button
              key={item.href}
              size="small"
              variant="outlined"
              color="inherit"
              onClick={() => {
                close(true);
                router.push(item.href);
              }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
      </Alert>
    </Snackbar>
  );
}
