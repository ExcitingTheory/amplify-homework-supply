import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import { EasterEggToast } from './EasterEggToast';

const client = generateClient();

export interface SecretLinkIconProps {
  unitId: string;
}

/**
 * Renders a tiny semi-hidden icon on workbook pages if any SECRET_LINK easter eggs
 * target this unit. Clicking the icon triggers discoverEasterEgg.
 */
export function SecretLinkIcon({ unitId }: SecretLinkIconProps) {
  const [eggs, setEggs] = useState<Array<{ id: string; message: string; xpReward: number }>>([]);
  const [studentId, setStudentId] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', xpReward: 0 });
  const discoveredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchAuthSession().then((session: any) => {
      const username = session?.tokens?.idToken?.payload?.['cognito:username'] || session?.tokens?.idToken?.payload?.sub || '';
      if (username) setStudentId(username);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!studentId || !unitId) return;
    (client as any).models?.EasterEgg?.list?.()
      .then(({ data }: any) => {
        const secretLinks = (data || []).filter(
          (e: any) => e != null && e.trigger === 'SECRET_LINK' && e.triggerValue === unitId && e.active !== false,
        );
        // Filter out already discovered
        const undiscovered = secretLinks.filter((e: any) => {
          const discoveries = e.discoveries || [];
          const found = discoveries.some((d: any) => d.studentId === studentId);
          if (found) discoveredRef.current.add(e.id);
          return !found;
        });
        setEggs(
          undiscovered.map((e: any) => ({
            id: e.id,
            message: e.revealMessage || 'You found a secret!',
            xpReward: e.xpReward || 0,
          })),
        );
      })
      .catch((err: any) => console.warn('[SecretLinkIcon] fetch error:', err));
  }, [studentId, unitId]);

  const handleClick = useCallback(
    async (egg: { id: string; message: string; xpReward: number }) => {
      if (!studentId || discoveredRef.current.has(egg.id)) return;
      discoveredRef.current.add(egg.id);
      setToast({ open: true, message: egg.message, xpReward: egg.xpReward });
      setEggs((prev) => prev.filter((e) => e.id !== egg.id));

      try {
        await (client as any).mutations?.discoverEasterEgg?.({ studentId, eggId: egg.id });
      } catch (err) {
        console.error('[SecretLinkIcon] discoverEasterEgg error:', err);
      }
    },
    [studentId],
  );

  if (eggs.length === 0) return null;

  return (
    <>
      {eggs.map((egg) => (
        <IconButton
          key={egg.id}
          onClick={() => handleClick(egg)}
          size="small"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            opacity: 0.15,
            transition: 'opacity 0.3s',
            '&:hover': { opacity: 0.8 },
            zIndex: 10,
          }}
          aria-label="hidden secret"
        >
          <SearchIcon fontSize="small" />
        </IconButton>
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
