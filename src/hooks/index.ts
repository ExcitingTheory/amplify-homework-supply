/**
 * Custom React hooks
 */

export { useYjsUnit } from "./useYjsUnit";
export type { UseYjsUnitConfig, UseYjsUnitReturn } from "./useYjsUnit";

export { useNetworkStatus } from "./useNetworkStatus";
export type { NetworkStatus } from "./useNetworkStatus";

export {
  useGamificationFeatures,
  useSectionGamificationFeatures,
  GAMIFICATION_FEATURE_META,
} from "./useGamificationFeatures";
export type {
  GamificationFeatureKey,
  GamificationFeatureState,
  GamificationFeatureMeta,
  UseGamificationFeaturesResult,
} from "./useGamificationFeatures";

// Re-export other hooks as needed
