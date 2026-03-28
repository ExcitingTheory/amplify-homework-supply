/**
 * Mock aws-amplify/data for Storybook
 * Provides GraphQL client compatible with Amplify Gen 2 API
 */

import { mockFiles as initialMockFiles, mockDocuments as initialMockDocuments, mockParsedContent as initialMockParsedContent } from './ui-data/files';
import { allChatData } from './chatDataLoader';

/**
 * Mock in-memory data stores
 */
const dataStores = {
  File: new Map(),
  Document: new Map(),
  Unit: new Map(),
  Word: new Map(),
  Question: new Map(),
  Grade: new Map(),
  Section: new Map(),
  Assignment: new Map(),
  UnitWord: new Map(),
  UnitFile: new Map(),
  UnitDocument: new Map(),
  QuestionUnit: new Map(),
  ParsedContent: new Map(),
  AIFeedback: new Map(),
  AssistantChat: new Map(),
  AssistantChatFile: new Map(),
  Settings: new Map(),
};

/**
 * Store active subscriptions for each model
 * This allows us to notify subscribers when data changes
 */
const activeSubscriptions = {
  File: [],
  Document: [],
  Unit: [],
  Word: [],
  Question: [],
  Grade: [],
  Section: [],
  Assignment: [],
  UnitWord: [],
  UnitFile: [],
  UnitDocument: [],
  QuestionUnit: [],
  ParsedContent: [],
  AIFeedback: [],
  AssistantChat: [],
  AssistantChatFile: [],
  Settings: [],
};

/**
 * Initialize mock data stores
 */
const initializeStores = () => {
  // Populate File store
  initialMockFiles.forEach(file => {
    dataStores.File.set(file.id, file);
  });

  // Populate Document store
  Object.values(initialMockDocuments).forEach(doc => {
    dataStores.Document.set(doc.id, doc);
  });

  // Populate ParsedContent store
  initialMockParsedContent.forEach(parsed => {
    dataStores.ParsedContent.set(parsed.id, parsed);
  });

  console.log('[Mock Data] Initialized stores:', {
    File: dataStores.File.size,
    Document: dataStores.Document.size,
    ParsedContent: dataStores.ParsedContent.size,
  });
};

// Initialize on import
initializeStores();

/**
 * Relationship definitions matching schema
 * belongsTo: { foreignKey: 'relatedModel' }
 * hasMany: { targetModel: 'foreignKeyField' }
 */
const relationships = {
  File: {
    belongsTo: {
      document: { foreignKey: 'documentID', targetModel: 'Document' },
    },
    hasMany: {
      parsedContent: { targetModel: 'ParsedContent', foreignKey: 'fileID' },
    },
  },
  Document: {
    hasMany: {
      files: { targetModel: 'File', foreignKey: 'documentID' },
      parsedContent: { targetModel: 'ParsedContent', foreignKey: 'documentID' },
    },
  },
  ParsedContent: {
    belongsTo: {
      document: { foreignKey: 'documentID', targetModel: 'Document' },
      file: { foreignKey: 'fileID', targetModel: 'File' },
    },
  },
  Unit: {
    hasMany: {
      unitFiles: { targetModel: 'UnitFile', foreignKey: 'unitID' },
      unitWords: { targetModel: 'UnitWord', foreignKey: 'unitID' },
    },
  },
  AssistantChat: {
    hasMany: {
      chatFiles: { targetModel: 'AssistantChatFile', foreignKey: 'chatID' },
    },
  },
};

/**
 * Add relationship accessors to a model instance
 * - belongsTo: adds async getter property that fetches related record
 * - hasMany: adds function that returns filtered list
 */
const addRelationshipAccessors = (item, modelName) => {
  if (!item || !relationships[modelName]) return item;

  const modelRelationships = relationships[modelName];
  const enhancedItem = { ...item };
  
  // Parse JSON fields for ParsedContent model
  if (modelName === 'ParsedContent') {
    try {
      enhancedItem.vocabularyJSON = typeof item.vocabularyJSON === 'string' 
        ? JSON.parse(item.vocabularyJSON) 
        : (item.vocabularyJSON || []);
      enhancedItem.summariesJSON = typeof item.summariesJSON === 'string'
        ? JSON.parse(item.summariesJSON)
        : (item.summariesJSON || []);
      enhancedItem.objectivesJSON = typeof item.objectivesJSON === 'string'
        ? JSON.parse(item.objectivesJSON)
        : (item.objectivesJSON || []);
      enhancedItem.conceptsJSON = typeof item.conceptsJSON === 'string'
        ? JSON.parse(item.conceptsJSON)
        : (item.conceptsJSON || []);
      enhancedItem.questionsJSON = typeof item.questionsJSON === 'string'
        ? JSON.parse(item.questionsJSON)
        : (item.questionsJSON || []);
    } catch (e) {
      console.error('[Mock Data] Error parsing ParsedContent JSON fields:', e);
    }
  }

  // Parse JSON fields for Grade model
  if (modelName === 'Grade') {
    try {
      enhancedItem.data = typeof item.data === 'string'
        ? JSON.parse(item.data)
        : (item.data || {});
    } catch (e) {
      console.error('[Mock Data] Error parsing Grade.data field:', e);
      enhancedItem.data = {};
    }
  }

  // Add belongsTo accessors (properties that return Promises)
  if (modelRelationships.belongsTo) {
    Object.entries(modelRelationships.belongsTo).forEach(([relationName, config]) => {
      const foreignKeyValue = item[config.foreignKey];
      if (foreignKeyValue) {
        const targetModel = config.targetModel;
        
        // Create property that returns a Promise (mimics Amplify Gen2 lazy loading)
        Object.defineProperty(enhancedItem, relationName, {
          get() {
            return Promise.resolve().then(() => {
              const relatedItem = dataStores[targetModel].get(foreignKeyValue);
              return relatedItem ? addRelationshipAccessors(relatedItem, targetModel) : null;
            });
          },
          enumerable: true,
          configurable: true,
        });
      }
    });
  }

  // Add hasMany accessors per official Amplify Gen 2 API:
  // Lazy load: await item.relationship() returns Promise<{data: Array, errors: []}>
  if (modelRelationships.hasMany) {
    Object.entries(modelRelationships.hasMany).forEach(([relationName, config]) => {
      const targetModel = config.targetModel;
      const foreignKey = config.foreignKey;
      const itemId = item.id;
      
      // Return a function that returns Promise<{data: Array}>
      Object.defineProperty(enhancedItem, relationName, {
        get() {
          return async () => {
            const allItems = Array.from(dataStores[targetModel].values());
            const filtered = allItems.filter(relatedItem => relatedItem[foreignKey] === itemId);
            const enhancedFiltered = filtered.map(relatedItem => addRelationshipAccessors(relatedItem, targetModel));
            return { data: enhancedFiltered, errors: [] };
          };
        },
        enumerable: true,
        configurable: true,
      });
    });
  }

  return enhancedItem;
};

