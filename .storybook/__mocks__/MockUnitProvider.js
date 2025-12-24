import React from 'react';
import UnitContext from '../../src/context/unitContext';
import FilesContext from '../../src/context/fileContext';
import SectionContext from '../../src/context/sectionContext';

/**
 * Mock provider for UnitContext to be used in Storybook stories
 */
export const MockUnitProvider = ({ children, mockValue = {} }) => {
  // Sample files for realistic mock data
  // A 200x200 blue gradient square with "Sample Image" text
  const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4xLWMwMDAgNzkuYjBmOGJlOSwgMjAyMS8xMi8wOC0xOTo1MToyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIzLjEgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTAxLTE1VDEwOjAwOjAwLTA1OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0wMS0xNVQxMDowMDowMC0wNTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMy0wMS0xNVQxMDowMDowMC0wNTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6YWJjZGVmMTIzNDU2Nzg5MCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDphYmNkZWYxMjM0NTY3ODkwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6YWJjZGVmMTIzNDU2Nzg5MCI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YWJjZGVmMTIzNDU2Nzg5MCIgc3RFdnQ6d2hlbj0iMjAyMy0wMS0xNVQxMDowMDowMC0wNTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIzLjEgKE1hY2ludG9zaCkiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+VGhpcyBpcyBhIHRlc3QgaW1hZ2UAAACASURBVHic7dAxAQAADMOg+TfdyQqgAiGgAhGIQAQiEIEIRCACEYhABCIQgQhEIAIRiEAEIhCBCEQgAhGIQAQiEIEIRCACEYhABCIQgQhEIAIRiEAEIhCBCEQgAhGIQAQiEIEIRCACEYhABCIQgQhEIAIRiEAEIhCBCEQgAhGIQAQiEIEI5AVz1gEX0Z7OFQAAAABJRU5ErkJggg==';
  // Using publicly available test audio files
  const audioUrl1 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  const audioUrl2 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';
  const audioUrl3 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3';
  const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

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
    dictionary: {
      'word-1': {
        id: 'word-1',
        phrase: 'hello',
        pronunciation: 'heh-LOH',
        definition: 'a greeting or expression of goodwill',
        audio: [audioUrl1],
      },
      'word-2': {
        id: 'word-2',
        phrase: 'goodbye',
        pronunciation: 'good-BYE',
        definition: 'a parting phrase',
        audio: [audioUrl2],
      },
      'word-3': {
        id: 'word-3',
        phrase: 'thank you',
        pronunciation: 'THANK yoo',
        definition: 'an expression of gratitude',
        audio: [audioUrl3],
      },
      'word-4': {
        id: 'word-4',
        phrase: 'please',
        pronunciation: 'PLEEZ',
        definition: 'used to make a polite request',
        audio: [audioUrl1],
      },
    },
    files: {
      'image-1': {
        id: 'image-1',
        name: 'sample-image.png',
        path: base64Image,
        size: 150,
        type: 'image/png',
      },
      'image-2': {
        id: 'image-2',
        name: 'placeholder-diagram.png',
        path: base64Image,
        size: 200,
        type: 'image/png',
      },
      'audio-1': {
        id: 'audio-1',
        name: 'pronunciation-sample.mp3',
        path: audioUrl1,
        size: 5000,
        type: 'audio/mp3',
      },
      'audio-2': {
        id: 'audio-2',
        name: 'lesson-audio.mp3',
        path: audioUrl2,
        size: 7500,
        type: 'audio/mp3',
      },
      'audio-3': {
        id: 'audio-3',
        name: 'vocabulary-audio.mp3',
        path: audioUrl3,
        size: 6200,
        type: 'audio/mp3',
      },
      'video-1': {
        id: 'video-1',
        name: 'lesson-video.mp4',
        path: videoUrl,
        size: 50000,
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

  const mockFiles = [
    {
      id: 'image-1',
      name: 'sample-image.png',
      path: base64Image,
      size: 150,
      type: 'image/png',
    },
    {
      id: 'image-2',
      name: 'placeholder-diagram.png',
      path: base64Image,
      size: 200,
      type: 'image/png',
    },
    {
      id: 'audio-1',
      name: 'pronunciation-sample.mp3',
      path: audioUrl1,
      size: 5000,
      type: 'audio/mp3',
    },
    {
      id: 'audio-2',
      name: 'lesson-audio.mp3',
      path: audioUrl2,
      size: 7500,
      type: 'audio/mp3',
    },
    {
      id: 'audio-3',
      name: 'vocabulary-audio.mp3',
      path: audioUrl3,
      size: 6200,
      type: 'audio/mp3',
    },
    {
      id: 'video-1',
      name: 'lesson-video.mp4',
      path: videoUrl,
      size: 50000,
      type: 'video/mp4',
    },
  ];

  const myPlaylistFilesMap = {};
  mockFiles.forEach(file => {
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      myPlaylistFilesMap[file.id] = file;
    }
  });

  const mockFilesContext = {
    files: mockFiles,
    audioFiles: {},
    myPlaylistFiles: myPlaylistFilesMap,
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
