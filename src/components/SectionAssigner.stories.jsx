import React from 'react';
import { SectionAssigner } from './SectionAssigner';

export default {
  title: 'Components/SectionAssigner',
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
};

export const Closed = {
  args: {
    openAssignmentDialog: false,
    setOpenAssignmentDialog: (open) => console.log('Dialog state:', open),
    ContentModel: mockContentModel,
  },
};
