/**
 * ChatCollaborationProvider — Specialized Yjs provider for collaborative chat rooms.
 *
 * Supports two room types:
 * - Section chat (`chat-section-{sectionId}`) — shared by all section members,
 *   with topics scoped to section/unit/workbook contexts
 * - Squad chat (`chat-squad-{squadId}`) — squad members only
 *
 * Y.Doc structure:
 * - `meta` Y.Map — room metadata (name, type, createdAt)
 * - `topics` Y.Map — topic objects keyed by topicId
 * - `threads` Y.Map — each key is a topicId, value references a Y.Array of messages
 * - Awareness — online/typing presence
 *
 * @module ChatCollaborationProvider
 */

import * as Y from "yjs";
import { YjsDocProvider, YjsProviderConfig } from "./YjsProvider";

// ============================================================================
// Types
// ============================================================================

export type ChatRoomType = "section" | "squad";

export type TopicScope =
  | "section"
  | "squad"
  | `unit:${string}`
  | `workbook:${string}`;

export interface ChatUser {
  username: string;
  displayName: string;
  role?: string;
  color?: string;
}

export interface ChatTopic {
  id: string;
  name: string;
  scope: TopicScope;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  pinned: boolean;
  archived: boolean;
}

export interface ChatMessage {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  content: string;
  /** Serialized Lexical JSON for rich content (quiz blocks, images, etc.) */
  contentJson?: string | null;
  mentions: string[];
  createdAt: string;
  editedAt: string | null;
  reactions: Record<string, string[]>;
  /** True while Kai is streaming a response */
  isStreaming?: boolean;
}

export interface ChatRoomConfig extends Omit<YjsProviderConfig, "docName"> {
  roomType: ChatRoomType;
  roomId: string;
  user: ChatUser;
  wsUrl?: string;
}

// ============================================================================
// Provider
// ============================================================================

export class ChatCollaborationProvider extends YjsDocProvider {
  private roomType: ChatRoomType;
  private roomId: string;
  private user: ChatUser;
  private metaMap: Y.Map<any>;
  private topicsMap: Y.Map<any>;

  constructor(config: ChatRoomConfig) {
    const docName = `chat-${config.roomType}-${config.roomId}`;

    super({
      ...config,
      docName,
    });

    this.roomType = config.roomType;
    this.roomId = config.roomId;
    this.user = config.user;

    this.metaMap = this.getMap("meta");
    this.topicsMap = this.getMap("topics");

    this.initializeAwareness();
  }

  // ========================================================================
  // Awareness
  // ========================================================================

  private initializeAwareness(): void {
    const awareness = this.getAwareness();
    awareness.setLocalState({
      user: this.user,
      typing: false,
      activeTopic: null,
    });
  }

  setTyping(typing: boolean): void {
    const awareness = this.getAwareness();
    const currentState = awareness.getLocalState();
    awareness.setLocalState({
      ...currentState,
      typing,
    });
  }

  setActiveTopic(topicId: string | null): void {
    const awareness = this.getAwareness();
    const currentState = awareness.getLocalState();
    awareness.setLocalState({
      ...currentState,
      activeTopic: topicId,
    });
  }

  // ========================================================================
  // Room Meta
  // ========================================================================

  initializeRoom(name: string): void {
    if (this.metaMap.get("createdAt")) return; // Already initialized
    this.metaMap.set("name", name);
    this.metaMap.set("roomType", this.roomType);
    this.metaMap.set("roomId", this.roomId);
    this.metaMap.set("createdAt", new Date().toISOString());
  }

  getRoomMeta(): {
    name: string;
    roomType: ChatRoomType;
    roomId: string;
    createdAt: string;
  } {
    return {
      name: this.metaMap.get("name") || "",
      roomType: this.metaMap.get("roomType") || this.roomType,
      roomId: this.metaMap.get("roomId") || this.roomId,
      createdAt: this.metaMap.get("createdAt") || "",
    };
  }

  // ========================================================================
  // Topics
  // ========================================================================

  createTopic(name: string, scope: TopicScope): ChatTopic {
    const topic: ChatTopic = {
      id: crypto.randomUUID(),
      name: name.startsWith("#") ? name : `#${name}`,
      scope,
      createdBy: this.user.username,
      createdByName: this.user.displayName,
      createdAt: new Date().toISOString(),
      pinned: false,
      archived: false,
    };

    this.topicsMap.set(topic.id, topic);

    // Initialize the thread array for this topic
    this.getDoc().getArray<ChatMessage>(`thread-${topic.id}`);

    return topic;
  }

  getTopic(topicId: string): ChatTopic | null {
    return this.topicsMap.get(topicId) || null;
  }

