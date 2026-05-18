"use client";
import * as React from "react";

const DRAWER_WIDTH = 280;

/**
 * Context to allow MainToolbar to control the drawer open state.
 */
export const AppShellContext = React.createContext({
  drawerOpen: false,
  setDrawerOpen: undefined,
  isDesktop: undefined,
  drawerWidth: DRAWER_WIDTH,
});

export function useAppShell() {
  return React.useContext(AppShellContext);
}

export { DRAWER_WIDTH };
