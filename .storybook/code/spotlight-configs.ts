/**
 * Spotlight Configuration System
 * 
 * Defines specific target elements, positions, and step-by-step guidance
 * for each onboarding task across all personas
 */

import { SpotlightStep } from '../components/SpotlightOverlay';

export interface SpotlightConfig {
  /** Task ID this config applies to */
  taskId: string;
  
  /** Tutorial mode steps (detailed, guided) */
  tutorialSteps: SpotlightStep[];
  
  /** Quiz mode steps (minimal guidance, test knowledge) */
  quizSteps: SpotlightStep[];
}

/**
 * Get spotlight configuration for a specific task
 */
export function getSpotlightConfigForTask(taskId: string, mode: 'tutorial' | 'quiz'): SpotlightStep[] {
  const config = SPOTLIGHT_CONFIGURATIONS.find(c => c.taskId === taskId);
  if (!config) {
    // Return default steps if no config found
    return getDefaultSteps(taskId, mode);
  }
  
  return mode === 'tutorial' ? config.tutorialSteps : config.quizSteps;
}

/**
 * Default steps when no specific configuration exists
 */
function getDefaultSteps(taskId: string, mode: 'tutorial' | 'quiz'): SpotlightStep[] {
  return [
    {
      id: `${taskId}-intro`,
      title: mode === 'tutorial' ? 'Let\'s Get Started' : 'Ready to Try?',
      description: mode === 'tutorial' 
        ? 'Follow along with this guided tutorial to learn this feature.'
        : 'Complete this task to demonstrate your understanding.',
      tooltipPosition: 'center',
    },
    {
      id: `${taskId}-complete`,
      title: 'Task Complete!',
      description: 'Move on when you\'re ready.',
      tooltipPosition: 'center',
      isLast: true,
    },
  ];
}

/**
 * All spotlight configurations for every onboarding task
 */
