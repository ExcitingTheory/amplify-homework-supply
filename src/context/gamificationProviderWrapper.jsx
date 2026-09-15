"use client";
import React, { useContext, useMemo } from "react";
import AuthContext from "./authContext";
import SectionContext from "./sectionContext";
import { GamificationProvider } from "./gamificationContext";
import { getAmplifyClient } from "../utils/amplifyClient";
import { GamificationToastLayer } from "../components/Gamification/GamificationToastLayer";

/**
 * Bridges AuthContext → GamificationProvider by extracting the current user's
 * identity and passing it along with the Amplify Data Client.
 * Derives sectionID from the user's Cognito group membership (section groups).
 * Passes Section/Assignment data from SectionContext when available
 * to avoid duplicate subscriptions (zero extra API calls).
 * Renders children directly when no user is logged in.
 */
export function GamificationProviderWrapper({
  children,
  sectionID: sectionIDProp,
}) {
  const { user, session } = useContext(AuthContext);
  const client = useMemo(() => getAmplifyClient(), []);
  const [resolvedSectionIDs, setResolvedSectionIDs] = React.useState([]);

  // Skip gamification subscriptions for instructors/admins — they don't earn XP
  const isInstructor =
    session?.groups?.includes("Instructors") ||
    session?.groups?.includes("Admins");
  const studentId = isInstructor
    ? ""
    : user?.username || user?.attributes?.sub || "";

  // Consume from SectionContext if a SectionProvider exists above us.
  // At app-level there is no SectionProvider, so we get defaults (empty arrays).
  // This is correct: linear locks only apply on pages that have section data.
  const { sections, assignments } = useContext(SectionContext) || {};

  // Derive all cohort candidates from section-based Cognito groups.
  // Some environments use section slugs in group names, while GroupChallenge
  // rows store actual Section IDs. We resolve both forms below.
  const sectionGroupNames = useMemo(() => {
    const groups = session?.groups || [];
    return groups.filter((group) =>
      /^section-(.+?)-(learners|instructors)$/.test(group),
    );
  }, [session?.groups]);

  const extractedSectionIDs = useMemo(() => {
    const ids = [];
    for (const group of sectionGroupNames) {
      const match = group.match(/^section-(.+?)-(learners|instructors)$/);
      if (match?.[1]) ids.push(match[1]);
    }
    return ids;
  }, [sectionGroupNames]);

  React.useEffect(() => {
    if (sectionIDProp) {
      setResolvedSectionIDs([sectionIDProp]);
      return;
    }
    if (!sectionGroupNames.length) {
      setResolvedSectionIDs([]);
      return;
    }
    if (!client?.models?.Section?.observeQuery) {
      setResolvedSectionIDs(extractedSectionIDs);
      return;
    }

    const subscription = client.models.Section.observeQuery().subscribe({
      next: ({ items }) => {
        const valid = (items || []).filter((item) => item != null && item.id);
        const resolvedFromGroups = valid
          .filter((section) => sectionGroupNames.includes(section.learner))
          .map((section) => section.id);

        const merged = Array.from(
          new Set([...resolvedFromGroups, ...extractedSectionIDs]),
        );
        setResolvedSectionIDs(merged);
      },
      error: () => {
        setResolvedSectionIDs(extractedSectionIDs);
      },
    });

    return () => subscription.unsubscribe();
  }, [client, sectionIDProp, extractedSectionIDs, sectionGroupNames]);

  const sectionIDs = useMemo(() => {
    if (sectionIDProp) return [sectionIDProp];
    return resolvedSectionIDs;
  }, [sectionIDProp, resolvedSectionIDs]);

  const sectionID = sectionIDs[0];

  // Always render Provider so child hooks (useSquad, useXP, etc.) never read
  // the static default context. Subscriptions inside the Provider bail early
  // and set loading=false when studentId is empty.
  return (
    <GamificationProvider
      client={client}
      studentId={studentId}
      sectionID={sectionID}
      sectionIDs={sectionIDs}
      sections={sections}
      assignments={assignments}
    >
      {children}
      {studentId && <GamificationToastLayer />}
    </GamificationProvider>
  );
}
