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

// Store active subscriptions
const activeSubscriptions = {
  Unit: [],
  Grade: [],
  File: [],
  Settings: [],
  Document: [],
};

// Helper to seed mock data for stories
export const seedMockUnit = (unitData) => {
  if (unitData.id) {
    // Add mock relationship methods if not present
    const unit = {
      ...unitData,
      words: {
        toArray: async () => [],
      },
      files: {
        toArray: async () => [],
      },
      questions: {
        toArray: async () => [],
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
    
    // Update the mock data based on model type
    if (model.id && model.unitID) {
      // This is likely a Grade
      mockGrades[model.id] = model;
      console.log('[Mock DataStore] Updated grade:', model.id);
      console.log('[Mock DataStore] mockGrades[model.id].data:', mockGrades[model.id].data);
      
      // Notify all Grade subscribers
      activeSubscriptions.Grade.forEach(callback => {
        callback({ items: Object.values(mockGrades), isSynced: true });
      });
    } else if (model.id && model.autoAnalyzePDFs !== undefined) {
      // This is Settings
      mockSettings[model.id] = model;
      console.log('[Mock DataStore] Updated settings:', model.id);
      
      // Notify all Settings subscribers
      activeSubscriptions.Settings.forEach(callback => {
        callback({ items: Object.values(mockSettings), isSynced: true });
      });
    } else if (model.id && model.data) {
      // Could be a Unit
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
      const data = mockData[modelName];
      if (data && data[idOrPredicate]) {
        console.log('Mock DataStore returning:', data[idOrPredicate]);
        return data[idOrPredicate];
      }
      console.log('Mock DataStore: No data found for id:', idOrPredicate);
      return null;
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
            }
          }
        };
      }
    };
  }
}
