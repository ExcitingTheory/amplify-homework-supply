import { OnboardingTask, UserPersona } from './onboarding-events';

export const ONBOARDING_TASKS: OnboardingTask[] = [
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
