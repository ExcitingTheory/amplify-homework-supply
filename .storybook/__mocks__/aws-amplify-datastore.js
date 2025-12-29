/**
 * Mock @aws-amplify/datastore for Storybook
 * 
 * This mock provides DataStore functionality for Storybook stories.
 * The actual model classes are imported from src/models - we only mock
 * the DataStore class and its methods.
 */

// Mock unit storage
const mockUnits = {};
const mockGrades = {};
const mockFiles = {};
const mockSettings = {};
const mockDocuments = {};
const mockParsedContent = {};
const mockWords = {};
const mockQuestions = {};
const mockSections = {};

// Export storage for seed data
export { mockUnits, mockGrades, mockFiles, mockSettings, mockDocuments, mockParsedContent, mockWords, mockQuestions, mockSections };

// Store active subscriptions
const activeSubscriptions = {
  Unit: [],
  Grade: [],
  File: [],
  Settings: [],
  Document: [],
  ParsedContent: [],
  Word: [],
  Question: [],
  Section: [],
};

// Helper to seed mock data for stories
export const seedMockUnit = (unitData) => {
  if (unitData.id) {
    // Get word IDs from unitData or use empty array
    const wordIDs = unitData.wordIDs || [];
    const questionIDs = unitData.questionIDs || [];
    
    // Add mock relationship methods if not present
    const unit = {
      ...unitData,
      words: {
        toArray: async () => {
          // Return words that match the wordIDs
          return wordIDs.map(id => mockWords[id]).filter(Boolean);
        },
      },
      files: {
        toArray: async () => [],
      },
      questions: {
        toArray: async () => {
          // Return questions that match the questionIDs
          return questionIDs.map(id => mockQuestions[id]).filter(Boolean);
        },
      },
    };
    
    mockUnits[unitData.id] = unit;
    console.log('[Mock DataStore] Seeded unit:', unitData.id, 'with data:', !!unitData.data);
    console.log('[Mock DataStore] Unit data has root:', !!unitData.data?.root);
    console.log('[Mock DataStore] Total units in store:', Object.keys(mockUnits).length);
    
    // Notify all Unit subscribers about the new data
    const items = Object.values(mockUnits);
    activeSubscriptions.Unit.forEach(callback => {
      console.log('[Mock DataStore] Notifying subscriber with', items.length, 'units');
      callback({ items, isSynced: true });
    });
  }
};

// Helper to seed mock grade data for stories
export const seedMockGrade = (gradeData) => {
  if (gradeData.id) {
    mockGrades[gradeData.id] = gradeData;
    console.log('[Mock DataStore] Seeded grade:', gradeData.id, 'for unit:', gradeData.unitID);
    console.log('[Mock DataStore] Grade has data:', !!gradeData.data);
    console.log('[Mock DataStore] Total grades in store:', Object.keys(mockGrades).length);
    
    // Notify all Grade subscribers about the new data
    const items = Object.values(mockGrades);
    activeSubscriptions.Grade.forEach(callback => {
      console.log('[Mock DataStore] Notifying subscriber with', items.length, 'grades');
      callback({ items, isSynced: true });
    });
  }
};

// Helper to seed mock file data for stories
export const seedMockFiles = (filesArray) => {
  console.log('[Mock DataStore] Seeding files:', filesArray.length);
  filesArray.forEach(file => {
    if (file.id) {
      mockFiles[file.id] = file;
      
      // If it's a PDF, also create a Document record for it
      if (file.mimeType === 'application/pdf') {
        const docId = `doc-${file.id}`;
        mockDocuments[docId] = {
          id: docId,
          filename: file.name,
          s3Key: file.path,
          status: 'uploaded',
          identityId: file.identityId,
          createdAt: file.createdAt,
          updatedAt: file.createdAt,
        };
        console.log('[Mock DataStore] Created Document record for PDF:', docId);
      }
    }
  });
  console.log('[Mock DataStore] Total files in store:', Object.keys(mockFiles).length);
  console.log('[Mock DataStore] Total documents in store:', Object.keys(mockDocuments).length);
  
  // Notify all File subscribers about the new data
  const items = Object.values(mockFiles);
  activeSubscriptions.File.forEach(callback => {
    console.log('[Mock DataStore] Notifying File subscriber with', items.length, 'files');
    callback({ items, isSynced: true });
  });
  
  // Notify all Document subscribers
  const docItems = Object.values(mockDocuments);
  activeSubscriptions.Document.forEach(callback => {
    console.log('[Mock DataStore] Notifying Document subscriber with', docItems.length, 'documents');
    callback({ items: docItems, isSynced: true });
  });
};

// Helper to simulate PDF analysis status progression (for Storybook demos)
let activeAnalysisTimeouts = {};

