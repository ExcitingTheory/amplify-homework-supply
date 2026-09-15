/**
 * @fileoverview Shared Storybook decorator that wraps a story in the app's
 * AppShell (persistent sidebar + toolbar/menus), mirroring how authenticated
 * pages are wrapped in production by `AuthenticatedShell` in app/providers.tsx.
 *
 * Use on "📄 Pages/Application Pages" stories so they render with the same nav
 * chrome users see in the real app. Do NOT use on logged-out/public pages
 * (e.g. Offline, Privacy) which are served without the shell.
 *
 * @module stories/withAppShell
 */

import React from "react";
import type { Decorator } from "@storybook/nextjs-vite";

import AppShell from "../components/AppShell";

export const withAppShell: Decorator = (Story) => (
  <AppShell toolbarChildren={null}>
    <Story />
  </AppShell>
);
