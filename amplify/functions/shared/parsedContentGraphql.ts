/**
 * GraphQL access to a document's ParsedContent chunks, for Lambdas.
 *
 * Chunks are listed through the Document or File `parsedContent` relationship,
 * which is backed by an index; a filtered `listParsedContents` would scan the
 * whole table and return partial pages.
 */
import {
  collectPages,
  type ParsedContentStore,
  type StoredParsedContentChunk,
} from "./parsedContentChunks";
import { PARSED_CONTENT_CHUNK_SELECTION } from "./parsedContentLists";

export type GraphqlRequest = (request: {
  query: string;
  variables?: Record<string, unknown>;
}) => Promise<any>;

function assertNoErrors(response: any, what: string): void {
  if (response?.errors?.length) {
    throw new Error(
      `${what}: ${response.errors.map((error: { message?: string }) => error.message).join("; ")}`,
    );
  }
}

/**
 * Every chunk of a document, or of a file's document. `selection` adds the
 * list fields the caller reads (for example VOCABULARY_SELECTION).
 */
export async function listParsedContentChunksByRelation(
  graphql: GraphqlRequest,
  parent: { type: "Document" | "File"; id: string },
  selection = "",
): Promise<StoredParsedContentChunk[]> {
  const field = parent.type === "Document" ? "getDocument" : "getFile";
  const query = /* GraphQL */ `
    query ListParsedContentChunks($id: ID!, $nextToken: String) {
      ${field}(id: $id) {
        parsedContent(limit: 100, nextToken: $nextToken) {
          items {
            id
            _version
            _deleted
            documentID
            fileID
            ${PARSED_CONTENT_CHUNK_SELECTION}
            ${selection}
          }
          nextToken
        }
      }
    }
  `;
  return collectPages<StoredParsedContentChunk>(async (nextToken) => {
    const response = await graphql({ query, variables: { id: parent.id, nextToken } });
    assertNoErrors(response, `Could not list ParsedContent for ${parent.type} ${parent.id}`);
    const connection = response.data?.[field]?.parsedContent;
    return { data: connection?.items, nextToken: connection?.nextToken };
  });
}

/** A store that writes a document's chunks with GraphQL mutations. */
export function createGraphqlParsedContentStore(
  graphql: GraphqlRequest,
  documentId: string,
  selection = "",
): ParsedContentStore {
  const mutate = async (query: string, input: Record<string, unknown>, what: string) => {
    assertNoErrors(await graphql({ query, variables: { input } }), what);
  };
  return {
    list: () =>
      listParsedContentChunksByRelation(graphql, { type: "Document", id: documentId }, selection),
    create: (input) =>
      mutate(
        /* GraphQL */ `
          mutation CreateParsedContent($input: CreateParsedContentInput!) {
            createParsedContent(input: $input) { id _version }
          }
        `,
        input,
        `Could not create ParsedContent ${input.id}`,
      ),
    update: (input) =>
      mutate(
        /* GraphQL */ `
          mutation UpdateParsedContent($input: UpdateParsedContentInput!) {
            updateParsedContent(input: $input) { id _version }
          }
        `,
        input,
        `Could not update ParsedContent ${input.id}`,
      ),
    remove: ({ id, _version }) =>
      mutate(
        /* GraphQL */ `
          mutation DeleteParsedContent($input: DeleteParsedContentInput!) {
            deleteParsedContent(input: $input) { id }
          }
        `,
        _version != null ? { id, _version } : { id },
        `Could not delete ParsedContent ${id}`,
      ),
  };
}
