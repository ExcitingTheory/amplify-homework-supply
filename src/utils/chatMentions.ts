/**
 * Chat mention parsing and resolution utilities.
 *
 * Handles:
 * - @kai — AI bot trigger
 * - @"Display Name" — user with spaces in name
 * - @username — simple user mention
 * - #topic — topic reference (for auto-linking)
 *
 * @module chatMentions
 */

// ============================================================================
// Types
// ============================================================================

export interface MentionToken {
  type: "user" | "bot" | "topic";
  raw: string;
  value: string;
  startIndex: number;
  endIndex: number;
}

export interface MemberInfo {
  username: string;
  displayName: string;
}

export interface ParsedContent {
  text: string;
  mentions: MentionToken[];
  hasBotMention: boolean;
}

// ============================================================================
// Parsing
// ============================================================================

const MENTION_REGEX = /@"([^"]+)"|@(\w[\w.-]*)/g;
const TOPIC_REGEX = /#([\w-]+)/g;
const BOT_NAME = "kai";

/**
 * Parse message content and extract all mention tokens.
 */
export function parseContent(content: string): ParsedContent {
  const mentions: MentionToken[] = [];
  let hasBotMention = false;

  // Parse @mentions
  let match: RegExpExecArray | null;
  MENTION_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(content)) !== null) {
    const value = match[1] || match[2]; // Quoted name or plain username
    const isBotMention = value.toLowerCase() === BOT_NAME;

    if (isBotMention) {
      hasBotMention = true;
    }

    mentions.push({
      type: isBotMention ? "bot" : "user",
      raw: match[0],
      value,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // Parse #topics
  TOPIC_REGEX.lastIndex = 0;
  while ((match = TOPIC_REGEX.exec(content)) !== null) {
    mentions.push({
      type: "topic",
      raw: match[0],
      value: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // Sort by position
  mentions.sort((a, b) => a.startIndex - b.startIndex);

  return { text: content, mentions, hasBotMention };
}

/**
 * Extract the question/prompt directed at @kai from a message.
 * Strips the @kai mention and returns the remaining content.
 */
export function extractBotPrompt(content: string): string {
  return content.replace(/@kai\b/gi, "").trim();
}

// ============================================================================
// Autocomplete
// ============================================================================

/**
 * Build autocomplete suggestions from a list of members.
 *
 * Filters members whose displayName or username matches the query prefix.
 * Always includes @kai as the first suggestion when query matches.
 */
export function getAutocompleteSuggestions(
  query: string,
  members: MemberInfo[],
  maxResults: number = 8,
): Array<{ label: string; value: string; type: "bot" | "user" }> {
  const lowerQuery = query.toLowerCase();
  const suggestions: Array<{
    label: string;
    value: string;
    type: "bot" | "user";
  }> = [];

  // Check if @kai matches
  if (BOT_NAME.startsWith(lowerQuery) || lowerQuery === "") {
    suggestions.push({
      label: "Kai (AI Assistant)",
      value: "@kai",
      type: "bot",
    });
  }

  // Filter members
  for (const member of members) {
    if (suggestions.length >= maxResults) break;

    const matchesUsername = member.username
      .toLowerCase()
      .startsWith(lowerQuery);
    const matchesDisplay = member.displayName
      .toLowerCase()
      .startsWith(lowerQuery);

    if (matchesUsername || matchesDisplay) {
      const hasSpaces = member.displayName.includes(" ");
      suggestions.push({
        label: member.displayName,
        value: hasSpaces ? `@"${member.displayName}"` : `@${member.username}`,
        type: "user",
      });
    }
  }

  return suggestions;
}

/**
 * Resolve mention values to member info.
 * Returns the list of mentioned members (excluding bot).
 */
export function resolveMentions(
  mentions: MentionToken[],
  members: MemberInfo[],
): MemberInfo[] {
  const resolved: MemberInfo[] = [];

  for (const mention of mentions) {
    if (mention.type !== "user") continue;

    const found = members.find(
      (m) =>
        m.username.toLowerCase() === mention.value.toLowerCase() ||
        m.displayName.toLowerCase() === mention.value.toLowerCase(),
    );

    if (found && !resolved.some((r) => r.username === found.username)) {
      resolved.push(found);
    }
  }

  return resolved;
}
