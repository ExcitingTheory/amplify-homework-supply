/**
 * Action Tracking System for Onboarding
 * 
 * Wraps Storybook action handlers to emit onboarding events when users
 * interact with components (clicks, form submissions, etc.)
 * 
 * @module code/action-tracker
 */

import { getOnboardingEmitter } from './onboarding-events';
import type { UserPersona } from './onboarding-events';

/**
 * Metadata about an action that was performed
 */
export interface ActionMetadata {
  /** Name of the action (e.g., 'onClick', 'onSubmit') */
  actionName: string;
  /** Storybook story ID where action occurred */
  storyId: string;
  /** Component name if available */
  componentName?: string;
  /** Additional context (element ID, value, etc.) */
  context?: Record<string, any>;
}

/**
 * Event emitted when a trackable action occurs
 */
export interface ActionEvent {
  type: 'action-performed';
  actionName: string;
  storyId: string;
  persona: UserPersona | null;
  timestamp: number;
  metadata?: ActionMetadata;
}

/**
 * Wrap an action handler to emit tracking events
 * 
 * @param handler - Original action handler function
 * @param actionName - Name of the action (e.g., 'onClick')
 * @param context - Story context from Storybook
 * @returns Wrapped handler that tracks the action
 * 
 * @example
 * ```typescript
 * const trackedOnClick = wrapActionWithTracking(
 *   fn(), 
 *   'onClick', 
 *   { storyId: 'pages-units--default' }
 * );
 * ```
 */
export function wrapActionWithTracking(
  handler: (...args: any[]) => any,
  actionName: string,
  context: { storyId?: string; componentName?: string }
): (...args: any[]) => any {
  return (...args: any[]) => {
    // Call original handler first (so Storybook actions panel still works)
    const result = handler?.(...args);
    
    // Emit tracking event
    try {
      const emitter = getOnboardingEmitter();
      const persona = emitter.getPersona();
      
      // Extract additional context from event if available
      const eventContext: Record<string, any> = {};
      if (args[0] && typeof args[0] === 'object') {
        const event = args[0];
        
        // DOM event context
        if (event.target) {
          eventContext.targetId = event.target.id;
          eventContext.targetType = event.target.type;
          eventContext.targetValue = event.target.value;
          eventContext.targetName = event.target.name;
        }
        
        // Synthetic event name
        if (event.type) {
          eventContext.eventType = event.type;
        }
      }
      
      const metadata: ActionMetadata = {
        actionName,
        storyId: context.storyId || 'unknown',
        componentName: context.componentName,
        context: Object.keys(eventContext).length > 0 ? eventContext : undefined,
      };
      
      // Emit to onboarding system
      emitter.emit({
        type: 'action-performed',
        actionName,
        storyId: metadata.storyId,
        persona,
        timestamp: Date.now(),
        metadata,
      } as any);
      
      console.log('[Action Tracker]', {
        action: actionName,
        story: metadata.storyId,
        persona,
        context: eventContext,
      });
    } catch (error) {
      console.error('[Action Tracker] Failed to track action:', error);
    }
    
    return result;
  };
}

/**
 * Create a set of trackable action handlers for common events
 * 
 * @param context - Story context from Storybook
 * @returns Object with wrapped handlers for common actions
 * 
 * @example
 * ```typescript
 * export default {
 *   title: 'Pages/Units',
 *   parameters: {
 *     actions: {
 *       args: createTrackableActions({ storyId: 'pages-units--default' })
 *     }
 *   }
 * };
 * ```
 */
export function createTrackableActions(context: { 
  storyId?: string; 
  componentName?: string;
  baseHandlers?: Record<string, (...args: any[]) => any>;
}) {
  const { storyId, componentName, baseHandlers = {} } = context;
  
  // Common action names to track
  const actionNames = [
    'onClick',
    'onChange', 
    'onSubmit',
    'onClose',
    'onOpen',
    'onSelect',
    'onDelete',
    'onAdd',
    'onRemove',
    'onToggle',
    'onHover',
    'onFocus',
    'onBlur',
    'onSave',
    'onCancel',
    'onEdit',
    'onUpdate',
    'onCreate',
    'onSend',
    'onPlay',
    'onLanguageChange',
    'onPanelOpen',
  ];
  
  const trackableActions: Record<string, (...args: any[]) => any> = {};
  
  for (const actionName of actionNames) {
    const baseHandler = baseHandlers[actionName] || (() => {});
    trackableActions[actionName] = wrapActionWithTracking(
      baseHandler,
      actionName,
      { storyId, componentName }
    );
  }
  
  return trackableActions;
}

/**
 * Check if a specific action matches task completion criteria
 * 
 * @param actionName - Name of the action performed
 * @param storyId - Story where action occurred  
 * @param completionCriteria - Task's completion criteria
 * @returns True if action satisfies criteria
 * 
 * @example
 * ```typescript
 * const criteria = {
 *   storyId: 'pages-units--default',
 *   requiredActions: ['onClick:create-button']
 * };
 * 
 * if (matchesCompletionCriteria('onClick', 'pages-units--default', criteria)) {
 *   completeTask('instructor-create-unit');
 * }
 * ```
 */
export function matchesCompletionCriteria(
  actionName: string,
  storyId: string,
  completionCriteria: {
    storyId?: string;
    requiredActions?: string[];
    requiredSequence?: string[];
  }
): boolean {
  // Check story ID matches
  if (completionCriteria.storyId && completionCriteria.storyId !== storyId) {
    return false;
  }
  
  // Check if action is in required list
  if (completionCriteria.requiredActions) {
    const actionKey = actionName;
    return completionCriteria.requiredActions.includes(actionKey);
  }
  
  return false;
}

/**
 * Track action sequences for multi-step task completion
 */
export class ActionSequenceTracker {
  private sequences: Map<string, string[]> = new Map();
  
  /**
   * Record an action in a sequence
   * 
   * @param sequenceId - Unique ID for this sequence (usually taskId)
   * @param actionName - Action that was performed
   */
  recordAction(sequenceId: string, actionName: string): void {
    const sequence = this.sequences.get(sequenceId) || [];
    sequence.push(actionName);
    this.sequences.set(sequenceId, sequence);
  }
  
  /**
   * Check if required sequence has been completed
   * 
   * @param sequenceId - Sequence to check
   * @param requiredSequence - Required actions in order
   * @returns True if sequence matches
   */
  isSequenceComplete(sequenceId: string, requiredSequence: string[]): boolean {
    const sequence = this.sequences.get(sequenceId) || [];
    
    if (sequence.length < requiredSequence.length) {
      return false;
    }
    
    // Check if required sequence appears in recorded actions (in order)
    let requiredIndex = 0;
    for (const action of sequence) {
      if (action === requiredSequence[requiredIndex]) {
        requiredIndex++;
        if (requiredIndex === requiredSequence.length) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Reset a sequence
   */
  resetSequence(sequenceId: string): void {
    this.sequences.delete(sequenceId);
  }
  
  /**
   * Get current sequence state
   */
  getSequence(sequenceId: string): string[] {
    return this.sequences.get(sequenceId) || [];
  }
}

// Global sequence tracker instance
let sequenceTracker: ActionSequenceTracker | null = null;

/**
 * Get the global action sequence tracker
 */
export function getSequenceTracker(): ActionSequenceTracker {
  if (!sequenceTracker) {
    sequenceTracker = new ActionSequenceTracker();
  }
  return sequenceTracker;
}
