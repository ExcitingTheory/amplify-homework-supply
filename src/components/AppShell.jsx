"use client";
/**
 * @module AppShell
 * @category Components
 * @description Responsive app shell with persistent inline drawer on desktop
 * and temporary (modal) drawer on mobile. Provides a unified layout for pages
 * that want sidebar navigation alongside content.
 */

import * as React from "react";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import { useTheme } from "@mui/material/styles";
import MainToolbar from "./MainToolbar";
import { AppShellContext, DRAWER_WIDTH, RAIL_WIDTH } from "./AppShellContext";
import { SEMANTIC_THEME } from "../themes/semanticTheme";

export {
  AppShellContext,
  useAppShell,
  useSecondaryToolbar,
} from "./AppShellContext";

/** Direct matchMedia hook - avoids MUI useMediaQuery hydration issues */
function useMatchMedia(query) {
  const [matches, setMatches] = React.useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/**
 * AppShell - responsive layout with inline sidebar on desktop.
 *
 * On screens ≥ md (900px): sidebar is persistent and inline, content shifts right.
 * On screens < md: sidebar is temporary (modal overlay via SwipeableDrawer in MainToolbar).
 */
export default function AppShell({ children, toolbarChildren }) {
  const theme = useTheme();
  const isDesktop = useMatchMedia(
    `(min-width:${theme.breakpoints.values.md}px)`,
  );
  const [drawerOpen, setDrawerOpen] = React.useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(`(min-width:${theme.breakpoints.values.md}px)`)
        .matches;
    }
    return false;
  });
  const [toolbarContent, setToolbarContent] = React.useState(null);
  const appBarRef = React.useRef(null);
  const toolbarPortalRef = React.useRef(null);
  const toolbarChildrenPortalRef = React.useRef(null);
  const [appBarHeight, setAppBarHeight] = React.useState(48);

  // Collapsed (icon-only rail) state — persisted across reloads.
  const [collapsed, setCollapsedState] = React.useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("appShell.navCollapsed") === "true";
    }
    return false;
  });
  const setCollapsed = React.useCallback((value) => {
    setCollapsedState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("appShell.navCollapsed", String(next));
      }
      return next;
    });
  }, []);

  // Hidden state — nav behaves like mobile (temporary overlay), content full width.
  const [hidden, setHiddenState] = React.useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("appShell.navHidden") === "true";
    }
    return false;
  });
  const setHidden = React.useCallback((value) => {
    setHiddenState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("appShell.navHidden", String(next));
      }
      return next;
    });
  }, []);

  const effectiveDrawerWidth = hidden
    ? 0
    : collapsed
      ? RAIL_WIDTH
      : DRAWER_WIDTH;

  // Measure actual AppBar height (changes when secondary toolbar is present)
  React.useEffect(() => {
    if (!appBarRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height =
          entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        if (height > 0) setAppBarHeight(height);
      }
    });
    observer.observe(appBarRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync drawer state when breakpoint changes
  React.useEffect(() => {
    if (isDesktop) {
      setDrawerOpen(!hidden);
    } else {
      setDrawerOpen(false);
    }
  }, [isDesktop]); // eslint-disable-line react-hooks/exhaustive-deps

  const contextValue = React.useMemo(
    () => ({
      drawerOpen,
      setDrawerOpen,
      isDesktop,
      drawerWidth: effectiveDrawerWidth,
      railWidth: RAIL_WIDTH,
      collapsed,
      setCollapsed,
      hidden,
      setHidden,
      toolbarContent,
      setToolbarContent,
      appBarHeight,
      toolbarPortalRef,
      toolbarChildrenPortalRef,
    }),
    [
      drawerOpen,
      isDesktop,
      effectiveDrawerWidth,
      collapsed,
      setCollapsed,
      hidden,
      setHidden,
      toolbarContent,
      appBarHeight,
    ],
  );

  return (
    <AppShellContext.Provider value={contextValue}>
      <AppBar
        ref={appBarRef}
        position="fixed"
        color="default"
        sx={{
          backgroundColor: "custom.glassNavbar",
          backdropFilter: SEMANTIC_THEME.surface.appBarBlur,
          // Above the nav drawer/menu, but below theme.zIndex.modal so real dialogs win.
          zIndex: (theme) => theme.zIndex.drawer + 2,
          isolation: "isolate",
        }}
      >
        <MainToolbar>{toolbarChildren}</MainToolbar>
        {toolbarContent}
        <Box
          ref={toolbarPortalRef}
          sx={{
            // Storybook forces MuiModal disablePortal (.storybook/preview.jsx), so
            // the nav drawer renders inline as this box's sibling instead of
            // escaping to document.body. A transparent box here would only
            // keep its own text/icons above the drawer while showing the
            // drawer through its background, so repaint the AppBar's own
            // glass background here too. No-op in production, where the
            // drawer portals to body and compares against the AppBar instead.
            position: "relative",
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: "custom.glassNavbar",
            backdropFilter: SEMANTIC_THEME.surface.appBarBlur,
          }}
        />
      </AppBar>

      <Box
        sx={{
          display: "flex",
          marginTop: `${appBarHeight}px`,
          position: "relative",
          zIndex: 0,
        }}
      >
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            // Lets oversized children (wide tables) scroll inside themselves
            // instead of stretching main past the drawer offset.
            minWidth: 0,
            transition: theme.transitions.create(["margin", "width"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            ...(isDesktop &&
              drawerOpen && {
                marginLeft: `${effectiveDrawerWidth}px`,
                width: `calc(100% - ${effectiveDrawerWidth}px)`,
                transition: theme.transitions.create(["margin", "width"], {
                  easing: theme.transitions.easing.easeOut,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              }),
          }}
        >
          {children}
        </Box>
      </Box>
    </AppShellContext.Provider>
  );
}
