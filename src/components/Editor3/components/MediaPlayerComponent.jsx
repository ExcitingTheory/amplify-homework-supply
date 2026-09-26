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
  Slider,
  Tooltip,
  Typography,
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
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

function formatFileSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return null;
  if (value < 1_000) return `${value} B`;
  if (value < 1_000_000) return `${(value / 1_000).toFixed(1)} KB`;
  return `${(value / 1_000_000).toFixed(2)} MB`;
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
  compact = false,
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
          width: compact ? 7 : isVertical ? 20 : 116,
          height: compact ? 28 : isVertical ? 116 : 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: compact ? 0 : "0 auto",
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
            border: compact ? "none" : "1px solid rgba(146, 136, 170, 0.5)",
            overflow: "hidden",
            boxShadow: compact ? "none" : "inset 0 1px 3px rgba(0,0,0,0.08)",
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
  showTakeSubmissionControls = true,
  onHelp,
  onClose,
  playlistAdjacentControls,
  playlistOpen: controlledPlaylistOpen,
  onPlaylistOpenChange,
  promptDescription: promptDescriptionOverride,
  promptThumbnail,
  promptTitle: promptTitleOverride,
  externalPlaybackActive = false,
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
  const [liveSignalReady, setLiveSignalReady] = React.useState(false);
  const [internalPlaylistOpen, setInternalPlaylistOpen] = React.useState(true);
  const playlistOpen = controlledPlaylistOpen ?? internalPlaylistOpen;
  const setPlaylistOpen = React.useCallback(
    (nextValue) => {
      const nextOpen =
        typeof nextValue === "function" ? nextValue(playlistOpen) : nextValue;
      if (controlledPlaylistOpen === undefined) {
        setInternalPlaylistOpen(nextOpen);
      }
      onPlaylistOpenChange?.(nextOpen);
    },
    [controlledPlaylistOpen, onPlaylistOpenChange, playlistOpen],
  );
  const [activeList, setActiveList] = React.useState("media");
  const [activeWaveformData, setActiveWaveformData] = React.useState(null);
  const [selectedTakeUrl, setSelectedTakeUrl] = React.useState(null);
  const [takePlaybackId, setTakePlaybackId] = React.useState(null);
  const [takePlaybackProgress, setTakePlaybackProgress] = React.useState(0);
  const [isTakePlaying, setIsTakePlaying] = React.useState(false);
  const [takeMediaElement, setTakeMediaElement] = React.useState(null);
  const [submissionCountdown, setSubmissionCountdown] = React.useState(null);
  const submissionTimerRef = React.useRef(null);
  const hasAudioRecording = recordingMode === "audio";
  const takeScopeKey = React.useMemo(
    () => createTemporaryAudioTakeScope(gradeId, nodeKey),
    [gradeId, nodeKey],
  );
  const recordingTakes = useAudioRecordingTakes({ scopeKey: takeScopeKey });
  const inputMuted = recordingTakes.inputVolume <= 0;
  const playlistId = React.useId();
  const videoRef = React.useRef(null);
  const playerRef = React.useRef(null);
  const nowPlayingRef = React.useRef(null);
  const pendingAutoplayRef = React.useRef(false);
  const targetTimeRef = React.useRef(0);
  const scrubTimeRef = React.useRef(0);
  const isScrubbingRef = React.useRef(false);
  const previousInputVolumeRef = React.useRef(1);
  const takePlayerRef = React.useRef(null);
  const pendingTakePlaybackRef = React.useRef(null);
  const setTakePlayerElement = React.useCallback((element) => {
    if (takePlayerRef.current === element) return;
    takePlayerRef.current = element;
    setTakeMediaElement((currentElement) =>
      currentElement === element ? currentElement : element,
    );
  }, []);

  const { unit, files, questionBank } = React.useContext(UnitContext);

  const handleOutputLevel = React.useCallback(
    (level) => {
      setMeterLevel(level);
      if (activeList === "media" && level > 0.001) {
        setLiveSignalReady(true);
      }
    },
    [activeList],
  );

  React.useEffect(() => {
    if (!isPlaying || activeList !== "media") setLiveSignalReady(false);
  }, [activeList, isPlaying]);

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
      setActiveList("takes");
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

  const deleteTake = React.useCallback(
    async (takeId) => {
      if (takePlaybackId === takeId) {
        takePlayerRef.current?.pause();
        pendingTakePlaybackRef.current = null;
        setTakePlaybackId(null);
        setTakePlaybackProgress(0);
      }
      await recordingTakes.deleteTake(takeId);
    },
    [recordingTakes, takePlaybackId],
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
    takePlayerRef.current.muted = false;
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
  const isVideo = Boolean(isVideoTrack(currentTrack || activeTrack));

  React.useEffect(() => {
    if (externalPlaybackActive) playerRef.current?.pause();
  }, [externalPlaybackActive]);
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
      if (isVideo) {
        setMuted(player.muted());
      } else if (player.muted()) {
        player.muted(false);
      }
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
    isVideo,
    player,
    selectTrack,
    tracks.length,
    unit?.id,
  ]);

  const isStopped = !isPlaying && currentTime <= 0.01;
  const isPaused = !isPlaying && !isStopped;
  const isTakeTransport = activeList === "takes" && Boolean(takePlaybackId);
  const isTakeStopped = takePlaybackProgress <= 0 || takePlaybackProgress >= 1;
  const isTakePaused = isTakeTransport && !isTakePlaying && !isTakeStopped;
  const transportIsPlaying = isTakeTransport ? isTakePlaying : isPlaying;
  const transportIsStopped = isTakeTransport ? isTakeStopped : isStopped;
  const transportIsPaused = isTakeTransport ? isTakePaused : isPaused;
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
  const promptTake =
    hasAudioRecording && activeList === "takes"
      ? recordingTakes.selectedTake
      : null;
  const promptDuration = recordingTakes.recording
    ? recordingTakes.recordingDuration
    : promptTake?.duration ||
      trackDurations[activeTrack?.id || activeTrack?.src] ||
      duration;
  const defaultPromptDescription = [
    recordingTakes.recording
      ? "audio/webm"
      : promptTake?.mimeType || activeTrack?.type,
    formatTimecode(promptDuration),
    formatFileSize(
      recordingTakes.recording
        ? undefined
        : (promptTake?.blob.size ?? activeTrack?.size),
    ),
  ]
    .filter(Boolean)
    .join(" • ");
  const defaultPromptTitle = recordingTakes.recording
    ? t("recordingStudio3.record")
    : promptTake
      ? `Take ${
          recordingTakes.takes.findIndex((take) => take.id === promptTake.id) +
          1
        }`
      : activeTrack?.title || t("mediaPlayerComponent.titleHeader");
  const promptDescription =
    promptDescriptionOverride ?? defaultPromptDescription;
  const promptTitle = promptTitleOverride ?? defaultPromptTitle;

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
    inputMute: "Mute input",
    inputUnmute: "Unmute input",
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

  if (variant === "compact" && !isVideo) {
    return (
      <Box className={className} sx={{ width: "min(100%, 48rem)" }}>
        <AudioWaveformPlayer
          audioUrl={currentTrack?.src}
          title={currentTrack?.title}
          compact
          enableRecording={hasAudioRecording}
          gradeId={gradeId}
          nodeKey={nodeKey}
          metadata={recordingMetadata}
          onRecordingComplete={onRecordingComplete}
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

        {!isVideo && (
          <Box
            aria-hidden={true}
            sx={{
              position: "absolute",
              left: 12,
              right: 12,
              top: "50%",
              zIndex: 0,
              height: "0.5px",
              bgcolor: "primary.main",
              opacity: 0.55,
              transform: "translateY(-50%)",
              transition: "opacity 120ms ease",
            }}
          />
        )}

        {!isVideo && (
          <Box
            sx={{
              position: "absolute",
              inset: "4px 0",
              zIndex: 2,
              overflow: "hidden",
              opacity: activeList === "media" && isPlaying ? 1 : 0,
              transform:
                activeList === "media" && isPlaying ? "scaleY(1)" : "scaleY(0)",
              transformOrigin: "center",
              transition:
                "opacity 240ms cubic-bezier(0.77, 0, 0.175, 1), transform 240ms cubic-bezier(0.77, 0, 0.175, 1)",
              willChange: "opacity, transform",
              pointerEvents: "none",
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
              },
            }}
          >
            <PlaybackWaveformVisualizer
              muted={muted}
              player={player}
              visible={true}
              onLevelChange={handleOutputLevel}
            />
          </Box>
        )}

        {!isVideo && activeWaveformData && (
          <Box
            sx={{
              position: "absolute",
              inset: "4px 0",
              zIndex: 1,
              overflow: "hidden",
              opacity:
                activeList === "takes" ||
                !isPlaying ||
                (!muted && !liveSignalReady)
                  ? 1
                  : 0,
              transform:
                activeList === "takes" ||
                !isPlaying ||
                (!muted && !liveSignalReady)
                  ? "scaleY(1)"
                  : "scaleY(0)",
              transformOrigin: "center",
              transition:
                "opacity 240ms cubic-bezier(0.77, 0, 0.175, 1), transform 240ms cubic-bezier(0.77, 0, 0.175, 1)",
              willChange: "opacity, transform",
              pointerEvents: "none",
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
              },
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
                border: "none !important",
                outline: "none",
              },
            }}
          >
            <StaticWaveform
              waveformData={activeWaveformData}
              width={AUDIO_WAVEFORM_PLAYER_DEFAULTS.width}
              height={AUDIO_WAVEFORM_PLAYER_DEFAULTS.height}
              showLoading={false}
              transparentBackground
            />
          </Box>
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
        description={promptDescription}
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
        isVideo={!promptTake && isVideo}
        thumbnail={promptThumbnail}
        title={promptTitle}
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
                playCurrent();
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
          px: { xs: 0.5, sm: 0.75 },
          py: 0.25,
          position: "relative",
          color: "text.primary",
        }}
      >
        <Box
          role="group"
          aria-label={labels.playlist}
          sx={{
            gridArea: "left",
            justifySelf: "start",
            display: "flex",
            alignItems: "center",
            gap: 0.25,
          }}
        >
          <ControlButton
            label={labels.playlist}
            controls={playlistId}
            expanded={playlistOpen}
            onClick={() => setPlaylistOpen((open) => !open)}
          >
            <PlaylistPlayIcon />
          </ControlButton>
          {playlistAdjacentControls}
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
            disabled={
              !recordingTakes.recording && (!activeTrack || transportIsStopped)
            }
            pressed={!recordingTakes.recording && transportIsStopped}
            onClick={() => {
              if (recordingTakes.recording) {
                recordingTakes.stopRecording();
                return;
              }
              if (isTakeTransport && takePlayerRef.current) {
                takePlayerRef.current.pause();
                takePlayerRef.current.currentTime = 0;
                setTakePlaybackProgress(0);
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
            disabled={
              recordingTakes.recording || !activeTrack || transportIsStopped
            }
            pressed={transportIsPaused}
            onClick={() => {
              if (isTakeTransport && takePlayerRef.current) {
                if (isTakePlaying) {
                  takePlayerRef.current.pause();
                  requestTakeSubmission();
                } else {
                  void takePlayerRef.current.play();
                }
                return;
              }
              if (transportIsPaused) {
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
            disabled={
              !activeTrack || transportIsPlaying || recordingTakes.recording
            }
            pressed={transportIsPlaying}
            onClick={() => {
              if (isTakeTransport && takePlayerRef.current) {
                void takePlayerRef.current.play();
                return;
              }
              playCurrent();
            }}
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
          <Box>
            <ControlButton
              label={muted ? labels.unmute : labels.mute}
              pressed={muted}
              onClick={() => {
                const nextMuted = !muted;
                playerRef.current?.muted(isVideo ? nextMuted : false);
                setMuted(nextMuted);
              }}
            >
              {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </ControlButton>
          </Box>
          <LevelControlSlider
            compact
            label={labels.outputVolume}
            value={muted ? 0 : volume}
            visualLevel={muted ? 0 : meterLevel}
            min={0}
            max={1}
            step={0.01}
            orientation="vertical"
            onChange={(nextVolume) => {
              const safeVolume = Math.min(1, Math.max(0, nextVolume));
              playerRef.current?.volume(safeVolume);
              playerRef.current?.muted(false);
              setVolume(safeVolume);
              setMuted(false);
            }}
          />

          {hasAudioRecording && (
            <>
              <ControlButton
                label={inputMuted ? labels.inputUnmute : labels.inputMute}
                pressed={inputMuted}
                onClick={() => {
                  if (inputMuted) {
                    recordingTakes.setInputVolume(
                      previousInputVolumeRef.current,
                    );
                  } else {
                    previousInputVolumeRef.current =
                      recordingTakes.inputVolume || 1;
                    recordingTakes.setInputVolume(0);
                  }
                }}
              >
                {inputMuted ? <MicOffIcon /> : <MicIcon />}
              </ControlButton>
              <LevelControlSlider
                compact
                label={labels.inputVolume}
                value={recordingTakes.inputVolume}
                visualLevel={recordingTakes.inputLevel}
                min={0}
                max={1}
                step={0.01}
                orientation="vertical"
                onChange={(nextVolume) => {
                  if (nextVolume > 0) {
                    previousInputVolumeRef.current = nextVolume;
                  }
                  recordingTakes.setInputVolume(nextVolume);
                }}
              />
            </>
          )}
        </Box>
      </Box>

      <Collapse
        id={playlistId}
        in={playlistOpen && (tracks.length > 0 || hasAudioRecording)}
        sx={{ borderTop: "1px solid", borderColor: "divider" }}
      >
        <Box sx={{ minHeight: 112, maxHeight: 160, overflowY: "auto" }}>
          {tracks.length > 0 && (
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

          {hasAudioRecording && (
            <AudioTakePlaylist
              backgroundVisualizer={
                takeMediaElement ? (
                  <PlaybackWaveformVisualizer
                    mediaElement={takeMediaElement}
                    muted={muted}
                    onLevelChange={handleOutputLevel}
                  />
                ) : undefined
              }
              takes={recordingTakes.takes}
              selectedTakeId={recordingTakes.selectedTakeId}
              playbackTakeId={takePlaybackId}
              playbackProgress={takePlaybackProgress}
              playbackActive={isTakePlaying}
              recording={recordingTakes.recording}
              recordingCanvasRef={recordingTakes.canvasRef}
              onDelete={(takeId) => void deleteTake(takeId)}
              onSelect={playTake}
            />
          )}
        </Box>
      </Collapse>

      <audio
        ref={setTakePlayerElement}
        src={selectedTakeUrl || undefined}
        onTimeUpdate={(event) => {
          const takePlayer = event.currentTarget;
          setTakePlaybackProgress(
            takePlayer.duration > 0
              ? takePlayer.currentTime / takePlayer.duration
              : 0,
          );
        }}
        onPlay={() => setIsTakePlaying(true)}
        onPause={() => setIsTakePlaying(false)}
        onEnded={() => {
          setIsTakePlaying(false);
          setTakePlaybackProgress(1);
        }}
        hidden
      />

      {showTakeSubmissionControls &&
        hasAudioRecording &&
        recordingTakes.takes.length > 0 && (
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
              disabled={
                !recordingTakes.selectedTake || recordingTakes.recording
              }
              onClick={requestTakeSubmission}
            >
              {t("questionBlock.submit")}
            </Button>
          </Box>
        )}
    </Box>
  );
}
