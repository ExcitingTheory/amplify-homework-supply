/**
 * Image Processing Lambda Handler
 *
 * Entry points:
 * 1. GraphQL mutation `processFileImage(fileID)` — explicit processing request
 * 2. EventBridge S3 Object Created — auto-trigger for image uploads
 *
 * Generates responsive variants at:
 *   protected/{identityId}/{fileId}/thumbnail.webp  (150px)
 *   protected/{identityId}/{fileId}/small.webp      (320px)
 *   protected/{identityId}/{fileId}/medium.webp     (640px)
 *   protected/{identityId}/{fileId}/large.webp      (1280px)
 *
 * For PDFs, generates a thumbnail from page 1.
 * For other document types (Word, Excel, PPT, etc.), delegates to documentThumbnail Lambda.
 */

import type { Handler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "../../data/resource";
import { fromEnv } from "@aws-sdk/credential-providers";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: process.env.API_ENDPOINT || "",
        region: process.env.AWS_REGION || "us-east-1",
        defaultAuthMode: "iam",
      },
    },
  },
  {
    Auth: {
      credentialsProvider: {
        getCredentialsAndIdentityId: async () => ({
          credentials: await fromEnv()(),
        }),
        clearCredentialsAndIdentityId: () => {},
      },
    },
  },
);

let dataClient: ReturnType<typeof generateClient<Schema>> | null = null;

const BUCKET = process.env.STORAGE_BUCKET!;
const REGION = process.env.AWS_REGION || "us-east-1";

const s3Client = new S3Client({ region: REGION });

/** Image size variants — width in pixels */
const IMAGE_VARIANTS = [
  { name: "thumbnail", width: 150 },
  { name: "small", width: 320 },
  { name: "medium", width: 640 },
  { name: "large", width: 1280 },
] as const;

/** Supported image MIME types */
const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/tiff",
  "image/bmp",
  "image/svg+xml",
]);

// ---------------------------------------------------------------------------
// GraphQL operations
// ---------------------------------------------------------------------------

const GET_FILE = /* GraphQL */ `
  query GetFile($id: ID!) {
    getFile(id: $id) {
      id
      _version
      _lastChangedAt
      _deleted
      path
      mimeType
      identityId
      owner
    }
  }
`;

const LIST_FILES_BY_PATH = /* GraphQL */ `
  query ListFiles($filter: ModelFileFilterInput) {
    listFiles(filter: $filter, limit: 1) {
      items {
        id
        _version
        _lastChangedAt
        _deleted
        path
        mimeType
        identityId
        owner
      }
    }
  }
`;