export const simulateDocumentAnalysis = (documentId) => {
  console.log('[Mock DataStore] Simulating analysis for document:', documentId);
  
  // Clear any existing timeouts for this document
  if (activeAnalysisTimeouts[documentId]) {
    activeAnalysisTimeouts[documentId].forEach(timeout => clearTimeout(timeout));
  }
  activeAnalysisTimeouts[documentId] = [];
  
  // Update to extracting
  const timeout1 = setTimeout(() => {
    if (mockDocuments[documentId]) {
      mockDocuments[documentId].status = 'extracting';
      const docItems = Object.values(mockDocuments);
      activeSubscriptions.Document.forEach(callback => {
        callback({ items: docItems, isSynced: true });
      });
    }
  }, 1000);
  activeAnalysisTimeouts[documentId].push(timeout1);
  
  // Update to extracted
  const timeout2 = setTimeout(() => {
    if (mockDocuments[documentId]) {
      mockDocuments[documentId].status = 'extracted';
      mockDocuments[documentId].pageCount = Math.floor(Math.random() * 50) + 10;
      const docItems = Object.values(mockDocuments);
      activeSubscriptions.Document.forEach(callback => {
        callback({ items: docItems, isSynced: true });
      });
    }
  }, 2500);
  activeAnalysisTimeouts[documentId].push(timeout2);
  
  // Update to analyzing
  const timeout3 = setTimeout(() => {
    if (mockDocuments[documentId]) {
      mockDocuments[documentId].status = 'analyzing';
      const docItems = Object.values(mockDocuments);
      activeSubscriptions.Document.forEach(callback => {
        callback({ items: docItems, isSynced: true });
      });
    }
  }, 4000);
  activeAnalysisTimeouts[documentId].push(timeout3);
  
  // Update to completed
  const timeout4 = setTimeout(() => {
    if (mockDocuments[documentId]) {
      mockDocuments[documentId].status = 'completed';
      const docItems = Object.values(mockDocuments);
      activeSubscriptions.Document.forEach(callback => {
        callback({ items: docItems, isSynced: true });
      });
      // Clean up timeouts
      delete activeAnalysisTimeouts[documentId];
    }
  }, 6000);
  activeAnalysisTimeouts[documentId].push(timeout4);
};

// Helper to cancel PDF analysis (for Storybook demos)
export const cancelDocumentAnalysis = (documentId) => {
  console.log('[Mock DataStore] Cancelling analysis for document:', documentId);
  
  // Clear all pending timeouts
  if (activeAnalysisTimeouts[documentId]) {
    activeAnalysisTimeouts[documentId].forEach(timeout => clearTimeout(timeout));
    delete activeAnalysisTimeouts[documentId];
  }
  
  // Reset status to uploaded
  if (mockDocuments[documentId]) {
    mockDocuments[documentId].status = 'uploaded';
    const docItems = Object.values(mockDocuments);
    activeSubscriptions.Document.forEach(callback => {
      callback({ items: docItems, isSynced: true });
    });
  }
};

// Helper to seed mock words data for stories
export const seedMockWords = (wordsArray) => {
  console.log('[Mock DataStore] Seeding words:', wordsArray.length);
  wordsArray.forEach(word => {
    if (word.id) {
      mockWords[word.id] = word;
    }
  });
  console.log('[Mock DataStore] Total words in store:', Object.keys(mockWords).length);
  
  // Notify all Word subscribers about the new data
  const items = Object.values(mockWords);
  activeSubscriptions.Word.forEach(callback => {
    console.log('[Mock DataStore] Notifying Word subscriber with', items.length, 'words');
    callback({ items, isSynced: true });
  });
};

// Helper to seed mock sections data for stories
export const seedMockSections = (sectionsArray) => {
  console.log('[Mock DataStore] Seeding sections:', sectionsArray.length);
  sectionsArray.forEach(section => {
    if (section.id) {
      mockSections[section.id] = section;
    }
  });
  console.log('[Mock DataStore] Total sections in store:', Object.keys(mockSections).length);
  
  // Notify all Section subscribers about the new data
  const items = Object.values(mockSections);
  activeSubscriptions.Section.forEach(callback => {
    console.log('[Mock DataStore] Notifying Section subscriber with', items.length, 'sections');
    callback({ items, isSynced: true });
  });
};

// Helper to seed mock settings data for stories
export const seedMockSettings = (settingsData) => {
  console.log('[Mock DataStore] Seeding settings:', settingsData);
  if (!settingsData.id) {
    settingsData.id = 'settings-1';
  }
  mockSettings[settingsData.id] = settingsData;
  console.log('[Mock DataStore] Total settings in store:', Object.keys(mockSettings).length);
  
  // Notify all Settings subscribers about the new data
  const items = Object.values(mockSettings);
  activeSubscriptions.Settings.forEach(callback => {
    console.log('[Mock DataStore] Notifying Settings subscriber with', items.length, 'settings');
    callback({ items, isSynced: true });
  });
};

