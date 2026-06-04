# File Processing Pipeline

Complete architecture documentation for the file upload and processing system.

## Overview

When a file is uploaded, multiple parallel processing pipelines are triggered depending on the file type. The system uses **fan-out** architecture — independent processors run concurrently via EventBridge and explicit GraphQL mutation calls.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FILE UPLOAD                                        │
│                                                                             │
│  Browser → S3 (uploadData) → File record → Fan-out to processors           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Architecture Diagram

```mermaid
flowchart TD
    %% Upload Entry
    Upload["User Upload<br/>(Browser)"] --> S3["S3 Upload<br/>protected/{identityId}/{subfolder}/{filename}"]
    S3 --> FileRecord["Create File Record<br/>(DynamoDB)"]

    %% Fan-out from upload
    FileRecord --> FanOut{{"Fan-Out<br/>(Parallel)"}}

    %% Branch 1: Embedding
    FanOut -->|All files| EmbedMutation["generateEmbedding<br/>(GraphQL Mutation)"]
    EmbedMutation --> EmbedLambda["Embeddings Lambda"]
    EmbedLambda --> OpenAI_Embed["OpenAI API<br/>text-embedding-3-small"]
    OpenAI_Embed --> EmbedStore["Store Embedding<br/>File.embedding"]

    %% Branch 2: Image Processing
    FanOut -->|Images + PDF| ImgMutation["processFileImage<br/>(GraphQL Mutation)"]
    FanOut -->|Images + PDF| ImgEvent["EventBridge<br/>S3 Object Created"]
    ImgMutation --> ImgLambda["imageProcess Lambda<br/>(Sharp)"]
    ImgEvent --> ImgLambda
    ImgLambda --> ImgVariants["Generate WebP Variants<br/>(Promise.allSettled)"]
    ImgVariants --> Thumb["thumbnail.webp (150px)"]
    ImgVariants --> Small["small.webp (320px)"]
    ImgVariants --> Medium["medium.webp (640px)"]
    ImgVariants --> Large["large.webp (1280px)"]
    Thumb --> S3Out["S3 Output<br/>protected/{identityId}/{fileId}/*.webp"]
    Small --> S3Out
    Medium --> S3Out
    Large --> S3Out
    S3Out --> UpdateFile1["Update File.thumbnail"]

    %% PDF thumbnail sub-path
    ImgLambda -->|PDF files| PdfRender["pdf-to-img<br/>Render page 1"]
    PdfRender --> SharpPdf["Sharp → WebP"]
    SharpPdf --> S3Out

    %% Branch 3: Document Thumbnail
    FanOut -->|Office docs| DocMutation["processDocumentThumbnail<br/>(GraphQL Mutation)"]
    FanOut -->|Office docs| DocEvent["EventBridge<br/>S3 Object Created"]
    DocMutation --> DocLambda["documentThumbnail Lambda<br/>(LibreOffice Layer + Sharp)"]
    DocEvent --> DocLambda
    DocLambda --> LibreOffice["LibreOffice Headless<br/>Convert to PDF"]
    LibreOffice --> DocPdfRender["pdf-to-img<br/>Render page 1"]
    DocPdfRender --> DocSharp["Sharp → WebP (300px)"]
    DocSharp --> DocS3["S3 Output<br/>protected/{identityId}/{fileId}/thumbnail.webp"]
    DocS3 --> UpdateFile2["Update File.thumbnail"]

    %% Branch 4: Document Analysis
    FanOut -->|Analyzable docs| AnalyzeMutation["analyzeDocument<br/>(GraphQL Mutation)"]
    AnalyzeMutation --> AnalyzeLambda["documentAnalysis Lambda"]
    AnalyzeLambda --> Extract["Text Extraction<br/>(PDF, DOCX, etc.)"]
    Extract --> Analyze["AI Analysis<br/>(Vocabulary, Summary,<br/>Objectives, Questions)"]
    Analyze --> ParsedContent["Create ParsedContent<br/>Records"]
    ParsedContent --> ContentEmbed["Generate Embeddings<br/>for extracted content"]
    ContentEmbed --> OpenAI_Embed

    %% Branch 5: Media Conversion
    FanOut -->|Audio/Video| MediaEvent["S3 OBJECT_CREATED<br/>Event (EventBridge)"]
    MediaEvent --> MediaLambda["mediaConvert Lambda"]
    MediaLambda --> MediaConvert["AWS MediaConvert<br/>Transcode to HLS"]
    MediaConvert --> HLS["HLS Output<br/>(.m3u8 + segments)"]
    HLS --> UpdateFile3["Update File.hlsUrl<br/>+ transcodeStatus"]

    %% Status tracking
    AnalyzeLambda -.->|Status updates| StatusTrack["Document.status<br/>uploaded → extracting<br/>→ analyzing → completed"]

    %% Styling
    classDef lambda fill:#f9a825,stroke:#f57f17,color:#000
    classDef s3 fill:#4caf50,stroke:#388e3c,color:#fff
    classDef db fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef api fill:#7b1fa2,stroke:#4a148c,color:#fff
    classDef event fill:#00897b,stroke:#004d40,color:#fff

    class ImgLambda,DocLambda,EmbedLambda,AnalyzeLambda,MediaLambda lambda
    class S3,S3Out,DocS3,HLS s3
    class FileRecord,EmbedStore,ParsedContent,UpdateFile1,UpdateFile2,UpdateFile3,StatusTrack db
    class OpenAI_Embed,MediaConvert api
    class ImgEvent,DocEvent,MediaEvent,FanOut event
```