const UPDATE_FILE = /* GraphQL */ `
  mutation UpdateFile($input: UpdateFileInput!) {
    updateFile(input: $input) {
      id
      _version
      _lastChangedAt
      _deleted
      thumbnail
    }
  }
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDataClient() {
  if (!dataClient) {
    dataClient = generateClient<Schema>({ authMode: "iam" });
  }
  return dataClient;
}

function isImage(mimeType: string | null | undefined): boolean {
  return !!mimeType && IMAGE_MIME_TYPES.has(mimeType);
}

function isPdf(mimeType: string | null | undefined): boolean {
  return mimeType === "application/pdf";
}

/**
 * Download file from S3 as a Buffer
 */
async function downloadFromS3(key: string): Promise<Buffer> {
  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
  );
  const stream = response.Body;
  if (!stream) throw new Error(`Empty response for key: ${key}`);

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Upload buffer to S3
 */
async function uploadToS3(
  key: string,
  data: Buffer,
  contentType: string,
): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType,
    }),
  );
}

// ---------------------------------------------------------------------------
// Image processing
// ---------------------------------------------------------------------------

interface ProcessedVariant {
  name: string;
  path: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Process an image into multiple WebP variants (fan-out: all sizes in parallel)
 */
async function processImageVariants(
  sourceBuffer: Buffer,
  fileId: string,
  identityId: string,
): Promise<ProcessedVariant[]> {
  // Get source image metadata to determine which variants to generate
  const metadata = await sharp(sourceBuffer).metadata();
  const sourceWidth = metadata.width || 0;

  // Filter variants that need generating (skip upscaling except thumbnail)
  const variantsToGenerate = IMAGE_VARIANTS.filter(
    (variant) => variant.name === "thumbnail" || variant.width <= sourceWidth,
  );

  // Fan-out: process + upload all variants in parallel
  const results = await Promise.allSettled(
    variantsToGenerate.map(async (variant) => {
      const processed = await sharp(sourceBuffer)
        .resize(variant.width, undefined, {
          fit: "inside",
          withoutEnlargement: variant.name !== "thumbnail",
        })
        .webp({ quality: 80, effort: 4 })
        .toBuffer({ resolveWithObject: true });

      const outputKey = `protected/${identityId}/${fileId}/${variant.name}.webp`;

      await uploadToS3(outputKey, processed.data, "image/webp");

      console.log(
        `[ImageProcess] Generated ${variant.name}: ${processed.info.width}x${processed.info.height} (${processed.info.size} bytes)`,
      );

      return {
        name: variant.name,
        path: outputKey,
        width: processed.info.width,
        height: processed.info.height,
        size: processed.info.size,
      } as ProcessedVariant;
    }),
  );

  // Collect successful results, log failures
  const successfulVariants: ProcessedVariant[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      successfulVariants.push(result.value);
    } else {
      console.error(
        `[ImageProcess] Failed to generate variant:`,
        result.reason,
      );
    }
  }

  return successfulVariants;
}

/**
 * Generate a thumbnail from a PDF's first page using pdf-to-img
 */
async function processPdfThumbnail(
  sourceBuffer: Buffer,
  fileId: string,
  identityId: string,
): Promise<ProcessedVariant | null> {
  try {
    const { pdf } = await import("pdf-to-img");

    // Get first page as PNG buffer
    const pages = pdf(sourceBuffer, { scale: 2 });
    let firstPageBuffer: Buffer | null = null;

    for await (const page of pages) {
      firstPageBuffer = Buffer.from(page);
      break; // Only need first page
    }

    if (!firstPageBuffer) {
      console.warn("[ImageProcess] No pages in PDF");
      return null;
    }

    // Convert to WebP thumbnail
    const processed = await sharp(firstPageBuffer)
      .resize(300, undefined, { fit: "inside" })
      .webp({ quality: 80, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    const outputKey = `protected/${identityId}/${fileId}/thumbnail.webp`;
    await uploadToS3(outputKey, processed.data, "image/webp");

    console.log(
      `[ImageProcess] Generated PDF thumbnail: ${processed.info.width}x${processed.info.height}`,
    );

    return {
      name: "thumbnail",
      path: outputKey,
      width: processed.info.width,
      height: processed.info.height,
      size: processed.info.size,
    };
  } catch (error) {
    console.error("[ImageProcess] PDF thumbnail generation failed:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

/** GraphQL mutation: processFileImage(fileID) */
async function handleProcessFileImage(args: any): Promise<string> {
  const { fileID } = args;
  const client = getDataClient();

  const { data, errors } = (await client.graphql({
    query: GET_FILE,
    variables: { id: fileID },
  })) as any;

  if (errors || !data?.getFile) {
    throw new Error(`File not found: ${fileID}`);
  }

  const file = data.getFile;

  if (!isImage(file.mimeType) && !isPdf(file.mimeType)) {
    throw new Error(
      `Unsupported file type for image processing: ${file.mimeType}`,
    );
  }

  let thumbnailPath: string | null = null;

  if (isImage(file.mimeType)) {
    // Download source and fan-out variant generation in parallel
    const sourceBuffer = await downloadFromS3(file.path);
    const variants = await processImageVariants(
      sourceBuffer,
      file.id,
      file.identityId,
    );
    thumbnailPath = variants.find((v) => v.name === "thumbnail")?.path || null;
  } else if (isPdf(file.mimeType)) {
    const sourceBuffer = await downloadFromS3(file.path);
    const result = await processPdfThumbnail(
      sourceBuffer,
      file.id,
      file.identityId,
    );
    thumbnailPath = result?.path || null;
  }

  // Update File record with thumbnail path
  if (thumbnailPath) {
    await client.graphql({
      query: UPDATE_FILE,
      variables: {
        input: {
          id: file.id,
          thumbnail: thumbnailPath,
          _version: file._version ?? 1,
        },
      },
    });
  }

  return JSON.stringify({
    fileId: file.id,
    thumbnail: thumbnailPath,
    status: "COMPLETE",
  });
}

/** S3 EventBridge Object Created event */
async function handleS3Event(event: any): Promise<void> {
  const client = getDataClient();
  const key = event.detail?.object?.key;

  if (!key) {
    console.warn("[ImageProcess] EventBridge S3 event missing object key");
    return;
  }

  console.log(`[ImageProcess] S3 upload detected: ${key}`);

  // Skip if this is already a processed variant (avoid infinite loop)
  const variantNames = IMAGE_VARIANTS.map((v) => v.name);
  if (variantNames.some((name) => key.includes(`/${name}.webp`))) {
    console.log("[ImageProcess] Skipping processed variant file");
    return;
  }

  // Look up File record by path
  const { data, errors } = (await client.graphql({
    query: LIST_FILES_BY_PATH,
    variables: { filter: { path: { eq: key } } },
  })) as any;

  if (errors) {
    console.error("[ImageProcess] GraphQL error:", errors);
    return;
  }

  const file = data?.listFiles?.items?.[0];
  if (!file) {
    console.warn(`[ImageProcess] No File record for path: ${key}, skipping`);
    return;
  }

  if (!isImage(file.mimeType) && !isPdf(file.mimeType)) {
    console.log(`[ImageProcess] Skipping non-image/PDF file: ${file.mimeType}`);
    return;
  }

  try {
    let thumbnailPath: string | null = null;

    if (isImage(file.mimeType)) {
      const sourceBuffer = await downloadFromS3(file.path);
      const variants = await processImageVariants(
        sourceBuffer,
        file.id,
        file.identityId,
      );
      thumbnailPath =
        variants.find((v) => v.name === "thumbnail")?.path || null;
    } else if (isPdf(file.mimeType)) {
      const sourceBuffer = await downloadFromS3(file.path);
      const result = await processPdfThumbnail(
        sourceBuffer,
        file.id,
        file.identityId,
      );
      thumbnailPath = result?.path || null;
    }

    if (thumbnailPath) {
      await client.graphql({
        query: UPDATE_FILE,
        variables: {
          input: {
            id: file.id,
            thumbnail: thumbnailPath,
            _version: file._version ?? 1,
          },
        },
      });
      console.log(
        `[ImageProcess] Updated file ${file.id} thumbnail: ${thumbnailPath}`,
      );
    }
  } catch (error) {
    console.error(`[ImageProcess] Failed to process file ${file.id}:`, error);
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export const handler: Handler = async (event, _context) => {
  console.log("[ImageProcess] Event:", JSON.stringify(event, null, 2));

  // 1. EventBridge S3 Object Created event
  if (event.source === "aws.s3" && event["detail-type"] === "Object Created") {
    const key = event.detail?.object?.key;
    if (!key) return;

    // Check file extension for images and PDFs
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".avif",
      ".tiff",
      ".bmp",
    ];
    const lowerKey = key.toLowerCase();

    const isImageFile = imageExtensions.some((ext) => lowerKey.endsWith(ext));
    const isPdfFile = lowerKey.endsWith(".pdf");

    if (!isImageFile && !isPdfFile) {
      console.log(`[ImageProcess] Skipping non-image/PDF file: ${key}`);
      return;
    }

    return handleS3Event(event);
  }

  // 2. GraphQL resolver (processFileImage mutation)
  const fieldName = event.fieldName || event.info?.fieldName;
  if (fieldName === "processFileImage") {
    return handleProcessFileImage(event.arguments);
  }

  console.warn("[ImageProcess] Unknown event type");
};
