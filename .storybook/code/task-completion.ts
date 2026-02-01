/**
 * Task Completion Detector
 * 
 * Automatically marks onboarding tasks as complete based on user actions
 * 
 * @module code/task-completion
 */

import { getOnboardingEmitter } from './onboarding-events';
import { ONBOARDING_TASKS, type TaskCompletionCriteria } from './onboarding-tasks';
import { getSequenceTracker } from './action-tracker';

/**
 * Initialize automatic task completion detection
 * 
 * Listens to action-performed events and checks if they satisfy
 * any task's completion criteria
 */
export function initializeTaskCompletion(): () => void {
  const emitter = getOnboardingEmitter();
  const sequenceTracker = getSequenceTracker();
  
  // Subscribe to action events
  const unsubscribe = emitter.on((event) => {
    if (event.type !== 'action-performed') return;
    
    const persona = emitter.getPersona();
    if (!persona) return;
    
    // Get tasks for current persona that aren't completed
    const incompleteTasks = ONBOARDING_TASKS.filter(
      (task) =>
        (task.persona === persona || task.persona === 'all') &&
        !emitter.isTaskCompleted(task.id, persona)
    );
    
    // Check each incomplete task
    for (const task of incompleteTasks) {
      if (!task.completionCriteria) continue;
      
      const criteria = task.completionCriteria;
      const { actionName, storyId, metadata } = event as any;
      
      // Check if action matches criteria
      const shouldComplete = checkCompletionCriteria(
        actionName,
        storyId,
        criteria,
        task.id,
        sequenceTracker
      );
      
      if (shouldComplete) {
        console.log(`[Task Completion] Auto-completing task: ${task.id}`);
        
        emitter.emit({
          type: 'task-completed',
          taskId: task.id,
          persona,
          timestamp: Date.now(),
          metadata: {
            autoDetected: true,
            triggeredBy: actionName,
            storyId,
          },
        });
      }
    }
  });
  
  console.log('[Task Completion] Auto-completion detector initialized');
  
  return unsubscribe;
}

/**
 * Check if an action satisfies task completion criteria
 */
function checkCompletionCriteria(
  actionName: string,
  storyId: string,
  criteria: TaskCompletionCriteria,
  taskId: string,
  sequenceTracker: any
): boolean {
  // Check story ID matches (if specified)
  if (criteria.storyId && criteria.storyId !== storyId) {
    return false;
  }
  
  // Check if action is in required list (OR logic)
  if (criteria.requiredActions) {
    const matches = criteria.requiredActions.includes(actionName);
    if (matches) {
      console.log(`[Task Completion] Action ${actionName} matches required actions for ${taskId}`);
      return true;
    }
  }
  
  // Check if action completes a required sequence
  if (criteria.requiredSequence) {
    sequenceTracker.recordAction(taskId, actionName);
    const isComplete = sequenceTracker.isSequenceComplete(
      taskId,
      criteria.requiredSequence
    );
    
    if (isComplete) {
      console.log(`[Task Completion] Sequence completed for ${taskId}`);
      sequenceTracker.resetSequence(taskId); // Reset for next time
      return true;
    }
  }
  
  // Check custom completion function
  if (criteria.customCheck) {
    return criteria.customCheck();
  }
  
  return false;
}

/**
 * Manually trigger task completion check
 * Useful for testing
 */
export function recheckTaskCompletion(taskId: string): boolean {
  const emitter = getOnboardingEmitter();
  const persona = emitter.getPersona();
  
  if (!persona) {
    console.warn('[Task Completion] No persona selected');
    return false;
  }
  
  const task = ONBOARDING_TASKS.find((t) => t.id === taskId);
  if (!task) {
    console.warn(`[Task Completion] Task not found: ${taskId}`);
    return false;
  }
  
  // Check if already completed
  if (emitter.isTaskCompleted(taskId, persona)) {
    console.log(`[Task Completion] Task already completed: ${taskId}`);
    return true;
  }
  
  // Check custom criteria
  if (task.completionCriteria?.customCheck) {
    const isComplete = task.completionCriteria.customCheck();
    
    if (isComplete) {
      emitter.emit({
        type: 'task-completed',
        taskId,
        persona,
        timestamp: Date.now(),
        metadata: {
          manualCheck: true,
        },
      });
      
      return true;
    }
  }
  
  return false;
}
