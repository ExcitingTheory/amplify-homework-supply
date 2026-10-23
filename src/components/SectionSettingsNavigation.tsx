"use client";

import React from "react";
import { Box, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export interface SectionSettingsNavigationProps {
  sectionId: string;
  backToSection?: boolean;
}

export function SectionSettingsNavigation({
  sectionId,
  backToSection = false,
}: SectionSettingsNavigationProps) {
  const t = useTranslations("common");
  const sectionPath = `/section/${encodeURIComponent(sectionId)}`;
  if (backToSection) {
    return (
      <Button component={Link} href={sectionPath} startIcon={<ArrowBackIcon />}>
        {t("navigation.backToSection")}
      </Button>
    );
  }
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      <Button
        component={Link}
        href={`${sectionPath}/settings/ai`}
        startIcon={<SmartToyIcon />}
        size="small"
      >
        {t("navigation.sectionAISettings")}
      </Button>
      <Button
        component={Link}
        href={`${sectionPath}/settings/gamification`}
        startIcon={<SportsEsportsIcon />}
        size="small"
      >
        {t("navigation.sectionGamificationSettings")}
      </Button>
    </Box>
  );
}