/**
 * Create a mock observable query that immediately returns data
 */
const createObservableQuery = (modelName, filter) => {
  return {
    subscribe: ({ next, error }) => {
      try {
        let items = Array.from(dataStores[modelName].values());
        
        // Apply filter if provided
        if (filter?.filter) {
          console.log(`[Mock Data] ${modelName}.observeQuery() applying filter:`, filter.filter);
          console.log(`[Mock Data] ${modelName}.observeQuery() items before filter:`, items.length);
          items = items.filter(item => {
            // Simple filter implementation - supports { field: { eq: value } }
            const matches = Object.entries(filter.filter).every(([field, condition]) => {
              if (condition.eq !== undefined) {
                const itemValue = item[field];
                const conditionValue = condition.eq;
                const match = itemValue === conditionValue;
                if (modelName === 'Section') {
                  console.log(`[Mock Data] Section filter check: ${field} => item[${field}]=${itemValue} === ${conditionValue} => ${match}`);
                }
                return match;
              }
              return true;
            });
            return matches;
          });
          console.log(`[Mock Data] ${modelName}.observeQuery() items after filter:`, items.length);
        }
        
        console.log(`[Mock Data] ${modelName}.observeQuery() returning ${items.length} items (filter applied)`, filter);
        
        // Add relationship accessors to all items
        const enhancedItems = items.map(item => addRelationshipAccessors(item, modelName));
        
        // Store subscription so we can notify it when data changes
        const subscription = { next, error };
        activeSubscriptions[modelName].push(subscription);
        console.log(`[Mock Data] ${modelName} subscription added. Total subscriptions: ${activeSubscriptions[modelName].length}`);
        
        // Call next immediately with synced data
        setTimeout(() => {
          next({
            items: enhancedItems,
            isSynced: true,
          });
        }, 10);

        // Return unsubscribe function
        return {
          unsubscribe: () => {
            const index = activeSubscriptions[modelName].indexOf(subscription);
            if (index > -1) {
              activeSubscriptions[modelName].splice(index, 1);
              console.log(`[Mock Data] ${modelName} subscription unsubscribed. Remaining: ${activeSubscriptions[modelName].length}`);
            }
          },
        };
      } catch (err) {
        console.error(`[Mock Data] ${modelName}.observeQuery() error:`, err);
        if (error) {
          error(err);
        }
        return {
          unsubscribe: () => {},
        };
      }
    },
  };
};

/**
 * Store mutation subscriptions for onCreate, onUpdate, onDelete
 * These are separate from observeQuery subscriptions
 */
const mutationSubscriptions = {
  File: { onCreate: [], onUpdate: [], onDelete: [] },
  Document: { onCreate: [], onUpdate: [], onDelete: [] },
  Unit: { onCreate: [], onUpdate: [], onDelete: [] },
  Word: { onCreate: [], onUpdate: [], onDelete: [] },
  Question: { onCreate: [], onUpdate: [], onDelete: [] },
  Grade: { onCreate: [], onUpdate: [], onDelete: [] },
  Section: { onCreate: [], onUpdate: [], onDelete: [] },
  Assignment: { onCreate: [], onUpdate: [], onDelete: [] },
  UnitWord: { onCreate: [], onUpdate: [], onDelete: [] },
  UnitFile: { onCreate: [], onUpdate: [], onDelete: [] },
  UnitDocument: { onCreate: [], onUpdate: [], onDelete: [] },
  QuestionUnit: { onCreate: [], onUpdate: [], onDelete: [] },
  ParsedContent: { onCreate: [], onUpdate: [], onDelete: [] },
  AIFeedback: { onCreate: [], onUpdate: [], onDelete: [] },
  AssistantChat: { onCreate: [], onUpdate: [], onDelete: [] },
  AssistantChatFile: { onCreate: [], onUpdate: [], onDelete: [] },
  Settings: { onCreate: [], onUpdate: [], onDelete: [] },
};

/**
 * Create a mutation subscription observable (onCreate, onUpdate, onDelete)
 */
