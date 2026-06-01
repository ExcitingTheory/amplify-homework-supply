"use client";
import React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import getCachedUrl from "@/utils/getCachedUrl";
import { getResponsiveImageUrls } from "@/utils/getResponsiveImageUrls";

/**
 * Lazy-loaded card media component using IntersectionObserver.
 * Only fetches presigned URLs when the card scrolls into view.
 * Uses responsive srcSet from the image pipeline for optimal sizing.
 */
export default function LazyCardMedia({
  s3Key,
  identityId,
  fileId,
  level = "protected",
  filter = null,
  grade = null,
}) {
  const [url, setUrl] = React.useState(null);
  const [srcSet, setSrcSet] = React.useState(null);
  const [sizes, setSizes] = React.useState(null);
  const [loaded, setLoaded] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const containerRef = React.useRef(null);

  // IntersectionObserver — mark visible once, then disconnect
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }, // Start loading slightly before visible
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fetch presigned URLs only after visible
  React.useEffect(() => {
    if (!isVisible || !s3Key) return;
    setLoaded(false);

    let cancelled = false;

    const fetchUrl = async () => {
      const _url = await getCachedUrl(s3Key);
      if (!cancelled) setUrl(_url);
    };
    fetchUrl();

    if (fileId && identityId) {
      getResponsiveImageUrls(fileId, identityId)
        .then((result) => {
          if (!cancelled && result) {
            setSrcSet(result.srcSet);
            setSizes(result.sizes);
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [isVisible, s3Key, fileId, identityId]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: 400,
        alignSelf: "left",
        flexShrink: 0,
      }}
    >
      {isVisible && url ? (
        <img
          src={url}
          srcSet={srcSet || undefined}
          sizes={sizes || undefined}
          loading="lazy"
          decoding="async"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            visibility: loaded ? "visible" : "hidden",
            filter: filter || undefined,
          }}
          onLoad={() => setLoaded(true)}
        />
      ) : null}
      {!loaded && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      )}
    </Box>
  );
}
