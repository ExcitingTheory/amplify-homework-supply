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

// Application Pages URL
const APP_PAGES_URL = '/?path=/docs/%F0%9F%93%84-pages-application-pages--docs';

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

  const handleNavigateToApp = () => {
    // Navigate to Application Pages
    window.parent.location.href = APP_PAGES_URL;
  };

  if (!task) {
    return (
      <div className="quiz-mode-error">
        Task "{taskId}" not found
      </div>
    );
  }

  return (
    <div className="quiz-mode-container">
      {/* Task Instructions with Navigation to App */}
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
              <div className="hint-icon">📄</div>
              <div>
                <strong>Practice with the actual app</strong>
                <p>Click below to navigate to <strong>Application Pages</strong> where you can interact with the real interface.</p>
              </div>
            </div>

            <p className="sidebar-hint">
              💡 <strong>Tip:</strong> Track your progress in the Onboarding sidebar panel
            </p>

            <div className="quiz-actions">
              <button
                className="quiz-button"
                onClick={handleNavigateToApp}
              >
                Go to Application Pages →
              </button>
              
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
