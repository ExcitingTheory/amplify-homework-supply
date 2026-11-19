export const MAX_SUBMISSION_KEYS_PER_REQUEST = 100;

export async function getSubmissionUrlsInBatches(
  keys: string[],
  getBatch: (keys: string[]) => Promise<Record<string, string | null>>,
): Promise<Record<string, string | null>> {
  const urls: Record<string, string | null> = {};
  for (
    let index = 0;
    index < keys.length;
    index += MAX_SUBMISSION_KEYS_PER_REQUEST
  ) {
    Object.assign(
      urls,
      await getBatch(
        keys.slice(index, index + MAX_SUBMISSION_KEYS_PER_REQUEST),
      ),
    );
  }
  return urls;
}
