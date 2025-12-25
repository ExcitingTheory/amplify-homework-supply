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

// Store active subscriptions
const activeSubscriptions = {
  Unit: [],
  Grade: [],
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

// Helper to clear mock data between stories
export const clearMockUnits = () => {
  Object.keys(mockUnits).forEach(key => delete mockUnits[key]);
  Object.keys(mockGrades).forEach(key => delete mockGrades[key]);
  console.log('[Mock DataStore] Cleared all mock data');
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
    console.log('Mock DataStore.query called for:', modelName, 'with id:', idOrPredicate);
    
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
    return {
      subscribe: (callback) => {
        console.log('Mock DataStore.observeQuery subscription created for:', modelName);
        
        // Merge seeded units with mock data
        let items = [];
        if (modelName === 'Unit') {
          items = Object.values(mockUnits);
          console.log('[Mock DataStore] Returning', items.length, 'units');
          // Store the callback for future updates
          activeSubscriptions.Unit.push(callback);
        } else if (modelName === 'Grade') {
          items = Object.values(mockGrades);
          activeSubscriptions.Grade.push(callback);
        } else {
          const data = mockData[modelName];
          items = data ? Object.values(data) : [];
        }
        
        // Call immediately with current data
        callback({ items, isSynced: true });
        
        return {
          unsubscribe: () => {
            console.log('Mock DataStore.observeQuery subscription unsubscribed');
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
            }
          }
        };
      }
    };
  }
}
