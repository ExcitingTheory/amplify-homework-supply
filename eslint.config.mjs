// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import i18next from "eslint-plugin-i18next";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import knownCssProperties from "known-css-properties";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load MUI props from generated file (run `npm run extract:mui-props` to regenerate)
let muiProps = [];
const muiPropsPath = path.join(__dirname, "scripts", "mui-props.json");
if (fs.existsSync(muiPropsPath)) {
  muiProps = JSON.parse(fs.readFileSync(muiPropsPath, "utf-8"));
  console.log(
    `📦 Loaded ${muiProps.length} Material UI prop names for i18n exclusion`,
  );
} else {
  console.warn(
    "⚠️  MUI props not found. Run `npm run extract:mui-props` to generate.",
  );
}

// Generate ignore patterns for all known CSS properties and common CSS values
const cssPropertyPatterns = knownCssProperties.all.map((prop) =>
  // Escape special regex characters in property names
  prop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
);

// Common CSS values that should be ignored
const commonCssValues = [
  "auto",
  "none",
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
  "flex",
  "grid",
  "block",
  "inline",
  "inline-block",
  "inline-flex",
  "inline-grid",
  "center",
  "left",
  "right",
  "top",
  "bottom",
  "middle",
  "baseline",
  "start",
  "end",
  "space-between",
  "space-around",
  "space-evenly",
  "stretch",
  "solid",
  "dashed",
  "dotted",
  "double",
  "groove",
  "ridge",
  "inset",
  "outset",
  "hidden",
  "visible",
  "scroll",
  "clip",
  "ellipsis",
  "relative",
  "absolute",
  "fixed",
  "sticky",
  "static",
  "fit-content",
  "max-content",
  "min-content",
  "uppercase",
  "lowercase",
  "capitalize",
  "bold",
  "normal",
  "lighter",
  "bolder",
  "wrap",
  "nowrap",
  "pre",
  "pre-wrap",
  "pre-line",
  "vertical",
  "horizontal",
  "pointer",
  "default",
  "move",
  "text",
  "wait",
  "help",
  "not-allowed",
  "row",
  "column",
  "row-reverse",
  "column-reverse",
];

