import type { Components, Theme, ThemeOptions } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { roundedCheckboxIcons } from "../components/RoundedCheckboxIcon";

export const SEMANTIC_THEME = {
  spacing: {
    pageGap: 24,
    panelGap: 24,
    itemGap: 16,
    itemGapCompact: 12,
    toolbarGap: 8,
  },
  padding: {
    pageDesktop: 24,
    pageMobile: 16,
    panelDesktop: 24,
    panelMobile: 16,
    cardDesktop: 16,
    cardMobile: 14,
    toolbarX: 16,
    toolbarY: 8,
    floatingAction: 24,
  },
  radius: {
    panel: 12,
    card: 8,
    control: 8,
    chip: 6,
    progress: 4,
    modal: 8,
  },
  elevation: {
    card: 0,
    cardHover: 4,
    overlay: 5,
    appBar: 4,
    floatingAction: 8,
    floatingActionHover: 12,
  },
  surface: {
    appBarBlur: "blur(8px)",
    overlayBlur: "blur(10px)",
    modalBlur: "blur(18px)",
    lightGlass: "rgba(255, 255, 255, 0.86)",
    lightOverlay: "rgba(255, 255, 255, 0.34)",
    lightDrawer: "rgba(255, 255, 255, 0.94)",
    lightDrawerBackdrop: "rgba(255, 255, 255, 0.46)",
    lightDragHandle: "rgba(0, 0, 0, 0.22)",
    darkGlass: "rgba(18, 18, 18, 0.88)",
    darkOverlay: "rgba(0, 0, 0, 0.42)",
    darkDrawer: "rgba(18, 18, 18, 0.94)",
    darkDrawerBackdrop: "rgba(0, 0, 0, 0.48)",
    darkDragHandle: "rgba(255, 255, 255, 0.35)",
  },
  typography: {
    fontFamily:
      '"Source Sans 3", "Aptos", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    codeFontFamily:
      '"SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    headingWeight: 700,
    controlWeight: 600,
    denseCaptionSize: "0.75rem",
    scale: {
      h1: "2.5rem",
      h2: "2rem",
      h3: "1.75rem",
      h4: "1.5rem",
      h5: "1.25rem",
      h6: "1.0625rem",
      body1: "1rem",
      body2: "0.875rem",
      caption: "0.75rem",
    },
    lineHeight: {
      heading: 1.18,
      body: 1.55,
      dense: 1.28,
    },
  },
  editor: {
    // Compact heading scale for editor/NarrativeReader content: a real
    // hierarchy that stays tighter than the full page type scale so dense
    // workbook content doesn't balloon. Injected as CSS vars via MuiCssBaseline.
    headings: {
      h1: { size: "1.75rem", weight: 700 },
      h2: { size: "1.5rem", weight: 700 },
      h3: { size: "1.25rem", weight: 600 },
      h4: { size: "1.125rem", weight: 600 },
      h5: { size: "1rem", weight: 600 },
      h6: { size: "0.9375rem", weight: 600 },
    },
    lexicalTheme: {
      blockCursor: "LanguageEditorTheme__blockCursor",
      characterLimit: "LanguageEditorTheme__characterLimit",
      code: "LanguageEditorTheme__code",
      codeHighlight: {
        atrule: "LanguageEditorTheme__tokenAttr",
        attr: "LanguageEditorTheme__tokenAttr",
        boolean: "LanguageEditorTheme__tokenProperty",
        builtin: "LanguageEditorTheme__tokenSelector",
        cdata: "LanguageEditorTheme__tokenComment",
        char: "LanguageEditorTheme__tokenSelector",
        class: "LanguageEditorTheme__tokenFunction",
        "class-name": "LanguageEditorTheme__tokenFunction",
        comment: "LanguageEditorTheme__tokenComment",
        constant: "LanguageEditorTheme__tokenProperty",
        deleted: "LanguageEditorTheme__tokenProperty",
        doctype: "LanguageEditorTheme__tokenComment",
        entity: "LanguageEditorTheme__tokenOperator",
        function: "LanguageEditorTheme__tokenFunction",
        important: "LanguageEditorTheme__tokenVariable",
        inserted: "LanguageEditorTheme__tokenSelector",
        keyword: "LanguageEditorTheme__tokenAttr",
        namespace: "LanguageEditorTheme__tokenVariable",
        number: "LanguageEditorTheme__tokenProperty",
        operator: "LanguageEditorTheme__tokenOperator",
        prolog: "LanguageEditorTheme__tokenComment",
        property: "LanguageEditorTheme__tokenProperty",
        punctuation: "LanguageEditorTheme__tokenPunctuation",
        regex: "LanguageEditorTheme__tokenVariable",
        selector: "LanguageEditorTheme__tokenSelector",
        string: "LanguageEditorTheme__tokenSelector",
        symbol: "LanguageEditorTheme__tokenProperty",
        tag: "LanguageEditorTheme__tokenProperty",
        url: "LanguageEditorTheme__tokenOperator",
        variable: "LanguageEditorTheme__tokenVariable",
      },
      embedBlock: {
        base: "LanguageEditorTheme__embedBlock",
        focus: "LanguageEditorTheme__embedBlockFocus",
      },
      hashtag: "LanguageEditorTheme__hashtag",
      heading: {
        h1: "LanguageEditorTheme__h1",
        h2: "LanguageEditorTheme__h2",
        h3: "LanguageEditorTheme__h3",
        h4: "LanguageEditorTheme__h4",
        h5: "LanguageEditorTheme__h5",
        h6: "LanguageEditorTheme__h6",
      },
      image: "editor-image",
      indent: "LanguageEditorTheme__indent",
      inlineImage: "inline-editor-image",
      layoutContainer: "LanguageEditorTheme__layoutContaner",
      layoutItem: "LanguageEditorTheme__layoutItem",
      link: "LanguageEditorTheme__link",
      list: {
        listitem: "LanguageEditorTheme__listItem",
        listitemChecked: "LanguageEditorTheme__listItemChecked",
        listitemUnchecked: "LanguageEditorTheme__listItemUnchecked",
        nested: {
          listitem: "LanguageEditorTheme__nestedListItem",
        },
        olDepth: [
          "LanguageEditorTheme__ol1",
          "LanguageEditorTheme__ol2",
          "LanguageEditorTheme__ol3",
          "LanguageEditorTheme__ol4",
          "LanguageEditorTheme__ol5",
        ],
        ul: "LanguageEditorTheme__ul",
      },
      ltr: "LanguageEditorTheme__ltr",
      mark: "LanguageEditorTheme__mark",
      markOverlap: "LanguageEditorTheme__markOverlap",
      paragraph: "LanguageEditorTheme__paragraph",
      quote: "LanguageEditorTheme__quote",
      rtl: "LanguageEditorTheme__rtl",
      table: "LanguageEditorTheme__table",
      tableAddColumns: "LanguageEditorTheme__tableAddColumns",
      tableAddColumnsVisible: "LanguageEditorTheme__tableAddColumnsVisible",
      tableAddRows: "LanguageEditorTheme__tableAddRows",
      tableAddRowsVisible: "LanguageEditorTheme__tableAddRowsVisible",
      tableWrapper: "LanguageEditorTheme__tableWrapper",
      tableCell: "LanguageEditorTheme__tableCell",
      tableCellActionButton: "LanguageEditorTheme__tableCellActionButton",
      tableCellActionButtonContainer:
        "LanguageEditorTheme__tableCellActionButtonContainer",
      tableCellEditing: "LanguageEditorTheme__tableCellEditing",
      tableCellHeader: "LanguageEditorTheme__tableCellHeader",
      tableCellPrimarySelected: "LanguageEditorTheme__tableCellPrimarySelected",
      tableCellResizer: "LanguageEditorTheme__tableCellResizer",
      tableCellSelected: "LanguageEditorTheme__tableCellSelected",
      tableCellSortedIndicator: "LanguageEditorTheme__tableCellSortedIndicator",
      tableResizeRuler: "LanguageEditorTheme__tableCellResizeRuler",
      tableSelected: "LanguageEditorTheme__tableSelected",
      tableSelection: "LanguageEditorTheme__tableSelection",
      text: {
        bold: "LanguageEditorTheme__textBold",
        code: "LanguageEditorTheme__textCode",
        italic: "LanguageEditorTheme__textItalic",
        strikethrough: "LanguageEditorTheme__textStrikethrough",
        subscript: "LanguageEditorTheme__textSubscript",
        superscript: "LanguageEditorTheme__textSuperscript",
        underline: "LanguageEditorTheme__textUnderline",
        underlineStrikethrough:
          "LanguageEditorTheme__textUnderlineStrikethrough",
      },
    },
  },
} as const;

