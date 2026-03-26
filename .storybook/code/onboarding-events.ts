/**
 * Event system for onboarding task tracking
 * Emits events when users complete onboarding tasks
 */

export type UserPersona = 'instructor' | 'learner' | 'developer' | 'translator';

export interface OnboardingEvent {
  type: 'task-started' | 'task-completed' | 'task-skipped' | 'persona-selected' | 'action-performed';
  taskId: string;
  persona: UserPersona | null;
  timestamp: number;
  metadata?: Record<string, any>;
  actionName?: string;
  storyId?: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  persona: UserPersona | 'all';
  category: string;
  order: number;
  estimatedTime: number; // in seconds
}

class OnboardingEventEmitter {
  private listeners: Set<(event: OnboardingEvent) => void> = new Set();
  private completedTasks: Map<string, OnboardingEvent> = new Map();
  private currentPersona: UserPersona | null = null;

  /**
   * Subscribe to onboarding events
   */
  on(callback: (event: OnboardingEvent) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Emit an onboarding event
   */
  emit(event: OnboardingEvent): void {
    this.listeners.forEach((callback) => callback(event));

    // Track completed tasks
    if (event.type === 'task-completed') {
      const taskKey = `${event.persona}:${event.taskId}`;
      this.completedTasks.set(taskKey, event);
      this.persistToLocalStorage();
    }
  }

  /**
   * Check if a task has been completed
   */
  isTaskCompleted(taskId: string, persona: UserPersona): boolean {
    return this.completedTasks.has(`${persona}:${taskId}`);
  }

  /**
   * Get completion percentage for a persona
   */
  getCompletionPercentage(persona: UserPersona, allTasks: OnboardingTask[]): number {
    const relevantTasks = allTasks.filter((t) => t.persona === persona || t.persona === 'all');
    const completed = relevantTasks.filter((t) =>
      this.isTaskCompleted(t.id, persona)
    ).length;

    if (relevantTasks.length === 0) return 0;
    return Math.round((completed / relevantTasks.length) * 100);
  }

  /**
   * Set the current persona
   */
  setPersona(persona: UserPersona): void {
    this.currentPersona = persona;
    this.emit({
      type: 'persona-selected',
      taskId: 'persona-selection',
      persona,
      timestamp: Date.now(),
    });
    this.persistToLocalStorage();
  }

  /**
   * Get all completed tasks for a persona
   */
  getCompletedTasks(persona: UserPersona): OnboardingEvent[] {
    return Array.from(this.completedTasks.values()).filter((e) => e.persona === persona);
  }

  /**
   * Get current persona
   */
  getPersona(): UserPersona | null {
    return this.currentPersona;
  }

  /**
   * Clear all tracking data and notify listeners
   */
  reset(): void {
    this.completedTasks.clear();
    this.currentPersona = null;
    this.clearLocalStorage();
    // Notify listeners so sidebar widget resets
    this.listeners.forEach((callback) => callback({
      type: 'persona-selected',
      taskId: 'reset',
      persona: null,
      timestamp: Date.now(),
    }));
  }

  /**
   * Persist completion data to localStorage
   */
  private persistToLocalStorage(): void {
    const data = {
      completedTasks: Array.from(this.completedTasks.entries()),
      currentPersona: this.currentPersona,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem('storybook_onboarding_progress', JSON.stringify(data));
    } catch {
      // localStorage might be unavailable
    }
  }

  /**
   * Load completion data from localStorage
   */
  loadFromLocalStorage(): void {
    try {
      const data = JSON.parse(localStorage.getItem('storybook_onboarding_progress') || '{}');
      if (data.completedTasks && Array.isArray(data.completedTasks)) {
        this.completedTasks = new Map(data.completedTasks);
      }
      if (data.currentPersona) {
        this.currentPersona = data.currentPersona;
      }
    } catch {
      // localStorage might be unavailable
    }
  }

  /**
   * Clear localStorage
   */
  private clearLocalStorage(): void {
    try {
      localStorage.removeItem('storybook_onboarding_progress');
    } catch {
      // localStorage might be unavailable
    }
  }
}

// Singleton instance
let instance: OnboardingEventEmitter | null = null;

export function getOnboardingEmitter(): OnboardingEventEmitter {
  if (!instance) {
    instance = new OnboardingEventEmitter();
    instance.loadFromLocalStorage();
  }
  return instance;
}
