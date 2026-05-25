"use client";

import { useEffect, useRef, useContext } from "react";
import AuthContext from "../context/authContext";
import { identifyAnalyticsUser } from "../utils/analytics";
import { getAmplifyClient } from "../utils/amplifyClient";

/**
 * Syncs the current user's section membership to Pinpoint user attributes.
 * Fetches sections directly (does not depend on SectionProvider).
 * Updates on sign-in and periodically if sections change.
 *
 * This enables segmentation in the Pinpoint console and admin analytics:
 * - Filter events by section
 * - Compare engagement across sections
 * - See which sections are most active
 */
export function useAnalyticsSegmentation() {
  const { user, groups } = useContext(AuthContext);
  const lastIdentifyRef = useRef<string>("");

  useEffect(() => {
    if (!user?.username) return;

    async function syncSegmentation() {
      try {
        const client = getAmplifyClient();
        const { data: sections } = await (client.models as any).Section.list();
        const validSections = (sections || []).filter(
          (s: any) => s != null && s.id != null,
        );

        const sectionIds = validSections.map((s: any) => s.id);
        const sectionNames = validSections
          .filter((s: any) => s.name)
          .map((s: any) => s.name);

        // Determine role from Cognito groups
        let userRole = "Learner";
        if (groups?.includes("Admins")) userRole = "Admin";
        else if (groups?.includes("Instructors")) userRole = "Instructor";

        // Deduplicate — don't re-identify if nothing changed
        const identifyKey = `${user.username}:${userRole}:${sectionIds.sort().join(",")}`;
        if (identifyKey === lastIdentifyRef.current) return;
        lastIdentifyRef.current = identifyKey;

        identifyAnalyticsUser({
          userId: user.username,
          userRole,
          sectionIds,
          sectionNames,
        });
      } catch (err) {
        console.warn("[Analytics] Failed to sync segmentation:", err);
      }
    }

    syncSegmentation();
  }, [user, groups]);
}
