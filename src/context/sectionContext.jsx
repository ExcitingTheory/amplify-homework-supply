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

// Amplify observeQuery wraps real-time failures in { type, error }.
function subscriptionErrorMessage(error) {
  const details = error?.error ?? error;
  const messages = [
    details?.message,
    ...(Array.isArray(details?.errors)
      ? details.errors.map((item) => item?.message)
      : []),
  ].filter((message) => typeof message === "string" && message.length > 0);
  if (messages.length > 0) return messages.join("; ");
  if (typeof details === "string" && details.length > 0) return details;
  return details?.name || "Subscription failed without error details";
}

function handleSubscriptionError(label, error) {
  const message = subscriptionErrorMessage(error);
  if (message.includes("DuplicatedOperationError")) {
    console.warn(
      `[SectionContext] ${label}: transient DuplicatedOperationError (safe to ignore)`,
    );
    return;
  }
  console.error(`[SectionContext] ${label}: ${message}`, error);
}

const SectionProvider = ({ children, unitId, initialSections = [] }) => {
  // Get auth state from centralized context
  const { user, isLoading: authLoading } = React.useContext(AuthContext);
  const [state, dispatch] = useReducer(
    sectionReducer,
    initialSections.length > 0
      ? {
          ...initialState,
          sections: initialSections,
          sectionMap: Object.fromEntries(initialSections.map((s) => [s.id, s])),
        }
      : initialState,
  );
  const sectionVersionMapRef = useRef({});
  const assignmentVersionMapRef = useRef({});

  // Real loading signal — false only once the Section observeQuery has
  // actually responded at least once (not a hardcoded timeout guess).
  const [sectionsLoading, setSectionsLoading] = React.useState(
    initialSections.length === 0,
  );

  // Show deleted toggle state
  const [showDeleted, setShowDeleted] = React.useState(false);
  const [deletedSections, setDeletedSections] = React.useState([]);

  // Gate: don't subscribe until auth is fully resolved
  const authReady = !authLoading && !!user;

  // Seed from IndexedDB cache when offline so pages render immediately
  React.useEffect(() => {
    if (typeof navigator === "undefined" || navigator.onLine) return;
    let mounted = true;
    (async () => {
      try {
        const { getAllCachedSections, getAllCachedAssignments } =
          await import("@/offline/OfflineDataStore");
        const [cachedSections, cachedAssignments] = await Promise.all([
          getAllCachedSections(),
          getAllCachedAssignments(),
        ]);
        if (!mounted) return;
        if (cachedSections.length > 0) {
          dispatch({ type: actionTypes.SET_SECTIONS, payload: cachedSections });
        }
        if (cachedAssignments.length > 0) {
          dispatch({
            type: actionTypes.SET_ASSIGNMENTS,
            payload: cachedAssignments,
          });
        }
      } catch {
        // IndexedDB not available — noop
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!authReady) return;

    const client = getAmplifyClient();
    let cancelled = false;

    // Single observeQuery replaces list() + 3 manual subscriptions
    const subscription = client.models.Section.observeQuery().subscribe({
      next: ({ items }) => {
        if (cancelled) return;
        setSectionsLoading(false);
        const allValid = (items || []).filter(
          (item) => item != null && item.id != null,
        );
        const validItems = allValid.filter((item) => item.deletedAt == null);
        const deleted = allValid.filter((item) => item.deletedAt != null);

        setDeletedSections(deleted);

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
      error: (error) => {
        setSectionsLoading(false); // Don't leave the caller stuck on a skeleton forever
        handleSubscriptionError("Section observeQuery", error);
      },
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [authReady]);

  React.useEffect(() => {
    if (!authReady || !unitId) return;

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
  }, [authReady, unitId]);

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
      sectionsLoading,
      refetchSections,
      bumpSectionVersion,
      bumpAssignmentVersion,
      showDeleted,
      setShowDeleted,
      deletedSections,
    }),
    [
      state.sections,
      state.sectionMap,
      state.assignments,
      sectionsLoading,
      refetchSections,
      bumpSectionVersion,
      bumpAssignmentVersion,
      showDeleted,
      deletedSections,
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
