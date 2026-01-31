/**
 * SvgPreview - Display SVG vector previews with fallback to raster
 * Optimized for text-heavy content with perfect scaling
 */

import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import { getPreviewUrl, getBestPreview } from '../utils/previewUtils';
import { useTranslation } from 'react-i18next';

/**
 * Display an SVG preview with automatic fallback to raster formats
 * Perfect for Units and Sections with text content
 * 
 * @param {Object} props
 * @param {Object} props.item - File, Unit, or Section object with preview fields
 * @param {string} props.alt - Alt text for accessibility
 * @param {string} props.level - S3 access level ('public', 'protected', 'private')
 * @param {string} props.fallbackSize - Raster size to use if SVG unavailable
 * @param {Object} props.sx - Material-UI sx prop
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.preferRaster - Use raster instead of SVG (for thumbnails)
 */
export default function SvgPreview({
  item,
  alt = '',
  level = 'protected',
  fallbackSize = 'medium',
  sx = {},
  onClick,
  preferRaster = false,
}) {
  const { t } = useTranslation('components');
  const [url, setUrl] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [isSvg, setIsSvg] = React.useState(false);
  
  React.useEffect(() => {
    if (!item) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const loadPreview = async () => {
      try {
        let previewUrl;
        
        if (preferRaster) {
          // Use raster format for thumbnails/grids
          previewUrl = await getPreviewUrl(item, fallbackSize, level);
          setIsSvg(false);
        } else {
          // Try SVG first, fallback to raster
          const svgUrl = await getPreviewUrl(item, 'svg', level);
          if (svgUrl) {
            previewUrl = svgUrl;
            setIsSvg(true);
          } else {
            previewUrl = await getPreviewUrl(item, fallbackSize, level);
            setIsSvg(false);
          }
        }
        
        setUrl(previewUrl);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load preview:', error);
        setLoading(false);
      }
    };
    
    loadPreview();
  }, [item, level, fallbackSize, preferRaster]);
  
  if (loading) {
    return (
      <Box sx={{ width: '100%', ...sx }}>
        <Skeleton
          variant="rectangular"
          width="100%"
          height={300}
          sx={{ borderRadius: 1 }}
        />
      </Box>
    );
  }
  
  if (!url) {
    return (
      <Box
        sx={{
          width: '100%',
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: 1,
          ...sx,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {t('svgPreview.emptyState')}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        width: '100%',
        cursor: onClick ? 'pointer' : 'default',
        ...sx,
      }}
      onClick={onClick}
    >
      <Box
        component={isSvg ? 'object' : 'img'}
        data={isSvg ? url : undefined}
        src={isSvg ? undefined : url}
        type={isSvg ? 'image/svg+xml' : undefined}
        alt={alt}
        sx={{
          width: '100%',
          height: 'auto',
          display: 'block',
          borderRadius: 1,
          // SVG-specific styling
          ...(isSvg && {
            border: '1px solid',
            borderColor: 'divider',
          }),
        }}
      />
      {isSvg && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}
        >
          {t('svgPreview.caption')}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Hook for loading SVG or raster preview URL
 * Returns URL and metadata
 */
export function useSvgPreview(item, level = 'protected', preferVector = true) {
  const [state, setState] = React.useState({
    url: null,
    isSvg: false,
    loading: true,
    error: null,
  });
  
  React.useEffect(() => {
    if (!item) {
      setState({ url: null, isSvg: false, loading: false, error: null });
      return;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    getBestPreview(item, level, preferVector)
      .then(url => {
        // Check if URL is SVG based on file extension
        const isSvg = url?.endsWith('.svg') || false;
        setState({ url, isSvg, loading: false, error: null });
      })
      .catch(error => {
        console.error('Failed to load preview:', error);
        setState({ url: null, isSvg: false, loading: false, error });
      });
  }, [item, level, preferVector]);
  
  return state;
}