export type SemanticTheme = typeof SEMANTIC_THEME;

export function getSemanticThemeOptions(): ThemeOptions {
  return {
    shape: {
      borderRadius: 4,
    },
    spacing: 8,
    typography: {
      fontFamily: SEMANTIC_THEME.typography.fontFamily,
      h1: {
        fontSize: SEMANTIC_THEME.typography.scale.h1,
        fontWeight: SEMANTIC_THEME.typography.headingWeight,
        lineHeight: SEMANTIC_THEME.typography.lineHeight.heading,
      },
      h2: {
        fontSize: SEMANTIC_THEME.typography.scale.h2,
        fontWeight: SEMANTIC_THEME.typography.headingWeight,
        lineHeight: SEMANTIC_THEME.typography.lineHeight.heading,
      },
      h3: {
        fontSize: SEMANTIC_THEME.typography.scale.h3,
        fontWeight: SEMANTIC_THEME.typography.headingWeight,
        lineHeight: SEMANTIC_THEME.typography.lineHeight.heading,
      },
      h4: {
        fontSize: SEMANTIC_THEME.typography.scale.h4,
        fontWeight: SEMANTIC_THEME.typography.headingWeight,
        lineHeight: SEMANTIC_THEME.typography.lineHeight.heading,
      },
      h5: {
        fontSize: SEMANTIC_THEME.typography.scale.h5,
        fontWeight: SEMANTIC_THEME.typography.headingWeight,
        lineHeight: SEMANTIC_THEME.typography.lineHeight.heading,
      },
      h6: {
        fontSize: SEMANTIC_THEME.typography.scale.h6,
        fontWeight: SEMANTIC_THEME.typography.headingWeight,
        lineHeight: SEMANTIC_THEME.typography.lineHeight.heading,
      },
      body1: {
        fontSize: SEMANTIC_THEME.typography.scale.body1,
        lineHeight: SEMANTIC_THEME.typography.lineHeight.body,
      },
      body2: {
        fontSize: SEMANTIC_THEME.typography.scale.body2,
        lineHeight: SEMANTIC_THEME.typography.lineHeight.body,
      },
      caption: {
        fontSize: SEMANTIC_THEME.typography.scale.caption,
        lineHeight: SEMANTIC_THEME.typography.lineHeight.dense,
      },
      button: {
        textTransform: "none",
        fontWeight: SEMANTIC_THEME.typography.controlWeight,
      },
    },
  };
}

