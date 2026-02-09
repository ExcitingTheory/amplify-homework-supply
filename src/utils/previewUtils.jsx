/**
 * Utility functions for working with generated preview images
 * Supports responsive images with next-gen formats (WebP, AVIF)
 */

import { getUrl } from 'aws-amplify/storage';

/**
 * Get the appropriate preview URL for an item based on size
 * @param {Object} item - File, Unit, or Section object with preview fields
 * @param {string} size - 'svg', 'thumbnail', 'small', 'medium', 'large', or 'original'
 * @param {string} level - 'public', 'protected', or 'private' (for S3 access)
 * @returns {Promise<string|null>} URL or null if not available
 */
export async function getPreviewUrl(item, size = 'medium', level = 'protected') {
  if (!item) return null;
  
  const sizeMap = {
    svg: item.previewSvg,
    thumbnail: item.previewThumbnail,
    small: item.previewSmall,
    medium: item.previewMedium,
    large: item.previewLarge,
    original: item.previewOriginal,
  };
  
  const previewKey = sizeMap[size];
  if (!previewKey) return null;
  
  try {
    const result = await getUrl({
      key: previewKey,
      options: {
        accessLevel: level,
        validateObjectExistence: false,
      }
    });
    
    return result.url.toString();
  } catch (error) {
    console.warn(`Failed to get preview URL for ${size}:`, error);
    return null;
  }
}

/**
 * Get responsive image srcSet for an item
 * Includes WebP and AVIF variants with proper sizing
 * @param {Object} item - File, Unit, or Section object with preview fields
 * @param {string} level - S3 access level
 * @returns {Promise<Object>} Object with src, srcSet, and avifSrcSet
 */
export async function getResponsiveSrcSet(item, level = 'protected') {
  if (!item) return { src: null, srcSet: null, avifSrcSet: null };
  
  const urls = await Promise.all([
    getPreviewUrl(item, 'small', level),
    getPreviewUrl(item, 'medium', level),
    getPreviewUrl(item, 'large', level),
  ]);
  
  const [smallUrl, mediumUrl, largeUrl] = urls;
  
  // Build WebP srcSet
  const webpSources = [];
  if (smallUrl) webpSources.push(`${smallUrl} 400w`);
  if (mediumUrl) webpSources.push(`${mediumUrl} 800w`);
  if (largeUrl) webpSources.push(`${largeUrl} 1200w`);
  
  // Get AVIF variant
  let avifUrl = null;
  if (item.previewAvif) {
    try {
      const result = await getUrl({
        key: item.previewAvif,
        options: {
          accessLevel: level,
          validateObjectExistence: false,
        }
      });
      avifUrl = result.url.toString();
    } catch (error) {
      console.warn('Failed to get AVIF URL:', error);
    }
  }
  
  return {
    src: mediumUrl, // Default fallback
    srcSet: webpSources.length > 0 ? webpSources.join(', ') : null,
    avifSrcSet: avifUrl ? `${avifUrl} 800w` : null,
  };
}

/**
 * Get a React <picture> element props for responsive images
 * Includes AVIF and WebP sources with proper fallbacks
 * @param {Object} item - File, Unit, or Section object
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Props for <picture> element
 */
export async function getResponsiveImageProps(item, options = {}) {
  const {
    level = 'protected',
    alt = '',
    sizes = '(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px',
    className = '',
  } = options;
  
  const { src, srcSet, avifSrcSet } = await getResponsiveSrcSet(item, level);
  
  return {
    sources: [
      avifSrcSet && {
        type: 'image/avif',
        srcSet: avifSrcSet,
        sizes,
      },
      srcSet && {
        type: 'image/webp',
        srcSet,
        sizes,
      },
    ].filter(Boolean),
    img: {
      src,
      alt,
      className,
      loading: 'lazy',
      decoding: 'async',
    },
  };
}

/**
 * React hook for responsive preview images
 * @param {Object} item - File, Unit, or Section object
 * @param {Object} options - Options for image loading
 * @returns {Object} Image props and loading state
 */
export function usePreviewImage(item, options = {}) {
  const [imageProps, setImageProps] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    if (!item) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    getResponsiveImageProps(item, options)
      .then(props => {
        setImageProps(props);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load preview:', err);
        setError(err);
        setLoading(false);
      });
  }, [item, options.level, options.alt, options.sizes]);
  
  return { imageProps, loading, error };
}

/**
 * Simple helper to check if an item has preview images
 * @param {Object} item - File, Unit, or Section object
 * @returns {boolean} True if item has at least one preview
 */
export function hasPreview(item) {
  if (!item) return false;
  
  return !!(
    item.previewSvg ||
    item.previewThumbnail ||
    item.previewSmall ||
    item.previewMedium ||
    item.previewLarge ||
    item.previewAvif
  );
}

/**
 * Get the best available preview for an item
 * Tries sizes in order: svg (for scalability), medium, large, small, thumbnail
 * @param {Object} item - File, Unit, or Section object
 * @param {string} level - S3 access level
 * @param {boolean} preferVector - Prefer SVG over raster if available
 * @returns {Promise<string|null>} URL or null
 */
export async function getBestPreview(item, level = 'protected', preferVector = true) {
  const preferredOrder = preferVector 
    ? ['svg', 'medium', 'large', 'small', 'thumbnail']
    : ['medium', 'large', 'small', 'thumbnail', 'svg'];
  
  for (const size of preferredOrder) {
    const url = await getPreviewUrl(item, size, level);
    if (url) return url;
  }
  
  return null;
}
