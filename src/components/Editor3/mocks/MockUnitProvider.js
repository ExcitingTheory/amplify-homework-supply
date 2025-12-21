import React from 'react';
import UnitContext from '../../../context/unitContext';
import FilesContext from '../../../context/fileContext';
import SectionContext from '../../../context/sectionContext';

/**
 * Mock provider for UnitContext to be used in Storybook stories
 */
export const MockUnitProvider = ({ children, mockValue = {} }) => {
  const defaultMockValue = {
    unit: {
      id: 'mock-unit-id',
      name: 'Sample Unit',
      description: 'This is a sample unit for Storybook',
      data: {
        root: {
          children: [],
          direction: null,
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      },
      _version: 1,
      owner: 'mock-owner',
    },
    name: 'Sample Unit',
    rubric: [],
    grade: null,
    recentGrades: [],
    dictionary: {},
    files: {},
    questionBank: {},
    playlistUrls: {},
    description: 'This is a sample unit for Storybook',
    editorStateRef: { current: null },
    editorSelectionRef: { current: null },
    versionRef: { current: 1 },
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
    session: {
      username: 'mock-user',
      error: undefined,
    },
    ...mockValue,
  };

  const mockFilesContext = {
    audioFiles: {},
    refreshAudioFiles: () => {},
    session: {
      identityId: 'mock-identity-id',
      idToken: 'mock-token',
      username: 'mock-user',
      error: undefined,
    },
  };

  const mockSectionContext = {
    sections: [],
    setSections: () => {},
  };

  return (
    <SectionContext.Provider value={mockSectionContext}>
      <FilesContext.Provider value={mockFilesContext}>
        <UnitContext.Provider value={defaultMockValue}>
          {children}
        </UnitContext.Provider>
      </FilesContext.Provider>
    </SectionContext.Provider>
  );
};
