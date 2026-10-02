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
  emptyLabel = "Preview unavailable",
  size,
}) {
  const s3Key = thumbnailS3Key || fallbackS3Key;

  return (
    <CardMediaThumbnail
      s3Key={s3Key}
      identityId={fallbackIdentityId}
      emptyLabel={emptyLabel}
      size={size}
    />
  );
}
