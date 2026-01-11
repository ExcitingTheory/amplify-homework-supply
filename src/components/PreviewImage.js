/**
 * PreviewImage - Responsive image component with next-gen format support
 * Automatically uses WebP/AVIF with fallbacks and lazy loading
 */

import React from 'react';
import { Box, Skeleton } from '@mui/material';
import { usePreviewImage, getBestPreview } from '../utils/previewUtils';

/**
 * Display a preview image for a File, Unit, or Section
 * Automatically handles responsive sizing and next-gen formats
 * 
 * @param {Object} props
 * @param {Object} props.item - File, Unit, or Section object with preview fields
 * @param {string} props.alt - Alt text for accessibility
 * @param {string} props.level - S3 access level ('public', 'protected', 'private')
 * @param {string} props.sizes - Responsive sizes attribute
 * @param {string} props.className - CSS class name
 * @param {Object} props.sx - Material-UI sx prop
 * @param {number} props.aspectRatio - Aspect ratio (width/height) for skeleton
 * @param {Function} props.onClick - Click handler
 * @param {string} props.fallback - Fallback image URL if no preview available
 */
export default function PreviewImage({
  item,
  alt = '',
  level = 'protected',
  sizes = '(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px',
  className = '',
  sx = {},
  aspectRatio = 16/9,
  onClick,
  fallback = null,
}) {
  const { imageProps, loading, error } = usePreviewImage(item, {
    level,
    alt,
    sizes,
    className,
  });
  
  const [fallbackUrl, setFallbackUrl] = React.useState(null);
  
  // Load fallback if no preview available
  React.useEffect(() => {
    if (!loading && !imageProps?.img?.src && fallback) {
      setFallbackUrl(fallback);
    }
  }, [loading, imageProps, fallback]);
  
  // Show skeleton while loading
  if (loading) {
    return (
      <Box sx={{ width: '100%', ...sx }}>
        <Skeleton
          variant="rectangular"
          width="100%"
          height={0}
          sx={{
            paddingTop: `${(1 / aspectRatio) * 100}%`,
            borderRadius: 1,
          }}
        />
      </Box>
    );
  }
  
  // Show fallback if error or no preview
  if (error || !imageProps?.img?.src) {
    if (fallbackUrl) {
      return (
        <Box
          component="img"
          src={fallbackUrl}
          alt={alt}
          className={className}
          onClick={onClick}
          sx={{
            width: '100%',
            height: 'auto',
            display: 'block',
            cursor: onClick ? 'pointer' : 'default',
            ...sx,
          }}
        />
      );
    }
    return null;
  }
  
  // Render responsive image with next-gen formats
  return (
    <Box
      component="picture"
      onClick={onClick}
      sx={{
        display: 'block',
        cursor: onClick ? 'pointer' : 'default',
        ...sx,
      }}
    >
      {imageProps.sources.map((source, index) => (
        <source
          key={index}
          type={source.type}
          srcSet={source.srcSet}
          sizes={source.sizes}
        />
      ))}
      <Box
        component="img"
        {...imageProps.img}
        sx={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
      />
    </Box>
  );
}

/**
 * Simple thumbnail variant with fixed size
 */
export function PreviewThumbnail({
  item,
  alt = '',
  level = 'protected',
  size = 150,
  onClick,
  sx = {},
}) {
  const [url, setUrl] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    if (!item) {
      setLoading(false);
      return;
    }
    
    getBestPreview(item, level)
      .then(url => {
        setUrl(url);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load thumbnail:', err);
        setLoading(false);
      });
  }, [item, level]);
  
  if (loading) {
    return (
      <Skeleton
        variant="rectangular"
        width={size}
        height={size}
        sx={{ borderRadius: 1, ...sx }}
      />
    );
  }
  
  if (!url) return null;
  
  return (
    <Box
      component="img"
      src={url}
      alt={alt}
      onClick={onClick}
      sx={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: 1,
        cursor: onClick ? 'pointer' : 'default',
        ...sx,
      }}
    />
  );
}
