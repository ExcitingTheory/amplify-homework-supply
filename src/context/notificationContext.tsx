"use client";
/**
 * NotificationContext — Real-time notification feed for the current user.
 *
 * Uses AppSync `observeQuery()` filtered by `recipientId` to deliver
 * notifications in real-time. Computes unseen counts per category for
 * badge display on navigation items.
 *
 * @module NotificationContext
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
  useRef,
} from "react";
import { getAmplifyClient } from "../utils/amplifyClient";
import AuthContext from "./authContext";

type NotificationCategory =
  | "ASSIGNMENT"
  | "COLLABORATION"
  | "GAMIFICATION"
  | "SQUAD"
  | "CHAT"
  | "SYSTEM";

interface NotificationItem {
  id: string;
  type?: string | null;
  category?: NotificationCategory | string | null;
  title?: string;
  body?: string;
  linkPath?: string;
  linkLabel?: string;
  referenceId?: string;
  referenceType?: string;
  senderName?: string;
  seen?: boolean;
  interacted?: boolean;
  createdAt?: string;
  _version?: number | null;
  [key: string]: unknown;
}

interface NotificationState {
  notifications: NotificationItem[];
  loading: boolean;
}

type NotificationAction =
  | { type: "SET_NOTIFICATIONS"; payload: NotificationItem[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "MARK_SEEN"; payload: string }
  | { type: "MARK_INTERACTED"; payload: string }
  | { type: "MARK_ALL_SEEN" };

interface NotificationContextValue {
  notifications: NotificationItem[];
  unseenCount: number;
  unseenByCategory: Record<string, number>;
  loading: boolean;
  markSeen: (notificationId: string) => Promise<void>;
  markInteracted: (notificationId: string) => Promise<void>;
  markAllSeen: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

// ============================================================================
// Types
// ============================================================================
/**
 * @typedef {'ASSIGNMENT' | 'COLLABORATION' | 'GAMIFICATION' | 'SQUAD' | 'CHAT' | 'SYSTEM'} NotificationCategory
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} recipientId
 * @property {string} type
 * @property {string} category
 * @property {string} title
 * @property {string} [body]
 * @property {string} [linkPath]
 * @property {string} [linkLabel]
 * @property {string} [referenceId]
 * @property {string} [referenceType]
 * @property {string} [senderName]
 * @property {boolean} seen
 * @property {boolean} interacted
 * @property {string} [expiresAt]
 * @property {object} [metadata]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {number} [_version]
 */

// ============================================================================
// Reducer
// ============================================================================
const actionTypes = {
  SET_NOTIFICATIONS: "SET_NOTIFICATIONS",
  SET_LOADING: "SET_LOADING",
  MARK_SEEN: "MARK_SEEN",
  MARK_INTERACTED: "MARK_INTERACTED",
  MARK_ALL_SEEN: "MARK_ALL_SEEN",
} as const;

const initialState: NotificationState = {
  notifications: [],
  loading: true,
};

function notificationReducer(
  state: NotificationState,
  action: NotificationAction,
): NotificationState {
  switch (action.type) {
    case actionTypes.SET_NOTIFICATIONS:
      return { ...state, notifications: action.payload, loading: false };
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case actionTypes.MARK_SEEN:
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, seen: true } : n,
        ),
      };
    case actionTypes.MARK_INTERACTED:
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload
            ? { ...n, seen: true, interacted: true }
            : n,
        ),
      };
    case actionTypes.MARK_ALL_SEEN:
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.seen ? n : { ...n, seen: true },
        ),
      };
    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================
const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unseenCount: 0,
  unseenByCategory: {},
  loading: true,
  markSeen: async () => {},
  markInteracted: async () => {},
  markAllSeen: async () => {},
  deleteNotification: async () => {},
});

