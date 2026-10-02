"use client";
import React from "react";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export interface ParentSectionCardProps {
  header: React.ReactNode;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
}

/** Real Accordion shell (matches the CourseAccordion pattern) assembling a section header with its tracking metrics/table body. Radius comes from the theme's MuiAccordion override. */
export function ParentSectionCard({
  header,
  children,
  expanded,
  onToggle,
}: ParentSectionCardProps) {
  return (
    <Accordion
      expanded={expanded}
      onChange={(_event, isExpanded) => onToggle(isExpanded)}
      disableGutters
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 0,
          "& .MuiAccordionSummary-content": { margin: 0, minWidth: 0 },
        }}
      >
        {header}
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
}
