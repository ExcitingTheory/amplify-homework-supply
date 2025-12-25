/**
 * Mock @aws-amplify/datastore for Storybook
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

// Helper to clear mock data between stories
export const clearMockUnits = () => {
  Object.keys(mockUnits).forEach(key => delete mockUnits[key]);
  Object.keys(mockGrades).forEach(key => delete mockGrades[key]);
  console.log('[Mock DataStore] Cleared all mock data');
};

// Mock model class factory
const createMockModel = (modelName) => {
  class MockModel {
    static copyOf(original, mutator) {
      const copy = { ...original };
      mutator(copy);
      return copy;
    }
    
    constructor(init) {
      Object.assign(this, init);
    }
  }
  
  // Define name property using Object.defineProperty to avoid read-only error
  Object.defineProperty(MockModel, 'name', {
    value: modelName,
    writable: false,
    configurable: true
  });
  
  return MockModel;
};

export const initSchema = (schema) => {
  console.log('Mock initSchema called');
  
  // Create mock models for each model in the schema
  const models = {};
  
  if (schema && schema.models) {
    Object.keys(schema.models).forEach(modelName => {
      models[modelName] = createMockModel(modelName);
    });
  }
  
  // Fallback for common models if schema parsing fails
  const commonModels = [
    'Assistant', 'Question', 'File', 'ChatHistory', 'Section', 
    'Assignment', 'Grade', 'Unit', 'Word', 'QuestionUnit', 
    'QuestionWord', 'QuestionFile', 'UnitFile', 'WordFile', 
    'UnitWord', 'StudentInfo', 'Choice'
  ];
  
  commonModels.forEach(modelName => {
    if (!models[modelName]) {
      models[modelName] = createMockModel(modelName);
    }
  });
  
  return models;
};

// Create mock model constructors with proper names
class UnitModel {
  static copyOf(original, mutator) {
    const copy = { ...original };
    mutator(copy);
    return copy;
  }
  
  constructor(init) {
    Object.assign(this, init);
  }
}

class GradeModel {
  static copyOf(original, mutator) {
    const copy = { ...original };
    mutator(copy);
    return copy;
  }
  
  constructor(init) {
    Object.assign(this, init);
  }
}

// Define the name property properly
Object.defineProperty(UnitModel, 'name', { value: 'Unit', writable: false, configurable: true });
Object.defineProperty(GradeModel, 'name', { value: 'Grade', writable: false, configurable: true });

// Export with standard names
export const Unit = UnitModel;
export const Grade = GradeModel;

// Export other models as simple objects for now
export const Word = {};
export const Question = {};
export const Section = {};
export const Assignment = {};
export const Assistant = {};
export const File = {};
export const UnitWord = {};
export const UnitFile = {};
export const QuestionFile = {};
export const QuestionUnit = {};
export const FileProtectionLevels = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  PROTECTED: 'PROTECTED',
};

// Mock SortDirection enum
export const SortDirection = {
  ASCENDING: 'ASCENDING',
  DESCENDING: 'DESCENDING'
};

// Mock data storage
const mockData = {
  Word: {
    '1': { id: '1', phrase: 'Hello', pronunciation: 'heh-LOH', definition: 'A greeting' },
    '2': { id: '2', phrase: 'Goodbye', pronunciation: 'good-BYE', definition: 'A farewell' },
    '3': { id: '3', phrase: 'Thank you', pronunciation: 'thank-YOO', definition: 'Expression of gratitude' },
    '4': { id: '4', phrase: 'Please', pronunciation: 'PLEEZ', definition: 'Polite request' },
  },
  Question: {},
  Unit: {},
  Grade: {},
  Section: {},
  File: {},
};

export class DataStore {
  static async save(model) {
    console.log('Mock DataStore.save called with:', model);
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
