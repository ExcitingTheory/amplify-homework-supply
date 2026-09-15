import type { Components, Theme, ThemeOptions } from "@mui/material/styles";

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

export const semanticComponentOverrides: Components<Theme> = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: "none",
        fontWeight: SEMANTIC_THEME.typography.controlWeight,
        borderRadius: SEMANTIC_THEME.radius.control,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: SEMANTIC_THEME.radius.card,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: SEMANTIC_THEME.radius.chip,
      },
    },
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
};
