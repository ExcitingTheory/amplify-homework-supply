"use server";

/**
 * Practice Drill Generation Server Action
 *
 * Replaces the generatePracticeDrill Lambda.
 * Generates pedagogically-sound practice drill blocks from unit content.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getServerClient } from "@/utils/amplifyServerClient";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return createOpenAI({ apiKey });
}

export interface PracticeDrillBlock {
  type: "quiz" | "answer" | "meaning-association" | "custom-answer";
  instruction: string;
  choices?: { choice: string; correct: boolean }[];
  expectedAnswer?: string;
  pairs?: { term: string; definition: string }[];
  hint?: string;
  sourceItemId: string;
  sourceType: "vocabulary" | "question" | "text" | "document";
}

/**
 * Generate practice drill questions for a unit.
 */
export async function generatePracticeDrill(params: {
  unitId: string;
  drillType: string;
  count: number;
  sourcesEnabled?: {
    vocabulary?: boolean;
    questions?: boolean;
    text?: boolean;
    documents?: boolean;
  };
}): Promise<{ blocks: PracticeDrillBlock[] }> {
  const openai = getOpenAI();
  const client = getServerClient();

  // Fetch unit data
  const { data: unit } = await client.models.Unit.get({ id: params.unitId });
  if (!unit) throw new Error("Unit not found");

  // Gather source material
  const sources: string[] = [];

  if (params.sourcesEnabled?.vocabulary !== false) {
    const { data: unitWords } = await client.models.UnitWord.list({
      filter: { unitId: { eq: params.unitId } },
    });
    if (unitWords?.length) {
      const wordIds = unitWords.map((uw: any) => uw.wordId).filter(Boolean);
      const words = await Promise.all(
        wordIds.slice(0, 30).map(async (id: string) => {
          const { data } = await client.models.Word.get({ id });
          return data;
        }),
      );
      const validWords = words.filter(Boolean);
      if (validWords.length) {
        sources.push(
          `Vocabulary (${validWords.length} words):\n${JSON.stringify(
            validWords.map((w: any) => ({
              id: w.id,
              phrase: w.phrase,
              definition: w.definition,
              phonetic: w.phonetic,
            })),
          )}`,
        );
      }
    }
  }

  if (params.sourcesEnabled?.questions !== false) {
    const { data: unitQuestions } = await client.models.UnitQuestion.list({
      filter: { unitId: { eq: params.unitId } },
    });
    if (unitQuestions?.length) {
      const questionIds = unitQuestions
        .map((uq: any) => uq.questionId)
        .filter(Boolean);
      const questions = await Promise.all(
        questionIds.slice(0, 20).map(async (id: string) => {
          const { data } = await client.models.Question.get({ id });
          return data;
        }),
      );
      const validQuestions = questions.filter(Boolean);
      if (validQuestions.length) {
        sources.push(
          `Questions (${validQuestions.length}):\n${JSON.stringify(
            validQuestions.map((q: any) => ({
              id: q.id,
              question: q.question,
              answer: q.answer,
              type: q.type,
            })),
          )}`,
        );
      }
    }
  }

  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: `You are an educational content generator specializing in practice drills. Generate exactly ${params.count} practice drill blocks of type "${params.drillType}" using the provided source material. Each block must reference a sourceItemId from the provided materials.

Respond with JSON only: { "blocks": [...] }

Block types:
- "quiz": Multiple choice with choices array (one correct)
- "answer": Fill-in vocabulary practice with expectedAnswer
- "meaning-association": Match terms to definitions with pairs array (2-6 pairs)
- "custom-answer": Open-ended with expectedAnswer for AI grading`,
    prompt: `Unit: "${unit.name}"
Source material:\n${sources.join("\n\n")}

Generate ${params.count} "${params.drillType}" practice blocks.`,
    temperature: 0.7,
    maxOutputTokens: 3000,
  });

  try {
    const parsed = JSON.parse(text);
    return { blocks: parsed.blocks || [] };
  } catch {
    return { blocks: [] };
  }
}
