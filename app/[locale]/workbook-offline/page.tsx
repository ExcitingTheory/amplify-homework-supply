"use cache";

import { cacheLife } from "next/cache";
import WorkbookOfflineClient from "./WorkbookOfflineClient";

/**
 * Offline workbook page — served by the service worker when a /workbook/[id]
 * navigation fails due to being offline. The client component reads unit data
 * from IndexedDB (populated by the "Save offline" prefetch).
 *
 * This page is statically cached so the service worker can always serve it.
 */
export default async function WorkbookOfflinePage() {
  cacheLife("max");
  return <WorkbookOfflineClient />;
}
