/**
 * Keeps one document's ParsedContent chunks current for a review screen.
 *
 * - Loads page by page: the primary chunk first (by its deterministic id), then
 *   the rest, publishing after each so the screen shows content straight away.
 *   Records with no chunk id (saved before chunking) are listed through the
 *   document relationship instead.
 * - Follows only this document's create, update and delete events.
 * - Applies a chunk only when its `_version` is newer than the one held, so
 *   duplicate and stale events do nothing and the screen is not reloaded.
 */
import {
  listParsedContentChunks,
  mergeParsedContentChunks,
  parsedContentChunkId,
  type MergedParsedContent,
  type StoredParsedContentChunk,
} from "./parsedContentChunks";

type DataClient = { models: Record<string, any> };

export type ParsedContentLoadState = "loading" | "ready" | "empty" | "error";

export interface ParsedContentSnapshot {
  documentId: string;
  parsedContent: MergedParsedContent<StoredParsedContentChunk> | null;
  document: any | null;
  state: ParsedContentLoadState;
  /** True while later chunks are still arriving. */
  loadingMore: boolean;
}

const CONTENT_FIELDS = [
  "vocabularyJSON",
  "summariesJSON",
  "objectivesJSON",
  "conceptsJSON",
  "questionsJSON",
  "pendingMediaJSON",
] as const;

/** A chunk's identity: its version, or its content when the record has none. */
function fingerprint(chunk: StoredParsedContentChunk): string {
  if (typeof chunk._version === "number") return `v${chunk._version}`;
  return JSON.stringify([
    chunk.chunkIndex,
    chunk.chunkCount,
    chunk.importedAt,
    ...CONTENT_FIELDS.map((field) => chunk[field]),
  ]);
}

/** True when `incoming` should replace `existing`. Equal or older versions do not. */
function isNewer(existing: StoredParsedContentChunk, incoming: StoredParsedContentChunk): boolean {
  if (typeof existing._version === "number" && typeof incoming._version === "number") {
    return incoming._version > existing._version;
  }
  return fingerprint(existing) !== fingerprint(incoming);
}

function documentFingerprint(document: any): string {
  if (!document) return "";
  const metadata =
    typeof document.metadata === "string" ? document.metadata : JSON.stringify(document.metadata ?? null);
  return [document._version, document.updatedAt, document.status, metadata].join("|");
}

export class ParsedContentChunkSync {
  private chunks = new Map<string, StoredParsedContentChunk>();
  private merged: MergedParsedContent<StoredParsedContentChunk> | null = null;
  private document: any = null;
  private loaded = false;
  private loadingMore = false;
  private failed = false;
  private stopped = true;
  /** Bumped by stop() and each load so a superseded load stops publishing. */
  private generation = 0;
  private unsubscribers: Array<() => void> = [];
  private snapshot: ParsedContentSnapshot;

  constructor(
    private readonly client: DataClient,
    private readonly documentId: string,
    private readonly onChange: (snapshot: ParsedContentSnapshot) => void,
  ) {
    this.snapshot = this.build();
  }

  getSnapshot(): ParsedContentSnapshot {
    return this.snapshot;
  }

  /** Subscribes, then loads, so no change is missed in between. */
  start(): void {
    this.stopped = false;
    this.subscribe();
    void this.load();
  }

  stop(): void {
    this.stopped = true;
    this.generation += 1;
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
  }

  /** Fetches every chunk again; unchanged chunks are not re-applied. */
  refresh(): Promise<void> {
    return this.load();
  }

  private subscribe(): void {
    const model = this.client.models.ParsedContent;
    const options = { filter: { documentID: { eq: this.documentId } } };
    const watch = (event: "onCreate" | "onUpdate" | "onDelete", handler: (item: any) => void) => {
      const subscription = model[event](options).subscribe({
        next: handler,
        error: (error: unknown) =>
          console.error(`[ParsedContentChunkSync] ${event} subscription error:`, error),
      });
      this.unsubscribers.push(() => subscription.unsubscribe());
    };
    watch("onCreate", (item) => this.accept(item));
    watch("onUpdate", (item) => this.accept(item));
    watch("onDelete", (item) => this.remove(item?.id));
  }

