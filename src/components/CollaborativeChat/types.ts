/**
 * Shared types for CollaborativeChat components.
 * @module CollaborativeChat/types
 */

import type {
  ChatTopic,
  ChatMessage,
  ChatUser,
  TopicScope,
  ChatCollaborationProvider,
} from "../../yjs/ChatCollaborationProvider";

// Re-export Yjs types for convenience
export type {
  ChatTopic,
  ChatMessage,
  ChatUser,
  TopicScope,
  ChatCollaborationProvider,
};

/** Scope context derived from current page/route */
export interface ChatScopeContext {
  sectionId: string;
  unitId?: string;
  gradeId?: string;
}

/** Computed scope for topic filtering */
export function getCurrentScope(ctx: ChatScopeContext): TopicScope {
  if (ctx.gradeId) return `workbook:${ctx.gradeId}`;
  if (ctx.unitId) return `unit:${ctx.unitId}`;
  return "section";
}

/** Check if a message mentions the AI bot */
export function mentionsKai(message: ChatMessage): boolean {
  return message.mentions.some((m) => m.toLowerCase() === "@kai");
}

/** Extract the prompt for @kai from message content */
export function extractKaiPrompt(content: string): string | null {
  const match = content.match(/@kai\s+([\s\S]*)/i);
  return match ? match[1].trim() : null;
}

/** Parse @mentions from raw text (returns display names or usernames) */
export function parseMentions(text: string): string[] {
  const mentions: string[] = [];
  const regex = /@"([^"]+)"|@(\w+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    mentions.push(match[1] || match[2]);
  }
  return mentions;
}

/** Member info for @mention autocomplete */
export interface MemberInfo {
  username: string;
  displayName: string;
  online?: boolean;
}
