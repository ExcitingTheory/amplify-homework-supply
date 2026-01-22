import { useEffect } from 'react';
import { getOnboardingEmitter, UserPersona } from '../code/onboarding-events';

/**
 * Hook to mark a task as completed when a component mounts
 * Useful for detecting when users reach certain screens in their journey
 */
export const useCompleteTask = (taskId: string, persona?: UserPersona, condition: boolean = true) => {
  useEffect(() => {
    if (!condition) return;

    const emitter = getOnboardingEmitter();
    const currentPersona = persona || emitter.getPersona();

    if (currentPersona && !emitter.isTaskCompleted(taskId, currentPersona)) {
      setTimeout(() => {
        emitter.emit({
          type: 'task-completed',
          taskId,
          persona: currentPersona,
          timestamp: Date.now(),
          metadata: {
            autoDetected: true,
            component: window.location.pathname,
          },
        });
      }, 500);
    }
  }, [taskId, persona, condition]);
};

/**
 * Hook to track task progress (started, in-progress events)
 */
export const useTrackTask = (taskId: string, persona?: UserPersona) => {
  const emitter = getOnboardingEmitter();
  const currentPersona = persona || emitter.getPersona();

  const startTask = () => {
    if (currentPersona) {
      emitter.emit({
        type: 'task-started',
        taskId,
        persona: currentPersona,
        timestamp: Date.now(),
        metadata: {
          component: window.location.pathname,
        },
      });
    }
  };

  const completeTask = (metadata?: Record<string, any>) => {
    if (currentPersona) {
      emitter.emit({
        type: 'task-completed',
        taskId,
        persona: currentPersona,
        timestamp: Date.now(),
        metadata,
      });
    }
  };

  const skipTask = (reason?: string) => {
    if (currentPersona) {
      emitter.emit({
        type: 'task-skipped',
        taskId,
        persona: currentPersona,
        timestamp: Date.now(),
        metadata: { reason },
      });
    }
  };

  return { startTask, completeTask, skipTask };
};

/**
 * Hook to get current onboarding status
 */
export const useOnboardingStatus = () => {
  const emitter = getOnboardingEmitter();

  return {
    persona: emitter.getPersona(),
    isCompleted: (taskId: string) => {
      const persona = emitter.getPersona();
      return persona ? emitter.isTaskCompleted(taskId, persona) : false;
    },
    getCompletionPercentage: (allTasks: any[]) => {
      const persona = emitter.getPersona();
      return persona ? emitter.getCompletionPercentage(persona, allTasks) : 0;
    },
    reset: () => emitter.reset(),
  };
};
