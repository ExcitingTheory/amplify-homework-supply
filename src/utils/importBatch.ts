/**
 * Shared batching for importing extracted entries into Words and Questions.
 *
 * Both importers used to issue a filtered `list` per entry to find an existing
 * record and again to find an existing unit link. Those are table scans, run
 * one after another, so a 45-entry import spent minutes waiting on the network.
 * The lookups are loaded once here instead, the same way document links already
 * are, and the remaining writes run a few at a time.
 */

/** A page of a Data Client `list` call. */
interface ListPage<T> {
  data?: T[] | null;
  nextToken?: string | null;
  errors?: Array<{ message: string }> | null;
}

/** Every page of a list query, not just the first. */
export async function collectAll<T>(
  run: (nextToken?: string) => Promise<ListPage<T>>,
  what = "list records",
): Promise<T[]> {
  const items: T[] = [];
  let nextToken: string | undefined;
  do {
    const page = await run(nextToken);
    if (page?.errors?.length) {
      throw new Error(`Could not ${what}: ${page.errors.map((e) => e.message).join("; ")}`);
    }
    for (const item of page?.data ?? []) if (item != null) items.push(item);
    nextToken = page?.nextToken ?? undefined;
  } while (nextToken);
  return items;
}

/**
 * Runs `task` over `items` a few at a time, keeping results in input order.
 *
 * Imports are mostly network latency, so running strictly one at a time wastes
 * most of the wall clock. The limit keeps the request rate low enough not to
 * trade that for throttling.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    async () => {
      while (true) {
        const index = next++;
        if (index >= items.length) return;
        results[index] = await task(items[index], index);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

/** The key an entry is matched on: trimmed, lowercased, whitespace collapsed. */
export function matchKey(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * How many entries are imported at once. Imports are almost entirely network
 * latency, so a few in flight is far faster than one at a time, while staying
 * low enough not to be throttled.
 */
export const IMPORT_CONCURRENCY = 5;

/**
 * Existing records whose `field` is one of `values`, in as few queries as the
 * filter size allows rather than one per value.
 *
 * Scoped to the values being imported, so a large dictionary is never loaded in
 * full just to import a handful of entries.
 */
export async function findExistingByField<T extends Record<string, any>>(
  model: { list: (input: any) => Promise<ListPage<T>> },
  field: string,
  values: readonly string[],
  { batchSize = 20, concurrency = 4 } = {},
): Promise<Map<string, T>> {
  const wanted = [...new Set(values.map((value) => (value ?? "").trim()).filter(Boolean))];
  const batches: string[][] = [];
  for (let i = 0; i < wanted.length; i += batchSize) {
    batches.push(wanted.slice(i, i + batchSize));
  }

  const pages = await mapWithConcurrency(batches, concurrency, (batch) =>
    collectAll<T>(
      (nextToken) =>
        model.list({
          filter: { or: batch.map((value) => ({ [field]: { eq: value } })) },
          nextToken,
        }),
      `look up existing ${field} values`,
    ),
  );

  const byKey = new Map<string, T>();
  for (const record of pages.flat()) {
    const key = matchKey(record?.[field]);
    // First match wins, so a repeated run keeps using the same record.
    if (key && !byKey.has(key)) byKey.set(key, record);
  }
  return byKey;
}

/**
 * The ids already linked to a unit, from one query on the unit rather than one
 * per entry.
 */
export async function listUnitLinkIds(
  model: { list: (input: any) => Promise<ListPage<Record<string, any>>> },
  unitField: string,
  unitId: string,
  itemField: string,
): Promise<Map<string, Record<string, any>>> {
  const links = await collectAll<Record<string, any>>(
    (nextToken) => model.list({ filter: { [unitField]: { eq: unitId } }, nextToken }),
    "list unit links",
  );
  const byItem = new Map<string, Record<string, any>>();
  for (const link of links) {
    const itemId = link?.[itemField];
    if (itemId && !link._deleted) byItem.set(itemId, link);
  }
  return byItem;
}

/**
 * Runs `create` once per key, even when several entries resolve to the same
 * one at the same time.
 *
 * Running entries in parallel removes the ordering that previously stopped two
 * identical words from each creating a record, so callers share the first
 * in-flight create instead.
 */
export function singleFlight<T>() {
  const inFlight = new Map<string, Promise<T>>();
  return (key: string, create: () => Promise<T>): Promise<T> => {
    const existing = inFlight.get(key);
    if (existing) return existing;
    const started = create();
    inFlight.set(key, started);
    return started;
  };
}
