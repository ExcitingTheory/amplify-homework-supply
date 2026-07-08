/**
 * Captures the Lexical editor content as a PNG Blob for use as a unit thumbnail.
 * Uses the live editor DOM — call this at publish time while the editor is mounted.
 */

const THUMBNAIL_WIDTH = 480;
const THUMBNAIL_HEIGHT = 320;

/**
 * Capture the current editor content as a PNG blob.
 * Clones the editor DOM into a canvas via foreignObject SVG rendering.
 */
export async function captureEditorThumbnail(): Promise<Blob | null> {
  const editorEl = document.querySelector<HTMLElement>('[data-tour="editor"]');
  if (!editorEl) {
    console.warn("[captureEditorThumbnail] Editor element not found");
    return null;
  }

  try {
    // Clone the editor content so we don't disturb the live DOM
    const clone = editorEl.cloneNode(true) as HTMLElement;

    // Strip interactive elements and media that won't render in foreignObject
    clone
      .querySelectorAll("iframe, video, audio, script, input, button, textarea")
      .forEach((el) => el.remove());

    // Get computed styles from the editor for font/color
    const computedStyle = window.getComputedStyle(editorEl);

    // Build an inline-styled wrapper
    const wrapper = document.createElement("div");
    wrapper.style.width = `${THUMBNAIL_WIDTH * 2}px`;
    wrapper.style.fontFamily = computedStyle.fontFamily;
    wrapper.style.fontSize = computedStyle.fontSize;
    wrapper.style.lineHeight = computedStyle.lineHeight;
    wrapper.style.color = computedStyle.color;
    wrapper.style.backgroundColor = computedStyle.backgroundColor;
    wrapper.style.padding = "16px 24px";
    wrapper.style.overflow = "hidden";
    wrapper.appendChild(clone);

    // Inline all computed styles on every element so foreignObject renders correctly
    inlineStyles(wrapper, editorEl);

    const svgNS = "http://www.w3.org/2000/svg";
    const foreignWidth = THUMBNAIL_WIDTH * 2;
    const foreignHeight = THUMBNAIL_HEIGHT * 4;

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("width", String(foreignWidth));
    svg.setAttribute("height", String(foreignHeight));

    const fo = document.createElementNS(svgNS, "foreignObject");
    fo.setAttribute("width", "100%");
    fo.setAttribute("height", "100%");
    fo.appendChild(wrapper);
    svg.appendChild(fo);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = THUMBNAIL_WIDTH * 2; // 2x for retina
    canvas.height = THUMBNAIL_HEIGHT * 2;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(svgUrl);
      return null;
    }

    // Draw SVG image scaled to fit the thumbnail dimensions
    ctx.drawImage(
      img,
      0,
      0,
      foreignWidth,
      foreignHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    URL.revokeObjectURL(svgUrl);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 0.92);
    });
  } catch (err) {
    console.warn("[captureEditorThumbnail] Failed:", err);
    return null;
  }
}

/**
 * Recursively inline computed styles from the source tree onto the cloned tree.
 * This is necessary because foreignObject SVG rendering doesn't have access to
 * the page's stylesheets.
 */
function inlineStyles(cloneRoot: HTMLElement, sourceRoot: HTMLElement): void {
  const cloneChildren = cloneRoot.querySelectorAll("*");
  const sourceChildren = sourceRoot.querySelectorAll("*");

  const propertiesToCopy = [
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "line-height",
    "letter-spacing",
    "color",
    "background-color",
    "text-decoration",
    "text-align",
    "margin",
    "padding",
    "border",
    "border-radius",
    "display",
    "white-space",
    "word-break",
    "overflow-wrap",
    "list-style-type",
    "text-indent",
  ];

  const len = Math.min(cloneChildren.length, sourceChildren.length);
  for (let i = 0; i < len; i++) {
    const cloneEl = cloneChildren[i] as HTMLElement;
    const sourceEl = sourceChildren[i] as HTMLElement;
    if (!cloneEl.style || !sourceEl) continue;

    const computed = window.getComputedStyle(sourceEl);
    for (const prop of propertiesToCopy) {
      cloneEl.style.setProperty(prop, computed.getPropertyValue(prop));
    }
  }
}
