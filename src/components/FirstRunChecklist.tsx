"use client";

import React from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type ChecklistItem = {
  label: string;
  href: string;
};

export interface FirstRunChecklistProps {
  role?: "learner" | "instructor";
}

export default function FirstRunChecklist({
  role = "learner",
}: FirstRunChecklistProps) {
  const router = useRouter();
  const t = useTranslations("components");
  const [visible, setVisible] = React.useState(false);
  const items: ChecklistItem[] =
    role === "instructor"
      ? [
          {
            label: t("firstRunChecklist.setupClass"),
            href: "/sections",
          },
          {
            label: t("firstRunChecklist.createUnit"),
            href: "/units",
          },
        ]
      : [
          {
            label: t("firstRunChecklist.joinClass"),
            href: "/sections",
          },
          {
            label: t("firstRunChecklist.openWork"),
            href: "/dashboard",
          },
        ];

  React.useEffect(() => {
    setVisible(
      window.localStorage.getItem("homework-supply:first-run-complete") !== "1",
    );
  }, []);

  if (!visible) return null;

  return (
    <Box
      data-tour="first-run-checklist"
      sx={{ maxWidth: "60rem", mx: "auto", px: 2, pt: 2 }}
    >
      <Alert
        severity="info"
        onClose={() => {
          window.localStorage.setItem(
            "homework-supply:first-run-complete",
            "1",
          );
          setVisible(false);
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          {t("firstRunChecklist.title")}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {t("firstRunChecklist.description")}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {items.map((item) => (
            <Button
              key={item.href}
              size="small"
              variant="outlined"
              onClick={() => router.push(item.href)}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
      </Alert>
    </Box>
  );
}
