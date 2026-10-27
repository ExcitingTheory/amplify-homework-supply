import { readFileSync } from "node:fs";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import {
  chartXmlToText,
  diagramXmlToText,
  svgToText,
} from "../../amplify/functions/documentAnalysis/officeCharts";
import {
  extractZipMedia,
  imageMarker,
  isUnreadableImage,
  stripImageMarkers,
} from "../../amplify/functions/documentAnalysis/embeddedImages";
import {
  extractDocxInline,
  odfContentToMarkedText,
} from "../../amplify/functions/documentAnalysis/inlineImages";
import {
  weaveImageDescriptions,
  type ImageDescription,
} from "../../amplify/functions/documentAnalysis/imageDescriptions";

const CHART_XML = `<?xml version="1.0"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <c:chart>
    <c:title><c:tx><c:rich><a:p><a:r><a:t>Rainfall by month</a:t></a:r></a:p></c:rich></c:tx></c:title>
    <c:plotArea>
      <c:barChart>
        <c:ser>
          <c:tx><c:strRef><c:strCache><c:pt idx="0"><c:v>2024</c:v></c:pt></c:strCache></c:strRef></c:tx>
          <c:cat><c:strRef><c:strCache>
            <c:pt idx="1"><c:v>Feb</c:v></c:pt><c:pt idx="0"><c:v>Jan</c:v></c:pt>
          </c:strCache></c:strRef></c:cat>
          <c:val><c:numRef><c:numCache>
            <c:pt idx="0"><c:v>12</c:v></c:pt><c:pt idx="1"><c:v>18.5</c:v></c:pt>
          </c:numCache></c:numRef></c:val>
        </c:ser>
      </c:barChart>
      <c:catAx><c:title><c:tx><c:rich><a:p><a:r><a:t>Month</a:t></a:r></a:p></c:rich></c:tx></c:title></c:catAx>
      <c:valAx><c:title><c:tx><c:rich><a:p><a:r><a:t>mm</a:t></a:r></a:p></c:rich></c:tx></c:title></c:valAx>
    </c:plotArea>
  </c:chart>
</c:chartSpace>`;

describe("chartXmlToText", () => {
  it("reads title, axes, series, and values in index order", () => {
    expect(chartXmlToText(CHART_XML)).toBe(
      '[Chart: Rainfall by month] bar chart. Series "2024": Jan=12, Feb=18.5 Axes: Month / mm.',
    );
  });

  it("reads scatter series from xVal and yVal", () => {
    const xml = `<c:chartSpace xmlns:c="c"><c:chart><c:plotArea><c:scatterChart><c:ser>
      <c:xVal><c:numRef><c:numCache><c:pt idx="0"><c:v>1</c:v></c:pt><c:pt idx="1"><c:v>2</c:v></c:pt></c:numCache></c:numRef></c:xVal>
      <c:yVal><c:numRef><c:numCache><c:pt idx="0"><c:v>10</c:v></c:pt><c:pt idx="1"><c:v>20</c:v></c:pt></c:numCache></c:numRef></c:yVal>
    </c:ser></c:scatterChart></c:plotArea></c:chart></c:chartSpace>`;

    expect(chartXmlToText(xml)).toBe("[Chart] scatter chart. Series: 1=10, 2=20");
  });

  it("returns nothing for a chart with no data or invalid XML", () => {
    expect(chartXmlToText("<c:chartSpace xmlns:c='c'><c:chart/></c:chartSpace>")).toBe("");
    expect(chartXmlToText("not xml <<<")).toBe("");
  });
});

describe("diagramXmlToText", () => {
  it("lists the diagram's text once each, in order", () => {
    const xml = `<dgm:dataModel xmlns:dgm="d" xmlns:a="a"><dgm:ptLst>
      <dgm:pt><dgm:t><a:p><a:r><a:t>Evaporation</a:t></a:r></a:p></dgm:t></dgm:pt>
      <dgm:pt><dgm:t><a:p><a:r><a:t>Condensation</a:t></a:r></a:p></dgm:t></dgm:pt>
      <dgm:pt><dgm:t><a:p><a:r><a:t>Evaporation</a:t></a:r></a:p></dgm:t></dgm:pt>
    </dgm:ptLst></dgm:dataModel>`;

    expect(diagramXmlToText(xml)).toBe("[Diagram] Evaporation; Condensation");
  });
});

