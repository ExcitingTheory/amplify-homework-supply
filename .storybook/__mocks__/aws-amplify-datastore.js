/**
 * Mock aws-amplify/datastore for Storybook
 * 
 * This mock provides DataStore functionality for Storybook stories.
 * The actual model classes are imported from src/models - we only mock
 * the DataStore class and its methods.
 */

import { MOCK_AUDIO_BASE64, mockWaveformData } from './media.js';
import { allChatData } from './chatDataLoader.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const chatBot20 = JSON.parse(readFileSync(join(__dirname, './ui-data/chat-bot-2.0.json'), 'utf-8'));


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
const mockAssignments = {};
const mockAssistantChats = {};

// Export storage for seed data
export { mockUnits, mockGrades, mockFiles, mockSettings, mockDocuments, mockParsedContent, mockWords, mockQuestions, mockSections, mockAssignments, mockAssistantChats };

// Store active subscriptions
const activeSubscriptions = {
  Unit: [],
  Grade: [],
  File: [],
  Settings: [],
  AssistantChat: [],
  Document: [],
  ParsedContent: [],
  Word: [],
  Question: [],
  Section: [],
  Assignment: [],
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
          // Return word relationships that match the wordIDs
          return wordIDs.map(id => {
            const word = mockWords[id];
            return word ? { word: Promise.resolve(word) } : null;
          }).filter(Boolean);
        },
      },
      files: {
        toArray: async () => [],
      },
      questions: {
        toArray: async () => {
          // Return question relationships that match the questionIDs
          return questionIDs.map(id => {
            const question = mockQuestions[id];
            return question ? { question: Promise.resolve(question) } : null;
          }).filter(Boolean);
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
      
      // Create Document record for supported document types
      const documentTypes = [
        'application/pdf',
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (documentTypes.includes(file.mimeType)) {
        const docId = `doc-${file.id}`;
        mockDocuments[docId] = {
          id: docId,
          filename: file.name,
          s3Key: file.path,
          status: 'uploaded',
          identityId: file.identityId,
          createdAt: file.createdAt,
          updatedAt: file.createdAt,
          _version: 1,
          _lastChangedAt: Date.now(),
          _deleted: false,
        };
        console.log('[Mock DataStore] Created Document record for', file.mimeType, ':', docId);
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

// Helper to seed mock document data for stories
export const seedMockDocuments = (documentsArray) => {
  console.log('[Mock DataStore] Seeding documents:', documentsArray.length);
  documentsArray.forEach(doc => {
    if (doc.id) {
      mockDocuments[doc.id] = doc;
    }
  });
  console.log('[Mock DataStore] Total documents in store:', Object.keys(mockDocuments).length);
  
  // Notify all Document subscribers
  const items = Object.values(mockDocuments);
  activeSubscriptions.Document.forEach(callback => {
    console.log('[Mock DataStore] Notifying Document subscriber with', items.length, 'documents');
    callback({ items, isSynced: true });
  });
};

// Helper to seed mock parsed content data for stories
export const seedMockParsedContent = (parsedContentArray) => {
  console.log('[Mock DataStore] Seeding parsed content:', parsedContentArray.length);
  parsedContentArray.forEach(content => {
    if (content.id) {
      mockParsedContent[content.id] = content;
    }
  });
  console.log('[Mock DataStore] Total parsed content in store:', Object.keys(mockParsedContent).length);
  
  // Notify all ParsedContent subscribers
  const items = Object.values(mockParsedContent);
  activeSubscriptions.ParsedContent.forEach(callback => {
    console.log('[Mock DataStore] Notifying ParsedContent subscriber with', items.length, 'items');
    callback({ items, isSynced: true });
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

// Helper to seed mock questions data for stories
export const seedMockQuestions = (questionsArray) => {
  console.log('[Mock DataStore] Seeding questions:', questionsArray.length);
  questionsArray.forEach(question => {
    if (question.id) {
      mockQuestions[question.id] = {
        ...question,
        _version: question._version || 1,
        createdAt: question.createdAt || new Date().toISOString(),
        updatedAt: question.updatedAt || new Date().toISOString(),
      };
    }
  });
};

// Helper to seed mock question-unit relationships
export const seedMockQuestionUnits = (relationshipsArray) => {
  console.log('[Mock DataStore] Seeding question-unit relationships:', relationshipsArray.length);
  relationshipsArray.forEach(rel => {
    // Store the relationship for mock querying
    const key = `${rel.questionId}-${rel.unitId}`;
    // This would be handled by the actual relationship logic in queries
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

// Helper to seed mock assignments data for stories
export const seedMockAssignments = (assignmentsArray) => {
  console.log('[Mock DataStore] Seeding assignments:', assignmentsArray.length);
  assignmentsArray.forEach(assignment => {
    if (assignment.id) {
      mockAssignments[assignment.id] = assignment;
    }
  });
  console.log('[Mock DataStore] Total assignments in store:', Object.keys(mockAssignments).length);
  
  // Notify all Assignment subscribers about the new data
  const items = Object.values(mockAssignments);
  activeSubscriptions.Assignment.forEach(callback => {
    console.log('[Mock DataStore] Notifying Assignment subscriber with', items.length, 'assignments');
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


// Helper to seed mock assistant chats data for stories
export const seedMockAssistantChats = (chatsArray) => {
  console.log('[Mock DataStore] Seeding assistant chats:', chatsArray.length);
  console.log('[Mock DataStore] Chat data sample:', chatsArray);
  
  // Clear existing chats first
  Object.keys(mockAssistantChats).forEach(key => delete mockAssistantChats[key]);
  
  // Store each chat in the mockAssistantChats object so it persists in the mock store
  chatsArray.forEach(chat => {
    mockAssistantChats[chat.id] = chat;
  });
  
  console.log('[Mock DataStore] Total assistant chats in store after seeding:', Object.keys(mockAssistantChats).length);
  
  // Notify all AssistantChat subscribers about the new data
  activeSubscriptions.AssistantChat.forEach(callback => {
    console.log('[Mock DataStore] Notifying AssistantChat subscriber with', chatsArray.length, 'chats');
    callback({ items: Object.values(mockAssistantChats), isSynced: true });
  });
};

// Helper to clear mock data between stories
export const clearMockData = () => {
  Object.keys(mockUnits).forEach(key => delete mockUnits[key]);
  Object.keys(mockGrades).forEach(key => delete mockGrades[key]);
  Object.keys(mockFiles).forEach(key => delete mockFiles[key]);
  Object.keys(mockSettings).forEach(key => delete mockSettings[key]);
  Object.keys(mockDocuments).forEach(key => delete mockDocuments[key]);
  Object.keys(mockParsedContent).forEach(key => delete mockParsedContent[key]);
  Object.keys(mockWords).forEach(key => delete mockWords[key]);
  Object.keys(mockQuestions).forEach(key => delete mockQuestions[key]);
  Object.keys(mockSections).forEach(key => delete mockSections[key]);
  Object.keys(mockAssignments).forEach(key => delete mockAssignments[key]);
  Object.keys(mockAssistantChats).forEach(key => delete mockAssistantChats[key]);
  console.log('[Mock DataStore] Cleared all mock data');
};

// Seed default mock data for Storybook storiesq
export const initializeMockData = () => {
  
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
      audio: [MOCK_AUDIO_BASE64],
      waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      definitionAudio: [MOCK_AUDIO_BASE64],
      definitionWaveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      partOfSpeech: 'greeting',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'word-2',
      phrase: '猫',
      pronunciation: 'neko',
      definition: 'Cat (Japanese)',
      audio: [MOCK_AUDIO_BASE64],
      waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      definitionAudio: [MOCK_AUDIO_BASE64],
      definitionWaveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      partOfSpeech: 'noun',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'word-3',
      phrase: 'ありがとう',
      pronunciation: 'a-ri-ga-tou',
      definition: 'Thank you (Japanese)',
      audio: [MOCK_AUDIO_BASE64],
      waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      definitionAudio: [MOCK_AUDIO_BASE64],
      definitionWaveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      partOfSpeech: 'expression',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'word-4',
      phrase: '犬',
      pronunciation: 'inu',
      definition: 'Dog (Japanese)',
      audio: [MOCK_AUDIO_BASE64],
      waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      definitionAudio: [MOCK_AUDIO_BASE64],
      definitionWaveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'word-5',
      phrase: 'さようなら',
      pronunciation: 'sa-you-na-ra',
      definition: 'Goodbye (Japanese)',
      audio: [MOCK_AUDIO_BASE64],
      waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      definitionAudio: [MOCK_AUDIO_BASE64],
      definitionWaveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'word-6',
      phrase: '本',
      pronunciation: 'hon',
      definition: 'Book (Japanese)',
      audio: [MOCK_AUDIO_BASE64],
      waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      definitionAudio: [MOCK_AUDIO_BASE64],
      definitionWaveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'word-7',
      phrase: '水',
      pronunciation: 'mizu',
      definition: 'Water (Japanese)',
      audio: [MOCK_AUDIO_BASE64],
      waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      definitionAudio: [MOCK_AUDIO_BASE64],
      definitionWaveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'word-8',
      phrase: '学校',
      pronunciation: 'gak-kou',
      definition: 'School (Japanese)',
      audio: [MOCK_AUDIO_BASE64],
      waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      definitionAudio: [MOCK_AUDIO_BASE64],
      definitionWaveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      owner: 'mock-user-sub',
      _version: 1,
    },
    // Vocab words for audio/drawing exercises
    {
      id: 'vocab-word-1',
      phrase: 'こんにちは',
      pronunciation: 'kon-ni-chi-wa',
      definition: 'Hello (Japanese)',
      audio: [MOCK_AUDIO_BASE64],
      waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      definitionAudio: [MOCK_AUDIO_BASE64],
      definitionWaveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      partOfSpeech: 'greeting',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'vocab-word-2',
      phrase: '猫',
      pronunciation: 'neko',
      definition: 'Cat (Japanese)',
      audio: [MOCK_AUDIO_BASE64],
      waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      definitionAudio: [MOCK_AUDIO_BASE64],
      definitionWaveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      partOfSpeech: 'noun',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'vocab-word-3',
      phrase: 'ありがとう',
      pronunciation: 'a-ri-ga-tou',
      definition: 'Thank you (Japanese)',
      audio: [MOCK_AUDIO_BASE64],
      waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      definitionAudio: [MOCK_AUDIO_BASE64],
      definitionWaveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      partOfSpeech: 'expression',
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'vocab-word-4',
      phrase: '犬',
      pronunciation: 'inu',
      definition: 'Dog (Japanese)',
      audio: [MOCK_AUDIO_BASE64],
      waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      definitionAudio: [MOCK_AUDIO_BASE64],
      definitionWaveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      owner: 'mock-user-sub',
      _version: 1,
    },
    {
      id: 'vocab-word-5',
      phrase: 'さようなら',
      pronunciation: 'sa-you-na-ra',
      definition: 'Goodbye (Japanese)',
      audio: [MOCK_AUDIO_BASE64],
      waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      definitionAudio: [MOCK_AUDIO_BASE64],
      definitionWaveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
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
      path: MOCK_AUDIO_BASE64,
      mimeType: 'audio/mpeg',
      size: 1048576,
      identityId: 'mock-identity-id',
      owner: 'mock-user-sub',
      createdAt: new Date('2024-01-17T14:00:00Z').toISOString(),
       waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      _version: 1,
    },
    {
      id: 'file-4',
      name: 'pronunciation-guide.mp3',
      path: MOCK_AUDIO_BASE64,
      mimeType: 'audio/mpeg',
      size: 892416,
      identityId: 'mock-identity-id',
      owner: 'mock-user-sub',
      createdAt: new Date('2024-01-18T09:15:00Z').toISOString(),
       waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
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
      path: MOCK_AUDIO_BASE64,
      mimeType: 'audio/mpeg',
      size: 1310720,
      identityId: 'mock-identity-id',
      owner: 'mock-user-sub',
      createdAt: new Date('2024-01-22T15:10:00Z').toISOString(),
       waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
      _version: 1,
    },
    {
      id: 'file-9',
      name: 'vocabulary-list.txt',
      path: 'data:text/plain;base64,Vm9jYWJ1bGFyeSBMaXN0IC0gSmFwYW5lc2UgQmFzaWNzCgpXb3JkOiDjgZPjgpPjgavjgaHjga8KUHJvbnVuY2lhdGlvbjoga29ubmljaGl3YQpEZWZpbml0aW9uOiBIZWxsbywgZ29vZCBhZnRlcm5vb24KCldvcmQ6IOOBguOCiuOBjOOBqOOBhgpQcm9udW5jaWF0aW9uOiBhcmlnYXRvdQpEZWZpbml0aW9uOiBUaGFuayB5b3UKCldvcmQ6IOOBleOCiOOBhuOBquOCiQpQcm9udW5jaWF0aW9uOiBzYXlvdW5hcmEKRGVmaW5pdGlvbjogR29vZGJ5ZQoKV29yZDog54yrClByb251bmNpYXRpb246IG5la28KRGVmaW5pdGlvbjogQ2F0CgpXb3JkOiDniKsKUHJvbnVuY2lhdGlvbjogaW51CkRlZmluaXRpb246IERvZwoKV29yZDog5pysClByb251bmNpYXRpb246IGhvbgpEZWZpbml0aW9uOiBCb29rCgpXb3JkOiDmsLQKUHJvbnVuY2lhdGlvbjogbWl6dQpEZWZpbml0aW9uOiBXYXRlcgoKV29yZDog5a2m5qChClByb251bmNpYXRpb246IGdha2tvdQpEZWZpbml0aW9uOiBTY2hvb2w=',
      mimeType: 'text/plain',
      size: 542,
      identityId: 'mock-identity-id',
      owner: 'mock-user-sub',
      createdAt: new Date('2024-01-23T10:00:00Z').toISOString(),
      _version: 1,
    },
    {
      id: 'file-10',
      name: 'student-grades.csv',
      path: 'data:text/csv;base64,U3R1ZGVudCBOYW1lLFVuaXQsU2NvcmUsRGF0ZSxOb3RlcwpKb2huIFNtaXRoLEphcGFuZXNlIDEwMSw5NSwyMDI0LTAxLTE1LEV4Y2VsbGVudCBwcm9udW5jaWF0aW9uCkVtaWx5IEpvaG5zb24sSmFwYW5lc2UgMTAxLDg4LDIwMjQtMDEtMTUsR29vZCBlZmZvcnQKTWljaGFlbCBCcm93bixKYXBhbmVzZSAxMDEsOTIsMjAyNC0wMS0xNSxTdHJvbmcgdm9jYWJ1bGFyeQpTYXJhaCBEYXZpcyxKYXBhbmVzZSAxMDEsNzgsMjAyNC0wMS0xNSxOZWVkcyBtb3JlIHByYWN0aWNlCkRhdmlkIFdpbHNvbixKYXBhbmVzZSAxMDEsOTAsMjAyNC0wMS0xNSxXZWxsIGRvbmUKTGlzYSBNYXJ0aW5leixKYXBhbmVzZSAxMDEsODUsMjAyNC0wMS0xNSxJbXByb3ZpbmcKSmFtZXMgQW5kZXJzb24sSmFwYW5lc2UgMTAxLDk3LDIwMjQtMDEtMTUsT3V0c3RhbmRpbmcKTWFyeSBUaG9tYXMsSmFwYW5lc2UgMTAxLDgzLDIwMjQtMDEtMTUsR29vZCBwcm9ncmVzcwpSb2JlcnQgSmFja3NvbixKYXBhbmVzZSAxMDEsOTEsMjAyNC0wMS0xNSxDb25zaXN0ZW50IHdvcmsKSmVubmlmZXIgV2hpdGUsSmFwYW5lc2UgMTAxLDg2LDIwMjQtMDEtMTUsV2VsbCBwcmVwYXJlZA==',
      mimeType: 'text/csv',
      size: 648,
      identityId: 'mock-identity-id',
      owner: 'mock-user-sub',
      createdAt: new Date('2024-01-24T14:30:00Z').toISOString(),
      _version: 1,
    },
    {
      id: 'file-11',
      name: 'lesson-notes.docx',
      path: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQAAAAIAAAAAAAAAAAAAAAAAAAAAAAKAAAAZG9jUHJvcHMvYXBwLnhtbE2OywrCMBBF9/mKkL0k1Y2I1I0iuBBE0H/IZFqDSSYkEfHvTbsQXN7LuZxZrLu+gx4eSimeMogwBiCUNpayJoOv4+58AuAj0YpapiSDN3pYL+bnWaKdJq9Om05H4hQ8B9/FiSTl7DW5YKnVxCnvKGF7ROE9h7YPIWDShzb8g2M4EKiVN5FCx5Tah0RJUhLr/8NfVtZ/AAAAUEsDBBQAAAAIAAAAAAAAAAAAAAAAAAAAAAAADwAAAGRvY1Byb3BzL2NvcmUueG1sbY/LCsIwEEX3+YqQvSStCxGpGxFcCCLoPzTTtgaTTEgi4t+bdqG4vJdzOdN1ysxXPXTGG6qUYBADBVZ4a2SdwdfxefEAIHqiK2q9opw7dLBa3Gy2qXLaGfYWAkqXXCgghRBoZVFPoDMUBY+eQwghwL0LEXyfVy5Y5vSGvIqkJNb/hw+lrP8AAABQSwMEFAAAAAgAAAAAAAAAAAAAAAAAAAAAAAoAAABfcmVscy8ucmVsc62SwQqDMBBE74X+Q8i9Jq0HEVN7K6W3UsR/iLubYjZhN6L9+0YQemnxOMwwb2ZJ5yuF1bIRbxH6RAjCgPV0rNTHMb5dEokqWQoBkRtYyQuTpaTkGJd4HjEEA6aEE6EEn0BECKHTMJqqFiMT9e3KQz3r2dBsEUqFkAF9pzGzIGKiO0VxBwpFg7YPpxL2q2LTvLr3xUj6jT8zf1NJg2qqyPXqPPK3D39QSwMEFAAAAAgAAAAAAAAAAAAAAAAAAAAAAAQAAAB3b3JkL19yZWxzL2RvY3VtZW50LnhtbC5yZWxzrZJBDoIwEEX3nqLpvhShCzE0dhsT3RniAYZ2kJrSlGkx3t4CJi7cqMvJfPm/SW+/l2rvTUQHrSooBwQKbJR1ui0guT/v9gjkSLU1qldQUAAP+/3VJlXaR+sQKESfIkMJTSSB5Nz5BBqXUBrTxwgpJoLbmMgNHK5o8FYpN+yYp5BSmv0f/hhl/QdQSwMEFAAAAAgAAAAAAAAAAAAAAAAAAAAAAAEAAAB3b3JkL2RvY3VtZW50LnhtbJWSQU/DMBBF95X4D5HvNE1aoKoSKYgDEhKCg/g58SaY2rEVO6X8e9akXTh07NTx/nt+a3u3iOd1BV7RGNnUEQwCDw1TUpZNvYn+vpfTqQfGCl4KJRuI4IVYOJ/ML+ZzJW3BdjVaiyCvI5ha2yYQBiZnlTBCW+R0U0lrsaOhqoLQSmBehsXrEnwJKRr+CSRhMBiGqhS61FXA7FdJt2oMVNDiK+P5BXHPhvL/4Q+a638AAABQSwECPwAUAAAACAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAABAA7UEAAAAAZG9jUHJvcHMvYXBwLnhtbFBLAQI/ABQAAAAIAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAQAOdBYAAAAGRvY1Byb3BzL2NvcmUueG1sUEsBAj8AFAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAC/AQAAX3JlbHMvLnJlbHNQSwECPwAUAAAACAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAQAAAAABIAAAB3b3JkL19yZWxzL2RvY3VtZW50LnhtbC5yZWxzUEsBAj8AFAAAAAgAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAEAAAAFYDAAB3b3JkL2RvY3VtZW50LnhtbFBLBQYAAAAABQAFAGEBAAAXAwAAAAA=',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 3847,
      identityId: 'mock-identity-id',
      owner: 'mock-user-sub',
      createdAt: new Date('2024-01-25T09:45:00Z').toISOString(),
      _version: 1,
    },
    {
      id: 'file-12',
      name: 'reading-passage.txt',
      path: 'data:text/plain;base64,SmFwYW5lc2UgQ3VsdHVyZSBhbmQgTGFuZ3VhZ2UKCkphcGFuZXNlIGlzIGEgRmFzY2luYXRpbmcgTGFuZ3VhZ2UKCkphcGFuZXNlIGlzIGEgbGFuZ3VhZ2Ugc3Bva2VuIGJ5IG92ZXIgMTI1IG1pbGxpb24gcGVvcGxlLCBwcmltYXJpbHkgaW4gSmFwYW4uIEl0IGlzIGEgbWVtYmVyIG9mIHRoZSBKYXBvbmljIGxhbmd1YWdlIGZhbWlseSBhbmQgaGFzIGEgdW5pcXVlIHdyaXRpbmcgc3lzdGVtIHRoYXQgY29tYmluZXMgdGhyZWUgc2NyaXB0czogaGlyYWdhbmEsIGthdGFrYW5hLCBhbmQga2FuamkuCgpIaXJhZ2FuYSBpcyB1c2VkIGZvciBuYXRpdmUgSmFwYW5lc2Ugd29yZHMgYW5kIGdyYW1tYXRpY2FsIGVsZW1lbnRzLiBLYXRha2FuYSBpcyBwcmltYXJpbHkgdXNlZCBmb3IgZm9yZWlnbiBsb2Fud29yZHMgYW5kIG9ub21hdG9wb2VpYS4gS2FuamkgYXJlIGNoYXJhY3RlcnMgYm9ycm93ZWQgZnJvbSBDaGluZXNlLCBlYWNoIHJlcHJlc2VudGluZyBhIHdvcmQgb3IgY29uY2VwdC4KClRoZSBncmFtbWF0aWNhbCBzdHJ1Y3R1cmUgb2YgSmFwYW5lc2UgaXMgcXVpdGUgZGlmZmVyZW50IGZyb20gRW5nbGlzaC4gVGhlIGJhc2ljIHNlbnRlbmNlIG9yZGVyIGlzIFN1YmplY3QtT2JqZWN0LVZlcmIsIHdoaWNoIGlzIHRoZSByZXZlcnNlIG9mIEVuZ2xpc2guIEZvciBleGFtcGxlLCAiSSBlYXQgYW4gYXBwbGUiIGluIEphcGFuZXNlIHdvdWxkIGJlICJJIGFwcGxlIGVhdCIgKOepgOOBr+OCiuOCk+OBlOOCkuOBn+OBueOBvuOBmSku',
      mimeType: 'text/plain',
      size: 789,
      identityId: 'mock-identity-id',
      owner: 'mock-user-sub',
      createdAt: new Date('2024-01-26T11:20:00Z').toISOString(),
      _version: 1,
    },
  ]);

  seedMockAssistantChats([allChatData]);
};

// Mock SortDirection enum
export const SortDirection = {
  ASCENDING: 'ASCENDING',
  DESCENDING: 'DESCENDING'
};

// Mock AuthModeStrategyType enum
export const AuthModeStrategyType = {
  DEFAULT: 'DEFAULT',
  MULTI_AUTH: 'MULTI_AUTH',
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
    // Debug logging for data length only
    console.log('[Mock DataStore] model.data length:', model.data ? model.data.length : 0);
    
    // If model doesn't have an ID, generate one
    if (!model.id) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      model.id = `mock-${timestamp}-${random}`;
      console.log('[Mock DataStore] Generated ID:', model.id);
    }
    
    // Detect model type by checking properties (order matters - more specific checks first!)
    const isFile = model.path && model.mimeType;
    const isDocument = model.filename && model.s3Key && model.status;
    const isParsedContent = model.documentID && model.vocabularyJSON !== undefined;
    const isWord = model.phrase && model.definition;
    const isGrade = model.unitID && model.data !== undefined && !isFile;
    const isSettings = model.autoAnalyzeDocuments !== undefined;
    const isUnit = model.name && model.data !== undefined && !model.unitID && !isFile;
    const isSection = model.name && !model.unitID && !model.data && !isFile && !model.path;
    const isAssistantChat = model.model && model.messages !== undefined && model.threadInstructions !== undefined;
    const isAssignment = model.unitID && model.sectionID && !model.data;
    
    // Update the mock data based on model type
    if (isFile) {
      // This is a File
      mockFiles[model.id] = model;
      console.log('[Mock DataStore] Saved File:', model.id, model.name);
      
      // If it's a document type, also create Document record
      const documentTypes = [
        'application/pdf',
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (documentTypes.includes(model.mimeType)) {
        const docId = `doc-${model.id}`;
        mockDocuments[docId] = {
          id: docId,
          filename: model.name,
          s3Key: model.path,
          status: 'uploaded',
          identityId: model.identityId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        console.log('[Mock DataStore] Also created Document record:', docId);
        
        // Notify Document subscribers
        activeSubscriptions.Document.forEach(callback => {
          callback({ items: Object.values(mockDocuments), isSynced: true });
        });
      }
      
      // Notify all File subscribers
      activeSubscriptions.File.forEach(callback => {
        callback({ items: Object.values(mockFiles), isSynced: true });
      });
    } else if (isSection) {
      // This is a Section
      mockSections[model.id] = model;
      console.log('[Mock DataStore] Saved Section:', model.id, model.name);
      
      // Notify all Section subscribers
      activeSubscriptions.Section.forEach(callback => {
        callback({ items: Object.values(mockSections), isSynced: true });
      });
    } else if (isAssignment) {
      // This is an Assignment
      mockAssignments[model.id] = model;
      console.log('[Mock DataStore] Saved Assignment:', model.id, 'for unit:', model.unitID);
      
      // Notify all Assignment subscribers
      activeSubscriptions.Assignment.forEach(callback => {
        callback({ items: Object.values(mockAssignments), isSynced: true });
      });
    } else if (isAssistantChat) {
      // This is an AssistantChat
      // If messages is empty, add sample messages for Storybook
      let messages = model.messages;
      try {
        
        if (messages.length === 0) {
          console.log('[Mock DataStore] Empty messages detected, adding sample messages for Storybook');
          const timestamp = Date.now();
          messages = mockAssistantMessages

        }
      } catch (e) {
        console.warn('[Mock DataStore] Could not parse messages:', e);
      }
      
      mockAssistantChats[model.id] = { ...model, messages };
      console.log('[Mock DataStore] Saved AssistantChat:', model.id, 'model:', model.model, 'message count:', JSON.parse(messages).length);
      
      // Notify all AssistantChat subscribers
      activeSubscriptions.AssistantChat.forEach(callback => {
        callback({ items: Object.values(mockAssistantChats), isSynced: true });
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
    console.log('[Mock DataStore] query called for:', modelName, 'with predicate:', typeof idOrPredicate, 'constructor:', modelConstructor);
    
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
      if (modelName === 'Assignment' && mockAssignments[idOrPredicate]) {
        return mockAssignments[idOrPredicate];
      }
      if (modelName === 'Unit' && mockUnits[idOrPredicate]) {
        return mockUnits[idOrPredicate];
      }
      if (modelName === 'Grade' && mockGrades[idOrPredicate]) {
        return mockGrades[idOrPredicate];
      }
      if (modelName === 'AssistantChat' && mockAssistantChats[idOrPredicate]) {
        return mockAssistantChats[idOrPredicate];
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
      console.log('[Mock DataStore] Section query - mockSections keys:', Object.keys(mockSections));
      console.log('[Mock DataStore] Section query - all section values:', Object.values(mockSections));
      let sections = Object.values(mockSections);
      
      // Apply predicate filter if provided
      if (typeof idOrPredicate === 'function') {
        let idFilter = null;
        const predicateCapture = {
          id: {
            eq: (value) => {
              idFilter = value;
              console.log('[Mock DataStore] Filtering Section by id.eq:', value);
              return predicateCapture;
            }
          },
          and: (fn) => fn(predicateCapture)
        };
        
        try {
          idOrPredicate(predicateCapture);
        } catch (e) {
          console.log('[Mock DataStore] Could not parse Section predicate:', e.message);
        }
        
        if (idFilter) {
          console.log('[Mock DataStore] Before filter - sections:', sections.map(s => s.id));
          sections = sections.filter(s => s.id === idFilter);
          console.log('[Mock DataStore] After filter - sections:', sections.map(s => s.id));
        }
      }
      
      console.log('[Mock DataStore] Returning', sections.length, 'sections:', sections.map(s => ({ id: s.id, name: s.name, owner: s.owner, learner: s.learner })));
      return sections;
    }
    if (modelName === 'Assignment') {
      let assignments = Object.values(mockAssignments);
      
      // Apply predicate filter if provided
      if (typeof idOrPredicate === 'function') {
        let sectionIDFilter = null;
        const predicateCapture = {
          sectionID: {
            eq: (value) => {
              sectionIDFilter = value;
              console.log('[Mock DataStore] Filtering Assignment by sectionID.eq:', value);
              return predicateCapture;
            }
          },
          and: (fn) => fn(predicateCapture)
        };
        
        try {
          idOrPredicate(predicateCapture);
        } catch (e) {
          console.log('[Mock DataStore] Could not parse Assignment predicate:', e.message);
        }
        
        if (sectionIDFilter) {
          assignments = assignments.filter(a => a.sectionID === sectionIDFilter);
        }
      }
      
      console.log('[Mock DataStore] Returning', assignments.length, 'assignments');
      return assignments;
    }
    if (modelName === 'Grade') {
      const grades = Object.values(mockGrades);
      console.log('[Mock DataStore] Returning', grades.length, 'grades');
      return grades;
    }
    if (modelName === 'Unit') {
      const units = Object.values(mockUnits);
      console.log('[Mock DataStore] Returning', units.length, 'units');
      return units;
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
        } else if (modelName === 'Assignment') {
          items = Object.values(mockAssignments);
          if (filterFn) {
            items = items.filter(filterFn);
          }
          console.log('[Mock DataStore] Returning', items.length, 'assignments (filtered)');
          activeSubscriptions.Assignment.push(callback);
        } else if (modelName === 'AssistantChat') {
          items = Object.values(mockAssistantChats);
          if (filterFn) {
            items = items.filter(filterFn);
          }
          console.log('[Mock DataStore] Returning', items.length, 'assistant chats (filtered)');
          activeSubscriptions.AssistantChat.push(callback);
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
            } else if (modelName === 'Assignment') {
              const index = activeSubscriptions.Assignment.indexOf(callback);
              if (index > -1) {
                activeSubscriptions.Assignment.splice(index, 1);
              }
            } else if (modelName === 'AssistantChat') {
              const index = activeSubscriptions.AssistantChat.indexOf(callback);
              if (index > -1) {
                activeSubscriptions.AssistantChat.splice(index, 1);
              }
            }
          }
        };
      }
    };
  }

  // Mock configure method - required by Amplify but no-op in Storybook
  static configure(config) {
    console.log('[Mock DataStore] configure() called with config:', config ? 'provided' : 'none');
    return config;
  }
}
