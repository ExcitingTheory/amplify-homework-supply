/**
 * useRecycleBin — React hook for soft delete, restore, and permanent delete operations.
 *
 * Wraps the custom GraphQL mutations/queries defined in the recycleBin Lambda.
 * Use in components that need delete/restore functionality.
 */

import React from "react";
import { getAmplifyClient } from "../utils/amplifyClient";

const SUPPORTED_MODELS = [
  "Unit",
  "Section",
  "Question",
  "Word",
  "File",
  "Document",
  "AssistantChat",
];

export function useRecycleBin() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const client = React.useMemo(() => getAmplifyClient(), []);

  /**
   * Soft delete a record (sets deletedAt, cascades to join tables)
   */
  const softDelete = React.useCallback(
    async (modelName, id) => {
      if (!SUPPORTED_MODELS.includes(modelName)) {
        throw new Error(`Unsupported model: ${modelName}`);
      }
      setLoading(true);
      setError(null);
      try {
        const { data } = await client.graphql({
          query: `mutation SoftDelete($modelName: String!, $id: ID!) {
            softDelete(modelName: $modelName, id: $id)
          }`,
          variables: { modelName, id },
        });
        const result = typeof data.softDelete === "string"
          ? JSON.parse(data.softDelete)
          : data.softDelete;
        if (!result.success) {
          throw new Error(result.message || "Soft delete failed");
        }
        return result;
      } catch (err) {
        const message = err?.message || "Soft delete failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  /**
   * Restore a soft-deleted record (clears deletedAt, cascades to join tables)
   */
  const restoreRecord = React.useCallback(
    async (modelName, id) => {
      if (!SUPPORTED_MODELS.includes(modelName)) {
        throw new Error(`Unsupported model: ${modelName}`);
      }
      setLoading(true);
      setError(null);
      try {
        const { data } = await client.graphql({
          query: `mutation RestoreRecord($modelName: String!, $id: ID!) {
            restoreRecord(modelName: $modelName, id: $id)
          }`,
          variables: { modelName, id },
        });
        const result = typeof data.restoreRecord === "string"
          ? JSON.parse(data.restoreRecord)
          : data.restoreRecord;
        if (!result.success) {
          throw new Error(result.message || "Restore failed");
        }
        return result;
      } catch (err) {
        const message = err?.message || "Restore failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  /**
   * Permanently delete a record (archives to S3, removes from DynamoDB)
   */
  const permanentDelete = React.useCallback(
    async (modelName, id) => {
      if (!SUPPORTED_MODELS.includes(modelName)) {
        throw new Error(`Unsupported model: ${modelName}`);
      }
      setLoading(true);
      setError(null);
      try {
        const { data } = await client.graphql({
          query: `mutation PermanentDelete($modelName: String!, $id: ID!) {
            permanentDelete(modelName: $modelName, id: $id)
          }`,
          variables: { modelName, id },
        });
        const result = typeof data.permanentDelete === "string"
          ? JSON.parse(data.permanentDelete)
          : data.permanentDelete;
        if (!result.success) {
          throw new Error(result.message || "Permanent delete failed");
        }
        return result;
      } catch (err) {
        const message = err?.message || "Permanent delete failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  return {
    softDelete,
    restoreRecord,
    permanentDelete,
    loading,
    error,
    SUPPORTED_MODELS,
  };
}

/**
 * useRecycleBinAdmin — Admin-only hook for archive operations.
 */
export function useRecycleBinAdmin() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const client = React.useMemo(() => getAmplifyClient(), []);

  /**
   * List archived records (admin only)
   */
  const listArchives = React.useCallback(
    async ({ modelName, limit, continuationToken } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await client.graphql({
          query: `query ListArchives($modelName: String, $limit: Int, $continuationToken: String) {
            listArchives(modelName: $modelName, limit: $limit, continuationToken: $continuationToken)
          }`,
          variables: { modelName, limit, continuationToken },
        });
        const result = typeof data.listArchives === "string"
          ? JSON.parse(data.listArchives)
          : data.listArchives;
        if (!result.success) {
          throw new Error(result.message || "List archives failed");
        }
        return result;
      } catch (err) {
        const message = err?.message || "List archives failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  /**
   * Get archive details (admin only)
   */
  const getArchive = React.useCallback(
    async (archiveKey) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await client.graphql({
          query: `query GetArchive($archiveKey: String!) {
            getArchive(archiveKey: $archiveKey)
          }`,
          variables: { archiveKey },
        });
        const result = typeof data.getArchive === "string"
          ? JSON.parse(data.getArchive)
          : data.getArchive;
        if (!result.success) {
          throw new Error(result.message || "Get archive failed");
        }
        return result;
      } catch (err) {
        const message = err?.message || "Get archive failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  /**
   * Unarchive a record (admin only — recreates from S3 back to DynamoDB)
   */
  const unarchiveRecord = React.useCallback(
    async (archiveKey) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await client.graphql({
          query: `mutation UnarchiveRecord($archiveKey: String!) {
            unarchiveRecord(archiveKey: $archiveKey)
          }`,
          variables: { archiveKey },
        });
        const result = typeof data.unarchiveRecord === "string"
          ? JSON.parse(data.unarchiveRecord)
          : data.unarchiveRecord;
        if (!result.success) {
          throw new Error(result.message || "Unarchive failed");
        }
        return result;
      } catch (err) {
        const message = err?.message || "Unarchive failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  return {
    listArchives,
    getArchive,
    unarchiveRecord,
    loading,
    error,
  };
}
