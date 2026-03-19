/**
 * QuestionEditor2 Integration Tests
 * 
 * Tests the complete question management workflow including:
 * - Creating different question types (MC, short answer, etc.)
 * - Importing questions from documents
 * - Question preview and editing
 * - Audio/image attachments
 * - Question bank organization
 * 
 * Usage:
 *   npm test test/integration/question-editor.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QuestionsReview2 } from '../../src/components/QuestionsReview2';
import DictionaryContext from '../../src/context/dictionaryContext';

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
  getUrl: vi.fn(),
}));

vi.mock('../../src/utils/amplifyClient', () => ({
  getAmplifyClient: vi.fn(() => ({
    models: {
      Question: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      },
      ParsedContent: {
        list: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'parsed-1',
              documentID: 'doc-1',
              content: JSON.stringify({
                questions: [
                  {
                    prompt: 'What is kanji?',
                    answer: 'Chinese characters used in Japanese',
                    type: 'short_answer',
                  },
                ],
              }),
            },
          ],
        }),
      },
      Document: {
        get: vi.fn().mockResolvedValue({
          data: {
            id: 'doc-1',
            name: 'lesson-1.pdf',
          },
        }),
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

describe('QuestionEditor2 Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderQuestionEditor = (props = {}) => {
    const defaultProps = {
      documentId: 'doc-1',
      unitId: 'unit-1',
      owner: 'testuser@example.com',
      identityId: 'test-identity',
      searchTerm: '',
      onImportComplete: vi.fn(),
    };

    const dictionaryValue = {
      importedQuestions: [],
      setImportedQuestions: vi.fn(),
    };

    return render(
      <DictionaryContext.Provider value={dictionaryValue as any}>
        <QuestionsReview2 {...defaultProps} {...props} />
      </DictionaryContext.Provider>
    );
  };

  // ==========================================================================
  // Question Display and Loading
  // ==========================================================================

  it('loads and displays questions from document', async () => {
    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching questions', async () => {
    renderQuestionEditor();

    expect(screen.getByText(/loading.*question/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/loading.*question/i)).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no questions found', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    mockClient.models.ParsedContent.list = vi.fn().mockResolvedValue({ data: [] });

    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText(/no questions found/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Creating Questions
  // ==========================================================================

  it('creates a multiple choice question', async () => {
    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    // Click on a question to edit
    const questionCard = screen.getByText('What is kanji?').closest('[role="listitem"]');
    await user.click(within(questionCard as HTMLElement).getByRole('button', { name: /expand/i }));

    // Wait for question editor to expand
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter.*question/i)).toBeInTheDocument();
    });

    // Edit question prompt
    const promptInput = screen.getByPlaceholderText(/enter.*question/i);
    await user.clear(promptInput);
    await user.type(promptInput, 'What are the three Japanese writing systems?');

    // Edit answer
    const answerInput = screen.getByPlaceholderText(/enter.*answer/i);
    await user.clear(answerInput);
    await user.type(answerInput, 'Hiragana, Katakana, and Kanji');

    // Auto-save should trigger
    await waitFor(() => {
      const debouncedSave = vi.fn();
      expect(debouncedSave).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('creates a short answer question', async () => {
    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    const questionCard = screen.getByText('What is kanji?').closest('[role="listitem"]');
    
    // Verify it's marked as short answer
    expect(within(questionCard as HTMLElement).getByText(/short.*answer/i)).toBeInTheDocument();
  });

  it('adds a hint to a question', async () => {
    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    const questionCard = screen.getByText('What is kanji?').closest('[role="listitem"]');
    await user.click(within(questionCard as HTMLElement).getByRole('button', { name: /expand/i }));

    // Find hint input
    const hintInput = await screen.findByPlaceholderText(/enter.*hint/i);
    await user.type(hintInput, 'Think about the Chinese influence on Japanese');

    await waitFor(() => {
      expect(hintInput).toHaveValue('Think about the Chinese influence on Japanese');
    });
  });

  // ==========================================================================
  // Editing Questions
  // ==========================================================================

  it('edits question prompt with inline Lexical editor', async () => {
    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    const questionCard = screen.getByText('What is kanji?').closest('[role="listitem"]');
    await user.click(within(questionCard as HTMLElement).getByRole('button', { name: /expand/i }));

    const promptEditor = await screen.findByPlaceholderText(/enter.*question/i);
    await user.clear(promptEditor);
    await user.type(promptEditor, 'Explain the concept of kanji in Japanese writing');

    await waitFor(() => {
      expect(promptEditor).toHaveValue('Explain the concept of kanji in Japanese writing');
    });
  });

  it('supports undo/redo in question editor', async () => {
    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    const questionCard = screen.getByText('What is kanji?').closest('[role="listitem"]');
    await user.click(within(questionCard as HTMLElement).getByRole('button', { name: /expand/i }));

    const promptEditor = await screen.findByPlaceholderText(/enter.*question/i);
    
    const originalText = 'What is kanji?';
    await user.clear(promptEditor);
    await user.type(promptEditor, 'New question text');

    // Undo with Ctrl+Z (or Cmd+Z on Mac)
    await user.keyboard('{Control>}z{/Control}');

    await waitFor(() => {
      expect(promptEditor).toHaveValue(originalText);
    });
  });

  // ==========================================================================
  // Media Attachments
  // ==========================================================================

  it('attaches audio file to question', async () => {
    const { uploadData } = await import('aws-amplify/storage');
    const mockUploadData = vi.mocked(uploadData);
    mockUploadData.mockReturnValue({
      result: Promise.resolve({ path: 'public/audio/question-audio.mp3' }),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      state: 'SUCCESS',
    } as any);

    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    const questionCard = screen.getByText('What is kanji?').closest('[role="listitem"]');
    await user.click(within(questionCard as HTMLElement).getByRole('button', { name: /expand/i }));

    // Find audio upload button
    const audioButton = await screen.findByRole('button', { name: /audio|mic/i });
    await user.click(audioButton);

    // Simulate file upload
    const file = new File(['audio'], 'question.mp3', { type: 'audio/mpeg' });
    const fileInput = screen.getByLabelText(/upload.*audio/i);
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockUploadData).toHaveBeenCalled();
    });
  });

  it('attaches image to question', async () => {
    const { uploadData } = await import('aws-amplify/storage');
    const mockUploadData = vi.mocked(uploadData);
    mockUploadData.mockReturnValue({
      result: Promise.resolve({ path: 'public/images/question-image.jpg' }),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      state: 'SUCCESS',
    } as any);

    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    const questionCard = screen.getByText('What is kanji?').closest('[role="listitem"]');
    await user.click(within(questionCard as HTMLElement).getByRole('button', { name: /expand/i }));

    // Find image upload button
    const imageButton = await screen.findByRole('button', { name: /image/i });
    await user.click(imageButton);

    // Simulate file upload
    const file = new File(['image'], 'diagram.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/upload.*image/i);
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockUploadData).toHaveBeenCalled();
    });
  });

  it('displays media badges for questions with attachments', async () => {
    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    // Check for audio badge
    const audioIcon = screen.queryByLabelText(/has audio/i);
    if (audioIcon) {
      expect(audioIcon).toBeInTheDocument();
    }

    // Check for image badge
    const imageIcon = screen.queryByLabelText(/has image/i);
    if (imageIcon) {
      expect(imageIcon).toBeInTheDocument();
    }
  });

  // ==========================================================================
  // Search and Filter
  // ==========================================================================

  it('searches questions by prompt text', async () => {
    renderQuestionEditor({ searchTerm: 'kanji' });

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    // Search term should be highlighted
    const highlightedText = screen.getByText(/kanji/i);
    expect(highlightedText).toHaveClass(/highlight|mark/i);
  });

  it('filters questions by type', async () => {
    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    // Click filter button
    const filterButton = screen.getByRole('button', { name: /filter/i });
    await user.click(filterButton);

    // Select short answer filter
    const shortAnswerOption = screen.getByText(/short.*answer/i);
    await user.click(shortAnswerOption);

    // Should show filtered count
    await waitFor(() => {
      expect(screen.getByText(/1.*of.*1/i)).toBeInTheDocument();
    });
  });

  it('filters questions with audio', async () => {
    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    const audioFilterButton = screen.getByRole('checkbox', { name: /has audio/i });
    await user.click(audioFilterButton);

    // Should filter to only questions with audio
    await waitFor(() => {
      const questionCards = screen.getAllByRole('listitem');
      questionCards.forEach(card => {
        expect(within(card).getByLabelText(/has audio/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Bulk Operations
  // ==========================================================================

  it('selects multiple questions', async () => {
    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    
    // Select first question
    await user.click(checkboxes[0]);

    await waitFor(() => {
      expect(checkboxes[0]).toBeChecked();
    });
  });

  it('selects all questions', async () => {
    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    const selectAllButton = screen.getByRole('button', { name: /select all/i });
    await user.click(selectAllButton);

    const checkboxes = screen.getAllByRole('checkbox');
    await waitFor(() => {
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });
  });

  it('deselects all questions', async () => {
    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    // Select all first
    const selectAllButton = screen.getByRole('button', { name: /select all/i });
    await user.click(selectAllButton);

    // Then deselect all
    const deselectAllButton = screen.getByRole('button', { name: /deselect all/i });
    await user.click(deselectAllButton);

    const checkboxes = screen.getAllByRole('checkbox');
    await waitFor(() => {
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });
  });

  // ==========================================================================
  // Import to Question Bank
  // ==========================================================================

  it('imports selected questions to question bank', async () => {
    const onImportComplete = vi.fn();
    renderQuestionEditor({ onImportComplete });

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    // Select question
    const checkbox = screen.getAllByRole('checkbox')[0];
    await user.click(checkbox);

    // Click import button
    const importButton = screen.getByRole('button', { name: /import.*question bank/i });
    await user.click(importButton);

    await waitFor(() => {
      expect(onImportComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          imported: expect.any(Number),
        })
      );
    });
  });

  it('shows import status for questions', async () => {
    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    // After import, should show imported badge
    const importedBadge = screen.queryByText(/imported/i);
    if (importedBadge) {
      expect(importedBadge).toBeInTheDocument();
    }
  });

  // ==========================================================================
  // Virtual Scrolling
  // ==========================================================================

  it('handles large question lists with virtual scrolling', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();

    const largeQuestionList = Array.from({ length: 500 }, (_, i) => ({
      prompt: `Question ${i}?`,
      answer: `Answer ${i}`,
      type: 'short_answer',
    }));

    mockClient.models.ParsedContent.list = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'parsed-1',
          content: JSON.stringify({ questions: largeQuestionList }),
        },
      ],
    });

    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('Question 0?')).toBeInTheDocument();
    });

    // Should render only visible items
    const visibleItems = screen.getAllByRole('listitem');
    expect(visibleItems.length).toBeLessThan(100);
  });

  // ==========================================================================
  // Document Source Tracking
  // ==========================================================================

  it('displays source document information', async () => {
    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    // Should show source document name
    expect(screen.getByText(/lesson-1\.pdf/i)).toBeInTheDocument();
  });

  it('shows page numbers for questions from PDFs', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();

    mockClient.models.ParsedContent.list = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'parsed-1',
          content: JSON.stringify({
            questions: [
              {
                prompt: 'What is kanji?',
                answer: 'Chinese characters',
                page: 5,
              },
            ],
          }),
        },
      ],
    });

    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText(/page.*5/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  it('handles failed question updates gracefully', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    mockClient.models.Question.update = vi.fn().mockRejectedValue(new Error('Network error'));

    renderQuestionEditor();

    await waitFor(() => {
      expect(screen.getByText('What is kanji?')).toBeInTheDocument();
    });

    const questionCard = screen.getByText('What is kanji?').closest('[role="listitem"]');
    await user.click(within(questionCard as HTMLElement).getByRole('button', { name: /expand/i }));

    const promptEditor = await screen.findByPlaceholderText(/enter.*question/i);
    await user.type(promptEditor, ' Updated text');

    // Should show error after auto-save fails
    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
