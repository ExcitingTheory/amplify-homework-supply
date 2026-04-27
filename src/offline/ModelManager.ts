/**
 * ModelManager — Manages download, storage, and lifecycle of on-device AI models.
 *
 * Handles storage budget checks, download progress, and cleanup for
 * the WebLLM model cache. Chrome Built-in AI requires no management
 * as the model is pre-installed.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StorageBudget {
  /** Bytes currently used by the origin */
  used: number;
  /** Bytes available to the origin */
  quota: number;
  /** Percentage used (0–100) */
  percentUsed: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  sizeBytes: number;
  backend: 'chrome-ai' | 'webllm';
  ready: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WEBLLM_MODEL_ID = 'Phi-3.5-mini-instruct-q4f16_1-MLC';
const WEBLLM_MODEL_SIZE_BYTES = 2.4 * 1024 * 1024 * 1024; // ~2.4 GB

// ── Implementation ────────────────────────────────────────────────────────────

/**
 * Get the current storage budget for this origin.
 */
export async function getStorageBudget(): Promise<StorageBudget> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return { used: 0, quota: 0, percentUsed: 0 };
  }
  const est = await navigator.storage.estimate();
  const used = est.usage ?? 0;
  const quota = est.quota ?? 0;
  return {
    used,
    quota,
    percentUsed: quota > 0 ? Math.round((used / quota) * 100) : 0,
  };
}

/**
 * Check if the WebLLM model is already cached and ready.
 */
export async function isWebLLMModelReady(): Promise<boolean> {
  try {
    // WebLLM stores models in Cache API under 'webllm/model'
    const cacheNames = await caches.keys();
    return cacheNames.some((name) => name.includes('webllm') || name.includes('mlc'));
  } catch {
    return false;
  }
}

/**
 * Get info about available AI models.
 */
export async function getAvailableModels(): Promise<ModelInfo[]> {
  const models: ModelInfo[] = [];

  // Chrome Built-in AI
  if (typeof window !== 'undefined' && window.ai?.languageModel) {
    try {
      const status = await window.ai.languageModel.canCreate();
      models.push({
        id: 'chrome-gemini-nano',
        name: 'Gemini Nano (Built-in)',
        sizeBytes: 0,
        backend: 'chrome-ai',
        ready: status === 'readily',
      });
    } catch {
      // Not available
    }
  }

  // WebLLM
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    const ready = await isWebLLMModelReady();
    models.push({
      id: WEBLLM_MODEL_ID,
      name: 'Phi-3.5 Mini (WebLLM)',
      sizeBytes: WEBLLM_MODEL_SIZE_BYTES,
      backend: 'webllm',
      ready,
    });
  }

  return models;
}

/**
 * Download the WebLLM model for offline use.
 * This triggers the model download and caching via WebLLM's built-in mechanism.
 *
 * @param onProgress — callback with download progress (0–100)
 * @returns true if download succeeded
 */
export async function downloadWebLLMModel(
  onProgress?: (percent: number) => void,
): Promise<boolean> {
  // Check storage budget first
  const budget = await getStorageBudget();
  const availableBytes = budget.quota - budget.used;

  if (availableBytes < WEBLLM_MODEL_SIZE_BYTES) {
    throw new Error(
      `Insufficient storage. Need ${formatBytes(WEBLLM_MODEL_SIZE_BYTES)} but only ${formatBytes(availableBytes)} available.`,
    );
  }

  try {
    const { CreateMLCEngine } = await import(/* @vite-ignore */ '@mlc-ai/web-llm');
    const engine = await CreateMLCEngine(WEBLLM_MODEL_ID, {
      initProgressCallback: (report: { progress: number; text?: string }) => {
        onProgress?.(Math.round(report.progress * 100));
      },
    });
    // Engine created successfully — model is now cached
    // We don't keep the engine running, just wanted to trigger the download
    await engine.unload();
    return true;
  } catch (err) {
    console.error('[ModelManager] WebLLM download failed:', err);
    return false;
  }
}

/**
 * Delete the cached WebLLM model to free storage.
 */
export async function deleteWebLLMModel(): Promise<void> {
  const cacheNames = await caches.keys();
  for (const name of cacheNames) {
    if (name.includes('webllm') || name.includes('mlc')) {
      await caches.delete(name);
    }
  }
}

/**
 * Format bytes as a human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
