/**
 * Task Completion Detector
 *
 * Automatically marks onboarding tasks as complete based on user actions
 *
 * @module code/task-completion
 */

import {
  getOnboardingEmitter,
  type UserPersona,
  type OnboardingMode,
} from "./onboarding-events";
import {
  ONBOARDING_TASKS,
  type TaskCompletionCriteria,
} from "./onboarding-tasks";
import { getSequenceTracker } from "./action-tracker";

/**
 * Initialize automatic task completion detection.
 *
 * DOM data-tour clicks are handled directly by the DOM listener (no event bus).
 * The action-performed subscription covers remaining paths: requiredSequence and customCheck.
 */
export function initializeTaskCompletion(): () => void {
  const emitter = getOnboardingEmitter();
  const sequenceTracker = getSequenceTracker();

  // Subscribe to action events
  const unsubscribe = emitter.on((event) => {
    if (event.type !== "action-performed") return;

    const persona = emitter.getPersona();
    if (!persona) return;

    // Get tasks for current persona that aren't completed
    const incompleteTasks = ONBOARDING_TASKS.filter(
      (task) =>
        (task.persona === persona || task.persona === "all") &&
        !emitter.isTaskCompleted(task.id, persona),
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
        sequenceTracker,
      );

      if (shouldComplete) {
        const mode = emitter.getMode();
        console.log(
          `[Task Completion] Auto-completing task: ${task.id} (mode: ${mode})`,
        );

        emitter.emit({
          type: "task-completed",
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

  // Monitor clicks and form submissions on data-tour elements inside the preview.
  // Directly completes matching tasks without going through action-performed events.
  const cleanupDomListeners = initializeDomActionListeners();

  console.log("[Task Completion] Auto-completion detector initialized");

  return () => {
    unsubscribe();
    cleanupDomListeners();
  };
}

/**
 * Get the correct story ID from criteria based on current mode
 */
function getExpectedStoryId(
  criteria: TaskCompletionCriteria,
  mode: "tutorial" | "quiz",
): string | undefined {
  if (mode === "tutorial" && criteria.tutorialStoryId) {
    return criteria.tutorialStoryId;
  }
  if (mode === "quiz" && criteria.quizStoryId) {
    return criteria.quizStoryId;
  }
  // Legacy fallback
  return criteria.storyId;
}

/**
 * Check if a non-DOM action (sequence or custom check) satisfies task completion criteria.
 * DOM-based completions (data-tour element clicks) bypass this via completeDomMatchingTasks.
 * Mode-aware: uses tutorialStoryId or quizStoryId based on current mode.
 */
function checkCompletionCriteria(
  actionName: string,
  storyId: string,
  criteria: TaskCompletionCriteria,
  taskId: string,
  sequenceTracker: any,
): boolean {
  const emitter = getOnboardingEmitter();
  const mode = emitter.getMode();
  const expectedStoryId = getExpectedStoryId(criteria, mode);

  // If a story ID is specified for this mode, the action must occur on that story
  if (expectedStoryId && expectedStoryId !== storyId) {
    return false;
  }

  // Check if action completes a required sequence
  if (criteria.requiredSequence) {
    sequenceTracker.recordAction(taskId, actionName);
    const isComplete = sequenceTracker.isSequenceComplete(
      taskId,
      criteria.requiredSequence,
    );

    if (isComplete) {
      console.log(
        `[Task Completion] [${mode}] Sequence completed for ${taskId}`,
      );
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
 * Get the current story ID from the preview iframe URL.
 */
function getCurrentStoryId(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || "unknown";
  } catch {
    return "unknown";
  }
}

// Session-scoped sequence progress — maps taskId to the user's current step index and the
// story they were on when that step was reached. Progress resets automatically when the
// user navigates to a different story, so abandoned sequences don't persist.
const domSequenceProgress = new Map<
  string,
  { step: number; storyId: string }
>();

/**
 * Advance a task's completionSequence when a data-tour element is clicked.
 * Steps must be completed in order on the same story. Progress resets on story change.
 */
function completeDomMatchingTasks(
  tourId: string,
  storyId: string,
  persona: UserPersona,
  mode: OnboardingMode,
): void {
  const emitter = getOnboardingEmitter();
  const incompleteTasks = ONBOARDING_TASKS.filter(
    (task) =>
      (task.persona === persona || task.persona === "all") &&
      !emitter.isTaskCompleted(task.id, persona),
  );

  for (const task of incompleteTasks) {
    const criteria = task.completionCriteria;
    const sequence = criteria?.completionSequence;
    if (!sequence || sequence.length === 0) continue;

    const expectedStoryId = getExpectedStoryId(criteria, mode);
    if (expectedStoryId && expectedStoryId !== storyId) continue;

    // Get progress; auto-reset if the user navigated to a different story
    const saved = domSequenceProgress.get(task.id);
    const currentStep = saved && saved.storyId === storyId ? saved.step : 0;

    if (sequence[currentStep] !== tourId) continue; // Not the right element for this step

    const nextStep = currentStep + 1;

    if (nextStep >= sequence.length) {
      // Final step reached — task complete
      domSequenceProgress.delete(task.id);
      console.log(
        `[Task Completion] [${mode}] Sequence complete for "${task.id}" (${sequence.length} step${sequence.length > 1 ? "s" : ""})`,
      );
      emitter.emit({
        type: "task-completed",
        taskId: task.id,
        persona,
        timestamp: Date.now(),
        metadata: {
          tourElement: tourId,
          storyId,
          source: "dom-listener",
          totalSteps: sequence.length,
        },
      });
    } else {
      // Advance to next step
      domSequenceProgress.set(task.id, { step: nextStep, storyId });
      console.log(
        `[Task Completion] Task "${task.id}": step ${nextStep}/${sequence.length} — next: "${sequence[nextStep]}"`,
      );
    }
  }
}

/**
 * Monitor clicks and form submissions on elements with data-tour attributes.
 * Directly completes matching tasks without the action-performed intermediary.
 */
function initializeDomActionListeners(): () => void {
  const emitter = getOnboardingEmitter();

  const handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    // Walk up the DOM to find a data-tour element
    const tourEl = target.closest("[data-tour]");
    if (!tourEl) return;

    const persona = emitter.getPersona();
    if (!persona) return;

    const storyId = getCurrentStoryId();
    const tourId = tourEl.getAttribute("data-tour")!;

    console.log(
      "[Task Completion] DOM click on data-tour element:",
      tourId,
      "storyId:",
      storyId,
    );

    completeDomMatchingTasks(tourId, storyId, persona, emitter.getMode());
  };

  const handleSubmit = (e: Event) => {
    const form = e.target as HTMLFormElement;
    if (!form) return;

    // Check if the form or any ancestor has data-tour
    const tourEl =
      form.closest("[data-tour]") || form.querySelector("[data-tour]");
    if (!tourEl) return;

    const persona = emitter.getPersona();
    if (!persona) return;

    const storyId = getCurrentStoryId();
    const tourId = tourEl.getAttribute("data-tour")!;

    console.log(
      "[Task Completion] DOM submit on data-tour element:",
      tourId,
      "storyId:",
      storyId,
    );

    completeDomMatchingTasks(tourId, storyId, persona, emitter.getMode());
  };

  document.addEventListener("click", handleClick, true);
  document.addEventListener("submit", handleSubmit, true);

  console.log("[Task Completion] DOM action listeners initialized");

  return () => {
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("submit", handleSubmit, true);
  };
}

/**
 * Manually trigger task completion check
 * Useful for testing
 */
export function recheckTaskCompletion(taskId: string): boolean {
  const emitter = getOnboardingEmitter();
  const persona = emitter.getPersona();

  if (!persona) {
    console.warn("[Task Completion] No persona selected");
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
        type: "task-completed",
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
