/**
 * Chooses which pages of a document get the (costly) vision pass.
 *
 * A page qualifies when its text layer is nearly empty (a scan or a slide
 * that is only a picture) or when it contains content images or charts. The
 * count is capped per document; sparse pages win over image pages because
 * the text model has nothing to work with on them.
 */

export interface VisionCandidatePage {
  pageNumber: number;
  text: string;
  imageCount?: number;
}

/** Below this many characters a page is treated as having no text layer. */
export const SPARSE_TEXT_CHARS = 200;

export function isSparsePage(page: VisionCandidatePage): boolean {
  return page.text.trim().length < SPARSE_TEXT_CHARS;
}

export function selectVisionPages(
  pages: VisionCandidatePage[],
  maxPages: number,
): Set<number> {
  const candidates = pages.filter(
    (page) => isSparsePage(page) || (page.imageCount ?? 0) > 0,
  );

  return new Set(
    candidates
      .sort((a, b) => {
        const sparseOrder = Number(isSparsePage(b)) - Number(isSparsePage(a));
        if (sparseOrder !== 0) return sparseOrder;
        const imageOrder = (b.imageCount ?? 0) - (a.imageCount ?? 0);
        return imageOrder !== 0 ? imageOrder : a.pageNumber - b.pageNumber;
      })
      .slice(0, Math.max(0, maxPages))
      .map((page) => page.pageNumber),
  );
}

/**
 * Appends what the vision model read to the page's text layer. Later steps
 * check quoted facts against the page text, so the transcription has to live
 * there for facts taken from the image to be accepted.
 */
export function mergeVisualContent(
  pageText: string,
  visualContent: string,
): string {
  const visual = visualContent.trim();
  if (!visual) return pageText;
  return [pageText.trim(), `[Visual content]\n${visual}`]
    .filter(Boolean)
    .join("\n\n");
}