// Helper to clear mock data between stories
export const clearMockUnits = () => {
  Object.keys(mockUnits).forEach(key => delete mockUnits[key]);
  Object.keys(mockGrades).forEach(key => delete mockGrades[key]);
  Object.keys(mockFiles).forEach(key => delete mockFiles[key]);
  Object.keys(mockSettings).forEach(key => delete mockSettings[key]);
  Object.keys(mockDocuments).forEach(key => delete mockDocuments[key]);
  Object.keys(mockParsedContent).forEach(key => delete mockParsedContent[key]);
  Object.keys(mockWords).forEach(key => delete mockWords[key]);
  Object.keys(mockQuestions).forEach(key => delete mockQuestions[key]);
  Object.keys(mockSections).forEach(key => delete mockSections[key]);
  console.log('[Mock DataStore] Cleared all mock data');
  
  // Always seed a default unit for stories that don't provide their own
  seedMockUnit({
    id: 'mock-unit-id',
    name: 'Default Mock Unit',
    description: 'A default unit for stories',
    data: null,
    _version: 1,
    owner: 'mock-user-sub',
  });
  
  // Always seed a default grade for the default unit
  seedMockGrade({
    id: 'mock-grade-id',
    unitID: 'mock-unit-id',
    owner: 'mock-user-sub',
    unitVersion: 1,
    percentComplete: 0,
    accuracy: 0,
    complete: false,
    timerStarted: false,
    data: {},
    _version: 1,
  });
  
  // Seed default vocabulary words
  seedMockWords([
    {
      id: 'word-1',
      phrase: 'こんにちは',
      pronunciation: 'kon-ni-chi-wa',
      definition: 'Hello (Japanese)',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'word-2',
      phrase: '猫',
      pronunciation: 'neko',
      definition: 'Cat (Japanese)',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'word-3',
      phrase: 'ありがとう',
      pronunciation: 'a-ri-ga-tou',
      definition: 'Thank you (Japanese)',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'word-4',
      phrase: '犬',
      pronunciation: 'inu',
      definition: 'Dog (Japanese)',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'word-5',
      phrase: 'さようなら',
      pronunciation: 'sa-you-na-ra',
      definition: 'Goodbye (Japanese)',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'word-6',
      phrase: '本',
      pronunciation: 'hon',
      definition: 'Book (Japanese)',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'word-7',
      phrase: '水',
      pronunciation: 'mizu',
      definition: 'Water (Japanese)',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'word-8',
      phrase: '学校',
      pronunciation: 'gak-kou',
      definition: 'School (Japanese)',
      owner: 'mock-user-sub',
      _version: 1,
    },
    // Vocab words for audio/drawing exercises
    {
      id: 'vocab-word-1',
      phrase: 'こんにちは',
      pronunciation: 'kon-ni-chi-wa',
      definition: 'Hello (Japanese)',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'vocab-word-2',
      phrase: '猫',
      pronunciation: 'neko',
      definition: 'Cat (Japanese)',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'vocab-word-3',
      phrase: 'ありがとう',
      pronunciation: 'a-ri-ga-tou',
      definition: 'Thank you (Japanese)',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'vocab-word-4',
      phrase: '犬',
      pronunciation: 'inu',
      definition: 'Dog (Japanese)',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'vocab-word-5',
      phrase: 'さようなら',
      pronunciation: 'sa-you-na-ra',
      definition: 'Goodbye (Japanese)',
      owner: 'mock-user-sub',
      _version: 1,
    },
  ]);
  
  // Seed default questions for custom answer exercises
  mockQuestions['question-1'] = {
    id: 'question-1',
    prompt: 'What is the capital of France?',
    answer: 'Paris',
    hint: 'It is known as the City of Light',
    owner: 'mock-user-sub',
    _version: 1,
  };
  mockQuestions['question-2'] = {
    id: 'question-2',
    prompt: 'Describe the process of photosynthesis',
    answer: 'Plants convert light energy into chemical energy by using carbon dioxide and water to produce glucose and oxygen',
    hint: 'Think about how plants make food',
    owner: 'mock-user-sub',
    _version: 1,
  };
  mockQuestions['question-3'] = {
    id: 'question-3',
    prompt: 'What year did World War II end?',
    answer: '1945',
    hint: 'Think about the mid-1940s',
    owner: 'mock-user-sub',
    _version: 1,
  };
  
  // Audio and drawing question examples
  mockQuestions['audio-q1'] = {
    id: 'audio-q1',
    prompt: 'Pronounce "bonjour" (hello in French)',
    answer: 'bonjour',
    hint: 'Listen carefully to the pronunciation',
    owner: 'mock-user-sub',
    _version: 1,
  };
  mockQuestions['audio-q2'] = {
    id: 'audio-q2',
    prompt: 'Pronounce "merci" (thank you in French)',
    answer: 'merci',
    hint: 'Focus on the soft "r" sound',
    owner: 'mock-user-sub',
    _version: 1,
  };
  mockQuestions['drawing-q1'] = {
    id: 'drawing-q1',
    prompt: 'Draw a simple house with a roof, door, and windows',
    answer: 'A basic house sketch with roof, door, and windows',
    hint: 'Start with the basic rectangular shape',
    owner: 'mock-user-sub',
    _version: 1,
  };
  mockQuestions['drawing-q2'] = {
    id: 'drawing-q2',
    prompt: 'Draw a tree with branches and leaves',
    answer: 'A tree with trunk, branches, and foliage',
    hint: 'Think about the natural shape of a tree',
    owner: 'mock-user-sub',
    _version: 1,
  };
  mockQuestions['multi-q1'] = {
    id: 'multi-q1',
    prompt: 'Explain or demonstrate how photosynthesis works',
    answer: 'Plants use sunlight, water, and carbon dioxide to create glucose and oxygen',
    hint: 'You can write, draw, or explain verbally',
    owner: 'mock-user-sub',
    _version: 1,
  };
  mockQuestions['lang-audio-q1'] = {
    id: 'lang-audio-q1',
    prompt: 'Listen and repeat: こんにちは (konnichiwa)',
    answer: 'konnichiwa',
    hint: 'Pay attention to each syllable',
    audio: ['mock-audio-url-1.mp3'],
    owner: 'mock-user-sub',
    _version: 1,
  };
  mockQuestions['lang-audio-q2'] = {
    id: 'lang-audio-q2',
    prompt: 'Listen and repeat: ありがとう (arigatou)',
    answer: 'arigatou',
    hint: 'The "r" sound is softer than in English',
    audio: ['mock-audio-url-2.mp3'],
    owner: 'mock-user-sub',
    _version: 1,
  };
  
  // Seed default sections
  seedMockSections([
    {
      id: 'section-1',
      name: 'Period 1 - Monday 9:00 AM',
      description: 'First period class',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'section-2',
      name: 'Period 2 - Monday 10:30 AM',
      description: 'Second period class',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'section-3',
      name: 'Period 3 - Wednesday 2:00 PM',
      description: 'Third period class',
      owner: 'mock-user-sub',
      _version: 1,
    },
  ]);
  
  // Seed default files for file manager
  seedMockFiles([
    {
      id: 'file-1',
      name: 'sample-image-1.jpg',
      path: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCABAAEADAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/iiiigD/2Q==',
      mimeType: 'image/jpeg',
      size: 245632,
      identityId: 'mock-identity-id',
      owner: 'mock-user-sub',
      createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
      _version: 1,
    },
    {
      id: 'file-2',
      name: 'sample-image-2.png',
      path: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAMklEQVR42mNgQAL/oZgRiVsEYiYo5gRiLiBmB2J2KOYEYnYgZoFiTiBmgWJOIGYGAACvBge1vGbDpQAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      size: 512000,
      identityId: 'mock-identity-id',
      owner: 'mock-user-sub',
      createdAt: new Date('2024-01-16T11:30:00Z').toISOString(),
      _version: 1,
    },
    {
      id: 'file-3',
      name: 'vocabulary-lesson.mp3',
      path: 'data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAASAAAdhgAKCgoKCgoUFBQUFBQUHh4eHh4eHigolgoKCgoKChQUFBQUFBQeHh4eHh4eKCgoKCgoKDIyMjIyMjI8PDw8PDw8RkZGRkZGRlBQUFBQUFBaWlpaWlpaZGRkZGRkZG5ubm5ubm54eHh4eHh4goKCgoKCjIyMjIyMjJaWlpaWlqCgoKCgoKqqqqqqqqq0tLS0tLS0vr6+vr6+yMjIyMjI0tLS0tLS3Nzc3Nzc5ubm5ubm8PDw8PDw+vr6+vr6////AAAAAExhdmY1OC43Ni4xMDAAAAAAAAAAAAAAAAQgAAAAAAAAAAdhhmNu5wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQxDaDwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      mimeType: 'audio/mpeg',
      size: 1048576,
      identityId: 'mock-identity-id',
      owner: 'mock-user-sub',
      createdAt: new Date('2024-01-17T14:00:00Z').toISOString(),
      waveformData: JSON.stringify([0.1,0.3,0.5,0.7,0.9,1.0,0.9,0.7,0.5,0.3,0.1,0.2,0.4,0.6,0.8,0.95,0.8,0.6,0.4,0.2,0.15,0.35,0.55,0.75,0.85,0.95,0.85,0.75,0.55,0.35,0.2,0.4,0.5,0.7,0.8,0.9,0.8,0.7,0.5,0.4,0.1,0.25,0.45,0.65,0.8,0.9,0.8,0.65,0.45,0.25,0.2,0.3,0.5,0.6,0.75,0.85,0.75,0.6,0.5,0.3,0.15,0.3,0.4,0.55,0.7,0.8,0.7,0.55,0.4,0.3,0.1,0.2,0.35,0.5,0.65,0.75,0.65,0.5,0.35,0.2,0.1,0.25,0.4,0.55,0.7,0.8,0.7,0.55,0.4,0.25,0.15,0.3,0.45,0.6,0.75,0.85,0.75,0.6,0.45,0.3]),
      _version: 1,
    },
    {
      id: 'file-4',
      name: 'pronunciation-guide.mp3',
      path: 'data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAASAAAdhgAKCgoKCgoUFBQUFBQUHh4eHh4eHigolgoKCgoKChQUFBQUFBQeHh4eHh4eKCgoKCgoKDIyMjIyMjI8PDw8PDw8RkZGRkZGRlBQUFBQUFBaWlpaWlpaZGRkZGRkZG5ubm5ubm54eHh4eHh4goKCgoKCjIyMjIyMjJaWlpaWlqCgoKCgoKqqqqqqqqq0tLS0tLS0vr6+vr6+yMjIyMjI0tLS0tLS3Nzc3Nzc5ubm5ubm8PDw8PDw+vr6+vr6////AAAAAExhdmY1OC43Ni4xMDAAAAAAAAAAAAAAAAQgAAAAAAAAAAdhhmNu5wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQxDaDwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      mimeType: 'audio/mpeg',
      size: 892416,
      identityId: 'mock-identity-id',
      owner: 'mock-user-sub',
      createdAt: new Date('2024-01-18T09:15:00Z').toISOString(),
      waveformData: JSON.stringify([0.05,0.15,0.25,0.35,0.45,0.55,0.65,0.75,0.85,0.95,0.9,0.8,0.7,0.6,0.5,0.4,0.3,0.2,0.1,0.05,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,0.95,0.85,0.75,0.65,0.55,0.45,0.35,0.25,0.15,0.05,0.1,0.2,0.35,0.5,0.65,0.8,0.9,0.95,0.9,0.8,0.65,0.5,0.35,0.2,0.1,0.05,0.15,0.3,0.45,0.6,0.75,0.85,0.9,0.85,0.75,0.6,0.45,0.3,0.15,0.05,0.1,0.25,0.4,0.55,0.7,0.8,0.85,0.8,0.7,0.55,0.4,0.25,0.1,0.05,0.15,0.3,0.45,0.6,0.7,0.75,0.7,0.6,0.45,0.3,0.15,0.05,0.1,0.2,0.3,0.4]),
      _version: 1,
    },
    {
      id: 'file-5',
      name: 'textbook-chapter-1.pdf',
      path: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L0ZvbnQ8PC9GMSA1IDAgUj4+Pj4vTWVkaWFCb3hbMCAwIDYxMiA3OTJdL0NvbnRlbnRzIDQgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvTGVuZ3RoIDQ0Pj4Kc3RyZWFtCkJUCi9GMSA0OCBUZgoxMCA3MDAgVGQKKEhlbGxvIFdvcmxkKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAxL0tpZHNbMyAwIFJdPj4KZW5kb2JqCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDIgMCBSPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDI2NCAwMDAwMCBuIAowMDAwMDAwMjEzIDAwMDAwIG4gCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDEyNCAwMDAwMCBuIAowMDAwMDAwMjE2IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA2L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMzEzCiUlRU9G',
      mimeType: 'application/pdf',
      size: 2097152,
      identityId: 'mock-identity-id',
      owner: 'mock-user-sub',
      createdAt: new Date('2024-01-19T16:45:00Z').toISOString(),
      _version: 1,
    },
    {
      id: 'file-6',
      name: 'study-guide.pdf',
      path: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L0ZvbnQ8PC9GMSA1IDAgUj4+Pj4vTWVkaWFCb3hbMCAwIDYxMiA3OTJdL0NvbnRlbnRzIDQgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvTGVuZ3RoIDUwPj4Kc3RyZWFtCkJUCi9GMSA0OCBUZgoxMCA3MDAgVGQKKFN0dWR5IEd1aWRlKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAxL0tpZHNbMyAwIFJdPj4KZW5kb2JqCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDIgMCBSPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDI3MCAwMDAwMCBuIAowMDAwMDAwMjE5IDAwMDAwIG4gCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDEyNCAwMDAwMCBuIAowMDAwMDAwMjIyIDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA2L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMzE5CiUlRU9G',
      mimeType: 'application/pdf',
      size: 1572864,
      identityId: 'mock-identity-id',
      owner: 'mock-user-sub',
      createdAt: new Date('2024-01-20T13:20:00Z').toISOString(),
      _version: 1,
    },
    {
      id: 'file-7',
      name: 'kanji-chart.jpg',
      path: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCABAAEADAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/iiiigD/2Q==',
      mimeType: 'image/jpeg',
      size: 786432,
      identityId: 'mock-identity-id',
      owner: 'mock-user-sub',
      createdAt: new Date('2024-01-21T08:30:00Z').toISOString(),
      _version: 1,
    },
    {
      id: 'file-8',
      name: 'listening-exercise.mp3',
      path: 'data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAASAAAdhgAKCgoKCgoUFBQUFBQUHh4eHh4eHigolgoKCgoKChQUFBQUFBQeHh4eHh4eKCgoKCgoKDIyMjIyMjI8PDw8PDw8RkZGRkZGRlBQUFBQUFBaWlpaWlpaZGRkZGRkZG5ubm5ubm54eHh4eHh4goKCgoKCjIyMjIyMjJaWlpaWlqCgoKCgoKqqqqqqqqq0tLS0tLS0vr6+vr6+yMjIyMjI0tLS0tLS3Nzc3Nzc5ubm5ubm8PDw8PDw+vr6+vr6////AAAAAExhdmY1OC43Ni4xMDAAAAAAAAAAAAAAAAQgAAAAAAAAAAdhhmNu5wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQxDaDwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      mimeType: 'audio/mpeg',
      size: 1310720,
      identityId: 'mock-identity-id',
      owner: 'mock-user-sub',
      createdAt: new Date('2024-01-22T15:10:00Z').toISOString(),
      waveformData: JSON.stringify([0.2,0.4,0.6,0.8,0.95,0.9,0.75,0.6,0.4,0.2,0.1,0.3,0.5,0.7,0.85,0.95,0.85,0.7,0.5,0.3,0.15,0.35,0.55,0.75,0.9,1.0,0.9,0.75,0.55,0.35,0.25,0.45,0.65,0.8,0.9,0.95,0.9,0.8,0.65,0.45,0.2,0.35,0.5,0.65,0.8,0.9,0.8,0.65,0.5,0.35,0.15,0.3,0.45,0.6,0.75,0.85,0.75,0.6,0.45,0.3,0.1,0.25,0.4,0.55,0.7,0.8,0.7,0.55,0.4,0.25,0.15,0.3,0.45,0.6,0.7,0.75,0.7,0.6,0.45,0.3,0.1,0.2,0.35,0.5,0.65,0.75,0.65,0.5,0.35,0.2,0.05,0.15,0.3,0.45,0.6,0.7,0.6,0.45,0.3,0.15]),
      _version: 1,
    },
  ]);
};

