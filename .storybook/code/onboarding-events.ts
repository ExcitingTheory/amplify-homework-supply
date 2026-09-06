/**
 * Event system for onboarding task tracking
 * Emits events when users complete onboarding tasks
 */

export type UserPersona = "instructor" | "learner" | "translator";
export type OnboardingMode = "tutorial" | "quiz";

export interface OnboardingEvent {
  type:
    | "task-started"
    | "task-completed"
    | "task-skipped"
    | "persona-selected"
    | "action-performed";
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
  persona: UserPersona | "all";
  category: string;
  order: number;
  estimatedTime: number; // in seconds
}

class OnboardingEventEmitter {
  private listeners: Set<(event: OnboardingEvent) => void> = new Set();
  private completedTasks: Map<string, OnboardingEvent> = new Map();
  private currentPersona: UserPersona | null = null;
  private currentMode: OnboardingMode = "tutorial";
  private storageListenerAttached = false;

  /**
   * Subscribe to onboarding events.
   * Also starts listening for cross-frame localStorage changes so that
   * task completions from the preview iframe are picked up by the manager.
   */
  on(callback: (event: OnboardingEvent) => void): () => void {
    this.listeners.add(callback);
    this.ensureStorageListener();
    return () => this.listeners.delete(callback);
  }

  /**
   * Attach a storage event listener (once) so that when another frame
   * writes to localStorage we reload state and notify listeners.
   */
  private ensureStorageListener(): void {
    if (this.storageListenerAttached) return;
    if (typeof window === "undefined") return;
    this.storageListenerAttached = true;

    window.addEventListener("storage", (e: StorageEvent) => {
      if (e.key !== "storybook_onboarding_progress") return;

      // Snapshot previous completed task keys
      const previousKeys = new Set(this.completedTasks.keys());

      // Reload state from localStorage
      this.loadFromLocalStorage();

      // Detect and emit newly completed tasks
      for (const [key, event] of this.completedTasks.entries()) {
        if (!previousKeys.has(key)) {
          console.log(
            "[OnboardingEmitter] Cross-frame task completion detected:",
            key,
          );
          this.listeners.forEach((cb) => cb(event));
        }
      }
    });
  }

  /**
   * Emit an onboarding event
   */
  emit(event: OnboardingEvent): void {
    this.listeners.forEach((callback) => callback(event));

    // Track completed tasks
    if (event.type === "task-completed") {
      const taskKey = `${event.persona}:${event.taskId}`;
      this.completedTasks.set(taskKey, event);
      this.persistToLocalStorage();
    }
  }

  /**
   * Check if a task has been completed.
   * Checks the requested persona first, then falls back to any other persona
   * (supports cross-persona "all" tasks like Extra Credit secrets).
   */
  isTaskCompleted(taskId: string, persona: UserPersona): boolean {
    if (this.completedTasks.has(`${persona}:${taskId}`)) return true;
    // Cross-persona: check if any other persona completed it
    const allPersonas: UserPersona[] = ["instructor", "learner", "translator"];
    return allPersonas.some((p) => this.completedTasks.has(`${p}:${taskId}`));
  }

  /**
   * Get completion percentage for a persona
   */
  getCompletionPercentage(
    persona: UserPersona,
    allTasks: OnboardingTask[],
  ): number {
    const relevantTasks = allTasks.filter(
      (t) =>
        (t.persona === persona || t.persona === "all") &&
        t.category !== "🎁 Extra Credit",
    );
    const completed = relevantTasks.filter((t) =>
      this.isTaskCompleted(t.id, persona),
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
      type: "persona-selected",
      taskId: "persona-selection",
      persona,
      timestamp: Date.now(),
    });
    this.persistToLocalStorage();
  }

  /**
   * Deselect the current persona and return to role-selection UI.
   * Task completion data for ALL personas is preserved.
   */
  clearPersona(): void {
    this.currentPersona = null;
    this.persistToLocalStorage();
    // Notify listeners so the panel and sidebar widget return to role selection
    this.listeners.forEach((callback) =>
      callback({
        type: "persona-selected",
        taskId: "persona-cleared",
        persona: null,
        timestamp: Date.now(),
      }),
    );
  }

  /**
   * Get all completed tasks relevant to a persona.
   * Includes tasks completed by the given persona AND cross-persona "all" tasks
   * completed by any persona (Extra Credit secrets are shared across personas).
   *
   * If `allTasks` is provided, only cross-persona completions for tasks with
   * `persona === "all"` are included. Without it, ALL cross-persona completions
   * are included (backwards-compatible but less precise).
   */
  getCompletedTasks(
    persona: UserPersona,
    allTasks?: OnboardingTask[],
  ): OnboardingEvent[] {
    const seen = new Set<string>();
    const results: OnboardingEvent[] = [];

    // First: include all tasks completed directly by this persona
    for (const event of this.completedTasks.values()) {
      if (event.persona === persona) {
        seen.add(event.taskId);
        results.push(event);
      }
    }

    // Second: include cross-persona completions for "all" tasks
    const crossPersonaTaskIds = allTasks
      ? new Set(allTasks.filter((t) => t.persona === "all").map((t) => t.id))
      : null;

    for (const event of this.completedTasks.values()) {
      if (seen.has(event.taskId)) continue;
      if (event.persona === persona) continue; // already handled above
      // Include if task is cross-persona (or if we can't tell, include all)
      if (!crossPersonaTaskIds || crossPersonaTaskIds.has(event.taskId)) {
        seen.add(event.taskId);
        results.push(event);
      }
    }

    return results;
  }

  /**
   * Get current persona
   */
  getPersona(): UserPersona | null {
    return this.currentPersona;
  }

  /**
   * Set the current onboarding mode (tutorial or quiz)
   */
  setMode(mode: OnboardingMode): void {
    this.currentMode = mode;
    this.persistToLocalStorage();
  }

  /**
   * Get the current onboarding mode
   */
  getMode(): OnboardingMode {
    return this.currentMode;
  }

  /**
   * Clear all tracking data and notify listeners
   */
  reset(): void {
    this.completedTasks.clear();
    this.currentPersona = null;
    this.currentMode = "tutorial";
    this.clearLocalStorage();
    // Notify listeners so sidebar widget resets
    this.listeners.forEach((callback) =>
      callback({
        type: "persona-selected",
        taskId: "reset",
        persona: null,
        timestamp: Date.now(),
      }),
    );
  }

  /**
   * Persist completion data to localStorage
   */
  private persistToLocalStorage(): void {
    const data = {
      completedTasks: Array.from(this.completedTasks.entries()),
      currentPersona: this.currentPersona,
      currentMode: this.currentMode,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(
        "storybook_onboarding_progress",
        JSON.stringify(data),
      );
    } catch {
      // localStorage might be unavailable
    }
  }

  /**
   * Load completion data from localStorage
   */
  loadFromLocalStorage(): void {
    try {
      const data = JSON.parse(
        localStorage.getItem("storybook_onboarding_progress") || "{}",
      );
      if (data.completedTasks && Array.isArray(data.completedTasks)) {
        this.completedTasks = new Map(data.completedTasks);
      }
      if (data.currentPersona) {
        this.currentPersona = data.currentPersona;
      }
      if (data.currentMode) {
        this.currentMode = data.currentMode;
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
      localStorage.removeItem("storybook_onboarding_progress");
      localStorage.removeItem("keyboard-trainer-completed");
      localStorage.removeItem("keyboard-trainer-achievements");
      localStorage.removeItem("keyboard-trainer-start");
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
