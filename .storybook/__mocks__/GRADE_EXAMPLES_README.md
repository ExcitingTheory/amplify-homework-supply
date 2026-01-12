# Grade Mock Examples - Usage Guide

Comprehensive Grade mock data for Storybook stories, covering all common scenarios.

## Quick Start

```javascript
// In your story file
import { seedGradeExamples } from '../../.storybook/__mocks__/grade-examples';

export const YourStory = {
  loaders: [
    async () => {
      // Seed a specific scenario
      seedGradeExamples('in-progress');
    },
  ],
  render: () => <YourComponent />,
};
```

## Available Scenarios

### `'empty'` - Brand New Grade
Student just started, no progress made yet.
- 0% complete
- 0% accuracy
- No responses recorded
- No files submitted

**Use for**: Initial workbook load, new assignment stories

```javascript
seedGradeExamples('empty');
```

### `'in-progress'` - Partially Complete
Student has completed about half the exercises with mixed results.
- 45% complete
- 78% accuracy
- Some blocks done, some not started
- Multiple file submissions
- Has instructor feedback

**Use for**: Workbook resume scenarios, progress tracking UI

```javascript
seedGradeExamples('in-progress');
```

### `'complete-high'` - Excellent Performance
Student completed everything with high scores.
- 100% complete
- 95% accuracy
- All exercises answered correctly or nearly so
- Rich feedback from instructor
- Multiple file submissions

**Use for**: Results display, achievement screens, grade reports

```javascript
seedGradeExamples('complete-high');
```

### `'complete-low'` - Needs Improvement
Student finished but struggled with many questions.
- 100% complete
- 58% accuracy
- Many incorrect answers
- Detailed feedback on areas to improve

**Use for**: Review mode, remediation UI, re-attempt prompts

```javascript
seedGradeExamples('complete-low');
```

### `'audio'` - Audio Submissions
Grade with audio recording responses.
- Audio file IDs in responses
- Pronunciation feedback
- Custom answer blocks with audio

**Use for**: Audio recording UI, pronunciation exercises

```javascript
seedGradeExamples('audio');
```

### `'drawing'` - Drawing Submissions
Grade with drawing/canvas submissions.
- Drawing file IDs in responses
- Visual feedback
- Custom answer blocks with drawings

**Use for**: Drawing pad UI, kanji practice, visual exercises

```javascript
seedGradeExamples('drawing');
```

### `'flagged'` - Moderation Review
Grade flagged by content moderation system.
- Moderation status: 'flagged'
- Moderation flags with reasons
- Requires instructor review

**Use for**: Moderation queue UI, instructor review workflows

```javascript
seedGradeExamples('flagged');
```

### `'timed'` - Timed Exercise
Active timed exercise in progress.
- Timer started
- Timer metadata in data field
- Partial completion
- Timestamps on each answer

**Use for**: Timed quiz UI, countdown timers, exam mode

```javascript
seedGradeExamples('timed');
```

### `'multiple-attempts'` - Progress Over Time
Array of 3 grades showing improvement.
- Attempt 1: 65% accuracy
- Attempt 2: 78% accuracy
- Attempt 3: 92% accuracy

**Use for**: Progress charts, attempt history, learning curves

```javascript
seedGradeExamples('multiple-attempts');
```

### `'multiple-learners'` - Multiple Students
Array of 5 grades for different students in same unit.
- Alice: 94% accuracy (completed, high performer)
- Bob: 76% accuracy (completed, average)
- Charlie: 82% accuracy (60% complete, in progress)
- Diana: 55% accuracy (completed, struggling)
- Eve: 0% accuracy (not started)

**Use for**: Instructor dashboard, gradebook, class roster, analytics

```javascript
seedGradeExamples('multiple-learners');
```

## Using Individual Grade Objects

Import specific grades directly without seeding:

```javascript
import gradeExamples from '../../.storybook/__mocks__/grade-examples';
import { seedMockGrade } from '../../.storybook/__mocks__/aws-amplify-datastore';

export const CustomStory = {
  loaders: [
    async () => {
      // Customize a grade before seeding
      const customGrade = {
        ...gradeExamples.inProgressGrade,
        id: 'my-custom-grade-id',
        accuracy: 65,
      };
      seedMockGrade(customGrade);
    },
  ],
};
```