  private accept(record: StoredParsedContentChunk | null | undefined): void {
    if (this.stopped || !record?.id || record.documentID !== this.documentId) return;
    if (record._deleted === true) {
      this.remove(record.id);
      return;
    }
    const existing = this.chunks.get(record.id);
    if (existing && !isNewer(existing, record)) return;
    this.chunks.set(record.id, record);
    this.chunksChanged();
  }

  private remove(id: string | undefined): void {
    if (!this.stopped && id && this.chunks.delete(id)) this.chunksChanged();
  }

  private chunksChanged(): void {
    this.merged = mergeParsedContentChunks([...this.chunks.values()]);
    this.publish();
    // Moderation and status live on the document and change with its content.
    if (this.loaded) void this.refreshDocument();
  }

  private async refreshDocument(): Promise<void> {
    const generation = this.generation;
    try {
      const { data } = await this.client.models.Document.get({ id: this.documentId });
      if (this.stopped || generation !== this.generation) return;
      if (documentFingerprint(data) === documentFingerprint(this.document)) return;
      this.document = data;
      this.publish();
    } catch (error) {
      console.error("[ParsedContentChunkSync] Could not load the document:", error);
    }
  }

  private async load(): Promise<void> {
    this.generation += 1;
    const generation = this.generation;
    const current = () => !this.stopped && generation === this.generation;
    const model = this.client.models.ParsedContent;
    this.failed = false;

    try {
      const documentLoad = this.refreshDocument();
      const seen = new Set<string>();

      const { data: primary } = await model.get({ id: parsedContentChunkId(this.documentId, 0) });
      if (!current()) return;

      if (primary) {
        seen.add(primary.id);
        const count = typeof primary.chunkCount === "number" ? primary.chunkCount : 1;
        this.loadingMore = count > 1;
        this.accept(primary);
        for (let index = 1; index < count; index += 1) {
          const id = parsedContentChunkId(this.documentId, index);
          const { data: chunk } = await model.get({ id });
          if (!current()) return;
          if (chunk) {
            seen.add(chunk.id);
            this.accept(chunk);
          }
        }
      } else {
        // Saved before chunking, or by code that does not chunk.
        const all = await listParsedContentChunks(this.client, {
          documentId: this.documentId,
          document: this.document,
        });
        if (!current()) return;
        for (const chunk of all) {
          seen.add(chunk.id);
          this.accept(chunk);
        }
      }

      // Chunks that no longer exist on the server (a shorter re-save).
      for (const id of [...this.chunks.keys()]) {
        if (!seen.has(id)) this.remove(id);
      }
      await documentLoad;
    } catch (error) {
      if (!current()) return;
      console.error("[ParsedContentChunkSync] Could not load ParsedContent:", error);
      this.failed = true;
    }

    if (!current()) return;
    this.loaded = true;
    this.loadingMore = false;
    this.publish();
  }

  private build(): ParsedContentSnapshot {
    const hasContent = this.chunks.size > 0;
    const state: ParsedContentLoadState = hasContent
      ? "ready"
      : this.failed
        ? "error"
        : this.loaded
          ? "empty"
          : "loading";
    return {
      documentId: this.documentId,
      parsedContent: this.merged,
      document: this.document,
      state,
      loadingMore: this.loadingMore,
    };
  }

  /** Emits a new snapshot only when something a screen reads has changed. */
  private publish(): void {
    const next = this.build();
    const previous = this.snapshot;
    if (
      next.parsedContent === previous.parsedContent &&
      next.document === previous.document &&
      next.state === previous.state &&
      next.loadingMore === previous.loadingMore
    ) {
      return;
    }
    this.snapshot = next;
    this.onChange(next);
  }
}
