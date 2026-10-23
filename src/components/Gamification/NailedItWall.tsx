/**
 * NailedItWall — "Wall of Excellence" grid for a student's profile.
 *
 * @module NailedItWall
 */

import React from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { EmptyState } from "../EmptyState";

export interface NailedItBlock {
  id: string;
  question: string;
  nailedItReason: string;
  homeworkTitle: string;
  createdAt: string;
}

export interface NailedItWallProps {
  blocks: NailedItBlock[];
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

export function NailedItWall({ blocks }: NailedItWallProps) {
  const t = useTranslations("components");
  if (!blocks || blocks.length === 0) {
    return <EmptyState dense title={t("nailedItWall.emptyTitle")} />;
  }

  return (
    <Grid container spacing={2}>
      {blocks.map((block) => (
        <Grid size={{ xs: 12, sm: 6 }} key={block.id}>
          <Card sx={{ borderLeft: "4px solid", borderColor: "success.main" }}>
            <CardContent>
              <Typography variant="overline" color="success.main">
                {t("nailedItWall.heading")}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {block.question}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                component="p"
                mt={1}
              >
                {block.nailedItReason}
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.disabled"
                mt={0.5}
              >
                {t("nailedItWall.meta", {
                  homeworkTitle: block.homeworkTitle,
                  date: formatDate(block.createdAt),
                })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default NailedItWall;