// Soft, readable status chips: tinted background + same-hue text (AA in light
// and dark), neutral grey for the `default`/zero case so counts never read as
// alarming white-on-red badges.
const STATUS_CHIP_COLORS = [
  "primary",
  "secondary",
  "success",
  "warning",
  "error",
  "info",
] as const;

function buildStatusChipVariants(): NonNullable<
  NonNullable<Components<Theme>["MuiChip"]>["variants"]
> {
  const base = {
    border: "none",
    borderRadius: SEMANTIC_THEME.radius.chip,
    fontWeight: SEMANTIC_THEME.typography.controlWeight,
    "& .MuiChip-icon, & .MuiChip-deleteIcon": { color: "inherit" },
  } as const;
  return [
    {
      props: { variant: "status" as const, color: "default" as const },
      style: ({ theme }: { theme: Theme }) => ({
        ...base,
        backgroundColor: theme.palette.action.selected,
        color: theme.palette.text.secondary,
      }),
    },
    ...STATUS_CHIP_COLORS.map((color) => ({
      props: { variant: "status" as const, color },
      style: ({ theme }: { theme: Theme }) => ({
        ...base,
        backgroundColor: alpha(theme.palette[color].main, 0.16),
        color: theme.palette[color].main,
      }),
    })),
  ];
}

