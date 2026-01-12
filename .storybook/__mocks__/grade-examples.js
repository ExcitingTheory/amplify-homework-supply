/**
 * Comprehensive Grade Mock Examples for Storybook
 * 
 * This file provides ready-to-use Grade mock data for various scenarios.
 * Import and use these in your stories to ensure consistent, realistic test data.
 * 
 * Grade Model Structure:
 * - id: Unique identifier
 * - unitID: Reference to the Unit being graded
 * - owner: User who owns the grade (student)
 * - instructor: Optional instructor username
 * - identityId: Cognito identity ID
 * - unitVersion: Version of the unit when grade was created
 * - percentComplete: 0-100 percentage
 * - accuracy: 0-100 percentage
 * - complete: Boolean flag
 * - timerStarted: Boolean flag for timed exercises
 * - data: AWSJSON string containing block-level responses
 * - feedback: AWSJSON string containing instructor/AI feedback
 * - files: Array of file IDs (student submissions)
 * - moderationStatus: Content moderation status
 * - moderationFlags: AWSJSON string with moderation details
 * - moderationCheckedAt: AWSDateTime of last moderation check
 * - createdAt: AWSDateTime
 * - updatedAt: AWSDateTime
 * - _version: DataStore version for OCC
 * - _lastChangedAt: Timestamp for sync
 * - _deleted: Boolean flag
 */

/**
 * Empty Grade - Just started, no progress
 */
export const emptyGrade = {
  id: 'grade-empty-1',
  unitID: 'mock-unit-id',
  owner: 'mock-user-sub',
  identityId: 'mock-identity-id',
  instructor: null,
  unitVersion: 1,
  percentComplete: 0,
  accuracy: 0,
  complete: false,
  timerStarted: false,
  data: JSON.stringify({}),
  feedback: null,
  files: [],
  moderationStatus: null,
  moderationFlags: null,
  moderationCheckedAt: null,
  createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
  _version: 1,
  _lastChangedAt: Date.parse('2024-01-15T10:00:00Z'),
  _deleted: false,
};

/**
 * In-Progress Grade - Partially complete with mixed accuracy
 */
export const inProgressGrade = {
  id: 'grade-progress-1',
  unitID: 'mock-unit-id',
  owner: 'mock-user-sub',
  identityId: 'mock-identity-id',
  instructor: 'teacher-1',
  unitVersion: 1,
  percentComplete: 45,
  accuracy: 78,
  complete: false,
  timerStarted: true,
  data: JSON.stringify({
    // Quiz block responses
    'quiz-block-1': {
      complete: true,
      accuracy: 75,
      responses: {
        'quiz-q1': { selected: 'Hello', correct: true },
        'quiz-q2': { selected: 'Goodbye', correct: false },
        'quiz-q3': { selected: 'Thank you', correct: true },
        'quiz-q4': { selected: 'Please', correct: true },
      }
    },
    // Meaning association responses
    'meaning-assoc-1': {
      complete: true,
      accuracy: 80,
      matches: {
        'vocab-word-1': 'Hello (Japanese)',
        'vocab-word-2': 'Cat (Japanese)',
        'vocab-word-3': 'Thank you (Japanese)',
      }
    },
    // Custom answer - partially complete
    'custom-q-1': {
      complete: true,
      accuracy: 85,
      userAnswer: 'Paris is the capital of France.',
      feedback: 'Correct! Good detail.'
    },
    // Custom answer - not started
    'custom-q-2': {
      complete: false,
      accuracy: 0,
      userAnswer: null
    }
  }),
  feedback: JSON.stringify({
    overall: 'Good progress so far! Keep practicing pronunciation.',
    blockFeedback: {
      'quiz-block-1': 'Review question 2 - focus on farewell greetings',
      'meaning-assoc-1': 'Excellent matching!',
      'custom-q-1': 'Well explained'
    }
  }),
  files: ['file-submission-1', 'file-submission-2'],
  moderationStatus: 'approved',
  moderationFlags: null,
  moderationCheckedAt: new Date('2024-01-15T10:30:00Z').toISOString(),
  createdAt: new Date('2024-01-15T09:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-15T11:15:00Z').toISOString(),
  _version: 5,
  _lastChangedAt: Date.parse('2024-01-15T11:15:00Z'),
  _deleted: false,
};

