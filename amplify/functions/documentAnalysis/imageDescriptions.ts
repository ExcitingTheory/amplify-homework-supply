/**
 * Describes images embedded in a document so their content can be folded into
 * the text that document analysis reads. Pure of AWS and Amplify; the caller
 * supplies the OpenAI client (and any rate limiting built into it).
 */
import type OpenAI from "openai";
import { stripImageMarkers } from "./embeddedImages.js";
import { IMAGE_DESCRIPTION_MAX_OUTPUT_TOKENS } from "./modelLimits.js";

export interface ImageToDescribe {
  filename: string;
  mimeType: string;
  data: Buffer;
  /** Placeholder in the document text that the description replaces. */
  marker?: string;
}

export interface ImageDescription {
  filename: string;
  marker?: string;
  /** False for decorative images (logos, borders, stock photos). */
  relevant: boolean;
  description: string;
  visibleText: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface DescribeImagesOptions {
  model: string;
  concurrency?: number;
}

const MAX_DESCRIPTION_CHARS = 700;
const MAX_VISIBLE_TEXT_CHARS = 800;

const SYSTEM_PROMPT =
  "You describe images embedded in educational documents so the content can be used to write study questions. " +
  "Return JSON with: relevant (boolean; false for decorative images such as logos, borders, backgrounds, or stock photos that teach nothing), " +
  "description (what the image shows, including labels, values, relationships, and what it illustrates; plain factual language), " +
  "and visibleText (all legible text in the image, transcribed exactly; empty string if none). " +
  "Describe only what is visible. Do not guess at content you cannot see.";

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function describeImage(
  client: OpenAI,
  image: ImageToDescribe,
  model: string,
): Promise<ImageDescription | null> {
  const completion = await client.chat.completions.create({
    model,
    max_tokens: IMAGE_DESCRIPTION_MAX_OUTPUT_TOKENS,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: `Image file: ${image.filename}` },
          {
            type: "image_url",
            image_url: {
              url: `data:${image.mimeType};base64,${image.data.toString("base64")}`,
            },
          },
        ],
      },
    ],
  });

  if (completion.choices[0]?.finish_reason === "length") {
    throw new Error(`Image description exceeded its output token budget`);
  }
  const content = completion.choices[0]?.message?.content;
  if (!content) return null;
  const parsed = JSON.parse(content) as Record<string, unknown>;
  return {
    filename: image.filename,
    ...(image.marker ? { marker: image.marker } : {}),
    relevant: parsed.relevant !== false,
    description: clip(parsed.description, MAX_DESCRIPTION_CHARS),
    visibleText: clip(parsed.visibleText, MAX_VISIBLE_TEXT_CHARS),
    usage: {
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
      totalTokens: completion.usage?.total_tokens ?? 0,
    },
  };
}

/**
 * Describes each image, a few at a time. A failure on one image is logged and
 * skipped so a bad image never fails the document. Results keep input order.
 */
export async function describeImages(
  client: OpenAI,
  images: ImageToDescribe[],
  { model, concurrency = 3 }: DescribeImagesOptions,
): Promise<ImageDescription[]> {
  const results: Array<ImageDescription | null> = new Array(images.length).fill(
    null,
  );
  let next = 0;

  async function worker() {
    while (next < images.length) {
      const index = next;
      next += 1;
      try {
        results[index] = await describeImage(client, images[index], model);
      } catch (error) {
        console.warn(
          `[describeImages] Skipping ${images[index].filename}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, images.length) }, worker),
  );
  return results.filter((result): result is ImageDescription => result !== null);
}

/**
 * Renders descriptions as a block appended to the document text. Decorative
 * images and empty descriptions are left out.
 */
export function formatImageDescriptions(
  descriptions: ImageDescription[],
): string {
  const lines = descriptions
    .filter((item) => item.relevant && (item.description || item.visibleText))
    .map((item, index) => {
      const parts = [`[Image ${index + 1}: ${item.filename}]`];
      if (item.description) parts.push(item.description);
      if (item.visibleText) parts.push(`Text in image: "${item.visibleText}"`);
      return parts.join(" ");
    });
  if (lines.length === 0) return "";
  return `\n\n[Embedded images]\n${lines.join("\n")}`;
}

function inlineDescription(item: ImageDescription): string {
  const parts: string[] = [];
  if (item.description) parts.push(item.description);
  if (item.visibleText) parts.push(`Text in image: "${item.visibleText}"`);
  return parts.length > 0 ? `[Image: ${parts.join(" ")}]` : "";
}

/**
 * Puts descriptions back into the text. An image with a placeholder in the
 * text is described in place (and dropped if decorative); the rest are
 * collected in a block at the end. Placeholders left over, such as
 * duplicates that were skipped, are removed.
 */
export function weaveImageDescriptions(
  text: string,
  descriptions: ImageDescription[],
): string {
  let woven = text;
  const unplaced: ImageDescription[] = [];

  for (const item of descriptions) {
    if (item.marker && woven.includes(item.marker)) {
      const replacement = item.relevant ? inlineDescription(item) : "";
      woven = woven.split(item.marker).join(replacement);
    } else {
      unplaced.push(item);
    }
  }

  return stripImageMarkers(woven) + formatImageDescriptions(unplaced);
}