## Pipeline Details

### 1. Image Processing (`imageProcess` Lambda)

| Property | Value |
|----------|-------|
| **Trigger** | `processFileImage(fileID)` mutation + EventBridge S3 Object Created |
| **Input** | Images (JPEG, PNG, GIF, WebP, TIFF, BMP, SVG) and PDF files |
| **Runtime** | Node.js 20, 1024 MB, 120s timeout |
| **Dependencies** | Sharp, pdf-to-img |
| **Output Format** | WebP (next-gen, ~30% smaller than JPEG) |

**Processing stages:**

```
Source Image → Sharp resize → Promise.allSettled (fan-out)
                              ├─ thumbnail (150px max width)
                              ├─ small (320px)
                              ├─ medium (640px)
                              └─ large (1280px)
                              All → WebP conversion → S3 upload
```

**PDF path:**
```
PDF → pdf-to-img (render page 1 at 2x scale) → Sharp → WebP thumbnail → S3
```

**S3 output paths:**
```
protected/{identityId}/{fileId}/thumbnail.webp
protected/{identityId}/{fileId}/small.webp
protected/{identityId}/{fileId}/medium.webp
protected/{identityId}/{fileId}/large.webp
```

---

### 2. Document Thumbnail (`documentThumbnail` Lambda)

| Property | Value |
|----------|-------|
| **Trigger** | `processDocumentThumbnail(fileID)` mutation + EventBridge S3 Object Created |
| **Input** | Office documents (.doc, .docx, .xls, .xlsx, .ppt, .pptx, .odt, .ods, .odp, .txt, .md, .csv, .epub, .rtf) |
| **Runtime** | Node.js 20, 1536 MB, 300s timeout |
| **Dependencies** | Sharp, pdf-to-img, LibreOffice Lambda Layer (`shelfio/libreoffice-brotli`) |
| **Output Format** | WebP thumbnail (300px max width) |

**Processing stages:**

```
Document → Download from S3
         → LibreOffice headless (--convert-to pdf)
         → pdf-to-img (render page 1)
         → Sharp (resize 300px + WebP)
         → Upload to S3
         → Update File.thumbnail via GraphQL
```

**LibreOffice Layer:**
- ARN: `arn:aws:lambda:{region}:764866452798:layer:libreoffice-brotli:1`
- Binary at: `/opt/libreoffice/program/soffice.bin`
- Requires Node.js 20 runtime, x86_64 architecture

**S3 output path:**
```
protected/{identityId}/{fileId}/thumbnail.webp
```

---