// Shared i18next rule configuration
const i18nextRuleConfig = [
  "warn",
  {
    mode: "jsx-only",
    "jsx-attributes": {
      exclude: [
        // Standard HTML/React attributes
        "className",
        "style",
        "type",
        "id",
        "name",
        "key",
        "ref",
        "href",
        "src",
        "alt",
        "role",
        "data-testid",
        "contentType",
        "accept",
        "method",
        "target",
        "rel",
        "placeholder",
        "inputMode",
        "autoComplete",
        "enterKeyHint",
        "title",
        "slot",
        "part",
        // SVG attributes
        "viewBox",
        "xmlns",
        "fill",
        "fillRule",
        "stroke",
        "strokeWidth",
        "strokeLinecap",
        "strokeLinejoin",
        "d",
        "cx",
        "cy",
        "r",
        "rx",
        "ry",
        "x",
        "y",
        "x1",
        "y1",
        "x2",
        "y2",
        "width",
        "height",
        "points",
        "transform",
        "offset",
        "stopColor",
        "stopOpacity",
        "gradientUnits",
        "gradientTransform",
        // ARIA attributes
        "aria-label",
        "aria-labelledby",
        "aria-describedby",
        // Material UI props (auto-generated from TypeScript definitions)
        ...muiProps,
      ],
    },
    "jsx-components": {
      exclude: [
        "Icon",
        "IconButton",
        "SvgIcon",
        "MenuItem",
        "Option",
        "svg",
        "path",
        "circle",
        "rect",
        "line",
        "polyline",
        "polygon",
        "ellipse",
        "g",
        "defs",
        "clipPath",
        "mask",
        "pattern",
        "linearGradient",
        "radialGradient",
        "stop",
        "use",
        "symbol",
        "text",
        "tspan",
      ],
    },
    ignore: [
      "^\\s*$", // Empty strings
      "^[0-9]+$", // Numbers only
      "^[0-9.]+$", // Numbers with decimals
      "^[A-Z_]+$", // All caps (constants)
      "^[a-z-]+$", // Kebab case (CSS)
      "^[a-z]+[A-Z][a-zA-Z]*$", // camelCase
      "\\$\\{.*\\}", // Template literals
      "^/", // Paths
      "^https?://", // URLs
      "^#", // Hashes
      "^\\.", // Dot notation
      "^data:", // Data URLs
      "^blob:", // Blob URLs
      "^@", // Decorators/scoped packages
      // SVG technical content - paths, coordinates, dimensions
      "^[0-9.:, MLHVCSQTAZmlhvcsqtaz-]+$", // SVG path data and coordinates
      "xmlns", // XML namespace
      "viewBox", // SVG viewBox
      "^M[0-9]", // SVG path starting with M (move)
      "[0-9]\\.[0-9]:[0-9]", // SVG coordinate format like "1.5:5.2"
      // Technical method/property names
      "\\.id$",
      "\\.type$",
      "\\.name$",
      "\\.key$",
      "\\.value$",
      "startsWith\\(",
      "endsWith\\(",
      "includes\\(",
      "indexOf\\(",
      // CSS units - automatically ignore any string ending with these
      "px$",
      "%$",
      "em$",
      "rem$",
      "vh$",
      "vw$",
      "vmin$",
      "vmax$",
      "ch$",
      "ex$",
      "cm$",
      "mm$",
      "in$",
      "pt$",
      "pc$",
      "deg$",
      "rad$",
      "grad$",
      "turn$",
      "s$",
      "ms$",
      "fr$",
      // CSS property declarations (anything with colon-space pattern)
      ": ",
      // CSS functions
      "blur\\(",
      "brightness\\(",
      "contrast\\(",
      "grayscale\\(",
      "hue-rotate\\(",
      "invert\\(",
      "opacity\\(",
      "saturate\\(",
      "sepia\\(",
      "drop-shadow\\(",
      "translate\\(",
      "translateX\\(",
      "translateY\\(",
      "translateZ\\(",
      "translate3d\\(",
      "scale\\(",
      "scaleX\\(",
      "scaleY\\(",
      "scaleZ\\(",
      "scale3d\\(",
      "rotate\\(",
      "rotateX\\(",
      "rotateY\\(",
      "rotateZ\\(",
      "rotate3d\\(",
      "skew\\(",
      "skewX\\(",
      "skewY\\(",
      "matrix\\(",
      "matrix3d\\(",
      "perspective\\(",
      "rgb\\(",
      "rgba\\(",
      "hsl\\(",
      "hsla\\(",
      "var\\(",
      "calc\\(",
      "clamp\\(",
      "min\\(",
      "max\\(",
      // Common CSS values (generated from list)
      ...commonCssValues.map((value) => `^${value}$`),
      // CSS property names (generated from known-css-properties package)
      ...cssPropertyPatterns.map((prop) => `^${prop}$`),
      // GraphQL queries/mutations/subscriptions
      "^query ",
      "^mutation ",
      "^subscription ",
      "^fragment ",
      "GraphQL",
    ],
    ignoreAttribute: [
      "lang", // HTML language attribute
      "dir", // Text direction
    ],
    callees: {
      exclude: [
        "t", // i18next translation function
        "console.log",
        "console.warn",
        "console.error",
        "console.info",
        "console.debug",
        "console.trace",
        "require",
        "require.resolve",
        "DataStore",
        "DataStore.query",
        "DataStore.save",
        "DataStore.delete",
        "DataStore.observe",
        "DataStore.observeQuery",
        "JSON.stringify",
        "JSON.parse",
        "new Date",
        "Date",
        "Math",
        "Number",
        "parseInt",
        "parseFloat",
        "Boolean",
        "String",
        "Array",
        "Object",
        "Error",
        "TypeError",
        "Promise",
        "setTimeout",
        "setInterval",
        "clearTimeout",
        "clearInterval",
        "fetch",
        "URL",
        "URLSearchParams",
        "localStorage.getItem",
        "localStorage.setItem",
        "sessionStorage.getItem",
        "sessionStorage.setItem",
        "gql",
        "graphql",
      ],
    },
    ignoreProperty: [
      "key",
      "id",
      "type",
      "name",
      "className",
      "style",
      "props",
      "state",
      "ref",
      "displayName",
      "propTypes",
      "defaultProps",
      "contextType",
      "vertical",
      "horizontal",
      "labelPlacement",
      "labelId",
      "fontWeight",
      "usernameAttributes",
    ],
    markupOnly: false, // Also check JavaScript strings, not just JSX
  },
];

export default [
  {
    // JavaScript/JSX files
    files: ["src/**/*.{js,jsx}", "pages/**/*.{js,jsx}"],
    languageOptions: {
      parser: await import("@babel/eslint-parser").then((mod) => mod.default),
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-react"],
        },
      },
    },
    plugins: {
      i18next,
      "jsx-a11y": jsxA11y,
      "react-hooks": reactHooks,
    },
    rules: {
      "i18next/no-literal-string": i18nextRuleConfig,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // TypeScript story files — use storybook tsconfig (stories are excluded from root tsconfig)
    files: ["src/**/*.stories.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./config/tsconfig.stories.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      i18next,
    },
    rules: {
      "i18next/no-literal-string": "off",
    },
  },
  {
    // TypeScript files (non-story)
    files: ["src/**/*.{ts,tsx}", "pages/**/*.{ts,tsx}"],
    ignores: [
      "**/*.stories.{ts,tsx}",
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "**/__tests__/**",
    ],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      i18next,
      "react-hooks": reactHooks,
    },
    rules: {
      "i18next/no-literal-string": i18nextRuleConfig,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "amplify/**",
      "public/**",
      "*.config.js",
      "*.config.ts",
      "*.config.mjs",
      ".storybook/**",
      "src/stories/**",
      "**/__tests__/**",
      "**/__mocks__/**",
      "src/graphql/**",
      "pages/api/**",
    ],
  },
  {
    files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        // No `project` — test files aren't part of tsconfig's include paths,
        // this just gives them a TS-aware parser so TS syntax doesn't fail to parse.
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "i18next/no-literal-string": "off",
    },
  },
  {
    // Story files - turn off i18next rule for mock data
    files: ["**/*.stories.{js,jsx,ts,tsx}"],
    rules: {
      "i18next/no-literal-string": "off",
    },
  },
  ...storybook.configs["flat/recommended"],
];
