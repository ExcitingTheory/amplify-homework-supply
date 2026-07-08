"use server";

/**
 * Practice Drill Generation Server Action
 *
 * Generates pedagogically-sound practice drill blocks from unit content.
 * Uses an agentic validation loop: generate → validate → fix → return.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { getServerClient } from "../../src/utils/amplifyServerClient";

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
  sourceItemIds?: string[] | null;
  sourceType: "vocabulary" | "question" | "text" | "document";
}

// ============================================================================
// Validation Types & Logic
// ============================================================================

export interface ValidationError {
  blockIndex: number;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  blockCount: number;
  summary: string;
}

// ============================================================================
// Utility helpers for source extraction
// ============================================================================

/** Extract meaningful text blocks from Lexical editor state JSON */
function extractTextBlocks(lexicalData: any): string[] {
  const texts: string[] = [];
  function walk(node: any) {
    if (node.type === "text" && node.text) {
      texts.push(node.text);
    }
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  }
  if (lexicalData?.root) walk(lexicalData.root);
  return texts.filter((t: string) => t.trim().length > 10);
}

/** Safely parse JSON with a fallback value */
function safeParseJSON(
  str: string | null | undefined | any[],
  fallback: any,
): any {
  if (!str) return fallback;
  if (Array.isArray(str)) return str;
  try {
    return typeof str === "string" ? JSON.parse(str) : str;
  } catch {
    return fallback;
  }
}

/**
 * Validates drill blocks against the Lexical node schemas and source data.
 * This is the "tool" the LLM can conceptually call to verify its output.
 */
async function validateDrillBlocks(
  blocks: PracticeDrillBlock[],
  validWordIds: Set<string>,
  validQuestionIds: Set<string>,
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  if (blocks.length === 0) {
    errors.push({
      blockIndex: -1,
      field: "blocks",
      message: "No blocks generated",
      severity: "error",
    });
    return {
      valid: false,
      errors,
      blockCount: 0,
      summary: "Empty blocks array",
    };
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Common: instruction required
    if (!block.instruction || block.instruction.trim().length === 0) {
      errors.push({
        blockIndex: i,
        field: "instruction",
        message: "Block must have a non-empty instruction",
        severity: "error",
      });
    }

    // Common: sourceItemId must reference real data
    if (!block.sourceItemId || block.sourceItemId.trim().length === 0) {
      errors.push({
        blockIndex: i,
        field: "sourceItemId",
        message: "sourceItemId is required",
        severity: "error",
      });
    } else if (
      block.sourceType === "vocabulary" &&
      !validWordIds.has(block.sourceItemId)
    ) {
      errors.push({
        blockIndex: i,
        field: "sourceItemId",
        message: `sourceItemId "${block.sourceItemId}" is not a valid word ID. Valid IDs: ${[...validWordIds].slice(0, 5).join(", ")}${validWordIds.size > 5 ? "..." : ""}`,
        severity: "error",
      });
    } else if (
      block.sourceType === "question" &&
      !validQuestionIds.has(block.sourceItemId)
    ) {
      errors.push({
        blockIndex: i,
        field: "sourceItemId",
        message: `sourceItemId "${block.sourceItemId}" is not a valid question ID. Valid IDs: ${[...validQuestionIds].slice(0, 5).join(", ")}${validQuestionIds.size > 5 ? "..." : ""}`,
        severity: "error",
      });
    }

    // Type-specific validation
    switch (block.type) {
      case "quiz":
        if (!block.choices || block.choices.length < 2) {
          errors.push({
            blockIndex: i,
            field: "choices",
            message: "Quiz blocks must have at least 2 choices",
            severity: "error",
          });
        } else {
          const correctCount = block.choices.filter((c) => c.correct).length;
          if (correctCount !== 1) {
            errors.push({
              blockIndex: i,
              field: "choices",
              message: `Quiz must have exactly 1 correct choice, found ${correctCount}`,
              severity: "error",
            });
          }
        }
        break;

      case "answer":
        if (block.sourceType !== "vocabulary") {
          errors.push({
            blockIndex: i,
            field: "sourceType",
            message:
              'Answer blocks must have sourceType "vocabulary" (they reference word IDs)',
            severity: "error",
          });
        }
        break;

      case "meaning-association":
        if (!block.pairs || block.pairs.length < 2) {
          errors.push({
            blockIndex: i,
            field: "pairs",
            message: "Meaning-association blocks must have at least 2 pairs",
            severity: "error",
          });
        } else if (block.pairs.length > 6) {
          errors.push({
            blockIndex: i,
            field: "pairs",
            message: "Meaning-association blocks should have at most 6 pairs",
            severity: "warning",
          });
        }
        // Validate sourceItemIds match pair count
        if (block.sourceItemIds && block.sourceItemIds.length > 0) {
          for (const id of block.sourceItemIds) {
            if (!validWordIds.has(id)) {
              errors.push({
                blockIndex: i,
                field: "sourceItemIds",
                message: `sourceItemIds contains invalid word ID "${id}"`,
                severity: "error",
              });
            }
          }
        } else if (block.pairs && block.pairs.length > 1) {
          errors.push({
            blockIndex: i,
            field: "sourceItemIds",
            message:
              "Meaning-association blocks should provide sourceItemIds (array of word IDs, one per pair) for proper rendering",
            severity: "warning",
          });
        }
        break;

      case "custom-answer":
        if (block.sourceType !== "vocabulary") {
          errors.push({
            blockIndex: i,
            field: "sourceType",
            message: 'Custom-answer blocks must have sourceType "vocabulary"',
            severity: "error",
          });
        }
        if (!block.expectedAnswer) {
          errors.push({
            blockIndex: i,
            field: "expectedAnswer",
            message:
              "Custom-answer blocks should have an expectedAnswer for AI grading",
            severity: "warning",
          });
        }
        break;
    }
  }

  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;
  const valid = errorCount === 0;

  return {
    valid,
    errors,
    blockCount: blocks.length,
    summary: valid
      ? `All ${blocks.length} blocks valid${warningCount > 0 ? ` (${warningCount} warnings)` : ""}`
      : `${errorCount} errors, ${warningCount} warnings across ${blocks.length} blocks`,
  };
}

