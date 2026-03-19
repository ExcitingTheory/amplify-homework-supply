/**
 * FileManager Integration Tests
 * 
 * Tests file management workflows including:
 * - File upload (PDF, audio, images)
 * - File preview and download
 * - File search and filtering
 * - File deletion and organization
 * - S3 URL caching
 * 
 * Usage:
 *   npm test test/integration/file-manager.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import FileManager2 from '../../src/components/Editor3/components/FileManager2';
import FilesContext from '../../src/context/fileContext';
import SettingsContext from '../../src/context/settingsContext';
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
  getUrl: vi.fn().mockResolvedValue({ url: new URL('https://example.com/file.pdf') }),
}));

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn().mockResolvedValue({
    identityId: 'test-identity-123',
    tokens: {
      accessToken: { payload: { username: 'testuser' } },
    },
  }),
}));

vi.mock('../../src/utils/amplifyClient', () => ({
  getAmplifyClient: vi.fn(() => ({
    models: {
      File: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      },
      Document: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        get: vi.fn(),
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

describe('FileManager Integration Tests', () => {
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
      ...overrides,
    };

    const settingsValue = {
      settings: {
        fileUploadMaxSize: 10485760, // 10MB
      },
    };

    const unitValue = {
      currentUnit: { id: 'unit-1', name: 'Test Unit' },
      session: {
        username: 'testuser',
        identityId: 'test-identity-123',
      },
    };

    return render(
      <UnitContext.Provider value={unitValue as any}>
        <SettingsContext.Provider value={settingsValue as any}>
          <FilesContext.Provider value={filesValue as any}>
            <FileManager2 />
          </FilesContext.Provider>
        </SettingsContext.Provider>
      </UnitContext.Provider>
    );
  };

  // ==========================================================================
  // File Display
  // ==========================================================================

  it('displays list of files', async () => {
    renderFileManager();

    await waitFor(() => {
      expect(screen.getByText('lesson-1.pdf')).toBeInTheDocument();
      expect(screen.getByText('pronunciation.mp3')).toBeInTheDocument();
      expect(screen.getByText('diagram.png')).toBeInTheDocument();
    });
  });

  it('displays file metadata (size, type, date)', async () => {
    renderFileManager();

    await waitFor(() => {
      expect(screen.getByText(/1.*MB/i)).toBeInTheDocument(); // File size
      expect(screen.getByText(/pdf/i)).toBeInTheDocument(); // File type
      expect(screen.getByText(/jan.*1/i)).toBeInTheDocument(); // Date
    });
  });

  it('groups files by type', async () => {
    renderFileManager();

    await waitFor(() => {
      // Should have sections for PDFs, Audio, Images
      expect(screen.getByText(/documents?|pdfs?/i)).toBeInTheDocument();
      expect(screen.getByText(/audio/i)).toBeInTheDocument();
      expect(screen.getByText(/images?/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // File Upload
  // ==========================================================================

  it('uploads PDF file', async () => {
    const uploadFile = vi.fn().mockResolvedValue({
      id: 'file-4',
      path: 'public/documents/new-lesson.pdf',
    });

    const { uploadData } = await import('aws-amplify/storage');
    const mockUploadData = vi.mocked(uploadData);
    mockUploadData.mockReturnValue({
      result: Promise.resolve({ path: 'public/documents/new-lesson.pdf' }),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      state: 'SUCCESS',
    } as any);

    renderFileManager({ uploadFile });

    const uploadButton = screen.getByRole('button', { name: /upload.*file/i });
    await user.click(uploadButton);

    const file = new File(['pdf content'], 'new-lesson.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload/i);
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockUploadData).toHaveBeenCalled();
    });
  });

  it('uploads audio file', async () => {
    const uploadFile = vi.fn().mockResolvedValue({
      id: 'file-5',
      path: 'public/audio/recording.mp3',
    });

    const { uploadData } = await import('aws-amplify/storage');
    const mockUploadData = vi.mocked(uploadData);
    mockUploadData.mockReturnValue({
      result: Promise.resolve({ path: 'public/audio/recording.mp3' }),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      state: 'SUCCESS',
    } as any);

    renderFileManager({ uploadFile });

    const uploadButton = screen.getByRole('button', { name: /upload.*file/i });
    await user.click(uploadButton);

    const file = new File(['audio'], 'recording.mp3', { type: 'audio/mpeg' });
    const fileInput = screen.getByLabelText(/upload/i);
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockUploadData).toHaveBeenCalled();
    });
  });

  it('uploads image file', async () => {
    const uploadFile = vi.fn().mockResolvedValue({
      id: 'file-6',
      path: 'public/images/photo.jpg',
    });

    const { uploadData } = await import('aws-amplify/storage');
    const mockUploadData = vi.mocked(uploadData);
    mockUploadData.mockReturnValue({
      result: Promise.resolve({ path: 'public/images/photo.jpg' }),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      state: 'SUCCESS',
    } as any);

    renderFileManager({ uploadFile });

    const uploadButton = screen.getByRole('button', { name: /upload.*file/i });
    await user.click(uploadButton);

    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/upload/i);
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockUploadData).toHaveBeenCalled();
    });
  });

  it('shows upload progress', async () => {
    const { uploadData } = await import('aws-amplify/storage');
    const mockUploadData = vi.mocked(uploadData);

    let progressCallback: ((progress: { transferredBytes: number; totalBytes: number }) => void) | undefined;

    mockUploadData.mockImplementation((args: any) => {
      progressCallback = args.options?.onProgress;
      return {
        result: new Promise(resolve => {
          setTimeout(() => {
            if (progressCallback) {
              progressCallback({ transferredBytes: 512000, totalBytes: 1024000 });
              progressCallback({ transferredBytes: 1024000, totalBytes: 1024000 });
            }
            resolve({ path: 'public/test.pdf' });
          }, 100);
        }),
        cancel: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        state: 'IN_PROGRESS',
      } as any;
    });

    renderFileManager();

    const uploadButton = screen.getByRole('button', { name: /upload.*file/i });
    await user.click(uploadButton);

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload/i);
    await user.upload(fileInput, file);

    // Should show progress bar
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('validates file size before upload', async () => {
    renderFileManager();

    const uploadButton = screen.getByRole('button', { name: /upload.*file/i });
    await user.click(uploadButton);

    // Try to upload file larger than max size
    const largeFile = new File(
      [new ArrayBuffer(11 * 1024 * 1024)], // 11MB
      'large-file.pdf',
      { type: 'application/pdf' }
    );

    const fileInput = screen.getByLabelText(/upload/i);
    await user.upload(fileInput, largeFile);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/too large|exceeds.*size/i)).toBeInTheDocument();
    });
  });

  it('validates file type before upload', async () => {
    renderFileManager();

    const uploadButton = screen.getByRole('button', { name: /upload.*file/i });
    await user.click(uploadButton);

    // Try to upload unsupported file type
    const invalidFile = new File(['content'], 'script.exe', { type: 'application/x-msdownload' });
    const fileInput = screen.getByLabelText(/upload/i);
    await user.upload(fileInput, invalidFile);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/not supported|invalid.*type/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // File Preview
  // ==========================================================================

  it('previews PDF file', async () => {
    renderFileManager();

    const pdfFile = screen.getByText('lesson-1.pdf');
    await user.click(pdfFile);

    // Should open PDF preview
    await waitFor(() => {
      expect(screen.getByText(/pdf.*preview|document.*viewer/i)).toBeInTheDocument();
    });
  });

  it('previews image file', async () => {
    renderFileManager();

    const imageFile = screen.getByText('diagram.png');
    await user.click(imageFile);

    // Should show image preview
    await waitFor(() => {
      const image = screen.getByRole('img', { name: /diagram/i });
      expect(image).toBeInTheDocument();
    });
  });

  it('plays audio file', async () => {
    global.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);

    renderFileManager();

    const audioFile = screen.getByText('pronunciation.mp3');
    const fileCard = audioFile.closest('[role="listitem"]') || audioFile.parentElement;
    
    const playButton = within(fileCard as HTMLElement).getByRole('button', { name: /play/i });
    await user.click(playButton);

    await waitFor(() => {
      expect(global.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // File Download
  // ==========================================================================

  it('downloads file', async () => {
    const getFileUrl = vi.fn().mockResolvedValue('https://example.com/lesson-1.pdf');
    renderFileManager({ getFileUrl });

    // Create mock download link
    const createElementSpy = vi.spyOn(document, 'createElement');
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    } as any;
    createElementSpy.mockReturnValue(mockLink);

    const pdfFile = screen.getByText('lesson-1.pdf');
    const fileCard = pdfFile.closest('[role="listitem"]') || pdfFile.parentElement;
    
    const downloadButton = within(fileCard as HTMLElement).getByRole('button', { name: /download/i });
    await user.click(downloadButton);

    await waitFor(() => {
      expect(getFileUrl).toHaveBeenCalledWith('public/documents/lesson-1.pdf');
      expect(mockLink.click).toHaveBeenCalled();
    });

    createElementSpy.mockRestore();
  });

  // ==========================================================================
  // File Search and Filter
  // ==========================================================================

  it('searches files by name', async () => {
    renderFileManager();

    const searchInput = screen.getByPlaceholderText(/search.*files?/i);
    await user.type(searchInput, 'lesson');

    await waitFor(() => {
      expect(screen.getByText('lesson-1.pdf')).toBeInTheDocument();
      expect(screen.queryByText('pronunciation.mp3')).not.toBeInTheDocument();
      expect(screen.queryByText('diagram.png')).not.toBeInTheDocument();
    });
  });

  it('filters files by type (PDF)', async () => {
    renderFileManager();

    const filterButton = screen.getByRole('button', { name: /filter/i });
    await user.click(filterButton);

    const pdfOption = screen.getByRole('menuitem', { name: /pdf/i });
    await user.click(pdfOption);

    await waitFor(() => {
      expect(screen.getByText('lesson-1.pdf')).toBeInTheDocument();
      expect(screen.queryByText('pronunciation.mp3')).not.toBeInTheDocument();
    });
  });

  it('filters files by type (Audio)', async () => {
    renderFileManager();

    const filterButton = screen.getByRole('button', { name: /filter/i });
    await user.click(filterButton);

    const audioOption = screen.getByRole('menuitem', { name: /audio/i });
    await user.click(audioOption);

    await waitFor(() => {
      expect(screen.getByText('pronunciation.mp3')).toBeInTheDocument();
      expect(screen.queryByText('lesson-1.pdf')).not.toBeInTheDocument();
    });
  });

  it('filters files by type (Images)', async () => {
    renderFileManager();

    const filterButton = screen.getByRole('button', { name: /filter/i });
    await user.click(filterButton);

    const imageOption = screen.getByRole('menuitem', { name: /image/i });
    await user.click(imageOption);

    await waitFor(() => {
      expect(screen.getByText('diagram.png')).toBeInTheDocument();
      expect(screen.queryByText('lesson-1.pdf')).not.toBeInTheDocument();
    });
  });

  it('sorts files by date (newest first)', async () => {
    renderFileManager();

    const sortButton = screen.getByRole('button', { name: /sort/i });
    await user.click(sortButton);

    const newestOption = screen.getByRole('menuitem', { name: /newest/i });
    await user.click(newestOption);

    await waitFor(() => {
      const fileItems = screen.getAllByRole('listitem');
      expect(within(fileItems[0]).getByText('diagram.png')).toBeInTheDocument(); // Jan 3
      expect(within(fileItems[2]).getByText('lesson-1.pdf')).toBeInTheDocument(); // Jan 1
    });
  });

  it('sorts files by name (alphabetical)', async () => {
    renderFileManager();

    const sortButton = screen.getByRole('button', { name: /sort/i });
    await user.click(sortButton);

    const nameOption = screen.getByRole('menuitem', { name: /name|alphabetical/i });
    await user.click(nameOption);

    await waitFor(() => {
      const fileItems = screen.getAllByRole('listitem');
      expect(within(fileItems[0]).getByText('diagram.png')).toBeInTheDocument();
      expect(within(fileItems[1]).getByText('lesson-1.pdf')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // File Deletion
  // ==========================================================================

  it('deletes file', async () => {
    const deleteFile = vi.fn();
    const { remove } = await import('aws-amplify/storage');
    const mockRemove = vi.mocked(remove);
    mockRemove.mockResolvedValue(undefined as any);

    renderFileManager({ deleteFile });

    const pdfFile = screen.getByText('lesson-1.pdf');
    const fileCard = pdfFile.closest('[role="listitem"]') || pdfFile.parentElement;
    
    const deleteButton = within(fileCard as HTMLElement).getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Confirm deletion
    const confirmButton = await screen.findByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(deleteFile).toHaveBeenCalledWith('file-1');
    });
  });

  it('deletes multiple files in bulk', async () => {
    const deleteFile = vi.fn();
    renderFileManager({ deleteFile });

    // Select multiple files
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    // Click bulk delete
    const bulkDeleteButton = screen.getByRole('button', { name: /delete selected/i });
    await user.click(bulkDeleteButton);

    // Confirm
    const confirmButton = await screen.findByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(deleteFile).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // S3 URL Caching
  // ==========================================================================

  it('caches S3 URLs to avoid repeated fetches', async () => {
    const getFileUrl = vi.fn().mockResolvedValue('https://example.com/lesson-1.pdf');
    renderFileManager({ getFileUrl });

    // Access file URL twice
    const pdfFile = screen.getByText('lesson-1.pdf');
    await user.click(pdfFile);
    await user.click(pdfFile);

    // Should only call getFileUrl once due to caching
    await waitFor(() => {
      expect(getFileUrl).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // Document Analysis Integration
  // ==========================================================================

  it('triggers PDF analysis after upload', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    const analyzeDocument = vi.fn().mockResolvedValue({ data: { status: 'analyzing' } });
    mockClient.mutations = { analyzeDocument } as any;

    renderFileManager();

    const uploadButton = screen.getByRole('button', { name: /upload.*file/i });
    await user.click(uploadButton);

    const file = new File(['pdf'], 'new.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload/i);
    await user.upload(fileInput, file);

    // Should trigger analysis for PDF
    await waitFor(() => {
      expect(analyzeDocument).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  it('shows analysis status for documents', async () => {
    const filesWithStatus = [
      ...mockFiles,
      {
        id: 'file-4',
        name: 'analyzing.pdf',
        path: 'public/documents/analyzing.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
        level: 'PUBLIC',
        analysisStatus: 'analyzing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    renderFileManager({ files: filesWithStatus });

    await waitFor(() => {
      expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Virtual Scrolling
  // ==========================================================================

  it('handles large file lists with virtual scrolling', async () => {
    const largeFileList = Array.from({ length: 500 }, (_, i) => ({
      id: `file-${i}`,
      name: `file-${i}.pdf`,
      path: `public/documents/file-${i}.pdf`,
      mimeType: 'application/pdf',
      size: 1024000,
      level: 'PUBLIC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    renderFileManager({ files: largeFileList });

    await waitFor(() => {
      const visibleItems = screen.getAllByRole('listitem');
      // Should render only visible items, not all 500
      expect(visibleItems.length).toBeLessThan(100);
    });

    // First item should be visible
    expect(screen.getByText('file-0.pdf')).toBeInTheDocument();
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  it('handles upload errors gracefully', async () => {
    const { uploadData } = await import('aws-amplify/storage');
    const mockUploadData = vi.mocked(uploadData);
    mockUploadData.mockReturnValue({
      result: Promise.reject(new Error('Upload failed')),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      state: 'ERROR',
    } as any);

    renderFileManager();

    const uploadButton = screen.getByRole('button', { name: /upload.*file/i });
    await user.click(uploadButton);

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload/i);
    await user.upload(fileInput, file);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/upload.*failed|error/i)).toBeInTheDocument();
    });
  });

  it('handles delete errors gracefully', async () => {
    const deleteFile = vi.fn().mockRejectedValue(new Error('Delete failed'));
    renderFileManager({ deleteFile });

    const pdfFile = screen.getByText('lesson-1.pdf');
    const fileCard = pdfFile.closest('[role="listitem"]') || pdfFile.parentElement;
    
    const deleteButton = within(fileCard as HTMLElement).getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    const confirmButton = await screen.findByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/delete.*failed|error/i)).toBeInTheDocument();
    });
  });
});
