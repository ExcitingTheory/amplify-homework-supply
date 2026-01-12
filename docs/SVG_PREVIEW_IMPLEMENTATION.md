# SVG Preview & Published Status Implementation

## ✅ Completed Changes

### 1. Schema Updates
Added `previewSvg` field to both Unit and Section models in [schema.graphql](amplify/backend/api/japanese5/schema.graphql):
- ✅ Line ~326: Added `previewSvg: String # SVG vector format (scalable, text-searchable)` to Unit model
- ✅ Line ~250: Added `previewSvg: String # SVG vector format (scalable, text-searchable)` to Section model

### 2. Frontend Utils Updated
Updated [src/utils/previewUtils.js](src/utils/previewUtils.js):
- ✅ `getPreviewUrl()`: Added 'svg' to size map
- ✅ `hasPreview()`: Checks for `previewSvg` field
- ✅ `getBestPreview()`: Prefers SVG by default (new `preferVector` param)

### 3. Lambda Implementation Guide Created
Created [SVG_IMPLEMENTATION.js](amplify/backend/function/generatePreviews/SVG_IMPLEMENTATION.js) with:
- ✅ Complete `renderLexicalToSVG()` function (~150 lines)
- ✅ Updated `generatePreviews()` function signature and SVG upload logic
- ✅ Updated `generateUnitPreview()` with published status check
- ✅ Updated `generateSectionPreview()` to generate SVG

## 🔧 Remaining Implementation Steps

### Step 1: Update the Lambda Function

You need to manually integrate the code from `SVG_IMPLEMENTATION.js` into [amplify/backend/function/generatePreviews/src/index.js](amplify/backend/function/generatePreviews/src/index.js):

1. **Add the `renderLexicalToSVG()` function** (insert after `renderLexicalToCanvas`)
2. **Update `generatePreviews()` function**:
   - Change signature to: `async function generatePreviews(sourceBuffer, baseKey, svgBuffer = null)`
   - Add `svg: null` to previews object
   - Add SVG upload block after previews initialization
3. **Update `generateUnitPreview()` function**:
   - Add `status` to destructured unit variables
   - Add published check before generating previews
   - Generate SVG buffer: `const svgBuffer = renderLexicalToSVG(data);`
   - Pass `svgBuffer` to `generatePreviews()`: `await generatePreviews(renderedImage, basePath, svgBuffer)`
   - Update `UpdateExpression` and `ExpressionAttributeValues` to include `:svg` 
4. **Update `generateSectionPreview()` function**:
   - Generate SVG buffer before rendering
   - Pass `svgBuffer` to `generatePreviews()`
   - Update DynamoDB update to include `previewSvg`

### Step 2: Deploy Changes

```bash
# Deploy schema and Lambda updates
amplify push

# Increment SCHEMA_VERSION in pages/_app.js to clear DataStore cache
# (Change the number to trigger client-side cache clear)
```

### Step 3: Test the Implementation

1. **Test Published Status Check**:
   - Edit a draft Unit → Save → Verify NO preview generated
   - Publish the Unit → Save → Verify preview IS generated

2. **Test SVG Generation**:
   - Save a published Unit with rich text
   - Check S3 for `.svg` file at `protected/{identityId}/previews/unit-{id}.svg`
   - Verify SVG contains proper XML and renders correctly

3. **Test Preview Loading**:
   ```javascript
   import { getPreviewUrl, getBestPreview } from '../utils/previewUtils';
   
   // Get SVG specifically
   const svgUrl = await getPreviewUrl(unit, 'svg', 'protected');
   
   // Get best preview (prefers SVG by default)
   const bestUrl = await getBestPreview(unit, 'protected');
   
   // Get best raster preview (skip SVG)
   const rasterUrl = await getBestPreview(unit, 'protected', false);
   ```

## 📊 Benefits of SVG Format

| Feature | SVG | PNG/WebP/AVIF |
|---------|-----|---------------|
| Scalability | ✅ Infinite | ❌ Pixelates when scaled |
| File Size (text) | ✅ Small | ❌ Large |
| Text Searchable | ✅ Yes | ❌ No |
| Accessibility | ✅ Text selectable | ❌ Image only |
| Print Quality | ✅ Perfect | ❌ Resolution dependent |
| Browser Support | ✅ Universal | ✅ Modern browsers |
| Best For | Text-heavy content, logos | Photos, complex layouts |

## 🎯 Use Cases

**SVG Perfect For:**
- Units with mostly text (lessons, articles, documentation)
- Sections with text descriptions
- Print previews or PDF export
- High-DPI displays (Retina, 4K)
- Responsive designs that scale

**Raster (PNG/WebP) Better For:**
- Units with embedded images
- Complex custom layouts
- Thumbnail grids (consistent sizing)
- Compatibility with older tools

## 🔐 Published Status Logic

### Current Behavior:
```javascript
// BEFORE: Generated previews for ALL units on save
saveEditorContent() → generateUnitPreview(unitID) → Always generates
```

### New Behavior:
```javascript
// AFTER: Only generates for published units
saveEditorContent() → generateUnitPreview(unitID) → 
  if (status !== 'PUBLISHED') return { success: true, message: 'Skipped' }
  else → Generate SVG + raster previews
```

### Benefits:
- ✅ Saves Lambda compute costs on draft content
- ✅ Reduces S3 storage for unpublished units
- ✅ Prevents preview/content mismatch
- ✅ Clear separation between draft and published states

## 📝 GraphQL Schema Changes

### Unit Model (Added):
```graphql
previewSvg: String # SVG vector format (scalable, text-searchable)
```

### Section Model (Added):
```graphql
previewSvg: String # SVG vector format (scalable, text-searchable)
```

### No Breaking Changes:
- All additions are optional fields
- Existing preview fields unchanged
- Backwards compatible with existing code

## 🚀 Next Steps

1. ✅ Schema updated
2. ✅ Frontend utils updated
3. ⏳ **YOU NEED TO**: Manually integrate `SVG_IMPLEMENTATION.js` code into Lambda function
4. ⏳ Run `amplify push` to deploy
5. ⏳ Increment `SCHEMA_VERSION` in `_app.js`
6. ⏳ Test with published/draft units

## 📚 Reference Files

- [SVG_IMPLEMENTATION.js](amplify/backend/function/generatePreviews/SVG_IMPLEMENTATION.js) - Code to integrate
- [schema.graphql](amplify/backend/api/japanese5/schema.graphql) - Schema changes ✅
- [previewUtils.js](src/utils/previewUtils.js) - Frontend utils ✅
- [index.js](amplify/backend/function/generatePreviews/src/index.js) - Lambda to update ⏳
