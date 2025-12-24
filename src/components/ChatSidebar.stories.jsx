import React from 'react';
import ChatSidebar from './ChatSidebar';
import UnitContext from '../context/unitContext';

export default {
  title: 'Components/ChatSidebar',
  component: ChatSidebar,
  parameters: {
    layout: 'padded',
  },
};

// Mock context provider
const MockUnitContext = ({ children }) => {
  const mockContext = {
    unit: {
      id: 'unit-123',
      title: 'French Vocabulary Unit 1',
      content: 'Sample unit content',
      data: {},
    },
    files: {},
    questionBank: {},
    dictionary: {},
    name: 'French Vocabulary Unit 1',
    description: 'Sample unit description',
    rubric: [],
    grade: {},
    recentGrades: [],
    playlistUrls: {},
    editorStateRef: { current: null },
    editorSelectionRef: { current: null },
    versionRef: { current: 0 },
    finishedQuestions: 0,
    showUnitComplete: false,
    handleBeforeUnload: () => {},
    setShowUnitComplete: () => {},
    setFinishedQuestions: () => {},
    saveName: async () => {},
    saveDescription: async () => {},
    handleDelete: async () => {},
    handleStatusChange: async () => {},
    saveEditorContent: async () => {},
    saveGrade: async () => {},
    createGrade: async () => {},
    session: { username: 'test-user' },
  };

  return (
    <UnitContext.Provider value={mockContext}>
      {children}
    </UnitContext.Provider>
  );
};

export const Default = {
  decorators: [
    (Story) => (
      <MockUnitContext>
        <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
          <Story />
        </div>
      </MockUnitContext>
    ),
  ],
};

export const WithMessages = {
  decorators: [
    (Story) => (
      <MockUnitContext>
        <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
          <Story />
        </div>
      </MockUnitContext>
    ),
  ],
};
