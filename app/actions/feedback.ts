"use server";

/**
 * Feedback Summary Server Action
 *
 * Replaces the openai Lambda's summarizeFeedback operation.
 * Generates a concise summary of student feedback/performance.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return createOpenAI({ apiKey });
}

/**
 * Summarize grade feedback for a completed assignment.
 * Accepts the same YAML-formatted data the Lambda uses.
 */
export async function summarizeFeedback(params: {
  assignmentData: string;
  gradeData: string;
}): Promise<string> {
  const openai = getOpenAI();

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `You are a skilled, encouraging tutor on an elearning platform.
Your job is to summarize a student's performance on an assignment and provide constructive feedback.
Be concise, warm, and specific. Highlight strengths first, then suggest improvements.
Respond with JSON: { "overall": string, "strengths": string[], "improvements": string[] }`,
    prompt: `Here is the assignment and grade data in YAML format:

---
# Assignment
${params.assignmentData}

---
# Student Grade
${params.gradeData}
---

Summarize the student's performance. Identify what they did well and where they can improve.`,
    temperature: 0.4,
    maxOutputTokens: 500,
  });

  return text;
}
