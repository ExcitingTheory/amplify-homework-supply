/**
 * Shared embedding constants.
 * Separated from the "use server" file because server action modules
 * can only export async functions (Turbopack requirement).
 */
export const EMBEDDING_DIMENSIONS = 512;
export const EMBEDDING_MODEL = "text-embedding-3-small";
