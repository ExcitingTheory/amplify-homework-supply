/**
 * @fileoverview Take versioning utilities for RecordingStudio3
 *
 * Helpers for building versioned S3 keys, parsing version numbers from keys,
 * and listing all versions of a take slot via Amplify Storage.
 */

import { list } from 'aws-amplify/storage';

/**
 * Build a versioned S3 key for a take upload.
 *
 * Format: `protected/{identityId}/takes/{dialogueId}-{slotId}_{version}.{ext}`
 */
export function buildVersionedKey(
  identityId: string,
  dialogueId: string | number,
  slotId: string,
  version: number,
  ext: string,
): string {
  return `protected/${identityId}/takes/${dialogueId}-${slotId}_${version}.${ext}`;
}

/**
 * Parse the version number from a versioned S3 key.
 *
 * Given `protected/.../takes/1-f3a2c8_3.webm`, returns `3`.
 * Returns `null` if the key doesn't match the expected pattern.
 */
export function parseVersionFromKey(key: string): number | null {
  const filename = key.split('/').pop();
  if (!filename) return null;

  // Match `_{digits}.{ext}` at the end
  const match = filename.match(/_(\d+)\.[^.]+$/);
  if (!match) return null;

  const version = parseInt(match[1], 10);
  return isNaN(version) ? null : version;
}

export interface TakeVersion {
  version: number;
  key: string;
  lastModified?: Date;
  size?: number;
}

/**
 * List all versions of a take slot by querying S3 with a prefix.
 *
 * Returns versions sorted ascending (oldest first).
 * Lazy-loaded — should only be called when the user opens the history dropdown.
 */
export async function listTakeVersions(
  identityId: string,
  dialogueId: string | number,
  slotId: string,
): Promise<TakeVersion[]> {
  const prefix = `protected/${identityId}/takes/${dialogueId}-${slotId}_`;

  const { items } = await list({
    path: prefix,
    options: { listAll: true },
  });

  const versions: TakeVersion[] = [];

  for (const item of items) {
    const version = parseVersionFromKey(item.path);
    if (version !== null) {
      versions.push({
        version,
        key: item.path,
        lastModified: item.lastModified,
        size: item.size,
      });
    }
  }

  // Sort ascending by version number
  versions.sort((a, b) => a.version - b.version);

  return versions;
}