### 3. Embedding Generation (`embeddings` Lambda)

| Property | Value |
|----------|-------|
| **Trigger** | `generateEmbedding(content)` / `generateEmbeddings(fileID)` mutations |
| **Model** | OpenAI `text-embedding-3-small` |
| **Dimensions** | 512 |
| **Storage** | `File.embedding`, `ParsedContent.embedding`, `Word.embedding`, `Question.embedding` |

**Processing stages:**

```
Content (text string or file content)
  → OpenAI Embeddings API (text-embedding-3-small)
  → Vector (512 dimensions)
  → Store in S3: private/{identityId}/embeddings/{model}/{id}.json
```

**Used for:**
- Semantic search across files, vocabulary, and questions
- Content similarity matching
- AI-powered content recommendations

---

### 4. Document Analysis (`documentAnalysis` Lambda)

| Property | Value |
|----------|-------|
| **Trigger** | `analyzeDocument(fileID)` mutation |
| **Cancellation** | `cancelDocumentAnalysis(fileID)` mutation |
| **Input** | PDF, DOCX, and other text-bearing documents |
| **Output** | `Document` + `ParsedContent` records with extracted text, vocabulary, summaries |

**Status progression:**

```
uploaded → extracting → analyzing → completed
                                  ↘ cancelled (if user cancels)
                                  ↘ failed (on error)
```

**Processing stages:**

```
File in S3
  → Download document
  → Text extraction (format-specific: PDF parser, DOCX parser, etc.)
  → AI analysis (vocabulary extraction, summary, objectives, questions)
  → Create ParsedContent records (one per page/section)
  → Generate embeddings for each ParsedContent record
  → Update Document.status = 'completed'
```

**Records created:**
- `Document` — top-level analysis record with status tracking
- `ParsedContent` — individual extracted sections with:
  - `text` — raw extracted text
  - `vocabulary` — identified vocabulary words
  - `summary` — AI-generated summary
  - `embedding` — vector for semantic search

---

### 5. Media Conversion (`mediaConvert` Lambda + AWS MediaConvert)

| Property | Value |
|----------|-------|
| **Trigger** | S3 OBJECT_CREATED event via EventBridge (`S3VideoUploadRule`) |
| **Input** | Audio files (MP3, WAV, M4A, etc.) and video files (MP4, MOV, WebM, etc.) |
| **Output** | HLS streaming format (.m3u8 manifest + .ts segments) |
| **Service** | AWS Elemental MediaConvert |

**Processing stages:**

```
Audio/Video upload
  → Lambda creates MediaConvert job
  → MediaConvert transcodes to HLS
     ├─ Video: 720p, 480p, 360p bitrate ladder
     └─ Audio: AAC
  → EventBridge Job State Change notification
  → Lambda updates File.hlsUrl and File.transcodeStatus
```

**S3 output path:**
```
protected/{identityId}/{fileId}/{fileId}.m3u8    (manifest)
protected/{identityId}/{fileId}/{fileId}_*.ts    (segments)
```

---

## Complete Upload Sequence

When a user uploads a file through the browser, the following sequence executes:

