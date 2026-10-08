"use client";

import React from "react";
import CardMediaThumbnail from "./CardMediaThumbnail";

/**
 * PublishedUnitHtmlThumbnail
 *
 * Displays a pre-rendered thumbnail image captured at publish time.
 * Falls back to featuredImage, then to an empty placeholder.
 * Delegates the actual box sizing/cover-fit/empty-state to CardMediaThumbnail
 * so every card type renders thumbnails at the same size.
 */
export default function PublishedUnitHtmlThumbnail({
  unitId: _unitId,
  thumbnailS3Key,
  fallbackS3Key,
  fallbackIdentityId,
  title,
  emptyLabel = "Preview unavailable",
  size = 160,
  desktopWidth,
  aspectRatio,
  fillHeight,
}) {
  const s3Key = thumbnailS3Key || fallbackS3Key;

  return (
    <CardMediaThumbnail
      s3Key={s3Key}
      identityId={fallbackIdentityId}
      title={title}
      emptyLabel={emptyLabel}
      size={size}
      desktopWidth={desktopWidth}
      aspectRatio={aspectRatio}
      fillHeight={fillHeight}
    />
  );
}
