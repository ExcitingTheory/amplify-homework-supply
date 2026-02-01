import { OnboardingTask, UserPersona } from './onboarding-events';

/**
 * Criteria for automatically completing a task
 */
export interface TaskCompletionCriteria {
  /** Story ID where this task can be completed */
  storyId?: string;
  /** Actions that must be performed (OR logic - any one completes the task) */
  requiredActions?: string[];
  /** Sequence of actions that must be performed in order */
  requiredSequence?: string[];
  /** Custom completion function */
  customCheck?: () => boolean;
}

/**
 * Extended task with completion criteria
 */
export interface OnboardingTaskWithCriteria extends OnboardingTask {
  /** How to automatically detect task completion */
  completionCriteria?: TaskCompletionCriteria;
}

export const ONBOARDING_TASKS: OnboardingTaskWithCriteria[] = [
  // ============ INSTRUCTOR TASKS ============
  {
    id: 'instructor-setup-class',
    title: 'Set Up Your First Class',
    description: 'Create a new class section for your students',
    instructions: [
      'Navigate to the Sections page',
      'Click "Create Section" button',
      'Enter a class name (e.g., "Japanese 101")',
      'Configure grade level and settings',
      'Save your section',
      'Share the join code with students',
    ],
    persona: 'instructor',
    category: 'Getting Started',
    order: 1,
    estimatedTime: 300,
    completionCriteria: {
      storyId: 'pages-sections--default',
      requiredActions: ['onClick', 'onCreate'], // Any create/save action
    },
  },
  {
    id: 'instructor-create-unit',
    title: 'Create Your First Unit',
    description: 'Build interactive learning content',
    instructions: [
      'Go to the Units page',
      'Click "Create New Unit"',
      'Enter a title (e.g., "Japanese Greetings")',
      'Use the Editor to add content',
      'Add text, images, or media',
      'Save your unit',
    ],
    completionCriteria: {
      storyId: 'pages-units--default',
      requiredActions: ['onClick', 'onCreate'], // Create button or save
    },
    persona: 'instructor',
    category: 'Content Creation',
    order: 2,
    estimatedTime: 600,
  },
  {
    id: 'instructor-add-quiz',
    title: 'Add a Quiz Block',
    description: 'Create assessment questions in your unit',
    instructions: [
      'Open your unit in the Editor',
      'Type "/" to open the command menu',
      'Select "Quiz" from the options',
      'Enter your question text',
      'Add 2-4 answer choices',
      'Mark the correct answer',
      'Save the unit',
    ],
    completionCriteria: {
      storyId: 'creating-lessons-editor--default',
      requiredActions: ['onSave', 'onUpdate'], // Saving editor content
    },
    persona: 'instructor',
    category: 'Content Creation',
    order: 3,
    estimatedTime: 300,
  },
  {
    id: 'instructor-create-vocabulary',
    title: 'Add Vocabulary Words',
    description: 'Build your class dictionary',
    instructions: [
      'Navigate to Dictionary Editor',
      'Click "Add Word" button',
      'Enter Japanese word and romanization',
      'Add English definition',
      'Optionally add audio pronunciation',
      'Link word to a unit',
      'Save to dictionary',
    ],
    persona: 'instructor',
    category: 'Content Management',
    order: 4,
    estimatedTime: 360,
  },
  {
    id: 'instructor-create-assignment',
    title: 'Assign Work to Students',
    description: 'Set up assignments with due dates',
    instructions: [
      'Go to your Section',
      'Click "Create Assignment"',
      'Select a unit to assign',
      'Set a due date and time',
      'Configure assignment settings',
      'Assign to your section',
      'Students can now see the assignment',
    ],
    persona: 'instructor',
    category: 'Assignments',
    order: 5,
    estimatedTime: 240,
  },
  {
    id: 'instructor-view-grades',
    title: 'View Student Grades',
    description: 'Review student submissions and performance',
    instructions: [
      'Go to your Section page',
      'Select "Grades" tab',
      'View submissions by student or assignment',
      'Click on a submission to review responses',
      'View accuracy and scoring',
      'Leave feedback if needed',
    ],
    persona: 'instructor',
    category: 'Assessment',
    order: 6,
    estimatedTime: 240,
  },
  {
    id: 'instructor-use-ai-assistant',
    title: 'Use AI to Generate Content',
    description: 'Let AI help create your lessons',
    instructions: [
      'Open a unit in the Editor',
      'Click the chat icon in the sidebar',
      'Describe what you want to create',
      'Review AI suggestions',
      'Click "Insert" to add suggested content',
      'Customize as needed',
      'Save your unit',
    ],
    persona: 'instructor',
    category: 'AI Tools',
    order: 7,
    estimatedTime: 480,
  },
  {
    id: 'instructor-learn-shortcuts',
    title: 'Master Editor Shortcuts',
    description: 'Learn keyboard shortcuts for faster content creation',
    instructions: [
      'Open Help → Keyboard Shortcuts in Storybook',
      'Review the most useful shortcuts for content creation',
      'Navigate to "Keyboard Shortcuts Demo" story',
      'Watch the automated demonstration',
      'Try basic shortcuts: Bold (⌘B), Italic (⌘I), Underline (⌘U)',
      'Practice block types: Headings (⌘⇧1-3), Lists (⌘⇧7-8)',
      'Learn alignment: Left (⌘⇧L), Center (⌘⇧E), Right (⌘⇧R)',
      'Use Undo (⌘Z) and Redo (⌘⇧Z) regularly',
      'Keep the Help page open for quick reference',
    ],
    persona: 'instructor',
    category: 'Skills',
    order: 8,
    estimatedTime: 300,
  },

  // ============ LEARNER TASKS ============
  {
    id: 'learner-join-class',
    title: 'Join Your First Class',
    description: 'Connect to your instructor\'s class section',
    instructions: [
      'Get the join code from your instructor',
      'Go to the Sections page',
      'Click "Join Section"',
      'Enter the join code',
      'Confirm you want to join',
      'You\'re now part of the class!',
    ],
    persona: 'learner',
    category: 'Getting Started',
    order: 1,
    estimatedTime: 120,
  },
  {
    id: 'learner-view-assignments',
    title: 'View Your Assignments',
    description: 'Find and access assigned units',
    instructions: [
      'Open your Section',
      'View the "Assignments" tab',
      'See all units assigned to you',
      'Check due dates for each assignment',
      'Click on an assignment to open it',
    ],
    completionCriteria: {
      storyId: 'pages-section--default',
      requiredActions: ['onClick'], // Viewing or clicking assignments
    },
    persona: 'learner',
    category: 'Coursework',
    order: 2,
    estimatedTime: 120,
  },
  {
    id: 'learner-complete-assignment',
    title: 'Complete an Assignment',
    description: 'Work through a unit and submit your answers',
    instructions: [
      'Open an assigned unit in the Workbook',
      'Read the content and instructions',
      'Answer quiz questions',
      'Complete any fill-in-the-blank exercises',
      'Record your pronunciation (if requested)',
      'Click "Submit" when done',
      'View your score immediately',
    ],
    completionCriteria: {
      storyId: 'pages-workbook--default',
      requiredActions: ['onSubmit'], // Submitting work
    },
    persona: 'learner',
    category: 'Coursework',
    order: 3,
    estimatedTime: 600,
  },
  {
    id: 'learner-review-feedback',
    title: 'Review Your Feedback',
    description: 'Check instructor comments and improvements',
    instructions: [
      'Go to "Grades" or "My Work"',
      'Select a submitted assignment',
      'Review your accuracy score',
      'Read any instructor comments',
      'Check correct answers for mistakes',
      'Retake if assignment allows',
    ],
    persona: 'learner',
    category: 'Progress',
    order: 4,
    estimatedTime: 240,
  },
  {
    id: 'learner-practice-vocabulary',
    title: 'Practice Vocabulary',
    description: 'Use the dictionary to study words',
    instructions: [
      'Access the Dictionary or Unit vocabulary',
      'Browse vocabulary words',
      'Listen to audio pronunciation',
      'View definitions and examples',
      'Use practice questions if available',
      'Mark words as learned',
    ],
    persona: 'learner',
    category: 'Practice',
    order: 5,
    estimatedTime: 300,
  },
  {
    id: 'learner-use-chat-help',
    title: 'Get Help from AI Assistant',
    description: 'Ask AI for translations and explanations',
    instructions: [
      'Click the chat icon in the sidebar',
      'Ask a question (e.g., "How do I say hello?")',
      'Read the AI response',
      'Ask follow-up questions',
      'Copy translations or examples',
      'Continue learning',
    ],
    persona: 'learner',
    category: 'Learning Support',
    order: 6,
    estimatedTime: 300,
  },
  {
    id: 'learner-learn-shortcuts',
    title: 'Learn Helpful Shortcuts',
    description: 'Speed up your work with keyboard shortcuts',
    instructions: [
      'Learn Undo shortcut: ⌘Z (Mac) or Ctrl+Z (Windows)',
      'Practice selecting text and using ⌘A to select all',
      'Use arrow keys to navigate between questions',
      'Try Tab to accept AI suggestions',
      'Use Enter to submit answers in text fields',
      'Practice Escape to close dialogs',
      'These shortcuts work across the entire app!',
    ],
    persona: 'learner',
    category: 'Skills',
    order: 7,
    estimatedTime: 180,
  },

  // ============ DEVELOPER TASKS ============
  {
    id: 'developer-explore-components',
    title: 'Explore Component Documentation',
    description: 'Understand the component library',
    instructions: [
      'Browse the Storybook sidebar',
      'Visit "Technical Overview" page',
      'Read component documentation',
      'Click through different categories',
      'Examine the tech stack',
      'Review architecture patterns',
    ],
    persona: 'developer',
    category: 'Onboarding',
    order: 1,
    estimatedTime: 600,
  },
  {
    id: 'developer-understand-editor',
    title: 'Understand the Editor System',
    description: 'Learn about the Lexical-based editor',
    instructions: [
      'Read "Editor" section in Storybook',
      'View the Editor component stories',
      'Understand custom nodes (Quiz, Answer, etc.)',
      'Review the toolbar functionality',
      'Check Editor3 plugin architecture',
      'View source code examples',
    ],
    persona: 'developer',
    category: 'Architecture',
    order: 2,
    estimatedTime: 900,
  },
  {
    id: 'developer-explore-datastore',
    title: 'Learn DataStore Patterns',
    description: 'Understand AWS Amplify DataStore usage',
    instructions: [
      'Read "API Documentation" in docs',
      'Check "DATASTORE_OPTIMIZATION_CHANGES.md"',
      'Understand subscription patterns',
      'Review context usage (UnitContext, etc.)',
      'Study lazy loading patterns',
      'Check DataStore.copyOf patterns',
    ],
    persona: 'developer',
    category: 'Architecture',
    order: 3,
    estimatedTime: 900,
  },
  {
    id: 'developer-understand-ai-integration',
    title: 'Review AI Integration',
    description: 'Learn how OpenAI is integrated',
    instructions: [
      'Read "CHATBOT_TOOLS.md" in docs',
      'Review pages/api/chat.js implementation',
      'Understand Vercel AI SDK usage',
      'Check streaming implementation',
      'Review Lambda function patterns',
      'Study tool calling mechanisms',
    ],
    persona: 'developer',
    category: 'AI Features',
    order: 4,
    estimatedTime: 900,
  },
  {
    id: 'developer-setup-dev-environment',
    title: 'Set Up Development Environment',
    description: 'Get the project running locally',
    instructions: [
      'Clone the repository',
      'Install dependencies with npm install',
      'Configure AWS Amplify credentials',
      'Run "npm run dev" for Next.js',
      'Run "npm run storybook" in another terminal',
      'Verify both are working',
    ],
    persona: 'developer',
    category: 'Onboarding',
    order: 5,
    estimatedTime: 900,
  },
  {
    id: 'developer-explore-file-structure',
    title: 'Explore Project Structure',
    description: 'Understand how the codebase is organized',
    instructions: [
      'Review pages/ directory (Next.js routes)',
      'Explore src/components/ (React components)',
      'Check src/context/ (Context providers)',
      'Review src/utils/ (Helper functions)',
      'Understand amplify/backend/ structure',
      'Study .storybook/ customizations',
    ],
    persona: 'developer',
    category: 'Codebase',
    order: 6,
    estimatedTime: 600,
  },
  {
    id: 'developer-run-tests',
    title: 'Run Tests and Linting',
    description: 'Verify code quality and test suite',
    instructions: [
      'Run "npm run lint" to check code style',
      'Run "npm run vitest" for unit tests',
      'Run "npm run cypress:open" for E2E tests',
      'Review any failures',
      'Fix issues according to error messages',
      'Verify all tests pass',
    ],
    persona: 'developer',
    category: 'Development',
    order: 7,
    estimatedTime: 600,
  },
  {
    id: 'developer-customize-storybook',
    title: 'Customize Storybook Setup',
    description: 'Learn the Storybook configuration',
    instructions: [
      'Review .storybook/main.ts configuration',
      'Check .storybook/preview.jsx settings',
      'Understand mock setup in __mocks__/',
      'Review story file patterns',
      'Study addon registration',
      'Understand webpack aliases',
    ],
    persona: 'developer',
    category: 'Development',
    order: 8,
    estimatedTime: 480,
  },
  {
    id: 'developer-keyboard-shortcuts-demo',
    title: 'Learn Keyboard Shortcuts',
    description: 'Watch automated demo of all editor shortcuts',
    instructions: [
      'Navigate to Help → Keyboard Shortcuts in Storybook',
      'Review the comprehensive shortcuts reference',
      'Go to Editor stories and find "Keyboard Shortcuts Demo"',
      'Watch the automated playthrough',
      'Observe text formatting shortcuts (Bold, Italic, etc.)',
      'See block type shortcuts (Headings, Lists, etc.)',
      'Learn alignment and navigation shortcuts',
      'Try the shortcuts yourself in the Editor',
      'Bookmark the Help page for quick reference',
    ],
    completionCriteria: {
      storyId: '📚 Creating Lessons/Editor',
    },
    persona: 'developer',
    category: 'Learning',
    order: 9,
    estimatedTime: 360,
  },

  // ============ SECRET/HIDDEN TASKS (Extra Credit) ============
  {
    id: 'secret-keyboard-master',
    title: '👑 SECRET: Keyboard Master Challenge',
    description: '🏆 Complete the interactive keyboard shortcut training to unlock this achievement!',
    instructions: [
      '🎯 Navigate to Help → Keyboard Shortcuts',
      '🎮 Activate the Interactive Training Mode',
      '⌨️ Practice each keyboard shortcut by pressing the key combinations',
      '🌟 Earn achievements as you complete shortcuts',
      '📊 Track your progress across all categories',
      '🎊 Complete all 20 shortcuts to become a Keyboard Master',
      '👑 Unlock the ultimate "Keyboard Master" achievement',
      '🚀 Boost your productivity by 10x with these shortcuts!',
    ],
    persona: 'developer',
    category: '🎁 Extra Credit',
    order: 100,
    estimatedTime: 600,
  },
  {
    id: 'secret-speed-demon',
    title: '⚡ SECRET: Speed Demon',
    description: 'Complete the keyboard training in under 5 minutes',
    instructions: [
      'Master all keyboard shortcuts as fast as possible',
      'Use the Interactive Training Mode in Help → Keyboard Shortcuts',
      'Complete all 20 shortcuts',
      'Aim for speed and accuracy',
      'Prove you are a true efficiency expert!',
    ],
    persona: 'developer',
    category: '🎁 Extra Credit',
    order: 101,
    estimatedTime: 300,
  },
  {
    id: 'secret-achievement-hunter',
    title: '🏅 SECRET: Achievement Hunter',
    description: 'Unlock all individual shortcut achievements',
    instructions: [
      'Complete shortcuts that have achievement badges',
      'These include: Bold Beginner, Italic Expert, Format Master',
      'Heading Hero, List Legend, Code Ninja',
      'Alignment Ace, Time Traveler',
      'Collect them all to prove your mastery!',
    ],
    persona: 'developer',
    category: '🎁 Extra Credit',
    order: 102,
    estimatedTime: 420,
  },
  {
    id: 'secret-shortcut-evangelist',
    title: '📢 SECRET: Shortcut Evangelistist',
    description: 'Use shortcuts in your daily workflow',
    instructions: [
      'Apply what you learned in the training',
      'Use keyboard shortcuts while creating content',
      'Teach others about the shortcuts you learned',
      'Share the Help → Keyboard Shortcuts page with colleagues',
      'Spread the gospel of productivity!',
    ],
    persona: 'instructor',
    category: '🎁 Extra Credit',
    order: 103,
    estimatedTime: 1800,
  },
];

/**
 * Get tasks for a specific persona
 */
export function getTasksForPersona(persona: UserPersona): OnboardingTask[] {
  return ONBOARDING_TASKS.filter((task) => task.persona === persona || task.persona === 'all')
    .sort((a, b) => a.order - b.order);
}

/**
 * Get all tasks grouped by category
 */
export function getTasksByCategory(persona: UserPersona): Record<string, OnboardingTask[]> {
  const tasks = getTasksForPersona(persona);
  const grouped: Record<string, OnboardingTask[]> = {};

  tasks.forEach((task) => {
    if (!grouped[task.category]) {
      grouped[task.category] = [];
    }
    grouped[task.category].push(task);
  });

  return grouped;
}

/**
 * Find a specific task by ID
 */
export function findTaskById(taskId: string): OnboardingTask | undefined {
  return ONBOARDING_TASKS.find((task) => task.id === taskId);
}