/**
 * Complete Grade - High score, all exercises done
 */
export const completeHighScoreGrade = {
  id: 'grade-complete-high-1',
  unitID: 'mock-unit-id',
  owner: 'mock-user-sub',
  identityId: 'mock-identity-id',
  instructor: 'teacher-1',
  unitVersion: 1,
  percentComplete: 100,
  accuracy: 95,
  complete: true,
  timerStarted: true,
  data: JSON.stringify({
    'quiz-block-1': {
      complete: true,
      accuracy: 100,
      responses: {
        'quiz-q1': { selected: 'Hello', correct: true },
        'quiz-q2': { selected: 'さようなら', correct: true },
        'quiz-q3': { selected: 'Thank you', correct: true },
        'quiz-q4': { selected: 'Please', correct: true },
      }
    },
    'meaning-assoc-1': {
      complete: true,
      accuracy: 100,
      matches: {
        'vocab-word-1': 'Hello (Japanese)',
        'vocab-word-2': 'Cat (Japanese)',
        'vocab-word-3': 'Thank you (Japanese)',
        'vocab-word-4': 'Dog (Japanese)',
        'vocab-word-5': 'Goodbye (Japanese)',
      }
    },
    'custom-q-1': {
      complete: true,
      accuracy: 95,
      userAnswer: 'Paris is the capital of France, known for the Eiffel Tower and rich cultural history.',
      feedback: 'Excellent answer with good detail!'
    },
    'custom-q-2': {
      complete: true,
      accuracy: 90,
      userAnswer: 'Photosynthesis is the process by which plants convert light energy into chemical energy using carbon dioxide and water to produce glucose and release oxygen.',
      feedback: 'Very thorough explanation!'
    }
  }),
  feedback: JSON.stringify({
    overall: 'Outstanding work! You have mastered this material.',
    blockFeedback: {
      'quiz-block-1': 'Perfect score!',
      'meaning-assoc-1': 'Excellent vocabulary retention',
      'custom-q-1': 'Great detail',
      'custom-q-2': 'Thorough understanding demonstrated'
    },
    instructorNotes: 'Student shows strong comprehension. Ready for next unit.'
  }),
  files: ['file-submission-1', 'file-submission-2', 'file-submission-3'],
  moderationStatus: 'approved',
  moderationFlags: null,
  moderationCheckedAt: new Date('2024-01-15T14:00:00Z').toISOString(),
  createdAt: new Date('2024-01-15T09:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-15T13:45:00Z').toISOString(),
  _version: 12,
  _lastChangedAt: Date.parse('2024-01-15T13:45:00Z'),
  _deleted: false,
};

/**
 * Complete Grade - Low score, needs improvement
 */
export const completeLowScoreGrade = {
  id: 'grade-complete-low-1',
  unitID: 'mock-unit-id',
  owner: 'mock-user-sub',
  identityId: 'mock-identity-id',
  instructor: 'teacher-1',
  unitVersion: 1,
  percentComplete: 100,
  accuracy: 58,
  complete: true,
  timerStarted: true,
  data: JSON.stringify({
    'quiz-block-1': {
      complete: true,
      accuracy: 50,
      responses: {
        'quiz-q1': { selected: 'Hello', correct: true },
        'quiz-q2': { selected: 'Thank you', correct: false },
        'quiz-q3': { selected: 'Goodbye', correct: false },
        'quiz-q4': { selected: 'Please', correct: true },
      }
    },
    'meaning-assoc-1': {
      complete: true,
      accuracy: 60,
      matches: {
        'vocab-word-1': 'Goodbye (Japanese)', // Wrong
        'vocab-word-2': 'Cat (Japanese)', // Correct
        'vocab-word-3': 'Hello (Japanese)', // Wrong
        'vocab-word-4': 'Dog (Japanese)', // Correct
        'vocab-word-5': 'Thank you (Japanese)', // Wrong
      }
    },
    'custom-q-1': {
      complete: true,
      accuracy: 65,
      userAnswer: 'Paris',
      feedback: 'Correct but could use more detail.'
    },
    'custom-q-2': {
      complete: true,
      accuracy: 55,
      userAnswer: 'Plants make food from sunlight.',
      feedback: 'Basic understanding but missing key details about CO2, water, and oxygen production.'
    }
  }),
  feedback: JSON.stringify({
    overall: 'You completed all exercises, but there are areas that need more practice. Review the vocabulary and try again.',
    blockFeedback: {
      'quiz-block-1': 'Review farewell and gratitude expressions',
      'meaning-assoc-1': 'Mix-up between greetings - study the differences',
      'custom-q-1': 'Add more detail to your answers',
      'custom-q-2': 'Review the process more carefully - include all steps'
    },
    instructorNotes: 'Student needs additional practice with vocabulary. Recommend reviewing before moving forward.'
  }),
  files: ['file-submission-1'],
  moderationStatus: 'approved',
  moderationFlags: null,
  moderationCheckedAt: new Date('2024-01-16T10:00:00Z').toISOString(),
  createdAt: new Date('2024-01-16T08:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-16T09:30:00Z').toISOString(),
  _version: 8,
  _lastChangedAt: Date.parse('2024-01-16T09:30:00Z'),
  _deleted: false,
};

