import React from "react";
import AIContentSuggestion from "./AIContentSuggestion";
import { Box } from "@mui/material";

export default {
  title: "✏️ Lesson Editor/AI Suggestions/Content Suggestion",
  component: AIContentSuggestion,
  parameters: {
    layout: "padded",
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
  },
  decorators: [
    (Story) => (
      <Box sx={{ position: "relative", minHeight: 200, p: 4 }}>
        <Story />
      </Box>
    ),
  ],
};

export const WithSuggestion = {
  args: {
    suggestion:
      "The mitochondria is the powerhouse of the cell, responsible for producing ATP through cellular respiration.",
    isLoading: false,
    anchorElement: null,
    onAccept: () => console.log("Accepted"),
    onDismiss: () => console.log("Dismissed"),
  },
};

export const Loading = {
  args: {
    suggestion: "",
    isLoading: true,
    anchorElement: null,
    onAccept: () => {},
    onDismiss: () => {},
  },
};

export const ShortSuggestion = {
  args: {
    suggestion: "photosynthesis",
    isLoading: false,
    anchorElement: null,
    onAccept: () => console.log("Accepted"),
    onDismiss: () => console.log("Dismissed"),
  },
};
