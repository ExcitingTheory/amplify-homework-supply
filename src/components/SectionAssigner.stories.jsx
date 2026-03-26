import React from 'react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { SectionAssigner } from './SectionAssigner';

export default {
  title: '🧩 Components/Section Assigner',
  component: SectionAssigner,
  parameters: {
    layout: 'centered',
  },
};

const mockContentModel = {
  id: 'unit-123',
  title: 'French Vocabulary Unit 1',
  learners: [],
};

export const Default = {
  args: {
    openAssignmentDialog: true,
    setOpenAssignmentDialog: (open) => console.log('Dialog state:', open),
    ContentModel: mockContentModel,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify dialog is open and displays the dialog title
    await waitFor(() => {
      expect(canvas.queryByText(/Assign to Section/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  },
};

export const Closed = {
  args: {
    openAssignmentDialog: false,
    setOpenAssignmentDialog: (open) => console.log('Dialog state:', open),
    ContentModel: mockContentModel,
  },
};

export const NoSections = {
  args: {
    openAssignmentDialog: true,
    setOpenAssignmentDialog: (open) => console.log('Dialog state:', open),
    ContentModel: mockContentModel,
  },
};