const createMutationSubscription = (modelName, mutationType) => ({
  subscribe: ({ next, error }) => {
    const subscription = { next, error };
    
    // Initialize if needed
    if (!mutationSubscriptions[modelName]) {
      mutationSubscriptions[modelName] = { onCreate: [], onUpdate: [], onDelete: [] };
    }
    
    mutationSubscriptions[modelName][mutationType].push(subscription);
    console.log(`[Mock Data] ${modelName}.${mutationType}() subscription added. Total: ${mutationSubscriptions[modelName][mutationType].length}`);
    
    return {
      unsubscribe: () => {
        const index = mutationSubscriptions[modelName][mutationType].indexOf(subscription);
        if (index > -1) {
          mutationSubscriptions[modelName][mutationType].splice(index, 1);
          console.log(`[Mock Data] ${modelName}.${mutationType}() subscription removed. Remaining: ${mutationSubscriptions[modelName][mutationType].length}`);
        }
      },
    };
  },
});

/**
 * Notify mutation subscribers when data changes
 */
const notifyMutationSubscribers = (modelName, mutationType, item) => {
  const subs = mutationSubscriptions[modelName]?.[mutationType] || [];
  if (subs.length > 0) {
    const enhancedItem = addRelationshipAccessors(item, modelName);
    subs.forEach(subscription => {
      setTimeout(() => {
        subscription.next(enhancedItem);
      }, 0);
    });
    console.log(`[Mock Data] ${modelName}.${mutationType}() notified ${subs.length} subscribers`);
  }
};

/**
 * Create a mock model with common operations
 */
const createMockModel = (modelName) => ({
  observeQuery: (filter) => {
    console.log(`[Mock Data] ${modelName}.observeQuery() called with filter:`, filter);
    return createObservableQuery(modelName, filter);
  },
  
  // Real-time subscription methods (Amplify Gen 2 API)
  onCreate: (filter) => {
    console.log(`[Mock Data] ${modelName}.onCreate() called with filter:`, filter);
    return createMutationSubscription(modelName, 'onCreate');
  },
  
  onUpdate: (filter) => {
    console.log(`[Mock Data] ${modelName}.onUpdate() called with filter:`, filter);
    return createMutationSubscription(modelName, 'onUpdate');
  },
  
  onDelete: (filter) => {
    console.log(`[Mock Data] ${modelName}.onDelete() called with filter:`, filter);
    return createMutationSubscription(modelName, 'onDelete');
  },
  
  list: async (options) => {
    console.log(`[Mock Data] ${modelName}.list() called with options:`, options);
    let items = Array.from(dataStores[modelName].values());
    
    // Apply filter if provided
    if (options?.filter) {
      items = items.filter(item => {
        // Simple filter implementation - supports { field: { eq: value } }
        return Object.entries(options.filter).every(([field, condition]) => {
          if (condition.eq !== undefined) {
            return item[field] === condition.eq;
          }
          return true;
        });
      });
    }
    
    // Add relationship accessors
    const enhancedItems = items.map(item => addRelationshipAccessors(item, modelName));
    
    return {
      data: enhancedItems,
      errors: [],
    };
  },
  
  get: async ({ id }) => {
    console.log(`[Mock Data] ${modelName}.get() called with id:`, id);
    const item = dataStores[modelName].get(id);
    const enhancedItem = item ? addRelationshipAccessors(item, modelName) : null;
    return {
      data: enhancedItem,
      errors: item ? [] : [{ message: 'Not found' }],
    };
  },
  
  create: async (input) => {
    console.log(`[Mock Data] ${modelName}.create() called with:`, input);
    const id = input.id || `mock-${modelName.toLowerCase()}-${Date.now()}`;
    const item = { 
      ...input, 
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _version: 1,
    };
    dataStores[modelName].set(id, item);
    
    const enhancedItem = addRelationshipAccessors(item, modelName);
    
    // Notify onCreate mutation subscribers
    notifyMutationSubscribers(modelName, 'onCreate', item);
    
    // Notify all observeQuery subscribers about the new item
    if (activeSubscriptions[modelName] && activeSubscriptions[modelName].length > 0) {
      const items = Array.from(dataStores[modelName].values());
      const enhancedItems = items.map(item => addRelationshipAccessors(item, modelName));
      activeSubscriptions[modelName].forEach(subscription => {
        setTimeout(() => {
          subscription.next({
            items: enhancedItems,
            isSynced: true,
          });
        }, 0);
      });
      console.log(`[Mock Data] ${modelName} created: ${id} - notified ${activeSubscriptions[modelName].length} subscribers`);
    } else {
      console.log(`[Mock Data] ${modelName} created: ${id} - no active subscribers`);
    }
    
    return {
      data: enhancedItem,
      errors: [],
    };
  },
  
  update: async (input) => {
    console.log(`[Mock Data] ${modelName}.update() called with:`, input);
    const existing = dataStores[modelName].get(input.id);
    if (!existing) {
      return {
        data: null,
        errors: [{ message: 'Not found' }],
      };
    }
    
    const updated = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
      _version: (existing._version || 0) + 1,
    };
    dataStores[modelName].set(input.id, updated);
    
    const enhancedUpdated = addRelationshipAccessors(updated, modelName);
    
    // Notify onUpdate mutation subscribers
    notifyMutationSubscribers(modelName, 'onUpdate', updated);
    
    // Notify all observeQuery subscribers about the update
    if (activeSubscriptions[modelName] && activeSubscriptions[modelName].length > 0) {
      const items = Array.from(dataStores[modelName].values());
      const enhancedItems = items.map(item => addRelationshipAccessors(item, modelName));
      activeSubscriptions[modelName].forEach(subscription => {
        setTimeout(() => {
          subscription.next({
            items: enhancedItems,
            isSynced: true,
          });
        }, 0);
      });
      console.log(`[Mock Data] ${modelName} updated: ${input.id} - notified ${activeSubscriptions[modelName].length} subscribers`);
    } else {
      console.log(`[Mock Data] ${modelName} updated: ${input.id} - no active subscribers`);
    }
    
    return {
      data: enhancedUpdated,
      errors: [],
    };
  },
  
  delete: async ({ id }) => {
    console.log(`[Mock Data] ${modelName}.delete() called with id:`, id);
    const existing = dataStores[modelName].get(id);
    if (!existing) {
      return {
        data: null,
        errors: [{ message: 'Not found' }],
      };
    }
    
    dataStores[modelName].delete(id);
    
    // Notify onDelete mutation subscribers
    notifyMutationSubscribers(modelName, 'onDelete', existing);
    
    // Notify all observeQuery subscribers about the deletion
    if (activeSubscriptions[modelName] && activeSubscriptions[modelName].length > 0) {
      const items = Array.from(dataStores[modelName].values());
      const enhancedItems = items.map(item => addRelationshipAccessors(item, modelName));
      activeSubscriptions[modelName].forEach(subscription => {
        setTimeout(() => {
          subscription.next({
            items: enhancedItems,
            isSynced: true,
          });
        }, 0);
      });
      console.log(`[Mock Data] ${modelName} deleted: ${id} - notified ${activeSubscriptions[modelName].length} subscribers`);
    } else {
      console.log(`[Mock Data] ${modelName} deleted: ${id} - no active subscribers`);
    }
    
    return {
      data: existing,
      errors: [],
    };
  },
});

