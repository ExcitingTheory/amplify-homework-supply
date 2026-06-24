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
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LazyCardMedia from "@/components/LazyCardMedia";
import { useTranslations } from "next-intl";

interface CommunityUnitCardProps {
  unit: {
    id: string;
    name?: string;
    description?: string;
    owner?: string;
    identityId?: string;
    featuredImage?: string;
    thumbnail?: string;
    publishedAt?: string;
  };
  onFork: (unitId: string) => void;
  forking?: boolean;
}

/**
 * CommunityUnitCard - Read-only card for community browse tab.
 * Shows unit name, description, author, and a "Fork" button.
 */
export default function CommunityUnitCard({
  unit,
  onFork,
  forking = false,
}: CommunityUnitCardProps) {
  const t = useTranslations("components");
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
        borderLeftColor: "info.main",
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
          <Typography variant="h6" component="div" noWrap>
            {unit.name || t("communityUnitCard.untitledUnit")}
          </Typography>
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
            {unit.description || t("communityUnitCard.noDescription")}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <Chip
              label={t("communityUnitCard.byAuthor", { author: unit.owner || "Unknown" })}
              size="small"
              variant="outlined"
            />
            {unit.publishedAt && (
              <Typography variant="caption" color="text.secondary">
                Published {new Date(unit.publishedAt).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </CardContent>
        <Box sx={{ display: "flex", alignItems: "center", pl: 2, pb: 1, gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={() => onFork(unit.id)}
            disabled={forking}
          >
            {forking ? t("communityUnitCard.forking") : t("communityUnitCard.fork")}
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
