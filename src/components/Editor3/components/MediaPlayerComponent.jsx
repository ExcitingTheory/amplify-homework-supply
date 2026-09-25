import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Slider,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import MicIcon from "@mui/icons-material/Mic";
import MovieIcon from "@mui/icons-material/Movie";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PlaylistPlayIcon from "@mui/icons-material/PlaylistPlay";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import StopIcon from "@mui/icons-material/Stop";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import videojs from "video.js";
import "video.js/dist/video-js.css";

import UnitContext from "../../../context/unitContext";
import getCachedUrl from "../../../utils/getCachedUrl";
import { trackAudioPlayed, trackVideoPlayed } from "../../../utils/analytics";
import AudioWaveformPlayer from "./AudioWaveformPlayer";
import AudioTakePlaylist from "./AudioTakePlaylist";
import MediaPromptBand from "./MediaPromptBand";
import PlaybackWaveformVisualizer from "./PlaybackWaveformVisualizer";
import StaticWaveform from "./StaticWaveform";
import { useAudioRecordingTakes } from "../hooks/useAudioRecordingTakes";
import { createTemporaryAudioTakeScope } from "../../../utils/temporaryAudioTakeStore";
import { uploadStudentSubmission } from "../../../utils/userSubmissionStorage";
import { calculateWaveformData } from "../../../utils/calculateWaveformData";
import { AUDIO_WAVEFORM_PLAYER_DEFAULTS } from "../../../utils/waveformDefaults";

function inferMediaType(path = "", declaredType) {
  if (declaredType) return declaredType;

  const extension = path.split("?")[0].split(".").pop()?.toLowerCase();
  const types = {
    m3u8: "application/x-mpegURL",
    m4a: "audio/mp4",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    ogg: "audio/ogg",
    wav: "audio/wav",
    webm: "video/webm",
  };

  return types[extension] || "audio/mpeg";
}

function isVideoTrack(track) {
  return track?.type?.startsWith("video");
}

