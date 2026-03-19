/**
 * DictionaryEditor2 Integration Tests
 * 
 * Tests the complete dictionary management workflow including:
 * - Adding/editing/deleting vocabulary words
 * - Importing words from documents
 * - Audio file upload and playback
 * - Search and filter functionality
 * - Bulk operations
 * 
 * Usage:
 *   npm test test/integration/dictionary-editor.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DictionaryEditor2 } from '../../src/components/DictionaryEditor2';
import DictionaryContext from '../../src/context/dictionaryContext';
import FilesContext from '../../src/context/fileContext';
import UnitContext from '../../src/context/unitContext';

// Mock Amplify modules
vi.mock('aws-amplify/datastore', () => ({
  DataStore: {
    observeQuery: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('aws-amplify/storage', () => ({
  uploadData: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('../../src/utils/amplifyClient', () => ({
  getAmplifyClient: vi.fn(() => ({
    models: {
      Word: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      },
      UnitWord: {
        create: vi.fn(),
        delete: vi.fn(),
      },
    },
  })),
}));

vi.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('DictionaryEditor2 Integration Tests', () => {
  let mockWords: any[] = [];
  let mockFiles: any[] = [];
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockWords = [
      {
        id: 'word-1',
        phrase: 'こんにちは',
        pronunciation: 'konnichiwa',
        phonetic: 'ko-n-ni-chi-wa',
        definition: 'hello',
        audio: ['public/audio/konnichiwa.mp3'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'word-2',
        phrase: 'ありがとう',
        pronunciation: 'arigatou',
        phonetic: 'a-ri-ga-to-u',
        definition: 'thank you',
        audio: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    mockFiles = [
      {
        id: 'file-1',
        name: 'hello.mp3',
        path: 'public/audio/hello.mp3',
        mimeType: 'audio/mpeg',
      },
    ];

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderDictionaryEditor = (overrides = {}) => {
    const dictionaryValue = {
      words: mockWords,
      setWords: vi.fn(),
      selectedWord: null,
      setSelectedWord: vi.fn(),
      addWord: vi.fn(),
      updateWord: vi.fn(),
      deleteWord: vi.fn(),
      searchTerm: '',
      setSearchTerm: vi.fn(),
      ...overrides,
    };

    const filesValue = {
      files: mockFiles,
      uploadFile: vi.fn(),
      deleteFile: vi.fn(),
    };

    const unitValue = {
      currentUnit: { id: 'unit-1', name: 'Test Unit' },
      session: { username: 'testuser', identityId: 'test-identity' },
    };

    return render(
      <UnitContext.Provider value={unitValue as any}>
        <FilesContext.Provider value={filesValue as any}>
          <DictionaryContext.Provider value={dictionaryValue as any}>
            <DictionaryEditor2 />
          </DictionaryContext.Provider>
        </FilesContext.Provider>
      </UnitContext.Provider>
    );
  };

  // ==========================================================================
  // Basic CRUD Operations
  // ==========================================================================

  it('displays list of vocabulary words', async () => {
    renderDictionaryEditor();

    await waitFor(() => {
      expect(screen.getByText('こんにちは')).toBeInTheDocument();
      expect(screen.getByText('ありがとう')).toBeInTheDocument();
    });
  });

  it('adds a new vocabulary word', async () => {
    const addWord = vi.fn();
    renderDictionaryEditor({ addWord });

    // Click add word button
    const addButton = screen.getByRole('button', { name: /create.*word/i });
    await user.click(addButton);

    // Fill in the form (assuming dialog opens)
    await waitFor(() => {
      expect(screen.getByLabelText(/phrase/i)).toBeInTheDocument();
    });

    const phraseInput = screen.getByLabelText(/phrase/i);
    const pronunciationInput = screen.getByLabelText(/pronunciation/i);
    const definitionInput = screen.getByLabelText(/definition/i);

    await user.type(phraseInput, 'さようなら');
    await user.type(pronunciationInput, 'sayounara');
    await user.type(definitionInput, 'goodbye');

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(addWord).toHaveBeenCalledWith(
        expect.objectContaining({
          phrase: 'さようなら',
          pronunciation: 'sayounara',
          definition: 'goodbye',
        })
      );
    });
  });

  it('edits an existing vocabulary word', async () => {
    const updateWord = vi.fn();
    const setSelectedWord = vi.fn();
    renderDictionaryEditor({ updateWord, setSelectedWord });

    // Click on a word card to edit
    const wordCard = screen.getByText('こんにちは');
    await user.click(wordCard);

    await waitFor(() => {
      expect(setSelectedWord).toHaveBeenCalledWith(
        expect.objectContaining({ phrase: 'こんにちは' })
      );
    });
  });

  it('deletes a vocabulary word', async () => {
    const deleteWord = vi.fn();
    renderDictionaryEditor({ deleteWord, words: mockWords });

    // Find and click delete button for first word
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    // Confirm deletion if confirmation dialog appears
    const confirmButton = await screen.findByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(deleteWord).toHaveBeenCalledWith('word-1');
    });
  });

  // ==========================================================================
  // Audio Recording and Upload
  // ==========================================================================

  it('uploads audio file for vocabulary word', async () => {
    const { uploadData } = await import('aws-amplify/storage');
    const mockUploadData = vi.mocked(uploadData);
    mockUploadData.mockReturnValue({
      result: Promise.resolve({ path: 'public/audio/test.mp3' }),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      state: 'SUCCESS',
    } as any);

    renderDictionaryEditor();

    // Click on word to edit
    await user.click(screen.getByText('こんにちは'));

    // Click audio recording button
    const audioButton = await screen.findByRole('button', { name: /mic|audio|record/i });
    await user.click(audioButton);

    // Wait for recording studio to open
    await waitFor(() => {
      expect(screen.getByText(/recording|studio/i)).toBeInTheDocument();
    });

    // Simulate file upload
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    const fileInput = screen.getByLabelText(/upload.*file/i);
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockUploadData).toHaveBeenCalled();
    });
  });

  it('plays audio for vocabulary word', async () => {
    global.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);

    renderDictionaryEditor();

    // Find word with audio
    const wordWithAudio = screen.getByText('こんにちは');
    const wordCard = wordWithAudio.closest('[role="listitem"]') || wordWithAudio.parentElement;

    // Find and click play button
    const playButton = within(wordCard as HTMLElement).getByRole('button', { name: /play/i });
    await user.click(playButton);

    await waitFor(() => {
      expect(global.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Search and Filter
  // ==========================================================================

  it('searches vocabulary words', async () => {
    const setSearchTerm = vi.fn();
    renderDictionaryEditor({ setSearchTerm });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'hello');

    await waitFor(() => {
      expect(setSearchTerm).toHaveBeenCalledWith('hello');
    });
  });

  it('filters vocabulary by words with audio', async () => {
    renderDictionaryEditor();

    const filterButton = screen.getByRole('button', { name: /filter|has audio/i });
    await user.click(filterButton);

    // Should only show words with audio
    await waitFor(() => {
      expect(screen.getByText('こんにちは')).toBeInTheDocument();
      expect(screen.queryByText('ありがとう')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Bulk Operations
  // ==========================================================================

  it('selects multiple words', async () => {
    renderDictionaryEditor();

    // Find checkboxes for words
    const checkboxes = screen.getAllByRole('checkbox');
    
    // Select first two words
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    await waitFor(() => {
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();
    });
  });

  it('selects all words', async () => {
    renderDictionaryEditor();

    const selectAllButton = screen.getByRole('button', { name: /select all/i });
    await user.click(selectAllButton);

    const checkboxes = screen.getAllByRole('checkbox');
    await waitFor(() => {
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });
  });

  it('deletes multiple selected words', async () => {
    const deleteWord = vi.fn();
    renderDictionaryEditor({ deleteWord });

    // Select multiple words
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    // Click bulk delete
    const deleteButton = screen.getByRole('button', { name: /delete selected/i });
    await user.click(deleteButton);

    // Confirm deletion
    const confirmButton = await screen.findByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(deleteWord).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // Document Import
  // ==========================================================================

  it('imports words from document', async () => {
    const addWord = vi.fn();
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();

    // Mock parsed content query
    mockClient.models.ParsedContent = {
      list: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'parsed-1',
            content: JSON.stringify({
              vocabulary: [
                { phrase: '日本', pronunciation: 'nihon', definition: 'Japan' },
                { phrase: '東京', pronunciation: 'toukyou', definition: 'Tokyo' },
              ],
            }),
          },
        ],
      }),
    } as any;

    renderDictionaryEditor({ addWord });

    // Click import from document button
    const importButton = screen.getByRole('button', { name: /import.*document/i });
    await user.click(importButton);

    // Select document from list
    await waitFor(() => {
      expect(screen.getByText(/select document/i)).toBeInTheDocument();
    });

    const documentOption = screen.getByText(/lesson-1.pdf/i);
    await user.click(documentOption);

    // Confirm import
    const confirmImportButton = screen.getByRole('button', { name: /import/i });
    await user.click(confirmImportButton);

    await waitFor(() => {
      expect(addWord).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // Ruby Tag Editor
  // ==========================================================================

  it('creates ruby tags for pronunciation', async () => {
    const updateWord = vi.fn();
    renderDictionaryEditor({ updateWord });

    // Click on word to edit
    await user.click(screen.getByText('こんにちは'));

    // Open ruby tag editor
    const rubyButton = await screen.findByRole('button', { name: /ruby/i });
    await user.click(rubyButton);

    await waitFor(() => {
      expect(screen.getByText(/ruby tag editor/i)).toBeInTheDocument();
    });

    // Select text in pronunciation field
    const pronunciationField = screen.getByLabelText(/pronunciation.*select first/i);
    await user.type(pronunciationField, 'kon');

    // Select corresponding text in phrase field
    const phraseField = screen.getByLabelText(/phrase.*select second/i);
    await user.type(phraseField, 'こん');

    // Save ruby tags
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(updateWord).toHaveBeenCalledWith(
        expect.objectContaining({
          phrase: expect.stringContaining('<ruby>'),
        })
      );
    });
  });

  // ==========================================================================
  // Virtual Scrolling
  // ==========================================================================

  it('handles large vocabulary lists with virtual scrolling', async () => {
    const largeWordList = Array.from({ length: 1000 }, (_, i) => ({
      id: `word-${i}`,
      phrase: `Word ${i}`,
      pronunciation: `word-${i}`,
      definition: `Definition ${i}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    renderDictionaryEditor({ words: largeWordList });

    // Should render only visible items, not all 1000
    await waitFor(() => {
      const visibleItems = screen.getAllByRole('listitem');
      expect(visibleItems.length).toBeLessThan(100);
    });

    // First item should be visible
    expect(screen.getByText('Word 0')).toBeInTheDocument();
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  it('handles save errors gracefully', async () => {
    const addWord = vi.fn().mockRejectedValue(new Error('Network error'));
    renderDictionaryEditor({ addWord });

    // Try to add word
    const addButton = screen.getByRole('button', { name: /create.*word/i });
    await user.click(addButton);

    // Fill form
    await user.type(await screen.findByLabelText(/phrase/i), 'test');
    await user.type(screen.getByLabelText(/pronunciation/i), 'test');
    await user.type(screen.getByLabelText(/definition/i), 'test');

    // Submit
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    renderDictionaryEditor();

    const addButton = screen.getByRole('button', { name: /create.*word/i });
    await user.click(addButton);

    // Try to save without filling required fields
    const saveButton = await screen.findByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/required|must provide/i)).toBeInTheDocument();
    });
  });
});