## Rubric Examples

Rubrics are arrays of block keys extracted from the Unit's Lexical editor state. They contain keys of all graded block types (quiz, meaning-association, answer, custom-answer).

```javascript
import gradeExamples from '../../.storybook/__mocks__/grade-examples';

// Simple rubric with 3 blocks
gradeExamples.simpleRubric
// ['quiz-block-1', 'meaning-assoc-1', 'custom-q-1']

// Standard rubric with mix of types
gradeExamples.standardRubric
// ['quiz-block-1', 'quiz-block-2', 'meaning-assoc-1', 'answer-block-1', 'custom-q-1', 'custom-q-2']

// Complex rubric for large units
gradeExamples.complexRubric
// 12 blocks including multiple quizzes, meaning associations, answers, and custom questions

// Vocabulary-focused rubric
gradeExamples.vocabularyRubric
// 7 blocks, mostly meaning-association and answer blocks

// Quiz-heavy rubric
gradeExamples.quizRubric
// 6 quiz blocks

// Mixed media rubric
gradeExamples.mixedMediaRubric
// Includes audio and drawing custom answer blocks

// Empty rubric (informational unit with no graded content)
gradeExamples.emptyRubric
// []
```

### Using Rubrics in Stories

```javascript
export const YourStory = {
  loaders: [
    async () => {
      const { seedMockUnit } = await import('../../.storybook/__mocks__/aws-amplify-datastore');
      const gradeExamples = await import('../../.storybook/__mocks__/grade-examples');
      
      // Create unit state with graded blocks matching the rubric
      const unitData = {
        root: {
          children: [
            { type: 'heading', key: 'heading-1', /* ... */ },
            { type: 'quiz', key: 'quiz-block-1', /* ... */ },
            { type: 'meaning-association', key: 'meaning-assoc-1', /* ... */ },
            { type: 'custom-answer', key: 'custom-q-1', /* ... */ },
          ]
        }
      };
      
      seedMockUnit({
        id: 'unit-1',
        name: 'Test Unit',
        data: unitData,
        _version: 1,
      });
      
      // The rubric will be automatically extracted from the unit data
      // It will contain: ['quiz-block-1', 'meaning-assoc-1', 'custom-q-1']
    },
  ],
};
```

## Grade Data Structure

Each grade contains:

```typescript
{
  id: string;
  unitID: string;
  owner: string;                    // Student username
  instructor: string | null;        // Instructor username
  identityId: string;               // Cognito identity
  unitVersion: number;              // Unit version when started
  percentComplete: number;          // 0-100
  accuracy: number;                 // 0-100
  complete: boolean;
  timerStarted: boolean;
  data: string;                     // JSON string of responses
  feedback: string | null;          // JSON string of feedback
  files: string[];                  // Array of file IDs
  moderationStatus: string | null;  // 'approved' | 'flagged' | 'rejected'
  moderationFlags: string | null;   // JSON string
  moderationCheckedAt: string | null; // ISO datetime
  createdAt: string;                // ISO datetime
  updatedAt: string;                // ISO datetime
  _version: number;                 // DataStore OCC version
  _lastChangedAt: number;           // Unix timestamp
  _deleted: boolean;
}
```

## Grade Data Field Structure

The `data` field is a JSON string that when parsed becomes:

```javascript
{
  // Quiz block
  'quiz-block-1': {
    complete: true,
    accuracy: 75,
    responses: {
      'quiz-q1': { selected: 'Answer', correct: true },
      'quiz-q2': { selected: 'Answer', correct: false }
    }
  },
  
  // Meaning association block
  'meaning-assoc-1': {
    complete: true,
    accuracy: 80,
    matches: {
      'word-id-1': 'Definition text',
      'word-id-2': 'Definition text'
    }
  },
  
  // Custom answer block
  'custom-q-1': {
    complete: true,
    accuracy: 85,
    userAnswer: 'Student\'s text answer',
    audioFileId: 'file-id',        // Optional
    drawingFileId: 'file-id',      // Optional
    feedback: 'Instructor feedback'
  },
  
  // Answer block (vocabulary)
  'answer-block-1': {
    complete: true,
    accuracy: 90,
    responses: {
      'word-id-1': {
        textAnswer: 'Translation',
        audioAnswer: 'audio-file.mp3',
        audioFileId: 'file-id',
        accuracy: 90
      }
    }
  },
  
  // Timer metadata (for timed exercises)
  timerStartedAt: '2024-01-20T10:00:00Z',
  timeLimit: 1800000  // milliseconds
}
```