// ============================================================================
// Provider
// ============================================================================
function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useContext(AuthContext) as any;
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const versionMapRef = useRef<Record<string, number>>({});

  // Subscribe to notifications for the current user
  useEffect(() => {
    if (authLoading || !user) return;

    const recipientId = user?.attributes?.sub || user?.userId;
    if (!recipientId) return;

    const client = getAmplifyClient();

    // Do NOT filter by recipientId — Amplify Gen 2 auto-filters by owner
    // (ownerDefinedIn("recipientId")). Adding a manual filter causes
    // "subscription filter uses same fieldName multiple time" error.
    const subscription = client.models.Notification.observeQuery().subscribe({
      next: ({ items }) => {
        const baseItems = (items || []) as any[];
        const validItems = baseItems
          .filter((item) => item != null && item.id != null)
          .map((item) => ({
            ...item,
            type: item.type ?? "SYSTEM_ANNOUNCEMENT",
            category: item.category ?? "SYSTEM",
          })) as NotificationItem[];
        // Version guard: skip if no item has a newer _version
        const hasChanges = validItems.some((item) => {
          const tracked = versionMapRef.current[item.id];
          const incomingVersion = item._version ?? 0;
          return tracked == null || incomingVersion > tracked;
        });

        if (
          !hasChanges &&
          Object.keys(versionMapRef.current).length > 0
        ) {
          return;
        }

        // Update version map
        validItems.forEach((item) => {
          versionMapRef.current[item.id] = item._version ?? 0;
        });

        // Sort newest first
        const sorted = [...validItems].sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime(),
        );

        dispatch({ type: actionTypes.SET_NOTIFICATIONS, payload: sorted });
      },
      error: (err: any) => {
        const msg =
          err?.message ||
          err?.errors?.[0]?.message ||
          JSON.stringify(err);
        if (msg.includes("DuplicatedOperationError")) {
          console.warn(
            "[NotificationContext] DuplicatedOperationError (safe to ignore)",
          );
          return;
        }
        if (
          msg === "{}" ||
          msg === "undefined" ||
          msg.includes("exceeds maximum value limit") ||
          msg.includes("Not Authorized")
        ) {
          console.warn(
            "[NotificationContext] Transient subscription error (safe to ignore):",
            msg,
          );
          return;
        }
        console.error("[NotificationContext] Subscription error:", err);
      },
    });

    return () => subscription.unsubscribe();
  }, [authLoading, user]);

  // Compute unseen counts
  const unseenCount = useMemo(
    () => state.notifications.filter((n) => !n.seen).length,
    [state.notifications],
  );

  const unseenByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    state.notifications.forEach((n: NotificationItem) => {
      if (!n.seen && n.category) {
        counts[n.category] = (counts[n.category] || 0) + 1;
      }
    });
    return counts;
  }, [state.notifications]);

  // Actions
  const markSeen = useCallback(
    async (notificationId: string) => {
      dispatch({ type: actionTypes.MARK_SEEN, payload: notificationId });
      try {
        const client = getAmplifyClient();
        const item = state.notifications.find((n) => n.id === notificationId);
        if (item && !item.seen) {
          await client.models.Notification.update({
            id: notificationId,
            seen: true,
            _version: item._version ?? 0,
          });
        }
      } catch (err) {
        console.error("[NotificationContext] Error marking seen:", err);
      }
    },
    [state.notifications],
  );

  const markInteracted = useCallback(
    async (notificationId: string) => {
      dispatch({ type: actionTypes.MARK_INTERACTED, payload: notificationId });
      try {
        const client = getAmplifyClient();
        const item = state.notifications.find((n) => n.id === notificationId);
        if (item) {
          await client.models.Notification.update({
            id: notificationId,
            seen: true,
            interacted: true,
            _version: item._version ?? 0,
          });
        }
      } catch (err) {
        console.error("[NotificationContext] Error marking interacted:", err);
      }
    },
    [state.notifications],
  );

  const markAllSeen = useCallback(async () => {
    dispatch({ type: actionTypes.MARK_ALL_SEEN });
    try {
      const client = getAmplifyClient();
      const unseen = state.notifications.filter((n) => !n.seen);
      const results = await Promise.allSettled(
        unseen.map((n) =>
          client.models.Notification.update({
            id: n.id,
            seen: true,
            _version: n._version ?? 0,
          }),
        ),
      );
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`[NotificationContext] ${failures.length} notification(s) failed to mark seen`);
      }
    } catch (err) {
      console.error("[NotificationContext] Error marking all seen:", err);
    }
  }, [state.notifications]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const client = getAmplifyClient();
        await client.models.Notification.delete({ id: notificationId });
      } catch (err) {
        console.error("[NotificationContext] Error deleting notification:", err);
      }
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      notifications: state.notifications,
      unseenCount,
      unseenByCategory,
      loading: state.loading,
      markSeen,
      markInteracted,
      markAllSeen,
      deleteNotification,
    }),
    [
      state.notifications,
      state.loading,
      unseenCount,
      unseenByCategory,
      markSeen,
      markInteracted,
      markAllSeen,
      deleteNotification,
    ],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================
function useNotifications(): NotificationContextValue {
  return useContext(NotificationContext);
}

function useUnseenCount(category?: string): number {
  const { unseenByCategory, unseenCount } = useContext(NotificationContext);
  if (category) return unseenByCategory[category] || 0;
  return unseenCount;
}

export default NotificationContext;
export { NotificationProvider, useNotifications, useUnseenCount };
