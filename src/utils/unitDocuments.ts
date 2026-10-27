import { collectPages } from "./parsedContentChunks";

type DataClient = { models: Record<string, any> };

export interface UnitDocumentOption {
  id: string;
  filename: string;
}

function assertNoErrors(result: { errors?: ReadonlyArray<{ message?: string }> | null }) {
  if (result?.errors?.length) {
    throw new Error(`Could not list UnitDocument: ${result.errors.map((error) => error.message).join("; ")}`);
  }
}

/**
 * The documents attached to a unit, for choosing which to practice from.
 * Uses the unit's relationship, which is indexed, rather than a filtered scan.
 * Documents in the recycle bin are left out.
 */
export async function listUnitDocuments(
  client: DataClient,
  unitId: string,
): Promise<UnitDocumentOption[]> {
  const unit = (await client.models.Unit.get({ id: unitId })).data;
  const relation = unit?.unitDocuments;

  let links: Array<{ documentID?: string | null; deletedAt?: string | null; _deleted?: boolean | null }>;
  if (typeof relation === "function") {
    links = await collectPages(async (nextToken) => {
      const page = await relation({ limit: 100, nextToken });
      assertNoErrors(page);
      return page;
    });
  } else if (Array.isArray(relation)) {
    links = relation.filter(Boolean);
  } else {
    // A client without relationship loaders (test doubles).
    links = await collectPages(async (nextToken) => {
      const page = await client.models.UnitDocument.list({
        filter: { unitID: { eq: unitId } },
        nextToken,
      });
      assertNoErrors(page);
      return page;
    });
  }

  const ids = [
    ...new Set(
      links
        .filter((link) => !link.deletedAt && link._deleted !== true)
        .map((link) => link.documentID)
        .filter((id): id is string => !!id),
    ),
  ];

  const documents = await Promise.all(
    ids.map(async (id) => (await client.models.Document.get({ id })).data),
  );
  return documents
    .filter((document) => document && !document.deletedAt && document._deleted !== true)
    .map((document) => ({ id: document.id as string, filename: (document.filename as string) || "document" }));
}
