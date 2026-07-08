/**
 * LocalEmbeddingModel — Runs a small transformer embedding model
 * entirely in the browser via @huggingface/transformers (ONNX Runtime Web).
 *
 * Model: Xenova/all-MiniLM-L6-v2 (~22MB quantized)
 * Dimensions: 384
 * Similarity: cosine (vectors are L2-normalized)
 *
 * This replaces the TF-IDF fallback with real semantic embeddings for offline search.
 * The model is downloaded once and cached by the browser (Cache API / IndexedDB).
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  model: string;
}

export interface LocalEmbeddingConfig {
  /** HuggingFace model ID. Default: 'Xenova/all-MiniLM-L6-v2' */
  modelId?: string;
  /** Progress callback during model download */
  onProgress?: (progress: { status: string; progress?: number }) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const MODEL_DIMENSIONS = 384;

// ── Singleton state ───────────────────────────────────────────────────────────

let pipeline: any = null;
let loadingPromise: Promise<any> | null = null;
let currentModelId: string = DEFAULT_MODEL_ID;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Check if the local embedding model is ready (already loaded in memory).
 */
export function isModelReady(): boolean {
  return pipeline !== null;
}

/**
 * Get the model's output dimensions.
 */
export function getModelDimensions(): number {
  return MODEL_DIMENSIONS;
}

/**
 * Get the model identifier.
 */
export function getModelId(): string {
  return currentModelId;
}

/**
 * Load the embedding model into memory. Downloads ~22MB on first use,
 * then cached by the browser. Safe to call multiple times (deduplicates).
 */
export async function loadModel(config?: LocalEmbeddingConfig): Promise<void> {
  if (pipeline) return;

  if (loadingPromise) {
    await loadingPromise;
    return;
  }

  const modelId = config?.modelId || DEFAULT_MODEL_ID;
  currentModelId = modelId;

  loadingPromise = (async () => {
    try {
      const { pipeline: createPipeline, env } = await import(
        /* webpackIgnore: true */ "@huggingface/transformers"
      );

      // Use browser cache for model files
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      pipeline = await createPipeline("feature-extraction", modelId, {
        dtype: "q8", // 8-bit quantized for speed + small size
        progress_callback: config?.onProgress,
      });
    } catch (err) {
      loadingPromise = null;
      throw err;
    }
  })();

  await loadingPromise;
}

/**
 * Generate an embedding for a single text input.
 * Model must be loaded first via loadModel().
 */
export async function embed(text: string): Promise<EmbeddingResult> {
  if (!pipeline) {
    await loadModel();
  }

  const output = await pipeline(text, {
    pooling: "mean",
    normalize: true,
  });

  // output.data is a Float32Array
  const embedding = Array.from(output.data as Float32Array);

  return {
    embedding,
    dimensions: MODEL_DIMENSIONS,
    model: currentModelId,
  };
}

/**
 * Generate embeddings for multiple texts in a batch.
 * More efficient than calling embed() in a loop.
 */
export async function embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
  if (!pipeline) {
    await loadModel();
  }

  if (texts.length === 0) return [];

  const results: EmbeddingResult[] = [];

  // Process in chunks to avoid OOM on large batches
  const CHUNK_SIZE = 32;
  for (let i = 0; i < texts.length; i += CHUNK_SIZE) {
    const chunk = texts.slice(i, i + CHUNK_SIZE);
    const output = await pipeline(chunk, {
      pooling: "mean",
      normalize: true,
    });

    // output shape: [batchSize, dimensions]
    const data = output.data as Float32Array;
    for (let j = 0; j < chunk.length; j++) {
      const start = j * MODEL_DIMENSIONS;
      const end = start + MODEL_DIMENSIONS;
      results.push({
        embedding: Array.from(data.slice(start, end)),
        dimensions: MODEL_DIMENSIONS,
        model: currentModelId,
      });
    }
  }

  return results;
}

/**
 * Compute cosine similarity between two normalized vectors.
 * Since our vectors are L2-normalized, cosine similarity = dot product.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * Destroy the pipeline and free memory.
 */
export async function unloadModel(): Promise<void> {
  if (pipeline) {
    // Transformers.js doesn't have an explicit dispose, but we can null it
    pipeline = null;
    loadingPromise = null;
  }
}
