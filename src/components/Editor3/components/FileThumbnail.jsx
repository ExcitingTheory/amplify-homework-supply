import React from "react";
import { Box, Skeleton } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ArticleIcon from "@mui/icons-material/Article";
import DescriptionIcon from "@mui/icons-material/Description";
import TheaterComedyIcon from "@mui/icons-material/TheaterComedy";
import getCachedUrl from "../../../utils/getCachedUrl";

/**
 * FileThumbnail — Displays a file's thumbnail image from S3 if available,
 * falling back to a Material icon based on file type.
 *
 * Thumbnails are generated server-side by the imageProcess Lambda and stored at:
 *   protected/{identityId}/{fileId}/thumbnail.webp
 *
 * The File.thumbnail field contains the S3 path once processing is complete.
 */
const FileThumbnail = React.memo(function FileThumbnail({
  file,
  fileType,
  size = 32,
  isSelected = false,
}) {
  const [thumbnailUrl, setThumbnailUrl] = React.useState(null);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    if (!file.thumbnail) {
      setThumbnailUrl(null);
      setLoadFailed(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getCachedUrl(file.thumbnail)
      .then((url) => {
        if (!cancelled) {
          setThumbnailUrl(url);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file.thumbnail]);

  // Show thumbnail image if available
  if (thumbnailUrl && !loadFailed) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: 0.5,
          overflow: "hidden",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "action.hover",
        }}
      >
        <img
          src={thumbnailUrl}
          alt={file.name || ""}
          loading="lazy"
          onError={() => setLoadFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Box>
    );
  }

  // Show skeleton while loading
  if (isLoading) {
    return (
      <Skeleton
        variant="rounded"
        width={size}
        height={size}
        sx={{ flexShrink: 0 }}
      />
    );
  }

  // Fallback to icon
  const iconSx = {
    fontSize: size * 0.75,
    color: isSelected ? "primary.main" : "inherit",
    transition: "color 0.2s",
  };

  const icon = getIconForFileType(fileType, iconSx);

  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
  );
});

function getIconForFileType(fileType, sx) {
  switch (fileType) {
    case "images":
      return <ImageIcon sx={sx} />;
    case "audio":
      return <AudioFileIcon sx={sx} />;
    case "documents":
      return <PictureAsPdfIcon sx={sx} />;
    case "video":
      return <ArticleIcon sx={sx} />;
    case "scripts":
      return <TheaterComedyIcon sx={sx} />;
    default:
      return <DescriptionIcon sx={sx} />;
  }
}

export default FileThumbnail;
