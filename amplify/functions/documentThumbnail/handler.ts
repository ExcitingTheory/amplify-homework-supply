/**
 * Document Thumbnail Lambda Handler
 *
 * Converts document files to a first-page WebP thumbnail using LibreOffice (via Lambda layer)
 * and Sharp for final image processing.
 *
 * Pipeline:
 * 1. Download document from S3
 * 2. Convert to PDF using LibreOffice (`libreoffice --headless --convert-to pdf`)
 * 3. Render PDF page 1 to PNG using pdf-to-img (or poppler via the layer)
 * 4. Convert PNG to WebP via Sharp
 * 5. Upload thumbnail to S3 at protected/{identityId}/{fileId}/thumbnail.webp
 * 6. Update File.thumbnail field via GraphQL
 *
 * Entry points:
 * - GraphQL mutation: processDocumentThumbnail(fileID)
 * - EventBridge S3 Object Created event (document extensions)
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
import { execSync } from "child_process";
import {
  writeFileSync,
  readFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  unlinkSync,
} from "fs";
import { join, extname } from "path";
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
const TMP_DIR = "/tmp";

// LibreOffice binary path (from Lambda layer)
const LIBREOFFICE_PATH = "/opt/libreoffice/program/soffice.bin";

const s3Client = new S3Client({ region: REGION });

/** Document MIME types supported for conversion */
const DOCUMENT_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/epub+zip",
  "application/rtf",
  // Edu LMS export/upload formats
  "application/x-imscc+zip",
  "application/x-qti+xml",
  "text/x-gift",
  "application/zip",
]);

/** File extensions that this handler should process (including edu LMS formats) */
const DOCUMENT_EXTENSIONS = [
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".odt",
  ".ods",
  ".odp",
  ".txt",
  ".md",
  ".csv",
  ".epub",
  ".rtf",
  // Edu LMS export/upload formats
  ".imscc",
  ".qti",
  ".gift",
  ".zip",
];

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
      name
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
        name
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

function isDocument(mimeType: string | null | undefined): boolean {
  return !!mimeType && DOCUMENT_MIME_TYPES.has(mimeType);
}

async function downloadFromS3(key: string): Promise<Buffer> {
  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
  );
  const stream = response.Body;
  if (!stream) throw new Error(`Empty response for key: ${key}`);

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

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
// Document conversion pipeline
// ---------------------------------------------------------------------------

/**
 * Convert a document to PDF using LibreOffice headless mode.
 * Returns the path to the generated PDF in /tmp.
 */
function convertToPdf(inputPath: string): string {
  const outputDir = join(TMP_DIR, "pdf-output");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // LibreOffice needs HOME and a profile directory
  const profileDir = join(TMP_DIR, "lo-profile");
  if (!existsSync(profileDir)) {
    mkdirSync(profileDir, { recursive: true });
  }

  const cmd = [
    LIBREOFFICE_PATH,
    "--headless",
    "--norestore",
    "--invisible",
    "--nodefault",
    "--nofirststartwizard",
    "--nologo",
    "--nocrashreport",
    `"-env:UserInstallation=file://${profileDir}"`,
    "--convert-to",
    "pdf",
    "--outdir",
    outputDir,
    inputPath,
  ].join(" ");

  console.log("[DocumentThumbnail] Running LibreOffice:", cmd);

  execSync(cmd, {
    timeout: 120000, // 2 minutes max for conversion
    env: {
      ...process.env,
      HOME: TMP_DIR,
      FONTCONFIG_PATH: "/opt/etc/fonts",
    },
  });

  // Find the generated PDF
  const files = readdirSync(outputDir);
  const pdfFile = files.find((f) => f.endsWith(".pdf"));

  if (!pdfFile) {
    throw new Error(
      `LibreOffice did not produce a PDF. Files in output: ${files.join(", ")}`,
    );
  }

  return join(outputDir, pdfFile);
}

/**
 * Render the first page of a PDF to a WebP thumbnail.
 */
async function pdfPageToWebp(pdfBuffer: Buffer): Promise<Buffer> {
  const { pdf } = await import("pdf-to-img");
  const pages = pdf(pdfBuffer, { scale: 2 });

  let firstPageBuffer: Buffer | null = null;
  for await (const page of pages) {
    firstPageBuffer = Buffer.from(page);
    break;
  }

  if (!firstPageBuffer) {
    throw new Error("PDF has no pages");
  }

  // Convert to WebP with Sharp
  const result = await sharp(firstPageBuffer)
    .resize(300, undefined, { fit: "inside" })
    .webp({ quality: 80, effort: 4 })
    .toBuffer();

  return result;
}

// ---------------------------------------------------------------------------
// Edu LMS format pre-processing
// ---------------------------------------------------------------------------

/** Extensions that are ZIP-based edu packages (need manifest extraction) */
const ZIP_EDU_EXTENSIONS = new Set([".imscc", ".zip"]);

/** Extensions that are text-based edu formats (render as plain text) */
const TEXT_EDU_EXTENSIONS = new Set([".gift", ".qti"]);

