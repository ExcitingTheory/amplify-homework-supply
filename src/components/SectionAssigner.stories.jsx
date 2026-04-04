import React from 'react';
import { expect, within, waitFor, userEvent, screen } from 'storybook/test';
import { SectionAssigner } from './SectionAssigner';
import SectionContext from '../context/sectionContext';

export default {
  title: '🧩 Components/Section Assigner',
  component: SectionAssigner,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => {
      const mockSections = [
        {
          id: 'section-1',
          name: 'Period 1 - French 101',
          description: 'Morning class, 9:00 AM',
          learner: 'student-123',
          owner: 'teacher-1',
        },
        {
          id: 'section-2',
          name: 'Period 2 - French 101',
          description: 'Afternoon class, 2:00 PM',
          learner: 'student-456',
          owner: 'teacher-1',
        },
      ];
      const mockSectionMap = {
        'section-1': mockSections[0],
        'section-2': mockSections[1],
      };
      const mockAssignments = [
        {
          id: 'assignment-1',
          unitID: 'unit-123',
          sectionID: 'section-1',
          learner: 'student-123',
          dueDate: '2025-12-25T10:00:00.000Z',
        },
      ];
      return (
        <SectionContext.Provider
          value={{
            sections: mockSections,
            sectionMap: mockSectionMap,
            assignments: mockAssignments,
          }}
        >
          <Story />
        </SectionContext.Provider>
      );
    },
  ],
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
    // MUI Dialog renders in a portal outside canvasElement, so use screen
    await waitFor(() => {
      expect(screen.queryByText(/Assign to Section/i)).toBeInTheDocument();
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
  decorators: [
    (Story) => (
      <SectionContext.Provider
        value={{ sections: [], sectionMap: {}, assignments: [] }}
      >
        <Story />
      </SectionContext.Provider>
    ),
  ],
};
