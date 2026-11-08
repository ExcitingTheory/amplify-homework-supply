"use client";

import React from "react";
import { Alert, Box, Skeleton } from "@mui/material";
import { useTranslations } from "next-intl";
import { Document, Page, pdfjs } from "react-pdf";

if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

const options = {
  cMapUrl: "/cmaps/",
  cMapPacked: true,
  standardFontDataUrl: "/standard_fonts/",
};

interface PdfFilePreviewProps {
  url: string;
  filename: string;
}

export default function PdfFilePreview({ url, filename }: PdfFilePreviewProps) {
  const t = useTranslations("editor.files");
  const container = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(320);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [url]);

  React.useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const onError = (error: Error) => {
    console.error("[PdfFilePreview] Failed to render PDF:", error);
    setFailed(true);
  };
  const loading = <Skeleton variant="rectangular" width="100%" height={240} />;
  const error = <Alert severity="error">{t("fileManager2.fileDetails.previewError")}</Alert>;

  return (
    <Box ref={container} sx={{ width: "100%", maxHeight: "40vh", overflow: "auto" }}>
      {failed ? error : (
        <Document
          key={url}
          file={url}
          options={options}
          loading={loading}
          error={error}
          onLoadError={onError}
          onSourceError={onError}
        >
          <Box role="img" aria-label={filename}>
            <Page
              pageNumber={1}
              width={width}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={loading}
              error={error}
              onRenderError={onError}
              onLoadError={onError}
            />
          </Box>
        </Document>
      )}
    </Box>
  );
}
