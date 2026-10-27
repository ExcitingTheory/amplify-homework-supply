#!/usr/bin/env node
/**
 * Generates the document fixtures that exercise image handling in document
 * analysis: embedded images, charts, legacy image formats (EMF, WMF, TIFF,
 * BMP), and a scanned PDF. Output goes to test/mocks/documents/.
 *
 * The fixtures are committed; run this only to regenerate them:
 *
 *   node scripts/generate-document-fixtures.mjs
 *
 * Needs LibreOffice (`soffice`) on the PATH. DOCX, ODT and the scanned PDF are
 * produced by LibreOffice itself so they have real-world structure; the
 * legacy image formats and chart parts are added around them.
 */
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import JSZip from "jszip";
import sharp from "sharp";
import * as XLSX from "xlsx";

const OUT = resolve("test/mocks/documents");
const MOCKS = resolve("test/mocks");
const work = mkdtempSync(join(tmpdir(), "doc-fixtures-"));
mkdirSync(OUT, { recursive: true });

function soffice(args) {
  execFileSync("soffice", ["--headless", "--norestore", ...args], {
    stdio: "ignore",
    timeout: 120_000,
  });
}

// ---------------------------------------------------------------------------
// Source images
// ---------------------------------------------------------------------------

/** A labelled water-cycle diagram, so a description has something to say. */
function diagramCanvas(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#1b5e8a";
  ctx.fillStyle = "#1b5e8a";
  ctx.lineWidth = 3;
  const label = (text, x, y) => {
    ctx.font = `bold ${Math.round(height / 12)}px sans-serif`;
    ctx.fillText(text, x, y);
  };
  ctx.strokeRect(width * 0.05, height * 0.6, width * 0.4, height * 0.3);
  label("Ocean", width * 0.15, height * 0.78);
  ctx.strokeRect(width * 0.55, height * 0.1, width * 0.4, height * 0.25);
  label("Cloud", width * 0.68, height * 0.26);
  label("Evaporation", width * 0.05, height * 0.45);
  label("Precipitation", width * 0.55, height * 0.55);
  ctx.beginPath();
  ctx.moveTo(width * 0.25, height * 0.58);
  ctx.lineTo(width * 0.6, height * 0.37);
  ctx.stroke();
  return canvas;
}

const diagramPng = diagramCanvas(480, 300).toBuffer("image/png");
const smallDiagramPng = diagramCanvas(240, 150).toBuffer("image/png");

/** Writes a 24-bit BMP; sharp cannot, so build the file by hand. */
function bmpFromCanvas(canvas) {
  const { width, height } = canvas;
  const pixels = canvas.getContext("2d").getImageData(0, 0, width, height).data;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const file = Buffer.alloc(54 + rowSize * height);
  file.write("BM", 0);
  file.writeUInt32LE(file.length, 2);
  file.writeUInt32LE(54, 10);
  file.writeUInt32LE(40, 14);
  file.writeInt32LE(width, 18);
  file.writeInt32LE(height, 22);
  file.writeUInt16LE(1, 26);
  file.writeUInt16LE(24, 28);
  file.writeUInt32LE(rowSize * height, 34);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const source = ((height - 1 - y) * width + x) * 4;
      const target = 54 + y * rowSize + x * 3;
      file[target] = pixels[source + 2];
      file[target + 1] = pixels[source + 1];
      file[target + 2] = pixels[source];
    }
  }
  return file;
}

const diagramBmp = bmpFromCanvas(diagramCanvas(200, 125));
const diagramTiff = await sharp(diagramPng).tiff({ compression: "lzw" }).toBuffer();

/** An SVG converted by LibreOffice, which can write EMF and WMF. */
function vectorFormat(format) {
  const svg = join(work, "vector.svg");
  writeFileSync(
    svg,
    `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="200">
      <rect x="4" y="4" width="352" height="192" fill="#ffffff" stroke="#000000" stroke-width="3"/>
      <text x="24" y="70" font-size="30" fill="#b00020">Condensation</text>
      <text x="24" y="130" font-size="30" fill="#00457c">Runoff</text>
    </svg>`,
  );
  soffice(["--convert-to", format, "--outdir", work, svg]);
  return readFileSync(join(work, `vector.${format}`));
}

