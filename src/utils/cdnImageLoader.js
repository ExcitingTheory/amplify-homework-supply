/**
 * Next.js custom image loader for CloudFront CDN.
 *
 * Maps next/image width requests to the pre-generated WebP variants produced
 * by the imageProcess Lambda (small=320px, medium=640px, large=1280px).
 *
 * Falls back to the original file path when no CDN domain is configured
 * (e.g., in local dev without NEXT_PUBLIC_CDN_DOMAIN set).
 *
 * Usage in next.config.mjs:
 *   images: {
 *     loader: 'custom',
 *     loaderFile: './src/utils/cdnImageLoader.js',
 *   }
 */

const VARIANT_WIDTHS = [320, 640, 1280];
const VARIANT_NAMES = { 320: 'small', 640: 'medium', 1280: 'large' };

/**
 * @param {{ src: string, width: number, quality?: number }} params
 * @returns {string} CDN URL for the nearest pre-generated WebP variant
 */
export default function cdnLoader({ src, width }) {
  const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN;

  // No CDN configured — return src as-is (dev fallback)
  if (!cdnDomain) {
    return src;
  }

  // If src is already an absolute URL (e.g. external image or mock), return as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  // Public paths: serve from CDN directly (no variant selection needed for non-image types)
  if (src.startsWith('public/') && !src.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
    return `https://${cdnDomain}/${src}`;
  }

  // For image paths: select nearest pre-generated variant
  // src is e.g. "protected/{identityId}/{fileId}/original.jpg"
  // Variants live at "protected/{identityId}/{fileId}/small.webp" etc.
  const variantWidth = VARIANT_WIDTHS.find((w) => w >= width) ?? 1280;
  const variantName = VARIANT_NAMES[variantWidth];

  // Strip the filename and replace with the variant name
  const basePath = src.replace(/\/[^/]+\.[^/]+$/, '');
  return `https://${cdnDomain}/${basePath}/${variantName}.webp`;
}
