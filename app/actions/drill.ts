"use server";

/**
 * Practice Drill Generation Server Action
 *
 * Replaces the generatePracticeDrill Lambda.
 * Generates pedagogically-sound practice drill blocks from unit content.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
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
 * Optionally accepts sectionId to fetch course outline for context-aware generation.
 */
export async function generatePracticeDrill(params: {
  unitId: string;
  drillType: string;
  count: number;
  sectionId?: string;
  sourcesEnabled?: {
    vocabulary?: boolean;
    questions?: boolean;
    text?: boolean;
    documents?: boolean;
  };
}): Promise<{ blocks: PracticeDrillBlock[] }> {
  const openai = getOpenAI();
  const client = getServerClient() as any;

  // Fetch unit data
  const { data: unit } = await client.models.Unit.get({ id: params.unitId });
  if (!unit) throw new Error("Unit not found");

  // Fetch course outline for pedagogical context
  let courseContext = "";
  if (params.sectionId) {
    try {
      const { data: section } = await client.models.Section.get(
        { id: params.sectionId },
        { selectionSet: ["id", "name", "courseOutline"] },
      );
      if (section?.courseOutline) {
        const outline = Array.isArray(section.courseOutline)
          ? section.courseOutline
          : typeof section.courseOutline === "string"
            ? JSON.parse(section.courseOutline)
            : [];
        if (outline.length > 0) {
          const currentIdx = outline.findIndex(
            (e: any) => e.unitId === params.unitId,
          );
          const context: string[] = [];
          if (currentIdx > 0) {
            const prev = outline[currentIdx - 1];
            context.push(`Previous unit: "${prev.name}"`);
          }
          if (currentIdx >= 0 && currentIdx < outline.length - 1) {
            const next = outline[currentIdx + 1];
            context.push(`Next unit: "${next.name}"`);
          }
          if (context.length > 0) {
            courseContext = `\nCourse progression: ${context.join(". ")}. Drills should reinforce content that bridges these topics when relevant.`;
          }
        }
      }
    } catch {
      // Non-fatal
    }
  }

  // Gather source material
  const sources: string[] = [];

  if (params.sourcesEnabled?.vocabulary !== false) {
    const { data: unitWords } = await client.models.UnitWord.list({
      filter: { unitId: { eq: params.unitId } },
    });
    if (unitWords?.length) {
      const wordIds = unitWords.map((uw: any) => uw.wordId).filter(Boolean);
      const wordResults = await Promise.allSettled(
        wordIds.slice(0, 30).map(async (id: string) => {
          const { data } = await client.models.Word.get({ id });
          return data;
        }),
      );
      const words = wordResults
        .filter(
          (r: PromiseSettledResult<any>): r is PromiseFulfilledResult<any> =>
            r.status === "fulfilled",
        )
        .map((r: PromiseFulfilledResult<any>) => r.value);
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
      const questionResults = await Promise.allSettled(
        questionIds.slice(0, 20).map(async (id: string) => {
          const { data } = await client.models.Question.get({ id });
          return data;
        }),
      );
      const questions = questionResults
        .filter(
          (r: PromiseSettledResult<any>): r is PromiseFulfilledResult<any> =>
            r.status === "fulfilled",
        )
        .map((r: PromiseFulfilledResult<any>) => r.value);
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

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: z.object({
      blocks: z.array(
        z.object({
          type: z.enum([
            "quiz",
            "answer",
            "meaning-association",
            "custom-answer",
          ]),
          instruction: z.string(),
          choices: z
            .array(z.object({ choice: z.string(), correct: z.boolean() }))
            .optional(),
          expectedAnswer: z.string().optional(),
          pairs: z
            .array(z.object({ term: z.string(), definition: z.string() }))
            .optional(),
          hint: z.string().optional(),
          sourceItemId: z.string(),
          sourceType: z.enum(["vocabulary", "question", "text", "document"]),
        }),
      ),
    }),
    system: `You are an educational content generator specializing in practice drills. Generate exactly ${params.count} practice drill blocks of type "${params.drillType}" using the provided source material. Each block must reference a sourceItemId from the provided materials.
${courseContext}

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

  return { blocks: object.blocks };
}
