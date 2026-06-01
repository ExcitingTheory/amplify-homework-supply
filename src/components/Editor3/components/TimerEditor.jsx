'use strict';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Box, IconButton } from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import UnitContext from '../../../context/unitContext';
import { getAmplifyClient } from '../../../utils/amplifyClient';
import { DEBOUNCE_SAVE_DELAY_MS } from '../editorConfig';

function decompose(totalSeconds) {
  const s = Math.max(0, Math.round(Number(totalSeconds) || 0));
  return [
    Math.floor(s / 3600),
    Math.floor((s % 3600) / 60),
    s % 60,
  ];
}

function compose(h, m, s) {
  return Math.max(0, h * 3600 + m * 60 + s);
}

const SEGMENT_MAX = [99, 59, 59]; // HH, MM, SS
const LABELS = ['HH', 'MM', 'SS'];

export default function TimerEditor() {
  const t = useTranslations('common');
  const { unit, beginSaving, endSaving } = React.useContext(UnitContext);
  const debounceRef = useRef(null);
  const editingRef = useRef(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null)];

  const initial = decompose(unit?.timeLimitSeconds);
  const [segments, setSegments] = useState(initial);
  const [activeIdx, setActiveIdx] = useState(null);
  const segmentsRef = useRef(segments);

  useEffect(() => { segmentsRef.current = segments; }, [segments]);

  // Sync from external updates when not editing
  useEffect(() => {
    if (editingRef.current) return;
    setSegments(decompose(unit?.timeLimitSeconds));
  }, [unit?.timeLimitSeconds]);

  const saveNow = useCallback(async () => {
    const total = compose(...segmentsRef.current);
    if (total === (unit?.timeLimitSeconds || 0)) return;
    beginSaving();
    try {
      const client = getAmplifyClient();
      const { errors } = await client.models.Unit.update({
        id: unit.id,
        timeLimitSeconds: total,
        _version: unit._version,
      });
      if (errors?.length) console.error('[TimerEditor] save errors:', errors);
    } catch (err) {
      console.error('[TimerEditor] save threw:', err);
    } finally {
      endSaving();
    }
  }, [unit?.id, unit?._version, unit?.timeLimitSeconds, beginSaving, endSaving]);

  const debouncedSave = useCallback(() => {
    editingRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveNow();
      editingRef.current = false;
    }, DEBOUNCE_SAVE_DELAY_MS);
  }, [saveNow]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const updateSegment = useCallback((idx, newVal) => {
    setSegments(prev => {
      const next = [...prev];
      next[idx] = Math.max(0, Math.min(SEGMENT_MAX[idx], newVal));
      return next;
    });
    debouncedSave();
  }, [debouncedSave]);

  // Increment with carry-left: SS 59→0 bumps MM, MM 59→0 bumps HH
  const increment = useCallback((idx) => {
    setSegments(prev => {
      const next = [...prev];
      if (next[idx] < SEGMENT_MAX[idx]) {
        next[idx]++;
      } else if (idx > 0) {
        // Carry left
        next[idx] = 0;
        // Recursively carry
        let carry = idx - 1;
        while (carry >= 0) {
          if (next[carry] < SEGMENT_MAX[carry]) {
            next[carry]++;
            break;
          } else if (carry > 0) {
            next[carry] = 0;
            carry--;
          } else {
            break; // HH maxed out
          }
        }
        // Focus the segment that received the carry
        if (carry >= 0 && carry < idx) {
          setTimeout(() => {
            inputRefs[carry].current?.focus();
            inputRefs[carry].current?.select();
          }, 0);
        }
      }
      return next;
    });
    debouncedSave();
  }, [debouncedSave]);

  // Decrement with borrow-right: MM 0→59 borrows from HH
  // When a segment reaches 0, focus moves right to the next segment
  const decrement = useCallback((idx) => {
    setSegments(prev => {
      const next = [...prev];
      if (next[idx] > 0) {
        next[idx]--;
        // If it just hit 0 and there's a segment to the right, focus right
        if (next[idx] === 0 && idx < 2) {
          setTimeout(() => {
            inputRefs[idx + 1].current?.focus();
            inputRefs[idx + 1].current?.select();
          }, 0);
        }
      } else if (idx > 0 && next[idx - 1] > 0) {
        // Borrow from left neighbor
        next[idx - 1]--;
        next[idx] = SEGMENT_MAX[idx];
      }
      // Never go negative — if everything is 0, stay at 0
      return next;
    });
    debouncedSave();
  }, [debouncedSave]);

  const handleArrowUp = useCallback(() => {
    const idx = activeIdx ?? 2;
    increment(idx);
  }, [activeIdx, increment]);

  const handleArrowDown = useCallback(() => {
    const idx = activeIdx ?? 2;
    decrement(idx);
  }, [activeIdx, decrement]);

  // Long-press acceleration: 1x initially, then 5x after 500ms, then 10x after 1.5s
  const longPressRef = useRef(null);

  const startLongPress = useCallback((action) => {
    // Fire once immediately
    action();
    let tickCount = 0;
    const startTime = Date.now();
    const interval = setInterval(() => {
      tickCount++;
      const elapsed = Date.now() - startTime;
      const step = elapsed > 1500 ? 10 : elapsed > 500 ? 5 : 1;
      for (let i = 0; i < step; i++) action();
    }, 100);
    longPressRef.current = interval;
  }, []);

  const stopLongPress = useCallback(() => {
    if (longPressRef.current) {
      clearInterval(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => stopLongPress();
  }, [stopLongPress]);

  const handleInputChange = useCallback((idx, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = parseInt(raw) || 0;
    updateSegment(idx, num);
  }, [updateSegment]);

  const handleKeyDown = useCallback((idx, e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      increment(idx);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrement(idx);
    } else if (e.key === 'ArrowRight' && idx < 2) {
      const input = e.target;
      if (input.selectionStart === input.value.length) {
        e.preventDefault();
        inputRefs[idx + 1].current?.focus();
        inputRefs[idx + 1].current?.select();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      const input = e.target;
      if (input.selectionStart === 0) {
        e.preventDefault();
        inputRefs[idx - 1].current?.focus();
        inputRefs[idx - 1].current?.select();
      }
    }
  }, [increment, decrement]);

  const segmentStyle = {
    width: '2.5ch',
    textAlign: 'center',
    fontSize: '16px',
    fontFamily: 'monospace',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    padding: '4px 0',
    color: 'inherit',
  };

  const colonStyle = {
    fontFamily: 'monospace',
    fontSize: '16px',
    fontWeight: 'bold',
    userSelect: 'none',
    padding: '0 1px',
  };

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      mt: 1,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      px: 0.5,
      py: 0.25,
      '&:focus-within': {
        borderColor: 'primary.main',
        borderWidth: 2,
        px: '3px',
        py: '1px',
      },
    }}>
      <TimerIcon sx={{ color: 'action.active', fontSize: 20, mr: 0.5 }} />

      {/* HH : MM : SS */}
      <input
        ref={inputRefs[0]}
        type="text"
        inputMode="numeric"
        value={String(segments[0]).padStart(2, '0')}
        onChange={(e) => handleInputChange(0, e)}
        onFocus={() => { setActiveIdx(0); inputRefs[0].current?.select(); }}
        onKeyDown={(e) => handleKeyDown(0, e)}
        aria-label={t('timer.hours', 'Hours')}
        style={segmentStyle}
      />
      <span style={colonStyle}>:</span>
      <input
        ref={inputRefs[1]}
        type="text"
        inputMode="numeric"
        value={String(segments[1]).padStart(2, '0')}
        onChange={(e) => handleInputChange(1, e)}
        onFocus={() => { setActiveIdx(1); inputRefs[1].current?.select(); }}
        onKeyDown={(e) => handleKeyDown(1, e)}
        aria-label={t('timer.minutes', 'Minutes')}
        style={segmentStyle}
      />
      <span style={colonStyle}>:</span>
      <input
        ref={inputRefs[2]}
        type="text"
        inputMode="numeric"
        value={String(segments[2]).padStart(2, '0')}
        onChange={(e) => handleInputChange(2, e)}
        onFocus={() => { setActiveIdx(2); inputRefs[2].current?.select(); }}
        onKeyDown={(e) => handleKeyDown(2, e)}
        aria-label={t('timer.seconds', 'Seconds')}
        style={segmentStyle}
      />

      {/* Up/Down arrows */}
      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 'auto' }}>
        <IconButton
          size="small"
          onMouseDown={() => startLongPress(handleArrowUp)}
          onMouseUp={stopLongPress}
          onMouseLeave={stopLongPress}
          onTouchStart={() => startLongPress(handleArrowUp)}
          onTouchEnd={stopLongPress}
          aria-label={t('timer.increase', 'Increase selected time segment')}
          sx={{ p: 0, lineHeight: 1 }}
        >
          <KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton
          size="small"
          onMouseDown={() => startLongPress(handleArrowDown)}
          onMouseUp={stopLongPress}
          onMouseLeave={stopLongPress}
          onTouchStart={() => startLongPress(handleArrowDown)}
          onTouchEnd={stopLongPress}
          aria-label={t('timer.decrease', 'Decrease selected time segment')}
          sx={{ p: 0, lineHeight: 1 }}
        >
          <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
