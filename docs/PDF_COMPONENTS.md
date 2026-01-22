# PDF Thumbnail & Viewer Components

React components for rendering PDF thumbnails and viewing PDF documents using `react-pdf`.

## ⚡ Performance Note

**For file listings and repeated views, always use pre-generated thumbnails saved to S3.**

The `SavedPdfThumbnail` component displays pre-generated images from S3, which is much more efficient than rendering PDFs on-the-fly with `PdfThumbnail`. Generate thumbnails once during document upload/processing, not on every view.

## Architecture

### Two-Phase Approach

1. **Generation Phase** (during upload/processing)
   - Use `generateAndUploadThumbnails()` to create thumbnails
   - Save thumbnail S3 keys to File model's `thumbnailKeys` field
   - Happens once per document

2. **Display Phase** (during viewing)
   - Use `SavedPdfThumbnail` component
   - Loads pre-generated images from S3
   - Fast and efficient for repeated views

## Components

### SavedPdfThumbnail (Recommended)

**Use this for file listings, document references, and repeated views.**

Displays pre-generated PDF thumbnails from S3. Much more performant than rendering PDFs on-the-fly.

```tsx
import SavedPdfThumbnail from '@/components/SavedPdfThumbnail';

<SavedPdfThumbnail
  thumbnailKey="thumbnails/user123/file456/page-1.jpg"
  identityId={identityId}
  level="protected"
  width={150}
  pageNumber={1}
  onClick={() => openDocument(docId, 1)}
/>
```

**Props:**
- `thumbnailKey` (string, required): S3 key of the thumbnail image
- `identityId` (string): AWS Cognito identity ID for protected files
- `level` ('public' | 'protected' | 'private', default: 'protected'): Storage level
- `width` (number, default: 150): Width of the thumbnail
- `height` (number): Height (defaults to A4 aspect ratio)
- `alt` (string): Alt text for accessibility
- `showBorder` (boolean, default: true): Whether to show border
- `onClick` (function): Click handler
- `pageNumber` (number): Page number to show in overlay

### PdfThumbnail (On-Demand Rendering)

**Only use for one-time rendering or thumbnail generation.**

Renders PDF pages on-the-fly. Less efficient for repeated views.

```tsx
import PdfThumbnail from '@/components/PdfThumbnail';

<PdfThumbnail
  url={pdfUrl}
  pageNumber={1}
  width={150}
  showPageNumber={true}
/>
```

### SavedPdfThumbnailGrid

Display multiple saved thumbnails in a grid.

```tsx
import { SavedPdfThumbnailGrid } from '@/components/SavedPdfThumbnail';

<SavedPdfThumbnailGrid
  thumbnailKeys={file.thumbnailKeys}
  identityId={identityId}
  thumbnailWidth={120}
  onPageClick={(pageIndex) => setCurrentPage(pageIndex + 1)}
/>
```

### PdfViewerComponent

Enhanced PDF viewer with navigation and zoom controls, now using react-pdf's Document/Page rendering instead of iframe.

```tsx
import PdfViewerComponent from '@/components/Editor3/components/PdfViewerComponent';

<PdfViewerComponent
  path="protected/document.pdf"
  identityId={identityId}
  filename="My Document.pdf"
  nodeKey={nodeKey}
/>
```

**Features:**
- Page navigation with previous/next buttons
- Zoom in/out controls
- Page number display
- Canvas-based rendering (better performance than iframe)
- Selectable and deletable (Lexical integration)
- Keyboard shortcuts

## Utilities

### generateAndUploadThumbnails()

Generate thumbnails for PDF pages and upload to S3 during document processing.

```tsx
import { generateAndUploadThumbnails } from '@/utils/pdfThumbnailGenerator';

// During PDF upload/analysis
const result = await generateAndUploadThumbnails(
  pdfUrl,
  fileId,
  identityId,
  { width: 300, quality: 0.85, format: 'jpeg' },
  5, // max pages
  (current, total) => console.log(`${current}/${total}`)
);

// Save to File model
await client.models.File.update({
  id: fileId,
  thumbnailKeys: result.thumbnailKeys,
});
```

### generateSingleThumbnail()

Generate just the first page thumbnail (for quick preview).

```tsx
import { generateSingleThumbnail } from '@/utils/pdfThumbnailGenerator';

const thumbnailKey = await generateSingleThumbnail(
  pdfUrl,
  fileId,
  identityId,
  1, // page number
  { width: 300, format: 'jpeg' }
);
```

### getThumbnailKey()

Construct S3 key for a thumbnail without generating.

```tsx
import { getThumbnailKey } from '@/utils/pdfThumbnailGenerator';

const key = getThumbnailKey(fileId, identityId, 1, 'jpeg');
// Returns: "thumbnails/{identityId}/{fileId}/page-1.jpg"
```

## Hooks

### usePdfInfo

Hook for loading PDF metadata.

```tsx
import { usePdfInfo } from '@/hooks/usePdfThumbnail';

const { info, loading, error } = usePdfInfo(pdfUrl);

if (info) {
  console.log(`${info.numPages} pages`);
  console.log(`Title: ${info.title}`);
}
```

