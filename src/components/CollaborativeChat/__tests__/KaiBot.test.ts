/**
 * Unit tests for KaiBot module
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { processKaiMention } from "../KaiBot";
import type { ChatMessage } from "../types";

describe("processKaiMention", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const makeMessage = (content: string, mentions: string[]): ChatMessage => ({
    id: "msg-1",
    parentId: null,
    authorId: "student1",
    authorName: "Alex",
    content,
    mentions,
    createdAt: "2026-05-20T10:00:00Z",
    editedAt: null,
    reactions: {},
  });

  it("should return null when message does not mention @kai", async () => {
    const msg = makeMessage("Hello world", []);
    const result = await processKaiMention(msg, {});
    expect(result).toBeNull();
  });

  it("should return null when @kai has no prompt text", async () => {
    const msg = makeMessage("@kai", ["@kai"]);
    const result = await processKaiMention(msg, {});
    expect(result).toBeNull();
  });

  it("should call API and return response when @kai is mentioned with a question", async () => {
    const msg = makeMessage("@kai what is a noun?", ["@kai"]);

    const mockResponse = new Response(
      "A noun is a word that names a person, place, or thing.",
      {
        status: 200,
      },
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const result = await processKaiMention(msg, {
      apiEndpoint: "/api/chat",
      unitName: "Grammar Basics",
    });

    expect(result).toBe(
      "A noun is a word that names a person, place, or thing.",
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("should return error message on API failure", async () => {
    const msg = makeMessage("@kai explain particles", ["@kai"]);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 500 }),
    );

    const result = await processKaiMention(msg, {});
    expect(result).toBe("Sorry, I encountered an error. Please try again.");
  });

  it("should return error message on network error", async () => {
    const msg = makeMessage("@kai help me", ["@kai"]);

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const result = await processKaiMention(msg, {});
    expect(result).toBe(
      "Sorry, I encountered an error processing your question. Please try again.",
    );
  });

  it("should include context in system prompt when provided", async () => {
    const msg = makeMessage("@kai what are the vocabulary words?", ["@kai"]);

    let capturedBody: string | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      capturedBody = init?.body as string;
      return new Response("Here are the words...", { status: 200 });
    });

    await processKaiMention(msg, {
      unitName: "Lesson 5",
      sectionName: "Period 2",
      dictionaryWords: [
        { word: "犬", definition: "dog" },
        { word: "猫", definition: "cat" },
      ],
    });

    const parsed = JSON.parse(capturedBody!);
    const systemContent = parsed.messages[0].content;
    expect(systemContent).toContain("Lesson 5");
    expect(systemContent).toContain("Period 2");
    expect(systemContent).toContain("犬: dog");
    expect(systemContent).toContain("猫: cat");
  });
});
