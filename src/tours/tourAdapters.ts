export type TourHost = "app" | "storybook";

export interface SharedTourStep {
  id?: string;
  title?: string;
  description?: string;
  instruction?: string;
  target?: string;
  targetSelector?: string;
  targetFrame?: "preview" | "manager";
  targetIndex?: number;
  targetLast?: boolean;
  tooltipPosition?: "top" | "bottom" | "left" | "right" | "center";
  interactable?: boolean;
  advanceWhenTargetAppears?: string;
  actions?: string[];
  isLast?: boolean;
  navigation?: {
    storyId?: string;
    appPath?: string;
  };
}

/**
 * Convert the Storybook step shape into the app shape and remove manager-only
 * steps that have no equivalent in the application UI.
 */
export function adaptTourSteps<T extends SharedTourStep>(
  steps: T[] = [],
  host: TourHost,
): T[] {
  return steps
    .filter((step) => host === "storybook" || step.targetFrame !== "manager")
    .map((step) => ({
      ...step,
      target:
        host === "app"
          ? step.target || step.targetSelector
          : step.target || step.targetSelector,
    })) as T[];
}

export function createNavigationStep({
  id,
  title,
  description,
  storyId,
  appPath,
  actions,
}: {
  id: string;
  title: string;
  description: string;
  storyId?: string;
  appPath?: string;
  actions?: string[];
}): SharedTourStep {
  return {
    id,
    title,
    description,
    actions,
    navigation: { storyId, appPath },
  };
}

export function getNavigationTarget(
  step: SharedTourStep | undefined,
  host: TourHost,
): string | undefined {
  return host === "storybook"
    ? step?.navigation?.storyId
    : step?.navigation?.appPath;
}
