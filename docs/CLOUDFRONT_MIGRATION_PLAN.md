# CloudFront Migration Plan

Move all S3-served media through a CloudFront distribution with Origin Access Control (OAC), enabling CDN edge caching, stable URLs, Next.js image optimization, and proper instructor-only cross-user file access.

---

## Current State Summary

| Layer | What happens today |
|---|---|
| `public/*` | All authenticated users (and guests) call `getUrl()` → S3 presigned URL (59-min TTL in `getCachedUrl`) |
| `protected/{entity_id}/*` | **Any authenticated user can read any path** — the storage policy `allow.authenticated.to(['read'])` is bucket-wide, not scoped to owners |
| `private/{entity_id}/*` | Owner-only via presigned URL **but** `allow.groups(['Admins','Instructors','Moderators','Learners'])` on private paths grants all group members read/write/delete to everyone's private files — this is a bug |
| HLS video | `.m3u8` manifest + `.ts` segments each get their own presigned URL — correct but inefficient at scale |
| `getStudentSubmissionUrl` | Called from `useStudentSubmission.js` and `app/actions/storage.ts` but **not registered in `amplify/data/resource.ts`** — instructor grade review access is currently broken |
| `next/image` | `images: { unoptimized: true }` — no optimization pipeline |
| Service worker | `s3-media-v1` cache keys presigned URLs by stripping query params via `stripS3QueryParams` |

---

## Phase 0 — Security Fixes (Do First, Independent of CloudFront)

These are existing bugs that must be fixed regardless of whether CloudFront is adopted.

### 0-A Fix `private/` storage over-permission

**File**: `amplify/storage/resource.ts`

The `allow.groups(...)` block on `private/{entity_id}/*` grants all Admins/Instructors/Moderators/Learners read+write+delete on every private path. This means any instructor can generate a presigned URL for any student's private file directly from the frontend without going through the authorization Lambda.

**Fix**: Remove the `allow.groups` entry from `private/` paths entirely. Only `allow.entity('identity')` should apply. Admin/instructor access to student files must be mediated by the Lambda (Phase 1-C), not by bucket policy.

```typescript
// amplify/storage/resource.ts — after fix
'private/{entity_id}/*': [
  allow.entity('identity').to(['read', 'write', 'delete']),
  // Removed: allow.groups(['Admins', 'Instructors', ...]) — too broad
  // Instructor cross-user access is handled by getStudentSubmissionUrl Lambda
],
```

### 0-B Verify `protected/` paths don't contain sensitive student data

The `protected/` storage rule intentionally allows all authenticated users to read. Audit whether any student-specific content (draft work, non-submission recordings) is being stored under `protected/` when it should be `private/`.

- Check `userSubmissionStorage.jsx` — currently uses `private/`, which is correct.
- Check `SketchPad.jsx` uploads — uses `uploadStudentSubmission`, which is correct.
- Check any direct `uploadData` calls in the codebase that write to `protected/`.

### 0-C Implement `getStudentSubmissionUrl` in the schema and handler

**Files**: `amplify/data/resource.ts`, `amplify/functions/section/handler.ts`

The query is called in `useStudentSubmission.js` but has no resolver. Instructor grade review is currently silently failing.

**Schema entry** in `amplify/data/resource.ts`:
```typescript
getStudentSubmissionUrl: a
  .query()
  .arguments({
    gradeId: a.id().required(),
    submissionKey: a.string().required(),
  })
  .returns(a.string())
  .authorization((allow) => [allow.group("Instructors"), allow.group("Admins")])
  .handler(a.handler.function(sectionHandler)),
```

**Lambda handler** in `amplify/functions/section/handler.ts` must:
1. Verify caller is in `Instructors` or `Admins` Cognito group (AppSync enforces the `.authorization()` above, but validate defensively)
2. Look up `Grade(gradeId)` — confirm it exists
3. Confirm the grade belongs to a Section where the caller is the instructor (`Section.owner === caller.username` OR caller is in `section-{sectionId}-instructors` group)
4. Validate `submissionKey` starts with `private/${grade.identityId}/` — reject any key that doesn't match the grade owner's identity to prevent path traversal
5. Call `getSignedUrl` (AWS SDK S3) with a short TTL (e.g., 15 minutes) and return it

---

## Phase 1 — CloudFront Distribution CDK Stack

### 1-A Create `amplify/custom/mediaCDN/resource.ts`

New CDK construct alongside the existing `mediaConvert/` and `websocket/` constructs.

