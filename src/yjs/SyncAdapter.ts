/**
 * SyncAdapter - Converts Yjs updates to Amplify Data Client mutations
 *
 * Bridges Yjs CRDT state with Amplify GraphQL API for persistence.
 * Uses the Amplify Gen 2 typed client for all DynamoDB operations.
 */

import * as Y from "yjs";
import { getAmplifyClient, type AmplifyClient } from "../utils/amplifyClient";

/**
 * Helper: extract _version from a versioned model record.
 * The CDK Aspect adds _version at runtime but it's not in the generated types.
 */
function getVersion(record: any): number | undefined {
  return record?._version;
}

export interface SyncAdapterConfig {
  /** Optional pre-configured client (for testing). Falls back to singleton. */
  client?: AmplifyClient;
}

export interface DocumentSnapshot {
  id: string;
  docName: string;
  snapshot: string; // base64 encoded Y.encodeState
  version: number;
  updatedAt: string;
}

export class SyncAdapter {
  private client: AmplifyClient;
  private throttleTimers: Map<string, ReturnType<typeof setTimeout>> =
    new Map();
  private static THROTTLE_MS = 5000; // 5s debounce for persistence

  constructor(config?: SyncAdapterConfig) {
    this.client = config?.client ?? getAmplifyClient();
  }