describe("svgToText", () => {
  it("collects title, description, and labels without duplicating tspans", () => {
    const svg = `<svg><title>Food web</title><desc>Who eats whom</desc>
      <text x="1">Grass &amp; <tspan>algae</tspan></text><text>Rabbit</text></svg>`;

    expect(svgToText(svg)).toBe("Food web | Who eats whom | Grass & algae | Rabbit");
  });

  it("returns an empty string for an SVG with no text", () => {
    expect(svgToText('<svg><path d="M0 0"/></svg>')).toBe("");
  });
});

describe("extractZipMedia", () => {
  async function docxLike(files: Record<string, Buffer | string>) {
    const zip = new JSZip();
    for (const [name, content] of Object.entries(files)) zip.file(name, content);
    return zip.generateAsync({ type: "nodebuffer" });
  }

  it("separates readable images, unreadable images, and text-bearing parts", async () => {
    const buffer = await docxLike({
      "word/media/image1.png": Buffer.from("png"),
      "word/media/image2.emf": Buffer.from("emf"),
      "word/media/image3.svg": "<svg><text>Label</text></svg>",
      "word/charts/chart1.xml": CHART_XML,
      "word/diagrams/data1.xml":
        '<dgm:dataModel xmlns:dgm="d" xmlns:a="a"><a:t>Step</a:t></dgm:dataModel>',
    });

    const media = await extractZipMedia(buffer, "docx");

    expect(media.images.map((image) => image.filename)).toEqual(["image1.png"]);
    expect(media.unconverted.map((image) => image.filename)).toEqual([
      "image2.emf",
    ]);
    expect(media.unconverted[0].data.toString()).toBe("emf");
    expect(media.visualText).toEqual([
      "[Diagram: image3.svg] Label",
      expect.stringContaining("[Chart: Rainfall by month]"),
      "[Diagram] Step",
    ]);
  });

  it("can skip raster images when they are read elsewhere", async () => {
    const buffer = await docxLike({ "word/media/image1.png": Buffer.from("png") });

    expect((await extractZipMedia(buffer, "docx", { includeRaster: false })).images)
      .toEqual([]);
  });

  it("classifies unreadable extensions", () => {
    expect(isUnreadableImage("a.EMF")).toBe(true);
    expect(isUnreadableImage("a.tiff")).toBe(true);
    expect(isUnreadableImage("a.png")).toBe(false);
  });
});

describe("extractDocxInline", () => {
  /** Adds drawings for the given media to a real DOCX so mammoth reads them. */
  async function docxWithImages(images: Array<{ name: string; data: Buffer }>) {
    const zip = await JSZip.loadAsync(
      readFileSync("test/mocks/biology-cell-structure.docx"),
    );
    const rels = images
      .map(
        (image, index) =>
          `<Relationship Id="rIdImg${index}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${image.name}"/>`,
      )
      .join("");
    const relsPath = "word/_rels/document.xml.rels";
    zip.file(
      relsPath,
      (await zip.file(relsPath)!.async("text")).replace(
        "</Relationships>",
        `${rels}</Relationships>`,
      ),
    );

    const typesPath = "[Content_Types].xml";
    let types = await zip.file(typesPath)!.async("text");
    for (const [extension, type] of [
      ["png", "image/png"],
      ["emf", "image/x-emf"],
    ]) {
      if (!types.includes(`Extension="${extension}"`)) {
        types = types.replace(
          "<Override",
          `<Default Extension="${extension}" ContentType="${type}"/><Override`,
        );
      }
    }
    zip.file(typesPath, types);

    const drawings = images
      .map(
        (_, index) =>
          `<w:p><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:docPr id="${index + 1}" name="Picture ${index}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rIdImg${index}"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`,
      )
      .join("");
    const documentPath = "word/document.xml";
    zip.file(
      documentPath,
      (await zip.file(documentPath)!.async("text")).replace(
        /<w:sectPr/,
        `${drawings}<w:sectPr`,
      ),
    );
    for (const image of images) zip.file(`word/media/${image.name}`, image.data);
    return zip.generateAsync({ type: "nodebuffer" });
  }

  it("leaves a marker where each image sits and returns the image data", async () => {
    const buffer = await docxWithImages([
      { name: "cell.png", data: Buffer.from("PNGDATA") },
    ]);

    const result = await extractDocxInline(buffer);

    expect(result.images).toHaveLength(1);
    expect(result.images[0]).toMatchObject({
      filename: "image1.png",
      mimeType: "image/png",
      marker: imageMarker(0),
    });
    expect(result.images[0].data.toString()).toBe("PNGDATA");
    expect(result.text).toContain(imageMarker(0));
    // The image comes after the body text, not before it.
    expect(result.text.indexOf(imageMarker(0))).toBeGreaterThan(20);
    expect(result.unconverted).toEqual([]);
  });

  it("returns images in formats a vision model cannot read, with their marker", async () => {
    const buffer = await docxWithImages([
      { name: "cell.png", data: Buffer.from("PNG") },
      { name: "chart.emf", data: Buffer.from("EMF") },
    ]);

    const result = await extractDocxInline(buffer);

    expect(result.images.map((image) => image.filename)).toEqual(["image1.png"]);
    expect(result.unconverted).toHaveLength(1);
    expect(result.unconverted[0]).toMatchObject({
      filename: "image2.emf",
      marker: imageMarker(1),
    });
    expect(result.unconverted[0].data.toString()).toBe("EMF");
    expect(result.text).toContain(imageMarker(1));
  });
});

