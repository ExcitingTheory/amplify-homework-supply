"use client";
import * as React from "react";

const DRAWER_WIDTH = 280;

/**
 * Context to allow MainToolbar to control the drawer open state.
 * Also provides a slot for pages to inject secondary toolbar content into the AppBar.
 */
export const AppShellContext = React.createContext({
  drawerOpen: false,
  setDrawerOpen: undefined,
  isDesktop: undefined,
  drawerWidth: DRAWER_WIDTH,
  toolbarContent: null,
  setToolbarContent: undefined,
  appBarHeight: 48,
  toolbarPortalRef: { current: null },
  toolbarChildrenPortalRef: { current: null },
});

export function useAppShell() {
  return React.useContext(AppShellContext);
}

/**
 * Hook for pages to set secondary toolbar content that renders inside the AppBar.
 * Content is automatically cleared on unmount.
 * @param {React.ReactNode} content - The toolbar content to render below the main toolbar
 */
export function useSecondaryToolbar(content) {
  const { setToolbarContent } = React.useContext(AppShellContext);
  React.useEffect(() => {
    if (setToolbarContent) {
      setToolbarContent(content);
    }
    return () => {
      if (setToolbarContent) {
        setToolbarContent(null);
      }
    };
  }, [content, setToolbarContent]);
}

export { DRAWER_WIDTH };
