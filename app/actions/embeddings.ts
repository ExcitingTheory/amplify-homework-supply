"use server";

/**
 * Embeddings Server Action
 *
 * Generates text embeddings using Xenova/all-MiniLM-L6-v2 (384D).
 * Unified with search bundles and offline model for consistent results.
 */

import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "./embedding-constants";
import { pipeline, env } from "@huggingface/transformers";

// Singleton pipeline cached across requests in the same server instance
let embeddingPipeline: any = null;

async function getEmbeddingPipeline() {
  if (embeddingPipeline) return embeddingPipeline;
  env.allowLocalModels = false;
  embeddingPipeline = await pipeline("feature-extraction", EMBEDDING_MODEL, {
    dtype: "q8",
  });
  return embeddingPipeline;
}

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
  if (!params.content?.trim()) {
    throw new Error("Content is required to generate an embedding");
  }

  const dimensions = params.dimensions || EMBEDDING_DIMENSIONS;

  const pipe = await getEmbeddingPipeline();
  const output = await pipe(params.content, {
    pooling: "mean",
    normalize: true,
  });
  const embedding = Array.from(output.data as Float32Array).slice(
    0,
    dimensions,
  );

  return {
    embedding,
    model: EMBEDDING_MODEL,
    dimensions: embedding.length,
    tokenCount: Math.ceil(params.content.length / 4),
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

/**
 * Store section metadata for embedding generation by the rebuildSearchBundle Lambda.
 * Stores text at private/{identityId}/embeddings/section/{sectionId}.json
 * without a pre-computed embedding. The Lambda generates the MiniLM 384D embedding
 * at bundle build time using the stored text.
 */
export async function generateSectionEmbedding(
  sectionId: string,
  sectionName: string,
  sectionDescription?: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const { uploadData } = await import("aws-amplify/storage");
    const { runWithAmplifyServerContext } =
      await import("@/utils/amplifyServerUtils");
    const { fetchAuthSession } = await import("aws-amplify/auth/server");
    const { cookies } = await import("next/headers");

    // Get identity for the S3 path
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });

    const identityId = session?.identityId;
    if (!identityId) {
      return { success: false, message: "No identity available" };
    }

    // Build searchable text from section name and description
    const searchText = [sectionName, sectionDescription]
      .filter(Boolean)
      .join(" — ");

    // Store text metadata — Lambda will generate the MiniLM embedding at build time
    const embeddingData = {
      model: "Xenova/all-MiniLM-L6-v2",
      dimensions: 384,
      generatedAt: Date.now(),
      title: sectionName,
      needsEmbedding: true,
      wordCount: searchText.split(/\s+/).length,
      pages: [
        {
          page: 0,
          text: searchText.substring(0, 500),
        },
      ],
    };

    const path = `private/${identityId}/embeddings/section/${sectionId}.json`;
    await uploadData({
      path,
      data: JSON.stringify(embeddingData),
      options: { contentType: "application/json" },
    }).result;

    return { success: true, message: "Section metadata stored for indexing" };
  } catch (err: any) {
    console.error("[embeddings action] generateSectionEmbedding error:", err);
    return { success: false, message: err?.message };
  }
}