/**
 * Grade with Audio Submissions
 */
export const gradeWithAudioSubmissions = {
  id: 'grade-audio-1',
  unitID: 'mock-unit-id',
  owner: 'mock-user-sub',
  identityId: 'mock-identity-id',
  instructor: 'teacher-1',
  unitVersion: 1,
  percentComplete: 100,
  accuracy: 88,
  complete: true,
  timerStarted: false,
  data: JSON.stringify({
    'custom-q-audio-1': {
      complete: true,
      accuracy: 90,
      userAnswer: 'audio-file-1.mp3',
      feedback: 'Great pronunciation! Minor accent on final syllable.',
      audioFileId: 'file-audio-submission-1'
    },
    'custom-q-audio-2': {
      complete: true,
      accuracy: 85,
      userAnswer: 'audio-file-2.mp3',
      feedback: 'Good effort. Practice the "r" sound more.',
      audioFileId: 'file-audio-submission-2'
    },
    'answer-block-1': {
      complete: true,
      accuracy: 90,
      responses: {
        'vocab-word-1': {
          textAnswer: 'Hello',
          audioAnswer: 'audio-file-3.mp3',
          audioFileId: 'file-audio-submission-3',
          accuracy: 90
        }
      }
    }
  }),
  feedback: JSON.stringify({
    overall: 'Excellent pronunciation work! Keep practicing.',
    blockFeedback: {
      'custom-q-audio-1': 'Well done on こんにちは',
      'custom-q-audio-2': 'Good progress on ありがとう',
      'answer-block-1': 'Clear pronunciation'
    }
  }),
  files: ['file-audio-submission-1', 'file-audio-submission-2', 'file-audio-submission-3'],
  moderationStatus: 'approved',
  moderationFlags: null,
  moderationCheckedAt: new Date('2024-01-17T15:00:00Z').toISOString(),
  createdAt: new Date('2024-01-17T14:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-17T14:45:00Z').toISOString(),
  _version: 6,
  _lastChangedAt: Date.parse('2024-01-17T14:45:00Z'),
  _deleted: false,
};

/**
 * Grade with Drawing Submissions
 */
export const gradeWithDrawingSubmissions = {
  id: 'grade-drawing-1',
  unitID: 'mock-unit-id',
  owner: 'mock-user-sub',
  identityId: 'mock-identity-id',
  instructor: 'teacher-1',
  unitVersion: 1,
  percentComplete: 100,
  accuracy: 92,
  complete: true,
  timerStarted: false,
  data: JSON.stringify({
    'custom-q-drawing-1': {
      complete: true,
      accuracy: 95,
      userAnswer: 'drawing-file-1.png',
      feedback: 'Excellent sketch! Clear representation of kanji structure.',
      drawingFileId: 'file-drawing-submission-1'
    },
    'custom-q-drawing-2': {
      complete: true,
      accuracy: 88,
      userAnswer: 'drawing-file-2.png',
      feedback: 'Good work. Pay attention to stroke order.',
      drawingFileId: 'file-drawing-submission-2'
    }
  }),
  feedback: JSON.stringify({
    overall: 'Great visual learning! Your drawings show good understanding.',
    blockFeedback: {
      'custom-q-drawing-1': 'Kanji structure is accurate',
      'custom-q-drawing-2': 'Remember stroke order rules'
    }
  }),
  files: ['file-drawing-submission-1', 'file-drawing-submission-2'],
  moderationStatus: 'approved',
  moderationFlags: null,
  moderationCheckedAt: new Date('2024-01-18T11:00:00Z').toISOString(),
  createdAt: new Date('2024-01-18T10:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-18T10:50:00Z').toISOString(),
  _version: 4,
  _lastChangedAt: Date.parse('2024-01-18T10:50:00Z'),
  _deleted: false,
};