/**
 * Pre-process edu LMS formats into something LibreOffice can render.
 *
 * - ZIP packages (.imscc, .zip/SCORM): Extract the manifest or first HTML/text content
 *   and write it as a renderable file for LibreOffice.
 * - Text-based formats (.gift, .qti): Rename to .txt so LibreOffice renders as plain text.
 *
 * Returns the path to the file that should be passed to convertToPdf().
 * If no pre-processing needed, returns null (use original file).
 */
function preprocessEduFormat(
  sourceBuffer: Buffer,
  fileName: string,
  fileId: string,
): string | null {
  const ext = extname(fileName).toLowerCase();

  // Text-based edu formats → write as .txt for LibreOffice
  if (TEXT_EDU_EXTENSIONS.has(ext)) {
    const txtPath = join(TMP_DIR, `input-${fileId}-content.txt`);
    writeFileSync(txtPath, sourceBuffer);
    console.log(`[DocumentThumbnail] Pre-processed ${ext} as plain text`);
    return txtPath;
  }

  // ZIP-based packages → extract representative content
  if (ZIP_EDU_EXTENSIONS.has(ext)) {
    return extractZipContent(sourceBuffer, fileId);
  }

  return null;
}

/**
 * Extract representative content from a ZIP-based edu package.
 * Looks for manifests (imsmanifest.xml), HTML content, or text files.
 * Uses the `unzip` command available in Lambda runtime.
 */
function extractZipContent(
  sourceBuffer: Buffer,
  fileId: string,
): string | null {
  const zipPath = join(TMP_DIR, `input-${fileId}.zip`);
  const extractDir = join(TMP_DIR, `extract-${fileId}`);

  writeFileSync(zipPath, sourceBuffer);
  mkdirSync(extractDir, { recursive: true });

  try {
    // List ZIP contents to find best candidate
    const listOutput = execSync(`unzip -l "${zipPath}" 2>/dev/null || true`, {
      encoding: "utf-8",
      timeout: 10000,
    });

    // Priority order for representative content:
    // 1. imsmanifest.xml (SCORM/IMS CC manifest)
    // 2. First .html file (index.html preferred)
    // 3. First .htm file
    // 4. First .xml file
    // 5. First .txt file
    const lines = listOutput.split("\n");
    const fileList = lines
      .map((line) => line.trim().split(/\s+/).pop() || "")
      .filter((f) => f && !f.endsWith("/"));

    const candidates = [
      fileList.find((f) => f.toLowerCase().endsWith("imsmanifest.xml")),
      fileList.find((f) => f.toLowerCase().includes("index.html")),
      fileList.find((f) => f.toLowerCase().endsWith(".html")),
      fileList.find((f) => f.toLowerCase().endsWith(".htm")),
      fileList.find((f) => f.toLowerCase().endsWith(".xml")),
      fileList.find((f) => f.toLowerCase().endsWith(".txt")),
    ];

    const target = candidates.find((c) => c != null);

    if (!target) {
      console.warn("[DocumentThumbnail] No renderable content found in ZIP");
      // Fallback: write file listing as text
      const listingPath = join(TMP_DIR, `input-${fileId}-listing.txt`);
      const listing = `Package Contents:\n${"=".repeat(40)}\n${fileList.join("\n")}`;
      writeFileSync(listingPath, listing);
      return listingPath;
    }

    // Extract the target file
    execSync(`unzip -o -j "${zipPath}" "${target}" -d "${extractDir}"`, {
      timeout: 15000,
    });

    const extractedName = target.split("/").pop() || target;
    const extractedPath = join(extractDir, extractedName);

    if (!existsSync(extractedPath)) {
      console.warn(
        `[DocumentThumbnail] Extracted file not found: ${extractedPath}`,
      );
      return null;
    }

    // If it's HTML/HTM, LibreOffice can render it directly
    const extractedExt = extname(extractedName).toLowerCase();
    if ([".html", ".htm"].includes(extractedExt)) {
      return extractedPath;
    }

    // For XML (manifests), rename to .txt for plain text rendering
    const txtPath = join(TMP_DIR, `input-${fileId}-manifest.txt`);
    const content = readFileSync(extractedPath, "utf-8");
    writeFileSync(txtPath, content);
    console.log(`[DocumentThumbnail] Extracted ${target} from ZIP as text`);
    return txtPath;
  } catch (error) {
    console.error("[DocumentThumbnail] ZIP extraction failed:", error);
    // Fallback: create a text file with the error info
    const fallbackPath = join(TMP_DIR, `input-${fileId}-fallback.txt`);
    writeFileSync(
      fallbackPath,
      `Educational Package\n\nFile: ${fileId}\nFormat could not be fully extracted for thumbnail preview.`,
    );
    return fallbackPath;
  }
}

/**
 * Full pipeline: document → PDF → page 1 → WebP thumbnail
 * Handles edu LMS formats via pre-processing before LibreOffice conversion.
 */