const diagramEmf = vectorFormat("emf");
const diagramWmf = vectorFormat("wmf");

// ---------------------------------------------------------------------------
// Chart parts (DrawingML), shared by DOCX, PPTX and XLSX
// ---------------------------------------------------------------------------

const CHART_NS =
  'xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';

function barChart({ title, series, categories, valueAxis }) {
  const points = (values) =>
    values.map((v, i) => `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`).join("");
  const sers = series
    .map(
      (s, i) => `<c:ser><c:idx val="${i}"/><c:order val="${i}"/>
        <c:tx><c:strRef><c:f>Sheet1!$${String.fromCharCode(66 + i)}$1</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>${s.name}</c:v></c:pt></c:strCache></c:strRef></c:tx>
        <c:cat><c:strRef><c:f>Sheet1!$A$2:$A$${categories.length + 1}</c:f><c:strCache><c:ptCount val="${categories.length}"/>${points(categories)}</c:strCache></c:strRef></c:cat>
        <c:val><c:numRef><c:f>Sheet1!$${String.fromCharCode(66 + i)}$2:$${String.fromCharCode(66 + i)}$${categories.length + 1}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${s.values.length}"/>${points(s.values)}</c:numCache></c:numRef></c:val>
      </c:ser>`,
    )
    .join("");
  const axisTitle = (text) =>
    `<c:title><c:tx><c:rich><a:bodyPr/><a:p><a:r><a:t>${text}</a:t></a:r></a:p></c:rich></c:tx></c:title>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace ${CHART_NS}><c:chart>
  <c:title><c:tx><c:rich><a:bodyPr/><a:p><a:r><a:t>${title}</a:t></a:r></a:p></c:rich></c:tx></c:title>
  <c:plotArea><c:barChart><c:barDir val="col"/><c:grouping val="clustered"/>${sers}<c:axId val="1"/><c:axId val="2"/></c:barChart>
    <c:catAx><c:axId val="1"/>${axisTitle("Month")}<c:crossAx val="2"/></c:catAx>
    <c:valAx><c:axId val="2"/>${axisTitle(valueAxis)}<c:crossAx val="1"/></c:valAx>
  </c:plotArea></c:chart></c:chartSpace>`;
}

const RAINFALL_CHART = barChart({
  title: "Monthly rainfall",
  series: [{ name: "2024", values: [78, 64, 91, 120] }],
  categories: ["Jan", "Feb", "Mar", "Apr"],
  valueAxis: "Millimetres",
});

const CHART_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.drawingml.chart+xml";

async function addContentTypes(zip, entries) {
  const path = "[Content_Types].xml";
  let xml = await zip.file(path).async("text");
  for (const entry of entries) {
    if (!xml.includes(entry.match)) {
      xml = xml.replace("</Types>", `${entry.xml}</Types>`);
    }
  }
  zip.file(path, xml);
}

async function addRelationship(zip, relsPath, id, type, target) {
  const base =
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const current = zip.file(relsPath)
    ? await zip.file(relsPath).async("text")
    : '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  zip.file(
    relsPath,
    current.replace(
      "</Relationships>",
      `<Relationship Id="${id}" Type="${base}/${type}" Target="${target}"/></Relationships>`,
    ),
  );
}

// ---------------------------------------------------------------------------
// DOCX: LibreOffice-made, then an EMF picture and a native chart added
// ---------------------------------------------------------------------------

/** The image is inlined as a data URI; a file link would stay external. */
function lessonHtml() {
  const imagePath = `data:image/png;base64,${diagramPng.toString("base64")}`;
  return `<html><body>
    <h1>The Water Cycle</h1>
    <p>Water moves between the ocean, the air, and the land. The sun heats the ocean and the water evaporates.</p>
    <p><img src="${imagePath}" width="480" height="300"/></p>
    <p>Water vapor rises, cools, and condenses into clouds. Rain and snow return the water to the surface.</p>
  </body></html>`;
}

