// Ambient shim: html-to-text ships no type declarations. Not a .d.ts so it survives the *.d.ts gitignore rule.
declare module "html-to-text" {
  interface HtmlToTextOptions {
    wordwrap?: number | false | null;
    preserveNewlines?: boolean;
    selectors?: Array<{
      selector: string;
      format?: string;
      options?: Record<string, unknown>;
    }>;
    [key: string]: unknown;
  }
  export function convert(html: string, options?: HtmlToTextOptions): string;
}
