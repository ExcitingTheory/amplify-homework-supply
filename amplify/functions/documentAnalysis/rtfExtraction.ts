/**
 * RTF extraction — converts Rich Text Format documents to plain text.
 *
 * A small tokenizer rather than a regex strip: RTF nests destination groups
 * (font tables, embedded pictures, field instructions) whose contents must not
 * leak into the text, and text escapes (\'hh code-page bytes, \uN Unicode with
 * a fallback character) must be decoded rather than copied.
 */
import type { FormatExtractionResult } from "./formatRegistry.js";
import { getS3Object } from "./textExtraction.js";

/** Destinations whose contents are never document text. */
const SKIPPED_DESTINATIONS = new Set([
  "fonttbl",
  "colortbl",
  "stylesheet",
  "info",
  "header",
  "headerl",
  "headerr",
  "headerf",
  "footer",
  "footerl",
  "footerr",
  "footerf",
  "pict",
  "nonshppict",
  "objdata",
  "themedata",
  "colorschememapping",
  "latentstyles",
  "listtable",
  "listoverridetable",
  "revtbl",
  "rsidtbl",
  "generator",
  "xmlnstbl",
  "datastore",
  "fldinst",
  "datafield",
  "bkmkstart",
  "bkmkend",
  "pgptbl",
  "blipuid",
  "upr",
  "sp",
  "sn",
  "sv",
]);

/** `\*` destinations that still hold visible text. */
const KEPT_STAR_DESTINATIONS = new Set(["shpinst", "shptxt", "ud"]);

const SYMBOLS: Record<string, string> = {
  emdash: "—",
  endash: "–",
  emspace: "\u2003",
  enspace: "\u2002",
  qmspace: "\u2005",
  bullet: "•",
  lquote: "‘",
  rquote: "’",
  ldblquote: "“",
  rdblquote: "”",
  zwj: "\u200d",
  zwnj: "\u200c",
  tab: "\t",
  cell: "\t",
  nestcell: "\t",
  line: "\n",
  par: "\n",
  row: "\n",
  nestrow: "\n",
  sect: "\n\n",
  page: "\n\n",
};

/** \fcharset values that imply a code page other than the document default. */
const CHARSET_CODE_PAGES: Record<number, number> = {
  77: 10000,
  128: 932,
  129: 949,
  134: 936,
  136: 950,
  161: 1253,
  162: 1254,
  163: 1258,
  177: 1255,
  178: 1256,
  186: 1257,
  204: 1251,
  222: 874,
  238: 1250,
};

const decoders = new Map<number, TextDecoder>();

function decoderLabel(codePage: number): string {
  if (codePage >= 1250 && codePage <= 1258) return `windows-${codePage}`;
  switch (codePage) {
    case 874:
      return "windows-874";
    case 932:
      return "shift_jis";
    case 936:
      return "gbk";
    case 949:
      return "euc-kr";
    case 950:
      return "big5";
    case 10000:
      return "macintosh";
    case 65001:
      return "utf-8";
    default:
      return "windows-1252";
  }
}

function decodeBytes(bytes: number[], codePage: number): string {
  let decoder = decoders.get(codePage);
  if (!decoder) {
    try {
      decoder = new TextDecoder(decoderLabel(codePage));
    } catch {
      decoder = new TextDecoder("windows-1252");
    }
    decoders.set(codePage, decoder);
  }
  return decoder.decode(Uint8Array.from(bytes));
}

interface GroupState {
  skip: boolean;
  /** Fallback characters following each \uN (\ucN). */
  unicodeSkip: number;
  font: number | undefined;
  inFontTable: boolean;
}

const isLetter = (char: string | undefined) =>
  char !== undefined && /[a-zA-Z]/.test(char);

/**
 * Convert RTF source to plain text. `rtf` must be the file's bytes decoded as
 * latin1 so every byte stays one character (code-page text is decoded here).
 */
