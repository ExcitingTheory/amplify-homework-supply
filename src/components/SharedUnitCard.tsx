"use client";

import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LazyCardMedia from "@/components/LazyCardMedia";
import { useTranslations } from "next-intl";

interface SharedUnitCardProps {
  unit: {
    id: string;
    name?: string;
    description?: string;
    owner?: string;
    identityId?: string;
    featuredImage?: string;
    thumbnail?: string;
    _collaboratorPermission?: "READ" | "EDIT";
  };
  onOpen: (unitId: string) => void;
}

/**
 * SharedUnitCard - Card for the "Shared With Me" tab.
 * Shows collaborator badge and opens in read/edit mode based on permission.
 */
export default function SharedUnitCard({ unit, onOpen }: SharedUnitCardProps) {
  const t = useTranslations("components");
  const canEdit = unit._collaboratorPermission === "EDIT";

  return (
    <Card
      elevation={2}
      sx={{
        display: "flex",
        margin: "1rem auto",
        width: "90vw",
        maxWidth: "80rem",
        height: 180,
        borderRadius: 2,
        borderLeft: "4px solid",
        borderLeftColor: canEdit ? "success.main" : "warning.main",
        transition: "all 0.3s ease-in-out",
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          p: 0.5,
        }}
      >
        <CardContent sx={{ flex: "1 0 auto", pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
              {unit.name || t("sharedUnitCard.untitledUnit")}
            </Typography>
            <Chip
              label={canEdit ? t("sharedUnitCard.editAccess") : t("sharedUnitCard.readOnly")}
              size="small"
              color={canEdit ? "success" : "warning"}
              variant="filled"
              sx={{ height: 22, fontSize: "0.7rem" }}
            />
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {unit.description || t("sharedUnitCard.noDescription")}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {t("sharedUnitCard.sharedBy", { owner: unit.owner || "Unknown" })}
          </Typography>
        </CardContent>
        <Box sx={{ display: "flex", alignItems: "center", pl: 2, pb: 1, gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={canEdit ? <EditIcon /> : <VisibilityIcon />}
            onClick={() => onOpen(unit.id)}
          >
            {canEdit ? t("sharedUnitCard.edit") : t("sharedUnitCard.view")}
          </Button>
        </Box>
      </Box>
      {unit?.featuredImage && (
        <LazyCardMedia
          s3Key={unit.featuredImage}
          identityId={unit.identityId}
          fileId={null}
        />
      )}
    </Card>
  );
}
