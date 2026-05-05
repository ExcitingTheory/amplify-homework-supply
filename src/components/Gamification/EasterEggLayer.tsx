import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useEasterEggKeyword } from './EasterEggTrigger';
import { EasterEggToast } from './EasterEggToast';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';

const client = generateClient();

/**
 * App-wide Easter Egg Layer — fetches active easter eggs from DB,
 * wires keyword triggers, and calls discoverEasterEgg mutation on discovery.
 * Place inside GamificationProviderWrapper in _app.jsx.
 */
export interface EasterEggLayerProps {
  studentId?: string;
}

export function EasterEggLayer({ studentId: studentIdProp }: EasterEggLayerProps) {
  const [toast, setToast] = useState({ open: false, message: '', xpReward: 0 });
  const [keywordEggs, setKeywordEggs] = useState<Array<{ id: string; keyword: string; message: string; xpReward: number }>>([]);
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

  // Fetch active keyword-based easter eggs
  useEffect(() => {
    if (!studentId) return;
    (client as any).models?.EasterEgg?.list?.()
      .then(({ data }: any) => {
        const active = (data || []).filter(
          (e: any) => e != null && e.trigger === 'KEYWORD' && e.triggerValue,
        );
        setKeywordEggs(
          active.map((e: any) => ({
            id: e.id,
            keyword: e.triggerValue,
            message: e.revealMessage || 'Secret found!',
            xpReward: e.xpReward || 0,
          })),
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

  const handleDiscover = useCallback(
    async (eggId: string, message: string, xpReward: number) => {
      if (!studentId || discoveredRef.current.has(eggId)) return;
      discoveredRef.current.add(eggId);
      setToast({ open: true, message, xpReward });

      try {
        await (client as any).mutations?.discoverEasterEgg?.({ studentId, eggId });
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
