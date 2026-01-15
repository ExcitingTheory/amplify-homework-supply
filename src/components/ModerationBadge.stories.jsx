/**
 * @fileoverview Storybook stories for ModerationBadge component
 * Demonstrates content moderation status indicators
 * 
 * Note: Uses safe mock data with generic "label" categories
 */

import React from 'react';
import ModerationBadge, { ModerationStatusIcon } from './ModerationBadge';
import { Box, Paper, Typography, Stack } from '@mui/material';
import { DemoBanner } from '../../.storybook/components/DemoBanner';

// Mock items with different moderation states
const mockApprovedItem = {
  id: 'item-1',
  moderationStatus: 'approved',
  moderationFlags: null,
  moderationCheckedAt: new Date().toISOString(),
};

const mockFlaggedItemSingle = {
  id: 'item-2',
  moderationStatus: 'flagged',
  moderationFlags: JSON.stringify({
    categories: {
      category_label_1: true,
      category_label_2: false,
    },
    categoryScores: {
      category_label_1: 0.87,
      category_label_2: 0.12,
    },
    model: 'text-moderation-latest',
  }),
  moderationCheckedAt: new Date().toISOString(),
};

const mockFlaggedItemMultiple = {
  id: 'item-3',
  moderationStatus: 'flagged',
  moderationFlags: JSON.stringify({
    categories: {
      category_label_1: true,
      category_label_2: true,
      category_label_3: true,
    },
    categoryScores: {
      category_label_1: 0.95,
      category_label_2: 0.73,
      category_label_3: 0.61,
    },
    model: 'text-moderation-latest',
  }),
  moderationCheckedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
};

const mockUncheckedItem = {
  id: 'item-4',
  moderationStatus: null,
  moderationFlags: null,
  moderationCheckedAt: null,
};

export default {
  title: '🧩 Components/Moderation Badge',
  component: ModerationBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays content moderation status as a compact badge. Shows warnings for flagged content with tooltip details.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Box sx={{ p: 3 }}>
        <DemoBanner 
          title="Content Moderation Badge"
          description="Visual indicators for content moderation status using generic category labels"
        />
        <Story />
      </Box>
    ),
  ],
};

export const ApprovedContent = {
  args: {
    item: mockApprovedItem,
    showDetails: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Approved content shows no badge by default (reduces clutter).',
      },
    },
  },
};

export const ApprovedWithDetails = {
  args: {
    item: mockApprovedItem,
    showDetails: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'When showDetails is true, approved content shows a success badge.',
      },
    },
  },
};

export const FlaggedSingleCategory = {
  args: {
    item: mockFlaggedItemSingle,
    showDetails: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Flagged content shows a warning badge. Hover to see details.',
      },
    },
  },
};

export const FlaggedWithDetails = {
  args: {
    item: mockFlaggedItemSingle,
    showDetails: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Detailed view shows all flagged categories in the badge label.',
      },
    },
  },
};

export const FlaggedMultipleCategories = {
  args: {
    item: mockFlaggedItemMultiple,
    showDetails: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple flagged categories are comma-separated.',
      },
    },
  },
};

export const UncheckedContent = {
  args: {
    item: mockUncheckedItem,
    showDetails: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Content not yet checked shows nothing (null state).',
      },
    },
  },
};

// Icon variant stories
export const IconOnly = () => (
  <Stack spacing={2} direction="row" alignItems="center">
    <Typography>Approved:</Typography>
    <ModerationStatusIcon item={mockApprovedItem} />
    
    <Typography sx={{ ml: 3 }}>Flagged:</Typography>
    <ModerationStatusIcon item={mockFlaggedItemSingle} />
  </Stack>
);

IconOnly.parameters = {
  docs: {
    description: {
      story: 'Icon-only variant for compact layouts. Only shows for flagged content.',
    },
  },
};

// List demonstration
export const InContentList = () => {
  const mockItems = [
    { ...mockApprovedItem, title: 'Lesson 1: Introduction' },
    { ...mockFlaggedItemSingle, title: 'Student Submission A' },
    { ...mockApprovedItem, id: 'item-5', title: 'Lesson 2: Grammar' },
    { ...mockFlaggedItemMultiple, title: 'Student Submission B' },
    { ...mockUncheckedItem, title: 'Draft Lesson 3' },
  ];

  return (
    <Stack spacing={2} sx={{ minWidth: 400 }}>
      {mockItems.map(item => (
        <Paper key={item.id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ flex: 1 }}>{item.title}</Typography>
          <ModerationBadge item={item} />
        </Paper>
      ))}
    </Stack>
  );
};

InContentList.parameters = {
  docs: {
    description: {
      story: 'Example of moderation badges in a content list (grades, units, etc.).',
    },
  },
};
