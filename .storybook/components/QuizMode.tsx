/**
 * QuizMode - Hands-on onboarding guide
 *
 * Redirects users to Application Pages section to practice with the actual app.
 * Shows task instructions and tracks completion through OnboardingPanel sidebar.
 *
 * Progress tracking handled by OnboardingPanel sidebar
 */

import React, { useState, useEffect } from "react";
import { getOnboardingEmitter, UserPersona } from "../code/onboarding-events";
import { findTaskById } from "../code/onboarding-tasks";
import "./QuizMode.css";

// Fallback URL for tasks without a resolvable story ID — points at a story that
// always exists (no autodocs page is generated for Application Pages, so a
// "--docs" link here would 404).
const DEFAULT_NAVIGATION = {
  primary: "?path=/story/📄-pages-application-pages--index",
  label: "Browse Application Pages",
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
      if (event.type === "action-performed") {
        const actionName = event.metadata?.actionName;
        if (!actionName) return;

        setActionsPerformed((prev) => {
          if (prev.includes(actionName)) return prev;
          return [...prev, actionName];
        });

        // Check if all required actions completed
        if (requiredActions.length > 0) {
          const allCompleted = requiredActions.every((action) =>
            [...actionsPerformed, actionName].includes(action),
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
      type: "task-completed",
      taskId,
      persona: currentPersona,
      timestamp: Date.now(),
      metadata: {
        mode: "quiz",
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

  // Resolve navigation directly from the task's own completionCriteria —
  // avoids a second, hand-maintained map that can drift out of sync with
  // the actual story IDs defined in onboarding-tasks.ts.
  const storyId =
    task?.completionCriteria?.quizStoryId ||
    task?.completionCriteria?.tutorialStoryId ||
    task?.completionCriteria?.storyId;
  const navigation = storyId
    ? { primary: `?path=/story/${storyId}`, label: "Open Task Page" }
    : DEFAULT_NAVIGATION;

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
                <p>
                  Click below to navigate to the relevant Storybook story where
                  you can practice this task.
                </p>
              </div>
            </div>

            <p className="sidebar-hint">
              💡 <strong>Tip:</strong> Track your progress in the Onboarding
              sidebar panel
            </p>

            <div className="quiz-actions">
              <button
                className="quiz-button"
                onClick={() => handleNavigateToStory(navigation.primary)}
              >
                {navigation.label} →
              </button>
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