**Responsibilities**:
- CloudFront distribution with OAC for the Amplify S3 bucket
- Cache behavior per path prefix (see below)
- Outputs `CDN_DOMAIN` to `amplify_outputs.json` for use at runtime

**Cache behaviors**:

| Path pattern | Cache TTL | Auth requirement |
|---|---|---|
| `public/*` | 1 year (immutable) | None — public |
| `protected/*/thumbnail.webp`, `protected/*/small.webp`, etc. | 24 hours | CloudFront signed URL |
| `protected/*/hlsOutput/*.m3u8` | No cache (manifest changes) | CloudFront signed cookie |
| `protected/*/hlsOutput/*.ts` | 24 hours | CloudFront signed cookie (same as manifest) |
| `private/*` | No cache | CloudFront signed URL (short TTL, per request) |

**OAC policy**: Grant the CloudFront distribution `s3:GetObject` on the bucket via bucket policy. Remove the existing broad IAM policies that allow any authenticated user to call `GetObject` directly.

**CDK outputs** — expose via `backend.addOutput()`:
```typescript
{
  custom: {
    CLOUDFRONT_DOMAIN: distribution.distributionDomainName,
    CLOUDFRONT_KEY_PAIR_ID: signingKey.keyPairId,
    // Private key stored in SSM, not output here
  }
}
```

### 1-B CloudFront key pair for signed URLs/cookies

- Generate an RSA key pair (4096-bit)
- Store the **private key** in AWS SSM Parameter Store as a `SecureString`
- Store the **key pair ID** in SSM as a plain string
- Reference from Lambda functions that generate signed URLs

---

## Phase 2 — URL Generation Changes

### 2-A `getCachedUrl` — public paths return CDN URL directly

**File**: `src/utils/getCachedUrl.js`

For `public/` paths, return `https://{CDN_DOMAIN}/{path}` immediately — no presigned URL needed, no Amplify storage call. The CDN URL is stable and cacheable.

```javascript
// Before: always calls getUrl() → presigned URL
// After: public paths return CDN URL, private/protected call Lambda
if (filePath.startsWith('public/')) {
  return `https://${cdnDomain}/${filePath}`;
}
// protected/ and private/ fall through to signed URL generation
```

### 2-B `getStudentSubmissionUrl` Lambda — return CloudFront signed URL

Once Phase 1-B is done, update the Lambda (0-C above) to call CloudFront's `getSignedUrl` instead of S3's `getSignedUrl`:

```typescript
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