  getTopics(): ChatTopic[] {
    const topics: ChatTopic[] = [];
    this.topicsMap.forEach((value) => {
      if (value && !value.archived) {
        topics.push(value);
      }
    });
    return topics;
  }

  getTopicsByScope(scope: TopicScope): ChatTopic[] {
    return this.getTopics().filter((t) => t.scope === scope);
  }

  pinTopic(topicId: string, pinned: boolean): void {
    const topic = this.topicsMap.get(topicId);
    if (topic) {
      this.topicsMap.set(topicId, { ...topic, pinned });
    }
  }

  archiveTopic(topicId: string): void {
    const topic = this.topicsMap.get(topicId);
    if (topic) {
      this.topicsMap.set(topicId, { ...topic, archived: true });
    }
  }

  // ========================================================================
  // Messages / Threads
  // ========================================================================

  getThreadArray(topicId: string): Y.Array<ChatMessage> {
    return this.getDoc().getArray<ChatMessage>(`thread-${topicId}`);
  }

  sendMessage(
    topicId: string,
    content: string,
    parentId?: string,
  ): ChatMessage {
    const mentions = extractMentions(content);

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      parentId: parentId || null,
      authorId: this.user.username,
      authorName: this.user.displayName,
      content,
      contentJson: null,
      mentions,
      createdAt: new Date().toISOString(),
      editedAt: null,
      reactions: {},
      isStreaming: false,
    };

    const threadArray = this.getThreadArray(topicId);
    threadArray.push([message]);

    return message;
  }

  editMessage(
    topicId: string,
    messageId: string,
    newContent: string,
    contentJson?: string,
  ): void {
    const threadArray = this.getThreadArray(topicId);
    const items = Array.from(threadArray);
    const index = items.findIndex((m) => m.id === messageId);

    if (index === -1) return;
    if (items[index].authorId !== this.user.username) return; // Can only edit own messages

    const updated: ChatMessage = {
      ...items[index],
      content: newContent,
      contentJson: contentJson ?? items[index].contentJson,
      mentions: extractMentions(newContent),
      editedAt: new Date().toISOString(),
    };

    this.getDoc().transact(() => {
      threadArray.delete(index, 1);
      threadArray.insert(index, [updated]);
    });
  }

  deleteMessage(topicId: string, messageId: string): void {
    const threadArray = this.getThreadArray(topicId);
    const items = Array.from(threadArray);
    const index = items.findIndex((m) => m.id === messageId);

    if (index === -1) return;
    if (items[index].authorId !== this.user.username) return; // Can only delete own messages

    threadArray.delete(index, 1);
  }

  addReaction(topicId: string, messageId: string, emoji: string): void {
    const threadArray = this.getThreadArray(topicId);
    const items = Array.from(threadArray);
    const index = items.findIndex((m) => m.id === messageId);

    if (index === -1) return;

    const message = items[index];
    const reactions = { ...message.reactions };
    const users = reactions[emoji] || [];

    if (users.includes(this.user.username)) {
      // Remove reaction
      reactions[emoji] = users.filter((u) => u !== this.user.username);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      // Add reaction
      reactions[emoji] = [...users, this.user.username];
    }

    const updated: ChatMessage = { ...message, reactions };

    this.getDoc().transact(() => {
      threadArray.delete(index, 1);
      threadArray.insert(index, [updated]);
    });
  }

  getMessages(topicId: string): ChatMessage[] {
    return Array.from(this.getThreadArray(topicId));
  }

  getThreadReplies(topicId: string, parentId: string): ChatMessage[] {
    return this.getMessages(topicId).filter((m) => m.parentId === parentId);
  }

  getTopLevelMessages(topicId: string): ChatMessage[] {
    return this.getMessages(topicId).filter((m) => m.parentId === null);
  }

  // ========================================================================
  // Accessors
  // ========================================================================

  getMetaMap(): Y.Map<any> {
    return this.metaMap;
  }

  getTopicsMap(): Y.Map<any> {
    return this.topicsMap;
  }

  getRoomId(): string {
    return this.roomId;
  }

  getRoomType(): ChatRoomType {
    return this.roomType;
  }

  getUser(): ChatUser {
    return this.user;
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract @mentions from message content.
 * Matches @kai and @"Display Name" or @username patterns.
 */
export function extractMentions(content: string): string[] {
  const mentions: string[] = [];

  // Match @kai
  const kaiMatch = content.match(/@kai\b/gi);
  if (kaiMatch) mentions.push("@kai");

  // Match @"Name With Spaces" or @username
  const userMatches = content.matchAll(/@"([^"]+)"|@(\w+)/g);
  for (const match of userMatches) {
    const name = match[1] || match[2];
    if (name.toLowerCase() !== "kai") {
      mentions.push(`@${name}`);
    }
  }

  return [...new Set(mentions)];
}
