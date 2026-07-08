/**
 * Editor theme palette definitions for the CosmeticSelector themes.
 * Each theme defines both light and dark MUI palette overrides.
 */
import { red } from "@mui/material/colors";

export interface CustomPaletteTokens {
  chatBubbleUser: string;
  chatBubbleAssistant: string;
  glassNavbar: string;
  editorBackground: string;
  codeBlock: string;
  searchHighlight: string;
  subtleBorder: string;
  heroCardGradient: string;
}

export interface ThemePaletteVariant {
  primary: { main: string };
  secondary: { main: string };
  error?: { main: string };
  background: { default: string; paper: string };
  text?: { primary: string; secondary: string };
  custom: CustomPaletteTokens;
}

export interface ThemePalette {
  light: ThemePaletteVariant;
  dark: ThemePaletteVariant;
}

export const THEME_PALETTES: Record<string, ThemePalette> = {
  default: {
    light: {
      primary: { main: "#556cd6" },
      secondary: { main: "#19857b" },
      error: { main: red.A400 },
      background: { default: "#fafafa", paper: "#ffffff" },
      custom: {
        chatBubbleUser: "#e3f2fd",
        chatBubbleAssistant: "#f3f4f6",
        glassNavbar: "rgba(255,255,255,0.72)",
        editorBackground: "#ffffff",
        codeBlock: "#f6f8fa",
        searchHighlight: "#ffeb3b",
        subtleBorder: "#e0e0e0",
        heroCardGradient:
          "linear-gradient(135deg, rgba(21,101,192,0.92) 0%, rgba(13,71,161,0.97) 100%)",
      },
    },
    dark: {
      primary: { main: "#7986cb" },
      secondary: { main: "#4db6ac" },
      error: { main: red.A200 },
      background: { default: "#121212", paper: "#1e1e1e" },
      text: { primary: "#e0e0e0", secondary: "#a0a0a0" },
      custom: {
        chatBubbleUser: "#1a2634",
        chatBubbleAssistant: "#2d2d2d",
        glassNavbar: "rgba(30,30,30,0.85)",
        editorBackground: "#1e1e1e",
        codeBlock: "#161b22",
        searchHighlight: "#b8860b",
        subtleBorder: "#333333",
        heroCardGradient:
          "linear-gradient(135deg, rgba(25,35,55,0.95) 0%, rgba(15,20,40,0.98) 100%)",
      },
    },
  },
  midnight: {
    light: {
      primary: { main: "#00bcd4" },
      secondary: { main: "#26c6da" },
      background: { default: "#f0f4f8", paper: "#ffffff" },
      custom: {
        chatBubbleUser: "#e0f7fa",
        chatBubbleAssistant: "#e8eaf6",
        glassNavbar: "rgba(240,244,248,0.85)",
        editorBackground: "#ffffff",
        codeBlock: "#eceff1",
        searchHighlight: "#80deea",
        subtleBorder: "#b0bec5",
        heroCardGradient: "linear-gradient(135deg, #006064 0%, #00363a 100%)",
      },
    },
    dark: {
      primary: { main: "#00bcd4" },
      secondary: { main: "#26c6da" },
      background: { default: "#1a1a2e", paper: "#16213e" },
      text: { primary: "#e0e0e0", secondary: "#90a4ae" },
      custom: {
        chatBubbleUser: "#1a2634",
        chatBubbleAssistant: "#1a1a2e",
        glassNavbar: "rgba(26,26,46,0.85)",
        editorBackground: "#16213e",
        codeBlock: "#0f3460",
        searchHighlight: "#006064",
        subtleBorder: "#2a3a5e",
        heroCardGradient:
          "linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #006064 100%)",
      },
    },
  },
  forest: {
    light: {
      primary: { main: "#66bb6a" },
      secondary: { main: "#81c784" },
      background: { default: "#f1f8e9", paper: "#ffffff" },
      custom: {
        chatBubbleUser: "#e8f5e9",
        chatBubbleAssistant: "#f1f8e9",
        glassNavbar: "rgba(241,248,233,0.85)",
        editorBackground: "#ffffff",
        codeBlock: "#e8f5e9",
        searchHighlight: "#aed581",
        subtleBorder: "#c8e6c9",
        heroCardGradient: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
      },
    },
    dark: {
      primary: { main: "#66bb6a" },
      secondary: { main: "#81c784" },
      background: { default: "#1b2d1b", paper: "#2e3d2e" },
      text: { primary: "#c8e6c9", secondary: "#81c784" },
      custom: {
        chatBubbleUser: "#1b3d1b",
        chatBubbleAssistant: "#2e3d2e",
        glassNavbar: "rgba(27,45,27,0.85)",
        editorBackground: "#2e3d2e",
        codeBlock: "#1b3d1b",
        searchHighlight: "#33691e",
        subtleBorder: "#4a6a4a",
        heroCardGradient:
          "linear-gradient(135deg, #1b2d1b 0%, #2e7d32 50%, #1b5e20 100%)",
      },
    },
  },
  sunset: {
    light: {
      primary: { main: "#ff7043" },
      secondary: { main: "#ffab91" },
      background: { default: "#fff3e0", paper: "#ffffff" },
      custom: {
        chatBubbleUser: "#fbe9e7",
        chatBubbleAssistant: "#fff3e0",
        glassNavbar: "rgba(255,243,224,0.85)",
        editorBackground: "#ffffff",
        codeBlock: "#fbe9e7",
        searchHighlight: "#ffcc80",
        subtleBorder: "#ffccbc",
        heroCardGradient: "linear-gradient(135deg, #e65100 0%, #bf360c 100%)",
      },
    },
    dark: {
      primary: { main: "#ff7043" },
      secondary: { main: "#ffab91" },
      background: { default: "#2d1b1b", paper: "#3e2723" },
      text: { primary: "#ffccbc", secondary: "#ffab91" },
      custom: {
        chatBubbleUser: "#3e2723",
        chatBubbleAssistant: "#2d1b1b",
        glassNavbar: "rgba(45,27,27,0.85)",
        editorBackground: "#3e2723",
        codeBlock: "#4e342e",
        searchHighlight: "#bf360c",
        subtleBorder: "#5d4037",
        heroCardGradient:
          "linear-gradient(135deg, #2d1b1b 0%, #bf360c 50%, #e65100 100%)",
      },
    },
  },
  aurora: {
    light: {
      primary: { main: "#ab47bc" },
      secondary: { main: "#ce93d8" },
      background: { default: "#f3e5f5", paper: "#ffffff" },
      custom: {
        chatBubbleUser: "#f3e5f5",
        chatBubbleAssistant: "#ede7f6",
        glassNavbar: "rgba(243,229,245,0.85)",
        editorBackground: "#ffffff",
        codeBlock: "#ede7f6",
        searchHighlight: "#e1bee7",
        subtleBorder: "#ce93d8",
        heroCardGradient: "linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%)",
      },
    },
    dark: {
      primary: { main: "#ab47bc" },
      secondary: { main: "#ce93d8" },
      background: { default: "#0d1b2a", paper: "#1b2838" },
      text: { primary: "#e0f7fa", secondary: "#b39ddb" },
      custom: {
        chatBubbleUser: "#1b2838",
        chatBubbleAssistant: "#0d1b2a",
        glassNavbar: "rgba(13,27,42,0.85)",
        editorBackground: "#1b2838",
        codeBlock: "#1a237e",
        searchHighlight: "#4a148c",
        subtleBorder: "#311b92",
        heroCardGradient:
          "linear-gradient(135deg, #0d1b2a 0%, #4a148c 50%, #6a1b9a 100%)",
      },
    },
  },
};

/**
 * Build a full MUI createTheme options object for the given cosmetic theme ID.
 * Falls back to 'default' if the ID is unknown.
 */
export function getThemeOptions(themeId: string | null | undefined) {
  const palette =
    THEME_PALETTES[themeId || "default"] ?? THEME_PALETTES.default;
  return {
    cssVariables: { colorSchemeSelector: "data-mui-color-scheme" },
    colorSchemes: {
      light: { palette: palette.light },
      dark: { palette: palette.dark },
    },
  };
}

/**
 * Build MUI createTheme options from a custom user-mixed palette object.
 * The palette should have `light` and `dark` keys matching ThemePalette shape.
 */
export function getCustomThemeOptions(palette: ThemePalette) {
  return {
    cssVariables: { colorSchemeSelector: "data-mui-color-scheme" },
    colorSchemes: {
      light: { palette: palette.light },
      dark: { palette: palette.dark },
    },
  };
}
