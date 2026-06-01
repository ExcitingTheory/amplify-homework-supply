"use client";
import React, { useReducer, useRef } from "react";
import { getAmplifyClient } from "../utils/amplifyClient";
import AuthContext from "./authContext";
import {
  sectionReducer,
  initialState,
  actionTypes,
} from "./reducers/sectionReducer";

const SectionContext = React.createContext({
  sections: [],
  sectionMap: {},
  assignments: [],
});

/**
 * Check if a subscription error is transient (safe to ignore).
 * DuplicatedOperationError occurs during rapid mount/unmount cycles
 * (React StrictMode, navigation) and resolves on its own.
 */
function isTransientSubscriptionError(error) {
  const msg =
    error?.message || error?.errors?.[0]?.message || JSON.stringify(error);
  return msg.includes("DuplicatedOperationError");
}

function handleSubscriptionError(label, error) {
  if (isTransientSubscriptionError(error)) {
    console.warn(
      `[SectionContext] ${label}: transient DuplicatedOperationError (safe to ignore)`,
    );
    return;
  }
  console.error(`[SectionContext] ${label}:`, error);
}

const SectionProvider = ({ children, unitId }) => {
  // Get auth state from centralized context
  const { user, isLoading: authLoading } = React.useContext(AuthContext);
  const [state, dispatch] = useReducer(sectionReducer, initialState);
  const sectionVersionMapRef = useRef({});
  const assignmentVersionMapRef = useRef({});

  React.useEffect(() => {
    console.log("[SectionContext] useEffect triggered", {
      authLoading,
      hasUser: !!user,
      userSub: user?.attributes?.sub,
    });
    // Wait for auth to be ready
    if (authLoading || !user) {
      console.log("[SectionContext] Waiting for auth...", {
        authLoading,
        hasUser: !!user,
      });
      return;
    }

    const client = getAmplifyClient();
    let cancelled = false;

    // Single observeQuery replaces list() + 3 manual subscriptions
    const subscription = client.models.Section.observeQuery().subscribe({
      next: ({ items }) => {
        if (cancelled) return;
        const validItems = (items || []).filter(
          (item) => item != null && item.id != null,
        );

        // Version map guard: skip if no item has a newer _version
        const hasChanges = validItems.some((item) => {
          const tracked = sectionVersionMapRef.current[item.id];
          return tracked == null || item._version > tracked;
        });

        if (
          !hasChanges &&
          Object.keys(sectionVersionMapRef.current).length > 0
        ) {
          return; // All items same or older version — skip dispatch
        }

        // Update version map
        sectionVersionMapRef.current = {};
        validItems.forEach((item) => {
          sectionVersionMapRef.current[item.id] = item._version;
        });

        console.log(
          "[SectionContext] Section observeQuery update:",
          validItems.length,
        );
        dispatch({ type: actionTypes.SET_SECTIONS, payload: validItems });
      },
      error: (error) => handleSubscriptionError("Section observeQuery", error),
    });

    return () => {
      console.log("[SectionContext] Cleaning up subscriptions");
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [user, authLoading]);

  React.useEffect(() => {
    if (!unitId) return;

    const client = getAmplifyClient();
    let cancelled = false;

    // Single observeQuery with filter replaces list() + 3 manual subscriptions
    const subscription = client.models.Assignment.observeQuery({
      filter: { unitID: { eq: unitId } },
    }).subscribe({
      next: ({ items }) => {
        if (cancelled) return;
        const validItems = (items || []).filter(
          (item) => item != null && item.id != null,
        );

        // Version map guard: skip if no item has a newer _version
        const hasChanges = validItems.some((item) => {
          const tracked = assignmentVersionMapRef.current[item.id];
          return tracked == null || item._version > tracked;
        });

        if (
          !hasChanges &&
          Object.keys(assignmentVersionMapRef.current).length > 0
        ) {
          return; // All items same or older version — skip dispatch
        }

        // Update version map
        assignmentVersionMapRef.current = {};
        validItems.forEach((item) => {
          assignmentVersionMapRef.current[item.id] = item._version;
        });

        dispatch({ type: actionTypes.SET_ASSIGNMENTS, payload: validItems });
      },
      error: (error) =>
        handleSubscriptionError("Assignment observeQuery", error),
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [unitId]);

  // Refetch sections - can be called after create/update operations
  const refetchSections = React.useCallback(async () => {
    console.log("[SectionContext] Manual refetch triggered");
    const client = getAmplifyClient();
    try {
      const { data: fetchedSections, errors } =
        await client.models.Section.list();
      if (errors) {
        console.error("[SectionContext] Refetch errors:", errors);
      }
      const validItems = (fetchedSections || []).filter(
        (item) => item != null && item.id != null,
      );
      console.log(
        "[SectionContext] Refetch complete, sections:",
        validItems.length,
      );

      dispatch({ type: actionTypes.SET_SECTIONS, payload: validItems });
    } catch (error) {
      console.error("[SectionContext] Refetch error:", error);
    }
  }, []);

  // Optimistic version bump helpers — call before save to block subscription echo
  const bumpSectionVersion = React.useCallback((id, currentVersion) => {
    const previousVersion = sectionVersionMapRef.current[id] || currentVersion;
    sectionVersionMapRef.current[id] = currentVersion + 1;
    return {
      confirm: (actualVersion) => {
        sectionVersionMapRef.current[id] = actualVersion;
      },
      rollback: () => {
        sectionVersionMapRef.current[id] = previousVersion;
      },
    };
  }, []);

  const bumpAssignmentVersion = React.useCallback((id, currentVersion) => {
    const previousVersion =
      assignmentVersionMapRef.current[id] || currentVersion;
    assignmentVersionMapRef.current[id] = currentVersion + 1;
    return {
      confirm: (actualVersion) => {
        assignmentVersionMapRef.current[id] = actualVersion;
      },
      rollback: () => {
        assignmentVersionMapRef.current[id] = previousVersion;
      },
    };
  }, []);

  // Memoize context value to prevent unnecessary rerenders
  const contextValue = React.useMemo(
    () => ({
      sections: state.sections,
      sectionMap: state.sectionMap,
      assignments: state.assignments,
      refetchSections,
      bumpSectionVersion,
      bumpAssignmentVersion,
    }),
    [
      state.sections,
      state.sectionMap,
      state.assignments,
      refetchSections,
      bumpSectionVersion,
      bumpAssignmentVersion,
    ],
  );

  return (
    <SectionContext.Provider value={contextValue}>
      {children}
    </SectionContext.Provider>
  );
};

export { SectionProvider };

export default SectionContext;
