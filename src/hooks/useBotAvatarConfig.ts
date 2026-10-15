/**
 * useBotAvatarConfig — Returns the current user's saved AI assistant (bot)
 * avatar configuration from SettingsContext.metadata. Mirrors useAvatarConfig,
 * but for the bot's own style/background rather than the student's avatar.
 */

import { useContext, useMemo } from "react";
import SettingsContext from "../context/settingsContext";
import type { AvatarStyleTier } from "../components/Gamification/DiceBearAvatar";

export interface BotAvatarConfig {
  /** Resolved bot style tier — saved preference or 'bottts' default */
  style: AvatarStyleTier;
  /** Saved background color (hex, no '#'), or the default sky blue */
  backgroundColor: string;
  /** Whether settings have loaded */
  isLoaded: boolean;
}

export function useBotAvatarConfig(): BotAvatarConfig {
  const ctx = useContext(SettingsContext);
  const settings = ctx?.settings;
  const isLoaded = ctx ? !ctx.isLoading : false;
  const rawMetadata = settings?.metadata;

  return useMemo(() => {
    const metadata: Record<string, unknown> =
      typeof rawMetadata === "string"
        ? (() => {
            try {
              return JSON.parse(rawMetadata);
            } catch {
              return {};
            }
          })()
        : ((rawMetadata || {}) as Record<string, unknown>);

    const style = (metadata.botAvatarStyle as AvatarStyleTier) || "bottts";
    const backgroundColor =
      (metadata.botAvatarBackgroundColor as string) || "b6e3f4";

    return { style, backgroundColor, isLoaded };
  }, [rawMetadata, isLoaded]);
}

export default useBotAvatarConfig;