function drawing(kind, rId, id) {
  const ns =
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const graphic =
    kind === "chart"
      ? `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="${rId}"/></a:graphicData>`
      : `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="Picture ${id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="3000000" cy="1700000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData>`;
  return `<w:p><w:r><w:drawing><wp:inline ${ns}><wp:extent cx="3000000" cy="1700000"/><wp:docPr id="${id}" name="${kind} ${id}"/><a:graphic>${graphic}</a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

async function buildDocx() {
  const html = join(work, "lesson.html");
  writeFileSync(html, lessonHtml());
  soffice(["--convert-to", "docx:MS Word 2007 XML", "--outdir", work, html]);

  const zip = await JSZip.loadAsync(readFileSync(join(work, "lesson.docx")));
  zip.file("word/media/legacy1.emf", diagramEmf);
  zip.file("word/charts/chart1.xml", RAINFALL_CHART);
  await addContentTypes(zip, [
    { match: 'Extension="emf"', xml: '<Default Extension="emf" ContentType="image/x-emf"/>' },
    {
      match: "/word/charts/chart1.xml",
      xml: `<Override PartName="/word/charts/chart1.xml" ContentType="${CHART_CONTENT_TYPE}"/>`,
    },
  ]);
  const rels = "word/_rels/document.xml.rels";
  await addRelationship(zip, rels, "rIdLegacyEmf", "image", "media/legacy1.emf");
  await addRelationship(zip, rels, "rIdChart1", "chart", "charts/chart1.xml");

  const documentXml = await zip.file("word/document.xml").async("text");
  zip.file(
    "word/document.xml",
    documentXml.replace(
      /(<w:sectPr)/,
      `<w:p><w:r><w:t>The legacy figure below shows condensation and runoff.</w:t></w:r></w:p>${drawing("picture", "rIdLegacyEmf", 901)}<w:p><w:r><w:t>Rainfall by month is charted below.</w:t></w:r></w:p>${drawing("chart", "rIdChart1", 902)}$1`,
    ),
  );
  writeFileSync(
    join(OUT, "visual-lesson.docx"),
    await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }),
  );
}

// ---------------------------------------------------------------------------
// ODT: LibreOffice-made, then an EMF picture added
// ---------------------------------------------------------------------------

async function buildOdt() {
  const html = join(work, "lesson-odt.html");
  writeFileSync(html, lessonHtml());
  soffice(["--convert-to", "odt:writer8", "--outdir", work, html]);

  const zip = await JSZip.loadAsync(readFileSync(join(work, "lesson-odt.odt")));
  zip.file("Pictures/legacy1.emf", diagramEmf);
  const content = await zip.file("content.xml").async("text");
  const frame =
    '<text:p text:style-name="Standard">The legacy figure below shows condensation and runoff.</text:p>' +
    '<text:p text:style-name="Standard"><draw:frame draw:name="Legacy" text:anchor-type="as-char" svg:width="9cm" svg:height="5cm"><draw:image xlink:href="Pictures/legacy1.emf" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></draw:frame></text:p>';
  zip.file("content.xml", content.replace("</office:text>", `${frame}</office:text>`));
  const manifestPath = "META-INF/manifest.xml";
  const manifest = await zip.file(manifestPath).async("text");
  zip.file(
    manifestPath,
    manifest.replace(
      "</manifest:manifest>",
      '<manifest:file-entry manifest:full-path="Pictures/legacy1.emf" manifest:media-type="image/x-emf"/></manifest:manifest>',
    ),
  );
  writeFileSync(
    join(OUT, "visual-lesson.odt"),
    await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      mimeType: "application/vnd.oasis.opendocument.text",
    }),
  );
}

// ---------------------------------------------------------------------------
// PPTX (hand-built): a chart slide, a picture-only slide, a text slide
// ---------------------------------------------------------------------------

async function buildPptx() {
  const zip = new JSZip();
  const slide = (body) =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree>${body}</p:spTree></p:cSld></p:sld>`;
  const textBox = (text) =>
    `<p:sp><p:txBody><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>`;
  const rels = (target, type) =>
    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"/></Relationships>`;

  zip.file(
    "ppt/slides/slide1.xml",
    slide(
      textBox("Rainfall results") +
        '<p:graphicFrame><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId2"/></a:graphicData></a:graphic></p:graphicFrame>',
    ),
  );
  zip.file("ppt/slides/_rels/slide1.xml.rels", rels("../charts/chart1.xml", "chart"));
  zip.file("ppt/charts/chart1.xml", RAINFALL_CHART);

  zip.file(
    "ppt/slides/slide2.xml",
    slide(
      '<p:pic><p:blipFill><a:blip r:embed="rId2"/></p:blipFill></p:pic>',
    ),
  );
  zip.file("ppt/slides/_rels/slide2.xml.rels", rels("../media/image1.png", "image"));
  zip.file("ppt/media/image1.png", diagramPng);

  zip.file("ppt/slides/slide3.xml", slide(textBox("Summary: rain follows evaporation.")));
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/></Types>',
  );
  writeFileSync(
    join(OUT, "rainfall-deck.pptx"),
    await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }),
  );
}

