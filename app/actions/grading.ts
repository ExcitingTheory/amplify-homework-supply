"use server";

/**
 * AI Grading Server Actions
 *
 * Replaces the GraphQL → Lambda → OpenAI → Lambda → GraphQL round-trip with
 * a direct Server Action → OpenAI call. Eliminates Lambda cold starts (~300-1500ms)
 * and API Gateway overhead (~20ms).
 *
 * Environment: OPENAI_API_KEY must be set in .env.local or deployment env vars.
 *
 * IMPORTANT: Return shapes must match what components expect:
 * - gradeDefinition → { answer: boolean, reason: string, score?: number }
 * - transcribeAudio → { answer: boolean, reason: string, transcript: string, score?: number, moderation?: object }
 * - verifySketchImage → { answer: boolean, reason: string, accuracy: number }
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import outputs from "../../amplify_outputs.json";

/**
 * Validates that a URL is a safe S3 presigned URL from our storage bucket.
 * Accepts:
 * - *.s3.amazonaws.com (path-style)
 * - *.s3.<region>.amazonaws.com (virtual-hosted style)
 * - CloudFront distribution URLs if configured
 */
function validateAudioUrl(inputUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    throw new Error("Invalid audio URL");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Audio URL must use HTTPS");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Audio URL must not contain credentials");
  }

  const hostname = parsed.hostname.toLowerCase();

  // Allow S3 URLs (both path-style and virtual-hosted)
  const bucketName = outputs.storage?.bucket_name || "";
  const isS3Url =
    hostname.endsWith(".s3.amazonaws.com") ||
    hostname.match(/\.s3\.[a-z0-9-]+\.amazonaws\.com$/) !== null;
  const isOurBucket = bucketName && hostname.includes(bucketName);
  // Also allow generic S3 path-style: s3.amazonaws.com/bucket or s3.region.amazonaws.com/bucket
  const isS3PathStyle =
    hostname === "s3.amazonaws.com" ||
    hostname.match(/^s3\.[a-z0-9-]+\.amazonaws\.com$/) !== null;

  if (!isS3Url && !isOurBucket && !isS3PathStyle) {
    throw new Error("Audio URL host is not an allowed S3 endpoint");
  }

  return parsed.toString();
}

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return createOpenAI({ apiKey });
}

/**
 * Verify a student's text definition/answer against the expected answer.
 * Returns { answer: boolean, reason: string, score: number } matching the
 * shape that AnswerComponent expects (feedback[key]?.answer, feedback[key]?.reason).
 */
export async function gradeDefinition(params: {
  word: string;
  definition: string;
  expectedDefinition: string;
  language?: string;
}): Promise<{ answer: boolean; reason: string; score: number }> {
  const openai = getOpenAI();
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system:
      "You are a skilled, encouraging tutor on an elearning platform. Grade student answers. Respond with JSON only.",
    prompt: `Grade this definition:
Word: "${params.word}"
Student's answer: "${params.definition}"
Expected definition: "${params.expectedDefinition}"
Language: ${params.language || "English"}

Respond with: {"answer": true/false, "reason": "brief explanation", "score": 0-100}`,
    temperature: 0.1,
    maxOutputTokens: 200,
  });

  try {
    const parsed = JSON.parse(text);
    // Normalize field names in case model uses "correct"/"feedback" variants
    return {
      answer: parsed.answer ?? parsed.correct ?? false,
      reason: parsed.reason ?? parsed.feedback ?? "",
      score: parsed.score ?? 0,
    };
  } catch {
    return { answer: false, reason: "Unable to grade response", score: 0 };
  }
}

/**
 * Verify a student's short answer response.
 * Returns { answer: boolean, reason: string, score: number } matching component expectations.
 */
export async function gradeShortAnswer(params: {
  question: string;
  answer: string;
  expectedAnswer?: string;
  rubric?: string;
}): Promise<{ answer: boolean; reason: string; score: number }> {
  const openai = getOpenAI();
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system:
      "You are a skilled, encouraging tutor on an elearning platform. Grade student answers fairly. Respond with JSON only.",
    prompt: `Grade this short answer:
Question: "${params.question}"
Student's answer: "${params.answer}"
${params.expectedAnswer ? `Expected answer: "${params.expectedAnswer}"` : ""}
${params.rubric ? `Rubric: ${params.rubric}` : ""}

Respond with: {"answer": true/false, "reason": "brief explanation", "score": 0-100}`,
    temperature: 0.1,
    maxOutputTokens: 300,
  });

  try {
    const parsed = JSON.parse(text);
    return {
      answer: parsed.answer ?? parsed.correct ?? false,
      reason: parsed.reason ?? parsed.feedback ?? "",
      score: parsed.score ?? 0,
    };
  } catch {
    return { answer: false, reason: "Unable to grade response", score: 0 };
  }
}

/**
 * Analyze an image and optionally grade it against expected content.
 * Returns { answer, reason, description, score } for consistency.
 */