export const SPOTLIGHT_CONFIGURATIONS: SpotlightConfig[] = [
  // ============================================================
  // INSTRUCTOR TASKS
  // ============================================================
  
  {
    taskId: 'instructor-setup-class',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Set Up Your First Class',
        description: 'Learn how to create a class section where students can join and access assignments.',
        tooltipPosition: 'center',
        actions: [
          'We\'ll navigate to the Sections page',
          'Use the "Create Section" option',
          'Fill in class details',
          'Get a shareable join code',
        ],
      },
      {
        id: 'navigate',
        title: 'Sections Page',
        description: 'This is where you manage all your class sections.',
        targetSelector: '[data-tour="sections-page"]',
        tooltipPosition: 'bottom',
        actions: [
          'View all your sections here',
          'Each section has its own join code',
          'Students use join codes to enroll',
        ],
      },
      {
        id: 'create-button',
        title: 'Create Section Button',
        description: 'Use this to start creating a new class section.',
        targetSelector: '[data-tour="create-section-button"], button:has-text("Create Section"), button:has-text("New Section")',
        tooltipPosition: 'bottom',
      },
      {
        id: 'form',
        title: 'Section Details',
        description: 'Fill in your class information.',
        targetSelector: '[data-tour="section-form"], form',
        tooltipPosition: 'right',
        actions: [
          'Enter a descriptive name (e.g., "Japanese 101 - Fall 2026")',
          'Select grade level if applicable',
          'Configure settings like assignment visibility',
          'Click Save to create your section',
        ],
      },
      {
        id: 'join-code',
        title: 'Share Join Code',
        description: 'Students use this code to join your class.',
        targetSelector: '[data-tour="join-code"], [class*="joinCode"]',
        tooltipPosition: 'left',
        actions: [
          'Copy the generated join code',
          'Share it with your students via email or LMS',
          'Students enter this code to enroll',
        ],
      },
      {
        id: 'complete',
        title: 'Class Created! 🎉',
        description: 'You\'ve successfully created your first class section.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Create a Class',
        description: 'Navigate to Sections and create a new class on your own.',
        tooltipPosition: 'center',
        actions: [
          'Find the Sections page',
          'Click Create Section',
          'Fill in all required fields',
          'Save and get your join code',
        ],
      },
      {
        id: 'verify',
        title: 'Did You Complete It?',
        description: 'Mark this task complete if you successfully created a section.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'instructor-create-unit',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Create Your First Unit',
        description: 'Units are learning modules containing lessons, media, and assessments.',
        tooltipPosition: 'center',
        actions: [
          'Navigate to the Units page',
          'Create a new unit',
          'Add engaging content',
          'Save for future assignments',
        ],
      },
      {
        id: 'units-page',
        title: 'Units Library',
        description: 'All your reusable learning content lives here.',
        targetSelector: '[data-tour="units-page"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'create-button',
        title: 'Create Unit Button',
        description: 'Start building new learning content.',
        targetSelector: '[data-tour="create-unit-button"], button:has-text("Create Unit"), button:has-text("New Unit")',
        tooltipPosition: 'bottom',
      },
      {
        id: 'editor',
        title: 'The Editor',
        description: 'Type "/" for commands, or use the toolbar to format content.',
        targetSelector: '[data-tour="editor"], [class*="ContentEditable"]',
        tooltipPosition: 'top',
        actions: [
          'Type your lesson content',
          'Add headings, lists, and formatting',
          'Insert images and media',
          'Add interactive quiz blocks',
        ],
      },
      {
        id: 'toolbar',
        title: 'Editor Toolbar',
        description: 'Quick access to formatting and content tools.',
        targetSelector: '[data-tour="editor-toolbar"], [class*="toolbar"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'save',
        title: 'Save Your Work',
        description: 'Don\'t forget to save your unit!',
        targetSelector: '[data-tour="save-button"], button:has-text("Save")',
        tooltipPosition: 'left',
      },
      {
        id: 'complete',
        title: 'Unit Created! 📚',
        description: 'Your unit is ready to assign to students.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Build a Unit',
        description: 'Create a complete learning unit with content.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Successfully Created?',
        description: 'Mark complete if you created and saved a unit.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'instructor-add-quiz',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Add Quiz Blocks',
        description: 'Create interactive questions that test student understanding.',
        tooltipPosition: 'center',
        actions: [
          'Open a unit in the Editor',
          'Insert a quiz block',
          'Add question and answers',
          'Mark the correct choice',
        ],
      },
      {
        id: 'slash-command',
        title: 'Type "/" for Commands',
        description: 'The slash menu gives you quick access to all block types.',
        targetSelector: '[data-tour="editor"], [class*="ContentEditable"]',
        tooltipPosition: 'right',
        actions: [
          'Click in the editor and type "/"',
          'Browse available blocks',
          'Select "Quiz" to insert a question',
        ],
      },
      {
        id: 'quiz-block',
        title: 'Quiz Block',
        description: 'This is where you configure your question.',
        targetSelector: '[data-tour="quiz-block"], [class*="QuizNode"]',
        tooltipPosition: 'right',
        actions: [
          'Enter your question text',
          'Add 2-4 answer choices',
          'Click the checkbox to mark the correct answer',
          'Add explanation text (optional)',
        ],
      },
      {
        id: 'answer-choices',
        title: 'Answer Choices',
        description: 'Students select from these options.',
        targetSelector: '[data-tour="quiz-answers"], [class*="answer"]',
        tooltipPosition: 'left',
      },
      {
        id: 'correct-answer',
        title: 'Mark Correct Answer',
        description: 'Click the checkbox next to the right answer.',
        targetSelector: '[data-tour="correct-checkbox"], input[type="checkbox"]',
        tooltipPosition: 'left',
      },
      {
        id: 'complete',
        title: 'Quiz Added! ✅',
        description: 'Students will now answer this question when completing the unit.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Add a Quiz',
        description: 'Insert a quiz block with at least 2 answers.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Quiz Created?',
        description: 'Complete if you added a quiz with a marked correct answer.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'instructor-create-vocabulary',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Build Your Dictionary',
        description: 'Add vocabulary words that students can practice and reference.',
        tooltipPosition: 'center',
      },
      {
        id: 'dictionary-editor',
        title: 'Dictionary Editor',
        description: 'Manage all vocabulary across your units.',
        targetSelector: '[data-tour="dictionary-editor"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'add-word',
        title: 'Add Word Button',
        description: 'Create a new vocabulary entry.',
        targetSelector: '[data-tour="add-word-button"], button:has-text("Add Word")',
        tooltipPosition: 'bottom',
      },
      {
        id: 'word-form',
        title: 'Word Details',
        description: 'Fill in all the information for this word.',
        targetSelector: '[data-tour="word-form"]',
        tooltipPosition: 'right',
        actions: [
          'Enter the Japanese word',
          'Add romanization (romaji)',
          'Provide English definition',
          'Upload or record audio pronunciation',
          'Link to related units',
        ],
      },
      {
        id: 'audio-upload',
        title: 'Audio Pronunciation',
        description: 'Help students learn correct pronunciation.',
        targetSelector: '[data-tour="audio-upload"], input[type="file"]',
        tooltipPosition: 'left',
      },
      {
        id: 'complete',
        title: 'Word Added! 📖',
        description: 'This word is now available in your dictionary.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Add Vocabulary',
        description: 'Create at least one complete vocabulary entry.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Word Created?',
        description: 'Complete if you added a word with definition.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'instructor-create-assignment',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Assign Work to Students',
        description: 'Give your students units to complete with due dates.',
        tooltipPosition: 'center',
      },
      {
        id: 'section-view',
        title: 'Assignment Dialog',
        description: 'This dialog lets you create assignments for your section.',
        tooltipPosition: 'center',
      },
      {
        id: 'create-assignment',
        title: 'Create Assignment',
        description: 'Configure and save the assignment.',
        targetSelector: '[data-tour="create-assignment-button"], button:has-text("Create Assignment")',
        tooltipPosition: 'bottom',
      },
      {
        id: 'select-unit',
        title: 'Select a Unit',
        description: 'Choose which unit to assign.',
        targetSelector: '[data-tour="unit-selector"]',
        tooltipPosition: 'right',
      },
      {
        id: 'due-date',
        title: 'Set Due Date',
        description: 'When should students complete this?',
        targetSelector: '[data-tour="due-date-picker"], input[type="date"], input[type="datetime-local"]',
        tooltipPosition: 'left',
        actions: [
          'Pick a date and time',
          'Students see this deadline',
          'Late submissions can be tracked',
        ],
      },
      {
        id: 'settings',
        title: 'Assignment Settings',
        description: 'Configure how students interact with this assignment.',
        targetSelector: '[data-tour="assignment-settings"]',
        tooltipPosition: 'right',
        actions: [
          'Allow late submissions?',
          'Show answers immediately?',
          'Allow multiple attempts?',
        ],
      },
      {
        id: 'complete',
        title: 'Assignment Created! 📝',
        description: 'Students can now see and complete this assignment.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Create Assignment',
        description: 'Assign a unit to a section with a due date.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Assignment Created?',
        description: 'Complete if you successfully created an assignment.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'instructor-view-grades',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Review Student Work',
        description: 'See how students are performing and provide feedback.',
        tooltipPosition: 'center',
      },
      {
        id: 'grades-tab',
        title: 'Grades Tab',
        description: 'All student submissions are here.',
        targetSelector: '[data-tour="grades-tab"], button:has-text("Grades"), [role="tab"]:has-text("Grades")',
        tooltipPosition: 'bottom',
      },
      {
        id: 'grade-list',
        title: 'Submissions List',
        description: 'View all graded work by student or assignment.',
        targetSelector: '[data-tour="grades-list"]',
        tooltipPosition: 'right',
        actions: [
          'Filter by student or assignment',
          'Sort by date or score',
          'Click to view details',
        ],
      },
      {
        id: 'grade-detail',
        title: 'Grade Details',
        description: 'Review individual responses and provide feedback.',
        targetSelector: '[data-tour="grade-detail"]',
        tooltipPosition: 'left',
        actions: [
          'See each question and answer',
          'View accuracy percentage',
          'Leave comments for the student',
          'Adjust scores if needed',
        ],
      },
      {
        id: 'complete',
        title: 'Grading Complete! ✅',
        description: 'You can now track student progress and performance.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: View Grades',
        description: 'Navigate to grades and review a submission.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Reviewed Grades?',
        description: 'Complete if you viewed student submissions.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'instructor-use-ai-assistant',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'AI-Powered Content Creation',
        description: 'Let AI help you create engaging lessons faster.',
        tooltipPosition: 'center',
      },
      {
        id: 'chat-button',
        title: 'Open AI Assistant',
        description: 'Click to open the chat sidebar.',
        targetSelector: '[data-tour="chat-button"], button[aria-label*="chat"], button[aria-label*="AI"]',
        tooltipPosition: 'left',
      },
      {
        id: 'chat-sidebar',
        title: 'AI Chat',
        description: 'Describe what you want to create.',
        targetSelector: '[data-tour="chat-sidebar"]',
        tooltipPosition: 'left',
        actions: [
          'Type a request (e.g., "Create a quiz about Japanese greetings")',
          'Be specific about what you need',
          'Ask for revisions if needed',
        ],
      },
      {
        id: 'ai-response',
        title: 'AI Suggestions',
        description: 'Review and use AI-generated content.',
        targetSelector: '[data-tour="ai-message"]',
        tooltipPosition: 'left',
        actions: [
          'Read the AI response',
          'Click "Insert" to add to your unit',
          'Edit and customize as needed',
          'Ask follow-up questions',
        ],
      },
      {
        id: 'insert-button',
        title: 'Insert Content',
        description: 'Add AI suggestions directly to your lesson.',
        targetSelector: '[data-tour="insert-button"], button:has-text("Insert")',
        tooltipPosition: 'top',
      },
      {
        id: 'complete',
        title: 'AI Assistant Mastered! 🤖',
        description: 'Use AI to create content 10x faster.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Use AI',
        description: 'Generate content using the AI assistant.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'AI Content Created?',
        description: 'Complete if you used AI to generate content.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'instructor-learn-shortcuts',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Master Keyboard Shortcuts',
        description: 'Learn shortcuts to create content faster and more efficiently.',
        tooltipPosition: 'center',
      },
      {
        id: 'help-menu',
        title: 'Help → Keyboard Shortcuts',
        description: 'Find the comprehensive shortcuts reference.',
        targetSelector: '[data-tour="help-menu"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'shortcuts-page',
        title: 'Shortcuts Reference',
        description: 'All available keyboard shortcuts organized by category.',
        targetSelector: '[data-tour="shortcuts-page"]',
        tooltipPosition: 'bottom',
        actions: [
          'Bookmark this page for quick access',
          'Try each shortcut in the editor',
          'Focus on formatting shortcuts first',
          'Practice block type shortcuts',
        ],
      },
      {
        id: 'demo-story',
        title: 'Watch the Demo',
        description: 'See an automated demonstration of all shortcuts.',
        targetSelector: '[data-tour="shortcuts-demo"]',
        tooltipPosition: 'right',
        actions: [
          'Watch the automated playthrough',
          'See each shortcut in action',
          'Pause to try shortcuts yourself',
          'Replay as many times as needed',
        ],
      },
      {
        id: 'practice',
        title: 'Practice Makes Perfect',
        description: 'Try these common shortcuts now:',
        tooltipPosition: 'center',
        actions: [
          '⌘B or Ctrl+B - Bold text',
          '⌘I or Ctrl+I - Italic text',
          '⌘U or Ctrl+U - Underline',
          '⌘⇧1-3 - Headings (H1, H2, H3)',
          '⌘⇧7 - Ordered list',
          '⌘⇧8 - Bullet list',
          '⌘Z - Undo',
          '⌘⇧Z - Redo',
        ],
      },
      {
        id: 'complete',
        title: 'Shortcut Master! ⚡',
        description: 'You\'re now equipped to create content lightning-fast.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Learn 5 Shortcuts',
        description: 'Practice at least 5 keyboard shortcuts.',
        tooltipPosition: 'center',
        actions: [
          'Try Bold, Italic, and Underline',
          'Create a heading with keyboard',
          'Make a list using shortcuts',
        ],
      },
      {
        id: 'verify',
        title: 'Shortcuts Practiced?',
        description: 'Complete if you can use 5+ shortcuts confidently.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  // ============================================================
  // LEARNER TASKS
  // ============================================================

  {
    taskId: 'learner-join-class',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Join Your Class',
        description: 'Use your instructor\'s join code to enroll in their section.',
        tooltipPosition: 'center',
      },
      {
        id: 'join-button',
        title: 'Join Section Button',
        description: 'Use this to open the join dialog.',
        targetSelector: '[data-tour="join-section-button"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'join-dialog',
        title: 'Join Section Dialog',
        description: 'This dialog lets you join an instructor\'s class.',
        targetSelector: '[data-tour="join-section-dialog"]',
        tooltipPosition: 'right',
      },
      {
        id: 'join-code-input',
        title: 'Enter Join Code',
        description: 'Type the code your instructor gave you. In this demo, use DEMO-2026.',
        targetSelector: '[data-tour="join-code-input"]',
        tooltipPosition: 'top',
      },
      {
        id: 'confirm',
        title: 'Submit to Join',
        description: 'Submit your join code to enroll in the class.',
        targetSelector: '[data-tour="join-section-dialog"] button[type="submit"]',
        tooltipPosition: 'top',
      },
      {
        id: 'complete',
        title: 'Enrolled! 🎓',
        description: 'You\'re now part of the class and can access assignments.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Join a Class',
        description: 'Use a join code to enroll in a section.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Successfully Joined?',
        description: 'Complete if you enrolled in a section.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'learner-view-assignments',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'View Your Assignments',
        description: 'See what your instructor has assigned to you.',
        tooltipPosition: 'center',
      },
      {
        id: 'section',
        title: 'Your Section',
        description: 'Open your class to see assignments.',
        targetSelector: '[data-tour="section-card"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'assignments-tab',
        title: 'Assignments Tab',
        description: 'All your work is listed here.',
        targetSelector: '[data-tour="assignments-tab"], [role="tab"]:has-text("Assignments")',
        tooltipPosition: 'bottom',
      },
      {
        id: 'assignment-list',
        title: 'Assignment List',
        description: 'See all units assigned to you with due dates.',
        targetSelector: '[data-tour="assignments-list"]',
        tooltipPosition: 'right',
        actions: [
          'Click to open and complete',
          'Check due dates',
          'See completion status',
        ],
      },
      {
        id: 'complete',
        title: 'Assignments Found! 📚',
        description: 'You now know where to find your work.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Find Assignments',
        description: 'Navigate to your section and view assignments.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Found Assignments?',
        description: 'Complete if you can see your assignment list.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'learner-complete-assignment',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Complete Your Work',
        description: 'Learn how to answer questions and submit assignments.',
        tooltipPosition: 'center',
      },
      {
        id: 'workbook',
        title: 'The Workbook',
        description: 'Read through the lesson content, answer quiz questions, record audio, and fill in blanks. Click "Next" when you\'re ready to continue.',
        targetSelector: '[data-tour="workbook"]',
        tooltipPosition: 'bottom',
        interactable: true,
        actions: [
          'Read lesson content and PDFs',
          'Answer quiz questions',
          'Record audio responses',
          'Fill in vocabulary answers',
          'Submit your answers',
        ],
      },
      {
        id: 'complete',
        title: 'Assignment Submitted! ✅',
        description: 'Great work completing your assignment.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Complete Work',
        description: 'Finish an assignment and submit it.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Assignment Submitted?',
        description: 'Complete if you successfully submitted work.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'learner-review-feedback',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Review Your Feedback',
        description: 'See your scores and instructor comments.',
        tooltipPosition: 'center',
      },
      {
        id: 'grades-section',
        title: 'My Work / Grades',
        description: 'Access all your graded assignments.',
        targetSelector: '[data-tour="my-grades"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'grade-card',
        title: 'Your Grade',
        description: 'See your score and accuracy.',
        targetSelector: '[data-tour="grade-card"]',
        tooltipPosition: 'left',
        actions: [
          'View overall accuracy percentage',
          'See which questions you missed',
          'Read instructor feedback',
        ],
      },
      {
        id: 'corrections',
        title: 'Learn from Mistakes',
        description: 'Review correct answers to improve.',
        targetSelector: '[data-tour="correct-answers"]',
        tooltipPosition: 'left',
      },
      {
        id: 'complete',
        title: 'Feedback Reviewed! 📊',
        description: 'Use this feedback to improve on future assignments.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Review Feedback',
        description: 'Find and review feedback on a submission.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Feedback Reviewed?',
        description: 'Complete if you viewed your grades and feedback.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'learner-practice-vocabulary',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Practice Vocabulary',
        description: 'Study words with audio and interactive exercises.',
        tooltipPosition: 'center',
      },
      {
        id: 'dictionary',
        title: 'Dictionary',
        description: 'Browse all vocabulary words.',
        targetSelector: '[data-tour="dictionary"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'word-card',
        title: 'Vocabulary Card',
        description: 'See word details and practice pronunciation.',
        targetSelector: '[data-tour="word-card"]',
        tooltipPosition: 'right',
        actions: [
          'Read the definition',
          'Listen to pronunciation',
          'Practice saying it yourself',
          'Mark as learned',
        ],
      },
      {
        id: 'audio-button',
        title: 'Listen to Audio',
        description: 'Click to hear correct pronunciation.',
        targetSelector: '[data-tour="play-audio"], button[aria-label*="Play"]',
        tooltipPosition: 'left',
      },
      {
        id: 'complete',
        title: 'Vocabulary Practiced! 📖',
        description: 'Keep practicing to master new words.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Study Words',
        description: 'Practice at least 5 vocabulary words.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Words Practiced?',
        description: 'Complete if you studied vocabulary.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'learner-use-chat-help',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Get AI Help',
        description: 'Ask the AI assistant for translations and explanations.',
        tooltipPosition: 'center',
      },
      {
        id: 'chat-button',
        title: 'Open Chat',
        description: 'Click to open the AI assistant.',
        targetSelector: '[data-tour="chat-button"], button[aria-label*="chat"]',
        tooltipPosition: 'left',
      },
      {
        id: 'chat-input',
        title: 'Ask Your Question',
        description: 'Type anything you need help with.',
        targetSelector: '[data-tour="chat-input"], textarea, input[placeholder*="message"]',
        tooltipPosition: 'top',
        actions: [
          'Ask for translations',
          'Get grammar explanations',
          'Request practice examples',
          'Ask follow-up questions',
        ],
      },
      {
        id: 'ai-response',
        title: 'AI Answer',
        description: 'Review the helpful response.',
        targetSelector: '[data-tour="ai-message"]',
        tooltipPosition: 'left',
      },
      {
        id: 'complete',
        title: 'AI Help Mastered! 🤖',
        description: 'Use the assistant anytime you need help.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Ask AI',
        description: 'Get help from the AI assistant.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Got AI Help?',
        description: 'Complete if you asked a question and got an answer.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'learner-learn-shortcuts',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Learn Helpful Shortcuts',
        description: 'Speed up your work with keyboard shortcuts.',
        tooltipPosition: 'center',
      },
      {
        id: 'practice',
        title: 'Essential Shortcuts',
        description: 'Try these shortcuts while working:',
        tooltipPosition: 'center',
        actions: [
          '⌘Z / Ctrl+Z - Undo a mistake',
          'Tab - Accept AI suggestions',
          'Enter - Submit in text fields',
          'Escape - Close dialogs',
          'Arrow Keys - Navigate between questions',
          '⌘A / Ctrl+A - Select all text',
        ],
      },
      {
        id: 'complete',
        title: 'Shortcuts Learned! ⚡',
        description: 'You can now work faster and more efficiently.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Practice Shortcuts',
        description: 'Use at least 3 keyboard shortcuts.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Shortcuts Used?',
        description: 'Complete if you practiced shortcuts.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  // ============================================================
  // DEVELOPER TASKS
  // ============================================================

  {
    taskId: 'developer-explore-components',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Explore Component Library',
        description: 'Familiarize yourself with all available components.',
        tooltipPosition: 'center',
      },
      {
        id: 'sidebar',
        title: 'Storybook Sidebar',
        description: 'All components are organized here.',
        targetSelector: '[data-tour="storybook-sidebar"], #storybook-explorer-tree',
        tooltipPosition: 'right',
        actions: [
          'Browse categories',
          'Click to view components',
          'Each story shows examples',
        ],
      },
      {
        id: 'tech-overview',
        title: 'Technical Overview',
        description: 'Start here to understand the architecture.',
        targetSelector: '[data-tour="tech-overview"]',
        tooltipPosition: 'right',
      },
      {
        id: 'docs-tab',
        title: 'Docs Tab',
        description: 'Read component documentation.',
        targetSelector: '[data-tour="docs-tab"], button:has-text("Docs")',
        tooltipPosition: 'bottom',
      },
      {
        id: 'canvas-tab',
        title: 'Canvas Tab',
        description: 'Interact with live components.',
        targetSelector: '[data-tour="canvas-tab"], button:has-text("Canvas")',
        tooltipPosition: 'bottom',
      },
      {
        id: 'complete',
        title: 'Components Explored! 🧩',
        description: 'You now know where to find component documentation.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Explore Storybook',
        description: 'Browse at least 5 different component stories.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Components Explored?',
        description: 'Complete if you viewed multiple components.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'developer-understand-editor',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Understand the Editor',
        description: 'Learn about the Lexical-based rich text editor.',
        tooltipPosition: 'center',
      },
      {
        id: 'editor-section',
        title: 'Editor Stories',
        description: 'Find editor examples in "Creating Lessons".',
        targetSelector: '[data-tour="editor-stories"]',
        tooltipPosition: 'right',
      },
      {
        id: 'custom-nodes',
        title: 'Custom Nodes',
        description: 'Special blocks like Quiz, Answer, etc.',
        tooltipPosition: 'center',
        actions: [
          'QuizNode - Multiple choice questions',
          'AnswerNode - Fill-in-the-blank',
          'CustomAnswerNode - Advanced responses',
          'MeaningAssociationNode - Vocabulary matching',
        ],
      },
      {
        id: 'plugins',
        title: 'Editor Plugins',
        description: 'Check Editor3/plugins directory.',
        tooltipPosition: 'center',
        actions: [
          'ToolbarPlugin - Formatting controls',
          'AutocompletePlugin - AI suggestions',
          'MarkdownPlugin - Markdown support',
          'DataPlugin - Persistence',
        ],
      },
      {
        id: 'complete',
        title: 'Editor Understood! 📝',
        description: 'You now know how the editor system works.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Study Editor',
        description: 'Read editor documentation and view examples.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Editor Concepts Clear?',
        description: 'Complete if you understand the editor architecture.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'developer-explore-datastore',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'DataStore Patterns',
        description: 'Learn how we use AWS Amplify DataStore.',
        tooltipPosition: 'center',
      },
      {
        id: 'docs',
        title: 'Read Documentation',
        description: 'Study these key files:',
        tooltipPosition: 'center',
        actions: [
          'docs/API.md - Data models',
          'DATASTORE_OPTIMIZATION_CHANGES.md - Subscription patterns',
          'src/context/ - Context providers with DataStore',
        ],
      },
      {
        id: 'patterns',
        title: 'Key Patterns',
        description: 'Important concepts to understand:',
        tooltipPosition: 'center',
        actions: [
          'Use observeQuery for real-time updates',
          'One subscription per model (avoid duplicates)',
          'Always unsubscribe in cleanup',
          'Lazy load relationships with .toArray()',
          'Use DataStore.copyOf for updates',
        ],
      },
      {
        id: 'complete',
        title: 'DataStore Mastered! 💾',
        description: 'You can now work with DataStore correctly.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Study DataStore',
        description: 'Read docs and review context implementations.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'DataStore Understood?',
        description: 'Complete if you understand the patterns.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'developer-understand-ai-integration',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'AI Integration',
        description: 'Learn how OpenAI is integrated.',
        tooltipPosition: 'center',
      },
      {
        id: 'docs',
        title: 'Key Files',
        description: 'Study these implementations:',
        tooltipPosition: 'center',
        actions: [
          'docs/CHATBOT_TOOLS.md - Tool system',
          'pages/api/chat.js - Streaming endpoint',
          'src/components/ChatSidebar.js - UI component',
          'amplify/backend/function/openai/ - Lambda functions',
        ],
      },
      {
        id: 'concepts',
        title: 'Core Concepts',
        description: 'Understand these patterns:',
        tooltipPosition: 'center',
        actions: [
          'Vercel AI SDK for streaming',
          'useChat hook for state management',
          'Tool calling with client-side handlers',
          'Message parts array structure',
          'Edge runtime for better performance',
        ],
      },
      {
        id: 'complete',
        title: 'AI Integration Clear! 🤖',
        description: 'You can now work with AI features.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Study AI',
        description: 'Read AI documentation and review implementations.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'AI System Understood?',
        description: 'Complete if you understand the AI integration.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'developer-setup-dev-environment',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Dev Environment Setup',
        description: 'Get the project running locally.',
        tooltipPosition: 'center',
      },
      {
        id: 'clone',
        title: 'Clone Repository',
        description: 'Get the code from GitHub.',
        tooltipPosition: 'center',
        actions: [
          'git clone <repo-url>',
          'cd amplify-homework-supply',
        ],
      },
      {
        id: 'install',
        title: 'Install Dependencies',
        description: 'Run npm install.',
        tooltipPosition: 'center',
        actions: [
          'npm install',
          'This installs all packages from package.json',
        ],
      },
      {
        id: 'amplify',
        title: 'Configure Amplify',
        description: 'Set up AWS credentials.',
        tooltipPosition: 'center',
        actions: [
          'amplify pull --appId <app-id>',
          'Select your environment',
          'Enter AWS credentials',
        ],
      },
      {
        id: 'run',
        title: 'Start Dev Servers',
        description: 'Run both Next.js and Storybook.',
        tooltipPosition: 'center',
        actions: [
          'Terminal 1: npm run dev (port 3000)',
          'Terminal 2: npm run storybook (port 6006)',
        ],
      },
      {
        id: 'complete',
        title: 'Environment Ready! 🚀',
        description: 'You can now develop locally.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Set Up Environment',
        description: 'Get the project running on your machine.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Servers Running?',
        description: 'Complete if both dev and Storybook are working.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'developer-explore-file-structure',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Explore File Structure',
        description: 'Understand how the codebase is organized.',
        tooltipPosition: 'center',
      },
      {
        id: 'structure',
        title: 'Key Directories',
        description: 'Main folders to know:',
        tooltipPosition: 'center',
        actions: [
          'pages/ - Next.js routes',
          'src/components/ - React components',
          'src/context/ - Context providers',
          'src/utils/ - Helper functions',
          'amplify/backend/ - Backend resources',
          '.storybook/ - Storybook config',
        ],
      },
      {
        id: 'naming',
        title: 'Naming Conventions',
        description: 'File naming patterns:',
        tooltipPosition: 'center',
        actions: [
          'Components: PascalCase (ChatSidebar.js)',
          'Contexts: camelCase + Context (unitContext.js)',
          'Utils: camelCase (getCachedUrl.js)',
          '2 suffix = v2 (DictionaryEditor2.js)',
        ],
      },
      {
        id: 'complete',
        title: 'Structure Understood! 📁',
        description: 'You know where to find things.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Navigate Codebase',
        description: 'Find at least one file in each major directory.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Structure Clear?',
        description: 'Complete if you can navigate the codebase.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'developer-run-tests',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Run Tests and Linting',
        description: 'Ensure code quality.',
        tooltipPosition: 'center',
      },
      {
        id: 'lint',
        title: 'Run Linter',
        description: 'Check code style.',
        tooltipPosition: 'center',
        actions: [
          'npm run lint',
          'Fix issues with npm run lint:fix',
        ],
      },
      {
        id: 'unit-tests',
        title: 'Unit Tests',
        description: 'Run Vitest tests.',
        tooltipPosition: 'center',
        actions: [
          'npm run vitest',
          'Tests are in __tests__ directories',
        ],
      },
      {
        id: 'e2e-tests',
        title: 'E2E Tests',
        description: 'Run Cypress tests.',
        tooltipPosition: 'center',
        actions: [
          'npm run cypress:open',
          'Run tests interactively',
          'Tests are in cypress/e2e/',
        ],
      },
      {
        id: 'complete',
        title: 'Tests Running! ✅',
        description: 'You can now verify code quality.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Run All Tests',
        description: 'Execute linting, unit tests, and E2E tests.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Tests Pass?',
        description: 'Complete if all tests pass successfully.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'developer-customize-storybook',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Storybook Configuration',
        description: 'Learn how Storybook is customized.',
        tooltipPosition: 'center',
      },
      {
        id: 'main-config',
        title: 'main.ts',
        description: 'Main Storybook configuration.',
        tooltipPosition: 'center',
        actions: [
          'Webpack aliases',
          'Addon registration',
          'Story file patterns',
          'Feature flags',
        ],
      },
      {
        id: 'preview-config',
        title: 'preview.jsx',
        description: 'Global decorators and parameters.',
        tooltipPosition: 'center',
        actions: [
          'Theme provider setup',
          'Mock context providers',
          'Global parameters',
        ],
      },
      {
        id: 'mocks',
        title: '__mocks__ Directory',
        description: 'Mock AWS services for Storybook.',
        tooltipPosition: 'center',
        actions: [
          'DataStore mocks',
          'Auth mocks',
          'AI SDK mocks',
          'Mock data in ui-data/',
        ],
      },
      {
        id: 'complete',
        title: 'Storybook Mastered! 📖',
        description: 'You can now customize Storybook.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Study Config',
        description: 'Read through main.ts and preview.jsx.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Config Understood?',
        description: 'Complete if you understand Storybook setup.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'developer-keyboard-shortcuts-demo',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Keyboard Shortcuts Demo',
        description: 'Watch an automated demonstration of all editor shortcuts.',
        tooltipPosition: 'center',
      },
      {
        id: 'help-page',
        title: 'Shortcuts Reference',
        description: 'Find the comprehensive guide.',
        targetSelector: '[data-tour="help-shortcuts"]',
        tooltipPosition: 'bottom',
        actions: [
          'Bookmark this page',
          'Review all available shortcuts',
          'Organized by category',
        ],
      },
      {
        id: 'demo-story',
        title: 'Automated Demo',
        description: 'Watch shortcuts in action.',
        targetSelector: '[data-tour="shortcuts-demo"]',
        tooltipPosition: 'right',
        actions: [
          'Play the automated demonstration',
          'See each shortcut execute',
          'Pause to try yourself',
          'Replay as needed',
        ],
      },
      {
        id: 'categories',
        title: 'Shortcut Categories',
        description: 'Organized groups:',
        tooltipPosition: 'center',
        actions: [
          'Text Formatting (Bold, Italic, etc.)',
          'Block Types (Headings, Lists)',
          'Alignment (Left, Center, Right)',
          'Navigation (Undo, Redo)',
        ],
      },
      {
        id: 'complete',
        title: 'Demo Complete! ⌨️',
        description: 'You now know all available shortcuts.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Watch Demo',
        description: 'View the automated shortcuts demonstration.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Demo Watched?',
        description: 'Complete if you viewed the shortcuts demo.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  // ============================================================
  // SECRET/EASTER EGG TASKS
  // ============================================================

  {
    taskId: 'secret-keyboard-master',
    tutorialSteps: [
      {
        id: 'intro',
        title: '👑 SECRET CHALLENGE UNLOCKED',
        description: 'Become a Keyboard Master by completing interactive training!',
        tooltipPosition: 'center',
      },
      {
        id: 'training-mode',
        title: 'Interactive Training',
        description: 'Practice every shortcut with live feedback.',
        targetSelector: '[data-tour="interactive-training"]',
        tooltipPosition: 'center',
        actions: [
          'Each shortcut lights up when you need to practice it',
          'Press the key combination to complete',
          'Earn achievements as you progress',
          'Track your completion percentage',
        ],
      },
      {
        id: 'achievements',
        title: 'Earn Achievements',
        description: 'Unlock badges for specific shortcuts.',
        tooltipPosition: 'center',
        actions: [
          '⭐ Bold Beginner',
          '⭐ Italic Expert',
          '⭐ Format Master',
          '⭐ Heading Hero',
          '⭐ And many more!',
        ],
      },
      {
        id: 'complete',
        title: '👑 KEYBOARD MASTER ACHIEVED!',
        description: 'You\'ve mastered all keyboard shortcuts!',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '👑 Ultimate Challenge',
        description: 'Complete all 20 shortcut training exercises.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Master Status?',
        description: 'Complete if you finished all training.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'secret-speed-demon',
    tutorialSteps: [
      {
        id: 'intro',
        title: '⚡ SPEED DEMON CHALLENGE',
        description: 'Complete all keyboard training in under 5 minutes!',
        tooltipPosition: 'center',
      },
      {
        id: 'timer',
        title: 'Race Against Time',
        description: 'Every second counts.',
        tooltipPosition: 'center',
        actions: [
          'Start the timer',
          'Complete all shortcuts quickly',
          'Aim for 100% accuracy',
          'Finish under 5 minutes',
        ],
      },
      {
        id: 'complete',
        title: '⚡ SPEED DEMON UNLOCKED!',
        description: 'Lightning-fast keyboard mastery achieved!',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '⚡ Speed Challenge',
        description: 'Complete training in record time.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Under 5 Minutes?',
        description: 'Complete if you finished in time.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'secret-achievement-hunter',
    tutorialSteps: [
      {
        id: 'intro',
        title: '🏅 ACHIEVEMENT HUNTER',
        description: 'Collect all individual shortcut achievements!',
        tooltipPosition: 'center',
      },
      {
        id: 'badges',
        title: 'Achievement Badges',
        description: 'Each shortcut has a special achievement.',
        tooltipPosition: 'center',
        actions: [
          '⭐ Bold Beginner - Master bold formatting',
          '⭐ Italic Expert - Master italic formatting',
          '⭐ Format Master - Master all text formatting',
          '⭐ Heading Hero - Master heading shortcuts',
          '⭐ List Legend - Master list shortcuts',
          '⭐ Code Ninja - Master code block shortcuts',
          '⭐ Alignment Ace - Master alignment shortcuts',
          '⭐ Time Traveler - Master undo/redo',
        ],
      },
      {
        id: 'complete',
        title: '🏅 ALL ACHIEVEMENTS UNLOCKED!',
        description: 'You\'ve collected every achievement badge!',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🏅 Collect All Badges',
        description: 'Unlock every achievement.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'All Collected?',
        description: 'Complete when you have all badges.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'secret-shortcut-evangelist',
    tutorialSteps: [
      {
        id: 'intro',
        title: '📢 SHORTCUT EVANGELIST',
        description: 'Spread the word about productivity shortcuts!',
        tooltipPosition: 'center',
      },
      {
        id: 'share',
        title: 'Share Your Knowledge',
        description: 'Teach others what you\'ve learned.',
        tooltipPosition: 'center',
        actions: [
          'Show colleagues the shortcuts page',
          'Demonstrate shortcuts in your workflow',
          'Share productivity tips',
          'Help others get faster',
        ],
      },
      {
        id: 'complete',
        title: '📢 EVANGELIST ACHIEVED!',
        description: 'You\'re helping make everyone more productive!',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '📢 Spread the Word',
        description: 'Share shortcuts with your team.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Knowledge Shared?',
        description: 'Complete when you\'ve taught others.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  // ============================================================
  // TRANSLATOR TASKS
  // ============================================================

  {
    taskId: 'translator-language-switcher',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Language Switcher',
        description: 'Learn how to preview content in each supported locale using the toolbar.',
        tooltipPosition: 'center',
        actions: [
          'Find the globe icon in the toolbar',
          'Switch between languages',
          'Observe how UI text changes live',
        ],
      },
      {
        id: 'globe-icon',
        title: 'Find the Globe Icon',
        description: 'The 🌐 globe icon in the top toolbar opens the language selector.',
        targetSelector: '[data-tour="language-switcher"], button[aria-label*="language"], button[aria-label*="locale"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'select-language',
        title: 'Switch Language',
        description: 'Pick a language from the dropdown to preview the UI in that locale.',
        targetSelector: '[data-tour="language-dropdown"], [role="listbox"], [role="menu"]',
        tooltipPosition: 'bottom',
        actions: [
          'Try Japanese (ja) — text becomes shorter/different characters',
          'Try Spanish (es) — text often becomes longer',
          'Return to English (en) — the source locale',
        ],
      },
      {
        id: 'observe-changes',
        title: 'Spot the Differences',
        description: 'Look for text that did NOT change — those are untranslated strings.',
        tooltipPosition: 'center',
        actions: [
          'Buttons, labels, and headings should all update',
          'Any English text remaining in a non-English locale is a gap',
          'Note these for the "Find Missing Translations" task',
        ],
      },
      {
        id: 'complete',
        title: 'Language Switcher Mastered! 🌐',
        description: 'You can now preview the app in any supported language.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Switch Languages',
        description: 'Switch to two different languages and identify at least one untranslated string.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Languages Tested?',
        description: 'Complete if you previewed the UI in multiple languages.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'translator-translation-panel',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Translations Panel',
        description: 'The panel at the bottom of Storybook is your main translation workspace.',
        tooltipPosition: 'center',
        actions: [
          'Open the Translations tab',
          'Browse translation keys',
          'View metadata and status',
          'Export translations',
        ],
      },
      {
        id: 'panel-tab',
        title: 'Open the Translations Tab',
        description: 'Find the "Translations" tab in the addon panel at the bottom.',
        targetSelector: '[data-tour="translations-panel"], button[role="tab"]',
        tooltipPosition: 'top',
      },
      {
        id: 'key-list',
        title: 'Translation Key List',
        description: 'Each row shows a key, its English value, and translation status per locale.',
        targetSelector: '[data-tour="translation-keys"]',
        tooltipPosition: 'top',
        actions: [
          'Green check = translated',
          'Warning icon = missing translation',
          'Click a row to see full metadata',
        ],
      },
      {
        id: 'metadata',
        title: 'View Key Metadata',
        description: 'Click a row to expand rich context: description, component, impact, tone.',
        targetSelector: '[data-tour="translation-metadata"]',
        tooltipPosition: 'right',
        actions: [
          'Context — when/why users see this text',
          'Component Location — the React file using this key',
          'Impact — Critical, High, or Important',
          'Tone — Formal, Casual, or Technical',
        ],
      },
      {
        id: 'export',
        title: 'Export Translations',
        description: 'Download translation data as JSON or CSV for offline editing.',
        targetSelector: '[data-tour="export-button"], button:has-text("Export")',
        tooltipPosition: 'left',
      },
      {
        id: 'complete',
        title: 'Panel Explored! 📋',
        description: 'You now know where to find and edit all translation data.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Explore the Panel',
        description: 'Open the Translations panel and expand at least one key to view its metadata.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Panel Explored?',
        description: 'Complete if you browsed keys and viewed metadata.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'translator-view-missing',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Find Missing Translations',
        description: 'Learn to identify gaps and prioritize what to translate first.',
        tooltipPosition: 'center',
        actions: [
          'Open the Translations panel',
          'Switch locales to spot gaps',
          'Use impact levels to prioritize',
        ],
      },
      {
        id: 'open-panel',
        title: 'Open Translations Panel',
        description: 'Start by opening the panel for the current story.',
        targetSelector: '[data-tour="translations-panel"]',
        tooltipPosition: 'top',
      },
      {
        id: 'warning-icons',
        title: 'Spot Warning Icons',
        description: 'Rows with ⚠️ icons indicate missing translations for the selected locale.',
        targetSelector: '[data-tour="missing-translations"]',
        tooltipPosition: 'right',
        actions: [
          'Yellow ⚠️ = at least one locale is missing',
          'Red ❌ = no translation in any locale',
          'Green ✅ = fully translated',
        ],
      },
      {
        id: 'switch-locale',
        title: 'Switch Locales to Compare',
        description: 'Change the language to see which locale has the most gaps.',
        targetSelector: '[data-tour="language-switcher"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'prioritize',
        title: 'Prioritize by Impact',
        description: 'Critical (red) and High (orange) impact strings should be translated first.',
        tooltipPosition: 'center',
        actions: [
          'Critical — login, error messages, core navigation',
          'High — form labels, button text, headings',
          'Important — tooltips, help text, descriptions',
        ],
      },
      {
        id: 'complete',
        title: 'Gaps Identified! 🔍',
        description: 'You can now find and prioritize missing translations.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Find Gaps',
        description: 'Switch between two locales and count the missing translations in the editor namespace.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Gaps Found?',
        description: 'Complete if you identified missing translations.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'translator-locale-files',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Locale File Structure',
        description: 'Understand how translation JSON files are organized on disk.',
        tooltipPosition: 'center',
        actions: [
          'Files live in public/locales/{lang}/',
          'Each namespace = one JSON file',
          'English (en) is the source of truth',
        ],
      },
      {
        id: 'directory',
        title: 'Directory Layout',
        description: 'Translation files follow this structure:',
        tooltipPosition: 'center',
        actions: [
          'public/locales/en/common.json — shared UI strings',
          'public/locales/en/editor.json — editor-specific strings',
          'public/locales/en/auth.json — login/signup strings',
          'public/locales/ja/ mirrors en/ with Japanese values',
          'public/locales/es/ mirrors en/ with Spanish values',
        ],
      },
      {
        id: 'key-format',
        title: 'Key Format',
        description: 'Keys are nested JSON objects mapped to dot-notation paths.',
        tooltipPosition: 'center',
        actions: [
          'common.buttons.save → { "buttons": { "save": "Save" } }',
          'editor.toolbar.bold → { "toolbar": { "bold": "Bold" } }',
          'The Translations panel shows the dot-notation key',
        ],
      },
      {
        id: 'editor-namespace',
        title: 'Try the Editor Namespace',
        description: 'The "Editor Namespace" story shows how editor.json keys appear in the panel.',
        targetSelector: '[data-tour="namespace-selector"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'complete',
        title: 'Structure Understood! 📂',
        description: 'You now know where locale files live and how keys are organized.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Trace a Key',
        description: 'Find a key in the Translations panel and locate the corresponding file and path in public/locales/.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Key Located?',
        description: 'Complete if you can map a panel key to its file on disk.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'translator-component-context',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Component Context',
        description: 'Use metadata to understand where and how each translated string appears in the UI.',
        tooltipPosition: 'center',
        actions: [
          'Open the Auth Namespace story',
          'Expand a translation row',
          'Read context, tone, and user type metadata',
        ],
      },
      {
        id: 'auth-story',
        title: 'Open Auth Namespace',
        description: 'The Auth namespace has login/signup strings with rich context metadata.',
        targetSelector: '[data-tour="auth-namespace"]',
        tooltipPosition: 'right',
      },
      {
        id: 'expand-row',
        title: 'Expand a Translation Row',
        description: 'Click any row to reveal the full metadata panel.',
        targetSelector: '[data-tour="translation-row"]',
        tooltipPosition: 'right',
      },
      {
        id: 'context-field',
        title: 'Read the Context Field',
        description: 'This describes when users see the text and why it matters.',
        tooltipPosition: 'center',
        actions: [
          'Context — "Shown on the login page when credentials are invalid"',
          'Component — "src/components/AuthForm.tsx"',
          'User Type — "All users" or "Instructors only"',
          'Tone — "Formal" means avoid slang in translations',
        ],
      },
      {
        id: 'use-context',
        title: 'Apply Context to Translation',
        description: 'Better context leads to better translations.',
        tooltipPosition: 'center',
        actions: [
          'A "Critical" login error needs precise, clear language',
          'A "Casual" tooltip can be more conversational',
          'Check "Alternative Terms" for synonym suggestions',
        ],
      },
      {
        id: 'complete',
        title: 'Context Mastered! 🎯',
        description: 'You can now make context-aware translation decisions.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Read Context',
        description: 'Expand 3 translation rows and describe the tone and user type for each.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Context Reviewed?',
        description: 'Complete if you used metadata to understand string usage.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'translator-test-rtl',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'RTL Language Testing',
        description: 'Verify that the UI renders correctly for right-to-left languages.',
        tooltipPosition: 'center',
        actions: [
          'Switch to an RTL locale',
          'Check layout mirroring',
          'Look for breakage',
        ],
      },
      {
        id: 'switch-rtl',
        title: 'Switch to RTL',
        description: 'Select Arabic (ar) or Hebrew (he) if available in the language selector.',
        targetSelector: '[data-tour="language-switcher"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'check-layout',
        title: 'Check Layout Mirroring',
        description: 'The entire layout should flip — navigation on the right, content flowing right-to-left.',
        tooltipPosition: 'center',
        actions: [
          'Sidebar should appear on the right',
          'Text should be right-aligned',
          'Directional icons (arrows, chevrons) should flip',
        ],
      },
      {
        id: 'check-components',
        title: 'Test Across Components',
        description: 'Navigate to 2-3 different stories to verify RTL works everywhere.',
        tooltipPosition: 'center',
        actions: [
          'Check forms — labels should be on the right of inputs',
          'Check buttons — icon + text order may flip',
          'Check lists — bullet alignment should be right-side',
        ],
      },
      {
        id: 'report',
        title: 'Report Issues',
        description: 'Note any elements that use left/right instead of start/end CSS properties.',
        tooltipPosition: 'center',
        actions: [
          'Overlapping text = needs a width or direction fix',
          'Misaligned buttons = needs logical CSS properties',
          'Clipped content = needs overflow direction fix',
        ],
      },
      {
        id: 'complete',
        title: 'RTL Tested! ↔️',
        description: 'You\'ve verified right-to-left language support.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Test RTL',
        description: 'Switch to an RTL language and navigate to at least 2 different stories.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'RTL Verified?',
        description: 'Complete if you tested RTL layout across components.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },

  {
    taskId: 'translator-pluralization',
    tutorialSteps: [
      {
        id: 'intro',
        title: 'Pluralization Rules',
        description: 'Learn how i18next handles count-dependent translation forms.',
        tooltipPosition: 'center',
        actions: [
          'Find keys with {{count}}',
          'Understand plural suffixes',
          'Verify correct forms per locale',
        ],
      },
      {
        id: 'find-plural-keys',
        title: 'Find Plural Keys',
        description: 'Look for translation values containing {{count}} — these are pluralized.',
        targetSelector: '[data-tour="translation-keys"]',
        tooltipPosition: 'right',
        actions: [
          'English: "key" (1 item), "key_other" (0 or 2+ items)',
          'Example: "1 assignment" vs "5 assignments"',
        ],
      },
      {
        id: 'locale-rules',
        title: 'Per-Locale Plural Rules',
        description: 'Different languages have different plural categories.',
        tooltipPosition: 'center',
        actions: [
          'English: one, other (2 forms)',
          'Japanese: other (1 form — no grammatical plural)',
          'French: one, other (2 forms, but 0 is singular)',
          'Arabic: zero, one, two, few, many, other (6 forms)',
          'Russian: one, few, many, other (4 forms)',
        ],
      },
      {
        id: 'test-counts',
        title: 'Test with Different Counts',
        description: 'Verify the correct form is selected for each count value.',
        tooltipPosition: 'center',
        actions: [
          'count=0 — English uses "other" (0 items)',
          'count=1 — English uses "one" (1 item)',
          'count=2 — English uses "other" (2 items)',
          'count=5 — Verify "other" still applies',
          'count=11 — Some languages have special rules for teens',
        ],
      },
      {
        id: 'complete',
        title: 'Pluralization Mastered! 🔢',
        description: 'You understand how to handle count-dependent translations.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
    quizSteps: [
      {
        id: 'challenge',
        title: '🎯 Challenge: Verify Plurals',
        description: 'Find a pluralized key and verify it has the correct suffix forms for both English and Japanese.',
        tooltipPosition: 'center',
      },
      {
        id: 'verify',
        title: 'Plurals Verified?',
        description: 'Complete if you checked plural forms for a key across locales.',
        tooltipPosition: 'center',
        isLast: true,
      },
    ],
  },
];
