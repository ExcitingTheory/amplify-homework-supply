/**
 * QuizMode - Hands-on onboarding guide
 * 
 * Redirects users to Application Pages section to practice with the actual app.
 * Shows task instructions and tracks completion through OnboardingPanel sidebar.
 * 
 * Progress tracking handled by OnboardingPanel sidebar
 */

import React, { useState, useEffect } from 'react';
import { getOnboardingEmitter, UserPersona } from '../code/onboarding-events';
import { findTaskById } from '../code/onboarding-tasks';
import './QuizMode.css';

/**
 * Task-specific navigation links for Quiz Mode
 * Maps task IDs to their primary Storybook story and optional alternatives
 */
interface TaskNavigation {
  primary: string;
  label: string;
  alternatives?: { url: string; label: string }[];
}

const TASK_NAVIGATION: Record<string, TaskNavigation> = {
  'instructor-setup-class': {
    primary: '?path=/story/📄-pages-application-pages--sections',
    label: 'Open Sections Page',
    alternatives: [
      { url: '?path=/story/🧩-components-section-assigner--default', label: 'Section Assigner Component' }
    ]
  },
  'instructor-create-unit': {
    primary: '?path=/story/📄-pages-application-pages--units',
    label: 'Open Units Page',
    alternatives: [
      { url: '?path=/story/�-creating-lessons-editor--editor-with-content', label: 'Editor' },
      { url: '?path=/story/📄-pages-application-pages--unit-detail', label: 'Unit Detail' }
    ]
  },
  'instructor-add-quiz': {
    primary: '?path=/story/📚-creating-lessons-editor-plugins-quizplugin--default',
    label: 'Open Quiz Plugin',
    alternatives: [
      { url: '?path=/story/📚-creating-lessons-editor--editor-with-content', label: 'Full Editor' }
    ]
  },
  'instructor-create-vocabulary': {
    primary: '?path=/story/📚-creating-lessons-editor-plugins-wordblockplugin--default',
    label: 'Open Word Block Plugin',
    alternatives: [
      { url: '?path=/story/📁-managing-content-vocabulary-review--default', label: 'Vocabulary Review' }
    ]
  },
  'instructor-create-assignment': {
    primary: '?path=/story/📄-pages-application-pages--section-detail',
    label: 'Open Section Detail',
    alternatives: [
      { url: '?path=/story/🧩-components-section-assigner--default', label: 'Section Assigner' }
    ]
  },
  'instructor-view-grades': {
    primary: '?path=/story/📄-pages-application-pages--section-detail',
    label: 'Open Section Detail (Grades)',
    alternatives: [
      { url: '?path=/story/📄-pages-application-pages--workbook', label: 'Student Workbook View' }
    ]
  },
  'instructor-use-ai-assistant': {
    primary: '?path=/story/💬-ai-assistant-chat-sidebar--getting-started',
    label: 'Open AI Chat Sidebar',
    alternatives: [
      { url: '?path=/story/📚-creating-lessons-editor-plugins-aicontentcompletionplugin--default', label: 'AI Content Completion' },
      { url: '?path=/story/📚-creating-lessons-editor-components-enhancedgeneration--default', label: 'Enhanced Generation' }
    ]
  },
  'instructor-learn-shortcuts': {
    primary: '?path=/story/help-keyboard-shortcut-trainer--default',
    label: 'Open Keyboard Shortcuts Trainer',
    alternatives: [
      { url: '?path=/story/�-creating-lessons-editor--keyboard-shortcuts-demo', label: 'Watch Demo' },
      { url: '?path=/story/📚-creating-lessons-editor--empty-editor-text-formatting', label: 'Practice in Editor' }
    ]
  },
  // Learner tasks
  'learner-join-class': {
    primary: '?path=/story/📄-pages-application-pages--sections',
    label: 'Open Sections Page',
  },
  'learner-view-assignments': {
    primary: '?path=/story/📄-pages-application-pages--section-detail-student',
    label: 'Open My Section',
  },
  'learner-complete-assignment': {
    primary: '?path=/story/📄-pages-application-pages--workbook',
    label: 'Open Workbook',
  },
  'learner-review-feedback': {
    primary: '?path=/story/📄-pages-application-pages--index',
    label: 'Open Dashboard',
    alternatives: [
      { url: '?path=/story/📄-pages-application-pages--section-detail-student', label: 'My Section' }
    ]
  },
  'learner-practice-vocabulary': {
    primary: '?path=/story/📁-managing-content-vocabulary-review--default',
    label: 'Open Vocabulary Review',
  },
  'learner-use-chat-help': {
    primary: '?path=/story/💬-ai-assistant-chat-sidebar--getting-started',
    label: 'Open AI Chat',
  },
  // Developer tasks
  'developer-explore-components': {
    primary: '?path=/docs/getting-started-introduction--docs',
    label: 'Browse Components',
  },
  'developer-understand-editor': {
    primary: '?path=/docs/📚-creating-lessons-editor--docs',
    label: 'Open Editor Docs',
    alternatives: [
      { url: '?path=/story/📚-creating-lessons-editor--editor-with-content', label: 'Live Editor' }
    ]
  },
  'developer-keyboard-shortcuts-demo': {
    primary: '?path=/story/help-keyboard-shortcuts--keyboard-shortcut-trainer',
    label: 'Open Keyboard Shortcuts',
    alternatives: [
      { url: '?path=/story/�-creating-lessons-editor--keyboard-shortcuts-demo', label: 'Watch Automated Demo' }
    ]
  },
  // Secret tasks
  'secret-keyboard-master': {
    primary: '?path=/story/help-keyboard-shortcut-trainer--default',
    label: 'Start Keyboard Master Challenge',
  },
  'secret-speed-demon': {
    primary: '?path=/story/help-keyboard-shortcut-trainer--default',
    label: 'Start Speed Challenge',
  },
  'secret-achievement-hunter': {
    primary: '?path=/story/help-keyboard-shortcut-trainer--default',
    label: 'Unlock Achievements',
  },
};

