/**
 * Shared embedding constants.
 * Separated from the "use server" file because server action modules
 * can only export async functions (Turbopack requirement).
 *
 * Unified on MiniLM 384D for offline-compatible search.
 */
export const EMBEDDING_DIMENSIONS = 384;
export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