/**
 * Grade Flagged for Moderation
 */
export const gradeFlaggedForModeration = {
  id: 'grade-flagged-1',
  unitID: 'mock-unit-id',
  owner: 'mock-user-sub',
  identityId: 'mock-identity-id',
  instructor: 'teacher-1',
  unitVersion: 1,
  percentComplete: 100,
  accuracy: 70,
  complete: true,
  timerStarted: false,
  data: JSON.stringify({
    'custom-q-1': {
      complete: true,
      accuracy: 70,
      userAnswer: 'Some potentially inappropriate content here...',
      feedback: 'Answer flagged for review'
    }
  }),
  feedback: JSON.stringify({
    overall: 'Grade under review',
    blockFeedback: {
      'custom-q-1': 'Content flagged by moderation system'
    }
  }),
  files: [],
  moderationStatus: 'flagged',
  moderationFlags: JSON.stringify({
    flags: [
      {
        blockId: 'custom-q-1',
        reason: 'potentially_inappropriate',
        confidence: 0.65,
        details: 'Content may contain inappropriate language'
      }
    ],
    requiresReview: true
  }),
  moderationCheckedAt: new Date('2024-01-19T09:00:00Z').toISOString(),
  createdAt: new Date('2024-01-19T08:30:00Z').toISOString(),
  updatedAt: new Date('2024-01-19T09:00:00Z').toISOString(),
  _version: 3,
  _lastChangedAt: Date.parse('2024-01-19T09:00:00Z'),
  _deleted: false,
};

/**
 * Timed Exercise Grade - Started but not finished
 */
export const timedExerciseInProgress = {
  id: 'grade-timed-1',
  unitID: 'mock-unit-id',
  owner: 'mock-user-sub',
  identityId: 'mock-identity-id',
  instructor: 'teacher-1',
  unitVersion: 1,
  percentComplete: 30,
  accuracy: 0,
  complete: false,
  timerStarted: true,
  data: JSON.stringify({
    timerStartedAt: new Date('2024-01-20T10:00:00Z').toISOString(),
    timeLimit: 1800000, // 30 minutes in milliseconds
    'quiz-block-1': {
      complete: true,
      accuracy: 75,
      responses: {
        'quiz-q1': { selected: 'Hello', correct: true, answeredAt: new Date('2024-01-20T10:02:00Z').toISOString() },
        'quiz-q2': { selected: 'Goodbye', correct: false, answeredAt: new Date('2024-01-20T10:03:30Z').toISOString() },
        'quiz-q3': { selected: 'Thank you', correct: true, answeredAt: new Date('2024-01-20T10:05:00Z').toISOString() },
        'quiz-q4': { selected: 'Please', correct: true, answeredAt: new Date('2024-01-20T10:06:15Z').toISOString() },
      }
    }
  }),
  feedback: null,
  files: [],
  moderationStatus: null,
  moderationFlags: null,
  moderationCheckedAt: null,
  createdAt: new Date('2024-01-20T10:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-20T10:06:15Z').toISOString(),
  _version: 4,
  _lastChangedAt: Date.parse('2024-01-20T10:06:15Z'),
  _deleted: false,
};

/**
 * Multiple Attempts - Array of grades for the same unit showing progress over time
 */
