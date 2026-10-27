/**
 * Extracts a document's text with a placeholder at every image, so a
 * description can be put back exactly where the image appeared.
 *
 * Used for DOCX and ODF text documents. The plain text from the regular
 * extractors is unchanged; this produces a second, marker-bearing copy that
 * only exists when the document has images.
 */
import { convert } from "html-to-text";
import { XMLParser } from "fast-xml-parser";
import {
  imageMarker,
  imageMimeType,
  isUnreadableImage,
  type EmbeddedImage,
} from "./embeddedImages.js";

export interface InlineExtraction {
  /** Document text with `⟦IMG:id⟧` placeholders where images appear. */
  text: string;
  images: EmbeddedImage[];
  /** Images a vision model cannot read; they keep their marker for later. */
  unconverted: EmbeddedImage[];
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;

const SUPPORTED_CONTENT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

/** Replaces every mammoth image element with a text run holding its marker. */
function replaceImagesWithMarkers(images: any[]) {
  const visit = (element: any): any => {
    if (element?.type === "image") {
      return { type: "text", value: imageMarker(images.push(element) - 1) };
    }
    if (Array.isArray(element?.children)) {
      return { ...element, children: element.children.map(visit) };
    }
    return element;
  };
  return visit;
}

export async function extractDocxInline(
  buffer: Buffer,
): Promise<InlineExtraction> {
  // @ts-ignore - mammoth types not available at compile time
  const mammoth = (await import("mammoth")).default;
  const imageElements: any[] = [];
  const { value: html } = await mammoth.convertToHtml(
    { buffer },
    { transformDocument: replaceImagesWithMarkers(imageElements) },
  );

  const text = convert(html, {
    wordwrap: false,
    selectors: [
      ...["h1", "h2", "h3", "h4", "h5", "h6"].map((selector) => ({
        selector,
        format: "heading",
        options: { uppercase: false },
      })),
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
    ],
  }).trim();

  const images: EmbeddedImage[] = [];
  const unconverted: EmbeddedImage[] = [];
  let totalBytes = 0;
  for (const [index, element] of imageElements.entries()) {
    // SVG text is read from the package directly; the raster fallback is used.
    if (String(element.contentType).includes("svg")) continue;
    const extension = SUPPORTED_CONTENT_TYPES[element.contentType];
    let data: Buffer;
    try {
      data = await element.read();
    } catch {
      // A linked image (not embedded in the file) cannot be read; the rest can.
      continue;
    }
    if (data.length > MAX_IMAGE_BYTES) continue;
    totalBytes += data.length;
    if (totalBytes > MAX_TOTAL_BYTES) break;
    // The content type of an unsupported image maps to its real extension
    // (for example image/x-emf), which the converter uses to pick a decoder.
    const unsupportedExtension = String(element.contentType)
      .split("/")
      .pop()
      ?.replace(/^x-/, "");
    (extension ? images : unconverted).push({
      filename: `image${index + 1}.${extension ?? unsupportedExtension ?? "bin"}`,
      mimeType: extension ? element.contentType : "application/octet-stream",
      data,
      marker: imageMarker(index),
    });
  }
  return { text, images, unconverted };
}

type OrderedNode = Record<string, any>;

/** Reads text and image references from an ODF content.xml in document order. */
export function odfContentToMarkedText(xml: string): {
  text: string;
  hrefs: string[];
} {
  const parser = new XMLParser({
    removeNSPrefix: true,
    ignoreAttributes: false,
    preserveOrder: true,
    trimValues: false,
  });
  const hrefs: string[] = [];

  // Text outside a paragraph or heading is layout whitespace between elements.
  const collect = (nodes: OrderedNode[], inBlock = false): string => {
    let out = "";
    for (const node of nodes) {
      for (const [tag, value] of Object.entries(node)) {
        if (tag === ":@") continue;
        if (tag === "#text") {
          if (inBlock) out += String(value);
          continue;
        }
        const children: OrderedNode[] = Array.isArray(value) ? value : [];
        if (tag === "image") {
          const href = node[":@"]?.["@_href"];
          if (typeof href === "string") {
            hrefs.push(href);
            out += imageMarker(href);
          }
        } else if (tag === "p" || tag === "h") {
          const line = collect(children, true)
            .replace(/[ \t\r\n]+/g, " ")
            .trim();
          if (line) out += `${line}\n`;
        } else if (tag === "line-break") {
          out += "\n";
        } else if (tag === "s" || tag === "tab") {
          out += " ";
        } else {
          out += collect(children, inBlock);
        }
      }
    }
    return out;
  };

  const text = collect(parser.parse(xml)).replace(/\n{3,}/g, "\n\n").trim();
  return { text, hrefs };
}

export async function extractOdfInline(
  buffer: Buffer,
): Promise<InlineExtraction | null> {
  // @ts-ignore - jszip types not available at compile time
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const content = zip.files["content.xml"];
  if (!content) return null;

  const { text, hrefs } = odfContentToMarkedText(await content.async("text"));

  const images: EmbeddedImage[] = [];
  const unconverted: EmbeddedImage[] = [];
  let totalBytes = 0;
  for (const href of new Set(hrefs)) {
    const file = zip.files[href];
    if (!file) continue;
    const filename = href.split("/").pop() || href;
    const unreadable = isUnreadableImage(href);
    const mimeType = unreadable
      ? "application/octet-stream"
      : imageMimeType(href);
    if (!mimeType) continue;
    const data: Buffer = await file.async("nodebuffer");
    if (data.length > MAX_IMAGE_BYTES) continue;
    totalBytes += data.length;
    if (totalBytes > MAX_TOTAL_BYTES) break;
    (unreadable ? unconverted : images).push({
      filename,
      mimeType,
      data,
      marker: imageMarker(href),
    });
  }
  return { text, images, unconverted };
}
