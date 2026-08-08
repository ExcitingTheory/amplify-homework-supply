import { OnboardingTask, UserPersona } from "./onboarding-events";

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
  /** Ordered data-tour element names the user must click in sequence — all steps required */
  completionSequence?: string[];
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
    id: "instructor-setup-class",
    title: "Set Up Your First Class",
    description: "Create a new class section for your students",
    instructions: [
      "Browse the Storybook sidebar to find features",
      "Switch between Canvas and Docs tabs",
      "View the Sections page overview",
      'Click the "Create Section" button',
      "Fill in section details and save",
      "Copy the join code to share with students",
      "Navigate to the Sections page to verify your class is listed",
      "Confirm the section is visible and student-ready",
    ],
    persona: "instructor",
    category: "Getting Started",
    order: 1,
    estimatedTime: 300,
    completionCriteria: {
      tutorialStoryId: "📄-pages-application-pages--sections", // Tutorial: Sections page with create section UI
      quizStoryId: "📄-pages-application-pages--sections", // Quiz: Navigate to actual sections page
      completionSequence: ["sections-page", "create-section-button", "section-form", "join-code"],
    },
  },
  {
    id: "instructor-create-unit",
    title: "Create Your First Unit",
    description: "Build interactive learning content",
    instructions: [
      "Review the unit creation overview and goals",
      "View the Units library overview",
      'Click the "Create Unit" button',
      "Use the rich text editor to add content",
      "Save your unit",
      "Confirm your new unit appears in the Units list",
    ],
    completionCriteria: {
      tutorialStoryId: "📄-pages-application-pages--units", // Tutorial: Units page (no separate component)
      quizStoryId: "📄-pages-application-pages--units", // Quiz: Navigate to actual units page
      completionSequence: ["units-page", "create-unit-button"],
    },
    persona: "instructor",
    category: "Content Creation",
    order: 2,
    estimatedTime: 600,
  },
  {
    id: "instructor-add-quiz",
    title: "Add a Quiz Block",
    description: "Create assessment questions in your unit",
    instructions: [
      "Open a unit in the Editor",
      'Click the "+ Insert" button in the toolbar',
      'Select "Multiple Choice Quiz" from the menu',
      "Configure the quiz question and answers",
      "Save the unit",
      "Confirm the quiz block renders correctly in preview",
    ],
    completionCriteria: {
      tutorialStoryId: "✏️-lesson-editor-editor--kitchen-sink", // Tutorial: Kitchen sink editor with all block types
      quizStoryId: "📄-pages-application-pages--unit-detail", // Quiz: Actual editor page
      completionSequence: ["editor-toolbar", "quiz-block", "quiz-answers"],
    },
    persona: "instructor",
    category: "Content Creation",
    order: 3,
    estimatedTime: 300,
  },
  {
    id: "instructor-create-vocabulary",
    title: "Add Vocabulary Words",
    description: "Build your class dictionary",
    instructions: [
      "Review the Dictionary Editor overview and navigation",
      "Open the Dictionary Editor",
      'Click the "Add Word" button',
      "Fill in word details and pronunciation",
      "Upload or record audio",
      "Link the word to a unit",
      "Confirm the word appears in your dictionary with audio",
    ],
    persona: "instructor",
    category: "Content Management",
    order: 4,
    estimatedTime: 360,
    completionCriteria: {
      tutorialStoryId: "📁-content-management-dictionary-editor--default", // Tutorial: Dictionary editor with add button
      quizStoryId: "📄-pages-application-pages--unit-detail", // Quiz: Unit detail with dictionary
      completionSequence: ["add-word-button", "word-form", "word-card"],
    },
  },
  {
    id: "instructor-create-assignment",
    title: "Assign Work to Students",
    description: "Set up assignments with due dates",
    instructions: [
      "Review the assignment workflow overview",
      "View the assignment creation dialog",
      'Click "Create Assignment"',
      "Select a unit to assign",
      "Set a due date and time",
      "Configure assignment settings",
      "Confirm the assignment is visible to students",
    ],
    persona: "instructor",
    category: "Assignments",
    order: 5,
    estimatedTime: 240,
    completionCriteria: {
      tutorialStoryId: "🧩-ui-components-section-assigner--default", // Tutorial: Section assigner dialog component
      quizStoryId: "📄-pages-application-pages--section-detail", // Quiz: Section detail page
      completionSequence: ["unit-selector", "create-assignment-button"], // Step 1: select a unit; Step 2: click Create Assignment
    },
  },
  {
    id: "instructor-view-grades",
    title: "View Student Grades",
    description: "Review student submissions and performance",
    instructions: [
      "View the Section page overview",
      'Click the "Grades" tab',
      "Browse the submissions list",
      "Open a grade to review details",
      "Leave feedback for the student",
      "Confirm the feedback is saved and the grade is finalized",
    ],
    persona: "instructor",
    category: "Assessment",
    order: 6,
    estimatedTime: 240,
    completionCriteria: {
      tutorialStoryId: "📄-pages-application-pages--section-detail", // Tutorial: Section detail with grades tab
      quizStoryId: "📄-pages-application-pages--section-detail", // Quiz: Section detail page
      completionSequence: ["assignments-section", "assignment-card"],
    },
  },
  {
    id: "instructor-use-ai-assistant",
    title: "Use AI to Generate Content",
    description: "Let AI help create your lessons",
    instructions: [
      "View the AI Assistant overview",
      "Click to open the chat sidebar",
      "Type a request in the chat input",
      "Review the AI response",
      'Click "Insert" to add content to your unit',
      "Verify the AI-generated content appears in your unit editor",
    ],
    persona: "instructor",
    category: "AI Tools",
    order: 7,
    estimatedTime: 480,
    completionCriteria: {
      tutorialStoryId: "💬-ai-assistant-chat-sidebar--getting-started", // Tutorial: Chat sidebar component
      quizStoryId: "📄-pages-application-pages--workbook", // Quiz: Workbook with chat sidebar
      completionSequence: ["chat-input"], // Must interact with the chat input to ask a question
    },
  },
  {
    id: "instructor-learn-shortcuts",
    title: "Master Editor Shortcuts",
    description: "Learn keyboard shortcuts for faster content creation",
    instructions: [
      "View the Shortcuts overview",
      "Open Help → Keyboard Shortcuts",
      "Browse the shortcuts reference page",
      "Watch the automated demo",
      "Practice common shortcuts in the editor",
      "Confirm mastery by completing the interactive practice session",
    ],
    persona: "instructor",
    category: "Skills",
    order: 8,
    estimatedTime: 300,
    completionCriteria: {
      tutorialStoryId: "🏠-getting-started-keyboard-shortcuts--default", // Tutorial: Keyboard shortcut trainer
      quizStoryId: "📄-pages-application-pages--unit-detail", // Quiz: Editor page for practicing
      completionSequence: ["shortcuts-demo"], // Must interact with the keyboard shortcuts demo area
    },
  },

  // ============ LEARNER TASKS ============
  {
    id: "learner-join-class",
    title: "Join Your First Class",
    description: "Connect to your instructor's class section",
    instructions: [
      "Browse the Storybook sidebar",
      "Switch between Canvas and Docs tabs",
      "View the Join Class overview",
      'Click the "Join Section" button',
      "View the Join Section dialog",
      "Enter the join code",
      "Click Submit to join",
      "Confirm you can see your class's assignments and content",
    ],
    persona: "learner",
    category: "Getting Started",
    order: 1,
    estimatedTime: 120,
    completionCriteria: {
      tutorialStoryId: "📄-pages-application-pages--sections", // Tutorial: Sections page with join section dialog
      quizStoryId: "📄-pages-application-pages--sections", // Quiz: Navigate to sections page
      completionSequence: ["sections-page", "section-card", "join-code"],
    },
  },
  {
    id: "learner-view-assignments",
    title: "View Your Assignments",
    description: "Find and access assigned units",
    instructions: [
      "View the Assignments overview",
      "Click your section card",
      "View the Assignments section",
      "Click an assignment to open it",
      "Confirm you can see the assignment details, due dates, and status",
    ],
    completionCriteria: {
      tutorialStoryId: "📄-pages-application-pages--section-detail", // Tutorial: Section page (no separate component)
      quizStoryId: "📄-pages-application-pages--section-detail", // Quiz: Navigate to section page
      completionSequence: ["assignment-card", "view-workbook-button"], // Step 1: click an assignment card; Step 2: open the workbook
    },
    persona: "learner",
    category: "Coursework",
    order: 2,
    estimatedTime: 120,
  },
  {
    id: "learner-complete-assignment",
    title: "Complete an Assignment",
    description: "Work through a unit and submit your answers",
    instructions: [
      "View the assignment overview",
      "Explore the Workbook interface",
      "Read lesson content",
      "Answer quiz questions",
      "Record audio (if applicable)",
      "Review your score",
      "Submit your completed work and verify your score is saved",
    ],
    completionCriteria: {
      tutorialStoryId: "✏️-lesson-editor-workbook--kitchen-sink", // Tutorial: Kitchen sink workbook with all block types
      quizStoryId: "📄-pages-application-pages--workbook", // Quiz: Actual workbook page
      completionSequence: ["workbook", "quiz-block", "quiz-answers"],
    },
    persona: "learner",
    category: "Coursework",
    order: 3,
    estimatedTime: 600,
  },
  {
    id: "learner-review-feedback",
    title: "Review Your Feedback",
    description: "Check instructor comments and improvements",
    instructions: [
      "View the Feedback overview",
      "Open the My Work / Grades section",
      "Click a grade card to view details",
      "Review correct answers and feedback",
      "Note areas for improvement to focus on in future assignments",
    ],
    persona: "learner",
    category: "Progress",
    order: 4,
    estimatedTime: 240,
    completionCriteria: {
      tutorialStoryId: "📄-pages-application-pages--section-detail", // Tutorial: Section detail page (has grades tab and feedback)
      quizStoryId: "📄-pages-application-pages--section-detail", // Quiz: Section detail page (has grades tab)
      completionSequence: ["assignments-section", "assignment-card"], // Step 1: open Assignments section; Step 2: view a specific assignment
    },
  },
  {
    id: "learner-practice-vocabulary",
    title: "Practice Vocabulary",
    description: "Use the dictionary to study words",
    instructions: [
      "View the Vocabulary overview",
      "Browse the dictionary",
      "Click a vocabulary card",
      "Click Play to hear pronunciation",
      "Continue exploring vocabulary to reinforce your learning",
    ],
    persona: "learner",
    category: "Practice",
    order: 5,
    estimatedTime: 300,
    completionCriteria: {
      tutorialStoryId: "📁-content-management-vocabulary-review--default", // Tutorial: Vocabulary review component
      quizStoryId: "📄-pages-application-pages--unit-detail", // Quiz: Unit detail page (has vocabulary)
      completionSequence: ["word-card"], // Click a vocabulary card to practice
    },
  },
  {
    id: "learner-use-chat-help",
    title: "Get Help from AI Assistant",
    description: "Ask AI for translations and explanations",
    instructions: [
      "View the AI Help overview",
      "Click to open the chat sidebar",
      "Type a question in the chat input",
      "Review the AI response",
      "Ask a follow-up question to deepen your understanding",
    ],
    persona: "learner",
    category: "Learning Support",
    order: 6,
    estimatedTime: 300,
    completionCriteria: {
      tutorialStoryId: "💬-ai-assistant-chat-sidebar--getting-started", // Tutorial: Chat sidebar component
      quizStoryId: "📄-pages-application-pages--workbook", // Quiz: Workbook with chat sidebar
      completionSequence: ["chat-input"], // Must interact with chat input to prove they asked a question
    },
  },
  {
    id: "learner-learn-shortcuts",
    title: "Learn Helpful Shortcuts",
    description: "Speed up your work with keyboard shortcuts",
    instructions: [
      "View the Shortcuts overview",
      "Practice essential shortcuts",
      "Confirm you can use the shortcuts in the workbook editor",
    ],
    persona: "learner",
    category: "Skills",
    order: 7,
    estimatedTime: 180,
    completionCriteria: {
      tutorialStoryId: "🏠-getting-started-keyboard-shortcuts--default", // Tutorial: Kitchen sink workbook for practicing shortcuts
      quizStoryId: "📄-pages-application-pages--workbook", // Quiz: Actual workbook page
      completionSequence: ["shortcuts-demo"], // Must interact with the keyboard shortcuts demo area
      customCheck: () => {
        // Check if user has used any keyboard shortcuts
        const shortcutUsed = localStorage.getItem("learner-shortcut-used");
        return shortcutUsed === "true";
      },
    },
  },

  // ============ SECRET/HIDDEN TASKS (Extra Credit) ============
  {
    id: "secret-keyboard-master",
    title: "👑 SECRET: Keyboard Master Challenge",
    description:
      "🏆 Complete the interactive keyboard shortcut training to unlock this achievement!",
    instructions: [
      "🎯 Navigate to Help → Keyboard Shortcuts",
      "🎮 Activate the Interactive Training Mode and practice all key combinations",
      "🌟 Earn achievements and track progress across all categories",
      "👑 Complete all 20 shortcuts to become a Keyboard Master!",
    ],
    persona: "all",
    category: "🎁 Extra Credit",
    order: 100,
    estimatedTime: 600,
    completionCriteria: {
      tutorialStoryId: "🏠-getting-started-keyboard-shortcuts--default",
      quizStoryId: "🏠-getting-started-keyboard-shortcuts--default",
      // No requiredActions — customCheck is the sole criterion (all 20 shortcuts in localStorage)
      customCheck: () => {
        // All 20 shortcuts completed
        try {
          const stored = localStorage.getItem("keyboard-trainer-completed");
          if (stored) {
            const completed = JSON.parse(stored);
            return Array.isArray(completed) && completed.length >= 20;
          }
        } catch {
          /* ignore */
        }
        return false;
      },
    },
  },
  {
    id: "secret-speed-demon",
    title: "⚡ SECRET: Speed Demon",
    description: "Complete the keyboard training in under 5 minutes",
    instructions: [
      "Master all keyboard shortcuts as fast as possible",
      "Race against the clock — complete all 20 shortcuts",
      "Aim for speed and accuracy to prove you are a true efficiency expert!",
    ],
    persona: "all",
    category: "🎁 Extra Credit",
    order: 101,
    estimatedTime: 300,
    completionCriteria: {
      tutorialStoryId: "🏠-getting-started-keyboard-shortcuts--default",
      quizStoryId: "🏠-getting-started-keyboard-shortcuts--default",
      customCheck: () => {
        // All 20 shortcuts completed in under 5 minutes
        try {
          const stored = localStorage.getItem("keyboard-trainer-completed");
          const startTime = localStorage.getItem("keyboard-trainer-start");
          if (stored && startTime) {
            const completed = JSON.parse(stored);
            const elapsed = Date.now() - Number(startTime);
            return (
              Array.isArray(completed) &&
              completed.length >= 20 &&
              elapsed < 5 * 60 * 1000
            );
          }
        } catch {
          /* ignore */
        }
        return false;
      },
    },
  },
  {
    id: "secret-achievement-hunter",
    title: "🏅 SECRET: Achievement Hunter",
    description: "Unlock all individual shortcut achievements",
    instructions: [
      "Complete shortcuts that have achievement badges",
      "Collect Bold Beginner, Italic Expert, Format Master, Heading Hero, List Legend, Code Ninja, Alignment Ace, and Time Traveler",
      "Earn every badge to prove your mastery!",
    ],
    persona: "all",
    category: "🎁 Extra Credit",
    order: 102,
    estimatedTime: 420,
    completionCriteria: {
      tutorialStoryId: "🏠-getting-started-keyboard-shortcuts--default",
      quizStoryId: "🏠-getting-started-keyboard-shortcuts--default",
      customCheck: () => {
        // All 8 individual achievements unlocked
        const requiredAchievements = [
          "Bold Beginner",
          "Italic Expert",
          "Format Master",
          "Heading Hero",
          "List Legend",
          "Code Ninja",
          "Alignment Ace",
          "Time Traveler",
        ];
        try {
          const stored = localStorage.getItem("keyboard-trainer-achievements");
          if (stored) {
            const achievements = JSON.parse(stored);
            return (
              Array.isArray(achievements) &&
              requiredAchievements.every((a) => achievements.includes(a))
            );
          }
        } catch {
          /* ignore */
        }
        return false;
      },
    },
  },
  {
    id: "secret-shortcut-evangelist",
    title: "📢 SECRET: Shortcut Evangelist",
    description: "Use shortcuts in your daily workflow",
    instructions: [
      "Apply what you learned — use shortcuts while creating content",
      "Share shortcuts with colleagues and teach others",
      "Spread the gospel of productivity!",
    ],
    persona: "all",
    category: "🎁 Extra Credit",
    order: 103,
    estimatedTime: 1800,
    completionCriteria: {
      tutorialStoryId: "✏️-lesson-editor-editor--kitchen-sink",
      quizStoryId: "📄-pages-application-pages--unit-detail",
      completionSequence: ["editor-toolbar"], // Must use the editor toolbar to prove in-context shortcut knowledge
    },
  },

  {
    id: "secret-documentation-explorer",
    title: "🔍 SECRET: Documentation Explorer",
    description:
      "Explore the onboarding documentation and interactive examples",
    instructions: [
      "Browse the 🏠 Getting Started section in the Storybook sidebar",
      "Open the Learning Modes or Task Completion Examples stories",
      "Read through the interactive documentation",
    ],
    persona: "all",
    category: "🎁 Extra Credit",
    order: 104,
    estimatedTime: 60,
    completionCriteria: {
      tutorialStoryId:
        "🏠-getting-started-onboarding-learning-modes--tutorial-mode-example",
      quizStoryId:
        "🏠-getting-started-onboarding-task-completion-examples--auto-detect-task-completion",
    },
  },

  // ============ TRANSLATOR TASKS ============
  {
    id: "translator-language-switcher",
    title: "Try the Language Switcher",
    description: "Preview how UI text appears in each supported language",
    instructions: [
      "Explore the Storybook sidebar to find translatable components",
      "Use Canvas to preview translations, Docs for locale conventions",
      "Find the 🌐 Globe icon in the Storybook top toolbar",
      "Click it to open the language selector dropdown",
      "Switch between languages (ja, es, en) and observe how text changes",
      "Notice any text that did NOT change — missing keys are highlighted",
      "Return to English (en) — this is the source locale",
    ],
    persona: "translator",
    category: "Getting Started",
    order: 1,
    estimatedTime: 120,
    completionCriteria: {
      tutorialStoryId: "translation-mode-demo--default",
      quizStoryId: "translation-mode-demo--editor-namespace",
      completionSequence: ["translation-demo-instructions"], // Must read the instructions that explain the language switcher
    },
  },
  {
    id: "translator-translation-panel",
    title: "Open the Translations Panel",
    description:
      "Use the addon panel to browse, edit, and export translation keys",
    instructions: [
      "Look at the addon panel tabs at the bottom of Storybook",
      'Click the "Translations" tab to open the translation panel',
      "Browse the list of translation keys for the current story",
      "Each row shows the key name, English value, and translation status",
      "Click a row to expand metadata: context, component location, impact level",
      'Use the "Export Translations" button to download JSON or CSV',
    ],
    persona: "translator",
    category: "Getting Started",
    order: 2,
    estimatedTime: 180,
    completionCriteria: {
      tutorialStoryId: "translation-mode-demo--default",
      quizStoryId: "translation-mode-demo--auth-namespace",
      completionSequence: ["translation-auth-form"], // Must interact with the auth form to see its translation panel entries
    },
  },
  {
    id: "translator-locale-files",
    title: "Understand Locale File Structure",
    description:
      "Learn where JSON locale files live and how namespaces map to components",
    instructions: [
      "Locale files are in public/locales/{lang}/ — each namespace is a JSON file",
      "Keys are nested objects (e.g., common.buttons.save)",
      "English (en) is the source of truth — all other locales mirror its key structure",
      'Open the "Editor Namespace" story to see how keys appear in the panel',
      "Compare a key like editor.toolbar.bold across en and ja to see the mapping",
    ],
    persona: "translator",
    category: "Translation Workflow",
    order: 4,
    estimatedTime: 300,
    completionCriteria: {
      tutorialStoryId: "translation-mode-demo--editor-namespace",
      quizStoryId: "translation-mode-demo--auth-namespace",
      completionSequence: ["translation-auth-form"], // Must explore the auth form to understand locale file structure
    },
  },
  {
    id: "translator-component-context",
    title: "Review Component Context",
    description:
      "See exactly which components use each translation key and why",
    instructions: [
      'Open the "Auth Namespace" story — it shows login/signup translations',
      "Click any translation row to expand its metadata",
      "Read Context, Component Location, and User Type fields",
      "Check Tone (formal, casual, technical) — this affects translation style",
      "Use these metadata fields to make context-aware translation decisions",
      "Try several rows to see how context varies across components",
    ],
    persona: "translator",
    category: "Translation Workflow",
    order: 5,
    estimatedTime: 240,
    completionCriteria: {
      tutorialStoryId: "translation-mode-demo--auth-namespace",
      quizStoryId: "translation-mode-demo--default",
      completionSequence: ["translation-auth-buttons"], // Must click auth buttons to explore their translation metadata
    },
  },
  {
    id: "translator-test-rtl",
    title: "Test RTL Language Support",
    description:
      "Verify that right-to-left languages render correctly across components",
    instructions: [
      "Switch to a RTL language using the language selector",
      "Check layout mirrors: sidebar right, content right-to-left, text right-aligned",
      "Verify icons and directional buttons flip correctly",
      "Look for breakage: overlapping text, misaligned buttons, clipped content",
      "Navigate to 2-3 different component stories to test across the UI",
      "Note issues — these need CSS logical properties (start/end vs left/right)",
    ],
    persona: "translator",
    category: "🎁 Extra Credit",
    order: 101,
    estimatedTime: 300,
    completionCriteria: {
      tutorialStoryId: "translation-mode-demo--default",
      quizStoryId: "translation-mode-demo--editor-namespace",
      completionSequence: ["translation-auth-buttons"], // Must click the auth buttons to verify RTL layout of directional UI
    },
  },
  {
    id: "translator-pluralization",
    title: "Review Pluralization Rules",
    description:
      "Verify that count-dependent translations handle plural forms correctly per locale",
    instructions: [
      "Find translation keys containing {{count}} — these use i18next pluralization",
      "Understand locale plural rules (English: 2 forms, Japanese: 1, Arabic: up to 6)",
      "Look for keys ending in _one, _other, _few in the Translations panel",
      "Test with count values 0, 1, 2, 5, 11, 100 to verify correct form selection",
      "Check i18next docs for the plural rules of each target language",
    ],
    persona: "translator",
    category: "🎁 Extra Credit",
    order: 102,
    estimatedTime: 600,
    completionCriteria: {
      tutorialStoryId: "translation-mode-demo--default",
      quizStoryId: "translation-mode-demo--auth-namespace",
      completionSequence: ["translation-password-reset"], // Must interact with password reset form which contains plural key examples
    },
  },
];

/**
 * Get tasks for a specific persona
 */
export function getTasksForPersona(persona: UserPersona): OnboardingTask[] {
  return ONBOARDING_TASKS.filter(
    (task) => task.persona === persona || task.persona === "all",
  ).sort((a, b) => a.order - b.order);
}

/**
 * Get all tasks grouped by category
 */
export function getTasksByCategory(
  persona: UserPersona,
): Record<string, OnboardingTask[]> {
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
