interface JsonCompletionLike {
  choices: Array<{
    finish_reason?: string | null;
    message?: { content?: string | null } | null;
  }>;
}

/**
 * Parses the JSON body of a chat completion, failing with a stage-specific
 * message when the model hit its token limit or returned malformed JSON.
 * A truncated response otherwise surfaces as an opaque `JSON.parse` error.
 */
export function parseJsonCompletion<T>(
  completion: JsonCompletionLike,
  stage: string,
): T {
  const choice = completion.choices[0];
  const content = choice?.message?.content;
  if (!content) throw new Error(`${stage} returned no content`);
  if (choice?.finish_reason === "length") {
    throw new Error(
      `${stage} response was truncated by the token limit (${content.length} characters)`,
    );
  }
  try {
    return JSON.parse(content) as T;
  } catch (cause) {
    throw new Error(`${stage} returned invalid JSON`, { cause });
  }
}
