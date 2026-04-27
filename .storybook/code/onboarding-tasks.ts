import { OnboardingTask, UserPersona } from './onboarding-events';

/**
 * Criteria for automatically completing a task
 */
export interface TaskCompletionCriteria {
  /** Story ID for tutorial mode (component stories) */
  tutorialStoryId?: string;
  /** Story ID for quiz mode (page stories) */
  quizStoryId?: string;
  /** Legacy: Single story ID for both modes (deprecated) */
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
      'Explore the Storybook sidebar to find features by category',
      'Use Canvas for interactive previews, Docs for instructions',
      'Navigate to the Sections page',
      'Open the Create Section form',
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
      tutorialStoryId: '📄-pages-application-pages--sections', // Tutorial: Sections page with create section UI
      quizStoryId: '📄-pages-application-pages--sections', // Quiz: Navigate to actual sections page
      requiredActions: ['onClick', 'onCreate'], // Any create/save action
    },
  },
  {
    id: 'instructor-create-unit',
    title: 'Create Your First Unit',
    description: 'Build interactive learning content',
    instructions: [
      'Go to the Units page',
      'Start creating a new unit',
      'Enter a title (e.g., "Japanese Greetings")',
      'Use the Editor to add content',
      'Add text, images, or media',
      'Save your unit',
    ],
    completionCriteria: {
      tutorialStoryId: '📄-pages-application-pages--units', // Tutorial: Units page (no separate component)
      quizStoryId: '📄-pages-application-pages--units', // Quiz: Navigate to actual units page
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
      tutorialStoryId: '📚-creating-lessons-editor--kitchen-sink', // Tutorial: Kitchen sink editor with all block types
      quizStoryId: '📄-pages-application-pages--unit-detail', // Quiz: Actual editor page
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
      'Navigate to the Dictionary Editor',
      'Add a new vocabulary word',
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
    completionCriteria: {
      tutorialStoryId: '📁-managing-content-vocabulary-review--default', // Tutorial: Vocabulary review component
      quizStoryId: '📄-pages-application-pages--unit-detail', // Quiz: Unit detail with dictionary
      requiredActions: ['onClick', 'onCreate'], // Adding words
    },
  },
  {
    id: 'instructor-create-assignment',
    title: 'Assign Work to Students',
    description: 'Set up assignments with due dates',
    instructions: [
      'Go to your Section',
      'Open the assignment creation form',
      'Select a unit to assign',
      'Set a due date and time',
      'Configure assignment settings',
      'Assign to your section',
      'Verify the assignment appears in the list',
    ],
    persona: 'instructor',
    category: 'Assignments',
    order: 5,
    estimatedTime: 240,
    completionCriteria: {
      tutorialStoryId: '🧩-components-section-assigner--default', // Tutorial: Section assigner dialog component
      quizStoryId: '📄-pages-application-pages--section-detail', // Quiz: Section detail page
      requiredActions: ['onClick', 'onCreate'], // Creating assignment
    },
  },
  {
    id: 'instructor-view-grades',
    title: 'View Student Grades',
    description: 'Review student submissions and performance',
    instructions: [
      'Go to your Section page',
      'Switch to the "Grades" tab',
      'View submissions by student or assignment',
      'Open a submission to review responses',
      'View accuracy and scoring',
      'Leave feedback if needed',
    ],
    persona: 'instructor',
    category: 'Assessment',
    order: 6,
    estimatedTime: 240,
    completionCriteria: {
      tutorialStoryId: '📄-pages-application-pages--section-detail', // Tutorial: Section detail with grades tab
      quizStoryId: '📄-pages-application-pages--section-detail', // Quiz: Section detail page
      requiredActions: ['onClick'], // Viewing grades
    },
  },
  {
    id: 'instructor-use-ai-assistant',
    title: 'Use AI to Generate Content',
    description: 'Let AI help create your lessons',
    instructions: [
      'Open a unit in the Editor',
      'Open the chat sidebar',
      'Describe what you want to create',
      'Review AI suggestions',
      'Insert the suggested content into the editor',
      'Save your unit',
    ],
    persona: 'instructor',
    category: 'AI Tools',
    order: 7,
    estimatedTime: 480,
    completionCriteria: {
      tutorialStoryId: '💬-ai-assistant-chat-sidebar--getting-started', // Tutorial: Chat sidebar component
      quizStoryId: '📄-pages-application-pages--workbook', // Quiz: Workbook with chat sidebar
      requiredActions: ['onSubmit', 'onSend'], // Sending chat message
    },
  },
  {
    id: 'instructor-learn-shortcuts',
    title: 'Master Editor Shortcuts',
    description: 'Learn keyboard shortcuts for faster content creation',
    instructions: [
      'Open Help → Keyboard Shortcuts in Storybook',
      'Navigate to "Keyboard Shortcuts Demo" story',
      'Watch the automated demonstration',
      'Try basic shortcuts: Bold (⌘B), Italic (⌘I), Underline (⌘U)',
      'Practice block types: Headings (⌘⇧1-3), Lists (⌘⇧7-8)',
      'Use Undo (⌘Z) and Redo (⌘⇧Z) regularly',
    ],
    persona: 'instructor',
    category: 'Skills',
    order: 8,
    estimatedTime: 300,
    completionCriteria: {
      tutorialStoryId: 'help-keyboard-shortcut-trainer--default', // Tutorial: Keyboard shortcut trainer
      quizStoryId: '📄-pages-application-pages--unit-detail', // Quiz: Editor page for practicing
      requiredActions: ['onClick', 'onSave'], // Practicing shortcuts in editor
    },
  },

  // ============ LEARNER TASKS ============
  {
    id: 'learner-join-class',
    title: 'Join Your First Class',
    description: 'Connect to your instructor\'s class section',
    instructions: [
      'Explore the Storybook sidebar to find features by topic',
      'Use Canvas for live previews, Docs for written guides',
      'Get the join code from your instructor',
      'Go to the Sections page',
      'Open the Join Section form',
      'Enter the join code',
      'Confirm you want to join',
      'Verify the section appears in your list',
    ],
    persona: 'learner',
    category: 'Getting Started',
    order: 1,
    estimatedTime: 120,
    completionCriteria: {
      tutorialStoryId: '�-pages-application-pages--sections', // Tutorial: Sections page with join section dialog
      quizStoryId: '📄-pages-application-pages--sections', // Quiz: Navigate to sections page
      requiredActions: ['onSubmit'], // Form submission of join code
    },
  },
  {
    id: 'learner-view-assignments',
    title: 'View Your Assignments',
    description: 'Find and access assigned units',
    instructions: [
      'Open your Section',
      'Switch to the "Assignments" tab',
      'See all units assigned to you',
      'Check due dates for each assignment',
      'Open an assignment to view its content',
    ],
    completionCriteria: {
      tutorialStoryId: '📄-pages-application-pages--section-detail', // Tutorial: Section page (no separate component)
      quizStoryId: '📄-pages-application-pages--section-detail', // Quiz: Navigate to section page
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
      'Submit your completed work',
      'Review your score',
    ],
    completionCriteria: {
      tutorialStoryId: '📚-creating-lessons-workbook--kitchen-sink', // Tutorial: Kitchen sink workbook with all block types
      quizStoryId: '📄-pages-application-pages--workbook', // Quiz: Actual workbook page
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
    ],
    persona: 'learner',
    category: 'Progress',
    order: 4,
    estimatedTime: 240,
    completionCriteria: {
      tutorialStoryId: '�-pages-application-pages--section-detail', // Tutorial: Section detail page (has grades tab and feedback)
      quizStoryId: '📄-pages-application-pages--section-detail', // Quiz: Section detail page (has grades tab)
      requiredActions: ['onClick'], // Clicking to view grade details
    },
  },
  {
    id: 'learner-practice-vocabulary',
    title: 'Practice Vocabulary',
    description: 'Use the dictionary to study words',
    instructions: [
      'Access the Dictionary or Unit vocabulary',
      'Listen to audio pronunciation',
      'View definitions and examples',
      'Use practice questions if available',
      'Mark words as learned',
    ],
    persona: 'learner',
    category: 'Practice',
    order: 5,
    estimatedTime: 300,
    completionCriteria: {
      tutorialStoryId: '📁-managing-content-vocabulary-review--default', // Tutorial: Vocabulary review component
      quizStoryId: '📄-pages-application-pages--unit-detail', // Quiz: Unit detail page (has vocabulary)
      requiredActions: ['onClick', 'onPlay'], // Clicking words or playing audio
    },
  },
  {
    id: 'learner-use-chat-help',
    title: 'Get Help from AI Assistant',
    description: 'Ask AI for translations and explanations',
    instructions: [
      'Open the chat sidebar',
      'Ask a question (e.g., "How do I say hello?")',
      'Read the AI response',
      'Ask follow-up questions',
      'Continue learning',
    ],
    persona: 'learner',
    category: 'Learning Support',
    order: 6,
    estimatedTime: 300,
    completionCriteria: {
      tutorialStoryId: '💬-ai-assistant-chat-sidebar--getting-started', // Tutorial: Chat sidebar component
      quizStoryId: '📄-pages-application-pages--workbook', // Quiz: Workbook with chat sidebar
      requiredActions: ['onSubmit', 'onSend'], // Sending chat message
    },
  },
  {
    id: 'learner-learn-shortcuts',
    title: 'Learn Helpful Shortcuts',
    description: 'Speed up your work with keyboard shortcuts',
    instructions: [
      'Review the list of essential keyboard shortcuts',
      'Practice shortcuts like Undo (⌘Z), Select All (⌘A), and Tab',
      'Use these shortcuts across the entire app!',
    ],
    persona: 'learner',
    category: 'Skills',
    order: 7,
    estimatedTime: 180,
    completionCriteria: {
      tutorialStoryId: '📚-creating-lessons-workbook--kitchen-sink', // Tutorial: Kitchen sink workbook for practicing shortcuts
      quizStoryId: '📄-pages-application-pages--workbook', // Quiz: Actual workbook page
      requiredActions: ['onClick', 'onSubmit'], // Practicing shortcuts in workbook
      customCheck: () => {
        // Check if user has used any keyboard shortcuts
        const shortcutUsed = localStorage.getItem('learner-shortcut-used');
        return shortcutUsed === 'true';
      },
    },
  },

  // ============ SECRET/HIDDEN TASKS (Extra Credit) ============
  {
    id: 'secret-keyboard-master',
    title: '👑 SECRET: Keyboard Master Challenge',
    description: '🏆 Complete the interactive keyboard shortcut training to unlock this achievement!',
    instructions: [
      '🎯 Navigate to Help → Keyboard Shortcuts',
      '🎮 Activate the Interactive Training Mode and practice all key combinations',
      '🌟 Earn achievements and track progress across all categories',
      '👑 Complete all 20 shortcuts to become a Keyboard Master!',
    ],
    persona: 'all',
    category: '🎁 Extra Credit',
    order: 100,
    estimatedTime: 600,
    completionCriteria: {
      tutorialStoryId: 'help-keyboard-shortcut-trainer--default',
      quizStoryId: 'help-keyboard-shortcut-trainer--default',
      requiredActions: ['onClick'], // Any interaction in the trainer
      customCheck: () => {
        // All 20 shortcuts completed
        try {
          const stored = localStorage.getItem('keyboard-trainer-completed');
          if (stored) {
            const completed = JSON.parse(stored);
            return Array.isArray(completed) && completed.length >= 20;
          }
        } catch { /* ignore */ }
        return false;
      },
    },
  },
  {
    id: 'secret-speed-demon',
    title: '⚡ SECRET: Speed Demon',
    description: 'Complete the keyboard training in under 5 minutes',
    instructions: [
      'Master all keyboard shortcuts as fast as possible',
      'Race against the clock — complete all 20 shortcuts',
      'Aim for speed and accuracy to prove you are a true efficiency expert!',
    ],
    persona: 'all',
    category: '🎁 Extra Credit',
    order: 101,
    estimatedTime: 300,
    completionCriteria: {
      tutorialStoryId: 'help-keyboard-shortcut-trainer--default',
      quizStoryId: 'help-keyboard-shortcut-trainer--default',
      customCheck: () => {
        // All 20 shortcuts completed in under 5 minutes
        try {
          const stored = localStorage.getItem('keyboard-trainer-completed');
          const startTime = localStorage.getItem('keyboard-trainer-start');
          if (stored && startTime) {
            const completed = JSON.parse(stored);
            const elapsed = Date.now() - Number(startTime);
            return Array.isArray(completed) && completed.length >= 20 && elapsed < 5 * 60 * 1000;
          }
        } catch { /* ignore */ }
        return false;
      },
    },
  },
  {
    id: 'secret-achievement-hunter',
    title: '🏅 SECRET: Achievement Hunter',
    description: 'Unlock all individual shortcut achievements',
    instructions: [
      'Complete shortcuts that have achievement badges',
      'Collect Bold Beginner, Italic Expert, Format Master, Heading Hero, List Legend, Code Ninja, Alignment Ace, and Time Traveler',
      'Earn every badge to prove your mastery!',
    ],
    persona: 'all',
    category: '🎁 Extra Credit',
    order: 102,
    estimatedTime: 420,
    completionCriteria: {
      tutorialStoryId: 'help-keyboard-shortcut-trainer--default',
      quizStoryId: 'help-keyboard-shortcut-trainer--default',
      customCheck: () => {
        // All 8 individual achievements unlocked
        const requiredAchievements = [
          'Bold Beginner', 'Italic Expert', 'Format Master',
          'Heading Hero', 'List Legend', 'Code Ninja',
          'Alignment Ace', 'Time Traveler',
        ];
        try {
          const stored = localStorage.getItem('keyboard-trainer-achievements');
          if (stored) {
            const achievements = JSON.parse(stored);
            return Array.isArray(achievements) &&
              requiredAchievements.every(a => achievements.includes(a));
          }
        } catch { /* ignore */ }
        return false;
      },
    },
  },
  {
    id: 'secret-shortcut-evangelist',
    title: '📢 SECRET: Shortcut Evangelist',
    description: 'Use shortcuts in your daily workflow',
    instructions: [
      'Apply what you learned — use shortcuts while creating content',
      'Share shortcuts with colleagues and teach others',
      'Spread the gospel of productivity!',
    ],
    persona: 'all',
    category: '🎁 Extra Credit',
    order: 103,
    estimatedTime: 1800,
    completionCriteria: {
      tutorialStoryId: '📚-creating-lessons-editor--kitchen-sink',
      quizStoryId: '📄-pages-application-pages--unit-detail',
      requiredActions: ['onSave', 'onUpdate'], // Using shortcuts while creating real content
    },
  },

  // ============ TRANSLATOR TASKS ============
  {
    id: 'translator-language-switcher',
    title: 'Try the Language Switcher',
    description: 'Preview how UI text appears in each supported language',
    instructions: [
      'Explore the Storybook sidebar to find translatable components',
      'Use Canvas to preview translations, Docs for locale conventions',
      'Find the 🌐 Globe icon in the Storybook top toolbar',
      'Click it to open the language selector dropdown',
      'Switch between languages (ja, es, en) and observe how text changes',
      'Notice any text that did NOT change — missing keys are highlighted',
      'Return to English (en) — this is the source locale',
    ],
    persona: 'translator',
    category: 'Getting Started',
    order: 1,
    estimatedTime: 120,
    completionCriteria: {
      tutorialStoryId: 'translation-mode-demo--default',
      quizStoryId: 'translation-mode-demo--editor-namespace',
      requiredActions: ['onLanguageChange', 'onClick'],
    },
  },
  {
    id: 'translator-translation-panel',
    title: 'Open the Translations Panel',
    description: 'Use the addon panel to browse, edit, and export translation keys',
    instructions: [
      'Look at the addon panel tabs at the bottom of Storybook',
      'Click the "Translations" tab to open the translation panel',
      'Browse the list of translation keys for the current story',
      'Each row shows the key name, English value, and translation status',
      'Click a row to expand metadata: context, component location, impact level',
      'Use the "Export Translations" button to download JSON or CSV',
    ],
    persona: 'translator',
    category: 'Getting Started',
    order: 2,
    estimatedTime: 180,
    completionCriteria: {
      tutorialStoryId: 'translation-mode-demo--default',
      quizStoryId: 'translation-mode-demo--auth-namespace',
      requiredActions: ['onPanelOpen', 'onClick'],
    },
  },
  {
    id: 'translator-locale-files',
    title: 'Understand Locale File Structure',
    description: 'Learn where JSON locale files live and how namespaces map to components',
    instructions: [
      'Locale files are in public/locales/{lang}/ — each namespace is a JSON file',
      'Keys are nested objects (e.g., common.buttons.save)',
      'English (en) is the source of truth — all other locales mirror its key structure',
      'Open the "Editor Namespace" story to see how keys appear in the panel',
      'Compare a key like editor.toolbar.bold across en and ja to see the mapping',
    ],
    persona: 'translator',
    category: 'Translation Workflow',
    order: 4,
    estimatedTime: 300,
    completionCriteria: {
      tutorialStoryId: 'translation-mode-demo--editor-namespace',
      quizStoryId: 'translation-mode-demo--auth-namespace',
      requiredActions: ['onClick', 'onSelect'],
    },
  },
  {
    id: 'translator-component-context',
    title: 'Review Component Context',
    description: 'See exactly which components use each translation key and why',
    instructions: [
      'Open the "Auth Namespace" story — it shows login/signup translations',
      'Click any translation row to expand its metadata',
      'Read Context, Component Location, and User Type fields',
      'Check Tone (formal, casual, technical) — this affects translation style',
      'Use these metadata fields to make context-aware translation decisions',
      'Try several rows to see how context varies across components',
    ],
    persona: 'translator',
    category: 'Translation Workflow',
    order: 5,
    estimatedTime: 240,
    completionCriteria: {
      tutorialStoryId: 'translation-mode-demo--auth-namespace',
      quizStoryId: 'translation-mode-demo--default',
      requiredActions: ['onClick', 'onSelect'],
    },
  },
  {
    id: 'translator-test-rtl',
    title: 'Test RTL Language Support',
    description: 'Verify that right-to-left languages render correctly across components',
    instructions: [
      'Switch to a RTL language using the language selector',
      'Check layout mirrors: sidebar right, content right-to-left, text right-aligned',
      'Verify icons and directional buttons flip correctly',
      'Look for breakage: overlapping text, misaligned buttons, clipped content',
      'Navigate to 2-3 different component stories to test across the UI',
      'Note issues — these need CSS logical properties (start/end vs left/right)',
    ],
    persona: 'translator',
    category: '🎁 Extra Credit',
    order: 101,
    estimatedTime: 300,
    completionCriteria: {
      tutorialStoryId: 'translation-mode-demo--default',
      quizStoryId: 'translation-mode-demo--editor-namespace',
      requiredActions: ['onLanguageChange', 'onClick'],
    },
  },
  {
    id: 'translator-pluralization',
    title: 'Review Pluralization Rules',
    description: 'Verify that count-dependent translations handle plural forms correctly per locale',
    instructions: [
      'Find translation keys containing {{count}} — these use i18next pluralization',
      'Understand locale plural rules (English: 2 forms, Japanese: 1, Arabic: up to 6)',
      'Look for keys ending in _one, _other, _few in the Translations panel',
      'Test with count values 0, 1, 2, 5, 11, 100 to verify correct form selection',
      'Check i18next docs for the plural rules of each target language',
    ],
    persona: 'translator',
    category: '🎁 Extra Credit',
    order: 102,
    estimatedTime: 600,
    completionCriteria: {
      tutorialStoryId: 'translation-mode-demo--default',
      quizStoryId: 'translation-mode-demo--auth-namespace',
      requiredActions: ['onClick', 'onSelect'],
    },
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
