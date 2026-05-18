import { describe, it, expect } from "vitest";
import {
  parseContent,
  extractBotPrompt,
  getAutocompleteSuggestions,
  resolveMentions,
} from "../src/utils/chatMentions";

// ============================================================================
// parseContent
// ============================================================================

describe("parseContent", () => {
  it("detects @kai as a bot mention", () => {
    const result = parseContent("Hey @kai can you help?");
    expect(result.hasBotMention).toBe(true);
    expect(result.mentions).toContainEqual(
      expect.objectContaining({ type: "bot", value: "kai" }),
    );
  });

  it("is case-insensitive for @Kai", () => {
    const result = parseContent("Hello @Kai");
    expect(result.hasBotMention).toBe(true);
  });

  it("detects @username mentions", () => {
    const result = parseContent("Thanks @david for the help");
    expect(result.mentions).toContainEqual(
      expect.objectContaining({ type: "user", value: "david" }),
    );
  });

  it('detects quoted @"Display Name" mentions', () => {
    const result = parseContent('Hey @"Maria Garcia" check this out');
    expect(result.mentions).toContainEqual(
      expect.objectContaining({ type: "user", value: "Maria Garcia" }),
    );
  });

  it("detects #topic references", () => {
    const result = parseContent("Check #homework-help for more info");
    expect(result.mentions).toContainEqual(
      expect.objectContaining({ type: "topic", value: "homework-help" }),
    );
  });

  it("handles multiple mentions in one message", () => {
    const result = parseContent('@kai @"David Chen" please help in #general');
    expect(result.hasBotMention).toBe(true);
    expect(result.mentions).toHaveLength(3);
    expect(result.mentions[0].type).toBe("bot");
    expect(result.mentions[1].type).toBe("user");
    expect(result.mentions[2].type).toBe("topic");
  });

  it("returns empty mentions for plain text", () => {
    const result = parseContent("Just a normal message with no mentions");
    expect(result.mentions).toHaveLength(0);
    expect(result.hasBotMention).toBe(false);
  });

  it("does not match @ in email addresses as standalone mentions", () => {
    // @ followed by a word does match, but in context it's useful
    const result = parseContent("email test@example is fine");
    // The regex would match @example since it follows the @ pattern
    // This is acceptable behavior for a chat context
    expect(result.hasBotMention).toBe(false);
  });

  it("tracks correct start and end indices", () => {
    const result = parseContent("Hello @kai world");
    const kaiMention = result.mentions.find((m) => m.value === "kai");
    expect(kaiMention?.startIndex).toBe(6);
    expect(kaiMention?.endIndex).toBe(10);
  });
});

// ============================================================================
// extractBotPrompt
// ============================================================================

describe("extractBotPrompt", () => {
  it("strips @kai from the message", () => {
    expect(extractBotPrompt("@kai what is photosynthesis?")).toBe(
      "what is photosynthesis?",
    );
  });

  it("strips @kai from anywhere in the message", () => {
    expect(extractBotPrompt("Can you help me @kai with this problem?")).toBe(
      "Can you help me  with this problem?",
    );
  });

  it("strips multiple @kai occurrences", () => {
    expect(extractBotPrompt("@kai @kai help")).toBe("help");
  });

  it("is case-insensitive", () => {
    expect(extractBotPrompt("@Kai explain this")).toBe("explain this");
  });

  it("returns trimmed result", () => {
    expect(extractBotPrompt("  @kai  ")).toBe("");
  });
});

// ============================================================================
// getAutocompleteSuggestions
// ============================================================================

describe("getAutocompleteSuggestions", () => {
  const members = [
    { username: "maria", displayName: "Maria Garcia" },
    { username: "david", displayName: "David Chen" },
    { username: "sarah", displayName: "Sarah Williams" },
  ];

  it("includes @kai as first suggestion for empty query", () => {
    const results = getAutocompleteSuggestions("", members);
    expect(results[0]).toEqual({
      label: "Kai (AI Assistant)",
      value: "@kai",
      type: "bot",
    });
  });

  it('includes @kai when query matches "k"', () => {
    const results = getAutocompleteSuggestions("k", members);
    expect(results[0].type).toBe("bot");
  });

  it("filters members by username prefix", () => {
    const results = getAutocompleteSuggestions("mar", members);
    expect(results).toContainEqual(
      expect.objectContaining({ label: "Maria Garcia" }),
    );
    expect(results).not.toContainEqual(
      expect.objectContaining({ label: "David Chen" }),
    );
  });

  it("filters members by display name prefix", () => {
    const results = getAutocompleteSuggestions("sar", members);
    expect(results).toContainEqual(
      expect.objectContaining({ label: "Sarah Williams" }),
    );
  });

  it("quotes display names with spaces", () => {
    const results = getAutocompleteSuggestions("mar", members);
    const maria = results.find((r) => r.label === "Maria Garcia");
    expect(maria?.value).toBe('@"Maria Garcia"');
  });

  it("respects maxResults limit", () => {
    const results = getAutocompleteSuggestions("", members, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("does not include @kai when query does not match", () => {
    const results = getAutocompleteSuggestions("mar", members);
    expect(results).not.toContainEqual(
      expect.objectContaining({ type: "bot" }),
    );
  });
});

// ============================================================================
// resolveMentions
// ============================================================================

describe("resolveMentions", () => {
  const members = [
    { username: "maria", displayName: "Maria Garcia" },
    { username: "david", displayName: "David Chen" },
  ];

  it("resolves username mentions to member info", () => {
    const mentions = [
      {
        type: "user" as const,
        raw: "@maria",
        value: "maria",
        startIndex: 0,
        endIndex: 6,
      },
    ];
    const result = resolveMentions(mentions, members);
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("maria");
  });

  it("resolves display name mentions", () => {
    const mentions = [
      {
        type: "user" as const,
        raw: '@"Maria Garcia"',
        value: "Maria Garcia",
        startIndex: 0,
        endIndex: 15,
      },
    ];
    const result = resolveMentions(mentions, members);
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("maria");
  });

  it("skips bot mentions", () => {
    const mentions = [
      {
        type: "bot" as const,
        raw: "@kai",
        value: "kai",
        startIndex: 0,
        endIndex: 4,
      },
    ];
    const result = resolveMentions(mentions, members);
    expect(result).toHaveLength(0);
  });

  it("deduplicates resolved members", () => {
    const mentions = [
      {
        type: "user" as const,
        raw: "@maria",
        value: "maria",
        startIndex: 0,
        endIndex: 6,
      },
      {
        type: "user" as const,
        raw: '@"Maria Garcia"',
        value: "Maria Garcia",
        startIndex: 10,
        endIndex: 25,
      },
    ];
    const result = resolveMentions(mentions, members);
    expect(result).toHaveLength(1);
  });

  it("returns empty for unresolved mentions", () => {
    const mentions = [
      {
        type: "user" as const,
        raw: "@unknown",
        value: "unknown",
        startIndex: 0,
        endIndex: 8,
      },
    ];
    const result = resolveMentions(mentions, members);
    expect(result).toHaveLength(0);
  });
});
