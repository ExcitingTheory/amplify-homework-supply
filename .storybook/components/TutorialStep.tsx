/**
 * TutorialStep - Interactive tutorial component for onboarding
 * 
 * Displays next to Quick Start Guide sections with:
 * - Interactive demo component
 * - Step completion tracking
 * - "Try it yourself" CTA to quiz mode
 */

import React, { useState } from 'react';
import { getOnboardingEmitter, UserPersona } from '../code/onboarding-events';
import './TutorialStep.css';

export interface TutorialStepProps {
  /** Unique ID for this step */
  stepId: string;
  /** Title displayed at top of step */
  title: string;
  /** Description of what the user will learn */
  description: string;
  /** Interactive demo component */
  demoComponent?: React.ReactNode;
  /** Story ID to navigate to in quiz mode */
  quizStoryId?: string;
  /** Persona this step is for (defaults to current) */
  persona?: UserPersona;
  /** Completion criteria - manual or auto */
  completionMode?: 'manual' | 'auto';
}

export function TutorialStep({
  stepId,
  title,
  description,
  demoComponent,
  quizStoryId,
  persona,
  completionMode = 'manual',
}: TutorialStepProps) {
  const [completed, setCompleted] = useState(false);
  const emitter = getOnboardingEmitter();
  const currentPersona = persona || emitter.getPersona();

  React.useEffect(() => {
    if (currentPersona) {
      const isCompleted = emitter.isTaskCompleted(stepId, currentPersona);
      setCompleted(isCompleted);
    }
  }, [stepId, currentPersona, emitter]);

  const handleComplete = () => {
    if (!currentPersona) {
      alert('Please select a persona in the Onboarding panel first');
      return;
    }

    emitter.emit({
      type: 'task-completed',
      taskId: stepId,
      persona: currentPersona,
      timestamp: Date.now(),
      metadata: {
        mode: 'tutorial',
        component: 'TutorialStep',
      },
    });
    setCompleted(true);
  };

  const handleTryQuiz = () => {
    if (!quizStoryId) return;
    
    // Navigate to quiz mode story
    const quizUrl = `?path=/story/${quizStoryId}&onboardingMode=quiz&taskId=${stepId}`;
    window.parent.location.href = quizUrl;
  };

  return (
    <div className="tutorial-step" data-completed={completed}>
      <div className="tutorial-step-header">
        <div className="step-status">
          {completed ? '✅' : '⭕'}
        </div>
        <div className="step-title">
          <h4>{title}</h4>
          <p className="step-description">{description}</p>
        </div>
      </div>

      {demoComponent && (
        <div className="tutorial-demo">
          <div className="demo-label">👇 Try it here:</div>
          {demoComponent}
        </div>
      )}

      <div className="tutorial-actions">
        {!completed && completionMode === 'manual' && (
          <button
            className="tutorial-button primary"
            onClick={handleComplete}
            disabled={!currentPersona}
          >
            Mark as Complete
          </button>
        )}

        {quizStoryId && (
          <button
            className="tutorial-button secondary"
            onClick={handleTryQuiz}
          >
            {completed ? 'Review in Quiz Mode' : 'Try it Yourself →'}
          </button>
        )}

        {completed && (
          <div className="completion-message">
            ✓ Step completed! Great work!
          </div>
        )}
      </div>
    </div>
  );
}

export default TutorialStep;
