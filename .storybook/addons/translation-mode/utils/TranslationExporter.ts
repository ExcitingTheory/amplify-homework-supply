import { CapturedTranslation } from '../contexts/TranslationCaptureContext';

export interface ExportOptions {
  format: 'json' | 'diff' | 'csv';
  languages: string[];
  namespaces: string[];
  includeEmpty?: boolean;
}

export interface TranslationFileStructure {
  [namespace: string]: {
    [language: string]: Record<string, any>;
  };
}

export class TranslationExporter {
  /**
   * Export translations to JSON format (standard i18n structure)
   */
  static exportToJSON(
    translations: Map<string, CapturedTranslation>,
    options: ExportOptions
  ): TranslationFileStructure {
    const result: TranslationFileStructure = {};

    translations.forEach((translation) => {
      const { namespace, key, value } = translation;

      if (options.namespaces.length > 0 && !options.namespaces.includes(namespace)) {
        return;
      }

      if (!result[namespace]) {
        result[namespace] = {};
      }

      options.languages.forEach((lang) => {
        if (!result[namespace][lang]) {
          result[namespace][lang] = {};
        }

        // TODO: Get actual translation value for this language
        // For now, using English as default
        const translationValue = lang === 'en' ? value : '';

        if (translationValue || options.includeEmpty) {
          this.setNestedValue(result[namespace][lang], key, translationValue);
        }
      });
    });

    return result;
  }

  /**
   * Export as CSV for easy editing in spreadsheets
   */
  static exportToCSV(translations: Map<string, CapturedTranslation>, options: ExportOptions): string {
    const rows: string[][] = [];

    // Header row
    rows.push(['Namespace', 'Key', 'Context', ...options.languages]);

    translations.forEach((translation) => {
      const { namespace, key, context } = translation;

      if (options.namespaces.length > 0 && !options.namespaces.includes(namespace)) {
        return;
      }

      const row = [namespace, key, context || ''];

      options.languages.forEach((lang) => {
        // TODO: Get actual translation value for this language
        const translationValue = lang === 'en' ? translation.value : '';
        row.push(translationValue);
      });

      rows.push(row);
    });

    return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  /**
   * Export as diff format showing what changed
   */
  static exportToDiff(
    translations: Map<string, CapturedTranslation>,
    originalFiles: TranslationFileStructure,
    options: ExportOptions
  ): string {
    const newFiles = this.exportToJSON(translations, options);
    const diff: string[] = [];

    Object.keys(newFiles).forEach((namespace) => {
      diff.push(`\n=== Namespace: ${namespace} ===\n`);

      options.languages.forEach((lang) => {
        diff.push(`\n--- Language: ${lang} ---\n`);

        const original = originalFiles[namespace]?.[lang] || {};
        const updated = newFiles[namespace][lang];

        const allKeys = new Set([
          ...Object.keys(this.flattenObject(original)),
          ...Object.keys(this.flattenObject(updated)),
        ]);

        allKeys.forEach((key) => {
          const originalValue = this.getNestedValue(original, key);
          const updatedValue = this.getNestedValue(updated, key);

          if (originalValue !== updatedValue) {
            if (!originalValue) {
              diff.push(`+ ${key}: "${updatedValue}"\n`);
            } else if (!updatedValue) {
              diff.push(`- ${key}: "${originalValue}"\n`);
            } else {
              diff.push(`~ ${key}:\n`);
              diff.push(`  - "${originalValue}"\n`);
              diff.push(`  + "${updatedValue}"\n`);
            }
          }
        });
      });
    });

    return diff.join('');
  }

  /**
   * Download file to user's computer
   */
  static downloadFile(filename: string, content: string, mimeType: string = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate file downloads for all namespaces
   */
  static downloadTranslations(translations: Map<string, CapturedTranslation>, options: ExportOptions) {
    const structure = this.exportToJSON(translations, options);

    if (options.format === 'csv') {
      const csv = this.exportToCSV(translations, options);
      this.downloadFile('translations.csv', csv, 'text/csv');
      return;
    }

    Object.keys(structure).forEach((namespace) => {
      Object.keys(structure[namespace]).forEach((lang) => {
        const content = JSON.stringify(structure[namespace][lang], null, 2);
        this.downloadFile(`${lang}-${namespace}.json`, content);
      });
    });
  }

  /**
   * Download only the keys that were edited by merging them into the original
   * locale files. One file is downloaded per namespace/language combination.
   */
  static async downloadEditedValues(
    changedFullKeys: string[],
    editedValues: Record<string, Record<string, string>>,
    allTranslations: Map<string, { key: string; namespace: string }>,
    loadTranslationFn: (lang: string, namespace: string) => Promise<Record<string, any> | null>
  ): Promise<void> {
    // filesMap key: `${namespace}\0${lang}` → merged file content
    const filesMap = new Map<string, Record<string, any>>();

    for (const fullKey of changedFullKeys) {
      const t = allTranslations.get(fullKey);
      if (!t) continue;
      const values = editedValues[fullKey];
      if (!values) continue;

      for (const [lang, value] of Object.entries(values)) {
        if (value == null) continue;
        const fileKey = `${t.namespace}\0${lang}`;
        if (!filesMap.has(fileKey)) {
          const original = (await loadTranslationFn(lang, t.namespace)) ?? {};
          filesMap.set(fileKey, JSON.parse(JSON.stringify(original)));
        }
        this.setNestedValue(filesMap.get(fileKey)!, t.key, value);
      }
    }

    for (const [fileKey, content] of filesMap) {
      const sep = fileKey.indexOf('\0');
      const namespace = fileKey.slice(0, sep);
      const lang = fileKey.slice(sep + 1);
      this.downloadFile(`${namespace}.${lang}.json`, JSON.stringify(content, null, 2));
    }
  }

  /**
   * Helper: Set nested value in object using dot notation
   */
  static setNestedValue(obj: Record<string, any>, path: string, value: any) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Helper: Get nested value from object using dot notation
   */
  private static getNestedValue(obj: Record<string, any>, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Helper: Flatten nested object to dot notation
   */
  private static flattenObject(obj: Record<string, any>, prefix: string = ''): Record<string, any> {
    const flattened: Record<string, any> = {};

    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    });

    return flattened;
  }
}
