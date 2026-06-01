"use server";

/**
 * Content Generation Server Actions
 *
 * Replaces the openai Lambda's generateAudioFile/generateImageFile operations.
 * Does the full flow: OpenAI generation → S3 upload → File record creation.
 * Eliminates Lambda cold starts and the async self-invocation pattern.
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerClient } from "@/utils/amplifyServerClient";
import outputs from "../../amplify_outputs.json";

const OPENAI_API_URL = "https://api.openai.com/v1";

function getApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return apiKey;
}

function getS3Client(): S3Client {
  return new S3Client({
    region: outputs.storage?.aws_region || "us-east-1",
  });
}

function getBucketName(): string {
  return outputs.storage?.bucket_name || "";
}

export interface GenerateFileResult {
  id: string;
  path: string;
  filename: string;
  fileType: string;
  status: string;
}

/**
 * Generate speech audio from text using OpenAI TTS, upload to S3, and create File record.
 * Returns the File record's id and S3 path for use with getCachedUrl().
 */
export async function generateSpeech(params: {
  phrase: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  model?: "tts-1" | "tts-1-hd";
}): Promise<GenerateFileResult> {
  const apiKey = getApiKey();
  const client = getServerClient() as any;
  const s3 = getS3Client();

  const timestamp = Date.now();
  const fileName = `generated-audio-${timestamp}.mp3`;
  const s3Path = `public/audio/${timestamp}/${fileName}`;

  // 1. Generate audio via OpenAI TTS
  const response = await fetch(`${OPENAI_API_URL}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model || "tts-1",
      voice: params.voice || "alloy",
      input: params.phrase,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    throw new Error(`TTS generation failed: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  // 2. Upload to S3
  await s3.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: s3Path,
      Body: buffer,
      ContentType: "audio/mpeg",
    }),
  );

  // 3. Create File record via data model
  const { data: fileRecord, errors } = await client.models.File.create({
    name: fileName,
    mimeType: "audio/mpeg",
    path: s3Path,
    description: "Generated audio - completed",
  });

  if (errors?.length || !fileRecord) {
    throw new Error(`Failed to create File record: ${JSON.stringify(errors)}`);
  }

  return {
    id: fileRecord.id,
    path: s3Path,
    filename: fileName,
    fileType: "audio/mpeg",
    status: "completed",
  };
}

/**
 * Generate an image using DALL-E 3, upload to S3, and create File record.
 * Returns the File record's id and S3 path for use with getCachedUrl().
 */
export async function generateImage(params: {
  phrase: string;
  model?: "dall-e-3";
  size?: "1024x1024" | "1792x1024" | "1024x1792";
}): Promise<GenerateFileResult> {
  const apiKey = getApiKey();
  const client = getServerClient() as any;
  const s3 = getS3Client();

  const timestamp = Date.now();
  const fileName = `generated-image-${timestamp}.png`;
  const s3Path = `public/images/${timestamp}/${fileName}`;

  // 1. Generate image via DALL-E (request b64_json for direct upload)
  const response = await fetch(`${OPENAI_API_URL}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model || "dall-e-3",
      prompt: params.phrase,
      size: params.size || "1024x1024",
      n: 1,
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  const base64 = data.data[0]?.b64_json;
  if (!base64) throw new Error("No image data returned");

  const buffer = Buffer.from(base64, "base64");

  // 2. Upload to S3
  await s3.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: s3Path,
      Body: buffer,
      ContentType: "image/png",
    }),
  );

  // 3. Create File record via data model
  const { data: fileRecord, errors } = await client.models.File.create({
    name: fileName,
    mimeType: "image/png",
    path: s3Path,
    description: "Generated image - completed",
  });

  if (errors?.length || !fileRecord) {
    throw new Error(`Failed to create File record: ${JSON.stringify(errors)}`);
  }

  return {
    id: fileRecord.id,
    path: s3Path,
    filename: fileName,
    fileType: "image/png",
    status: "completed",
  };
}
