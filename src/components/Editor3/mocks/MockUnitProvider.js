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
    grade: { data: {} },
    recentGrades: [],
    dictionary: {},
    files: {
      'audio-1': {
        id: 'audio-1',
        name: 'Sample Audio.mp3',
        path: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        size: 50000,
        type: 'audio/mp3',
      },
      'video-1': {
        id: 'video-1',
        name: 'Sample Video.mp4',
        path: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        size: 100000,
        type: 'video/mp4',
      },
    },
    questionBank: {
      'q-1': {
        id: 'q-1',
        prompt: 'Sample Question',
        audio: ['https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'],
        targetIdentityId: 'mock-identity-id',
      },
    },
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