// Mock SortDirection enum
export const SortDirection = {
  ASCENDING: 'ASCENDING',
  DESCENDING: 'DESCENDING'
};

/**
 * Mock initSchema function that creates model classes matching Amplify DataStore structure
 * This is called by src/models/index.js: const { Unit, Grade, ... } = initSchema(schema);
 */
export const initSchema = (schema) => {
  console.log('[Mock initSchema] Called with schema');
  console.log('[Mock initSchema] Schema has models:', schema?.models ? Object.keys(schema.models).join(', ') : 'none');
  
  // Helper to create a model class with the proper structure
  const createModelClass = (modelName) => {
    class Model {
      constructor(init) {
        Object.assign(this, init);
      }
      
      static copyOf(source, mutator) {
        const draft = { ...source };
        const result = mutator(draft);
        return result !== undefined ? result : draft;
      }
    }
    
    // Set the name property to match the model name
    Object.defineProperty(Model, 'name', {
      value: modelName,
      writable: false,
      configurable: true
    });
    
    return Model;
  };
  
  // Create model classes for all models in the schema
  const models = {};
  
  if (schema && schema.models) {
    Object.keys(schema.models).forEach(modelName => {
      models[modelName] = createModelClass(modelName);
    });
    console.log('[Mock initSchema] Created', Object.keys(models).length, 'model classes');
  } else {
    console.warn('[Mock initSchema] No schema.models found, creating fallback models');
    // Fallback: create common models if schema parsing fails
    const modelNames = ['Unit', 'Grade', 'Word', 'Question', 'File', 'Section', 'Assignment', 'Assistant', 'ChatHistory', 'UnitWord', 'UnitFile', 'QuestionUnit', 'QuestionWord', 'QuestionFile', 'WordFile', 'StudentInfo', 'Choice'];
    modelNames.forEach(modelName => {
      models[modelName] = createModelClass(modelName);
    });
    console.log('[Mock initSchema] Created', modelNames.length, 'fallback model classes');
  }
  
  return models;
};

