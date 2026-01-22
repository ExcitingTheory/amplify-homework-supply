/**
 * Unit tests for vocabularyImportUtils.js
 * Tests vocabulary import from ParsedContent to Word dictionary
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AWS Amplify DataStore
const mockDataStoreSave = vi.fn();
const mockDataStoreQuery = vi.fn();
const mockWord = vi.fn();
const mockUnitWord = vi.fn();
const mockParsedContent = vi.fn();

vi.mock('aws-amplify/datastore', () => ({
  DataStore: {
    save: mockDataStoreSave,
    query: mockDataStoreQuery,
  },
}));

vi.mock('../../models', () => ({
  Word: class Word {
    constructor(data) {
      return mockWord(data);
    }
    static copyOf(instance, updater) {
      const updated = { ...instance };
      updater(updated);
      return updated;
    }
  },
  UnitWord: class UnitWord {
    constructor(data) {
      return mockUnitWord(data);
    }
  },
  ParsedContent: class ParsedContent {
    constructor(data) {
      return mockParsedContent(data);
    }
    static copyOf(instance, updater) {
      const updated = { ...instance };
      updater(updated);
      return updated;
    }
  },
}));

import {
  findExistingWord,
  createWord,
  linkWordToUnit,
  importVocabularyToUnit,
  getVocabularyImportStatus,
  updateVocabularyItem,
} from '../vocabularyImportUtils.js';

describe('vocabularyImportUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('findExistingWord', () => {
    it('should find exact match ignoring case and whitespace', async () => {
      const phrase = '  Hello World  ';
      const owner = 'user-123';
      
      const existingWords = [
        { id: 'word-1', phrase: 'hello world', owner: 'user-123' },
        { id: 'word-2', phrase: 'Hello', owner: 'user-123' },
      ];
      
      mockDataStoreQuery.mockResolvedValue(existingWords);
      
      const result = await findExistingWord(phrase, owner);
      
      expect(result).toEqual(existingWords[0]);
      expect(mockDataStoreQuery).toHaveBeenCalled();
    });
    
    it('should return null when no match found', async () => {
      mockDataStoreQuery.mockResolvedValue([]);
      
      const result = await findExistingWord('nonexistent', 'user-123');
      
      expect(result).toBeNull();
    });
    
    it('should handle case-insensitive matching', async () => {
      const existingWords = [
        { id: 'word-1', phrase: 'HELLO', owner: 'user-123' },
      ];
      
      mockDataStoreQuery.mockResolvedValue(existingWords);
      
      const result = await findExistingWord('hello', 'user-123');
      
      expect(result).toEqual(existingWords[0]);
    });
  });
  
  describe('createWord', () => {
    it('should create new word with vocabulary item data', async () => {
      const vocabularyItem = {
        word: 'こんにちは',
        definition: 'Hello/Good afternoon',
        context: 'Greeting used during the day',
        page: 5,
      };
      const owner = 'user-123';
      const identityId = 'us-east-1:abc123';
      
      const createdWord = {
        id: 'word-new',
        phrase: 'こんにちは',
        definition: 'Hello/Good afternoon',
        owner: 'user-123',
        identityId: 'us-east-1:abc123',
      };
      
      mockWord.mockReturnValue(createdWord);
      mockDataStoreSave.mockResolvedValue(createdWord);
      
      const result = await createWord(vocabularyItem, owner, identityId);
      
      expect(mockWord).toHaveBeenCalledWith({
        phrase: 'こんにちは',
        definition: 'Hello/Good afternoon',
        owner: 'user-123',
        identityId: 'us-east-1:abc123',
      });
      expect(result).toEqual(createdWord);
    });
    
    it('should handle missing optional fields', async () => {
      const vocabularyItem = {
        word: 'test',
        definition: 'test definition',
      };
      
      const createdWord = { id: 'word-1' };
      mockWord.mockReturnValue(createdWord);
      mockDataStoreSave.mockResolvedValue(createdWord);
      
      await createWord(vocabularyItem, 'owner', 'identity');
      
      expect(mockWord).toHaveBeenCalledWith(
        expect.objectContaining({
          phrase: 'test',
          definition: 'test definition',
        })
      );
    });
  });
  
  describe('linkWordToUnit', () => {
    it('should create new UnitWord relationship', async () => {
      const wordId = 'word-123';
      const unitId = 'unit-456';
      const owner = 'user-789';
      
      mockDataStoreQuery.mockResolvedValue([]); // No existing relationship
      
      const unitWord = {
        id: 'unitword-1',
        wordId: 'word-123',
        unitId: 'unit-456',
        owner: 'user-789',
      };
      
      mockUnitWord.mockReturnValue(unitWord);
      mockDataStoreSave.mockResolvedValue(unitWord);
      
      const result = await linkWordToUnit(wordId, unitId, owner);
      
      expect(mockUnitWord).toHaveBeenCalledWith({
        wordId: 'word-123',
        unitId: 'unit-456',
        owner: 'user-789',
      });
      expect(result).toEqual(unitWord);
    });
    
    it('should return existing relationship if already linked', async () => {
      const wordId = 'word-123';
      const unitId = 'unit-456';
      const owner = 'user-789';
      
      const existingLink = {
        id: 'unitword-existing',
        wordId: 'word-123',
        unitId: 'unit-456',
      };
      
      mockDataStoreQuery.mockResolvedValue([existingLink]);
      
      const result = await linkWordToUnit(wordId, unitId, owner);
      
      expect(result).toEqual(existingLink);
      expect(mockDataStoreSave).not.toHaveBeenCalled();
    });
  });
  
  describe('importVocabularyToUnit', () => {
    const mockParsedContentData = {
      id: 'parsed-123',
      vocabularyJSON: JSON.stringify([
        { word: 'hello', definition: 'greeting', context: 'test', page: 1 },
        { word: 'goodbye', definition: 'farewell', context: 'test', page: 2 },
        { word: 'thanks', definition: 'gratitude', context: 'test', page: 3 },
      ]),
    };
    
    it('should import all vocabulary items when no selection provided', async () => {
      mockDataStoreQuery
        .mockResolvedValueOnce([mockParsedContentData]) // ParsedContent query
        .mockResolvedValue([]); // No existing words
      
      mockWord.mockImplementation((data) => ({
        id: `word-${data.phrase}`,
        ...data,
      }));
      
      mockDataStoreSave.mockImplementation((data) => Promise.resolve(data));
      
      const onProgress = vi.fn();
      
      const result = await importVocabularyToUnit(
        'parsed-123',
        'unit-456',
        null,
        'user-789',
        'identity-123',
        onProgress
      );
      
      expect(result.success).toBe(true);
      expect(result.imported).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
      expect(onProgress).toHaveBeenCalledTimes(4); // 3 items + completion
    });
    
    it('should import only selected vocabulary items', async () => {
      mockDataStoreQuery
        .mockResolvedValueOnce([mockParsedContentData])
        .mockResolvedValue([]);
      
      mockWord.mockImplementation((data) => ({
        id: `word-${data.phrase}`,
        ...data,
      }));
      
      mockDataStoreSave.mockResolvedValue({});
      
      const selectedIndices = [0, 2]; // Import 'hello' and 'thanks'
      
      const result = await importVocabularyToUnit(
        'parsed-123',
        'unit-456',
        selectedIndices,
        'user-789',
        'identity-123'
      );
      
      expect(result.imported).toBe(2);
      expect(result.importedWords).toHaveLength(2);
      expect(result.importedWords[0].phrase).toBe('hello');
      expect(result.importedWords[1].phrase).toBe('thanks');
    });
    
    it('should skip existing words and count as skipped', async () => {
      mockDataStoreQuery
        .mockResolvedValueOnce([mockParsedContentData])
        .mockResolvedValueOnce([{ id: 'existing-1', phrase: 'hello' }]) // 'hello' exists
        .mockResolvedValueOnce([]) // 'goodbye' doesn't exist
        .mockResolvedValueOnce([]); // 'thanks' doesn't exist
      
      mockWord.mockImplementation((data) => ({
        id: `word-${data.phrase}`,
        ...data,
      }));
      
      mockDataStoreSave.mockResolvedValue({});
      
      const result = await importVocabularyToUnit(
        'parsed-123',
        'unit-456',
        null,
        'user-789',
        'identity-123'
      );
      
      expect(result.imported).toBe(2); // goodbye, thanks
      expect(result.skipped).toBe(1); // hello
    });
    
    it('should handle errors gracefully and continue', async () => {
      mockDataStoreQuery
        .mockResolvedValueOnce([mockParsedContentData])
        .mockResolvedValue([]);
      
      mockWord.mockImplementation((data) => ({
        id: `word-${data.phrase}`,
        ...data,
      }));
      
      mockDataStoreSave
        .mockResolvedValueOnce({ id: 'word-1' }) // First word succeeds
        .mockRejectedValueOnce(new Error('Database error')) // Second word fails
        .mockResolvedValueOnce({ id: 'word-3' }); // Third word succeeds
      
      const result = await importVocabularyToUnit(
        'parsed-123',
        'unit-456',
        null,
        'user-789',
        'identity-123'
      );
      
      expect(result.imported).toBe(2);
      expect(result.errors).toBe(1);
      expect(result.errorDetails).toHaveLength(1);
      expect(result.errorDetails[0].word).toBe('goodbye');
    });
    
    it('should mark ParsedContent as imported after successful import', async () => {
      mockDataStoreQuery
        .mockResolvedValueOnce([mockParsedContentData])
        .mockResolvedValue([]);
      
      mockWord.mockImplementation((data) => ({ id: 'word', ...data }));
      mockDataStoreSave.mockResolvedValue({});
      
      await importVocabularyToUnit(
        'parsed-123',
        'unit-456',
        null,
        'user-789',
        'identity-123'
      );
      
      // Check that ParsedContent.copyOf was called to update approval
      const lastSaveCall = mockDataStoreSave.mock.calls[mockDataStoreSave.mock.calls.length - 1][0];
      expect(lastSaveCall.approved).toBe(true);
      expect(lastSaveCall.importedAt).toBeDefined();
    });
    
    it('should handle ParsedContent not found', async () => {
      mockDataStoreQuery.mockResolvedValue([]);
      
      const result = await importVocabularyToUnit(
        'nonexistent',
        'unit-456',
        null,
        'user-789',
        'identity-123'
      );
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Import failed');
    });
    
    it('should handle empty vocabulary list', async () => {
      mockDataStoreQuery.mockResolvedValue([{
        id: 'parsed-empty',
        vocabularyJSON: JSON.stringify([]),
      }]);
      
      const result = await importVocabularyToUnit(
        'parsed-empty',
        'unit-456',
        null,
        'user-789',
        'identity-123'
      );
      
      expect(result.success).toBe(true);
      expect(result.imported).toBe(0);
      expect(result.message).toContain('No vocabulary items');
    });
    
    it('should call progress callback with correct values', async () => {
      mockDataStoreQuery
        .mockResolvedValueOnce([mockParsedContentData])
        .mockResolvedValue([]);
      
      mockWord.mockImplementation((data) => ({ id: 'word', ...data }));
      mockDataStoreSave.mockResolvedValue({});
      
      const onProgress = vi.fn();
      
      await importVocabularyToUnit(
        'parsed-123',
        'unit-456',
        null,
        'user-789',
        'identity-123',
        onProgress
      );
      
      // Progress should be called for each item + completion
      expect(onProgress).toHaveBeenCalledWith(1, 3, expect.stringContaining('hello'));
      expect(onProgress).toHaveBeenCalledWith(2, 3, expect.stringContaining('goodbye'));
      expect(onProgress).toHaveBeenCalledWith(3, 3, expect.stringContaining('thanks'));
      expect(onProgress).toHaveBeenCalledWith(3, 3, expect.stringContaining('Import complete'));
    });
  });
  
  describe('getVocabularyImportStatus', () => {
    it('should return status for imported ParsedContent', async () => {
      const parsedContent = {
        id: 'parsed-123',
        vocabularyJSON: JSON.stringify([
          { word: 'test1', definition: 'def1' },
          { word: 'test2', definition: 'def2' },
        ]),
        approved: true,
        importedAt: '2026-01-21T12:00:00Z',
      };
      
      mockDataStoreQuery.mockResolvedValue([parsedContent]);
      
      const result = await getVocabularyImportStatus('parsed-123');
      
      expect(result.found).toBe(true);
      expect(result.imported).toBe(true);
      expect(result.approved).toBe(true);
      expect(result.importedAt).toBe('2026-01-21T12:00:00Z');
      expect(result.itemCount).toBe(2);
      expect(result.vocabularyItems).toHaveLength(2);
    });
    
    it('should return status for non-imported ParsedContent', async () => {
      const parsedContent = {
        id: 'parsed-456',
        vocabularyJSON: JSON.stringify([{ word: 'test', definition: 'def' }]),
        approved: false,
        importedAt: null,
      };
      
      mockDataStoreQuery.mockResolvedValue([parsedContent]);
      
      const result = await getVocabularyImportStatus('parsed-456');
      
      expect(result.found).toBe(true);
      expect(result.imported).toBe(false);
      expect(result.approved).toBe(false);
      expect(result.itemCount).toBe(1);
    });
    
    it('should handle ParsedContent not found', async () => {
      mockDataStoreQuery.mockResolvedValue([]);
      
      const result = await getVocabularyImportStatus('nonexistent');
      
      expect(result.found).toBe(false);
      expect(result.imported).toBe(false);
      expect(result.itemCount).toBe(0);
    });
    
    it('should handle null vocabularyJSON', async () => {
      mockDataStoreQuery.mockResolvedValue([{
        id: 'parsed-empty',
        vocabularyJSON: null,
      }]);
      
      const result = await getVocabularyImportStatus('parsed-empty');
      
      expect(result.itemCount).toBe(0);
      expect(result.vocabularyItems).toEqual([]);
    });
  });
  
  describe('updateVocabularyItem', () => {
    it('should update vocabulary item at specified index', async () => {
      const parsedContent = {
        id: 'parsed-123',
        vocabularyJSON: JSON.stringify([
          { word: 'old', definition: 'old def', context: 'old context', page: 1 },
          { word: 'test', definition: 'test def', context: 'test context', page: 2 },
        ]),
      };
      
      mockDataStoreQuery.mockResolvedValue([parsedContent]);
      mockDataStoreSave.mockResolvedValue({});
      
      const updates = {
        word: 'new',
        definition: 'new def',
      };
      
      const result = await updateVocabularyItem('parsed-123', 0, updates);
      
      expect(result).toBe(true);
      
      // Verify the saved data has updated item
      const savedData = mockDataStoreSave.mock.calls[0][0];
      const vocabularyItems = JSON.parse(savedData.vocabularyJSON);
      expect(vocabularyItems[0].word).toBe('new');
      expect(vocabularyItems[0].definition).toBe('new def');
      expect(vocabularyItems[0].context).toBe('old context'); // Unchanged
      expect(vocabularyItems[1].word).toBe('test'); // Other items unchanged
    });
    
    it('should merge updates with existing item data', async () => {
      const parsedContent = {
        id: 'parsed-123',
        vocabularyJSON: JSON.stringify([
          { word: 'test', definition: 'original', context: 'ctx', page: 5 },
        ]),
      };
      
      mockDataStoreQuery.mockResolvedValue([parsedContent]);
      mockDataStoreSave.mockResolvedValue({});
      
      await updateVocabularyItem('parsed-123', 0, { definition: 'updated' });
      
      const savedData = mockDataStoreSave.mock.calls[0][0];
      const vocabularyItems = JSON.parse(savedData.vocabularyJSON);
      expect(vocabularyItems[0].word).toBe('test');
      expect(vocabularyItems[0].definition).toBe('updated');
      expect(vocabularyItems[0].context).toBe('ctx');
      expect(vocabularyItems[0].page).toBe(5);
    });
    
    it('should return false for invalid item index', async () => {
      const parsedContent = {
        id: 'parsed-123',
        vocabularyJSON: JSON.stringify([
          { word: 'test', definition: 'def' },
        ]),
      };
      
      mockDataStoreQuery.mockResolvedValue([parsedContent]);
      
      const result = await updateVocabularyItem('parsed-123', 5, { word: 'new' });
      
      expect(result).toBe(false);
      expect(mockDataStoreSave).not.toHaveBeenCalled();
    });
    
    it('should return false for negative index', async () => {
      const parsedContent = {
        id: 'parsed-123',
        vocabularyJSON: JSON.stringify([{ word: 'test', definition: 'def' }]),
      };
      
      mockDataStoreQuery.mockResolvedValue([parsedContent]);
      
      const result = await updateVocabularyItem('parsed-123', -1, { word: 'new' });
      
      expect(result).toBe(false);
    });
    
    it('should return false when ParsedContent not found', async () => {
      mockDataStoreQuery.mockResolvedValue([]);
      
      const result = await updateVocabularyItem('nonexistent', 0, { word: 'new' });
      
      expect(result).toBe(false);
    });
  });
});
