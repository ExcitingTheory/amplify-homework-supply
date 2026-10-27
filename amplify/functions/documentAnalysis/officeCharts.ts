/**
 * Turns the XML behind Office charts, SmartArt diagrams, and SVG images into
 * plain text. Charts and diagrams are stored as data, not pictures, so their
 * labels and values can be read exactly without a vision model.
 */
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  removeNSPrefix: true,
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

type XmlNode = Record<string, any>;

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/** Every `<a:t>` text run under a node, in document order. */
function textRuns(node: unknown, runs: string[] = []): string[] {
  if (node === null || typeof node !== "object") return runs;
  for (const [key, value] of Object.entries(node as XmlNode)) {
    for (const item of asArray(value)) {
      if (key === "t" && (typeof item !== "object" || item === null)) {
        const text = String(item).trim();
        if (text) runs.push(text);
      } else if (typeof item === "object" && item !== null) {
        // `dgm:t` wraps paragraphs while `a:t` is the text run itself; both
        // are named `t` once prefixes are removed.
        if (key === "t" && item["#text"] !== undefined) {
          const text = String(item["#text"]).trim();
          if (text) runs.push(text);
        }
        textRuns(item, runs);
      }
    }
  }
  return runs;
}

/** Cached points of a `strCache` / `numCache`, in index order. */
function cachePoints(cache: XmlNode | undefined): string[] {
  const points = asArray<XmlNode>(cache?.pt).map((point) => ({
    index: Number(point["@_idx"] ?? 0),
    value: String(point.v ?? ""),
  }));
  return points.sort((a, b) => a.index - b.index).map((point) => point.value);
}

function referenceCache(reference: XmlNode | undefined): string[] {
  return cachePoints(
    reference?.strRef?.strCache ??
      reference?.numRef?.numCache ??
      reference?.multiLvlStrRef?.multiLvlStrCache?.lvl,
  );
}

function titleText(title: XmlNode | undefined): string {
  return textRuns(title?.tx?.rich).join(" ");
}

const CHART_TYPE_LABELS: Record<string, string> = {
  barChart: "bar",
  bar3DChart: "3-D bar",
  lineChart: "line",
  line3DChart: "3-D line",
  pieChart: "pie",
  pie3DChart: "3-D pie",
  doughnutChart: "doughnut",
  areaChart: "area",
  area3DChart: "3-D area",
  scatterChart: "scatter",
  radarChart: "radar",
  bubbleChart: "bubble",
  stockChart: "stock",
};

function describeSeries(series: XmlNode): string | undefined {
  const name = referenceCache(series.tx)[0] ?? series.tx?.v;
  const xValues = referenceCache(series.xVal);
  const categories = xValues.length > 0 ? xValues : referenceCache(series.cat);
  const values = referenceCache(series.yVal ?? series.val);
  if (values.length === 0) return undefined;

  const points = values.map((value, index) =>
    categories[index] !== undefined ? `${categories[index]}=${value}` : value,
  );
  return `Series${name ? ` "${name}"` : ""}: ${points.join(", ")}`;
}

/** Returns a text description of a DrawingML chart part, or "" if unreadable. */
export function chartXmlToText(xml: string): string {
  let chart: XmlNode | undefined;
  try {
    chart = parser.parse(xml)?.chartSpace?.chart;
  } catch {
    return "";
  }
  if (!chart) return "";

  const title = titleText(chart.title);
  const plotArea: XmlNode = chart.plotArea ?? {};
  const lines: string[] = [];

  for (const [key, label] of Object.entries(CHART_TYPE_LABELS)) {
    for (const group of asArray<XmlNode>(plotArea[key])) {
      const series = asArray<XmlNode>(group.ser)
        .map(describeSeries)
        .filter((line): line is string => !!line);
      if (series.length > 0) lines.push(`${label} chart. ${series.join(" ")}`);
    }
  }
  if (lines.length === 0) return "";

  const axes = ["catAx", "dateAx", "valAx"]
    .flatMap((axis) => asArray<XmlNode>(plotArea[axis]))
    .map((axis) => titleText(axis.title))
    .filter(Boolean);

  const header = title ? `[Chart: ${title}]` : "[Chart]";
  const axisLine = axes.length > 0 ? ` Axes: ${axes.join(" / ")}.` : "";
  return `${header} ${lines.join(" ")}${axisLine}`;
}

/** Returns the text shown by a SmartArt diagram part, or "" if there is none. */
export function diagramXmlToText(xml: string): string {
  let runs: string[];
  try {
    runs = textRuns(parser.parse(xml));
  } catch {
    return "";
  }
  const unique = [...new Set(runs)];
  return unique.length > 0 ? `[Diagram] ${unique.join("; ")}` : "";
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

/** Returns the labels, title, and description text inside an SVG. */
export function svgToText(svg: string): string {
  const parts: string[] = [];
  for (const match of svg.matchAll(
    /<(text|title|desc)\b[^>]*>([\s\S]*?)<\/\1>/gi,
  )) {
    const text = match[2]
      .replace(/<[^>]*>/g, " ")
      .replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => ENTITIES[entity])
      .replace(/\s+/g, " ")
      .trim();
    if (text) parts.push(text);
  }
  return [...new Set(parts)].join(" | ");
}
