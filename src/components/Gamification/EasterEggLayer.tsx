import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useEasterEggKeyword } from './EasterEggTrigger';
import { EasterEggToast } from './EasterEggToast';
import { getAmplifyClient } from '../../utils/amplifyClient';
import { fetchAuthSession } from 'aws-amplify/auth';

function getClient() {
  return getAmplifyClient();
}

/**
 * App-wide Easter Egg Layer — fetches active easter eggs from DB,
 * wires keyword triggers, polls SCHEDULE eggs, and calls discoverEasterEgg mutation on discovery.
 * Place inside GamificationProviderWrapper in _app.jsx.
 */
export interface EasterEggLayerProps {
  studentId?: string;
}

export function EasterEggLayer({ studentId: studentIdProp }: EasterEggLayerProps) {
  const [toast, setToast] = useState({ open: false, message: '', xpReward: 0 });
  const [keywordEggs, setKeywordEggs] = useState<Array<{ id: string; keyword: string; message: string; xpReward: number }>>([]);
  const [scheduleEggs, setScheduleEggs] = useState<Array<{ id: string; start: string; end: string; message: string; xpReward: number }>>([]);
  const [studentId, setStudentId] = useState(studentIdProp || '');
  const discoveredRef = useRef<Set<string>>(new Set());

  // Resolve studentId from auth if not passed as prop
  useEffect(() => {
    if (studentIdProp) { setStudentId(studentIdProp); return; }
    fetchAuthSession().then((session: any) => {
      const username = session?.tokens?.idToken?.payload?.['cognito:username'] || session?.tokens?.idToken?.payload?.sub || '';
      if (username) setStudentId(username);
    }).catch(() => {});
  }, [studentIdProp]);

  // Fetch active easter eggs (KEYWORD + SCHEDULE)
  useEffect(() => {
    if (!studentId) return;
    (getClient() as any).models?.EasterEgg?.list?.()
      .then(({ data }: any) => {
        const active = (data || []).filter(
          (e: any) => e != null && e.triggerValue,
        );

        // KEYWORD eggs
        const keywords = active.filter((e: any) => e.trigger === 'KEYWORD');
        setKeywordEggs(
          keywords.map((e: any) => ({
            id: e.id,
            keyword: e.triggerValue,
            message: e.revealMessage || 'Secret found!',
            xpReward: e.xpReward || 0,
          })),
        );

        // SCHEDULE eggs — filter out eggs whose end time has passed (expired)
        const now = new Date().toISOString();
        const schedules = active.filter((e: any) => e.trigger === 'SCHEDULE');
        setScheduleEggs(
          schedules
            .map((e: any) => {
              let start = '', end = '';
              try {
                const parsed = JSON.parse(e.triggerValue || '{}');
                start = parsed.start || '';
                end = parsed.end || '';
              } catch { /* invalid JSON */ }
              return {
                id: e.id,
                start,
                end,
                message: e.revealMessage || 'Time-based secret found!',
                xpReward: e.xpReward || 0,
              };
            })
            .filter((e: { id: string; start: string; end: string; message: string; xpReward: number }) => !e.end || e.end >= now), // exclude expired
        );

        // Mark already-discovered eggs
        for (const egg of active) {
          const discoveries = egg.discoveries || [];
          if (discoveries.some((d: any) => d.studentId === studentId)) {
            discoveredRef.current.add(egg.id);
          }
        }
      })
      .catch((err: any) => console.warn('[EasterEggLayer] fetch error:', err));
  }, [studentId]);

  // Poll SCHEDULE eggs every 60 seconds
  useEffect(() => {
    if (!studentId || scheduleEggs.length === 0) return;

    const checkSchedules = () => {
      const now = new Date().toISOString();
      for (const egg of scheduleEggs) {
        if (discoveredRef.current.has(egg.id)) continue;
        // Award if the drop time has passed — students who were offline still get it
        const dropped = !egg.start || now >= egg.start;
        if (dropped) {
          handleDiscover(egg.id, egg.message, egg.xpReward);
        }
      }
    };

    // Check immediately, then every 60s
    checkSchedules();
    const interval = setInterval(checkSchedules, 60000);
    return () => clearInterval(interval);
  }, [studentId, scheduleEggs]);

  const handleDiscover = useCallback(
    async (eggId: string, message: string, xpReward: number) => {
      if (!studentId || discoveredRef.current.has(eggId)) return;
      discoveredRef.current.add(eggId);
      setToast({ open: true, message, xpReward });

      try {
        await (getClient() as any).mutations?.discoverEasterEgg?.({ studentId, eggId });
      } catch (err) {
        console.error('[EasterEggLayer] discoverEasterEgg error:', err);
      }
    },
    [studentId],
  );

  return (
    <>
      {keywordEggs.map((egg) => (
        <KeywordListener
          key={egg.id}
          keyword={egg.keyword}
          disabled={discoveredRef.current.has(egg.id)}
          onTrigger={() => handleDiscover(egg.id, egg.message, egg.xpReward)}
        />
      ))}
      <EasterEggToast
        open={toast.open}
        message={toast.message}
        xpReward={toast.xpReward}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </>
  );
}

/** Internal wrapper that uses the keyword hook for each egg */
function KeywordListener({ keyword, disabled, onTrigger }: { keyword: string; disabled: boolean; onTrigger: () => void }) {
  useEasterEggKeyword({ keyword, onTrigger, disabled });
  return null;
}