export const multipleAttempts = [
  {
    id: 'grade-attempt-1',
    unitID: 'mock-unit-id',
    owner: 'mock-user-sub',
    identityId: 'mock-identity-id',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 100,
    accuracy: 65,
    complete: true,
    timerStarted: true,
    data: JSON.stringify({
      'quiz-block-1': { complete: true, accuracy: 50 },
      'meaning-assoc-1': { complete: true, accuracy: 70 },
      'custom-q-1': { complete: true, accuracy: 75 }
    }),
    feedback: JSON.stringify({ overall: 'First attempt - good start!' }),
    files: [],
    moderationStatus: 'approved',
    moderationFlags: null,
    moderationCheckedAt: new Date('2024-01-10T10:00:00Z').toISOString(),
    createdAt: new Date('2024-01-10T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-10T09:45:00Z').toISOString(),
    _version: 8,
    _lastChangedAt: Date.parse('2024-01-10T09:45:00Z'),
    _deleted: false,
  },
  {
    id: 'grade-attempt-2',
    unitID: 'mock-unit-id',
    owner: 'mock-user-sub',
    identityId: 'mock-identity-id',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 100,
    accuracy: 78,
    complete: true,
    timerStarted: true,
    data: JSON.stringify({
      'quiz-block-1': { complete: true, accuracy: 75 },
      'meaning-assoc-1': { complete: true, accuracy: 80 },
      'custom-q-1': { complete: true, accuracy: 80 }
    }),
    feedback: JSON.stringify({ overall: 'Much improved! Keep practicing.' }),
    files: [],
    moderationStatus: 'approved',
    moderationFlags: null,
    moderationCheckedAt: new Date('2024-01-12T14:00:00Z').toISOString(),
    createdAt: new Date('2024-01-12T13:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-12T13:50:00Z').toISOString(),
    _version: 9,
    _lastChangedAt: Date.parse('2024-01-12T13:50:00Z'),
    _deleted: false,
  },
  {
    id: 'grade-attempt-3',
    unitID: 'mock-unit-id',
    owner: 'mock-user-sub',
    identityId: 'mock-identity-id',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 100,
    accuracy: 92,
    complete: true,
    timerStarted: true,
    data: JSON.stringify({
      'quiz-block-1': { complete: true, accuracy: 100 },
      'meaning-assoc-1': { complete: true, accuracy: 90 },
      'custom-q-1': { complete: true, accuracy: 85 }
    }),
    feedback: JSON.stringify({ overall: 'Excellent mastery!' }),
    files: [],
    moderationStatus: 'approved',
    moderationFlags: null,
    moderationCheckedAt: new Date('2024-01-15T16:00:00Z').toISOString(),
    createdAt: new Date('2024-01-15T15:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-15T15:55:00Z').toISOString(),
    _version: 11,
    _lastChangedAt: Date.parse('2024-01-15T15:55:00Z'),
    _deleted: false,
  }
];

/**
 * Helper function to seed grade data in Storybook
 * Import seedMockGrade from aws-amplify-datastore mock
 */
export function seedGradeExamples(scenario = 'empty') {
  const { seedMockGrade } = require('./aws-amplify-datastore');
  
  switch (scenario) {
    case 'empty':
      seedMockGrade(emptyGrade);
      break;
    case 'in-progress':
      seedMockGrade(inProgressGrade);
      break;
    case 'complete-high':
      seedMockGrade(completeHighScoreGrade);
      break;
    case 'complete-low':
      seedMockGrade(completeLowScoreGrade);
      break;
    case 'audio':
      seedMockGrade(gradeWithAudioSubmissions);
      break;
    case 'drawing':
      seedMockGrade(gradeWithDrawingSubmissions);
      break;
    case 'flagged':
      seedMockGrade(gradeFlaggedForModeration);
      break;
    case 'timed':
      seedMockGrade(timedExerciseInProgress);
      break;
    case 'multiple-attempts':
      multipleAttempts.forEach(grade => seedMockGrade(grade));
      break;
    case 'multiple-learners':
      multipleLearnersGrades.forEach(grade => seedMockGrade(grade));
      break;
    default:
      seedMockGrade(emptyGrade);
  }
}

/**
 * Multiple Learners - Grades for different students in the same class
 * Useful for instructor dashboards, class rosters, gradebook views
 */
