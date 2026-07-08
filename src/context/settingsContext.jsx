"use client";
import React, { createContext, useReducer, useRef } from "react";
import { getAmplifyClient } from "../utils/amplifyClient";
import AuthContext from "./authContext";
import {
  settingsReducer,
  initialState,
  actionTypes,
} from "./reducers/settingsReducer";

const SettingsContext = createContext();

const SettingsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const settingsVersionRef = useRef(0);

  // Get auth state from centralized context
  const authContext = React.useContext(AuthContext);
  const { user, isLoading: authLoading } = authContext || {
    user: undefined,
    isLoading: true,
  };

  React.useEffect(() => {
    // Wait for auth to be ready
    if (authLoading || !user) {
      console.log("[SettingsContext] Waiting for auth...", {
        authLoading,
        hasUser: !!user,
      });
      return;
    }

    console.log(
      "[SettingsContext] Setting up Settings subscription for user:",
      user.attributes.sub,
    );
    const client = getAmplifyClient();
    let cancelled = false;
    let subscription = null;

    function handleError(label, error) {
      const msg =
        error?.message ||
        error?.errors?.[0]?.message ||
        error?.error?.errors?.[0]?.message ||
        JSON.stringify(error);
      if (msg.includes("DuplicatedOperationError")) {
        console.warn(
          `[SettingsContext] ${label}: transient DuplicatedOperationError (safe to ignore)`,
        );
        return;
      }
      console.error(`[SettingsContext] ${label} error:`, error);
    }

    async function initSettings() {
      try {
        // Check if settings exist; if not, create defaults first
        const { data: items } = await client.models.Settings.list();
        if (cancelled) return;

        const validItems = (items || []).filter(
          (item) => item != null && item.id != null,
        );
        if (validItems.length === 0) {
          // Create default settings with _version: 1 for optimistic concurrency
          await client.models.Settings.create({
            _version: 1,
            autoAnalyzeDocuments: true,
            documentAnalysisModel: "gpt-4",
            editorTheme: "auto",
            editorFontSize: 14,
            defaultAIModel: "gpt-4",
            assistantVoice: "shimmer",
            emailNotifications: true,
            webhookNotifications: false,
            language: "en",
            profileThemeId: "default",
            audioCleanupStrength: "standard",
          });
          if (cancelled) return;
        }
      } catch (error) {
        console.error("[SettingsContext] initSettings error:", error);
      }

      // observeQuery handles initial fetch + real-time updates in one subscription
      subscription = client.models.Settings.observeQuery().subscribe({
        next: ({ items }) => {
          if (cancelled) return;
          const validItems = (items || []).filter(
            (item) => item != null && item.id != null,
          );
          if (validItems.length === 0) return;

          const settings = validItems[0];

          // Version guard: only process if incoming version is strictly greater
          if (
            settings._version != null &&
            !(settings._version > settingsVersionRef.current)
          ) {
            return;
          }

          settingsVersionRef.current = settings._version || 0;
          dispatch({ type: actionTypes.SETTINGS_LOADED, payload: settings });
        },
        error: (error) => handleError("Settings observeQuery", error),
      });
    }

    initSettings();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [authLoading, user]);

  // Sync avatar config from Settings.metadata → StudentProfile + Squad.members (denormalized for leaderboard/chat)
  async function syncAvatarToProfile(client, authUser, metadata) {
    if (!client?.models?.StudentProfile || !authUser) return;
    const studentId = authUser.username || authUser.userId;
    if (!studentId) return;

    // Find the user's StudentProfile(s) and update avatar fields
    const { data: profiles } = await client.models.StudentProfile.list({
      filter: { studentId: { eq: studentId } },
    });
    const validProfiles = (profiles || []).filter(
      (p) => p != null && p.id != null,
    );

    const avatarUpdate = {
      avatarStyle: metadata.avatarStyle || undefined,
      avatarOverrides: metadata.avatarOverrides
        ? JSON.stringify(metadata.avatarOverrides)
        : undefined,
      avatarSeed: metadata.avatarSeed || studentId,
    };

    for (const profile of validProfiles) {
      await client.models.StudentProfile.update({
        id: profile.id,
        _version: profile._version,
        ...avatarUpdate,
      });
    }

    // Also update SectionProgress records
    if (client.models.SectionProgress) {
      const { data: sectionProgs } = await client.models.SectionProgress.list({
        filter: { studentId: { eq: studentId } },
      });
      const validSP = (sectionProgs || []).filter(
        (p) => p != null && p.id != null,
      );
      for (const sp of validSP) {
        await client.models.SectionProgress.update({
          id: sp.id,
          _version: sp._version,
          ...avatarUpdate,
        });
      }
    }

    // Update Squad.members with new avatar (denormalized for squad leaderboard)
    if (client.models.Squad) {
      try {
        const cohortId = validProfiles[0]?.cohortId;
        if (cohortId) {
          const { data: squads } = await client.models.Squad.list({
            filter: { cohortId: { eq: cohortId } },
          });
          const validSquads = (squads || []).filter(
            (s) => s != null && s.id != null,
          );
          for (const squad of validSquads) {
            const members = squad.members || [];
            const memberIdx = members.findIndex(
              (m) => m?.studentId === studentId,
            );
            if (memberIdx === -1) continue;
            const updatedMembers = [...members];
            updatedMembers[memberIdx] = {
              ...updatedMembers[memberIdx],
              avatarStyle: metadata.avatarStyle || undefined,
              avatarOverrides: metadata.avatarOverrides
                ? JSON.stringify(metadata.avatarOverrides)
                : undefined,
              avatarSeed: metadata.avatarSeed || studentId,
            };
            await client.models.Squad.update({
              id: squad.id,
              _version: squad._version,
              members: updatedMembers,
            });
          }
        }
      } catch (err) {
        console.warn("[SettingsContext] squad avatar sync failed:", err);
      }
    }
  }

  const updateSettings = React.useCallback(
    async (updates) => {
      if (!state.settings) return;

      // ── Theme level-gating enforcement ──────────────────────────────────
      // Prevent users from persisting a theme they haven't unlocked.
      if (updates.profileThemeId && updates.profileThemeId !== "default") {
        const THEME_MIN_LEVELS = {
          midnight: 2,
          forest: 3,
          sunset: 4,
          aurora: 5,
          custom: 2,
        };
        const requiredLevel = THEME_MIN_LEVELS[updates.profileThemeId];
        if (requiredLevel) {
          try {
            const client = getAmplifyClient();
            const { data: profiles } = await client.models.StudentProfile.list({
              filter: { owner: { eq: user } },
              selectionSet: ["id", "level"],
            });
            const userLevel = profiles?.[0]?.level || 1;
            if (userLevel < requiredLevel) {
              console.warn(
                `[SettingsContext] Theme "${updates.profileThemeId}" requires level ${requiredLevel}, user is level ${userLevel}. Blocked.`,
              );
              return;
            }
          } catch (err) {
            console.warn(
              "[SettingsContext] Could not verify theme level-gate, allowing update:",
              err,
            );
            // Fail open — don't block if the profile query fails
          }
        }
      }

      // Optimistic version bump — blocks subscription echo
      const predictedNextVersion = (state.settings._version || 0) + 1;
      settingsVersionRef.current = predictedNextVersion;

      try {
        const client = getAmplifyClient();
        const { data: updated, errors } = await client.models.Settings.update({
          id: state.settings.id,
          _version: predictedNextVersion,
          ...updates,
        });
        if (errors?.length) {
          console.error("[SettingsContext] update errors:", errors);
          settingsVersionRef.current = state.settings._version || 0;
        }
        if (updated) {
          settingsVersionRef.current = updated._version || 0;
          dispatch({ type: actionTypes.SET_SETTINGS, payload: updated });

          // Sync avatar config to StudentProfile (denormalized for leaderboard/chat)
          if (updates.metadata) {
            const meta =
              typeof updates.metadata === "string"
                ? JSON.parse(updates.metadata)
                : updates.metadata;
            if (meta.avatarStyle || meta.avatarOverrides) {
              syncAvatarToProfile(client, user, meta).catch((err) =>
                console.warn(
                  "[SettingsContext] avatar sync to profile failed:",
                  err,
                ),
              );
            }
          }
        }
        return updated;
      } catch (error) {
        console.error("Error updating settings:", error);
        settingsVersionRef.current = state.settings._version || 0;
        throw error;
      }
    },
    [state.settings, user],
  );

  const contextValue = React.useMemo(
    () => ({
      settings: state.settings,
      isLoading: state.isLoading,
      updateSettings,
    }),
    [state.settings, state.isLoading, updateSettings],
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export { SettingsProvider };
export default SettingsContext;
