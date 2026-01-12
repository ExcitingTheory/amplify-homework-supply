# SVG Preview & Published Check Implementation

## Changes Made

### 1. Schema Updates
Added `previewSvg` field to Unit and Section models for vector format storage.

### 2. Lambda Function Updates
- Added `renderLexicalToSVG()` function to generate scalable vector graphics
- Modified `generatePreviews()` to accept and upload SVG files
- Updated `generateUnitPreview()` to:
  - Check if unit status === 'PUBLISHED' before generating
  - Generate both SVG and raster formats
- Updated `generateSectionPreview()` to generate SVG

### 3. Benefits of SVG Format
- ✅ Infinitely scalable without quality loss
- ✅ Smaller file sizes for text-heavy content
- ✅ Text remains searchable and accessible
- ✅ Perfect for print/high-DPI displays
- ✅ Still generate raster thumbnails for compatibility

### 4. Published Status Check
Units will only regenerate previews when `status === 'PUBLISHED'`. This prevents:
- Wasting compute on draft content
- S3 storage costs for unpublished units
- Confusion from preview/content mismatch

## Files to Update

See attached implementation script below.
