"use client";

import React from "react";
import { Box, Link as MuiLink } from "@mui/material";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function AppFooter() {
  const t = useTranslations("pages");
  return (
    <Box
      component="footer"
      sx={{
        p: 2,
        mt: "auto",
        textAlign: "center",
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <MuiLink component={Link} href="/privacy" variant="body2">
        {t("privacy.title")}
      </MuiLink>
    </Box>
  );
}