## Feedback Field Structure

The `feedback` field is a JSON string:

```javascript
{
  overall: 'General feedback for entire assignment',
  blockFeedback: {
    'block-id-1': 'Specific feedback for this block',
    'block-id-2': 'Specific feedback for this block'
  },
  instructorNotes: 'Private notes for instructor records'
}
```

## Common Patterns

### Testing Grade Updates

```javascript
import { seedMockGrade } from '../../.storybook/__mocks__/aws-amplify-datastore';
import gradeExamples from '../../.storybook/__mocks__/grade-examples';

// Start with empty grade
seedMockGrade(gradeExamples.emptyGrade);

// Simulate updating as user completes exercises
// This would happen via DataStore.save in actual component
const updatedGrade = {
  ...gradeExamples.emptyGrade,
  percentComplete: 25,
  accuracy: 80,
  data: JSON.stringify({
    'quiz-block-1': {
      complete: true,
      accuracy: 80,
      responses: { /* ... */ }
    }
  }),
  _version: 2  // Increment version for OCC
};
seedMockGrade(updatedGrade);
```

### Testing Multiple Students

```javascript
// Use the pre-built multiple learners array
seedGradeExamples('multiple-learners');

// Or create custom student roster
const studentGrades = [
  { ...gradeExamples.completeHighScoreGrade, id: 'grade-student-1', owner: 'student1' },
  { ...gradeExamples.inProgressGrade, id: 'grade-student-2', owner: 'student2' },
  { ...gradeExamples.completeLowScoreGrade, id: 'grade-student-3', owner: 'student3' },
];

studentGrades.forEach(grade => seedMockGrade(grade));

// Or use the multipleLearnersGrades directly
import gradeExamples from '../../.storybook/__mocks__/grade-examples';
gradeExamples.multipleLearnersGrades.forEach(grade => seedMockGrade(grade));
```

### Testing Grade History

```javascript
// Use multipleAttempts for showing improvement over time
seedGradeExamples('multiple-attempts');

// Rubric Structure

The rubric is an array of block keys representing all gradeable blocks in a unit:

```javascript
// Extracted from Unit.data.root.children
const rubric = ['quiz-block-1', 'meaning-assoc-1', 'custom-q-1', 'answer-block-1'];

// Used for progress tracking
const totalQuestions = rubric.length; // 4
const completedQuestions = Object.keys(gradeData).filter(key => 
  gradeData[key].complete
).length;
const percentComplete = (completedQuestions / totalQuestions) * 100;
```

Graded block types (from `unitContext.js`):
- `quiz` - Multiple choice/true-false questions
- `meaning-association` - Match words to definitions
- `answer` - Vocabulary translation exercises
- `custom-answer` - Free-form text/audio/drawing responses

## Tips

1. **Always increment `_version`** when updating a grade to match Amplify's Optimistic Concurrency Control
2. **Update `updatedAt`** timestamp when modifying grades
3. **Match block IDs** in grade data with actual block IDs in your unit's Lexical state and rubric
4. **Use realistic file IDs** that match files you've seeded with `seedMockFiles`
5. **JSON.stringify() the data and feedback** fields - they're stored as strings in DynamoDB
6. **Rubric keys must match** the keys in the grade's data field for accurate progress calculation

## Tips

1. **Always increment `_version`** when updating a grade to match Amplify's Optimistic Concurrency Control
2. **Update `updatedAt`** timestamp when modifying grades
3. **Match block IDs** in grade data with actual block IDs in your unit's Lexical state
4. **Use realistic file IDs** that match files you've seeded with `seedMockFiles`
5. **JSON.stringify() the data and feedback** fields - they're stored as strings in DynamoDB

## See Also

- [aws-amplify-datastore.js](./__mocks__/aws-amplify-datastore.js) - DataStore mock implementation
- [media.js](./__mocks__/media.js) - Mock audio/video files for submissions
- [src/context/unitContext.js](../../src/context/unitContext.js) - Grade management in production code
- [docs/API.md](../../docs/API.md) - Complete data model documentation
