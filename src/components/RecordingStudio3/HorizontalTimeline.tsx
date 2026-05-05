/**
 * @fileoverview HorizontalTimeline — scrollable horizontal timeline with speaker track rows.
 *
 * Each speaker gets a row. Dialogue cards are absolutely positioned at their
 * `timing.start` offset and span `timing.end - timing.start`. The timeline
 * includes transport controls (play/stop/record), a draggable playhead,
 * time ruler, and zoom via Ctrl+scroll.
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Divider,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import AudioWaveformPlayer from '../Editor3/components/AudioWaveformPlayer';
import TimelineCard from './TimelineCard';

// ============================================================================
// Types
// ============================================================================

interface DialogueTiming {
  start: number;
  end: number;
}

interface DialogueLine {
  id: string;
  speaker: string;
  text: string;
  timing: DialogueTiming;
  activeTakeIndex: number | null;
  takes?: any[];
  direction?: string;
  emotion?: string;
}

interface Speaker {
  name: string;
  [key: string]: any;
}

interface ScriptData {
  dialogue: DialogueLine[];
  speakers: Record<string, Speaker>;
}

interface HorizontalTimelineProps {
  scriptData: ScriptData;
  selectedDialogueId: string | null;
  onSelectDialogue: (id: string) => void;
  recording?: boolean;
  playing?: boolean;
  onPlay: () => void;
  onStop: () => void;
  onRecordingComplete: (audioBlob: Blob, waveformData?: number[]) => void;
  readOnly?: boolean;
}

/** Pixels per second at zoom level 1.0 */
const BASE_PX_PER_SEC = 80;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

/**
 * Format seconds as M:SS.
 */
function formatTime(s: number): string {
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function HorizontalTimeline({
  scriptData,
  selectedDialogueId,
  onSelectDialogue,
  recording = false,
  playing = false,
  onPlay,
  onStop,
  onRecordingComplete,
  readOnly = false,
}: HorizontalTimelineProps) {
  const { t } = useTranslation('components');
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);

  const pxPerSec = BASE_PX_PER_SEC * zoom;

  // Selected dialogue line (for RS2 item prop)
  const selectedDialogue = scriptData.dialogue.find((d: DialogueLine) => d.id === selectedDialogueId) || null;

  // Compute total duration from the last dialogue line's end time + buffer
  const totalDuration = useMemo(() => {
    if (!scriptData.dialogue.length) return 10;
    const maxEnd = Math.max(...scriptData.dialogue.map((d: DialogueLine) => d.timing.end));
    return maxEnd + 2; // 2s buffer at the end
  }, [scriptData.dialogue]);

  const containerWidth = totalDuration * pxPerSec;

  // Unique speaker keys in order of first appearance
  const speakerOrder = useMemo(() => {
    const seen = new Set();
    const order = [];
    for (const line of scriptData.dialogue) {
      if (!seen.has(line.speaker)) {
        seen.add(line.speaker);
        order.push(line.speaker);
      }
    }
    // Also include speakers with no dialogue yet
    for (const key of Object.keys(scriptData.speakers)) {
      if (!seen.has(key)) {
        seen.add(key);
        order.push(key);
      }
    }
    return order;
  }, [scriptData.dialogue, scriptData.speakers]);

  // Group dialogue lines by speaker
  const linesBySpeaker = useMemo(() => {
    const map: Record<string, DialogueLine[]> = {};
    for (const key of speakerOrder) map[key] = [];
    for (const line of scriptData.dialogue) {
      if (!map[line.speaker]) map[line.speaker] = [];
      map[line.speaker].push(line);
    }
    return map;
  }, [scriptData.dialogue, speakerOrder]);

  // Zoom via Ctrl+scroll
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((prev) => {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * delta));
    });
  }, []);

  // Time ruler tick marks
  const ticks = useMemo(() => {
    const step = zoom >= 2 ? 1 : zoom >= 0.75 ? 5 : 10;
    const arr = [];
    for (let s = 0; s <= totalDuration; s += step) {
      arr.push(s);
    }
    return arr;
  }, [totalDuration, zoom]);

  const TRACK_HEIGHT = 64;
  const LABEL_WIDTH = 100;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'action.hover',
        borderTop: 1,
        borderColor: 'divider',
        minHeight: TRACK_HEIGHT * Math.max(speakerOrder.length, 1) + 80,
      }}
    >
      {/* Transport controls */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ px: 1, py: 0.5 }}
      >
        <IconButton
          size="small"
          onClick={playing ? onStop : onPlay}
          disabled={readOnly && !playing}
          color={playing ? 'error' : 'default'}
          aria-label={playing ? t('recordingStudio3.stop') : t('recordingStudio3.play', 'Play')}
        >
          {playing ? <StopIcon /> : <PlayIcon />}
        </IconButton>

        {/* Embedded AudioWaveformPlayer for recording on the selected line */}
        {!readOnly && selectedDialogueId && (
          <Box sx={{ flex: '0 0 auto' }}>
            {/* @ts-expect-error — AudioWaveformPlayer accepts partial props for recording-only mode */}
            <AudioWaveformPlayer
              enableRecording
              onRecordingComplete={onRecordingComplete}
              height={50}
              width={250}
            />
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          {formatTime(0)} / {formatTime(totalDuration)}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: 'auto' }}
        >
          Zoom: {Math.round(zoom * 100)}%
        </Typography>
      </Stack>

      <Divider />

      {/* Scrollable timeline area */}
      <Box
        ref={containerRef}
        onWheel={handleWheel}
        sx={{
          display: 'flex',
          overflow: 'auto',
          flex: 1,
        }}
      >
        {/* Speaker labels column (fixed) */}
        <Box
          sx={{
            width: LABEL_WIDTH,
            minWidth: LABEL_WIDTH,
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
          }}
        >
          {/* Ruler spacer */}
          <Box sx={{ height: 24, borderBottom: 1, borderColor: 'divider' }} />
          {speakerOrder.map((key) => (
            <Box
              key={key}
              sx={{
                height: TRACK_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                px: 1,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" noWrap sx={{ fontWeight: 600 }}>
                {scriptData.speakers[key]?.name || key}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Tracks + ruler (scrollable) */}
        <Box sx={{ position: 'relative', width: containerWidth, flexShrink: 0 }}>
          {/* Time ruler */}
          <Box
            sx={{
              height: 24,
              position: 'relative',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            {ticks.map((s) => (
              <Typography
                key={s}
                variant="caption"
                sx={{
                  position: 'absolute',
                  left: s * pxPerSec,
                  top: 4,
                  fontSize: '0.6rem',
                  color: 'text.secondary',
                  userSelect: 'none',
                }}
              >
                {formatTime(s)}
              </Typography>
            ))}
          </Box>

          {/* Speaker tracks */}
          {speakerOrder.map((key) => (
            <Box
              key={key}
              sx={{
                height: TRACK_HEIGHT,
                position: 'relative',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              {(linesBySpeaker[key] || []).map((line) => (
                <TimelineCard
                  key={line.id}
                  line={line}
                  speaker={scriptData.speakers[line.speaker]}
                  isSelected={selectedDialogueId === line.id}
                  left={line.timing.start * pxPerSec}
                  width={(line.timing.end - line.timing.start) * pxPerSec}
                  onClick={onSelectDialogue}
                />
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
