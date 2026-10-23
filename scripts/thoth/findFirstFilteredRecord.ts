interface FilteredPage<T> {
  data: readonly (T | null)[];
  errors?: readonly unknown[];
  nextToken?: string | null;
}

export async function findFirstFilteredRecord<T>(
  fetchPage: (nextToken: string | undefined) => Promise<FilteredPage<T>>,
  label: string,
): Promise<T | undefined> {
  let nextToken: string | undefined;
  const seenTokens = new Set<string>();
  do {
    const page = await fetchPage(nextToken);
    if (page.errors?.length) {
      throw new Error(`Failed to fetch ${label}: ${JSON.stringify(page.errors)}`);
    }
    const record = page.data.find((item) => item !== null);
    if (record !== undefined) return record;
    nextToken = page.nextToken ?? undefined;
    if (nextToken) {
      if (seenTokens.has(nextToken)) {
        throw new Error(`Repeated pagination token while fetching ${label}`);
      }
      seenTokens.add(nextToken);
    }
  } while (nextToken);
  return undefined;
}
