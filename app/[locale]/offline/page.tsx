"use cache";

import { cacheLife } from "next/cache";
import { OfflinePageContent } from "./OfflinePageContent";

/**
 * Offline fallback page shown by the service worker when a navigation
 * request fails and no cached page is available. The static shell is fully
 * cached; the list of available assignments is hydrated client-side from
 * the OfflineDataStore (IndexedDB).
 */
export default async function OfflinePage() {
  cacheLife("max");
  return <OfflinePageContent />;
}