const signedUrl = getSignedUrl({
  url: `https://${cdnDomain}/${submissionKey}`,
  keyPairId: process.env.CF_KEY_PAIR_ID,
  privateKey: process.env.CF_PRIVATE_KEY, // fetched from SSM on cold start
  dateLessThan: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
});
```

The grant pattern (section membership check) stays identical to 0-C.

### 2-C HLS video — switch from presigned URLs to signed cookies

**File**: wherever the video player is initialized (likely `FileManager2.jsx` or a video player component)

Current: the `.m3u8` manifest URL is a presigned S3 URL. The player fetches each `.ts` segment also via presigned URLs — but presigned URLs don't work for HLS segments because the player constructs segment URLs from relative paths in the manifest, not the query-param-signed ones.

**Fix**:
1. Lambda generates a CloudFront signed **cookie** scoped to `protected/{identityId}/hlsOutput/*` with a 6-hour TTL
2. Return the cookie + the stable CloudFront CDN URL of the `.m3u8` manifest
3. The browser sends the cookie automatically with every segment request — no per-segment signing needed

### 2-D Update `NEXT_PUBLIC_CDN_DOMAIN` env var

Add to `next.config.mjs` env block:
```javascript
NEXT_PUBLIC_CDN_DOMAIN: process.env.NEXT_PUBLIC_CDN_DOMAIN || '',
```

Populated by Amplify from `amplify_outputs.json` during build.

---

## Phase 3 — Next.js Image Optimization

### 3-A Enable the Next.js image optimizer

**File**: `next.config.mjs`

Remove `unoptimized: true` and configure a custom loader pointing at CloudFront:

```javascript
images: {
  loader: 'custom',
  loaderFile: './src/utils/cdnImageLoader.js',
},
```

**New file** `src/utils/cdnImageLoader.js`:
```javascript
export default function cdnLoader({ src, width, quality }) {
  const domain = process.env.NEXT_PUBLIC_CDN_DOMAIN;
  // Public S3 paths → CDN with width/quality query params handled by a
  // CloudFront Function or Lambda@Edge (see 3-B)
  return `https://${domain}/${src}?w=${width}&q=${quality || 75}`;
}
```

### 3-B CloudFront Function for on-the-fly resizing (optional)

If the pre-generated WebP variants (`small.webp` / `medium.webp` / `large.webp` from `imageProcess` Lambda) cover all needed sizes, the custom loader can just map `width` to the nearest pre-generated variant and skip the CloudFront Function entirely.

**Decision point**: Use pre-generated variants (simpler, already implemented) vs. CloudFront Function + sharp (flexible, more complex).

Recommendation: Use pre-generated variants for now.

```javascript
// cdnImageLoader.js — variant selection without on-the-fly resizing
const VARIANT_WIDTHS = [320, 640, 1280];

export default function cdnLoader({ src, width }) {
  const domain = process.env.NEXT_PUBLIC_CDN_DOMAIN;
  const variant = VARIANT_WIDTHS.find(w => w >= width) || 1280;
  // src is e.g. "protected/{id}/{fileId}/original.jpg"
  // Variants live at "protected/{id}/{fileId}/small.webp" etc.
  const base = src.replace(/\/[^/]+\.[^/]+$/, '');
  const name = variant === 320 ? 'small' : variant === 640 ? 'medium' : 'large';
  return `https://${domain}/${base}/${name}.webp`;
}
```

### 3-C Update `ImageComponent.jsx` to pass `fileId`/`identityId` in stories

Currently stories don't pass `fileId`/`identityId` so `getResponsiveImageUrls` always returns null and `srcSet` is never populated. Update story mock data to include those fields so `srcSet` is exercised in Storybook.

### 3-D Add `loading="lazy"` to `LazyImage` in `ImageComponent.jsx`

One-line fix in `src/components/Editor3/components/ImageComponent.jsx`.

---

## Phase 4 — Service Worker Updates

**File**: `src/sw.ts`

### 4-A Add CloudFront domain to media cache detection

`isS3MediaRequest` currently matches `.s3.amazonaws.com` hostnames. Add the CDN domain:

```typescript
function isS3MediaRequest(url: URL): boolean {
  const hostname = url.hostname;
  const cdnDomain = self.__CDN_DOMAIN__; // injected at build time
  return (
    hostname.includes('.s3.') ||
    hostname.includes('s3.amazonaws.com') ||
    (cdnDomain && hostname === cdnDomain)
  );
}
```

### 4-B Simplify cache key for CDN URLs

CDN URLs don't have presigned query params — `stripS3QueryParams` is unnecessary for CDN URLs but harmless. Can be left as-is or simplified to a no-op for CDN domains.

### 4-C Bump service worker cache version

Rename `s3-media-v1` → `s3-media-v2` when CDN domain is added to force cache invalidation on deploy. Old entries keyed under S3 hostnames will be dropped.

---

## Phase 5 — Integration Tests

**File**: `test/integration/api.test.ts`

Add tests for:
- `getStudentSubmissionUrl` succeeds when caller is an instructor in the same section as the grade
- `getStudentSubmissionUrl` fails when caller is in `Instructors` group but not in the grade's section
- `getStudentSubmissionUrl` fails when caller is a student (not in `Instructors` group)
- `getStudentSubmissionUrl` rejects a `submissionKey` that doesn't match `private/{gradeOwnerIdentityId}/...` (path traversal attempt)
- Student cannot generate a presigned URL for another student's `private/` path directly (confirms 0-A fix)

---

## Files Touched Summary

| File | Change |
|---|---|
| `amplify/storage/resource.ts` | Remove `allow.groups` from `private/` paths |
| `amplify/data/resource.ts` | Add `getStudentSubmissionUrl` query definition |
| `amplify/functions/section/handler.ts` | Implement `getStudentSubmissionUrl` handler with section membership check |
| `amplify/custom/mediaCDN/resource.ts` | **New** — CloudFront + OAC CDK construct |
| `amplify/backend.ts` | Wire `mediaCDN` construct, expose CDN outputs |
| `src/utils/getCachedUrl.js` | Return CDN URL for `public/` paths |
| `src/utils/cdnImageLoader.js` | **New** — Next.js custom image loader |
| `src/sw.ts` | Add CDN hostname to `isS3MediaRequest`, bump cache version |
| `next.config.mjs` | Remove `unoptimized: true`, add `NEXT_PUBLIC_CDN_DOMAIN` env var, configure custom loader |
| `src/components/Editor3/components/ImageComponent.jsx` | Add `loading="lazy"` to `LazyImage` |
| `test/integration/api.test.ts` | Add `getStudentSubmissionUrl` authorization tests |