// Mock data storage for other models (Word, etc.)
const mockData = {
  Word: {
    '1': { id: '1', phrase: 'Hello', pronunciation: 'heh-LOH', definition: 'A greeting' },
    '2': { id: '2', phrase: 'Goodbye', pronunciation: 'good-BYE', definition: 'A farewell' },
    '3': { id: '3', phrase: 'Thank you', pronunciation: 'thank-YOO', definition: 'Expression of gratitude' },
    '4': { id: '4', phrase: 'Please', pronunciation: 'PLEEZ', definition: 'Polite request' },
    'vocab-word-1': { id: 'vocab-word-1', phrase: 'こんにちは', pronunciation: 'kon-ni-chi-wa', definition: 'Hello (Japanese)' },
    'vocab-word-2': { id: 'vocab-word-2', phrase: '猫', pronunciation: 'neko', definition: 'Cat (Japanese)' },
    'vocab-word-3': { id: 'vocab-word-3', phrase: 'ありがとう', pronunciation: 'a-ri-ga-tou', definition: 'Thank you (Japanese)' },
    'vocab-word-4': { id: 'vocab-word-4', phrase: '犬', pronunciation: 'inu', definition: 'Dog (Japanese)' },
    'vocab-word-5': { id: 'vocab-word-5', phrase: 'さようなら', pronunciation: 'sa-you-na-ra', definition: 'Goodbye (Japanese)' },
  },
  Question: {
    'question-1': { 
      id: 'question-1', 
      prompt: 'Translate "犬" to English',
      phrase: '犬',
      pronunciation: 'inu',
      definition: 'Dog (Japanese)',
      answer: 'Dog' 
    },
    'question-2': { 
      id: 'question-2', 
      prompt: 'What is a "さようなら"?',
      phrase: 'さようなら',
      pronunciation: 'sa-you-na-ra',
      definition: 'Goodbye (Japanese)',
      answer: 'A farewell greeting meaning goodbye' 
    },
  },
  Unit: {},
  Grade: {},
  Section: {},
  File: {},
};