export const multipleLearnersGrades = [
  // Student 1 - High performer
  {
    id: 'grade-learner-1',
    unitID: 'mock-unit-id',
    owner: 'student-alice-sub',
    identityId: 'identity-alice',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 100,
    accuracy: 94,
    complete: true,
    timerStarted: true,
    data: JSON.stringify({
      'quiz-block-1': { complete: true, accuracy: 100 },
      'meaning-assoc-1': { complete: true, accuracy: 95 },
      'custom-q-1': { complete: true, accuracy: 90 },
      'answer-block-1': { complete: true, accuracy: 92 }
    }),
    feedback: JSON.stringify({
      overall: 'Excellent work, Alice! Outstanding comprehension.',
      blockFeedback: {
        'quiz-block-1': 'Perfect score!',
        'meaning-assoc-1': 'Minor error on one word, but great overall',
        'custom-q-1': 'Well-detailed answer',
        'answer-block-1': 'Good pronunciation'
      }
    }),
    files: ['file-alice-1', 'file-alice-2'],
    moderationStatus: 'approved',
    moderationFlags: null,
    moderationCheckedAt: new Date('2024-01-20T14:00:00Z').toISOString(),
    createdAt: new Date('2024-01-20T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-20T13:30:00Z').toISOString(),
    _version: 8,
    _lastChangedAt: Date.parse('2024-01-20T13:30:00Z'),
    _deleted: false,
  },
  // Student 2 - Average performer
  {
    id: 'grade-learner-2',
    unitID: 'mock-unit-id',
    owner: 'student-bob-sub',
    identityId: 'identity-bob',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 100,
    accuracy: 76,
    complete: true,
    timerStarted: true,
    data: JSON.stringify({
      'quiz-block-1': { complete: true, accuracy: 75 },
      'meaning-assoc-1': { complete: true, accuracy: 70 },
      'custom-q-1': { complete: true, accuracy: 80 },
      'answer-block-1': { complete: true, accuracy: 78 }
    }),
    feedback: JSON.stringify({
      overall: 'Good effort, Bob. Practice vocabulary more.',
      blockFeedback: {
        'quiz-block-1': 'Review questions 2 and 4',
        'meaning-assoc-1': 'Focus on similar-sounding words',
        'custom-q-1': 'Good answer structure',
        'answer-block-1': 'Pronunciation needs work'
      }
    }),
    files: ['file-bob-1'],
    moderationStatus: 'approved',
    moderationFlags: null,
    moderationCheckedAt: new Date('2024-01-20T15:00:00Z').toISOString(),
    createdAt: new Date('2024-01-20T10:30:00Z').toISOString(),
    updatedAt: new Date('2024-01-20T14:45:00Z').toISOString(),
    _version: 7,
    _lastChangedAt: Date.parse('2024-01-20T14:45:00Z'),
    _deleted: false,
  },
  // Student 3 - Still in progress
  {
    id: 'grade-learner-3',
    unitID: 'mock-unit-id',
    owner: 'student-charlie-sub',
    identityId: 'identity-charlie',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 60,
    accuracy: 82,
    complete: false,
    timerStarted: true,
    data: JSON.stringify({
      'quiz-block-1': { complete: true, accuracy: 88 },
      'meaning-assoc-1': { complete: true, accuracy: 75 },
      'custom-q-1': { complete: true, accuracy: 85 },
      'answer-block-1': { complete: false, accuracy: 0 }
    }),
    feedback: null,
    files: ['file-charlie-1'],
    moderationStatus: null,
    moderationFlags: null,
    moderationCheckedAt: null,
    createdAt: new Date('2024-01-20T11:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-20T13:15:00Z').toISOString(),
    _version: 5,
    _lastChangedAt: Date.parse('2024-01-20T13:15:00Z'),
    _deleted: false,
  },
  // Student 4 - Struggling
  {
    id: 'grade-learner-4',
    unitID: 'mock-unit-id',
    owner: 'student-diana-sub',
    identityId: 'identity-diana',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 100,
    accuracy: 55,
    complete: true,
    timerStarted: true,
    data: JSON.stringify({
      'quiz-block-1': { complete: true, accuracy: 50 },
      'meaning-assoc-1': { complete: true, accuracy: 45 },
      'custom-q-1': { complete: true, accuracy: 60 },
      'answer-block-1': { complete: true, accuracy: 65 }
    }),
    feedback: JSON.stringify({
      overall: 'Diana, please review the material and try again. Let\'s schedule office hours.',
      blockFeedback: {
        'quiz-block-1': 'Many incorrect answers - review lesson',
        'meaning-assoc-1': 'Vocabulary confusion - use flashcards',
        'custom-q-1': 'Answer lacks detail',
        'answer-block-1': 'Practice pronunciation with audio'
      },
      instructorNotes: 'May need additional support or tutoring'
    }),
    files: [],
    moderationStatus: 'approved',
    moderationFlags: null,
    moderationCheckedAt: new Date('2024-01-20T16:00:00Z').toISOString(),
    createdAt: new Date('2024-01-20T09:30:00Z').toISOString(),
    updatedAt: new Date('2024-01-20T15:30:00Z').toISOString(),
    _version: 9,
    _lastChangedAt: Date.parse('2024-01-20T15:30:00Z'),
    _deleted: false,
  },
  // Student 5 - Not started
  {
    id: 'grade-learner-5',
    unitID: 'mock-unit-id',
    owner: 'student-eve-sub',
    identityId: 'identity-eve',
    instructor: 'teacher-1',
    unitVersion: 1,
    percentComplete: 0,
    accuracy: 0,
    complete: false,
    timerStarted: false,
    data: JSON.stringify({}),
    feedback: null,
    files: [],
    moderationStatus: null,
    moderationFlags: null,
    moderationCheckedAt: null,
    createdAt: new Date('2024-01-20T08:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-20T08:00:00Z').toISOString(),
    _version: 1,
    _lastChangedAt: Date.parse('2024-01-20T08:00:00Z'),
    _deleted: false,
  },
];

