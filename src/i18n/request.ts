import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { readFileSync } from "fs";
import path from "path";
import { routing } from "./routing";

/**
 * Loads all namespace translation files for the resolved locale.
 * Messages are split across namespace files in public/locales/{locale}/.
 *
 * Uses fs.readFileSync instead of dynamic import() to avoid:
 * 1. Turbopack cache-boundary analysis hangs (dynamic import template literals)
 * 2. PPR "uncached data" warnings (async readFile is treated as dynamic I/O)
 *
 * readFileSync is fine here because locale JSON files are static assets.
 */
const namespaces = [
  "auth",
  "common",
  "components",
  "pages",
  "editor",
  "editor.authoring",
  "editor.files",
  "editor.ai",
  "editor.blocks",
  "editor.shared",
  "workbook",
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Load all namespace files and merge into a single messages object.
  // Dotted namespaces (e.g. "editor.authoring") are nested so that
  // next-intl can resolve them via useTranslations('editor.authoring').
  const messages: Record<string, any> = {};
  const localesDir = path.join(process.cwd(), "public", "locales", locale!);

  for (const ns of namespaces) {
    try {
      const filePath = path.join(localesDir, `${ns}.json`);
      const content = readFileSync(filePath, "utf-8");
      const data = JSON.parse(content);
      const parts = ns.split(".");
      if (parts.length === 1) {
        messages[ns] = data;
      } else {
        // Nest dotted namespace: "editor.authoring" → messages.editor.authoring
        let target = messages;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!target[parts[i]] || typeof target[parts[i]] !== "object") {
            target[parts[i]] = {};
          }
          target = target[parts[i]];
        }
        target[parts[parts.length - 1]] = data;
      }
    } catch {
      // Namespace file may not exist for all locales - skip gracefully
    }
  }

  return {
    locale,
    messages,
  };
});