// ---------------------------------------------------------------------------
// XLSX: SheetJS workbook plus a chart part and a picture
// ---------------------------------------------------------------------------

async function buildXlsx() {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Month", "2024"],
      ["Jan", 78],
      ["Feb", 64],
      ["Mar", 91],
      ["Apr", 120],
    ]),
    "Sheet1",
  );
  const zip = await JSZip.loadAsync(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
  zip.file("xl/charts/chart1.xml", RAINFALL_CHART);
  zip.file("xl/media/image1.png", smallDiagramPng);
  writeFileSync(
    join(OUT, "rainfall-data.xlsx"),
    await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }),
  );
}

// ---------------------------------------------------------------------------
// Scanned PDF: a page of text rendered to an image, with no text layer
// ---------------------------------------------------------------------------

function buildScannedPdf() {
  const canvas = createCanvas(1000, 1300);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1000, 1300);
  ctx.fillStyle = "#111111";
  ctx.font = "bold 48px serif";
  ctx.fillText("Chapter 3: The Water Cycle", 80, 140);
  ctx.font = "34px serif";
  [
    "Evaporation is the process by which liquid water",
    "becomes water vapor when it is heated by the sun.",
    "",
    "Condensation occurs when water vapor cools and",
    "forms the tiny droplets that make up clouds.",
    "",
    "Precipitation is water that falls from clouds as",
    "rain, snow, sleet, or hail.",
  ].forEach((line, index) => ctx.fillText(line, 80, 260 + index * 56));
  const png = join(work, "scanned.png");
  writeFileSync(png, canvas.toBuffer("image/png"));
  soffice(["--convert-to", "pdf", "--outdir", work, png]);
  copyFileSync(join(work, "scanned.pdf"), join(OUT, "scanned-page.pdf"));
}

// ---------------------------------------------------------------------------
// Packages: existing EPUB and IMS CC with legacy image formats added
// ---------------------------------------------------------------------------

async function withLegacyMedia(source, target, folder) {
  const zip = await JSZip.loadAsync(readFileSync(join(MOCKS, source)));
  zip.file(`${folder}/diagram.emf`, diagramEmf);
  zip.file(`${folder}/diagram.wmf`, diagramWmf);
  zip.file(`${folder}/diagram.tif`, diagramTiff);
  zip.file(`${folder}/diagram.bmp`, diagramBmp);
  zip.file(`${folder}/diagram.png`, diagramPng);
  writeFileSync(
    join(OUT, target),
    await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }),
  );
}

try {
  await buildDocx();
  await buildOdt();
  await buildPptx();
  await buildXlsx();
  buildScannedPdf();
  await withLegacyMedia("water-cycle-guide.epub", "legacy-media.epub", "OEBPS/images");
  await withLegacyMedia("japanese-grammar-course.imscc", "legacy-media.imscc", "web_resources");
  console.log(`Fixtures written to ${OUT}`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
