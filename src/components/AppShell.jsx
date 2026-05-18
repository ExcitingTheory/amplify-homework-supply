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
import { AppShellContext, DRAWER_WIDTH } from "./AppShellContext";

export { AppShellContext, useAppShell } from "./AppShellContext";

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

  // Sync drawer state when breakpoint changes
  React.useEffect(() => {
    if (isDesktop) {
      setDrawerOpen(true);
    } else {
      setDrawerOpen(false);
    }
  }, [isDesktop]);

  const contextValue = React.useMemo(
    () => ({
      drawerOpen,
      setDrawerOpen,
      isDesktop,
      drawerWidth: DRAWER_WIDTH,
    }),
    [drawerOpen, isDesktop],
  );

  return (
    <AppShellContext.Provider value={contextValue}>
      <AppBar
        position="fixed"
        color="default"
        sx={{
          backgroundColor: "custom.glassNavbar",
          backdropFilter: "blur(8px)",
          zIndex: (theme) => theme.zIndex.modal + 2,
        }}
      >
        <MainToolbar>{toolbarChildren}</MainToolbar>
      </AppBar>

      <Box
        sx={{
          display: "flex",
          marginTop: "48px",
        }}
      >
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            transition: theme.transitions.create(["margin", "width"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            ...(isDesktop &&
              drawerOpen && {
                marginLeft: `${DRAWER_WIDTH}px`,
                width: `calc(100% - ${DRAWER_WIDTH}px)`,
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
