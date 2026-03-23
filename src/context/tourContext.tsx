/**
 * Tour Context
 * 
 * Provides tour/onboarding functionality throughout the main application.
 * Exposes the same tour system available in Storybook's OnboardingPanel
 * to the chatbot and other components.
 * 
 * Features:
 * - Start/stop guided tours
 * - Track tour progress
 * - Integrate with SpotlightOverlay
 * - Expose tours to chatbot tools
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setTourTasksData } from '../utils/chatTools';

// Import tour tasks and configurations from Storybook code
// Note: These are TypeScript files but can be imported in JS/TS with proper config
const ONBOARDING_TASKS = [
  // We'll populate this from a static import or API
  // For now, define a minimal set that covers the most important tours
  {
    id: 'instructor-setup-class',
    title: 'Set Up Your First Class',
    description: 'Create a new class section for your students',
    instructions: [
      'Navigate to the Sections page',
      'Click "Create Section" button',
      'Enter a class name',
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
      'Enter a title',
      'Use the Editor to add content',
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
      'Add answer choices',
      'Mark the correct answer',
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
      'Navigate to Dictionary Editor in left sidebar',
      'Click "Add Word" button',
      'Enter word and definition',
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
      'Set a due date',
      'Assign to your section',
    ],
    persona: 'instructor',
    category: 'Assignments',
    order: 5,
    estimatedTime: 240,
  },
  {
    id: 'instructor-use-ai-assistant',
    title: 'Use AI to Generate Content',
    description: 'Leverage AI assistance for content creation',
    instructions: [
      'Open the ChatSidebar',
      'Ask AI to help create content',
      'Review and refine AI suggestions',
      'Insert content into your unit',
    ],
    persona: 'instructor',
    category: 'AI Tools',
    order: 7,
    estimatedTime: 420,
  },
  {
    id: 'learner-join-class',
    title: 'Join Your First Class',
    description: 'Use a join code to enroll in a class',
    instructions: [
      'Go to Sections page',
      'Click "Join Section"',
      'Enter the join code from your instructor',
      'Confirm enrollment',
    ],
    persona: 'learner',
    category: 'Getting Started',
    order: 1,
    estimatedTime: 180,
  },
  {
    id: 'learner-complete-assignment',
    title: 'Complete an Assignment',
    description: 'Work through unit content and submit',
    instructions: [
      'Go to your Assignments',
      'Click on an assignment',
      'Read through the content',
      'Answer quiz questions',
      'Complete all sections',
    ],
    persona: 'learner',
    category: 'Coursework',
    order: 3,
    estimatedTime: 720,
  },
  {
    id: 'learner-use-chat-help',
    title: 'Get Help from AI Assistant',
    description: 'Use the AI chatbot for learning support',
    instructions: [
      'Open the ChatSidebar',
      'Ask questions about content',
      'Request explanations',
      'Get practice suggestions',
    ],
    persona: 'learner',
    category: 'Learning Support',
    order: 6,
    estimatedTime: 300,
  },
];

interface TourContextValue {
  /** Start a guided tour */
  startTour: (tourId: string, mode?: 'tutorial' | 'quiz') => void;
  
  /** Stop the current tour */
  stopTour: () => void;
  
  /** Current active tour ID */
  currentTour: string | null;
  
  /** Current tour mode */
  currentMode: 'tutorial' | 'quiz' | null;
  
  /** Whether a tour is currently active */
  isActive: boolean;
  
  /** Get all available tours */
  getAvailableTours: () => typeof ONBOARDING_TASKS;
}

const TourContext = createContext<TourContextValue | null>(null);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTour, setCurrentTour] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<'tutorial' | 'quiz' | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Define callbacks first before they're used in effects
  const startTour = useCallback((tourId: string, mode: 'tutorial' | 'quiz' = 'tutorial') => {
    console.log('[TourContext] Starting tour:', tourId, 'mode:', mode);
    
    const tour = ONBOARDING_TASKS.find(t => t.id === tourId);
    if (!tour) {
      console.error('[TourContext] Tour not found:', tourId);
      return;
    }

    setCurrentTour(tourId);
    setCurrentMode(mode);
    setIsActive(true);

    // Emit event to any listening components (like SpotlightOverlay)
    window.dispatchEvent(new CustomEvent('tour:start', {
      detail: { tourId, mode, tour }
    }));
  }, []);

  const stopTour = useCallback(() => {
    console.log('[TourContext] Stopping tour:', currentTour);
    
    setCurrentTour(null);
    setCurrentMode(null);
    setIsActive(false);

    // Emit stop event
    window.dispatchEvent(new CustomEvent('tour:stop'));
  }, [currentTour]);

  const getAvailableTours = useCallback(() => {
    return ONBOARDING_TASKS;
  }, []);

  // Register tour tasks with chatTools on mount
  useEffect(() => {
    console.log('[TourContext] Initializing tour system with', ONBOARDING_TASKS.length, 'tasks');
    setTourTasksData(ONBOARDING_TASKS);
  }, []);

  // Expose tour methods to window for Cypress testing (dev mode only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.log('[TourContext] Exposing tour methods to window for testing');
      (window as any).startTour = startTour;
      (window as any).stopTour = stopTour;
      (window as any).getAvailableTours = getAvailableTours;

      return () => {
        // Cleanup on unmount
        delete (window as any).startTour;
        delete (window as any).stopTour;
        delete (window as any).getAvailableTours;
      };
    }
  }, [startTour, stopTour, getAvailableTours]);

  const value: TourContextValue = {
    startTour,
    stopTour,
    currentTour,
    currentMode,
    isActive,
    getAvailableTours,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};

/**
 * Hook to access tour functionality
 */
export const useTour = (): TourContextValue => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

/**
 * Hook to safely access tour functionality (returns null if not in provider)
 */
export const useTourSafe = (): TourContextValue | null => {
  return useContext(TourContext);
};

export default TourContext;
