/**
 * Derive a blurred-preview sibling key for an arbitrary image path, e.g.
 * "protected/{id}/featured-images/photo.png" -> "protected/{id}/featured-images/photo.preview-blurred.webp".
 * Keep in sync with amplify/functions/imageProcess/handler.ts (server-side copy).
 *
 * @param {string} path
 * @returns {string | null}
 */
export function getBlurredPreviewPath(path) {
  if (!path) return null;
  const lastSlash = path.lastIndexOf("/");
  const dir = path.slice(0, lastSlash + 1);
  const filename = path.slice(lastSlash + 1);
  const dotIndex = filename.lastIndexOf(".");
  const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  return `${dir}${base}.preview-blurred.webp`;
}

export default getBlurredPreviewPath;
