interface GraphQLErrorLike {
  message?: unknown;
  errorType?: unknown;
  path?: unknown;
}

/**
 * Amplify's `client.graphql` rejects with a `{ data, errors }` object rather
 * than an Error, so Lambda reports it as "[object Object]". Convert any
 * rejection into an Error that carries the GraphQL messages.
 */
export function describeGraphQLError(error: unknown): Error {
  if (error instanceof Error) return error;

  const errors =
    error !== null && typeof error === "object"
      ? (error as { errors?: unknown }).errors
      : undefined;
  if (Array.isArray(errors) && errors.length > 0) {
    const details = errors
      .map((item: GraphQLErrorLike) => {
        const type = typeof item?.errorType === "string" ? `${item.errorType}: ` : "";
        const path = Array.isArray(item?.path) ? ` (at ${item.path.join(".")})` : "";
        return `${type}${typeof item?.message === "string" ? item.message : JSON.stringify(item)}${path}`;
      })
      .join("; ");
    return new Error(`GraphQL request failed: ${details}`, { cause: error });
  }

  let serialised: string;
  try {
    serialised = JSON.stringify(error) ?? String(error);
  } catch {
    serialised = String(error);
  }
  return new Error(`GraphQL request failed: ${serialised.slice(0, 500)}`, {
    cause: error,
  });
}
