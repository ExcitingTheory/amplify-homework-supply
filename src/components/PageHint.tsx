"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import AuthContext from "@/context/authContext";
import { usePageHintProgress } from "@/context/pageHintContext";
import { usePageHintPreferences } from "@/hooks/usePageHintPreferences";
import {
  getHintRole,
  getHintRouteKey,
  resolvePageHint,
} from "@/utils/pageHints";
import { PageHintView } from "./PageHintView";

type HintSession = {
  groups?: string[];
};

/**
 * Shows one role- and route-specific hint the first time a user reaches a
 * page. A hint is recorded as seen on the user's Settings when shown, so it
 * never reappears once the user navigates away; users can also dismiss it or
 * turn hints off entirely.
 */
export default function PageHint() {
  const t = useTranslations("components");
  const router = useRouter();
  const pathname = usePathname();
  const { session } = React.useContext(AuthContext) as {
    session?: HintSession;
  };
  const progress = usePageHintProgress();
  const preferences = usePageHintPreferences();

  const role = getHintRole(session?.groups);
  const routeKey = getHintRouteKey(pathname);

  const hint = React.useMemo(
    () => resolvePageHint(routeKey, role, progress),
    [routeKey, role, progress],
  );
  const hintId = hint?.id ?? null;

  const [activeId, setActiveId] = React.useState<string | null>(null);
  // Survives the dev-only effect double invoke, which would otherwise see the
  // hint it just recorded as already seen and hide it.
  const lastEvaluatedId = React.useRef<string | null>(null);
  // The effect only re-runs per hint, so it reads the latest preferences here.
  const preferencesRef = React.useRef(preferences);
  preferencesRef.current = preferences;
  const ready = preferences.ready;

  React.useEffect(() => {
    if (!hintId) {
      lastEvaluatedId.current = null;
      setActiveId(null);
      return;
    }
    // Wait for Settings so a hint is never shown to someone who opted out.
    if (!ready || lastEvaluatedId.current === hintId) return;
    lastEvaluatedId.current = hintId;

    const { showTips, seen, markSeen } = preferencesRef.current;
    if (!showTips || seen.includes(hintId)) {
      setActiveId(null);
      return;
    }
    Promise.resolve(markSeen(hintId)).catch((error) => {
      console.warn("[PageHint] Could not record hint as seen:", error);
    });
    setActiveId(hintId);
  }, [hintId, ready]);

  if (!hint || hint.id !== activeId) return null;

  const key = `pageHints.${hint.id}`;
  const actions = (hint.actions ?? []).map((action) => ({
    id: action.id,
    label: t(`pageHints.actions.${action.id}`),
  }));

  return (
    <PageHintView
      title={t(`${key}.title`)}
      body={t(`${key}.body`)}
      actions={actions}
      dismissLabel={t("pageHints.dismiss")}
      optOutLabel={t("pageHints.optOut")}
      onAction={(actionId) => {
        const action = hint.actions?.find((a) => a.id === actionId);
        if (action) router.push(action.href);
      }}
      onDismiss={() => setActiveId(null)}
      onOptOut={() => {
        setActiveId(null);
        Promise.resolve(preferences.setShowTips(false)).catch((error) => {
          console.warn("[PageHint] Could not turn hints off:", error);
        });
      }}
    />
  );
}