// Fallback URL for tasks without specific navigation
const DEFAULT_NAVIGATION = {
  primary: '?path=/docs/📄-pages-application-pages--docs',
  label: 'Browse Application Pages',
};

export interface QuizModeProps {
  /** Task ID being completed */
  taskId: string;
  /** Required actions to complete task (optional) */
  requiredActions?: string[];
  /** Persona (defaults to current) */
  persona?: UserPersona;
  /** Callback when task completed */
  onComplete?: () => void;
}

export function QuizMode({
  taskId,
  requiredActions = [],
  persona,
  onComplete,
}: QuizModeProps) {
  const [completed, setCompleted] = useState(false);
  const [actionsPerformed, setActionsPerformed] = useState<string[]>([]);
  
  const emitter = getOnboardingEmitter();
  const currentPersona = persona || emitter.getPersona();
  const task = findTaskById(taskId);

  useEffect(() => {
    if (!currentPersona) return;

    // Check if already completed
    const isCompleted = emitter.isTaskCompleted(taskId, currentPersona);
    setCompleted(isCompleted);

    // Subscribe to action events
    const unsubscribe = emitter.on((event) => {
      if (event.type === 'action-performed') {
        const actionName = event.metadata?.actionName;
        if (!actionName) return;
        
        setActionsPerformed((prev) => {
          if (prev.includes(actionName)) return prev;
          return [...prev, actionName];
        });

        // Check if all required actions completed
        if (requiredActions.length > 0) {
          const allCompleted = requiredActions.every((action) =>
            [...actionsPerformed, actionName].includes(action)
          );
          
          if (allCompleted && !isCompleted) {
            handleComplete();
          }
        }
      }
    });

    return unsubscribe;
  }, [currentPersona, taskId, requiredActions, actionsPerformed]);

  const handleComplete = () => {
    if (!currentPersona) return;

    emitter.emit({
      type: 'task-completed',
      taskId,
      persona: currentPersona,
      timestamp: Date.now(),
      metadata: {
        mode: 'quiz',
        actionsPerformed,
      },
    });
    
    setCompleted(true);
    onComplete?.();
  };

  const handleNavigateToStory = (url: string) => {
    // Navigate to specific story
    window.parent.location.href = url;
  };

  const handleNavigateToAlternative = (url: string) => {
    // Navigate to alternative story
    window.parent.location.href = url;
  };

  // Get navigation info for this task
  const navigation = TASK_NAVIGATION[taskId] || DEFAULT_NAVIGATION;

  if (!task) {
    return (
      <div className="quiz-mode-error">
        <p>Task not found: {taskId}</p>
      </div>
    );
  }

  return (
    <div className="quiz-mode-container">
      {/* Task Instructions Overlay */}
      {!completed && (
        <div className="quiz-instructions-overlay">
          <div className="quiz-instructions-card">
            <h3>🎯 {task.title}</h3>
            <p>{task.description}</p>
            
            <div className="quiz-steps">
              <strong>Steps to complete:</strong>
              <ol>
                {task.instructions.map((instruction, i) => (
                  <li key={i}>{instruction}</li>
                ))}
              </ol>
            </div>

            <div className="app-navigation-hint">
              <div className="hint-icon">🎮</div>
              <div>
                <strong>Practice with the interactive component</strong>
                <p>Click below to navigate to the relevant Storybook story where you can practice this task.</p>
              </div>
            </div>

            <p className="sidebar-hint">
              💡 <strong>Tip:</strong> Track your progress in the Onboarding sidebar panel
            </p>

            <div className="quiz-actions">
              <button
                className="quiz-button"
                onClick={() => handleNavigateToStory(navigation.primary)}
              >
                {navigation.label} →
              </button>
              
              {navigation.alternatives && navigation.alternatives.length > 0 && (
                <div className="alternative-links">
                  <p className="alternatives-label">Or try these:</p>
                  {navigation.alternatives.map((alt, i) => (
                    <button
                      key={i}
                      className="quiz-button alternative"
                      onClick={() => handleNavigateToAlternative(alt.url)}
                    >
                      {alt.label}
                    </button>
                  ))}
                </div>
              )}

              {requiredActions.length === 0 && (
                <button
                  className="quiz-button secondary"
                  onClick={handleComplete}
                >
                  Mark as Complete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion Message */}
      {completed && (
        <div className="quiz-completion-banner">
          <div className="completion-content">
            <span className="completion-icon">🎉</span>
            <span>Task completed! Great work!</span>
            <button
              className="next-task-button"
              onClick={() => {
                window.parent.history.back();
              }}
            >
              Back to Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizMode;
