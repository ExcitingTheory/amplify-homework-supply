/**
 * @fileoverview Secure AI Grading Route Handler
 *
 * Provides AI-powered grading for Custom AI blocks with comprehensive
 * security guardrails. Each request is stateless and authenticated.
 *
 * Security layers:
 * - Auth validation (Amplify session)
 * - Input sanitization (prompt injection, XSS)
 * - Immutable system prompt (hardcoded, not instructor-configurable)
 * - Output schema validation (strict JSON schema)
 * - PII filtering (email, phone, SSN patterns)
 * - Rate limiting via auth gating
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText, Output } from "ai";
import { z } from "zod";
import { requireAuth } from "../_shared/auth";
import {
  sanitizeInput,
  buildSecurePrompt,
  filterPII,
  type GradingResponse,
} from "@/components/Editor3/nodes/CustomAINode/security";

export const maxDuration = 30;

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return createOpenAI({ apiKey });
}

/**
 * Valid input modes for the Custom AI block.
 */
const VALID_INPUT_MODES = ["text", "audio", "image", "drawing"] as const;
type InputMode = (typeof VALID_INPUT_MODES)[number];

/**
 * Validate the request body structure.
 */
function validateRequestBody(body: unknown): {
  valid: boolean;
  error?: string;
  data?: {
    questionId: string;
    question: string;
    answer: string;
    inputMode: InputMode;
    criteria: string;
    imageData?: string;
  };
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const b = body as Record<string, unknown>;

  if (!b.questionId || typeof b.questionId !== "string") {
    return { valid: false, error: "questionId is required (string)" };
  }
  if (!b.question || typeof b.question !== "string") {
    return { valid: false, error: "question is required (string)" };
  }
  if (!b.answer || typeof b.answer !== "string") {
    return { valid: false, error: "answer is required (string)" };
  }
  if (
    !b.inputMode ||
    typeof b.inputMode !== "string" ||
    !VALID_INPUT_MODES.includes(b.inputMode as InputMode)
  ) {
    return {
      valid: false,
      error: `inputMode must be one of: ${VALID_INPUT_MODES.join(", ")}`,
    };
  }
  if (!b.criteria || typeof b.criteria !== "string") {
    return { valid: false, error: "criteria is required (string)" };
  }

  // imageData is optional, but if present must be a string
  if (b.imageData !== undefined && typeof b.imageData !== "string") {
    return { valid: false, error: "imageData must be a string if provided" };
  }

  return {
    valid: true,
    data: {
      questionId: b.questionId as string,
      question: b.question as string,
      answer: b.answer as string,
      inputMode: b.inputMode as InputMode,
      criteria: b.criteria as string,
      imageData: b.imageData as string | undefined,
    },
  };
}

export async function POST(req: Request) {
  // 1. Authenticate
  const authError = await requireAuth();
  if (authError) return authError;

  // 2. Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = validateRequestBody(body);
  if (!validation.valid || !validation.data) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const { question, answer, inputMode, criteria, imageData } = validation.data;

  // 3. Sanitize student input
  const sanitizedAnswer = sanitizeInput(answer);
  const sanitizedQuestion = sanitizeInput(question);

  if (!sanitizedAnswer) {
    return Response.json(
      { error: "Answer is empty after sanitization" },
      { status: 400 },
    );
  }

  // 4. Build secure prompt
  const systemPrompt = buildSecurePrompt(criteria, inputMode);

  // 5. Call OpenAI with appropriate model
  try {
    const openai = getOpenAI();

    const GradeSchema = z.object({
      correct: z.boolean(),
      score: z.number(),
      feedback: z.string(),
    });

    let gradingResponse: GradingResponse;

    if ((inputMode === "image" || inputMode === "drawing") && imageData) {
      // Vision model for image/drawing input — use Output.object with messages
      const { output } = await generateText({
        model: openai("gpt-4o"),
        output: Output.object({ schema: GradeSchema }),
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image",
                image: imageData.startsWith("data:")
                  ? imageData
                  : `data:image/png;base64,${imageData}`,
              },
              {
                type: "text",
                text: `Question: "${sanitizedQuestion}"\nStudent's description of their submission: "${sanitizedAnswer}"\n\nGrade this submission.`,
              },
            ],
          },
        ],
        temperature: 0.1,
        maxOutputTokens: 300,
      });

      if (!output) {
        return Response.json(
          {
            correct: false,
            score: 0,
            feedback:
              "Unable to process the grading response. Please try again.",
          } satisfies GradingResponse,
          { status: 200 },
        );
      }
      gradingResponse = output;
    } else {
      // Text model for text/audio input — use generateObject
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: GradeSchema,
        system: systemPrompt,
        prompt: `Question: "${sanitizedQuestion}"\nStudent's answer: "${sanitizedAnswer}"\n\nGrade this answer.`,
        temperature: 0.1,
        maxOutputTokens: 300,
      });
      gradingResponse = object;
    }

    // 6. Final PII filter on the complete response
    const safeResponse: GradingResponse = {
      ...gradingResponse,
      feedback: filterPII(gradingResponse.feedback),
    };

    return Response.json(safeResponse);
  } catch (error) {
    console.error("[grade-ai] OpenAI API error:", error);
    return Response.json(
      {
        correct: false,
        score: 0,
        feedback: "An error occurred while grading. Please try again.",
      } satisfies GradingResponse,
      { status: 200 },
    );
  }
}
