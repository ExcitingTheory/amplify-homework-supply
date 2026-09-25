import type { IDBPDatabase } from "idb";

export interface TemporaryAudioTake {
  blob: Blob;
  createdAt: number;
  duration: number;
  id: string;
  mimeType: string;
  scopeKey: string;
  waveformData: number[] | null;
}

const DB_NAME = "HomeworkSupplyTemporaryAudio";
const DB_VERSION = 1;
const STORE_NAME = "takes";

let databasePromise: Promise<IDBPDatabase> | null = null;

async function getDatabase(): Promise<IDBPDatabase> {
  if (typeof window === "undefined") {
    throw new Error("Temporary audio takes are only available in the browser");
  }

  if (!databasePromise) {
    const { openDB } = await import("idb");
    databasePromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (database.objectStoreNames.contains(STORE_NAME)) return;
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("scopeKey", "scopeKey", { unique: false });
      },
    });
  }

  return databasePromise;
}

export function createTemporaryAudioTakeScope(
  gradeId?: string,
  nodeKey?: string,
): string {
  return `${gradeId || "preview"}:${nodeKey || "audio"}`;
}

export async function saveTemporaryAudioTake(
  take: TemporaryAudioTake,
): Promise<void> {
  const database = await getDatabase();
  await database.put(STORE_NAME, take);
}

export async function getTemporaryAudioTakes(
  scopeKey: string,
): Promise<TemporaryAudioTake[]> {
  const database = await getDatabase();
  const takes = await database.getAllFromIndex(
    STORE_NAME,
    "scopeKey",
    scopeKey,
  );
  return takes.sort((left, right) => left.createdAt - right.createdAt);
}

export async function deleteTemporaryAudioTake(id: string): Promise<void> {
  const database = await getDatabase();
  await database.delete(STORE_NAME, id);
}

export async function clearTemporaryAudioTakes(
  scopeKey: string,
): Promise<void> {
  const database = await getDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const index = transaction.store.index("scopeKey");
  let cursor = await index.openCursor(scopeKey);

  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await transaction.done;
}