### usePdfThumbnailDataUrl

Hook for generating PDF thumbnail as data URL (for temporary use).

```tsx
import { usePdfThumbnailDataUrl } from '@/hooks/usePdfThumbnail';

const { dataUrl, loading, error } = usePdfThumbnailDataUrl({
  url: pdfUrl,
  pageNumber: 1,
  width: 150,
});
```

## Usage Examples

### Complete Workflow: Upload PDF with Thumbnail Generation

```tsx
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { generateAndUploadThumbnails } from '@/utils/pdfThumbnailGenerator';
import getCachedUrl from '@/utils/getCachedUrl';

const client = generateClient();

async function uploadPdfWithThumbnails(file: File, identityId: string) {
  // 1. Upload PDF to S3
  const fileId = generateId();
  const s3Key = `documents/${identityId}/${fileId}.pdf`;
  
  await uploadData({
    key: s3Key,
    data: file,
    options: { contentType: 'application/pdf' },
  }).result;

  // 2. Get signed URL for thumbnail generation
  const pdfUrl = await getCachedUrl(s3Key, 'protected', identityId);

  // 3. Generate thumbnails (first 5 pages)
  const result = await generateAndUploadThumbnails(
    pdfUrl,
    fileId,
    identityId,
    { width: 300, quality: 0.85, format: 'jpeg' },
    5,
    (current, total) => {
      console.log(`Generating thumbnail ${current}/${total}`);
    }
  );

  // 4. Create File record with thumbnail keys
  await client.models.File.create({
    path: s3Key,
    name: file.name,
    mimeType: 'application/pdf',
    size: file.size,
    level: 'PROTECTED',
    identityId,
    thumbnailKeys: result.thumbnailKeys,
  });

  console.log(`PDF uploaded with ${result.thumbnailKeys.length} thumbnails`);
}
```

### File Listing with Saved Thumbnails

```tsx
import SavedPdfThumbnail from '@/components/SavedPdfThumbnail';

function DocumentList({ files }: { files: File[] }) {
  return (
    <List>
      {files.map((file) => (
        <ListItem key={file.id}>
          {file.thumbnailKeys?.[0] && (
            <SavedPdfThumbnail
              thumbnailKey={file.thumbnailKeys[0]}
              identityId={file.identityId}
              width={80}
              onClick={() => openDocument(file.id)}
            />
          )}
          <ListItemText
            primary={file.name}
            secondary={`${file.thumbnailKeys?.length || 0} pages`}
          />
        </ListItem>
      ))}
    </List>
  );
}
```

### Document Reference Badge with Thumbnail

```tsx
import { useState } from 'react';
import { Chip, Popover } from '@mui/material';
import SavedPdfThumbnail from '@/components/SavedPdfThumbnail';

function DocumentSourceBadge({ file, page }: { file: File; page: number }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const thumbnailKey = file.thumbnailKeys?.[page - 1];

  return (
    <>
      <Chip
        label={`${file.name} - p.${page}`}
        size="small"
        onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
        onMouseLeave={() => setAnchorEl(null)}
        onClick={() => openDocument(file.id, page)}
      />
      
      {thumbnailKey && (
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          disableRestoreFocus
          sx={{ pointerEvents: 'none' }}
        >
          <SavedPdfThumbnail
            thumbnailKey={thumbnailKey}
            identityId={file.identityId}
            width={200}
            pageNumber={page}
          />
        </Popover>
      )}
    </>
  );
}
```

## Configuration

The PDF.js worker is configured automatically in both components:

```javascript
pdfjs.GlobalWorkerOptions.workerSrc = 
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
```

## Styling

Both components use MUI's theming system and can be customized via `sx` props:

```tsx
<PdfThumbnail
  url={url}
  sx={{
    border: '2px solid red',
    borderRadius: 2,
  }}
/>
```

## Performance Considerations

1. **Caching**: Use `usePdfThumbnailDataUrl` to generate thumbnails once and cache them
2. **Lazy Loading**: Wrap components in `React.lazy()` for code splitting
3. **Virtual Scrolling**: Use with TanStack Virtual for large document lists
4. **Worker**: PDF.js worker runs in separate thread for better performance

## Browser Support

Requires browsers that support:
- Canvas API
- Web Workers
- ES6 Promises

All modern browsers (Chrome, Firefox, Safari, Edge) are supported.

## Troubleshooting

### CORS Issues

If you see CORS errors, ensure your S3 bucket has proper CORS configuration:

```json
{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET"],
  "AllowedHeaders": ["*"]
}
```

### Worker Loading Errors

If the worker fails to load, check the browser console and ensure:
1. Worker URL is accessible
2. CSP headers allow worker-src from CDN
3. Network isn't blocking CDN requests

### Memory Issues with Large PDFs

For very large PDFs (>50MB):
1. Show thumbnails for first few pages only
2. Use lower resolution (smaller width)
3. Implement pagination for thumbnail grids