export class DataStore {
  static async save(model) {
    console.log('Mock DataStore.save called with:', model);
    console.log('[Mock DataStore] model.data:', model.data);
    console.log('[Mock DataStore] model.data type:', typeof model.data);
    console.log('[Mock DataStore] model.data keys:', model.data ? Object.keys(model.data) : 'no data');
    
    // If model doesn't have an ID, generate one
    if (!model.id) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      model.id = `mock-${timestamp}-${random}`;
      console.log('[Mock DataStore] Generated ID:', model.id);
    }
    
    // Detect model type by checking properties
    const isGrade = model.unitID && model.data !== undefined;
    const isSettings = model.autoAnalyzePDFs !== undefined;
    const isUnit = model.name && model.data !== undefined && !model.unitID;
    const isFile = model.path && model.mimeType;
    const isDocument = model.filename && model.s3Key && model.status;
    const isParsedContent = model.documentID && model.vocabularyJSON !== undefined;
    const isWord = model.phrase && model.definition;
    const isSection = model.name && !model.unitID && !model.data;
    
    // Update the mock data based on model type
    if (isSection) {
      // This is a Section
      mockSections[model.id] = model;
      console.log('[Mock DataStore] Saved Section:', model.id, model.name);
      
      // Notify all Section subscribers
      activeSubscriptions.Section.forEach(callback => {
        callback({ items: Object.values(mockSections), isSynced: true });
      });
    } else if (isParsedContent) {
      // This is a ParsedContent
      mockParsedContent[model.id] = model;
      console.log('[Mock DataStore] Saved ParsedContent:', model.id, 'for document:', model.documentID);
      
      // Notify all ParsedContent subscribers
      activeSubscriptions.ParsedContent.forEach(callback => {
        callback({ items: Object.values(mockParsedContent), isSynced: true });
      });
    } else if (isWord) {
      // This is a Word
      mockWords[model.id] = model;
      console.log('[Mock DataStore] Saved Word:', model.id, model.phrase);
      
      // Notify all Word subscribers
      activeSubscriptions.Word.forEach(callback => {
        callback({ items: Object.values(mockWords), isSynced: true });
      });
    } else if (isDocument) {
      // This is a Document
      mockDocuments[model.id] = model;
      console.log('[Mock DataStore] Saved Document:', model.id, model.filename);
      console.log('[Mock DataStore] Document will be returned with ID:', model.id);
      
      // Notify all Document subscribers
      activeSubscriptions.Document.forEach(callback => {
        callback({ items: Object.values(mockDocuments), isSynced: true });
      });
    } else if (isFile) {
      // This is a File
      mockFiles[model.id] = model;
      console.log('[Mock DataStore] Saved File:', model.id, model.name);
      
      // Notify all File subscribers
      activeSubscriptions.File.forEach(callback => {
        callback({ items: Object.values(mockFiles), isSynced: true });
      });
    } else if (isGrade) {
      // This is a Grade
      mockGrades[model.id] = model;
      console.log('[Mock DataStore] Updated grade:', model.id);
      console.log('[Mock DataStore] mockGrades[model.id].data:', mockGrades[model.id].data);
      
      // Notify all Grade subscribers
      activeSubscriptions.Grade.forEach(callback => {
        callback({ items: Object.values(mockGrades), isSynced: true });
      });
    } else if (isSettings) {
      // This is Settings
      mockSettings[model.id] = model;
      console.log('[Mock DataStore] Updated settings:', model.id);
      
      // Notify all Settings subscribers
      activeSubscriptions.Settings.forEach(callback => {
        callback({ items: Object.values(mockSettings), isSynced: true });
      });
    } else if (isUnit) {
      // This is a Unit
      mockUnits[model.id] = model;
      console.log('[Mock DataStore] Updated unit:', model.id);
      
      // Notify all Unit subscribers  
      activeSubscriptions.Unit.forEach(callback => {
        callback({ items: Object.values(mockUnits), isSynced: true });
      });
    }
    
