export interface ParsedContentModeration {
  blocked: boolean;
  categories: string[];
  error?: string;
}

export function getParsedContentModeration(
  document: unknown,
): ParsedContentModeration {
  if (!document || typeof document !== "object") {
    return {
      blocked: true,
      categories: [],
      error: "Document moderation status is unavailable",
    };
  }

  const metadataValue = (document as { metadata?: unknown }).metadata;
  if (metadataValue == null || metadataValue === "") {
    return { blocked: false, categories: [] };
  }

  let metadata: unknown = metadataValue;
  if (typeof metadataValue === "string") {
    try {
      metadata = JSON.parse(metadataValue);
    } catch (error) {
      return {
        blocked: true,
        categories: [],
        error: `Document moderation metadata is invalid: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
  if (!metadata || typeof metadata !== "object") {
    return {
      blocked: true,
      categories: [],
      error: "Document moderation metadata is not an object",
    };
  }

  const analysis = (metadata as { analysis?: unknown }).analysis;
  if (!analysis || typeof analysis !== "object") {
    return { blocked: false, categories: [] };
  }
  const moderation = (analysis as { moderation?: unknown }).moderation;
  if (!moderation || typeof moderation !== "object") {
    return { blocked: false, categories: [] };
  }

  const categories = (moderation as { categories?: unknown }).categories;
  const flaggedCategories =
    categories && typeof categories === "object"
      ? Object.entries(categories)
          .filter(([, flagged]) => flagged === true)
          .map(([category]) => category)
      : [];
  return {
    blocked: (moderation as { flagged?: unknown }).flagged === true,
    categories: flaggedCategories,
  };
}

export async function assertParsedContentImportAllowed(
  client: {
    models: {
      Document: {
        get(input: { id: string }): Promise<{
          data: unknown;
          errors?: unknown[];
        }>;
      };
    };
  },
  parsedContent: { documentID?: string | null },
): Promise<void> {
  if (!parsedContent.documentID) {
    throw new Error("ParsedContent has no associated Document");
  }
  const { data: document, errors } = await client.models.Document.get({
    id: parsedContent.documentID,
  });
  if (errors?.length || !document) {
    throw new Error(
      `Unable to verify moderation status for Document ${parsedContent.documentID}`,
    );
  }
  const moderation = getParsedContentModeration(document);
  if (moderation.error) throw new Error(moderation.error);
  if (moderation.blocked) {
    throw new Error(
      `Document analysis is flagged for review${moderation.categories.length > 0 ? `: ${moderation.categories.join(", ")}` : ""}`,
    );
  }
}
