"use server";

/**
 * Content Moderation Server Action
 *
 * Replaces the moderation Lambda's moderateContent operation.
 * Calls OpenAI's omni-moderation-latest model directly.
 *
 * NOTE: This does NOT write moderation results back to DynamoDB records
 * (the Lambda's server-authoritative write via IAM). If that behavior is
 * needed, extend this action with getServerClient() to update the record.
 */

export async function moderateContent(params: {
  content: string;
}): Promise<{
  flagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
  model: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "omni-moderation-latest",
      input: params.content,
    }),
  });

  if (!response.ok) {
    throw new Error(`Moderation API error: ${response.statusText}`);
  }

  const data = await response.json();
  const result = data.results[0];

  return {
    flagged: result.flagged,
    categories: result.categories,
    categoryScores: result.category_scores,
    model: data.model,
  };
}

/**
 * Moderate an image by URL using OpenAI's multi-modal moderation.
 */
export async function moderateImage(params: {
  imageUrl: string;
}): Promise<{
  flagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
  model: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "omni-moderation-latest",
      input: [{ type: "image_url", image_url: { url: params.imageUrl } }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Moderation API error: ${response.statusText}`);
  }

  const data = await response.json();
  const result = data.results[0];

  return {
    flagged: result.flagged,
    categories: result.categories,
    categoryScores: result.category_scores,
    model: data.model,
  };
}