// ============================================================================
// Zod schema for drill block generation
// ============================================================================

/**
 * The LLM outputs sourceIndex (integer) instead of UUIDs.
 * The tool execute function resolves indices to real IDs from the sourceItems array.
 */
const drillBlockSchema = z.object({
  blocks: z.array(
    z.object({
      type: z.enum(["quiz", "answer", "meaning-association", "custom-answer"]),
      instruction: z.string(),
      choices: z
        .array(z.object({ choice: z.string(), correct: z.boolean() }))
        .nullable(),
      expectedAnswer: z.string().nullable(),
      pairs: z
        .array(z.object({ term: z.string(), definition: z.string() }))
        .nullable(),
      hint: z.string().nullable(),
      sourceIndex: z
        .number()
        .int()
        .describe("Index into the numbered source materials list (0-based)"),
      sourceIndices: z
        .array(z.number().int())
        .nullable()
        .describe(
          "For meaning-association blocks: array of indices (one per pair)",
        ),
      sourceType: z.enum(["vocabulary", "question", "text", "document"]),
    }),
  ),
});

// ============================================================================
// Agentic Generation with Validation Loop
// ============================================================================

/**
 * Generate practice drill questions for a unit.
 * Uses an agentic loop: the LLM generates blocks, validates them via a tool,
 * and iterates to fix any issues before returning.
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

  // Gather source material + build indexed lookup for ID resolution
  const sources: string[] = [];
  const validWordIds = new Set<string>();
  const validQuestionIds = new Set<string>();

  // Indexed source items — LLM references by index, tool resolves to real ID
  const sourceItems: {
    id: string;
    type: "vocabulary" | "question" | "text" | "document";
    label: string;
  }[] = [];

  if (params.sourcesEnabled?.vocabulary !== false) {
    const { data: unitWords } = await client.models.UnitWord.list({
      filter: { unitID: { eq: params.unitId } },
    });
    if (unitWords?.length) {
      const wordIds = unitWords.map((uw: any) => uw.wordID).filter(Boolean);
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
        validWords.forEach((w: any) => validWordIds.add(w.id));
        const startIdx = sourceItems.length;
        validWords.forEach((w: any) => {
          sourceItems.push({ id: w.id, type: "vocabulary", label: w.phrase });
        });
        sources.push(
          `Vocabulary (indices ${startIdx}–${sourceItems.length - 1}):\n${validWords
            .map(
              (w: any, i: number) =>
                `  [${startIdx + i}] phrase: "${w.phrase}" | definition: "${w.definition}"${w.phonetic ? ` | phonetic: "${w.phonetic}"` : ""}`,
            )
            .join("\n")}`,
        );
      }
    }
  }

  if (params.sourcesEnabled?.questions !== false) {
    const { data: unitQuestions } = await client.models.QuestionUnit.list({
      filter: { unitID: { eq: params.unitId } },
    });
    if (unitQuestions?.length) {
      const questionIds = unitQuestions
        .map((uq: any) => uq.questionID)
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
        validQuestions.forEach((q: any) => validQuestionIds.add(q.id));
        const startIdx = sourceItems.length;
        validQuestions.forEach((q: any) => {
          sourceItems.push({
            id: q.id,
            type: "question",
            label: q.question || q.prompt || "",
          });
        });
        sources.push(
          `Questions (indices ${startIdx}–${sourceItems.length - 1}):\n${validQuestions
            .map(
              (q: any, i: number) =>
                `  [${startIdx + i}] question: "${q.question}" | answer: "${q.answer}"${q.type ? ` | type: ${q.type}` : ""}`,
            )
            .join("\n")}`,
        );
      }
    }
  }

  // Extract text blocks from unit Lexical content
  if (params.sourcesEnabled?.text !== false) {
    try {
      const { data: unitFull } = await client.models.Unit.get(
        { id: params.unitId },
        { selectionSet: ["id", "data"] as any },
      );
      if (unitFull?.data) {
        const lexicalData =
          typeof unitFull.data === "string"
            ? JSON.parse(unitFull.data)
            : unitFull.data;
        const textBlocks = extractTextBlocks(lexicalData);
        if (textBlocks.length > 0) {
          sources.push(
            `Unit text content (${textBlocks.length} passages):\n${JSON.stringify(
              textBlocks.slice(0, 20).map((text: string, i: number) => ({
                id: `text-block-${i}`,
                text: text.slice(0, 300),
              })),
            )}`,
          );
        }
      }
    } catch {
      // Non-fatal — skip text extraction on error
    }
  }

  // Fetch parsed document content
  if (params.sourcesEnabled?.documents !== false) {
    try {
      const { data: unitDocs } = await client.models.UnitDocument.list({
        filter: { unitID: { eq: params.unitId } },
      });
      if (unitDocs?.length) {
        const docResults = await Promise.allSettled(
          unitDocs.slice(0, 5).map(async (ud: any) => {
            if (!ud.documentID) return null;
            const { data: doc } = await client.models.Document.get({
              id: ud.documentID,
            });
            if (!doc) return null;
            // Fetch parsed content for this document
            const { data: parsed } = await client.models.ParsedContent.list({
              filter: { documentID: { eq: ud.documentID } },
            });
            return { doc, parsed: parsed || [] };
          }),
        );
        const docs = docResults
          .filter(
            (r): r is PromiseFulfilledResult<any> =>
              r.status === "fulfilled" && r.value != null,
          )
          .map((r) => r.value);

        for (const { doc, parsed } of docs) {
          const concepts = parsed.flatMap((p: any) =>
            safeParseJSON(p.conceptsJSON, []),
          );
          const vocabulary = parsed.flatMap((p: any) =>
            safeParseJSON(p.vocabularyJSON, []),
          );
          const summaries = parsed.flatMap((p: any) =>
            safeParseJSON(p.summariesJSON, []),
          );
          if (
            concepts.length > 0 ||
            vocabulary.length > 0 ||
            summaries.length > 0
          ) {
            sources.push(
              `Document "${doc.filename || "document"}" content:\n${JSON.stringify(
                {
                  concepts: concepts.slice(0, 10),
                  vocabulary: vocabulary.slice(0, 10),
                  summaries: summaries.slice(0, 5),
                },
              )}`,
            );
          }
        }
      }
    } catch {
      // Non-fatal — skip documents on error
    }
  }

  // ── Agentic generation with validation tool ────────────────────────────────
  // The LLM generates blocks, then calls validate_blocks to check them.
  // If validation fails, it gets the errors and can fix them in the same turn.

  const systemPrompt = `You are an educational content generator specializing in practice drills.

Your task: Generate exactly ${params.count} practice drill blocks of type "${params.drillType}" using the provided source material.

AFTER generating blocks, you MUST call the validate_blocks tool to verify your output is correct. If validation returns errors, fix them and call validate_blocks again until all errors are resolved.

SOURCE REFERENCES — CRITICAL:
- Each source item has a numbered index like [0], [1], [2].
- Use "sourceIndex" to reference a single source item by its number.
- Use "sourceIndices" to reference multiple items (for meaning-association pairs).
- NEVER invent or guess indices. Only use indices that appear in the source material.

BLOCK RULES:
- For "answer" blocks: sourceIndex must point to a vocabulary item. sourceType = "vocabulary".
- For "meaning-association" blocks: sourceIndices must be an array of vocabulary indices (one per pair, 2-6 pairs). Each pair's "term" = the word's phrase, "definition" = the word's definition. sourceType = "vocabulary".
- For "quiz" blocks: exactly 4 choices with exactly 1 correct. sourceIndex references the tested item.
- For "custom-answer" blocks: sourceIndex must point to a vocabulary item. sourceType = "vocabulary". Must include expectedAnswer.
${courseContext}

Block types:
- "quiz": Multiple choice with choices array (exactly one correct answer)
- "answer": Fill-in vocabulary practice — student types the answer for a word
- "meaning-association": Match terms to definitions with pairs array (2-6 pairs)
- "custom-answer": Open-ended with expectedAnswer for AI grading`;

  const userPrompt = `Unit: "${unit.name}"
Source material (reference items by their [index] number):
${sources.join("\n\n")}

Generate ${params.count} "${params.drillType}" practice blocks. Reference sources by index number only.

After generating, call validate_blocks to verify correctness. Fix any errors and re-validate until valid.`;

  // State to capture the final validated blocks
  let finalBlocks: PracticeDrillBlock[] = [];

  // Helper: resolve index-based LLM output to real IDs
  function resolveBlocks(
    input: z.infer<typeof drillBlockSchema>,
  ): PracticeDrillBlock[] {
    return input.blocks.map((b) => {
      const primarySource = sourceItems[b.sourceIndex];
      const sourceItemId = primarySource?.id || `unknown-${b.sourceIndex}`;
      const sourceType = primarySource?.type || b.sourceType;

      let sourceItemIds: string[] | undefined;
      if (b.sourceIndices && b.sourceIndices.length > 0) {
        sourceItemIds = b.sourceIndices.map(
          (idx) => sourceItems[idx]?.id || `unknown-${idx}`,
        );
      }

      return {
        type: b.type,
        instruction: b.instruction,
        sourceItemId,
        sourceType,
        choices: b.choices ?? undefined,
        expectedAnswer: b.expectedAnswer ?? undefined,
        pairs: b.pairs ?? undefined,
        hint: b.hint ?? undefined,
        sourceItemIds: sourceItemIds ?? undefined,
      };
    });
  }

  await generateText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    prompt: userPrompt,
    stopWhen: stepCountIs(5),
    tools: {
      generate_blocks: tool({
        description:
          "Generate the drill blocks. Call this first to produce the initial set of blocks.",
        inputSchema: drillBlockSchema as z.ZodType<
          z.infer<typeof drillBlockSchema>
        >,
        execute: async (input: z.infer<typeof drillBlockSchema>) => {
          const blocks = resolveBlocks(input);
          finalBlocks = blocks;
          const result = await validateDrillBlocks(
            blocks,
            validWordIds,
            validQuestionIds,
          );
          return {
            blocks_generated: blocks.length,
            validation: result,
          };
        },
      }),
      validate_blocks: tool({
        description:
          "Validate the current set of drill blocks. Returns detailed errors for any blocks that won't render correctly. Call this after generating or fixing blocks.",
        inputSchema: drillBlockSchema as z.ZodType<
          z.infer<typeof drillBlockSchema>
        >,
        execute: async (input: z.infer<typeof drillBlockSchema>) => {
          const blocks = resolveBlocks(input);
          finalBlocks = blocks;
          const result = await validateDrillBlocks(
            blocks,
            validWordIds,
            validQuestionIds,
          );
          return result;
        },
      }),
    },
    temperature: 0.7,
    maxOutputTokens: 4000,
  });

  // If the agentic loop produced valid blocks, return them.
  // If no tool calls happened (fallback), run validation once.
  if (finalBlocks.length === 0) {
    // Fallback: direct generation without agentic loop
    console.warn(
      "[drill] Agentic loop produced no blocks, falling back to direct generation",
    );
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: drillBlockSchema as z.ZodType<z.infer<typeof drillBlockSchema>>,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxOutputTokens: 3000,
    });
    finalBlocks = resolveBlocks(object as z.infer<typeof drillBlockSchema>);
  }

  // Final validation check (log only — don't block)
  const finalValidation = await validateDrillBlocks(
    finalBlocks,
    validWordIds,
    validQuestionIds,
  );
  if (!finalValidation.valid) {
    console.warn(
      "[drill] Final output has validation issues:",
      finalValidation.summary,
    );
  }

  return { blocks: finalBlocks };
}