describe("extractDocxInline with a linked image", () => {
  it("skips an image that is linked rather than embedded instead of failing", async () => {
    const zip = await JSZip.loadAsync(
      readFileSync("test/mocks/biology-cell-structure.docx"),
    );
    const relsPath = "word/_rels/document.xml.rels";
    zip.file(
      relsPath,
      (await zip.file(relsPath)!.async("text")).replace(
        "</Relationships>",
        '<Relationship Id="rIdLinked" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="file:///missing/cell.png" TargetMode="External"/></Relationships>',
      ),
    );
    const documentPath = "word/document.xml";
    zip.file(
      documentPath,
      (await zip.file(documentPath)!.async("text")).replace(
        /<w:sectPr/,
        '<w:p><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:docPr id="7" name="Linked"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:link="rIdLinked"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:sectPr',
      ),
    );

    const result = await extractDocxInline(
      await zip.generateAsync({ type: "nodebuffer" }),
    );

    expect(result.images).toEqual([]);
    expect(result.unconverted).toEqual([]);
    expect(result.text).toContain("⟦IMG:0⟧");
  });
});

describe("odfContentToMarkedText", () => {
  it("keeps paragraphs in order with a marker at each image", () => {
    const xml = `<office:document-content xmlns:office="o" xmlns:text="t" xmlns:draw="d" xmlns:xlink="x">
      <office:body><office:text>
        <text:h>Cells</text:h>
        <text:p>Before the picture.</text:p>
        <text:p><draw:frame><draw:image xlink:href="Pictures/cell.png"/></draw:frame></text:p>
        <text:p>After <text:span>the</text:span> picture.</text:p>
      </office:text></office:body>
    </office:document-content>`;

    const { text, hrefs } = odfContentToMarkedText(xml);

    expect(hrefs).toEqual(["Pictures/cell.png"]);
    expect(text).toBe(
      "Cells\nBefore the picture.\n⟦IMG:Pictures/cell.png⟧\nAfter the picture.",
    );
  });
});

describe("weaveImageDescriptions", () => {
  const description = (
    overrides: Partial<ImageDescription>,
  ): ImageDescription => ({
    filename: "a.png",
    relevant: true,
    description: "",
    visibleText: "",
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    ...overrides,
  });

  it("replaces each marker in place and drops decorative or skipped images", () => {
    const text = `Intro\n${imageMarker(0)}\nMiddle\n${imageMarker(1)}\nEnd ${imageMarker(2)}`;

    const woven = weaveImageDescriptions(text, [
      description({
        marker: imageMarker(0),
        description: "A plant cell",
        visibleText: "Nucleus",
      }),
      description({
        marker: imageMarker(1),
        relevant: false,
        description: "Logo",
      }),
    ]);

    expect(woven).toBe(
      'Intro\n[Image: A plant cell Text in image: "Nucleus"]\nMiddle\n\nEnd ',
    );
  });

  it("appends descriptions that have no marker, such as package media", () => {
    const woven = weaveImageDescriptions("Body text", [
      description({ filename: "fig.png", description: "A graph" }),
    ]);

    expect(woven).toBe(
      "Body text\n\n[Embedded images]\n[Image 1: fig.png] A graph",
    );
  });

  it("strips leftover markers even when nothing was described", () => {
    expect(weaveImageDescriptions(`A ${imageMarker("x")} B`, [])).toBe("A  B");
    expect(stripImageMarkers(`${imageMarker(3)}text`)).toBe("text");
  });
});
