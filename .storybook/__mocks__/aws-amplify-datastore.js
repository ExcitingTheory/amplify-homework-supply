/**
 * Mock @aws-amplify/datastore for Storybook
 */

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
        console.log('Mock DataStore.observeQuery subscription created');
        // Call the callback immediately with mock data
        const data = mockData[modelName];
        const items = data ? Object.values(data) : [];
        callback({ items, isSynced: true });
        
        return {
          unsubscribe: () => {
            console.log('Mock DataStore.observeQuery subscription unsubscribed');
          }
        };
      }
    };
  }
}
