/**
 * TypeScript type definitions and exports for the onboarding system
 */

export type { OnboardingEvent, OnboardingTask } from './onboarding-events';
export type { UserPersona, OnboardingMode } from './onboarding-events';

export { getOnboardingEmitter } from './onboarding-events';
export { ONBOARDING_TASKS, getTasksForPersona, getTasksByCategory, findTaskById } from './onboarding-tasks';

export {
  useCompleteTask,
  useTrackTask,
  useOnboardingStatus,
} from './useOnboarding';

// Re-export for convenience
export { OnboardingPanel } from '../components/OnboardingPanel';