function formatTimecode(seconds) {
  const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

async function resolveTrack({ id, title, path, hlsPath, mimeType, size }) {
  if (!path && !hlsPath) return null;

  let sourcePath = path;
  let type = inferMediaType(path, mimeType);

  if (hlsPath) {
    const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN;
    sourcePath = cdnDomain
      ? `/api/hls?path=${encodeURIComponent(hlsPath)}`
      : await getCachedUrl(hlsPath);
    type = "application/x-mpegURL";
  } else {
    sourcePath = await getCachedUrl(path);
  }

  if (!sourcePath) return null;

  return { id, title, src: sourcePath, type, size };
}

function ControlButton({
  label,
  disabled = false,
  onClick,
  expanded,
  controls,
  pressed,
  children,
}) {
  return (
    <Tooltip title={label}>
      <span>
        <IconButton
          aria-label={label}
          aria-controls={controls}
          aria-expanded={expanded}
          aria-pressed={pressed}
          disabled={disabled}
          onClick={onClick}
          size="small"
          sx={{
            width: { xs: 28, sm: 30 },
            height: { xs: 28, sm: 30 },
            color: "inherit",
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function LevelControlSlider({
  label,
  value = 0,
  min = 0,
  max = 1,
  step = 0.01,
  disabled = false,
  orientation = "vertical",
  onChange,
  showValue = false,
  visualLevel,
}) {
  const isVertical = orientation === "vertical";
  const sliderRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const currentValue = typeof visualLevel === "number" ? visualLevel : value;
  const allowedPercent = Math.max(0, Math.min(100, value * 100));
  const signalPercent = Math.max(0, Math.min(100, currentValue * 100));
  const maxSize = "100%";
  const allowedSize = `${allowedPercent}%`;
  const liveSize = `${signalPercent}%`;

  const updateFromPointer = React.useCallback(
    (clientX, clientY) => {
      if (!sliderRef.current || !onChange) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const raw = isVertical
        ? 1 - (clientY - rect.top) / rect.height
        : (clientX - rect.left) / rect.width;
      const nextValue = Math.min(max, Math.max(min, min + raw * (max - min)));
      onChange(nextValue);
    },
    [isVertical, max, min, onChange],
  );

  const handleDrag = React.useCallback(
    (event) => {
      if (disabled) return;
      updateFromPointer(event.clientX, event.clientY);
    },
    [disabled, updateFromPointer],
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.75,
      }}
    >
      {showValue && (
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 700,
            minWidth: isVertical ? 30 : 0,
            textAlign: "center",
            lineHeight: 1,
          }}
        >
          {Math.round(currentValue * 100)}%
        </Typography>
      )}

      <Box
        ref={sliderRef}
        aria-label={label}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={(event) => {
          if (disabled) return;
          setDragging(true);
          event.preventDefault();
          handleDrag(event);
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragging || disabled) return;
          handleDrag(event);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
        onKeyDown={(event) => {
          if (disabled || !onChange) return;
          const delta =
            event.key === "ArrowUp" || event.key === "ArrowRight"
              ? step
              : event.key === "ArrowDown" || event.key === "ArrowLeft"
                ? -step
                : 0;

          if (!delta) return;
          event.preventDefault();
          onChange(Math.min(max, Math.max(min, value + delta)));
        }}
        sx={{
          position: "relative",
          width: isVertical ? 20 : 116,
          height: isVertical ? 116 : 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto",
          cursor: disabled ? "default" : "pointer",
          outline: "none",
          touchAction: "none",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: 999,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(146, 136, 170, 0.5)",
            overflow: "hidden",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              ...(isVertical
                ? { left: 0, right: 0, bottom: 0, height: maxSize }
                : { left: 0, top: 0, bottom: 0, width: maxSize }),
              background: "rgba(168, 85, 247, 0.14)",
              borderRadius: 999,
            }}
          />

          <Box
            sx={{
              position: "absolute",
              ...(isVertical
                ? { left: 0, right: 0, bottom: 0, height: allowedSize }
                : { left: 0, top: 0, bottom: 0, width: allowedSize }),
              background: "rgba(168, 85, 247, 0.2)",
              borderRadius: 999,
              transition: isVertical ? "height 120ms ease" : "width 120ms ease",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              ...(isVertical
                ? { left: 0, right: 0, bottom: 0, height: liveSize }
                : { left: 0, top: 0, bottom: 0, width: liveSize }),
              background: "rgba(168, 85, 247, 0.92)",
              borderRadius: 999,
              transition: isVertical ? "height 120ms ease" : "width 120ms ease",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default function MediaPlayerComponent({
  className,
  fileIDs,
  questionIDs,
  words,
  requestDefinition = false,
  variant = "full",
  recordingMode = "none",
  gradeId,
  nodeKey,
  recordingMetadata,
  onRecordingComplete,
  onHelp,
  onClose,
}) {
  const t = useTranslations("editor.shared");
  const tCommon = useTranslations("common");
  const [tracks, setTracks] = React.useState([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [player, setPlayer] = React.useState(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [displayCurrentTime, setDisplayCurrentTime] = React.useState(0);
  const [bufferedTime, setBufferedTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [trackDurations, setTrackDurations] = React.useState({});
  const [volume, setVolume] = React.useState(1);
  const [muted, setMuted] = React.useState(false);
  const [meterLevel, setMeterLevel] = React.useState(0);
  const [volumeControl, setVolumeControl] = React.useState(null);
  const [playlistOpen, setPlaylistOpen] = React.useState(true);
  const [activeList, setActiveList] = React.useState("media");
  const [activeWaveformData, setActiveWaveformData] = React.useState(null);
  const [selectedTakeUrl, setSelectedTakeUrl] = React.useState(null);
  const [takePlaybackId, setTakePlaybackId] = React.useState(null);
  const [takePlaybackProgress, setTakePlaybackProgress] = React.useState(0);
  const [submissionCountdown, setSubmissionCountdown] = React.useState(null);
  const submissionTimerRef = React.useRef(null);
  const hasAudioRecording = recordingMode === "audio";
  const takeScopeKey = React.useMemo(
    () => createTemporaryAudioTakeScope(gradeId, nodeKey),
    [gradeId, nodeKey],
  );
  const recordingTakes = useAudioRecordingTakes({ scopeKey: takeScopeKey });
  const playlistId = React.useId();
  const videoRef = React.useRef(null);
  const playerRef = React.useRef(null);
  const nowPlayingRef = React.useRef(null);
  const pendingAutoplayRef = React.useRef(false);
  const targetTimeRef = React.useRef(0);
  const scrubTimeRef = React.useRef(0);
  const isScrubbingRef = React.useRef(false);
  const outputVolumeButtonRef = React.useRef(null);
  const inputVolumeButtonRef = React.useRef(null);
  const takePlayerRef = React.useRef(null);
  const pendingTakePlaybackRef = React.useRef(null);

  const { unit, files, questionBank } = React.useContext(UnitContext);

  React.useEffect(() => {
    if (!recordingTakes.selectedTake) {
      setSelectedTakeUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(recordingTakes.selectedTake.blob);
    setSelectedTakeUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recordingTakes.selectedTake]);

  const playTake = React.useCallback(
    (takeId) => {
      playerRef.current?.pause();
      recordingTakes.setSelectedTakeId(takeId);
      pendingTakePlaybackRef.current = takeId;
      setTakePlaybackId(takeId);
      setTakePlaybackProgress(0);

      if (takeId === recordingTakes.selectedTakeId && selectedTakeUrl) {
        const takePlayer = takePlayerRef.current;
        if (!takePlayer) return;
        takePlayer.currentTime = 0;
        const playResult = takePlayer.play();
        if (playResult?.catch) void playResult.catch(() => undefined);
        pendingTakePlaybackRef.current = null;
      }
    },
    [recordingTakes, selectedTakeUrl],
  );

  React.useEffect(() => {
    if (
      !selectedTakeUrl ||
      pendingTakePlaybackRef.current !== recordingTakes.selectedTakeId
    ) {
      return;
    }
    const takePlayer = takePlayerRef.current;
    if (!takePlayer) return;
    takePlayer.currentTime = 0;
    const playResult = takePlayer.play();
    if (playResult?.catch) void playResult.catch(() => undefined);
    pendingTakePlaybackRef.current = null;
  }, [recordingTakes.selectedTakeId, selectedTakeUrl]);

  React.useEffect(() => {
    if (!takePlayerRef.current) return;
    takePlayerRef.current.volume = volume;
    takePlayerRef.current.muted = muted;
  }, [muted, volume]);

  const playCurrent = React.useCallback(
    (playerInstance = playerRef.current) => {
      if (!playerInstance || playerInstance.isDisposed()) return;
      const playResult = playerInstance.play();
      if (playResult?.catch) {
        void playResult.catch(() => setIsPlaying(false));
      }
    },
    [],
  );

  React.useEffect(() => {
    let cancelled = false;

    const loadTracks = async () => {
      const candidates = [];

      for (const id of fileIDs || []) {
        const file = files[id];
        if (!file) continue;
        candidates.push(
          resolveTrack({
            id: file.id,
            title: file.name,
            path: file.path,
            hlsPath: file.hlsUrl,
            mimeType: file.mimeType,
            size: file.size,
          }),
        );
      }

      for (const id of questionIDs || []) {
        const question = questionBank[id];
        const path = question?.audio?.[0];
        if (!question || !path) continue;
        candidates.push(
          resolveTrack({
            id: question.id,
            title: question.prompt,
            path,
          }),
        );
      }

      for (const word of words || []) {
        if (!word) continue;
        const path = requestDefinition
          ? word.definitionAudio?.[0]
          : word.audio?.[0];
        if (!path) continue;
        candidates.push(
          resolveTrack({
            id: word.id,
            title: requestDefinition ? word.definition : word.phrase,
            path,
            mimeType: word.mimeType,
            size: word.size,
          }),
        );
      }

      const resolvedTracks = (await Promise.all(candidates)).filter(Boolean);
      if (cancelled) return;

      setTracks(resolvedTracks);
      setCurrentIndex((index) =>
        Math.min(index, Math.max(0, resolvedTracks.length - 1)),
      );
    };

    void loadTracks();

    return () => {
      cancelled = true;
    };
  }, [fileIDs, files, questionBank, questionIDs, requestDefinition, words]);

  React.useEffect(() => {
    const mediaElements = tracks.map((track) => {
      const mediaElement = document.createElement("audio");
      const trackKey = track.id || track.src;
      const handleMetadata = () => {
        if (Number.isFinite(mediaElement.duration)) {
          setTrackDurations((current) => ({
            ...current,
            [trackKey]: mediaElement.duration,
          }));
        }
      };

      mediaElement.preload = "metadata";
      mediaElement.addEventListener("loadedmetadata", handleMetadata);
      mediaElement.src = track.src;
      mediaElement.load();

      return { mediaElement, handleMetadata };
    });

    return () => {
      mediaElements.forEach(({ mediaElement, handleMetadata }) => {
        mediaElement.removeEventListener("loadedmetadata", handleMetadata);
        mediaElement.src = "";
      });
    };
  }, [tracks]);

  React.useEffect(() => {
    if (
      !videoRef.current ||
      playerRef.current ||
      (tracks.length === 0 && !hasAudioRecording)
    ) {
      return undefined;
    }

    const videoElement = document.createElement("video-js");
    videoElement.classList.add("vjs-fill");
    videoRef.current.appendChild(videoElement);

    const playerInstance = videojs(videoElement, {
      controls: false,
      crossorigin: "anonymous",
      preload: "metadata",
    });

    playerRef.current = playerInstance;
    setPlayer(playerInstance);

    return () => {
      if (!playerInstance.isDisposed()) playerInstance.dispose();
      playerRef.current = null;
      setPlayer(null);
    };
  }, [hasAudioRecording, tracks.length]);

  const currentTrack = tracks[currentIndex] || null;
  const activeTrack = currentTrack;
  nowPlayingRef.current = activeTrack;

  React.useEffect(() => {
    let cancelled = false;
    if (!activeTrack || activeTrack.type.startsWith("video")) {
      setActiveWaveformData(null);
      return undefined;
    }

    setActiveWaveformData(null);
    void fetch(activeTrack.src)
      .then((response) => response.arrayBuffer())
      .then((buffer) => calculateWaveformData(buffer, 600))
      .then((waveformData) => {
        if (!cancelled) setActiveWaveformData(waveformData);
      })
      .catch((error) => {
        console.warn("Unable to calculate media waveform:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTrack]);

  React.useEffect(() => {
    if (!player || !activeTrack || player.isDisposed()) return undefined;

    const playWhenReady = () => {
      if (!pendingAutoplayRef.current) return;
      pendingAutoplayRef.current = false;
      playCurrent(player);
    };

    setCurrentTime(0);
    setDuration(0);
    player.src({ src: activeTrack.src, type: activeTrack.type });
    player.load();
    player.one("canplay", playWhenReady);

    return () => player.off("canplay", playWhenReady);
  }, [activeTrack, playCurrent, player]);

  const selectTrack = React.useCallback(
    (index, autoplay = true) => {
      if (index < 0 || index >= tracks.length) return;

      if (index === currentIndex) {
        if (autoplay) playCurrent();
        return;
      }

      pendingAutoplayRef.current = autoplay;
      setCurrentIndex(index);
    },
    [currentIndex, playCurrent, tracks.length],
  );

  React.useEffect(() => {
    if (!duration) {
      setDisplayCurrentTime(0);
      return undefined;
    }

    let frameId = 0;

    const tick = () => {
      if (player && !player.isDisposed()) {
        if (isScrubbingRef.current) {
          const scrubTime = scrubTimeRef.current;
          const mediaElement = player.tech(true)?.el();
          if (mediaElement) mediaElement.currentTime = scrubTime;
          targetTimeRef.current = scrubTime;
        } else {
          const mediaTime = player.currentTime();
          if (Number.isFinite(mediaTime)) {
            targetTimeRef.current = mediaTime;
          }
        }
      }
      setDisplayCurrentTime((previous) => {
        const targetTime = targetTimeRef.current;
        if (Math.abs(targetTime - previous) < 0.01) {
          return targetTime;
        }

        return previous + (targetTime - previous) * 0.2;
      });
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [duration, player]);

  React.useEffect(() => {
    if (!player || player.isDisposed()) return undefined;

    const updateTime = () => {
      const nextTime = player.currentTime() || 0;
      targetTimeRef.current = nextTime;
      setCurrentTime(nextTime);
    };
    const updateBuffered = () => {
      const nextDuration = player.duration();
      const ranges = player.buffered();
      const rangeEnd = ranges.length ? ranges.end(ranges.length - 1) : 0;
      setBufferedTime(
        Number.isFinite(nextDuration)
          ? Math.min(rangeEnd, nextDuration)
          : rangeEnd,
      );
    };
    const updateDuration = () => {
      const nextDuration = player.duration();
      setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
      if (Number.isFinite(nextDuration) && activeTrack) {
        setTrackDurations((current) => ({
          ...current,
          [activeTrack.id || activeTrack.src]: nextDuration,
        }));
      }
      updateBuffered();
    };
    const updateVolume = () => {
      setVolume(player.volume());
      setMuted(player.muted());
    };
    const handlePlay = () => {
      setIsPlaying(true);
      const track = nowPlayingRef.current;
      if (!track) return;
      const durationMs = Number.isFinite(player.duration())
        ? Math.round(player.duration() * 1000)
        : undefined;
      if (track.type.startsWith("video")) {
        trackVideoPlayed(track.id || unit?.id || "media", {
          unitId: unit?.id,
          durationMs,
        });
      } else {
        trackAudioPlayed(track.id || unit?.id || "media", {
          unitId: unit?.id,
          durationMs,
        });
      }
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (activeList === "media" && currentIndex < tracks.length - 1) {
        selectTrack(currentIndex + 1, true);
      } else {
        player.currentTime(0);
        targetTimeRef.current = 0;
        setCurrentTime(0);
        setDisplayCurrentTime(0);
      }
    };

    player.on("timeupdate", updateTime);
    player.on("progress", updateBuffered);
    player.on("durationchange", updateDuration);
    player.on("loadedmetadata", updateDuration);
    player.on("canplay", updateBuffered);
    player.on("volumechange", updateVolume);
    player.on("play", handlePlay);
    player.on("pause", handlePause);
    player.on("ended", handleEnded);

    return () => {
      player.off("timeupdate", updateTime);
      player.off("progress", updateBuffered);
      player.off("durationchange", updateDuration);
      player.off("loadedmetadata", updateDuration);
      player.off("canplay", updateBuffered);
      player.off("volumechange", updateVolume);
      player.off("play", handlePlay);
      player.off("pause", handlePause);
      player.off("ended", handleEnded);
    };
  }, [
    currentIndex,
    activeList,
    activeTrack,
    player,
    selectTrack,
    tracks.length,
    unit?.id,
  ]);

  const isVideo = Boolean(isVideoTrack(currentTrack || activeTrack));
  const isStopped = !isPlaying && currentTime <= 0.01;
  const isPaused = !isPlaying && !isStopped;
  const seekTo = React.useCallback((nextTime) => {
    scrubTimeRef.current = nextTime;
    targetTimeRef.current = nextTime;
    setCurrentTime(nextTime);
    setDisplayCurrentTime(nextTime);

    const playerInstance = playerRef.current;
    const mediaElement = playerInstance?.tech(true)?.el();
    if (mediaElement) {
      mediaElement.currentTime = nextTime;
    }
    playerInstance?.currentTime(nextTime);
    playerInstance?.trigger("seeking");
    playerInstance?.trigger("timeupdate");
  }, []);
  const controlProfile = `${isVideo ? "video" : "audio"}-${
    hasAudioRecording ? "audio-recording" : "playback"
  }`;

  const cancelTakeSubmission = React.useCallback(() => {
    if (submissionTimerRef.current) {
      window.clearInterval(submissionTimerRef.current);
      submissionTimerRef.current = null;
    }
    setSubmissionCountdown(null);
  }, []);

  const submitSelectedTake = React.useCallback(async () => {
    const take = recordingTakes.selectedTake;
    if (!take) return;
    cancelTakeSubmission();

    let uploadResult = null;
    if (gradeId && nodeKey) {
      uploadResult = await uploadStudentSubmission({
        file: take.blob,
        gradeId,
        nodeKey,
        fileType: "mp3",
        metadata: recordingMetadata || {},
      });
    }

    onRecordingComplete?.(
      uploadResult
        ? { path: uploadResult.path }
        : { path: URL.createObjectURL(take.blob) },
      uploadResult,
    );
    await recordingTakes.clearTakes();
    setActiveList("media");
  }, [
    cancelTakeSubmission,
    gradeId,
    nodeKey,
    onRecordingComplete,
    recordingMetadata,
    recordingTakes,
  ]);

  const requestTakeSubmission = React.useCallback(() => {
    if (submissionCountdown !== null) {
      void submitSelectedTake();
      return;
    }
    setSubmissionCountdown(10);
    submissionTimerRef.current = window.setInterval(() => {
      setSubmissionCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(submissionTimerRef.current);
          submissionTimerRef.current = null;
          void submitSelectedTake();
          return null;
        }
        return current - 1;
      });
    }, 1000);
  }, [submissionCountdown, submitSelectedTake]);

  React.useEffect(() => cancelTakeSubmission, [cancelTakeSubmission]);
  const controlColor = "rgba(255, 255, 255, 0.92)";
  const watermark = tCommon("app.name");
  const labels = {
    input: "Input",
    inputVolume: "Input volume",
    mute: "Mute",
    output: "Output",
    outputVolume: "Output volume",
    pause: "Pause",
    playbackControls: "Playback controls",
    playlist: "Playlist",
    recordingControls: "Recording controls",
    unmute: "Unmute",
    volumeControls: "Volume controls",
  };

  if (variant === "compact" && !isVideo && !hasAudioRecording) {
    return (
      <Box className={className} sx={{ width: "min(100%, 48rem)" }}>
        <AudioWaveformPlayer
          audioUrl={currentTrack?.src}
          title={currentTrack?.title}
          compact
        />
      </Box>
    );
  }

  return (
    <Box
      className={className}
      sx={{
        width: isVideo ? "min(100%, 72rem)" : "min(100%, 40rem)",
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        boxShadow: 2,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: isVideo ? "16 / 9" : "auto",
          height: isVideo ? "auto" : AUDIO_WAVEFORM_PLAYER_DEFAULTS.height + 16,
          minHeight: isVideo ? 220 : AUDIO_WAVEFORM_PLAYER_DEFAULTS.height + 16,
          maxHeight: isVideo
            ? "68vh"
            : AUDIO_WAVEFORM_PLAYER_DEFAULTS.height + 16,
          bgcolor: "background.paper",
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          overflow: "hidden",
          "& .video-js, & video, & canvas": {
            borderBottomLeftRadius: "0 !important",
            borderBottomRightRadius: "0 !important",
          },
          "& .video-js": { width: "100%", height: "100%" },
        }}
      >
        <Box
          data-vjs-player
          sx={{
            position: "absolute",
            inset: 0,
            opacity: isVideo ? 1 : 0,
            pointerEvents: isVideo ? "auto" : "none",
          }}
        >
          <Box ref={videoRef} sx={{ width: "100%", height: "100%" }} />
        </Box>

        <PlaybackWaveformVisualizer
          player={player}
          visible={!isVideo && isPlaying}
          onLevelChange={setMeterLevel}
        />

        {!isVideo && !isPlaying && activeWaveformData && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              overflow: "hidden",
              "& > div": {
                width: "100% !important",
                height: "100% !important",
                maxWidth: "100%",
                overflow: "hidden",
              },
              "& canvas": {
                width: "100% !important",
                height: "100% !important",
                maxWidth: "100%",
              },
            }}
          >
            <StaticWaveform
              waveformData={activeWaveformData}
              width={AUDIO_WAVEFORM_PLAYER_DEFAULTS.width}
              height={AUDIO_WAVEFORM_PLAYER_DEFAULTS.height}
              showLoading={false}
            />
          </Box>
        )}

        {!isVideo && !isPlaying && !activeWaveformData && (
          <Box
            aria-hidden={true}
            sx={{
              position: "absolute",
              left: 12,
              right: 12,
              top: "50%",
              height: 2,
              bgcolor: "primary.main",
              transform: "translateY(-50%)",
            }}
          />
        )}

        {(onHelp || onClose) && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 3,
              display: "flex",
              color: controlColor,
              textShadow: "0 1px 4px rgba(0, 0, 0, 0.7)",
            }}
          >
            {onHelp && (
              <Tooltip title={tCommon("common.help")}>
                <IconButton
                  aria-label={tCommon("common.help")}
                  onClick={onHelp}
                  size="small"
                  sx={{ color: "inherit", opacity: 0.72 }}
                >
                  <Typography component="span" fontWeight={700}>
                    ?
                  </Typography>
                </IconButton>
              </Tooltip>
            )}
            {onClose && (
              <Tooltip title={tCommon("actions.close")}>
                <IconButton
                  aria-label={tCommon("actions.close")}
                  onClick={onClose}
                  size="small"
                  sx={{ color: "inherit", opacity: 0.72 }}
                >
                  <Typography
                    component="span"
                    fontSize="1.35rem"
                    lineHeight={1}
                  >
                    ×
                  </Typography>
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            left: 12,
            bottom: 10,
            zIndex: 3,
            color: controlColor,
            opacity: 0.58,
            textShadow: "0 1px 4px rgba(0, 0, 0, 0.7)",
            pointerEvents: "none",
          }}
        >
          {watermark}
        </Typography>
      </Box>

      <MediaPromptBand
        description={activeTrack?.type}
        elapsedTime={formatTimecode(
          recordingTakes.recording
            ? recordingTakes.recordingDuration
            : displayCurrentTime,
        )}
        remainingTime={`-${formatTimecode(
          recordingTakes.recording
            ? 0
            : Math.max(0, duration - displayCurrentTime),
        )}`}
        isVideo={isVideo}
        title={
          recordingTakes.recording
            ? t("recordingStudio3.record")
            : activeTrack?.title || t("mediaPlayerComponent.titleHeader")
        }
      >
        <Box>
          <Box sx={{ position: "relative", height: 12 }}>
            <Box
              aria-hidden={true}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                bgcolor: "background.paper",
                pointerEvents: "none",
              }}
            />
            <Box
              aria-hidden={true}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                height: 4,
                width: duration ? `${(bufferedTime / duration) * 100}%` : 0,
                bgcolor: "primary.main",
                opacity: 0.18,
                pointerEvents: "none",
              }}
            />
            <Slider
              aria-label={t("recordingStudio3.timeline")}
              min={0}
              max={duration || 0}
              step={0.001}
              value={Math.min(displayCurrentTime, duration || 0)}
              disabled={!duration}
              onPointerDown={() => {
                isScrubbingRef.current = true;
                scrubTimeRef.current = displayCurrentTime;
              }}
              onPointerCancel={() => {
                isScrubbingRef.current = false;
              }}
              onChange={(_, value) => {
                const nextTime = Array.isArray(value) ? value[0] : value;
                seekTo(nextTime);
              }}
              onChangeCommitted={(_, value) => {
                const nextTime = Array.isArray(value) ? value[0] : value;
                seekTo(nextTime);
                isScrubbingRef.current = false;
              }}
              sx={{
                position: "absolute",
                top: -12,
                left: 0,
                right: 0,
                zIndex: 1,
                height: 24,
                p: 0,
                borderRadius: 0,
                "& .MuiSlider-rail": { opacity: 0 },
                "& .MuiSlider-thumb": { display: "none" },
                "& .MuiSlider-track": {
                  bgcolor: "primary.main",
                  height: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                  transition: "none",
                },
              }}
            />
          </Box>
        </Box>
      </MediaPromptBand>

      <Box
        data-control-profile={controlProfile}
        sx={{
          display: "grid",
          gridTemplateAreas: '"left center right"',
          gridTemplateColumns: "auto minmax(0, 1fr) auto",
          alignItems: "center",
          gap: 0.25,
          minHeight: 40,
          p: 0.25,
          position: "relative",
          color: "text.primary",
        }}
      >
        <Box
          role="group"
          aria-label={labels.playlist}
          sx={{ gridArea: "left", justifySelf: "start" }}
        >
          <ControlButton
            label={labels.playlist}
            controls={playlistId}
            expanded={playlistOpen}
            onClick={() => setPlaylistOpen((open) => !open)}
          >
            <PlaylistPlayIcon />
          </ControlButton>
        </Box>

        <Box
          role="group"
          aria-label={labels.playbackControls}
          sx={{
            gridArea: "center",
            justifySelf: "center",
            display: "flex",
            alignItems: "center",
            minWidth: 0,
          }}
        >
          <ControlButton
            label={tCommon("actions.back")}
            disabled={activeList !== "media" || currentIndex === 0}
            onClick={() => selectTrack(currentIndex - 1)}
          >
            <SkipPreviousIcon />
          </ControlButton>
          {hasAudioRecording && (
            <ControlButton
              label={t("recordingStudio3.record")}
              disabled={recordingTakes.recording}
              onClick={() => {
                playerRef.current?.pause();
                setActiveList("takes");
                void recordingTakes.startRecording();
              }}
            >
              <FiberManualRecordIcon />
            </ControlButton>
          )}
          <ControlButton
            label={t("recordingStudio3.stop")}
            disabled={!recordingTakes.recording && (!activeTrack || isStopped)}
            pressed={!recordingTakes.recording && isStopped}
            onClick={() => {
              if (recordingTakes.recording) {
                recordingTakes.stopRecording();
                return;
              }
              playerRef.current?.pause();
              seekTo(0);
            }}
          >
            <StopIcon />
          </ControlButton>
          <ControlButton
            label={labels.pause}
            disabled={recordingTakes.recording || !activeTrack || isStopped}
            pressed={isPaused}
            onClick={() => {
              if (isPaused) {
                playCurrent();
                return;
              }
              playerRef.current?.pause();
            }}
          >
            <PauseIcon />
          </ControlButton>
          <ControlButton
            label={t("recordingStudio3.play")}
            disabled={!activeTrack || isPlaying || recordingTakes.recording}
            pressed={isPlaying}
            onClick={() => playCurrent()}
          >
            <PlayArrowIcon />
          </ControlButton>
          <ControlButton
            label={tCommon("actions.next")}
            disabled={
              activeList !== "media" || currentIndex >= tracks.length - 1
            }
            onClick={() => selectTrack(currentIndex + 1)}
          >
            <SkipNextIcon />
          </ControlButton>
        </Box>

        <Box
          role="group"
          aria-label={labels.volumeControls}
          sx={{
            gridArea: "right",
            justifySelf: { xs: "center", sm: "end" },
            display: "flex",
            alignItems: "center",
            minWidth: 0,
          }}
        >
          <Box ref={outputVolumeButtonRef}>
            <ControlButton
              label={muted ? labels.unmute : labels.mute}
              disabled={!activeTrack}
              pressed={muted}
              onClick={() => {
                const nextMuted = !muted;
                playerRef.current?.muted(nextMuted);
                setMuted(nextMuted);
                setVolumeControl("output");
              }}
            >
              {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </ControlButton>
          </Box>

          {hasAudioRecording && (
            <Box ref={inputVolumeButtonRef}>
              <ControlButton
                label={labels.inputVolume}
                onClick={() => setVolumeControl("input")}
              >
                <MicIcon />
              </ControlButton>
            </Box>
          )}

          <Popover
            open={volumeControl !== null}
            anchorEl={
              volumeControl === "input"
                ? inputVolumeButtonRef.current
                : outputVolumeButtonRef.current
            }
            onClose={() => setVolumeControl(null)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            transformOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Box sx={{ display: "grid", gap: 1, p: 1.5, minWidth: 160 }}>
              <Typography variant="caption" fontWeight={700}>
                {volumeControl === "input" ? labels.input : labels.output}
              </Typography>
              <LevelControlSlider
                label={
                  volumeControl === "input"
                    ? labels.inputVolume
                    : labels.outputVolume
                }
                value={
                  volumeControl === "input"
                    ? recordingTakes.inputVolume
                    : muted
                      ? 0
                      : volume
                }
                visualLevel={
                  volumeControl === "input"
                    ? recordingTakes.inputLevel
                    : muted
                      ? 0
                      : meterLevel
                }
                min={0}
                max={1}
                step={0.01}
                orientation="horizontal"
                onChange={(nextVolume) => {
                  if (volumeControl === "input") {
                    recordingTakes.setInputVolume(nextVolume);
                    return;
                  }
                  const safeVolume = Math.min(1, Math.max(0, nextVolume));
                  playerRef.current?.volume(safeVolume);
                  playerRef.current?.muted(false);
                  setVolume(safeVolume);
                  setMuted(false);
                }}
              />
            </Box>
          </Popover>
        </Box>
      </Box>

      <Collapse
        id={playlistId}
        in={playlistOpen && (tracks.length > 0 || hasAudioRecording)}
        sx={{ borderTop: "1px solid", borderColor: "divider" }}
      >
        {hasAudioRecording && (
          <Tabs
            aria-label="Media and recorded takes"
            value={activeList}
            onChange={(_, value) => setActiveList(value)}
            variant="fullWidth"
            sx={{
              minHeight: 28,
              "& .MuiTab-root": {
                minHeight: 28,
                px: 1,
                py: 0,
                fontSize: "0.6875rem",
                lineHeight: 1,
              },
            }}
          >
            <Tab label={labels.playlist} value="media" />
            <Tab
              label={`${t("recordingStudio3.takes")} (${recordingTakes.takes.length})`}
              value="takes"
            />
          </Tabs>
        )}

        <Box sx={{ minHeight: 112, maxHeight: 160, overflowY: "auto" }}>
          {(!hasAudioRecording || activeList === "media") && (
            <List dense disablePadding>
              {tracks.map((track, index) => (
                <ListItemButton
                  key={track.id || track.src}
                  selected={index === currentIndex}
                  sx={{ minHeight: 44, gap: 1, py: 0.5 }}
                  onClick={() => {
                    setActiveList("media");
                    selectTrack(index);
                  }}
                >
                  <Box
                    aria-hidden={true}
                    sx={{
                      flex: "0 0 32px",
                      width: 32,
                      height: 32,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "action.hover",
                      color: "text.secondary",
                    }}
                  >
                    {isVideoTrack(track) ? (
                      <MovieIcon fontSize="small" />
                    ) : (
                      <AudiotrackIcon fontSize="small" />
                    )}
                  </Box>
                  <ListItemText
                    primary={track.title}
                    secondary={(() => {
                      const details = [];
                      const trackDuration =
                        trackDurations[track.id || track.src];
                      if (trackDuration)
                        details.push(formatTimecode(trackDuration));
                      if (track.size) {
                        details.push(
                          `${(track.size / 1_000_000).toFixed(2)} MB`,
                        );
                      }
                      return details.length ? details.join(" • ") : undefined;
                    })()}
                  />
                </ListItemButton>
              ))}
            </List>
          )}

          {hasAudioRecording && activeList === "takes" && (
            <AudioTakePlaylist
              takes={recordingTakes.takes}
              selectedTakeId={recordingTakes.selectedTakeId}
              playbackTakeId={takePlaybackId}
              playbackProgress={takePlaybackProgress}
              recording={recordingTakes.recording}
              recordingCanvasRef={recordingTakes.canvasRef}
              onSelect={playTake}
            />
          )}
        </Box>
      </Collapse>

      <audio
        ref={takePlayerRef}
        src={selectedTakeUrl || undefined}
        onTimeUpdate={(event) => {
          const takePlayer = event.currentTarget;
          setTakePlaybackProgress(
            takePlayer.duration > 0
              ? takePlayer.currentTime / takePlayer.duration
              : 0,
          );
        }}
        onEnded={() => setTakePlaybackProgress(1)}
        hidden
      />

      {hasAudioRecording && recordingTakes.takes.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            minHeight: 56,
            px: 1.5,
            py: 1,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "action.hover",
          }}
        >
          <Button
            disabled={submissionCountdown === null}
            onClick={cancelTakeSubmission}
            endIcon={
              submissionCountdown !== null ? (
                <Box
                  sx={{
                    position: "relative",
                    display: "grid",
                    placeItems: "center",
                    width: 24,
                    height: 24,
                  }}
                >
                  <CircularProgress
                    size={24}
                    value={(submissionCountdown / 10) * 100}
                    variant="determinate"
                  />
                  <Typography
                    component="span"
                    sx={{ position: "absolute", fontSize: "0.625rem" }}
                  >
                    {submissionCountdown}
                  </Typography>
                </Box>
              ) : undefined
            }
          >
            {t("autoSubmit.cancelSubmission")}
          </Button>
          <Button
            variant="contained"
            disabled={!recordingTakes.selectedTake || recordingTakes.recording}
            onClick={requestTakeSubmission}
          >
            {t("questionBlock.submit")}
          </Button>
        </Box>
      )}
    </Box>
  );
}
