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
 * Derives cohortId from the user's Cognito group membership (section groups).
 * Passes Section/Assignment data from SectionContext when available
 * to avoid duplicate subscriptions (zero extra API calls).
 * Renders children directly when no user is logged in.
 */
export function GamificationProviderWrapper({
  children,
  cohortId: cohortIdProp,
}) {
  const { user, session } = useContext(AuthContext);
  const client = useMemo(() => getAmplifyClient(), []);
  const studentId = user?.username || user?.attributes?.sub || "";

  // Consume from SectionContext if a SectionProvider exists above us.
  // At app-level there is no SectionProvider, so we get defaults (empty arrays).
  // This is correct: linear locks only apply on pages that have section data.
  const { sections, assignments } = useContext(SectionContext) || {};

  // Derive cohortId from section-based Cognito groups, or use explicit prop
  // (e.g. guild/[id] page reads cohortId from the guild record itself)
  const cohortId = useMemo(() => {
    if (cohortIdProp) return cohortIdProp;
    const groups = session?.groups || [];
    for (const group of groups) {
      const match = group.match(/^section-(.+?)-(learners|instructors)$/);
      if (match) return match[1];
    }
    return undefined;
  }, [session?.groups, cohortIdProp]);

  // Always render Provider so child hooks (useGuild, useXP, etc.) never read
  // the static default context. Subscriptions inside the Provider bail early
  // and set loading=false when studentId is empty.
  return (
    <GamificationProvider
      client={client}
      studentId={studentId}
      cohortId={cohortId}
      sections={sections}
      assignments={assignments}
    >
      {children}
      {studentId && <GamificationToastLayer />}
    </GamificationProvider>
  );
}
