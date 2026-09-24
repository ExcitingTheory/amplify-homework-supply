import { OfflinePageContent } from "./OfflinePageContent";

export const dynamic = "force-static";
export const revalidate = false;

/**
 * Offline fallback page shown by the service worker when a navigation
 * request fails and no cached page is available. The static shell is fully
 * cached; the list of available assignments is hydrated client-side from
 * the OfflineDataStore (IndexedDB).
 */
export default async function OfflinePage() {
  return <OfflinePageContent />;
}