    return model;
  }

  static async query(modelConstructor, idOrPredicate) {
    const modelName = modelConstructor?.name;
    console.log('Mock DataStore.query called for:', modelName, 'with predicate:', typeof idOrPredicate);
    
    // If idOrPredicate is a string, treat it as an ID lookup
    if (typeof idOrPredicate === 'string') {
      // Check custom model storage first
      if (modelName === 'Document' && mockDocuments[idOrPredicate]) {
        return mockDocuments[idOrPredicate];
      }
      if (modelName === 'ParsedContent' && mockParsedContent[idOrPredicate]) {
        return mockParsedContent[idOrPredicate];
      }
      if (modelName === 'Word' && mockWords[idOrPredicate]) {
        return mockWords[idOrPredicate];
      }
      if (modelName === 'Section' && mockSections[idOrPredicate]) {
        return mockSections[idOrPredicate];
      }
      if (modelName === 'Unit' && mockUnits[idOrPredicate]) {
        return mockUnits[idOrPredicate];
      }
      if (modelName === 'Grade' && mockGrades[idOrPredicate]) {
        return mockGrades[idOrPredicate];
      }
      
      // Fall back to mockData
      const data = mockData[modelName];
      if (data && data[idOrPredicate]) {
        console.log('Mock DataStore returning:', data[idOrPredicate]);
        return data[idOrPredicate];
      }
      console.log('Mock DataStore: No data found for id:', idOrPredicate);
      return null;
    }
    
    // Handle predicate function for ParsedContent queries
    if (modelName === 'ParsedContent' && typeof idOrPredicate === 'function') {
      let documentIDFilter = null;
      const predicateCapture = {
        documentID: {
          eq: (value) => {
            documentIDFilter = value;
            console.log('[Mock DataStore] Filtering ParsedContent by documentID.eq:', value);
            return predicateCapture;
          }
        }
      };
      
      try {
        idOrPredicate(predicateCapture);
      } catch (e) {
        console.log('[Mock DataStore] Could not parse predicate:', e.message);
      }
      
      let results = Object.values(mockParsedContent);
      if (documentIDFilter) {
        results = results.filter(pc => pc.documentID === documentIDFilter);
      }
      console.log('[Mock DataStore] Returning', results.length, 'parsed content records');
      return results;
    }
    
    // Handle predicate function for Document queries
    if (modelName === 'Document' && typeof idOrPredicate === 'function') {
      // Extract filter criteria from predicate
      let s3KeyFilter = null;
      const predicateCapture = {
        s3Key: {
          eq: (value) => {
            s3KeyFilter = value;
            console.log('[Mock DataStore] Filtering Document by s3Key.eq:', value);
            return predicateCapture;
          }
        }
      };
      
      try {
        idOrPredicate(predicateCapture);
      } catch (e) {
        console.log('[Mock DataStore] Could not parse predicate:', e.message);
      }
      
      // Filter documents by s3Key if specified
      let results = Object.values(mockDocuments);
      if (s3KeyFilter) {
        results = results.filter(doc => doc.s3Key === s3KeyFilter);
      }
      console.log('[Mock DataStore] Returning', results.length, 'documents');
      return results;
    }
    
    // Otherwise return all items for that model
    if (modelName === 'Document') {
      return Object.values(mockDocuments);
    }
    if (modelName === 'ParsedContent') {
      return Object.values(mockParsedContent);
    }
    if (modelName === 'Word') {
      return Object.values(mockWords);
    }
    if (modelName === 'Section') {
      return Object.values(mockSections);
    }
    
    const data = mockData[modelName];
    if (data) {
      return Object.values(data);
    }
    
    // Return empty array for unknown models
    return [];
  }

  static async delete(modelConstructor, id) {
    console.log('Mock DataStore.delete called for:', modelConstructor?.name, id);
    return {};
  }

  static async start() {
    console.log('Mock DataStore.start called');
    return Promise.resolve();
  }
        
  static async stop() {
    console.log('Mock DataStore.stop called');
    return Promise.resolve();
  }

  static async clear() {
    console.log('Mock DataStore.clear called');
    return Promise.resolve();
  }

  static observe(modelConstructor, predicate) {
    console.log('Mock DataStore.observe called for:', modelConstructor?.name);
    return {
      subscribe: (callback) => {
        console.log('Mock DataStore subscription created');
        return {
          unsubscribe: () => {
            console.log('Mock DataStore subscription unsubscribed');
          }
        };
      }
    };
  }

  static observeQuery(modelConstructor, predicate, options) {
    const modelName = modelConstructor?.name;
    console.log('Mock DataStore.observeQuery called for:', modelName);
    
    // Extract filter criteria from predicate if available
    let filterFn = null;
    if (predicate && typeof predicate === 'function') {
      // Create a mock predicate builder to capture filter criteria
      const predicateCapture = {
        id: {
          eq: (value) => {
            filterFn = (item) => item.id === value;
            console.log('[Mock DataStore] Filter by id.eq:', value);
            return predicateCapture;
          }
        },
        unitID: {
          eq: (value) => {
            filterFn = (item) => item.unitID === value;
            console.log('[Mock DataStore] Filter by unitID.eq:', value);
            return predicateCapture;
          }
        },
        documentID: {
          eq: (value) => {
            filterFn = (item) => item.documentID === value;
            console.log('[Mock DataStore] Filter by documentID.eq:', value);
            return predicateCapture;
          }
        },
        owner: {
          eq: (value) => {
            const currentFilter = filterFn;
            filterFn = (item) => {
              const ownerMatch = item.owner === value;
              return currentFilter ? currentFilter(item) && ownerMatch : ownerMatch;
            };
            console.log('[Mock DataStore] Filter by owner.eq:', value);
            return predicateCapture;
          }
        },
        unitVersion: {
          eq: (value) => {
            const currentFilter = filterFn;
            filterFn = (item) => {
              const versionMatch = item.unitVersion === value;
              return currentFilter ? currentFilter(item) && versionMatch : versionMatch;
            };
            console.log('[Mock DataStore] Filter by unitVersion.eq:', value);
            return predicateCapture;
          }
        },
        complete: {
          eq: (value) => {
            const currentFilter = filterFn;
            filterFn = (item) => {
              const completeMatch = item.complete === value;
              return currentFilter ? currentFilter(item) && completeMatch : completeMatch;
            };
            console.log('[Mock DataStore] Filter by complete.eq:', value);
            return predicateCapture;
          }
        },
        and: (fn) => {
          if (typeof fn === 'function') {
            fn(predicateCapture);
          }
          return predicateCapture;
        }
      };
      
      try {
        predicate(predicateCapture);
      } catch (e) {
        console.log('[Mock DataStore] Could not parse predicate:', e.message);
      }
    }
    
    return {
      subscribe: (callback) => {
        console.log('Mock DataStore.observeQuery subscription created for:', modelName);
        
        // Merge seeded data with mock data
        let items = [];
        if (modelName === 'Unit') {
          items = Object.values(mockUnits);
          if (filterFn) {
            items = items.filter(filterFn);
          }
          console.log('[Mock DataStore] Returning', items.length, 'units (filtered)');
          // Store the callback for future updates
          activeSubscriptions.Unit.push(callback);
        } else if (modelName === 'Grade') {
          items = Object.values(mockGrades);
          if (filterFn) {
            items = items.filter(filterFn);
          }
          console.log('[Mock DataStore] Returning', items.length, 'grades (filtered)');
          activeSubscriptions.Grade.push(callback);
        } else if (modelName === 'File') {
          items = Object.values(mockFiles);
          if (filterFn) {
            items = items.filter(filterFn);
          }
          console.log('[Mock DataStore] Returning', items.length, 'files (filtered)');
          activeSubscriptions.File.push(callback);
        } else if (modelName === 'Settings') {
          items = Object.values(mockSettings);
          if (filterFn) {
            items = items.filter(filterFn);
          }
          console.log('[Mock DataStore] Returning', items.length, 'settings (filtered)');
          activeSubscriptions.Settings.push(callback);
        } else if (modelName === 'Document') {
          items = Object.values(mockDocuments);
          if (filterFn) {
            items = items.filter(filterFn);
          }
          console.log('[Mock DataStore] Returning', items.length, 'documents (filtered)');
          activeSubscriptions.Document.push(callback);
        } else if (modelName === 'ParsedContent') {
          items = Object.values(mockParsedContent);
          if (filterFn) {
            items = items.filter(filterFn);
          }
          console.log('[Mock DataStore] Returning', items.length, 'parsed content records (filtered)');
          activeSubscriptions.ParsedContent.push(callback);
        } else if (modelName === 'Word') {
          items = Object.values(mockWords);
          if (filterFn) {
            items = items.filter(filterFn);
          }
          console.log('[Mock DataStore] Returning', items.length, 'words (filtered)');
          activeSubscriptions.Word.push(callback);
        } else if (modelName === 'Question') {
          items = Object.values(mockQuestions);
          if (filterFn) {
            items = items.filter(filterFn);
          }
          console.log('[Mock DataStore] Returning', items.length, 'questions (filtered)');
          activeSubscriptions.Question.push(callback);
        } else if (modelName === 'Section') {
          items = Object.values(mockSections);
          if (filterFn) {
            items = items.filter(filterFn);
          }
          console.log('[Mock DataStore] Returning', items.length, 'sections (filtered)');
          activeSubscriptions.Section.push(callback);
        } else {
          const data = mockData[modelName];
          items = data ? Object.values(data) : [];
          if (filterFn) {
            items = items.filter(filterFn);
          }
        }
        
        // Call immediately with current data
        callback({ items, isSynced: true });
        
        return {
          unsubscribe: () => {
            console.log('Mock DataStore.observeQuery subscription unsubscribed for:', modelName);
            // Remove the callback from active subscriptions
            if (modelName === 'Unit') {
              const index = activeSubscriptions.Unit.indexOf(callback);
              if (index > -1) {
                activeSubscriptions.Unit.splice(index, 1);
              }
            } else if (modelName === 'Grade') {
              const index = activeSubscriptions.Grade.indexOf(callback);
              if (index > -1) {
                activeSubscriptions.Grade.splice(index, 1);
              }
            } else if (modelName === 'File') {
              const index = activeSubscriptions.File.indexOf(callback);
              if (index > -1) {
                activeSubscriptions.File.splice(index, 1);
              }
            } else if (modelName === 'Settings') {
              const index = activeSubscriptions.Settings.indexOf(callback);
              if (index > -1) {
                activeSubscriptions.Settings.splice(index, 1);
              }
            } else if (modelName === 'Document') {
              const index = activeSubscriptions.Document.indexOf(callback);
              if (index > -1) {
                activeSubscriptions.Document.splice(index, 1);
              }
            } else if (modelName === 'ParsedContent') {
              const index = activeSubscriptions.ParsedContent.indexOf(callback);
              if (index > -1) {
                activeSubscriptions.ParsedContent.splice(index, 1);
              }
            } else if (modelName === 'Word') {
              const index = activeSubscriptions.Word.indexOf(callback);
              if (index > -1) {
                activeSubscriptions.Word.splice(index, 1);
              }
            } else if (modelName === 'Question') {
              const index = activeSubscriptions.Question.indexOf(callback);
              if (index > -1) {
                activeSubscriptions.Question.splice(index, 1);
              }
            } else if (modelName === 'Section') {
              const index = activeSubscriptions.Section.indexOf(callback);
              if (index > -1) {
                activeSubscriptions.Section.splice(index, 1);
              }
            }
          }
        };
      }
    };
  }
}
