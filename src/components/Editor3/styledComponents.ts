/**
 * Shared styled components for Editor3
 */

import { styled } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import type { Theme } from "@mui/material/styles";
import { DRAWER_WIDTH } from "./editorConfig";
import { getSemanticLessonContentStyles, SEMANTIC_THEME } from "../../themes/semanticTheme";

export const EditorCanvas = styled("div")(({ theme }) => ({
  position: "relative",
  width: "100%",
  maxWidth: `calc(${SEMANTIC_THEME.editor.lesson.maxWidth} + 6.5rem)`,
  minHeight: "100%",
  marginInline: "auto",
  paddingLeft: "5.5rem",
  "& .collaboration-cursors-container": {
    paddingInline: 8,
    backgroundColor: (theme.vars || theme).palette.background.paper,
    borderRadius: `calc(${SEMANTIC_THEME.radius.card}px * 2)`,
    boxShadow: theme.shadows[1],
    // Indicate focus on the whole paper so the cue spans the gutter wings and text column alike.
    "&:has(.editor:focus)": {
      boxShadow: `${theme.shadows[1]}, inset 0 2px 4px ${(theme.vars || theme).palette.action.focus}`,
    },
  },
  "& .editor": {
    minHeight: "calc(100dvh - var(--app-bar-height, 11rem) - 3rem)",
    backgroundColor: "transparent",
  },
  "& .editor-placeholder": {
    top: SEMANTIC_THEME.editor.lesson.padding.top,
    left: SEMANTIC_THEME.editor.lesson.padding.inlineMobile,
    [theme.breakpoints.up("sm")]: {
      left: SEMANTIC_THEME.editor.lesson.padding.inlineDesktop,
    },
  },
}));

export const LessonContentEditable = styled(ContentEditable)(({ theme }) => ({
  "&&": getSemanticLessonContentStyles(theme),
}));

/**
 * Mixin for opened drawer state
 */
export const openedMixin = (theme: Theme, width: number = DRAWER_WIDTH) => ({
  width: width,
  maxWidth: "calc(100vw - 5rem)",
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden" as const,
});

/**
 * Mixin for closed drawer state
 */
export const closedMixin = (theme: Theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden" as const,
  width: "2.5rem", // Match vertical tabs width exactly
});

/**
 * Styled drawer header component
 */
export const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

/**
 * Styled app bar component
 */
export const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open?: boolean }>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: DRAWER_WIDTH,
    width: `calc(100% - ${DRAWER_WIDTH}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

/**
 * Styled drawer component with dynamic width support
 */
export const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open" && prop !== "drawerwidth",
})<{ open?: boolean; drawerwidth?: number }>(
  ({ theme, open, drawerwidth = DRAWER_WIDTH }) => ({
    width: open ? drawerwidth : "2.5rem",
    flexShrink: 1,
    minWidth: "2.5rem",
    boxSizing: "border-box",
    ...(open && {
      ...openedMixin(theme, drawerwidth),
      "& .MuiDrawer-paper": {
        ...openedMixin(theme, drawerwidth),
        width: "100%",
        maxWidth: "100%",
        position: "relative",
        border: "none",
      },
    }),
    ...(!open && {
      whiteSpace: "nowrap",
      ...closedMixin(theme),
      "& .MuiDrawer-paper": {
        ...closedMixin(theme),
        position: "relative",
        border: "none",
      },
    }),
  }),
);
