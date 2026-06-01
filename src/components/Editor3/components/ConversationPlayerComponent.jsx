/**
 * @fileoverview ConversationPlayerComponent — Read-only conversation playlist player.
 *
 * Plays audio tracks one at a time, displays subtitle lines synced to playback position,
 * shows still images per dialogue line, and offers a "Generate Movie" action (placeholder).
 */

'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Chip,
  Tooltip,
  Paper,
  Divider,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import MovieIcon from '@mui/icons-material/Movie';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import ImageIcon from '@mui/icons-material/Image';
import getCachedUrl from '../../../utils/getCachedUrl';
import UnitContext from '../../../context/unitContext';

/**
 * @param {Object} props
 * @param {string} props.nodeKey
 * @param {string[]} props.fileIDs         - audio File IDs
 * @param {Array}   props.dialogue         - subtitle lines
 * @param {string}  props.scriptTitle
 * @param {string|null} props.movieFileID  - generated movie File ID
 */
export default function ConversationPlayerComponent({
  nodeKey,
  fileIDs = [],
  dialogue = [],
  scriptTitle = '',
  movieFileID = null,
}) {
  const t = useTranslations('components');
  const { files } = React.useContext(UnitContext);

  const audioRef = React.useRef(null);
  const [trackIndex, setTrackIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0); // 0-100
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [audioSrc, setAudioSrc] = React.useState(null);
  const [stillSrc, setStillSrc] = React.useState(null);
  const [showMovieToast, setShowMovieToast] = React.useState(false);
  const [showSubtitles, setShowSubtitles] = React.useState(true);

  // Resolve signed URL for the current track
  React.useEffect(() => {
    let cancelled = false;
    const fileId = fileIDs[trackIndex];
    if (!fileId) return;

    const file = files?.[fileId];
    if (!file?.path) return;

    getCachedUrl(file.path, 'protected', file.identityId).then((url) => {
      if (!cancelled && url) setAudioSrc(url);
    });

    return () => { cancelled = true; };
  }, [trackIndex, fileIDs, files]);

  // Active dialogue line: find the line whose timing window contains currentTime,
  // falling back to the last line whose start <= currentTime.
  const activeLine = React.useMemo(() => {
    if (!dialogue || dialogue.length === 0) return null;
    // Lines associated with current track's audioFileID, or all lines in order
    const trackFileId = fileIDs[trackIndex];
    const trackLines = dialogue.filter((l) => l.audioFileID === trackFileId);
    const pool = trackLines.length > 0 ? trackLines : dialogue;

    let best = null;
    for (const line of pool) {
      if ((line.timing?.start ?? 0) <= currentTime) {
        best = line;
      }
    }
    return best;
  }, [dialogue, currentTime, trackIndex, fileIDs]);

  // Load still for active line
  React.useEffect(() => {
    let cancelled = false;
    const stillId = activeLine?.stillFileID;
    if (!stillId) {
      setStillSrc(null);
      return;
    }
    const file = files?.[stillId];
    if (!file?.path) return;

    getCachedUrl(file.path, 'protected', file.identityId).then((url) => {
      if (!cancelled && url) setStillSrc(url);
    });

    return () => { cancelled = true; };
  }, [activeLine?.stillFileID, files]);

  // Audio event handlers
  const handleTimeUpdate = () => {
    const el = audioRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
    if (el.duration) {
      setProgress((el.currentTime / el.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    // Auto-advance to next track
    if (trackIndex < fileIDs.length - 1) {
      setTrackIndex((i) => i + 1);
      setPlaying(true);
    } else {
      setPlaying(false);
      setProgress(100);
    }
  };

  // Sync play/pause state to audio element
  React.useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.play().catch((err) => console.warn('[ConversationPlayer] play error:', err));
    } else {
      el.pause();
    }
  }, [playing, audioSrc]);

  const handlePlayPause = () => setPlaying((p) => !p);

  const handlePrev = () => {
    setTrackIndex((i) => Math.max(0, i - 1));
    setCurrentTime(0);
    setProgress(0);
  };

  const handleNext = () => {
    setTrackIndex((i) => Math.min(fileIDs.length - 1, i + 1));
    setCurrentTime(0);
    setProgress(0);
  };

  const handleSeek = (e) => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    el.currentTime = ratio * el.duration;
  };

  const formatTime = (s) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const trackFile = files?.[fileIDs[trackIndex]];
  const trackLabel = trackFile?.name || `Track ${trackIndex + 1}`;

  if (fileIDs.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('conversationPlayer.noTracks', 'No audio tracks recorded yet.')}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <SubtitlesIcon fontSize="small" />
        <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 600 }}>
          {scriptTitle || t('conversationPlayer.defaultTitle', 'Conversation')}
        </Typography>
        <Chip
          label={`${trackIndex + 1} / ${fileIDs.length}`}
          size="small"
          sx={{ bgcolor: 'primary.dark', color: 'primary.contrastText', height: 20 }}
        />
      </Box>

      {/* Still image */}
      {stillSrc && (
        <Box
          component="img"
          src={stillSrc}
          alt={activeLine?.speaker || ''}
          sx={{
            width: '100%',
            maxHeight: 280,
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}
      {!stillSrc && activeLine && (
        <Box
          sx={{
            width: '100%',
            height: 60,
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ImageIcon sx={{ color: 'grey.400' }} />
        </Box>
      )}

      {/* Subtitle area */}
      {showSubtitles && (
        <Box
          sx={{
            minHeight: 56,
            px: 3,
            py: 1.5,
            bgcolor: 'background.default',
            textAlign: 'center',
          }}
        >
          {activeLine ? (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                {activeLine.speaker}
              </Typography>
              <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                {activeLine.text}
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.disabled">
              {t('conversationPlayer.noSubtitle', '—')}
            </Typography>
          )}
        </Box>
      )}

      <Divider />

      {/* Progress bar — clickable */}
      <Box
        sx={{ px: 2, pt: 1, cursor: 'pointer' }}
        onClick={handleSeek}
        role="slider"
        aria-label={t('conversationPlayer.seekBar', 'Seek')}
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 6, borderRadius: 3 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
          <Typography variant="caption" color="text.secondary">
            {formatTime(currentTime)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(duration)}
          </Typography>
        </Box>
      </Box>

      {/* Controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          pb: 1,
        }}
      >
        <Tooltip title={t('conversationPlayer.previousTrack', 'Previous track')}>
          <span>
            <IconButton onClick={handlePrev} disabled={trackIndex === 0} size="small">
              <SkipPreviousIcon />
            </IconButton>
          </span>
        </Tooltip>

        <IconButton onClick={handlePlayPause} color="primary" size="large">
          {playing ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>

        <Tooltip title={t('conversationPlayer.nextTrack', 'Next track')}>
          <span>
            <IconButton onClick={handleNext} disabled={trackIndex >= fileIDs.length - 1} size="small">
              <SkipNextIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ flexGrow: 1, ml: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {trackLabel}
        </Typography>

        <Tooltip title={t('conversationPlayer.toggleSubtitles', 'Toggle subtitles')}>
          <IconButton
            size="small"
            onClick={() => setShowSubtitles((s) => !s)}
            color={showSubtitles ? 'primary' : 'default'}
          >
            <SubtitlesIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {movieFileID ? (
          <Tooltip title={t('conversationPlayer.playMovie', 'Play generated movie')}>
            <IconButton size="small" color="secondary">
              <MovieIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title={t('conversationPlayer.generateMovieTooltip', 'Generate a movie from this conversation (coming soon)')}>
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={<MovieIcon />}
                onClick={() => setShowMovieToast(true)}
                sx={{ ml: 0.5 }}
              >
                {t('conversationPlayer.generateMovie', 'Generate Movie')}
              </Button>
            </span>
          </Tooltip>
        )}
      </Box>

      {/* Hidden audio element */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
          style={{ display: 'none' }}
        />
      )}

      {/* Movie generation toast */}
      <Snackbar
        open={showMovieToast}
        autoHideDuration={4000}
        onClose={() => setShowMovieToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          onClose={() => setShowMovieToast(false)}
          sx={{ width: '100%' }}
        >
          {t(
            'conversationPlayer.generateMovieSoon',
            'Movie generation from conversation audio + stills is coming soon.',
          )}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