// Editor CSS variables sourced from SEMANTIC_THEME so the Lexical stylesheets
// (theme.css / LanguageEditorTheme.css) consume tokens instead of magic numbers.
// Color-scheme independent, so injected once at :root.
const editorH = SEMANTIC_THEME.editor.headings;
const editorRootCssVars = `
:root {
  --let-radius-card: ${SEMANTIC_THEME.radius.card}px;
  --let-radius-control: ${SEMANTIC_THEME.radius.control}px;
  --let-radius-chip: ${SEMANTIC_THEME.radius.chip}px;
  --let-radius-modal: ${SEMANTIC_THEME.radius.modal}px;
  --let-h1-size: ${editorH.h1.size};
  --let-h2-size: ${editorH.h2.size};
  --let-h3-size: ${editorH.h3.size};
  --let-h4-size: ${editorH.h4.size};
  --let-h5-size: ${editorH.h5.size};
  --let-h6-size: ${editorH.h6.size};
  --let-h1-weight: ${editorH.h1.weight};
  --let-h2-weight: ${editorH.h2.weight};
  --let-h3-weight: ${editorH.h3.weight};
  --let-h4-weight: ${editorH.h4.weight};
  --let-h5-weight: ${editorH.h5.weight};
  --let-h6-weight: ${editorH.h6.weight};
  --let-heading-line-height: ${SEMANTIC_THEME.typography.lineHeight.heading};
  --let-heading-line-height-dense: ${SEMANTIC_THEME.typography.lineHeight.dense};
}

pre,
code,
kbd,
samp {
  font-family: ${SEMANTIC_THEME.typography.codeFontFamily};
}
`;

export const semanticComponentOverrides: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: editorRootCssVars,
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: "none",
        fontWeight: SEMANTIC_THEME.typography.controlWeight,
        borderRadius: SEMANTIC_THEME.radius.control,
      },
    },
  },
  MuiCheckbox: {
    defaultProps: {
      ...roundedCheckboxIcons,
    },
    styleOverrides: {
      root: {
        padding: 8,
        borderRadius: SEMANTIC_THEME.radius.chip,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: SEMANTIC_THEME.radius.card,
      },
    },
    variants: [
      {
        props: { variant: "assignment" },
        style: ({ theme }) => ({
          borderRadius: SEMANTIC_THEME.radius.card,
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          backgroundColor: alpha(theme.palette.primary.main, 0.02),
          boxShadow: theme.shadows[SEMANTIC_THEME.elevation.card],
          transition: theme.transitions.create(["box-shadow", "transform"], {
            duration: theme.transitions.duration.shorter,
          }),
          "&:hover": {
            boxShadow: theme.shadows[SEMANTIC_THEME.elevation.cardHover],
            transform: "translateY(-2px)",
          },
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
            "&:hover": { transform: "none" },
          },
        }),
      },
      {
        props: { variant: "panel" },
        style: ({ theme }) => ({
          borderRadius: SEMANTIC_THEME.radius.panel,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: "none",
        }),
      },
    ],
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: SEMANTIC_THEME.radius.chip,
      },
    },
    variants: buildStatusChipVariants(),
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: SEMANTIC_THEME.radius.modal,
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: SEMANTIC_THEME.radius.progress,
      },
      bar: {
        borderRadius: SEMANTIC_THEME.radius.progress,
      },
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: {
        textTransform: "none",
        fontWeight: SEMANTIC_THEME.typography.controlWeight,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: "none",
        fontWeight: SEMANTIC_THEME.typography.controlWeight,
      },
    },
  },
};

// Register the custom Card variants so `<Card variant="assignment" | "panel">`
// typechecks. MUI v7 resolves Card's `variant` type through Paper, so both
// override interfaces must carry the custom names.
declare module "@mui/material/Card" {
  interface CardPropsVariantOverrides {
    assignment: true;
    panel: true;
  }
}

declare module "@mui/material/Paper" {
  interface PaperPropsVariantOverrides {
    assignment: true;
    panel: true;
  }
}

// Register the soft status Chip variant so `<Chip variant="status">` typechecks.
declare module "@mui/material/Chip" {
  interface ChipPropsVariantOverrides {
    status: true;
  }
}