```mermaid
sequenceDiagram
    participant Browser
    participant S3
    participant DynamoDB
    participant EventBridge
    participant ImageProcess
    participant DocThumbnail
    participant DocAnalysis
    participant Embeddings
    participant MediaConvert

    Browser->>S3: uploadData() to protected/{identityId}/{subfolder}/{name}
    Browser->>DynamoDB: Create File record
    
    Note over Browser: Fan-out (parallel, non-blocking)
    
    par Embedding Generation
        Browser->>Embeddings: generateEmbedding(fileID)
        Embeddings->>Embeddings: Extract content → OpenAI API
        Embeddings->>DynamoDB: Update File.embedding
    and Image/PDF Thumbnail
        Browser->>ImageProcess: processFileImage(fileID)
        ImageProcess->>S3: Download source
        ImageProcess->>S3: Upload WebP variants
        ImageProcess->>DynamoDB: Update File.thumbnail
    and Document Thumbnail (office docs only)
        Browser->>DocThumbnail: processDocumentThumbnail(fileID)
        DocThumbnail->>S3: Download source
        DocThumbnail->>DocThumbnail: LibreOffice → PDF → WebP
        DocThumbnail->>S3: Upload thumbnail.webp
        DocThumbnail->>DynamoDB: Update File.thumbnail
    and Document Analysis (analyzable docs only)
        Browser->>DocAnalysis: analyzeDocument(fileID)
        DocAnalysis->>DynamoDB: Status: extracting
        DocAnalysis->>S3: Download document
        DocAnalysis->>DocAnalysis: Extract text + AI analysis
        DocAnalysis->>DynamoDB: Create ParsedContent records
        DocAnalysis->>Embeddings: Generate content embeddings
        DocAnalysis->>DynamoDB: Status: completed
    end

    Note over S3,EventBridge: EventBridge also fires (redundant safety net)
    S3-->>EventBridge: Object Created event
    EventBridge-->>ImageProcess: Route images/PDFs
    EventBridge-->>DocThumbnail: Route office docs
    EventBridge-->>MediaConvert: Route audio/video
```

## File Type Routing

| File Type | Image Process | Doc Thumbnail | Doc Analysis | Embeddings | Media Convert |
|-----------|:---:|:---:|:---:|:---:|:---:|
| JPEG, PNG, GIF, WebP, TIFF, BMP, SVG | ✅ | — | — | ✅ | — |
| PDF | ✅ (page 1) | — | ✅ | ✅ | — |
| DOC, DOCX | — | ✅ | ✅ | ✅ | — |
| XLS, XLSX | — | ✅ | — | ✅ | — |
| PPT, PPTX | — | ✅ | ✅ | ✅ | — |
| ODF (.odt, .ods, .odp) | — | ✅ | ✅ | ✅ | — |
| TXT, MD, CSV, RTF | — | ✅ | ✅ | ✅ | — |
| EPUB | — | ✅ | ✅ | ✅ | — |
| MP3, WAV, M4A, AAC | — | — | — | ✅ | ✅ |
| MP4, MOV, WebM | — | — | — | ✅ | ✅ |

## Dual-Trigger Pattern (Redundancy)

Each processor is triggered **two ways** for reliability:

1. **Explicit mutation call** — immediate, triggered by the browser after upload
2. **EventBridge S3 Object Created** — automatic, triggered by S3 (safety net for retries, re-uploads, or direct S3 writes)

Both triggers are idempotent — the Lambda checks if processing is already complete before re-running.

## S3 Path Convention

```
protected/{identityId}/
├── images/{filename}           ← Source image uploads
├── audio/{filename}            ← Source audio uploads
├── files/{filename}            ← Source document uploads
└── {fileId}/
    ├── thumbnail.webp          ← 150px (images/PDF) or 300px (documents)
    ├── small.webp              ← 320px (images only)
    ├── medium.webp             ← 640px (images only)
    ├── large.webp              ← 1280px (images only)
    └── {fileId}.m3u8           ← HLS manifest (audio/video)
```

## Infrastructure (CDK / Amplify Gen 2)

| Resource | Stack | Purpose |
|----------|-------|---------|
| `S3ImageUploadRule` | EventBridge Rule | Routes image/PDF uploads to imageProcess |
| `S3DocumentUploadRule` | EventBridge Rule | Routes document uploads to documentThumbnail |
| `LibreOfficeLayer` | Lambda Layer | LibreOffice binary for document conversion |
| `ImageProcessAppSyncPolicy` | IAM Policy | GraphQL access for imageProcess |
| `DocumentThumbnailAppSyncPolicy` | IAM Policy | GraphQL access for documentThumbnail |
| Storage bucket `grantReadWrite` | S3 IAM | Read source files, write processed output |

## Environment Variables

Both Lambda functions require:

| Variable | Source |
|----------|--------|
| `API_ENDPOINT` | AppSync GraphQL URL |
| `STORAGE_BUCKET` | S3 bucket name |
| `AWS_REGION` | Auto-provided by Lambda runtime |