  /**
   * Save Y.Doc snapshot — encodes Yjs state and stores as base64
   * in the appropriate model based on docName prefix.
   */
  async saveSnapshot(
    docName: string,
    ydoc: Y.Doc,
    docId: string,
  ): Promise<void> {
    try {
      if (docName.startsWith("workbook-")) {
        await this.syncWorkbook(docId, ydoc);
        await this.saveComments(docId, ydoc);
      } else if (docName.startsWith("unit-")) {
        await this.syncUnit(docId, ydoc);
      } else if (docName.startsWith("chat-")) {
        await this.syncChat(docId, ydoc);
      } else {
        console.log(
          `[SyncAdapter] Unknown doc prefix for ${docName}, skipping persist`,
        );
      }
    } catch (error) {
      console.error(
        `[SyncAdapter] Error saving snapshot for ${docName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Load Y.Doc from the appropriate model. Returns encoded state or null.
   */
  async loadSnapshot(docName: string, docId: string): Promise<string | null> {
    try {
      if (docName.startsWith("workbook-")) {
        const { data } = await this.client.models.Grade.get({ id: docId });
        return data?.data ? JSON.stringify(data.data) : null;
      }
      if (docName.startsWith("unit-")) {
        const { data } = await this.client.models.Unit.get({ id: docId });
        return data?.data
          ? typeof data.data === "string"
            ? data.data
            : JSON.stringify(data.data)
          : null;
      }
      return null;
    } catch (error) {
      console.error(
        `[SyncAdapter] Error loading snapshot for ${docName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Throttled save — debounces rapid Yjs updates into a single write.
   */
  saveThrottled(docName: string, ydoc: Y.Doc, docId: string): void {
    const existing = this.throttleTimers.get(docName);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.saveSnapshot(docName, ydoc, docId).catch((err) =>
        console.error(
          `[SyncAdapter] Throttled save failed for ${docName}:`,
          err,
        ),
      );
      this.throttleTimers.delete(docName);
    }, SyncAdapter.THROTTLE_MS);

    this.throttleTimers.set(docName, timer);
  }

  /**
   * Cancel all pending throttled saves (for cleanup).
   */
  destroy(): void {
    for (const timer of this.throttleTimers.values()) {
      clearTimeout(timer);
    }
    this.throttleTimers.clear();
  }

  /**
   * Sync Unit document — persists Lexical editor content to Unit.data
   */
  async syncUnit(unitId: string, ydoc: Y.Doc): Promise<void> {
    try {
      const editorContent = ydoc.getText("editorContent").toString();

      // Fetch current _version for optimistic locking
      const { data: existing } = await this.client.models.Unit.get({
        id: unitId,
      });
      if (!existing) {
        console.warn(`[SyncAdapter] Unit ${unitId} not found, skipping sync`);
        return;
      }

      await this.client.models.Unit.update({
        id: unitId,
        data: editorContent,
        _version: getVersion(existing),
      } as any);

      console.log(
        `[SyncAdapter] Synced Unit ${unitId} (${editorContent.length} chars)`,
      );
    } catch (error) {
      console.error(`[SyncAdapter] Error syncing Unit:`, error);
      throw error;
    }
  }

  /**
   * Sync Grade document — persists block responses and feedback
   */
  async syncGrade(gradeId: string, ydoc: Y.Doc): Promise<void> {
    try {
      const gradeData = ydoc.getMap("data");
      const feedback = ydoc.getMap("feedback");

      const gradeObject: Record<string, any> = {};
      gradeData.forEach((value, key) => {
        gradeObject[key] = value;
      });

      const feedbackObject: Record<string, any> = {};
      feedback.forEach((value, key) => {
        feedbackObject[key] = value;
      });

      const { data: existing } = await this.client.models.Grade.get({
        id: gradeId,
      });
      if (!existing) {
        console.warn(`[SyncAdapter] Grade ${gradeId} not found, skipping sync`);
        return;
      }

      await this.client.models.Grade.update({
        id: gradeId,
        data: JSON.stringify(gradeObject),
        feedback: JSON.stringify(feedbackObject),
        _version: getVersion(existing),
      } as any);

      console.log(
        `[SyncAdapter] Synced Grade ${gradeId} (${Object.keys(gradeObject).length} blocks)`,
      );
    } catch (error) {
      console.error(`[SyncAdapter] Error syncing Grade:`, error);
      throw error;
    }
  }

  /**
   * Sync Chat document — persists chat messages to AssistantChat model
   */
  async syncChat(chatId: string, ydoc: Y.Doc): Promise<void> {
    try {
      const messages = ydoc.getArray("chatMessages");
      const messageArray = Array.from(messages);

      const { data: existing } = await this.client.models.AssistantChat.get({
        id: chatId,
      });
      if (!existing) {
        console.warn(
          `[SyncAdapter] AssistantChat ${chatId} not found, skipping sync`,
        );
        return;
      }

      await this.client.models.AssistantChat.update({
        id: chatId,
        messages: JSON.stringify(messageArray),
        _version: getVersion(existing),
      } as any);

      console.log(
        `[SyncAdapter] Synced Chat ${chatId} (${messageArray.length} messages)`,
      );
    } catch (error) {
      console.error(`[SyncAdapter] Error syncing Chat:`, error);
      throw error;
    }
  }

  /**
   * Sync Question document
   */
  async syncQuestion(questionId: string, ydoc: Y.Doc): Promise<void> {
    try {
      const questionData = ydoc.getMap("questions");

      const questions: Record<string, any> = {};
      questionData.forEach((value, key) => {
        questions[key] = value;
      });

      const { data: existing } = await this.client.models.Question.get({
        id: questionId,
      });
      if (!existing) {
        console.warn(
          `[SyncAdapter] Question ${questionId} not found, skipping sync`,
        );
        return;
      }

      await this.client.models.Question.update({
        id: questionId,
        data: JSON.stringify(questions),
        _version: getVersion(existing),
      } as any);

      console.log(
        `[SyncAdapter] Synced Question ${questionId} (${Object.keys(questions).length} entries)`,
      );
    } catch (error) {
      console.error(`[SyncAdapter] Error syncing Question:`, error);
      throw error;
    }
  }

  /**
   * Sync ParsedContent document
   */
  async syncParsedContent(contentId: string, ydoc: Y.Doc): Promise<void> {
    try {
      const parsedData = ydoc.getMap("parsedContent");
      const status = (parsedData.get("status") as string) || "pending";
      const progress = (parsedData.get("progress") as string) || "0%";

      const vocabulary = parsedData.get("vocabularyJSON") || [];
      const summaries = parsedData.get("summariesJSON") || [];
      const concepts = parsedData.get("conceptsJSON") || [];
      const questions = parsedData.get("questionsJSON") || [];

      const { data: existing } = await this.client.models.ParsedContent.get({
        id: contentId,
      });
      if (!existing) {
        console.warn(
          `[SyncAdapter] ParsedContent ${contentId} not found, skipping sync`,
        );
        return;
      }

      await this.client.models.ParsedContent.update({
        id: contentId,
        status,
        progress,
        vocabularyJSON: JSON.stringify(vocabulary),
        summariesJSON: JSON.stringify(summaries),
        conceptsJSON: JSON.stringify(concepts),
        questionsJSON: JSON.stringify(questions),
        _version: getVersion(existing),
      } as any);

      console.log(
        `[SyncAdapter] Synced ParsedContent ${contentId} (${status})`,
      );
    } catch (error) {
      console.error(`[SyncAdapter] Error syncing ParsedContent:`, error);
      throw error;
    }
  }

  /**
   * Sync Workbook (Grade) document for collaborative student-tutor editing.
   * Calculates completion/accuracy from block data and persists to Grade model.
   */
  async syncWorkbook(gradeId: string, ydoc: Y.Doc): Promise<void> {
    try {
      const workbookData = ydoc.getMap("workbookData");
      const feedbackData = ydoc.getMap("feedback");

      const workbookObject: Record<string, any> = {};
      workbookData.forEach((value, key) => {
        workbookObject[key] = value;
      });

      const feedbackObject: Record<string, any> = {};
      feedbackData.forEach((value, key) => {
        feedbackObject[key] = value;
      });

      // Calculate completion and accuracy
      const blockIds = Object.keys(workbookObject);
      const completedBlocks = blockIds.filter(
        (id) => workbookObject[id].complete === true,
      );
      const percentComplete =
        blockIds.length > 0
          ? Math.round((completedBlocks.length / blockIds.length) * 100)
          : 0;

      const accuracies = blockIds
        .map((id) => workbookObject[id].accuracy)
        .filter((acc): acc is number => typeof acc === "number");

      const accuracy =
        accuracies.length > 0
          ? Math.round(
              accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length,
            )
          : 0;

      const { data: existing } = await this.client.models.Grade.get({
        id: gradeId,
      });
      if (!existing) {
        console.warn(
          `[SyncAdapter] Grade ${gradeId} not found, skipping workbook sync`,
        );
        return;
      }

      await this.client.models.Grade.update({
        id: gradeId,
        data: JSON.stringify(workbookObject),
        feedback: JSON.stringify(feedbackObject),
        percentComplete,
        accuracy,
        complete: percentComplete === 100,
        _version: getVersion(existing),
      } as any);

      console.log(
        `[SyncAdapter] Synced Workbook ${gradeId} (${completedBlocks.length}/${blockIds.length} blocks, ${accuracy}% accuracy)`,
      );
    } catch (error) {
      console.error(`[SyncAdapter] Error syncing Workbook:`, error);
      throw error;
    }
  }

  /**
   * Load workbook data from Grade into Y.Doc.
   * Initializes a collaborative workbook session from existing Grade data.
   */
  async loadWorkbook(gradeId: string, ydoc: Y.Doc): Promise<void> {
    try {
      const { data: grade } = await this.client.models.Grade.get({
        id: gradeId,
      });
      if (!grade?.data) {
        console.log(`[SyncAdapter] No existing data for workbook ${gradeId}`);
        return;
      }

      const gradeDataJson =
        typeof grade.data === "string"
          ? grade.data
          : JSON.stringify(grade.data);
      const gradeData = JSON.parse(gradeDataJson);

      const workbookData = ydoc.getMap("workbookData");
      Object.entries(gradeData).forEach(([blockId, blockData]) => {
        workbookData.set(blockId, blockData);
      });

      // Load feedback if available
      if (grade.feedback) {
        const feedbackJson =
          typeof grade.feedback === "string"
            ? grade.feedback
            : JSON.stringify(grade.feedback);
        const feedbackData = JSON.parse(feedbackJson);
        const feedbackMap = ydoc.getMap("feedback");
        Object.entries(feedbackData).forEach(([blockId, fb]) => {
          feedbackMap.set(blockId, fb);
        });
      }

      console.log(
        `[SyncAdapter] Loaded ${Object.keys(gradeData).length} blocks into workbook ${gradeId}`,
      );
    } catch (error) {
      console.error(`[SyncAdapter] Error loading workbook:`, error);
      throw error;
    }
  }

  /**
   * Save comment threads from Yjs commentsMap to DynamoDB WorkbookComment model.
   * Creates or updates WorkbookComment records for each thread.
   */
  async saveComments(gradeId: string, ydoc: Y.Doc): Promise<void> {
    try {
      const commentsMap = ydoc.getMap("comments");
      const threads: Record<string, any> = {};
      commentsMap.forEach((value, key) => {
        threads[key] = value;
      });

      if (Object.keys(threads).length === 0) {
        console.log(`[SyncAdapter] No comments to save for ${gradeId}`);
        return;
      }

      // Load existing comments to determine creates vs updates
      const { data: existingResult } =
        await this.client.models.WorkbookComment.listWorkbookCommentByGradeIdAndBlockId(
          {
            gradeId,
          },
        );
      const existingByThread = new Map<string, any>(
        (existingResult ?? []).map((c: any) => [c.threadId, c]),
      );

      for (const [key, thread] of Object.entries(threads)) {
        const threadData = thread as any;
        const existing = existingByThread.get(threadData.id || key);

        if (existing) {
          await this.client.models.WorkbookComment.update({
            id: existing.id,
            content: threadData.content || threadData.text || "",
            resolved: threadData.resolved ?? false,
            replies: threadData.replies
              ? JSON.stringify(threadData.replies)
              : null,
            _version: getVersion(existing),
          } as any);
        } else {
          await this.client.models.WorkbookComment.create({
            gradeId,
            blockId: threadData.blockId || key.split("-")[0] || "unknown",
            threadId: threadData.id || key,
            content: threadData.content || threadData.text || "",
            resolved: threadData.resolved ?? false,
            replies: threadData.replies
              ? JSON.stringify(threadData.replies)
              : null,
          } as any);
        }
      }

      console.log(
        `[SyncAdapter] Saved ${Object.keys(threads).length} comment threads for ${gradeId}`,
      );
    } catch (error) {
      console.error(`[SyncAdapter] Error saving comments:`, error);
      throw error;
    }
  }

  /**
   * Load comments from DynamoDB into Yjs commentsMap.
   * Hydrates a collaborative session with persisted comment threads.
   */
  async loadComments(gradeId: string, ydoc: Y.Doc): Promise<void> {
    try {
      const { data: comments } =
        await this.client.models.WorkbookComment.listWorkbookCommentByGradeIdAndBlockId(
          {
            gradeId,
          },
        );

      if (!comments || comments.length === 0) {
        console.log(`[SyncAdapter] No persisted comments for ${gradeId}`);
        return;
      }

      const commentsMap = ydoc.getMap("comments");
      for (const comment of comments) {
        if (!comment || (comment as any)._deleted) continue;
        const key = `${comment.blockId}-${comment.threadId}`;
        commentsMap.set(key, {
          id: comment.threadId,
          blockId: comment.blockId,
          content: comment.content,
          resolved: comment.resolved ?? false,
          replies: comment.replies
            ? JSON.parse(
                typeof comment.replies === "string"
                  ? comment.replies
                  : JSON.stringify(comment.replies),
              )
            : [],
          createdAt: comment.createdAt,
        });
      }

      console.log(
        `[SyncAdapter] Loaded ${comments.length} comments into workbook ${gradeId}`,
      );
    } catch (error) {
      console.error(`[SyncAdapter] Error loading comments:`, error);
      throw error;
    }
  }
}

export default SyncAdapter;
