import { getRequestConfig } from "next-intl/server";
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

function isSupportedLocale(
  locale: unknown,
): locale is (typeof routing.locales)[number] {
  return (
    typeof locale === "string" &&
    (routing.locales as readonly string[]).includes(locale)
  );
}

function mergeMessages(
  base: Record<string, any>,
  override: Record<string, any>,
): Record<string, any> {
  const merged = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = merged[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      merged[key] = mergeMessages(baseValue, value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isSupportedLocale(requested)
    ? requested
    : routing.defaultLocale;

  // Load all namespace files and merge into a single messages object.
  // Dotted namespaces (e.g. "editor.authoring") are nested so that
  // next-intl can resolve them via useTranslations('editor.authoring').
  const messages: Record<string, any> = {};
  const localesRoot = path.join(process.cwd(), "public", "locales");
  const localesToLoad =
    locale === routing.defaultLocale
      ? [locale]
      : [routing.defaultLocale, locale];

  for (const sourceLocale of localesToLoad) {
    for (const ns of namespaces) {
      try {
        const filePath = path.join(localesRoot, sourceLocale, `${ns}.json`);
        const content = readFileSync(filePath, "utf-8");
        const data = JSON.parse(content);
        const parts = ns.split(".");
        if (parts.length === 1) {
          messages[ns] = mergeMessages(messages[ns] ?? {}, data);
        } else {
          // Nest dotted namespace: "editor.authoring" → messages.editor.authoring
          let target = messages;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!target[parts[i]] || typeof target[parts[i]] !== "object") {
              target[parts[i]] = {};
            }
            target = target[parts[i]];
          }
          const namespaceKey = parts[parts.length - 1];
          target[namespaceKey] = mergeMessages(
            target[namespaceKey] ?? {},
            data,
          );
        }
      } catch {
        // Namespace files may be absent for a locale; English remains the fallback.
      }
    }
  }

  return {
    locale,
    messages,
  };
});
