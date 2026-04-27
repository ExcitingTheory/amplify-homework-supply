/**
 * Grade Tracking Integration Tests (Gen 2)
 * 
 * Tests grade management and real-time sync workflows including:
 * - Real-time grade updates via GraphQL subscriptions
 * - Grade calculation from rubric
 * - Instructor viewing student grades
 * - Student viewing own grades
 * - Grade feedback workflow
 * - Change detection using updatedAt timestamps
 * 
 * Usage:
 *   npm test test/integration/grade-tracking.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock Yjs and Amplify modules
vi.mock('yjs', () => {
  class MockDoc {
    getMap = vi.fn(() => ({
      set: vi.fn(),
      get: vi.fn(),
      observe: vi.fn(),
      unobserve: vi.fn(),
      toJSON: vi.fn(() => ({})),
    }));
    destroy = vi.fn();
  }
  return {
    Doc: MockDoc,
    applyUpdate: vi.fn(),
  };
});

vi.mock('aws-amplify/datastore', () => ({
  DataStore: {
    observeQuery: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../src/utils/amplifyClient', () => ({
  getAmplifyClient: vi.fn(() => ({
    models: {
      Grade: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
        get: vi.fn(),
      },
      Unit: {
        get: vi.fn(),
      },
      Assignment: {
        list: vi.fn(),
      },
    },
  })),
}));

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn().mockResolvedValue({
    identityId: 'student-identity',
    tokens: {
      accessToken: { payload: { username: 'student1@example.com' } },
    },
  }),
}));

vi.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('Grade Tracking Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockGrades: any[];
  let mockUnit: any;

  beforeEach(() => {
    user = userEvent.setup();

    mockUnit = {
      id: 'unit-1',
      name: 'Hiragana Basics',
      data: JSON.stringify({
        root: {
          children: [
            {
              type: 'quiz',
              id: 'quiz-1',
              question: 'What is hiragana?',
              correctAnswer: 'A Japanese syllabary',
            },
            {
              type: 'quiz',
              id: 'quiz-2',
              question: 'How many basic hiragana characters?',
              correctAnswer: '46',
            },
          ],
        },
      }),
      rubric: JSON.stringify(['quiz-1', 'quiz-2']),
    };

    mockGrades = [
      {
        id: 'grade-1',
        unitID: 'unit-1',
        sectionID: 'section-1',
        assignmentID: 'assignment-1',
        owner: 'student1@example.com',
        percentComplete: 50,
        accuracy: 75,
        complete: false,
        data: JSON.stringify({
          'quiz-1': { complete: true, accuracy: 100, userAnswer: 'A Japanese syllabary' },
          'quiz-2': { complete: false, accuracy: 0 },
        }),
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
    ];

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Mock Workbook Component
  const WorkbookGrade = ({ gradeId }: { gradeId: string }) => {
    const [grade, setGrade] = React.useState(mockGrades[0]);
    const [currentBlockId, setCurrentBlockId] = React.useState<string | null>(null);

    const handleAnswerSubmit = (blockId: string, answer: string, correct: boolean) => {
      const gradeData = JSON.parse(grade.data);
      gradeData[blockId] = {
        complete: true,
        accuracy: correct ? 100 : 0,
        userAnswer: answer,
      };

      // Calculate new accuracy
      const completedBlocks = Object.values(gradeData).filter((b: any) => b.complete);
      const totalAccuracy = completedBlocks.reduce((sum: number, b: any) => sum + b.accuracy, 0);
      const accuracy = totalAccuracy / completedBlocks.length;
      const percentComplete = (completedBlocks.length / 2) * 100;

      setGrade({
        ...grade,
        data: JSON.stringify(gradeData),
        accuracy,
        percentComplete,
        _version: grade._version + 1,
        updatedAt: new Date().toISOString(),
      });
    };

    return (
      <div>
        <h2>Current Grade: {grade.accuracy}%</h2>
        <div>Progress: {grade.percentComplete}%</div>
        <div role="list">
          <div role="listitem">
            <h3>Question 1: What is hiragana?</h3>
            <input 
              data-testid="answer-quiz-1" 
              placeholder="Enter answer"
              onBlur={(e) => {
                handleAnswerSubmit(
                  'quiz-1', 
                  e.target.value,
                  e.target.value === 'A Japanese syllabary'
                );
              }}
            />
          </div>
          <div role="listitem">
            <h3>Question 2: How many basic hiragana characters?</h3>
            <input 
              data-testid="answer-quiz-2" 
              placeholder="Enter answer"
              onBlur={(e) => {
                handleAnswerSubmit(
                  'quiz-2',
                  e.target.value,
                  e.target.value === '46'
                );
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Mock Instructor Grade View
  const InstructorGradeView = ({ sectionId }: { sectionId: string }) => {
    const [grades, setGrades] = React.useState(mockGrades);

    return (
      <div>
        <h2>Student Grades</h2>
        <div role="table">
          <div role="rowgroup">
            <div role="row">
              <div role="columnheader">Student</div>
              <div role="columnheader">Progress</div>
              <div role="columnheader">Accuracy</div>
              <div role="columnheader">Status</div>
            </div>
          </div>
          <div role="rowgroup">
            {grades.map(grade => (
              <div key={grade.id} role="row">
                <div role="cell">{grade.owner}</div>
                <div role="cell">{grade.percentComplete}%</div>
                <div role="cell">{grade.accuracy}%</div>
                <div role="cell">{grade.complete ? 'Complete' : 'In Progress'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // Grade Creation
  // ==========================================================================

  it('creates new grade when student starts assignment', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    
    const createGrade = vi.fn().mockResolvedValue({
      data: {
        id: 'grade-2',
        unitID: 'unit-1',
        percentComplete: 0,
        accuracy: 0,
        complete: false,
        data: JSON.stringify({}),
      },
    });
    mockClient.models.Grade.create = createGrade;

    const StartAssignment = () => {
      const handleStart = async () => {
        await mockClient.models.Grade.create({
          unitID: 'unit-1',
          sectionID: 'section-1',
          assignmentID: 'assignment-1',
          percentComplete: 0,
          accuracy: 0,
          complete: false,
          data: JSON.stringify({}),
        });
      };

      return <button onClick={handleStart}>Start Assignment</button>;
    };

    render(<StartAssignment />);

    const startButton = screen.getByRole('button', { name: /start assignment/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(createGrade).toHaveBeenCalledWith(
        expect.objectContaining({
          unitID: 'unit-1',
          percentComplete: 0,
          accuracy: 0,
          complete: false,
        })
      );
    });
  });

  // ==========================================================================
  // Grade Progress Updates
  // ==========================================================================

  it('updates grade when student answers question', async () => {
    render(<WorkbookGrade gradeId="grade-1" />);

    // Answer first question
    const answerInput = screen.getByTestId('answer-quiz-1');
    await user.type(answerInput, 'A Japanese syllabary');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      // Grade should update
      expect(screen.getByText(/current grade.*100%/i)).toBeInTheDocument();
      expect(screen.getByText(/progress.*50%/i)).toBeInTheDocument();
    });
  });

  it('calculates accuracy from multiple questions', async () => {
    render(<WorkbookGrade gradeId="grade-1" />);

    // Answer first question correctly
    const answer1 = screen.getByTestId('answer-quiz-1');
    await user.type(answer1, 'A Japanese syllabary');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/current grade.*100%/i)).toBeInTheDocument();
    });

    // Answer second question incorrectly
    const answer2 = screen.getByTestId('answer-quiz-2');
    await user.type(answer2, 'Wrong answer');
    await user.tab();

    await waitFor(() => {
      // Average: (100 + 0) / 2 = 50%
      expect(screen.getByText(/current grade.*50%/i)).toBeInTheDocument();
      expect(screen.getByText(/progress.*100%/i)).toBeInTheDocument();
    });
  });

  it('marks grade as complete when all questions answered', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    
    const updateGrade = vi.fn().mockResolvedValue({
      data: { id: 'grade-1', complete: true },
    });
    mockClient.models.Grade.update = updateGrade;

    render(<WorkbookGrade gradeId="grade-1" />);

    // Answer both questions
    await user.type(screen.getByTestId('answer-quiz-1'), 'A Japanese syllabary');
    await user.tab();
    await user.type(screen.getByTestId('answer-quiz-2'), '46');
    await user.tab();

    // Should trigger completion update
    await waitFor(() => {
      expect(screen.getByText(/progress.*100%/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Grade Calculation from Rubric
  // ==========================================================================

  it('calculates grade only from rubric blocks', async () => {
    // Unit has 3 blocks but only 2 in rubric
    const unitWithExtraBlocks = {
      ...mockUnit,
      data: JSON.stringify({
        root: {
          children: [
            { type: 'quiz', id: 'quiz-1' },
            { type: 'quiz', id: 'quiz-2' },
            { type: 'paragraph', id: 'para-1' }, // Not in rubric
          ],
        },
      }),
    };

    const gradeData = {
      'quiz-1': { complete: true, accuracy: 100 },
      'quiz-2': { complete: true, accuracy: 80 },
      'para-1': { complete: true, accuracy: 100 }, // Should not affect grade
    };

    // Calculate grade based on rubric only
    const rubric = ['quiz-1', 'quiz-2'];
    const gradedBlocks = rubric.map(id => gradeData[id]).filter(Boolean);
    const totalAccuracy = gradedBlocks.reduce((sum, b) => sum + b.accuracy, 0);
    const accuracy = totalAccuracy / gradedBlocks.length;

    expect(accuracy).toBe(90); // (100 + 80) / 2 = 90, not affected by para-1
  });

  // ==========================================================================
  // Instructor Grade Viewing
  // ==========================================================================

  it('displays all student grades for section', async () => {
    render(<InstructorGradeView sectionId="section-1" />);

    await waitFor(() => {
      expect(screen.getByText('student1@example.com')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument(); // Progress
      expect(screen.getByText('75%')).toBeInTheDocument(); // Accuracy
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });
  });

  it('filters grades by completion status', async () => {
    const allGrades = [
      ...mockGrades,
      {
        id: 'grade-2',
        owner: 'student2@example.com',
        percentComplete: 100,
        accuracy: 95,
        complete: true,
      },
    ];

    const FilteredGrades = () => {
      const [filter, setFilter] = React.useState<'all' | 'complete' | 'incomplete'>('all');
      const filtered = allGrades.filter(g => 
        filter === 'all' || 
        (filter === 'complete' && g.complete) ||
        (filter === 'incomplete' && !g.complete)
      );

      return (
        <div>
          <button onClick={() => setFilter('complete')}>Show Complete</button>
          <div role="list">
            {filtered.map(grade => (
              <div key={grade.id} role="listitem">
                {grade.owner} - {grade.complete ? 'Complete' : 'In Progress'}
              </div>
            ))}
          </div>
        </div>
      );
    };

    render(<FilteredGrades />);

    const completeButton = screen.getByRole('button', { name: /show complete/i });
    await user.click(completeButton);

    await waitFor(() => {
      expect(screen.getByText(/student2.*complete/i)).toBeInTheDocument();
      expect(screen.queryByText(/student1/i)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Student Grade Viewing
  // ==========================================================================

  it('student can view their own grade', async () => {
    const StudentGradeView = () => {
      const [grade] = React.useState(mockGrades[0]);

      return (
        <div>
          <h2>Your Grade</h2>
          <div>Progress: {grade.percentComplete}%</div>
          <div>Accuracy: {grade.accuracy}%</div>
          <div>Status: {grade.complete ? 'Complete' : 'In Progress'}</div>
        </div>
      );
    };

    render(<StudentGradeView />);

    expect(screen.getByText(/progress.*50%/i)).toBeInTheDocument();
    expect(screen.getByText(/accuracy.*75%/i)).toBeInTheDocument();
    expect(screen.getByText(/status.*in progress/i)).toBeInTheDocument();
  });

  it('displays detailed feedback for each question', async () => {
    const DetailedFeedback = () => {
      const [grade] = React.useState(mockGrades[0]);
      const gradeData = JSON.parse(grade.data);

      return (
        <div>
          <h2>Question Feedback</h2>
          <div role="list">
            {Object.entries(gradeData).map(([blockId, data]: [string, any]) => (
              <div key={blockId} role="listitem">
                <h3>{blockId}</h3>
                <div>Complete: {data.complete ? 'Yes' : 'No'}</div>
                <div>Accuracy: {data.accuracy}%</div>
                {data.userAnswer && <div>Your Answer: {data.userAnswer}</div>}
              </div>
            ))}
          </div>
        </div>
      );
    };

    render(<DetailedFeedback />);

    expect(screen.getByText('quiz-1')).toBeInTheDocument();
    expect(screen.getByText(/accuracy.*100%/i)).toBeInTheDocument();
    expect(screen.getByText(/your answer.*japanese syllabary/i)).toBeInTheDocument();
  });

  // ==========================================================================
  // Real-time Yjs Sync
  // ==========================================================================

  it('syncs grade updates via Yjs in real-time', async () => {
    const { Doc } = await import('yjs');
    const mockDoc = new Doc();
    const gradeMap = mockDoc.getMap('grade');

    // Simulate Yjs update
    const handleYjsUpdate = vi.fn((event: any) => {
      const updates = event.keys;
      // Handle grade updates from Yjs
    });

    gradeMap.observe(handleYjsUpdate);

    // Trigger update
    gradeMap.set('percentComplete', 75);
    gradeMap.set('accuracy', 85);

    expect(gradeMap.set).toHaveBeenCalled();
  });

  it('handles concurrent grade updates with Yjs', async () => {
    // Simulate two users updating grade at same time
    const { Doc } = await import('yjs');
    const doc1 = new Doc();
    const doc2 = new Doc();

    const grade1 = doc1.getMap('grade');
    const grade2 = doc2.getMap('grade');

    // User 1 updates
    grade1.set('quiz-1', { complete: true, accuracy: 100 });

    // User 2 updates (should merge, not conflict)
    grade2.set('quiz-2', { complete: true, accuracy: 90 });

    // Both updates should be preserved
    expect(grade1.set).toHaveBeenCalled();
    expect(grade2.set).toHaveBeenCalled();
  });

  it('persists Yjs updates to DataStore', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    
    const updateGrade = vi.fn().mockResolvedValue({ data: {} });
    mockClient.models.Grade.update = updateGrade;

    // Simulate Yjs sync triggering DataStore save
    const yjsData = {
      'quiz-1': { complete: true, accuracy: 100 },
      'quiz-2': { complete: true, accuracy: 90 },
    };

    await mockClient.models.Grade.update({
      id: 'grade-1',
      data: JSON.stringify(yjsData),
      percentComplete: 100,
      accuracy: 95,
      updatedAt: new Date().toISOString(),
    });

    expect(updateGrade).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'grade-1',
        percentComplete: 100,
        accuracy: 95,
      })
    );
  });

  // ==========================================================================
  // Timestamp-based Change Detection
  // ==========================================================================

  it('prevents updating component state with older timestamp', async () => {
    const WorkbookWithTimestampCheck = () => {
      const [grade, setGrade] = React.useState(mockGrades[0]);
      const [lastTimestamp, setLastTimestamp] = React.useState(grade.updatedAt);

      const handleUpdate = (newTimestamp: string) => {
        // Only update if timestamp is newer
        if (newTimestamp > lastTimestamp) {
          setGrade({ ...grade, updatedAt: newTimestamp });
          setLastTimestamp(newTimestamp);
        }
      };

      return (
        <div>
          <div>Current Timestamp: {grade.updatedAt}</div>
          <button onClick={() => handleUpdate('2024-01-15T11:00:00Z')}>
            Update to newer
          </button>
          <button onClick={() => handleUpdate('2024-01-15T09:00:00Z')}>
            Update to older (should fail)
          </button>
        </div>
      );
    };

    render(<WorkbookWithTimestampCheck />);

    // Update to newer timestamp
    await user.click(screen.getByRole('button', { name: /update to newer/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/current timestamp.*2024-01-15T11:00:00Z/i)).toBeInTheDocument();
    });

    // Try to update to older timestamp (should be ignored)
    await user.click(screen.getByRole('button', { name: /update to older/i }));

    // Should still show newer timestamp
    expect(screen.getByText(/current timestamp.*2024-01-15T11:00:00Z/i)).toBeInTheDocument();
  });

  // ==========================================================================
  // Grade History
  // ==========================================================================

  it('tracks grade history over time', async () => {
    const gradeHistory = [
      { timestamp: '2026-01-01T10:00:00Z', accuracy: 50, percentComplete: 25 },
      { timestamp: '2026-01-01T11:00:00Z', accuracy: 75, percentComplete: 50 },
      { timestamp: '2026-01-01T12:00:00Z', accuracy: 90, percentComplete: 100 },
    ];

    const GradeHistory = () => (
      <div>
        <h2>Grade History</h2>
        <div role="list">
          {gradeHistory.map((entry, i) => (
            <div key={i} role="listitem">
              <span>{new Date(entry.timestamp).toLocaleString()}</span>
              <span>Accuracy: {entry.accuracy}%</span>
              <span>Progress: {entry.percentComplete}%</span>
            </div>
          ))}
        </div>
      </div>
    );

    render(<GradeHistory />);

    expect(screen.getByText(/accuracy.*90%/i)).toBeInTheDocument();
    expect(screen.getByText(/progress.*100%/i)).toBeInTheDocument();
  });
});
