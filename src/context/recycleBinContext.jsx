/**
 * RecycleBinContext — Provides state for the recycle bin page.
 *
 * Subscribes to all soft-deletable models and exposes items where deletedAt != null.
 * Provides softDelete, restore, and permanentDelete actions.
 */

import React from "react";
import { getAmplifyClient } from "../utils/amplifyClient";

const RecycleBinContext = React.createContext(null);

const MODELS_WITH_SOFT_DELETE = [
  "Unit",
  "Section",
  "Question",
  "Word",
  "File",
  "Document",
  "AssistantChat",
];

function recycleBinReducer(state, action) {
  switch (action.type) {
    case "SET_ITEMS":
      return {
        ...state,
        items: { ...state.items, [action.modelName]: action.items },
        loading: false,
      };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };
    case "REMOVE_ITEM": {
      const updated = (state.items[action.modelName] || []).filter(
        (item) => item.id !== action.id,
      );
      return {
        ...state,
        items: { ...state.items, [action.modelName]: updated },
      };
    }
    default:
      return state;
  }
}

export function RecycleBinProvider({ children }) {
  const [state, dispatch] = React.useReducer(recycleBinReducer, {
    items: {},
    loading: true,
    error: null,
  });

  const client = React.useMemo(() => getAmplifyClient(), []);

  // Fetch soft-deleted items from each model
  React.useEffect(() => {
    let cancelled = false;

    async function fetchDeletedItems() {
      dispatch({ type: "SET_LOADING", loading: true });

      for (const modelName of MODELS_WITH_SOFT_DELETE) {
        try {
          const { data } = await client.models[modelName].list({
            filter: { deletedAt: { attributeExists: true } },
          });

          if (cancelled) return;

          const deletedItems = (data || []).filter(
            (item) => item != null && item.deletedAt != null,
          );

          dispatch({ type: "SET_ITEMS", modelName, items: deletedItems });
        } catch (err) {
          console.warn(
            `[RecycleBinContext] Failed to fetch deleted ${modelName}:`,
            err,
          );
        }
      }

      if (!cancelled) {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    }

    fetchDeletedItems();
    return () => {
      cancelled = true;
    };
  }, [client]);

  // Actions
  const softDelete = React.useCallback(
    async (modelName, id) => {
      const { data } = await client.graphql({
        query: `mutation SoftDelete($modelName: String!, $id: ID!) {
          softDelete(modelName: $modelName, id: $id)
        }`,
        variables: { modelName, id },
      });
      const result =
        typeof data.softDelete === "string"
          ? JSON.parse(data.softDelete)
          : data.softDelete;
      if (!result.success) throw new Error(result.message);

      // Re-fetch deleted items for this model
      const { data: refreshed } = await client.models[modelName].list({
        filter: { deletedAt: { attributeExists: true } },
      });
      dispatch({
        type: "SET_ITEMS",
        modelName,
        items: (refreshed || []).filter(
          (i) => i != null && i.deletedAt != null,
        ),
      });

      return result;
    },
    [client],
  );

  const restoreRecord = React.useCallback(
    async (modelName, id) => {
      const { data } = await client.graphql({
        query: `mutation RestoreRecord($modelName: String!, $id: ID!) {
          restoreRecord(modelName: $modelName, id: $id)
        }`,
        variables: { modelName, id },
      });
      const result =
        typeof data.restoreRecord === "string"
          ? JSON.parse(data.restoreRecord)
          : data.restoreRecord;
      if (!result.success) throw new Error(result.message);

      // Remove from local state
      dispatch({ type: "REMOVE_ITEM", modelName, id });
      return result;
    },
    [client],
  );

  const permanentDelete = React.useCallback(
    async (modelName, id) => {
      const { data } = await client.graphql({
        query: `mutation PermanentDelete($modelName: String!, $id: ID!) {
          permanentDelete(modelName: $modelName, id: $id)
        }`,
        variables: { modelName, id },
      });
      const result =
        typeof data.permanentDelete === "string"
          ? JSON.parse(data.permanentDelete)
          : data.permanentDelete;
      if (!result.success) throw new Error(result.message);

      // Remove from local state
      dispatch({ type: "REMOVE_ITEM", modelName, id });
      return result;
    },
    [client],
  );

  const allDeletedItems = React.useMemo(() => {
    const all = [];
    for (const [modelName, items] of Object.entries(state.items)) {
      for (const item of items) {
        all.push({ ...item, _modelName: modelName });
      }
    }
    // Sort by deletedAt descending (most recent first)
    all.sort((a, b) => {
      const dateA = new Date(a.deletedAt || 0).getTime();
      const dateB = new Date(b.deletedAt || 0).getTime();
      return dateB - dateA;
    });
    return all;
  }, [state.items]);

  const value = React.useMemo(
    () => ({
      items: state.items,
      allDeletedItems,
      loading: state.loading,
      error: state.error,
      softDelete,
      restoreRecord,
      permanentDelete,
      MODELS_WITH_SOFT_DELETE,
    }),
    [
      state.items,
      allDeletedItems,
      state.loading,
      state.error,
      softDelete,
      restoreRecord,
      permanentDelete,
    ],
  );

  return (
    <RecycleBinContext.Provider value={value}>
      {children}
    </RecycleBinContext.Provider>
  );
}

export function useRecycleBinContext() {
  const context = React.useContext(RecycleBinContext);
  if (!context) {
    throw new Error(
      "useRecycleBinContext must be used within RecycleBinProvider",
    );
  }
  return context;
}

export default RecycleBinContext;
