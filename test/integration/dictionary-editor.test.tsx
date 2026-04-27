/**
 * DictionaryEditor2 Integration Tests
 *
 * Tests the dictionary editor toolbar and dialog workflows.
 * Note: Word list items render inside a Lexical editor via decorator nodes,
 * so individual word interaction tests are limited to Lexical-compatible queries.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

const mockWordCreate = vi.fn();
const mockWordUpdate = vi.fn();
const mockWordDelete = vi.fn();
const mockWordList = vi.fn();
const mockUnitWordCreate = vi.fn();
const mockUnitWordDelete = vi.fn();

vi.mock('../../src/utils/amplifyClient', () => ({
  getAmplifyClient: vi.fn(() => ({
    models: {
      Word: {
        create: mockWordCreate,
        update: mockWordUpdate,
        delete: mockWordDelete,
        list: mockWordList,
      },
      UnitWord: {
        create: mockUnitWordCreate,
        delete: mockUnitWordDelete,
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

vi.mock('../../src/context/tabContext', () => ({
  useTabContext: () => null,
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
      dictionary: mockWords,
      filteredDictionary: mockWords.reduce((acc: any, w: any) => { acc[w.id] = w; return acc; }, {}),
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
      audioFiles: mockFiles,
      uploadFile: vi.fn(),
      deleteFile: vi.fn(),
      refreshAudioFiles: vi.fn(),
      session: { username: 'testuser', identityId: 'test-identity' },
    };

    const unitValue = {
      currentUnit: { id: 'unit-1', name: 'Test Unit' },
      unit: { id: 'unit-1', name: 'Test Unit' },
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
  // Toolbar
  // ==========================================================================

  it('renders toolbar with search input', async () => {
    renderDictionaryEditor();
    const searchInput = screen.getByPlaceholderText('Search words...');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders new word button', async () => {
    renderDictionaryEditor();
    const newWordButton = screen.getByRole('button', { name: /newWordButton/i });
    expect(newWordButton).toBeInTheDocument();
  });

  it('renders expand all button', async () => {
    renderDictionaryEditor();
    const expandAllButton = screen.getByRole('button', { name: /expandAll/i });
    expect(expandAllButton).toBeInTheDocument();
  });

  it('renders select all checkbox', async () => {
    renderDictionaryEditor();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  // ==========================================================================
  // Search
  // ==========================================================================

  it('allows typing in search input', async () => {
    renderDictionaryEditor();
    const searchInput = screen.getByPlaceholderText('Search words...');
    await user.type(searchInput, 'hello');
    expect(searchInput).toHaveValue('hello');
  });

  // ==========================================================================
  // New Word Dialog
  // ==========================================================================

  it('opens new word dialog when button is clicked', async () => {
    renderDictionaryEditor();
    const newWordButton = screen.getByRole('button', { name: /newWordButton/i });
    await user.click(newWordButton);
    await waitFor(() => {
      expect(screen.getByText('dictionaryEditor.createNewWordTitle')).toBeInTheDocument();
    });
  });

  it('shows form fields in new word dialog', async () => {
    renderDictionaryEditor();
    const newWordButton = screen.getByRole('button', { name: /newWordButton/i });
    await user.click(newWordButton);
    await waitFor(() => {
      expect(screen.getByLabelText(/Phrase/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Pronunciation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Definition/i)).toBeInTheDocument();
    });
  });

  it('fills and submits new word form', async () => {
    mockWordCreate.mockResolvedValue({
      data: { id: 'word-3', phrase: 'さようなら', pronunciation: 'sayounara', definition: 'goodbye' },
    });

    renderDictionaryEditor();
    const newWordButton = screen.getByRole('button', { name: /newWordButton/i });
    await user.click(newWordButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/Phrase/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/Phrase/i), 'さようなら');
    await user.type(screen.getByLabelText(/Pronunciation/i), 'sayounara');
    await user.type(screen.getByLabelText(/Definition/i), 'goodbye');

    const submitButton = screen.getByRole('button', { name: /createWordButton/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockWordCreate).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Empty State
  // ==========================================================================

  it('disables actions button when nothing selected', async () => {
    renderDictionaryEditor();
    const actionsButton = screen.getByRole('button', { name: /actionsButton/i });
    expect(actionsButton).toBeDisabled();
  });

  // ==========================================================================
  // Lexical Editor
  // ==========================================================================

  it('renders Lexical editor area', async () => {
    renderDictionaryEditor();
    const editableDiv = document.querySelector('[contenteditable="true"]');
    expect(editableDiv).toBeInTheDocument();
  });
});