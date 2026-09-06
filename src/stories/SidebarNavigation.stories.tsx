import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  Divider,
} from "@mui/material";
import { expect, within } from "storybook/test";

const QUIZ_DESTINATIONS: { label: string; storyId: string }[] = [
  { label: "Dashboard", storyId: "📄-pages-application-pages--index" },
  { label: "Sections", storyId: "📄-pages-application-pages--sections" },
  {
    label: "Section Detail",
    storyId: "📄-pages-application-pages--section-detail",
  },
  { label: "Units", storyId: "📄-pages-application-pages--units" },
  { label: "Unit Detail", storyId: "📄-pages-application-pages--unit-detail" },
  { label: "Workbook", storyId: "📄-pages-application-pages--workbook" },
  {
    label: "Keyboard Shortcuts",
    storyId: "🏠-getting-started-keyboard-shortcuts--default",
  },
  {
    label: "Task Completion Examples",
    storyId:
      "🏠-getting-started-onboarding-task-completion-examples--auto-detect-task-completion",
  },
  { label: "Translation Demo", storyId: "translation-mode-demo--default" },
  {
    label: "Translation Demo (Editor)",
    storyId: "translation-mode-demo--editor-namespace",
  },
  {
    label: "Translation Demo (Auth)",
    storyId: "translation-mode-demo--auth-namespace",
  },
];

const meta: Meta = {
  title: "🏠 Getting Started/Onboarding/Sidebar Navigation",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Use this story as the launch point for Quiz Mode tasks.",
          "1. Read your task in the Onboarding panel.",
          "2. Open this Sidebar Navigation story.",
          "3. Click the destination link below to open the exact target page story.",
          "Task completion is event-driven and automatic.",
        ].join("\n"),
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const SidebarNavigation: Story = {
  render: () => {
    const openStory = (storyId: string) => {
      const url = `?path=/story/${encodeURIComponent(storyId)}`;
      if (window.parent && window.parent !== window) {
        window.parent.location.href = url;
      } else {
        window.location.href = url;
      }
    };

    return (
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        <Card>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 1 }}>
              Sidebar Navigation Map
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Select the destination your onboarding task asks for. Each button
              opens the exact Storybook page used by Quiz Mode tasks.
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {QUIZ_DESTINATIONS.map((item) => (
                <Button
                  key={item.storyId}
                  variant="outlined"
                  size="small"
                  onClick={() => openStory(item.storyId)}
                  sx={{ textTransform: "none" }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Sidebar Navigation Map");
  },
};