export function rtfToText(rtf: string): string {
  const source = rtf.replace(/^\uFEFF/, "").trimStart();
  if (!source.startsWith("{\\rtf")) {
    throw new Error("Invalid RTF: missing {\\rtf header");
  }

  const output: string[] = [];
  let pendingBytes: number[] = [];
  let pendingCodePage = 1252;
  let documentCodePage = 1252;
  const fontCodePages = new Map<number, number>();
  const stack: GroupState[] = [];
  let group: GroupState = {
    skip: false,
    unicodeSkip: 1,
    font: undefined,
    inFontTable: false,
  };
  let fontEntry: number | undefined;
  let fallbackToSkip = 0;
  let starPending = false;

  const flushBytes = () => {
    if (pendingBytes.length > 0) {
      output.push(decodeBytes(pendingBytes, pendingCodePage));
      pendingBytes = [];
    }
  };
  const emit = (text: string) => {
    if (group.skip) return;
    flushBytes();
    output.push(text);
  };
  const emitByte = (byte: number) => {
    if (group.skip) return;
    const codePage =
      (group.font !== undefined ? fontCodePages.get(group.font) : undefined) ??
      documentCodePage;
    if (pendingBytes.length > 0 && codePage !== pendingCodePage) flushBytes();
    pendingCodePage = codePage;
    pendingBytes.push(byte);
  };

  let i = 0;
  while (i < source.length) {
    const char = source[i];

    if (char === "{") {
      stack.push(group);
      group = { ...group };
      fallbackToSkip = 0;
      starPending = false;
      i += 1;
    } else if (char === "}") {
      flushBytes();
      group = stack.pop() ?? group;
      fallbackToSkip = 0;
      starPending = false;
      i += 1;
    } else if (char === "\\") {
      const next = source[i + 1];
      if (next === undefined) break;

      if (isLetter(next)) {
        let end = i + 1;
        while (isLetter(source[end])) end += 1;
        const word = source.slice(i + 1, end);
        let parameter: number | undefined;
        const numeric = /^-?\d{1,10}/.exec(source.slice(end, end + 12));
        if (numeric) {
          parameter = Number.parseInt(numeric[0], 10);
          end += numeric[0].length;
        }
        if (source[end] === " ") end += 1;
        i = end;
        fallbackToSkip = 0;

        if (starPending) {
          starPending = false;
          if (!KEPT_STAR_DESTINATIONS.has(word)) group.skip = true;
        }

        if (word === "bin") {
          i += Math.max(parameter ?? 0, 0);
        } else if (word === "u" && parameter !== undefined) {
          emit(String.fromCharCode(parameter < 0 ? parameter + 65536 : parameter));
          fallbackToSkip = group.unicodeSkip;
        } else if (word === "uc") {
          group.unicodeSkip = Math.max(parameter ?? 1, 0);
        } else if (word === "ansicpg" && parameter !== undefined) {
          documentCodePage = parameter;
        } else if (word === "mac") {
          documentCodePage = 10000;
        } else if (word === "f" && parameter !== undefined) {
          group.font = parameter;
          if (group.inFontTable) fontEntry = parameter;
        } else if (
          (word === "fcharset" || word === "cpg") &&
          group.inFontTable &&
          fontEntry !== undefined &&
          parameter !== undefined
        ) {
          const codePage =
            word === "cpg" ? parameter : CHARSET_CODE_PAGES[parameter];
          if (codePage !== undefined) fontCodePages.set(fontEntry, codePage);
        } else if (word === "fonttbl") {
          group.skip = true;
          group.inFontTable = true;
        } else if (SKIPPED_DESTINATIONS.has(word)) {
          group.skip = true;
        } else if (Object.hasOwn(SYMBOLS, word)) {
          emit(SYMBOLS[word]);
        }
      } else {
        i += 2;
        fallbackToSkip = next === "'" ? fallbackToSkip : 0;
        if (next === "'") {
          const hex = source.slice(i, i + 2);
          i += 2;
          if (/^[0-9a-fA-F]{2}$/.test(hex)) {
            if (fallbackToSkip > 0) fallbackToSkip -= 1;
            else emitByte(Number.parseInt(hex, 16));
          }
        } else if (next === "*") {
          starPending = true;
        } else if (next === "\\" || next === "{" || next === "}") {
          emit(next);
        } else if (next === "~") {
          emit("\u00a0");
        } else if (next === "_") {
          emit("-");
        } else if (next === "\n" || next === "\r") {
          emit("\n");
        }
      }
    } else if (char === "\r" || char === "\n") {
      i += 1;
    } else if (fallbackToSkip > 0) {
      fallbackToSkip -= 1;
      i += 1;
    } else {
      let end = i + 1;
      while (end < source.length && !"\\{}\r\n".includes(source[end])) end += 1;
      emit(source.slice(i, end));
      i = end;
    }
  }
  flushBytes();

  return output
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extract text from an RTF file stored in S3. */
export async function extractRtf(
  s3Key: string,
): Promise<FormatExtractionResult> {
  const buffer = await getS3Object(s3Key);
  const text = rtfToText(buffer.toString("latin1"));
  return {
    text,
    pages: [{ pageNumber: 1, text }],
    pageCount: Math.ceil(text.length / 2000),
    sourceFormat: "rtf",
  };
}
