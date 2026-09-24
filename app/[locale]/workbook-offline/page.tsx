import WorkbookOfflineClient from "./WorkbookOfflineClient";

export const dynamic = "force-static";
export const revalidate = false;

/**
 * Offline workbook page — served by the service worker when a /workbook/[id]
 * navigation fails due to being offline. The client component reads unit data
 * from IndexedDB (populated by the "Save offline" prefetch).
 *
 * This page is statically cached so the service worker can always serve it.
 */
export default async function WorkbookOfflinePage() {
  return <WorkbookOfflineClient />;
}