async function generateDocumentThumbnail(
  sourceBuffer: Buffer,
  fileName: string,
  fileId: string,
  identityId: string,
): Promise<string | null> {
  try {
    // Pre-process edu LMS formats (ZIP packages, GIFT, QTI)
    // Returns a renderable file path, or null if no pre-processing needed
    const preprocessedPath = preprocessEduFormat(
      sourceBuffer,
      fileName,
      fileId,
    );

    let inputPath: string;
    if (preprocessedPath) {
      inputPath = preprocessedPath;
    } else {
      // Standard document — write source directly to /tmp
      inputPath = join(TMP_DIR, `input-${fileId}-${fileName}`);
      writeFileSync(inputPath, sourceBuffer);
    }

    // Convert to PDF via LibreOffice
    console.log(`[DocumentThumbnail] Converting ${fileName} to PDF...`);
    const pdfPath = convertToPdf(inputPath);
    console.log(`[DocumentThumbnail] PDF generated at: ${pdfPath}`);

    // Read PDF and render to WebP
    const pdfBuffer = readFileSync(pdfPath);
    const webpBuffer = await pdfPageToWebp(pdfBuffer);

    // Upload thumbnail
    const outputKey = `protected/${identityId}/${fileId}/thumbnail.webp`;
    await uploadToS3(outputKey, webpBuffer, "image/webp");

    console.log(
      `[DocumentThumbnail] Thumbnail uploaded: ${outputKey} (${webpBuffer.length} bytes)`,
    );

    return outputKey;
  } catch (error) {
    console.error("[DocumentThumbnail] Pipeline failed:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

/** GraphQL mutation: processDocumentThumbnail(fileID) */
async function handleProcessDocumentThumbnail(args: any): Promise<string> {
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

  if (!isDocument(file.mimeType)) {
    throw new Error(
      `Unsupported file type for document thumbnail: ${file.mimeType}`,
    );
  }

  const sourceBuffer = await downloadFromS3(file.path);
  const thumbnailPath = await generateDocumentThumbnail(
    sourceBuffer,
    file.name || `document-${file.id}`,
    file.id,
    file.identityId,
  );

  if (thumbnailPath) {
    await client.graphql({
      query: UPDATE_FILE,
      variables: {
        input: {
          id: file.id,
          thumbnail: thumbnailPath,
          _version: file._version,
        },
      },
    });
  }

  return JSON.stringify({
    fileId: file.id,
    thumbnail: thumbnailPath,
    status: thumbnailPath ? "COMPLETE" : "FAILED",
  });
}

/** S3 EventBridge Object Created event */
async function handleS3Event(event: any): Promise<void> {
  const client = getDataClient();
  const key = event.detail?.object?.key;

  if (!key) {
    console.warn("[DocumentThumbnail] Missing object key in event");
    return;
  }

  console.log(`[DocumentThumbnail] S3 upload detected: ${key}`);

  // Skip processed thumbnails
  if (key.includes("/thumbnail.webp")) {
    return;
  }

  // Look up File record
  const { data, errors } = (await client.graphql({
    query: LIST_FILES_BY_PATH,
    variables: { filter: { path: { eq: key } } },
  })) as any;

  if (errors) {
    console.error("[DocumentThumbnail] GraphQL error:", errors);
    return;
  }

  const file = data?.listFiles?.items?.[0];
  if (!file) {
    console.warn(`[DocumentThumbnail] No File record for: ${key}`);
    return;
  }

  if (!isDocument(file.mimeType)) {
    console.log(`[DocumentThumbnail] Skipping non-document: ${file.mimeType}`);
    return;
  }

  try {
    const sourceBuffer = await downloadFromS3(file.path);
    const thumbnailPath = await generateDocumentThumbnail(
      sourceBuffer,
      file.name || `document-${file.id}`,
      file.id,
      file.identityId,
    );

    if (thumbnailPath) {
      await client.graphql({
        query: UPDATE_FILE,
        variables: {
          input: {
            id: file.id,
            thumbnail: thumbnailPath,
            _version: file._version,
          },
        },
      });
      console.log(
        `[DocumentThumbnail] Updated file ${file.id}: ${thumbnailPath}`,
      );
    }
  } catch (error) {
    console.error(`[DocumentThumbnail] Failed for ${file.id}:`, error);
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export const handler: Handler = async (event, _context) => {
  console.log("[DocumentThumbnail] Event:", JSON.stringify(event, null, 2));

  // 1. EventBridge S3 Object Created event
  if (event.source === "aws.s3" && event["detail-type"] === "Object Created") {
    const key = event.detail?.object?.key;
    if (!key) return;

    const lowerKey = key.toLowerCase();
    const isDocFile = DOCUMENT_EXTENSIONS.some((ext) => lowerKey.endsWith(ext));

    if (!isDocFile) {
      console.log(`[DocumentThumbnail] Skipping non-document: ${key}`);
      return;
    }

    return handleS3Event(event);
  }

  // 2. GraphQL resolver (processDocumentThumbnail mutation)
  const fieldName = event.fieldName || event.info?.fieldName;
  if (fieldName === "processDocumentThumbnail") {
    return handleProcessDocumentThumbnail(event.arguments);
  }

  console.warn("[DocumentThumbnail] Unknown event type");
};
