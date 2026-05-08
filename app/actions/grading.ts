"use server";

/**
 * AI Grading Server Actions
 *
 * Replaces the GraphQL → Lambda → OpenAI → Lambda → GraphQL round-trip with
 * a direct Server Action → OpenAI call. Eliminates Lambda cold starts (~300-1500ms)
 * and API Gateway overhead (~20ms).
 *
 * Environment: OPENAI_API_KEY must be set in .env.local or deployment env vars.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return createOpenAI({ apiKey });
}

/**
 * Verify a student's text definition/answer against the expected answer.
 */
export async function gradeDefinition(params: {
  word: string;
  definition: string;
  expectedDefinition: string;
  language?: string;
}) {
  const openai = getOpenAI();
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system:
      "You are a language learning assistant that grades student answers. Respond with JSON only.",
    prompt: `Grade this definition:
Word: "${params.word}"
Student's answer: "${params.definition}"
Expected definition: "${params.expectedDefinition}"
Language: ${params.language || "English"}

Respond with: {"correct": boolean, "score": number (0-100), "feedback": "brief explanation"}`,
    temperature: 0.1,
    maxOutputTokens: 200,
  });

  try {
    return JSON.parse(text);
  } catch {
    return { correct: false, score: 0, feedback: "Unable to grade response" };
  }
}

/**
 * Verify a student's short answer response.
 */
export async function gradeShortAnswer(params: {
  question: string;
  answer: string;
  expectedAnswer?: string;
  rubric?: string;
}) {
  const openai = getOpenAI();
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system:
      "You are an educational assessment AI. Grade student answers fairly. Respond with JSON only.",
    prompt: `Grade this short answer:
Question: "${params.question}"
Student's answer: "${params.answer}"
${params.expectedAnswer ? `Expected answer: "${params.expectedAnswer}"` : ""}
${params.rubric ? `Rubric: ${params.rubric}` : ""}

Respond with: {"correct": boolean, "score": number (0-100), "feedback": "brief explanation"}`,
    temperature: 0.1,
    maxOutputTokens: 300,
  });

  try {
    return JSON.parse(text);
  } catch {
    return { correct: false, score: 0, feedback: "Unable to grade response" };
  }
}

/**
 * Analyze an image and optionally grade it against expected content.
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
          "You are an educational image analysis AI. Describe what you see and grade if criteria provided. Respond with JSON only.",
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
              ? `Question: "${params.question}"\n${params.expectedContent ? `Expected: "${params.expectedContent}"` : ""}\nDescribe the image and grade it. Respond with: {"description": "...", "correct": boolean, "score": number (0-100), "feedback": "..."}`
              : 'Describe this image in detail. Respond with: {"description": "detailed description"}',
          },
        ],
      },
    ],
    temperature: 0.1,
    maxOutputTokens: 500,
  });

  try {
    return JSON.parse(text);
  } catch {
    return {
      description: text,
      correct: false,
      score: 0,
      feedback: "Unable to parse response",
    };
  }
}

/**
 * Transcribe audio from a URL using Whisper (via OpenAI API directly).
 * Note: This still needs the raw OpenAI client for audio transcription.
 */
export async function transcribeAudio(params: {
  audioUrl: string;
  expectedAnswer?: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  // Fetch the audio file
  const response = await fetch(params.audioUrl);
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

  // If expected answer provided, grade the transcription
  if (params.expectedAnswer) {
    const openai = getOpenAI();
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system:
        "You are a pronunciation grading AI. Compare the transcription to expected answer. Respond with JSON only.",
      prompt: `Student said: "${transcript}"\nExpected: "${params.expectedAnswer}"\n\nRespond with: {"transcript": "${transcript}", "correct": boolean, "score": number (0-100), "feedback": "brief explanation"}`,
      temperature: 0.1,
      maxOutputTokens: 200,
    });

    try {
      return JSON.parse(text);
    } catch {
      return {
        transcript,
        correct: false,
        score: 0,
        feedback: "Unable to grade pronunciation",
      };
    }
  }

  return {
    transcript,
    correct: true,
    score: 100,
    feedback: "Transcription complete",
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
