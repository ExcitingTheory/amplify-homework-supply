import { SEMANTIC_THEME } from "../../../themes/semanticTheme";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function mergeEditorTheme(baseTheme, overrideTheme = {}) {
  return Object.entries(overrideTheme).reduce(
    (mergedTheme, [key, overrideValue]) => {
      const baseValue = mergedTheme[key];
      if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
        return {
          ...mergedTheme,
          [key]: mergeEditorTheme(baseValue, overrideValue),
        };
      }

      return {
        ...mergedTheme,
        [key]: overrideValue,
      };
    },
    Array.isArray(baseTheme) ? [...baseTheme] : { ...baseTheme },
  );
}

export function createLanguageEditorTheme(overrides = {}) {
  return mergeEditorTheme(SEMANTIC_THEME.editor.lexicalTheme, overrides);
}

export default createLanguageEditorTheme();
