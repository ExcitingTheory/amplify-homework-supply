/**
 * Tutor Cursor Overlay
 * 
 * Renders floating colored indicators showing which blocks
 * tutors are currently viewing in the workbook.
 */

import React from 'react';
import { Box, Avatar, Tooltip } from '@mui/material';
import UnitContext from '../../context/unitContext';
import { useTutorPresence } from '@/yjs/workbookHooks';

export function TutorCursorOverlay() {
  const { workbook, workbookEnabled } = React.useContext(UnitContext);

  // Get all tutors with their cursor positions (no blockId filter = all tutors)
  const tutors = useTutorPresence(workbook?.provider ?? null);

  if (!workbookEnabled || !workbook?.provider || tutors.length === 0) {
    return null;
  }

  // Group tutors by blockId
  const tutorsByBlock = React.useMemo(() => {
    const grouped: Record<string, typeof tutors> = {};
    for (const tutor of tutors) {
      const blockId = tutor.cursor?.blockId;
      if (!blockId) continue;
      if (!grouped[blockId]) grouped[blockId] = [];
      grouped[blockId].push(tutor);
    }
    return grouped;
  }, [tutors]);

  return (
    <>
      {Object.entries(tutorsByBlock).map(([blockId, blockTutors]) => (
        <TutorBlockMarker
          key={blockId}
          blockId={blockId}
          tutors={blockTutors}
        />
      ))}
    </>
  );
}

/**
 * Renders a floating tutor avatar marker next to a specific block in the DOM
 */
function TutorBlockMarker({
  blockId,
  tutors,
}: {
  blockId: string;
  tutors: Array<{ displayName?: string; color?: string; clientId: number }>;
}) {
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);
  const markerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Find the DOM element for this block by data-lexical-key or id
    const findBlockElement = () => {
      const el =
        document.querySelector(`[data-lexical-key="${blockId}"]`) ||
        document.getElementById(blockId);
      if (!el) {
        setPosition(null);
        return;
      }

      // Find the scrolling container (the .editor div)
      const scrollContainer = el.closest('.editor');
      if (!scrollContainer) {
        setPosition(null);
        return;
      }

      const containerRect = scrollContainer.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      setPosition({
        top: elRect.top - containerRect.top + scrollContainer.scrollTop,
        left: -28,
      });
    };

    findBlockElement();

    // Re-position on scroll/resize
    const scrollContainer = document.querySelector('.editor[data-tour="workbook"]');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', findBlockElement, { passive: true });
    }
    window.addEventListener('resize', findBlockElement, { passive: true });

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', findBlockElement);
      }
      window.removeEventListener('resize', findBlockElement);
    };
  }, [blockId]);

  if (!position) return null;

  return (
    <Box
      ref={markerRef}
      sx={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
        transition: 'top 0.2s ease',
        pointerEvents: 'auto',
      }}
    >
      {tutors.map((tutor) => (
        <Tooltip
          key={tutor.clientId}
          title={tutor.displayName || 'Tutor'}
          placement="left"
          arrow
        >
          <Avatar
            sx={{
              width: 24,
              height: 24,
              fontSize: '0.7rem',
              bgcolor: tutor.color || '#f59e0b',
              border: '2px solid',
              borderColor: 'background.paper',
              cursor: 'default',
            }}
          >
            {(tutor.displayName?.[0] || 'T').toUpperCase()}
          </Avatar>
        </Tooltip>
      ))}
    </Box>
  );
}

export default TutorCursorOverlay;