/**
 * Example Rubrics - Arrays of block keys that are graded
 * Rubric is extracted from the Unit's Lexical editor state
 * Contains keys of all blocks with gradedBlockTypes: quiz, meaning-association, answer, custom-answer
 */

// Simple rubric - 3 graded blocks
export const simpleRubric = [
  'quiz-block-1',
  'meaning-assoc-1',
  'custom-q-1'
];

// Standard rubric - Mix of question types
export const standardRubric = [
  'quiz-block-1',
  'quiz-block-2',
  'meaning-assoc-1',
  'answer-block-1',
  'custom-q-1',
  'custom-q-2'
];

// Complex rubric - Large unit with many exercises
export const complexRubric = [
  'quiz-block-1',
  'quiz-block-2',
  'quiz-block-3',
  'meaning-assoc-1',
  'meaning-assoc-2',
  'answer-block-1',
  'answer-block-2',
  'custom-q-1',
  'custom-q-2',
  'custom-q-3',
  'custom-q-4',
  'quiz-block-4'
];

// Vocabulary-heavy rubric - Lots of meaning association and answer blocks
export const vocabularyRubric = [
  'meaning-assoc-1',
  'meaning-assoc-2',
  'meaning-assoc-3',
  'answer-block-1',
  'answer-block-2',
  'answer-block-3',
  'answer-block-4'
];

// Quiz-heavy rubric - Multiple quiz blocks
export const quizRubric = [
  'quiz-block-1',
  'quiz-block-2',
  'quiz-block-3',
  'quiz-block-4',
  'quiz-block-5',
  'quiz-block-6'
];

// Mixed media rubric - Custom answer blocks with audio/drawing
export const mixedMediaRubric = [
  'quiz-block-1',
  'custom-q-audio-1',
  'custom-q-audio-2',
  'custom-q-drawing-1',
  'custom-q-text-1',
  'meaning-assoc-1',
  'answer-block-1'
];

// Empty rubric - No graded blocks (informational unit)
export const emptyRubric = [];

// Export all examples for direct use
export default {
  emptyGrade,
  inProgressGrade,
  completeHighScoreGrade,
  completeLowScoreGrade,
  gradeWithAudioSubmissions,
  gradeWithDrawingSubmissions,
  gradeFlaggedForModeration,
  timedExerciseInProgress,
  multipleAttempts,
  multipleLearnersGrades,
  // Rubrics
  simpleRubric,
  standardRubric,
  complexRubric,
  vocabularyRubric,
  quizRubric,
  mixedMediaRubric,
  emptyRubric,
  seedGradeExamples,
};
