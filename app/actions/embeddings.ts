"use server";

/**
 * Embeddings Server Action
 *
 * Replaces the embeddings Lambda's generateEmbedding operation.
 * Generates text embeddings using OpenAI's text-embedding-3-small model.
 */

import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "./embedding-constants";

export async function generateEmbedding(params: {
  content: string;
  model?: string;
  dimensions?: number;
}): Promise<{
  embedding: number[];
  model: string;
  dimensions: number;
  tokenCount: number;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const model = params.model || EMBEDDING_MODEL;
  const dimensions = params.dimensions || EMBEDDING_DIMENSIONS;

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: params.content,
      dimensions,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embeddings API error: ${response.statusText}`);
  }

  const data = await response.json();
  const result = data.data[0];

  return {
    embedding: result.embedding,
    model: data.model,
    dimensions,
    tokenCount: data.usage?.total_tokens || 0,
  };
}

/**
 * Generate embeddings for all content in a unit (words, questions, files).
 * Server-side wrapper around the batch Lambda operation.
 */
export async function generateUnitEmbeddings(unitId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  const { getServerClient } = await import("@/utils/amplifyServerClient");
  const client = getServerClient();

  try {
    const { data, errors } = await (
      client as any
    ).mutations.generateUnitEmbeddings({ unitId });

    if (errors?.length) {
      console.error(
        "[embeddings action] generateUnitEmbeddings errors:",
        errors,
      );
      return { success: false, message: errors[0]?.message };
    }

    return { success: true, message: "Embeddings generated successfully" };
  } catch (err: any) {
    console.error("[embeddings action] generateUnitEmbeddings error:", err);
    return { success: false, message: err?.message };
  }
}

/**
 * Generate embeddings for a specific file's content.
 * Server-side wrapper around the generateEmbeddings Lambda operation.
 */
export async function generateFileEmbeddings(fileID: string): Promise<{
  success: boolean;
  message?: string;
}> {
  const { getServerClient } = await import("@/utils/amplifyServerClient");
  const client = getServerClient();

  try {
    const { data, errors } = await (client as any).mutations.generateEmbeddings(
      { fileID },
    );

    if (errors?.length) {
      console.error(
        "[embeddings action] generateFileEmbeddings errors:",
        errors,
      );
      return { success: false, message: errors[0]?.message };
    }

    const result = typeof data === "string" ? JSON.parse(data) : data;
    return { success: result?.success !== false, message: result?.message };
  } catch (err: any) {
    console.error("[embeddings action] generateFileEmbeddings error:", err);
    return { success: false, message: err?.message };
  }
}

/**
 * Trigger document analysis (PDF text extraction + vocabulary generation).
 */
export async function analyzeDocument(fileID: string): Promise<{
  success: boolean;
  message?: string;
}> {
  const { getServerClient } = await import("@/utils/amplifyServerClient");
  const client = getServerClient();

  try {
    const { data, errors } = await (client as any).mutations.analyzeDocument({
      fileID,
    });

    if (errors?.length) {
      console.error("[embeddings action] analyzeDocument errors:", errors);
      return { success: false, message: errors[0]?.message };
    }

    const result = typeof data === "string" ? JSON.parse(data) : data;
    return { success: true, message: result?.message || "Analysis started" };
  } catch (err: any) {
    console.error("[embeddings action] analyzeDocument error:", err);
    return { success: false, message: err?.message };
  }
}

/**
 * Cancel an in-progress document analysis.
 */
export async function cancelDocumentAnalysis(fileId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  const { getServerClient } = await import("@/utils/amplifyServerClient");
  const client = getServerClient();

  try {
    const { data, errors } = await (
      client as any
    ).mutations.cancelDocumentAnalysis({ fileID: fileId });

    if (errors?.length) {
      console.error(
        "[embeddings action] cancelDocumentAnalysis errors:",
        errors,
      );
      return { success: false, message: errors[0]?.message };
    }

    const result = typeof data === "string" ? JSON.parse(data) : data;
    return { success: true, message: result?.message || "Analysis cancelled" };
  } catch (err: any) {
    console.error("[embeddings action] cancelDocumentAnalysis error:", err);
    return { success: false, message: err?.message };
  }
}