export async function gradeImage(params: {
  imageUrl: string;
  question?: string;
  expectedContent?: string;
}) {
  const openai = getOpenAI();
  const { text } = await generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "system",
        content:
          "You are a skilled, encouraging tutor on an elearning platform. Describe what you see and grade if criteria provided. Respond with JSON only.",
      },
      {
        role: "user",
        content: [
          {
            type: "image",
            image: new URL(params.imageUrl),
          },
          {
            type: "text",
            text: params.question
              ? `Question: "${params.question}"\n${params.expectedContent ? `Expected: "${params.expectedContent}"` : ""}\nDescribe the image and grade it. Respond with: {"answer": true/false, "reason": "brief explanation", "description": "...", "score": 0-100}`
              : 'Describe this image in detail. Respond with: {"description": "detailed description"}',
          },
        ],
      },
    ],
    temperature: 0.1,
    maxOutputTokens: 500,
  });

  try {
    const parsed = JSON.parse(text);
    return {
      answer: parsed.answer ?? parsed.correct ?? false,
      reason: parsed.reason ?? parsed.feedback ?? "",
      description: parsed.description ?? "",
      score: parsed.score ?? 0,
    };
  } catch {
    return {
      description: text,
      answer: false,
      reason: "Unable to parse response",
      score: 0,
    };
  }
}

/**
 * Transcribe audio from a URL using Whisper, then verify against expected answer.
 * Includes moderation piggyback (same as old Lambda).
 *
 * Returns { answer: boolean, reason: string, transcript: string, score: number, moderation?: object }
 * matching what AnswerComponent and RecordingStudio2 expect:
 * - feedbackData?.answer (boolean)
 * - feedbackData?.reason (string)
 * - feedbackData?.moderation?.flagged (boolean)
 * - feedbackData?.moderation?.categories (object)
 */
export async function transcribeAudio(params: {
  audioUrl: string;
  expectedAnswer?: string;
}): Promise<{
  answer: boolean;
  reason: string;
  transcript: string;
  score: number;
  moderation?: {
    flagged: boolean;
    categories: Record<string, boolean>;
    categoryScores?: Record<string, number>;
    model: string;
  };
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const safeAudioUrl = validateAudioUrl(params.audioUrl);

  // Fetch the audio file
  const response = await fetch(safeAudioUrl, { redirect: "follow" });
  if (!response.ok)
    throw new Error(`Failed to fetch audio: ${response.statusText}`);
  const audioBlob = await response.blob();

  // Use OpenAI's native API for Whisper transcription
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-1");

  const transcriptionResponse = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    },
  );

  if (!transcriptionResponse.ok) {
    throw new Error(
      `Transcription failed: ${transcriptionResponse.statusText}`,
    );
  }

  const { text: transcript } = await transcriptionResponse.json();

  // If expected answer provided, grade the transcription AND run moderation in parallel
  if (params.expectedAnswer) {
    const openai = getOpenAI();

    const [gradeResult, moderationResult] = await Promise.allSettled([
      generateText({
        model: openai("gpt-4o-mini"),
        system:
          "You are a skilled, encouraging tutor on an elearning platform. Compare the transcription to expected answer. Respond with JSON only.",
        prompt: `Expected answer: "${params.expectedAnswer}"\nStudent said: "${transcript}"\n\nAre these equivalent? Respond with: {"answer": true/false, "reason": "brief explanation", "score": 0-100}`,
        temperature: 0.1,
        maxOutputTokens: 200,
      }),
      // Piggyback moderation on the transcript (non-blocking, same as old Lambda)
      transcript && transcript.trim().length > 0
        ? fetch("https://api.openai.com/v1/moderations", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "omni-moderation-latest",
              input: transcript,
            }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        : Promise.resolve(null),
    ]);

    // Parse grade result
    let gradeData: { answer: boolean; reason: string; score: number } = {
      answer: false,
      reason: "Unable to grade pronunciation",
      score: 0,
    };
    if (gradeResult.status === "fulfilled") {
      try {
        const parsed = JSON.parse(gradeResult.value.text);
        gradeData = {
          answer: parsed.answer ?? parsed.correct ?? false,
          reason: parsed.reason ?? parsed.feedback ?? "",
          score: parsed.score ?? 0,
        };
      } catch {
        // Keep default
      }
    }

    // Parse moderation result
    let moderation:
      | {
          flagged: boolean;
          categories: Record<string, boolean>;
          categoryScores?: Record<string, number>;
          model: string;
        }
      | undefined;
    if (
      moderationResult.status === "fulfilled" &&
      moderationResult.value?.results?.[0]
    ) {
      const mod = moderationResult.value.results[0];
      moderation = {
        flagged: mod.flagged,
        categories: mod.categories,
        categoryScores: mod.category_scores,
        model: moderationResult.value.model || "omni-moderation-latest",
      };
    }

    return {
      ...gradeData,
      transcript,
      moderation,
    };
  }

  // No expected answer — just return transcript
  return {
    answer: true,
    reason: "Transcription complete",
    transcript,
    score: 100,
  };
}

/**
 * Verify a sketch/drawn image (base64) against expected content.
 * Used by SketchPad component.
 */
export async function verifySketchImage(params: {
  expected: string;
  imageBase64: string;
}) {
  const openai = getOpenAI();
  const { text } = await generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: `data:image/png;base64,${params.imageBase64}`,
          },
          {
            type: "text",
            text: `The student was asked to draw: "${params.expected}". Grade their drawing. Respond ONLY with JSON: {"answer": true/false, "reason": "brief explanation", "accuracy": number 0-100}`,
          },
        ],
      },
    ],
    temperature: 0.1,
    maxOutputTokens: 300,
  });

  try {
    return JSON.parse(text);
  } catch {
    return { answer: false, reason: "Unable to verify image", accuracy: 0 };
  }
}
