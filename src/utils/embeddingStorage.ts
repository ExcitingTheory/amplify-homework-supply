import { uploadData } from "aws-amplify/storage";
import getCachedUrl from "./getCachedUrl";

type ModelName = "unit" | "section" | "question" | "word" | "file";

export interface PageEmbedding {
  page: number;
  embedding: number[];
  text?: string;
}

export interface EmbeddingFile {
  model: string;
  dimensions: number;
  generatedAt: number;
  wordCount: number;
  pages: PageEmbedding[];
}

function embeddingKey(
  identityId: string,
  modelName: ModelName,
  modelId: string,
): string {
  return `private/${identityId}/embeddings/${modelName}/${modelId}.json`;
}

/**
 * Save embedding vector(s) to S3.
 * Called after generating embedding via Lambda.
 */
export async function saveEmbedding(
  identityId: string,
  modelName: ModelName,
  modelId: string,
  data: EmbeddingFile,
): Promise<void> {
  await uploadData({
    path: embeddingKey(identityId, modelName, modelId),
    data: JSON.stringify(data),
    options: { contentType: "application/json" },
  }).result;
}

/**
 * Load embedding from S3 via getCachedUrl (presigned URL with 60-min cache).
 * Returns null if not yet generated.
 */
export async function loadEmbedding(
  identityId: string,
  modelName: ModelName,
  modelId: string,
): Promise<EmbeddingFile | null> {
  try {
    const url = await getCachedUrl(
      embeddingKey(identityId, modelName, modelId),
    );
    if (!url) return null;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Load just the vectors (no metadata) for vector store population.
 * Returns array of embedding vectors (one per page).
 */
export async function loadEmbeddingVectors(
  identityId: string,
  modelName: ModelName,
  modelId: string,
): Promise<number[][] | null> {
  const data = await loadEmbedding(identityId, modelName, modelId);
  if (!data) return null;
  return data.pages.map((p) => p.embedding);
}
