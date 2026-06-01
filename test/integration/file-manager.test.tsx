/**
 * FileManager2 Integration Tests
 *
 * Tests file management toolbar, upload flow, search, and selection.
 * Files are rendered via @tanstack/react-virtual in plain Box elements
 * (no role="listitem"), so queries use text content and aria-labels.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import FileManager2 from '../../src/components/Editor3/components/FileManager2';
import FilesContext from '../../src/context/fileContext';
import SettingsContext from '../../src/context/settingsContext';
import UnitContext from '../../src/context/unitContext';

vi.mock('aws-amplify/datastore', () => ({
  DataStore: { observeQuery: vi.fn(), save: vi.fn(), delete: vi.fn() },
}));

vi.mock('aws-amplify/storage', () => ({
  uploadData: vi.fn(),
  remove: vi.fn(),
  getUrl: vi.fn().mockResolvedValue({ url: new URL('https://example.com/file.pdf') }),
}));

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn().mockResolvedValue({
    identityId: 'test-identity-123',
    tokens: { accessToken: { payload: { username: 'testuser' } } },
  }),
}));

vi.mock('../../src/utils/amplifyClient', () => ({
  getAmplifyClient: vi.fn(() => ({
    models: {
      File: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), list: vi.fn() },
      Document: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), get: vi.fn() },
    },
  })),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('FileManager2 Integration Tests', () => {
  let mockFiles: any[] = [];
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockFiles = [
      {
        id: 'file-1',
        name: 'lesson-1.pdf',
        path: 'public/documents/lesson-1.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
        level: 'PUBLIC',
        createdAt: new Date('2026-01-01').toISOString(),
        updatedAt: new Date('2026-01-01').toISOString(),
      },
      {
        id: 'file-2',
        name: 'pronunciation.mp3',
        path: 'public/audio/pronunciation.mp3',
        mimeType: 'audio/mpeg',
        size: 512000,
        level: 'PUBLIC',
        duration: 30000,
        createdAt: new Date('2026-01-02').toISOString(),
        updatedAt: new Date('2026-01-02').toISOString(),
      },
      {
        id: 'file-3',
        name: 'diagram.png',
        path: 'public/images/diagram.png',
        mimeType: 'image/png',
        size: 256000,
        level: 'PUBLIC',
        createdAt: new Date('2026-01-03').toISOString(),
        updatedAt: new Date('2026-01-03').toISOString(),
      },
    ];
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderFileManager = (overrides = {}) => {
    const filesValue = {
      files: mockFiles,
      setFiles: vi.fn(),
      uploadFile: vi.fn(),
      deleteFile: vi.fn(),
      getFileUrl: vi.fn().mockResolvedValue('https://example.com/file.pdf'),
      vectorStore: {
        loaded: true,
        items: [],
        add: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
        load: vi.fn(),
        save: vi.fn(),
        delete: vi.fn(),
      },
      vectorStoreReady: true,
      ...overrides,
    };

    const settingsValue = {
      settings: { fileUploadMaxSize: 10485760 },
    };

    const unitValue = {
      currentUnit: { id: 'unit-1', name: 'Test Unit' },
      session: { username: 'testuser', identityId: 'test-identity-123' },
    };

    return render(
      <UnitContext.Provider value={unitValue as any}>
        <SettingsContext.Provider value={settingsValue as any}>
          <FilesContext.Provider value={filesValue as any}>
            <LexicalComposer
              initialConfig={{
                namespace: 'FileManagerTest',
                theme: {},
                nodes: [],
                onError: (error: Error) => console.error(error),
              }}
            >
              <FileManager2 />
            </LexicalComposer>
          </FilesContext.Provider>
        </SettingsContext.Provider>
      </UnitContext.Provider>
    );
  };

  it('renders upload button with aria-label', async () => {
    renderFileManager();
    const uploadButton = screen.getByRole('button', { name: /uploadTooltip/i });
    expect(uploadButton).toBeInTheDocument();
  });

  it('renders actions button', async () => {
    renderFileManager();
    const actionsButton = screen.getByRole('button', { name: /actionsTooltip/i });
    expect(actionsButton).toBeInTheDocument();
  });

  it('renders select-all checkbox', async () => {
    renderFileManager();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('renders search input', async () => {
    renderFileManager();
    const searchInput = screen.getByPlaceholderText('fileManager2.toolbar.searchPlaceholder');
    expect(searchInput).toBeInTheDocument();
  });

  it('disables actions button when nothing selected', async () => {
    renderFileManager();
    const actionsButton = screen.getByRole('button', { name: /actionsTooltip/i });
    expect(actionsButton).toBeDisabled();
  });

  // Note: File name display and search filtering tests are skipped because
  // @tanstack/react-virtual requires a real DOM with measured dimensions.
  // These are better tested in Storybook browser tests.

  it('has hidden file input with correct accept types', async () => {
    const { container } = renderFileManager();
    const fileInput = container.querySelector('#file-upload-input') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.type).toBe('file');
    expect(fileInput.multiple).toBe(true);
    expect(fileInput.accept).toContain('image/*');
    expect(fileInput.accept).toContain('audio/*');
    expect(fileInput.accept).toContain('.pdf');
  });

  it('disables select-all when no files', async () => {
    renderFileManager({ files: [] });
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeDisabled();
  });
});