/**
 * Mock GraphQL client matching Amplify Gen 2 structure
 */
const mockClient = {
  models: {
    File: createMockModel('File'),
    Document: createMockModel('Document'),
    Unit: createMockModel('Unit'),
    Word: createMockModel('Word'),
    Question: createMockModel('Question'),
    Grade: createMockModel('Grade'),
    Section: createMockModel('Section'),
    Assignment: createMockModel('Assignment'),
    UnitWord: createMockModel('UnitWord'),
    UnitFile: createMockModel('UnitFile'),
    UnitDocument: createMockModel('UnitDocument'),
    QuestionUnit: createMockModel('QuestionUnit'),
    ParsedContent: createMockModel('ParsedContent'),
    AIFeedback: createMockModel('AIFeedback'),
    AssistantChat: createMockModel('AssistantChat'),
    AssistantChatFile: createMockModel('AssistantChatFile'),
    Settings: createMockModel('Settings'),
  },

  // Mock mutations for custom server-side operations
  mutations: {
    addSelfToSection: async (input) => {
      console.log('[Mock Data] addSelfToSection() called with:', input);
      // Simulate a successful join for any code
      const sectionId = `mock-section-${Date.now()}`;
      const mockSection = {
        id: sectionId,
        name: `Mock Section (${input?.code || 'DEMO'})`,
        code: input?.code || 'DEMO',
        owner: 'student-alice-sub',
        _version: 1,
        _lastChangedAt: Date.now(),
        _deleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dataStores.Section.set(sectionId, mockSection);
      return { data: `Successfully joined section with code ${input?.code}`, errors: null };
    },
  },

  // Mock queries for custom query handlers (Lambda-backed)
  queries: {
    verifyDefinition: async (input) => {
      console.log('[Mock Data] queries.verifyDefinition() called with:', input);
      return { data: JSON.stringify({ answer: true, reason: 'Mock verification: definition accepted' }), errors: null };
    },
    verifyWord: async (input) => {
      console.log('[Mock Data] queries.verifyWord() called with:', input);
      return { data: JSON.stringify({ answer: true, reason: 'Mock verification: word accepted' }), errors: null };
    },
    verifyShortAnswer: async (input) => {
      console.log('[Mock Data] queries.verifyShortAnswer() called with:', input);
      return { data: JSON.stringify({ answer: true, reason: 'Mock verification: answer accepted' }), errors: null };
    },
    verifyAudioUrl: async (input) => {
      console.log('[Mock Data] queries.verifyAudioUrl() called with:', input);
      return { data: JSON.stringify({ answer: true, reason: 'Mock verification: audio accepted' }), errors: null };
    },
    verifyImage: async (input) => {
      console.log('[Mock Data] queries.verifyImage() called with:', input);
      return { data: JSON.stringify({ answer: true, reason: 'Mock verification: image accepted' }), errors: null };
    },
    verifyImageUrl: async (input) => {
      console.log('[Mock Data] queries.verifyImageUrl() called with:', input);
      return { data: JSON.stringify({ answer: true, reason: 'Mock verification: image URL accepted' }), errors: null };
    },
    processImageUrl: async (input) => {
      console.log('[Mock Data] queries.processImageUrl() called with:', input);
      return { data: JSON.stringify({ description: 'Mock image description' }), errors: null };
    },
    transcribeUrl: async (input) => {
      console.log('[Mock Data] queries.transcribeUrl() called with:', input);
      return { data: JSON.stringify({ text: 'Mock transcription result' }), errors: null };
    },
    getStudentSubmissionUrl: async (input) => {
      console.log('[Mock Data] queries.getStudentSubmissionUrl() called with:', input);
      return { data: 'https://mock-submission-url.example.com/submission.mp3', errors: null };
    },
    listSectionStudents: async (input) => {
      console.log('[Mock Data] queries.listSectionStudents() called with:', input);
      return { data: JSON.stringify([]), errors: null };
    },
  },

  // GraphQL method for custom queries
  graphql: async ({ query, variables }) => {
    console.log('[Mock Data] graphql() called:', { query, variables });
    return {
      data: {},
      errors: [],
    };
  },
};

/**
 * Mock generateClient function
 */
export const generateClient = () => {
  console.log('[Mock Data] generateClient() called - returning mock client');
  return mockClient;
};

/**
 * Export helpers for story setup
 */
export const resetMockData = () => {
  console.log('[Mock Data] Resetting all data stores');
  Object.values(dataStores).forEach(store => store.clear());
  initializeStores();
};

export const addMockData = (modelName, items) => {
  console.log(`[Mock Data] Adding ${items.length} items to ${modelName}`);
  items.forEach(item => {
    dataStores[modelName].set(item.id, item);
  });
};

export const getMockData = (modelName) => {
  return Array.from(dataStores[modelName].values());
};

/**
 * Seed functions for backward compatibility with DataStore mock API
 */
export const seedMockFiles = (filesArray) => {
  console.log(`[Mock Data] seedMockFiles: Adding ${filesArray.length} files`);
  filesArray.forEach(file => {
    dataStores.File.set(file.id, file);
  });
};

export const seedMockDocuments = (documentsArray) => {
  console.log(`[Mock Data] seedMockDocuments: Adding ${documentsArray.length} documents`);
  documentsArray.forEach(doc => {
    dataStores.Document.set(doc.id, doc);
  });
};

export const seedMockParsedContent = (parsedContentArray) => {
  console.log(`[Mock Data] seedMockParsedContent: Adding ${parsedContentArray.length} parsed content records`);
  parsedContentArray.forEach(parsed => {
    // Ensure JSON fields are stringified if they're still objects
    const processedParsed = {
      ...parsed,
      vocabularyJSON: typeof parsed.vocabularyJSON === 'string' 
        ? parsed.vocabularyJSON 
        : JSON.stringify(parsed.vocabularyJSON || []),
      summariesJSON: typeof parsed.summariesJSON === 'string'
        ? parsed.summariesJSON
        : JSON.stringify(parsed.summariesJSON || []),
      objectivesJSON: typeof parsed.objectivesJSON === 'string'
        ? parsed.objectivesJSON
        : JSON.stringify(parsed.objectivesJSON || []),
      conceptsJSON: typeof parsed.conceptsJSON === 'string'
        ? parsed.conceptsJSON
        : JSON.stringify(parsed.conceptsJSON || []),
      questionsJSON: typeof parsed.questionsJSON === 'string'
        ? parsed.questionsJSON
        : JSON.stringify(parsed.questionsJSON || []),
    };
    dataStores.ParsedContent.set(processedParsed.id, processedParsed);
  });
};

export const seedMockUnit = (unitData, options = {}) => {
  console.log(`[Mock Data] seedMockUnit: Adding unit ${unitData.id}`);
  dataStores.Unit.set(unitData.id, unitData);
  
  // If relationships are provided, add them to join tables
  if (options.words) {
    options.words.forEach(word => {
      const unitWordId = `${unitData.id}-${word.id}`;
      dataStores.UnitWord.set(unitWordId, {
        id: unitWordId,
        unitID: unitData.id,
        wordID: word.id,
        owner: unitData.owner,
      });
    });
  }
  
  if (options.files) {
    options.files.forEach(file => {
      const unitFileId = `${unitData.id}-${file.id}`;
      dataStores.UnitFile.set(unitFileId, {
        id: unitFileId,
        unitID: unitData.id,
        fileID: file.id,
        owner: unitData.owner,
      });
    });
  }
  
  if (options.questions) {
    options.questions.forEach(question => {
      const questionUnitId = `${question.id}-${unitData.id}`;
      dataStores.QuestionUnit.set(questionUnitId, {
        id: questionUnitId,
        questionID: question.id,
        unitID: unitData.id,
        owner: unitData.owner,
      });
    });
  }
};

export const seedMockWords = (wordsArray) => {
  console.log(`[Mock Data] seedMockWords: Adding ${wordsArray.length} words`);
  wordsArray.forEach(word => {
    dataStores.Word.set(word.id, word);
  });
  
  // Notify all Word subscribers about the new data
  const items = Array.from(dataStores.Word.values());
  activeSubscriptions.Word.forEach(subscription => {
    console.log('[Mock Data] Notifying Word subscriber with', items.length, 'words');
    if (subscription.next) {
      const enhancedItems = items.map(item => addRelationshipAccessors(item, 'Word'));
      subscription.next({ items: enhancedItems, isSynced: true });
    }
  });
};

export const seedMockQuestions = (questionsArray) => {
  console.log(`[Mock Data] seedMockQuestions: Adding ${questionsArray.length} questions`);
  questionsArray.forEach(question => {
    dataStores.Question.set(question.id, question);
  });
  
  // Notify all Question subscribers about the new data
  const items = Array.from(dataStores.Question.values());
  activeSubscriptions.Question.forEach(subscription => {
    console.log('[Mock Data] Notifying Question subscriber with', items.length, 'questions');
    if (subscription.next) {
      const enhancedItems = items.map(item => addRelationshipAccessors(item, 'Question'));
      subscription.next({ items: enhancedItems, isSynced: true });
    }
  });
};

export const seedMockQuestionUnits = (questionUnitsArray) => {
  console.log(`[Mock Data] seedMockQuestionUnits: Adding ${questionUnitsArray.length} question-unit joins`);
  questionUnitsArray.forEach(qunit => {
    dataStores.QuestionUnit.set(qunit.id, qunit);
  });
};

export const seedMockGrade = (gradeData) => {
  if (gradeData.id) {
    dataStores.Grade.set(gradeData.id, gradeData);
    console.log('[Mock Data] Seeded grade:', gradeData.id, 'for unit:', gradeData.unitID);
    console.log('[Mock Data] Grade has data:', !!gradeData.data);
    console.log('[Mock Data] Total grades in store:', dataStores.Grade.size);
    
    // Notify all Grade subscribers about the new data
    if (activeSubscriptions.Grade.length > 0) {
      const items = Array.from(dataStores.Grade.values());
      const enhancedItems = items.map(item => addRelationshipAccessors(item, 'Grade'));
      activeSubscriptions.Grade.forEach(subscription => {
        console.log('[Mock Data] Notifying subscriber with', items.length, 'grades');
        setTimeout(() => {
          subscription.next({
            items: enhancedItems,
            isSynced: true,
          });
        }, 0);
      });
    }
  }
};

export const seedMockSections = (sectionsArray) => {
  console.log(`[Mock Data] seedMockSections: Adding ${sectionsArray.length} sections`);
  sectionsArray.forEach(section => {
    if (section.id) {
      console.log(`[Mock Data] Seeding section: ${section.id} with owner: ${section.owner}`);
      dataStores.Section.set(section.id, section);
    }
  });
  console.log('[Mock Data] Total sections in store:', dataStores.Section.size);
  console.log('[Mock Data] Sections in store:', Array.from(dataStores.Section.values()).map(s => ({ id: s.id, owner: s.owner, name: s.name })));
  
  // Notify all Section subscribers about the new data
  if (activeSubscriptions.Section.length > 0) {
    const items = Array.from(dataStores.Section.values());
    const enhancedItems = items.map(item => addRelationshipAccessors(item, 'Section'));
    activeSubscriptions.Section.forEach(subscription => {
      console.log('[Mock Data] Notifying Section subscriber with', items.length, 'sections');
      setTimeout(() => {
        subscription.next({
          items: enhancedItems,
          isSynced: true,
        });
      }, 0);
    });
  } else {
    console.log('[Mock Data] No active Section subscriptions to notify yet');
  }
};

export const seedMockAssignments = (assignmentsArray) => {
  console.log(`[Mock Data] seedMockAssignments: Adding ${assignmentsArray.length} assignments`);
  assignmentsArray.forEach(assignment => {
    if (assignment.id) {
      dataStores.Assignment.set(assignment.id, assignment);
    }
  });
  console.log('[Mock Data] Total assignments in store:', dataStores.Assignment.size);
  
  // Notify all Assignment subscribers about the new data
  if (activeSubscriptions.Assignment.length > 0) {
    const items = Array.from(dataStores.Assignment.values());
    const enhancedItems = items.map(item => addRelationshipAccessors(item, 'Assignment'));
    activeSubscriptions.Assignment.forEach(subscription => {
      console.log('[Mock Data] Notifying Assignment subscriber with', items.length, 'assignments');
      setTimeout(() => {
        subscription.next({
          items: enhancedItems,
          isSynced: true,
        });
      }, 0);
    });
  }
};

export const seedMockSettings = (settingsData) => {
  console.log('[Mock Data] seedMockSettings: Adding settings', settingsData);
  if (!settingsData.id) {
    settingsData.id = 'settings-1';
  }
  dataStores.Settings.set(settingsData.id, settingsData);
  console.log('[Mock Data] Total settings in store:', dataStores.Settings.size);
  
  // Notify all Settings subscribers about the new data
  if (activeSubscriptions.Settings.length > 0) {
    const items = Array.from(dataStores.Settings.values());
    const enhancedItems = items.map(item => addRelationshipAccessors(item, 'Settings'));
    activeSubscriptions.Settings.forEach(subscription => {
      console.log('[Mock Data] Notifying Settings subscriber with', items.length, 'settings');
      setTimeout(() => {
        subscription.next({
          items: enhancedItems,
          isSynced: true,
        });
      }, 0);
    });
  }
};

export const seedMockAssistantChats = (chatsArray) => {
  console.log(`[Mock Data] seedMockAssistantChats: Replacing with ${chatsArray.length} assistant chats`);
  
  // Clear existing chats first to prevent story contamination
  dataStores.AssistantChat.clear();
  
  chatsArray.forEach(chat => {
    dataStores.AssistantChat.set(chat.id, chat);
  });
  
  // Notify all active AssistantChat subscriptions
  if (activeSubscriptions.AssistantChat.length > 0) {
    console.log(`[Mock Data] Notifying ${activeSubscriptions.AssistantChat.length} AssistantChat subscriptions`);
    const items = Array.from(dataStores.AssistantChat.values());
    const enhancedItems = items.map(item => addRelationshipAccessors(item, 'AssistantChat'));
    
    activeSubscriptions.AssistantChat.forEach(subscription => {
      setTimeout(() => {
        subscription.next({
          items: enhancedItems,
          isSynced: true,
        });
      }, 0);
    });
  }
};

/**
 * Clear all mock data from stores
 * Useful for resetting between stories
 */
export const clearMockData = () => {
  console.log('[Mock Data] Clearing all data stores');
  Object.values(dataStores).forEach(store => store.clear());
  
  // Clear mutation subscriptions
  Object.values(mutationSubscriptions).forEach(modelSubs => {
    modelSubs.onCreate = [];
    modelSubs.onUpdate = [];
    modelSubs.onDelete = [];
  });
  
  console.log('[Mock Data] All data stores cleared');
};

/**
 * Track active analysis timeouts for document processing simulation
 */
const activeAnalysisTimeouts = {};

/**
 * Simulate document analysis workflow for Storybook demos
 * Progressively updates document status: uploaded → extracting → extracted → analyzing → completed
 */
export const simulateDocumentAnalysis = (documentId) => {
  console.log('[Mock Data] Simulating analysis for document:', documentId);
  
  // Clear any existing timeouts for this document
  if (activeAnalysisTimeouts[documentId]) {
    activeAnalysisTimeouts[documentId].forEach(timeout => clearTimeout(timeout));
  }
  activeAnalysisTimeouts[documentId] = [];
  
  // Update to extracting
  const timeout1 = setTimeout(() => {
    const document = dataStores.Document.get(documentId);
    if (document) {
      const updated = { ...document, status: 'extracting' };
      dataStores.Document.set(documentId, updated);
      
      // Notify subscriptions
      if (activeSubscriptions.Document.length > 0) {
        const items = Array.from(dataStores.Document.values());
        const enhancedItems = items.map(item => addRelationshipAccessors(item, 'Document'));
        activeSubscriptions.Document.forEach(subscription => {
          subscription.next({ items: enhancedItems, isSynced: true });
        });
      }
    }
  }, 1000);
  activeAnalysisTimeouts[documentId].push(timeout1);
  
  // Update to extracted
  const timeout2 = setTimeout(() => {
    const document = dataStores.Document.get(documentId);
    if (document) {
      const updated = { 
        ...document, 
        status: 'extracted',
        pageCount: Math.floor(Math.random() * 50) + 10 
      };
      dataStores.Document.set(documentId, updated);
      
      if (activeSubscriptions.Document.length > 0) {
        const items = Array.from(dataStores.Document.values());
        const enhancedItems = items.map(item => addRelationshipAccessors(item, 'Document'));
        activeSubscriptions.Document.forEach(subscription => {
          subscription.next({ items: enhancedItems, isSynced: true });
        });
      }
    }
  }, 2500);
  activeAnalysisTimeouts[documentId].push(timeout2);
  
  // Update to analyzing
  const timeout3 = setTimeout(() => {
    const document = dataStores.Document.get(documentId);
    if (document) {
      const updated = { ...document, status: 'analyzing' };
      dataStores.Document.set(documentId, updated);
      
      if (activeSubscriptions.Document.length > 0) {
        const items = Array.from(dataStores.Document.values());
        const enhancedItems = items.map(item => addRelationshipAccessors(item, 'Document'));
        activeSubscriptions.Document.forEach(subscription => {
          subscription.next({ items: enhancedItems, isSynced: true });
        });
      }
    }
  }, 4000);
  activeAnalysisTimeouts[documentId].push(timeout3);
  
  // Update to completed
  const timeout4 = setTimeout(() => {
    const document = dataStores.Document.get(documentId);
    if (document) {
      const updated = { ...document, status: 'completed' };
      dataStores.Document.set(documentId, updated);
      
      if (activeSubscriptions.Document.length > 0) {
        const items = Array.from(dataStores.Document.values());
        const enhancedItems = items.map(item => addRelationshipAccessors(item, 'Document'));
        activeSubscriptions.Document.forEach(subscription => {
          subscription.next({ items: enhancedItems, isSynced: true });
        });
      }
      
      // Clean up timeouts
      delete activeAnalysisTimeouts[documentId];
    }
  }, 6000);
  activeAnalysisTimeouts[documentId].push(timeout4);
};

/**
 * Cancel document analysis workflow
 * Clears pending timeouts and resets status to 'uploaded'
 */
export const cancelDocumentAnalysis = (documentId) => {
  console.log('[Mock Data] Cancelling analysis for document:', documentId);
  
  // Clear all pending timeouts
  if (activeAnalysisTimeouts[documentId]) {
    activeAnalysisTimeouts[documentId].forEach(timeout => clearTimeout(timeout));
    delete activeAnalysisTimeouts[documentId];
  }
  
  // Reset status to uploaded
  const document = dataStores.Document.get(documentId);
  if (document) {
    const updated = { ...document, status: 'uploaded' };
    dataStores.Document.set(documentId, updated);
    
    if (activeSubscriptions.Document.length > 0) {
      const items = Array.from(dataStores.Document.values());
      const enhancedItems = items.map(item => addRelationshipAccessors(item, 'Document'));
      activeSubscriptions.Document.forEach(subscription => {
        subscription.next({ items: enhancedItems, isSynced: true });
      });
    }
  }
};
/**
 * Initialize default mock data for Storybook
 * Call this from preview.jsx to seed Gen 2 mock data
 */
export const initializeMockData = () => {
  console.log('[Mock Data Gen 2] Initializing mock data');
  
  // Seed AssistantChat data
  if (allChatData) {
    seedMockAssistantChats([allChatData]);
    console.log('[Mock Data Gen 2] Seeded AssistantChat:', allChatData.id);
  }
  
  // Seed Files and Documents
  if (initialMockFiles && initialMockFiles.length > 0) {
    seedMockFiles(initialMockFiles);
    console.log('[Mock Data Gen 2] Seeded Files:', initialMockFiles.length);
  }
  
  if (initialMockDocuments && initialMockDocuments.length > 0) {
    seedMockDocuments(initialMockDocuments);
    console.log('[Mock Data Gen 2] Seeded Documents:', initialMockDocuments.length);
  }
};

/**
 * Export data stores as plain objects for backward compatibility
 * Some stories and utilities access these directly (e.g., mockDocuments[id])
 * These are proxies to the Map-based stores
 */
export const mockUnits = new Proxy({}, {
  get: (target, prop) => dataStores.Unit.get(prop),
  set: (target, prop, value) => { dataStores.Unit.set(prop, value); return true; },
  deleteProperty: (target, prop) => { dataStores.Unit.delete(prop); return true; },
  has: (target, prop) => dataStores.Unit.has(prop),
  ownKeys: () => Array.from(dataStores.Unit.keys()),
  getOwnPropertyDescriptor: (target, prop) => dataStores.Unit.has(prop) ? { enumerable: true, configurable: true } : undefined
});

export const mockGrades = new Proxy({}, {
  get: (target, prop) => dataStores.Grade.get(prop),
  set: (target, prop, value) => { dataStores.Grade.set(prop, value); return true; },
  deleteProperty: (target, prop) => { dataStores.Grade.delete(prop); return true; },
  has: (target, prop) => dataStores.Grade.has(prop),
  ownKeys: () => Array.from(dataStores.Grade.keys()),
  getOwnPropertyDescriptor: (target, prop) => dataStores.Grade.has(prop) ? { enumerable: true, configurable: true } : undefined
});

export const mockFiles = new Proxy({}, {
  get: (target, prop) => dataStores.File.get(prop),
  set: (target, prop, value) => { dataStores.File.set(prop, value); return true; },
  deleteProperty: (target, prop) => { dataStores.File.delete(prop); return true; },
  has: (target, prop) => dataStores.File.has(prop),
  ownKeys: () => Array.from(dataStores.File.keys()),
  getOwnPropertyDescriptor: (target, prop) => dataStores.File.has(prop) ? { enumerable: true, configurable: true } : undefined
});

export const mockDocuments = new Proxy({}, {
  get: (target, prop) => dataStores.Document.get(prop),
  set: (target, prop, value) => { dataStores.Document.set(prop, value); return true; },
  deleteProperty: (target, prop) => { dataStores.Document.delete(prop); return true; },
  has: (target, prop) => dataStores.Document.has(prop),
  ownKeys: () => Array.from(dataStores.Document.keys()),
  getOwnPropertyDescriptor: (target, prop) => dataStores.Document.has(prop) ? { enumerable: true, configurable: true } : undefined
});

export const mockParsedContent = new Proxy({}, {
  get: (target, prop) => dataStores.ParsedContent.get(prop),
  set: (target, prop, value) => { dataStores.ParsedContent.set(prop, value); return true; },
  deleteProperty: (target, prop) => { dataStores.ParsedContent.delete(prop); return true; },
  has: (target, prop) => dataStores.ParsedContent.has(prop),
  ownKeys: () => Array.from(dataStores.ParsedContent.keys()),
  getOwnPropertyDescriptor: (target, prop) => dataStores.ParsedContent.has(prop) ? { enumerable: true, configurable: true } : undefined
});

export const mockWords = new Proxy({}, {
  get: (target, prop) => dataStores.Word.get(prop),
  set: (target, prop, value) => { dataStores.Word.set(prop, value); return true; },
  deleteProperty: (target, prop) => { dataStores.Word.delete(prop); return true; },
  has: (target, prop) => dataStores.Word.has(prop),
  ownKeys: () => Array.from(dataStores.Word.keys()),
  getOwnPropertyDescriptor: (target, prop) => dataStores.Word.has(prop) ? { enumerable: true, configurable: true } : undefined
});

export const mockQuestions = new Proxy({}, {
  get: (target, prop) => dataStores.Question.get(prop),
  set: (target, prop, value) => { dataStores.Question.set(prop, value); return true; },
  deleteProperty: (target, prop) => { dataStores.Question.delete(prop); return true; },
  has: (target, prop) => dataStores.Question.has(prop),
  ownKeys: () => Array.from(dataStores.Question.keys()),
  getOwnPropertyDescriptor: (target, prop) => dataStores.Question.has(prop) ? { enumerable: true, configurable: true } : undefined
});

export const mockSections = new Proxy({}, {
  get: (target, prop) => dataStores.Section.get(prop),
  set: (target, prop, value) => { dataStores.Section.set(prop, value); return true; },
  deleteProperty: (target, prop) => { dataStores.Section.delete(prop); return true; },
  has: (target, prop) => dataStores.Section.has(prop),
  ownKeys: () => Array.from(dataStores.Section.keys()),
  getOwnPropertyDescriptor: (target, prop) => dataStores.Section.has(prop) ? { enumerable: true, configurable: true } : undefined
});

export const mockAssignments = new Proxy({}, {
  get: (target, prop) => dataStores.Assignment.get(prop),
  set: (target, prop, value) => { dataStores.Assignment.set(prop, value); return true; },
  deleteProperty: (target, prop) => { dataStores.Assignment.delete(prop); return true; },
  has: (target, prop) => dataStores.Assignment.has(prop),
  ownKeys: () => Array.from(dataStores.Assignment.keys()),
  getOwnPropertyDescriptor: (target, prop) => dataStores.Assignment.has(prop) ? { enumerable: true, configurable: true } : undefined
});

export const mockSettings = new Proxy({}, {
  get: (target, prop) => dataStores.Settings.get(prop),
  set: (target, prop, value) => { dataStores.Settings.set(prop, value); return true; },
  deleteProperty: (target, prop) => { dataStores.Settings.delete(prop); return true; },
  has: (target, prop) => dataStores.Settings.has(prop),
  ownKeys: () => Array.from(dataStores.Settings.keys()),
  getOwnPropertyDescriptor: (target, prop) => dataStores.Settings.has(prop) ? { enumerable: true, configurable: true } : undefined
});

export const mockAssistantChats = new Proxy({}, {
  get: (target, prop) => dataStores.AssistantChat.get(prop),
  set: (target, prop, value) => { dataStores.AssistantChat.set(prop, value); return true; },
  deleteProperty: (target, prop) => { dataStores.AssistantChat.delete(prop); return true; },
  has: (target, prop) => dataStores.AssistantChat.has(prop),
  ownKeys: () => Array.from(dataStores.AssistantChat.keys()),
  getOwnPropertyDescriptor: (target, prop) => dataStores.AssistantChat.has(prop) ? { enumerable: true, configurable: true } : undefined
});