/**
 * Finding the `File` record for an S3 object key.
 *
 * The upload pipeline is driven by S3 events, which carry only the object key,
 * so every stage has to turn that key back into a File. This was written as
 * `listFiles(filter: {path: {eq: key}}, limit: 1)`, but DynamoDB applies
 * `limit` to the rows *scanned* before the filter, not the rows returned: that
 * query reads one arbitrary row, filters it away and reports no match, so
 * thumbnails and image variants were never produced.
 *
 * The `byPath` index makes this a keyed read instead. The fallback still pages
 * through the whole table so a file is found even before the index backfills.
 */

/** The File fields every stage of the pipeline needs. */
export const FILE_FIELDS = /* GraphQL */ `
  id
  _version
  _lastChangedAt
  _deleted
  path
  mimeType
  name
  identityId
  owner
`;

/** Keyed read on the `byPath` index. */
export const LIST_FILES_BY_PATH_INDEX = /* GraphQL */ `
  query ListFileByPath($path: String!, $nextToken: String) {
    listFileByPath(path: $path, limit: 100, nextToken: $nextToken) {
      items {
        ${FILE_FIELDS}
      }
      nextToken
    }
  }
`;

/**
 * Filtered scan, used only if the index is not available yet. Pages through
 * every record rather than stopping at the first page, so the file is found
 * wherever it sits in the table.
 */
export const LIST_FILES_BY_PATH_SCAN = /* GraphQL */ `
  query ListFiles($filter: ModelFileFilterInput, $nextToken: String) {
    listFiles(filter: $filter, limit: 1000, nextToken: $nextToken) {
      items {
        ${FILE_FIELDS}
      }
      nextToken
    }
  }
`;

interface GraphQLClient {
  // The generated client types `graphql()` as returning either a promise or a
  // subscription Observable. These are queries, so the result is awaited.
  graphql: (options: { query: string; variables?: Record<string, unknown> }) => any;
}

/** A live record, ignoring anything already in the recycle bin. */
const live = (items: any[] | undefined): any =>
  (items ?? []).find((item) => item && !item._deleted) ?? null;

/**
 * The File stored at an S3 key, or null when there is none.
 *
 * Tries the index first and falls back to a full paged scan, so a newly added
 * index cannot make previously uploaded files unreachable.
 */
export async function findFileByPath(
  client: GraphQLClient,
  key: string,
  log: (message: string) => void = () => {},
): Promise<any | null> {
  let nextToken: string | undefined;
  do {
    const response = await Promise.resolve(
      client.graphql({ query: LIST_FILES_BY_PATH_INDEX, variables: { path: key, nextToken } }),
    ).catch((error: unknown) => {
      log(`[findFileByPath] byPath index unavailable: ${String(error)}`);
      return null;
    });
    if (!response) break;
    if (response.errors?.length) {
      log(`[findFileByPath] byPath index error: ${JSON.stringify(response.errors)}`);
      break;
    }
    const page = response.data?.listFileByPath;
    const found = live(page?.items);
    if (found) return found;
    nextToken = page?.nextToken ?? undefined;
  } while (nextToken);

  nextToken = undefined;
  do {
    const { data, errors } = (await client.graphql({
      query: LIST_FILES_BY_PATH_SCAN,
      variables: { filter: { path: { eq: key } }, nextToken },
    })) as any;
    if (errors?.length) {
      log(`[findFileByPath] scan error: ${JSON.stringify(errors)}`);
      return null;
    }
    const found = live(data?.listFiles?.items);
    if (found) return found;
    nextToken = data?.listFiles?.nextToken ?? undefined;
  } while (nextToken);

  return null;
}
