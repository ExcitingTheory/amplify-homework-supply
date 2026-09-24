import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Box,
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
import MicIcon from "@mui/icons-material/Mic";
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
import FrequencyRingVisualizer from "./FrequencyRingVisualizer";

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
          sx={{ color: "inherit" }}
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
  const [hoverTime, setHoverTime] = React.useState(null);
  const [duration, setDuration] = React.useState(0);
  const [trackDurations, setTrackDurations] = React.useState({});
  const [volume, setVolume] = React.useState(1);
  const [muted, setMuted] = React.useState(false);
  const [meterLevel, setMeterLevel] = React.useState(0);
  const [playlistOpen, setPlaylistOpen] = React.useState(true);
  const playlistId = React.useId();
  const videoRef = React.useRef(null);
  const playerRef = React.useRef(null);
  const nowPlayingRef = React.useRef(null);
  const pendingAutoplayRef = React.useRef(false);
  const targetTimeRef = React.useRef(0);
  const scrubTimeRef = React.useRef(0);
  const isScrubbingRef = React.useRef(false);
  const timelineRef = React.useRef(null);

  const { unit, files, questionBank } = React.useContext(UnitContext);

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
    if (!videoRef.current || playerRef.current || tracks.length === 0) {
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
  }, [tracks.length]);

  const currentTrack = tracks[currentIndex] || null;
  nowPlayingRef.current = currentTrack;

  React.useEffect(() => {
    if (!player || !currentTrack || player.isDisposed()) return undefined;

    const playWhenReady = () => {
      if (!pendingAutoplayRef.current) return;
      pendingAutoplayRef.current = false;
      playCurrent(player);
    };

    setCurrentTime(0);
    setDuration(0);
    player.src({ src: currentTrack.src, type: currentTrack.type });
    player.load();
    player.one("canplay", playWhenReady);

    return () => player.off("canplay", playWhenReady);
  }, [currentTrack, playCurrent, player]);

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
      if (Number.isFinite(nextDuration) && currentTrack) {
        setTrackDurations((current) => ({
          ...current,
          [currentTrack.id || currentTrack.src]: nextDuration,
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
      if (currentIndex < tracks.length - 1) {
        selectTrack(currentIndex + 1, true);
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
    currentTrack,
    player,
    selectTrack,
    tracks.length,
    unit?.id,
  ]);

  const isVideo = currentTrack?.type.startsWith("video");
  const hasAudioRecording = recordingMode === "audio";
  const updateTimelineHover = React.useCallback(
    (event) => {
      if (!timelineRef.current || !duration) return;
      const bounds = timelineRef.current.getBoundingClientRect();
      const percent = Math.max(
        0,
        Math.min(1, (event.clientX - bounds.left) / bounds.width),
      );
      setHoverTime(percent * duration);
    },
    [duration],
  );
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
  const controlColor = "rgba(255, 255, 255, 0.92)";
  const watermark = tCommon("app.name");
  const labels = {
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
          audioUrl={hasAudioRecording ? undefined : currentTrack?.src}
          title={currentTrack?.title}
          enableRecording={hasAudioRecording}
          gradeId={gradeId}
          nodeKey={nodeKey}
          metadata={recordingMetadata}
          onRecordingComplete={onRecordingComplete}
          compact
          acceptDroppedAudio={hasAudioRecording}
        />
      </Box>
    );
  }

  return (
    <Box
      className={className}
      sx={{
        width: "min(100%, 72rem)",
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
          aspectRatio: "16 / 9",
          minHeight: 220,
          maxHeight: "68vh",
          bgcolor: "background.paper",
          overflow: "hidden",
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

        <FrequencyRingVisualizer
          player={player}
          visible={!isVideo}
          onLevelChange={setMeterLevel}
        />

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

      <Box
        ref={timelineRef}
        onPointerMove={updateTimelineHover}
        onPointerLeave={() => setHoverTime(null)}
        sx={{
          position: "relative",
          height: 28,
        }}
      >
        <Box
          aria-hidden={true}
          sx={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 4,
            transform: "translateY(-50%)",
            bgcolor: "rgba(146, 136, 170, 0.24)",
            pointerEvents: "none",
          }}
        />
        <Box
          aria-hidden={true}
          sx={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 4,
            transform: "translateY(-50%)",
            width: duration ? `${(bufferedTime / duration) * 100}%` : 0,
            bgcolor: "rgba(255, 255, 255, 0.42)",
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
            top: 0,
            left: 0,
            right: 0,
            height: 28,
            zIndex: 1,
            display: "block",
            width: "100%",
            p: 0,
            borderRadius: 0,
            "& .MuiSlider-rail": {
              opacity: 1,
              bgcolor: "transparent",
              height: 4,
              top: "50%",
              transform: "translateY(-50%)",
            },
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
        <Box
          aria-hidden={true}
          sx={{
            position: "absolute",
            top: "50%",
            left: duration
              ? `${
                  (Math.min(hoverTime ?? displayCurrentTime, duration) /
                    duration) *
                  100
                }%`
              : "0%",
            width: 12,
            height: 12,
            zIndex: 2,
            borderRadius: "50%",
            bgcolor: "primary.main",
            border: "2px solid",
            borderColor: "background.paper",
            boxSizing: "border-box",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      </Box>

      <Box
        data-control-profile={controlProfile}
        sx={{
          display: "grid",
          gridTemplateAreas: {
            xs: '"left center" "right right"',
            sm: '"left center right"',
          },
          gridTemplateColumns: {
            xs: "auto 1fr",
            sm: "minmax(40px, 1fr) auto minmax(40px, 1fr)",
          },
          alignItems: "center",
          gap: 1,
          minHeight: 64,
          p: { xs: 0.5, sm: 1 },
          pt: { xs: 2.5, sm: 1 },
          position: "relative",
          color: "text.primary",
        }}
      >
        <Box
          aria-label="Media timecodes"
          sx={{
            position: "absolute",
            top: 4,
            left: 8,
            right: 8,
            display: "flex",
            justifyContent: "space-between",
            px: 1,
            color: "text.secondary",
            fontSize: "0.72rem",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          <span>{formatTimecode(displayCurrentTime)}</span>
          <span>
            -{formatTimecode(Math.max(0, duration - displayCurrentTime))}
          </span>
        </Box>

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
            justifySelf: { xs: "end", sm: "center" },
            display: "flex",
            alignItems: "center",
          }}
        >
          <ControlButton
            label={tCommon("actions.back")}
            disabled={currentIndex === 0}
            onClick={() => selectTrack(currentIndex - 1)}
          >
            <SkipPreviousIcon />
          </ControlButton>
          <ControlButton
            label={t("recordingStudio3.stop")}
            disabled={!currentTrack}
            onClick={() => {
              playerRef.current?.pause();
              playerRef.current?.currentTime(0);
              setCurrentTime(0);
            }}
          >
            <StopIcon />
          </ControlButton>
          <ControlButton
            label={labels.pause}
            disabled={!isPlaying}
            onClick={() => playerRef.current?.pause()}
          >
            <PauseIcon />
          </ControlButton>
          <ControlButton
            label={t("recordingStudio3.play")}
            disabled={!currentTrack || isPlaying}
            onClick={() => playCurrent()}
          >
            <PlayArrowIcon />
          </ControlButton>
          <ControlButton
            label={tCommon("actions.next")}
            disabled={currentIndex >= tracks.length - 1}
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
          <Box
            role="group"
            aria-label={labels.outputVolume}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              px: 0.25,
              py: 0.25,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 700,
                letterSpacing: 0.2,
                textTransform: "uppercase",
              }}
            >
              {labels.output}
            </Typography>
            <LevelControlSlider
              label={labels.outputVolume}
              value={muted ? 0 : volume}
              visualLevel={muted ? 0 : meterLevel}
              min={0}
              max={1}
              step={0.01}
              disabled={!currentTrack}
              orientation="vertical"
              onChange={(nextVolume) => {
                const safeVolume = Math.min(1, Math.max(0, nextVolume));
                playerRef.current?.volume(safeVolume);
                setVolume(safeVolume);
                if (safeVolume > 0) {
                  playerRef.current?.muted(false);
                  setMuted(false);
                }
              }}
            />
            <ControlButton
              label={muted ? labels.unmute : labels.mute}
              disabled={!currentTrack}
              pressed={muted}
              onClick={() => {
                const nextMuted = !muted;
                playerRef.current?.muted(nextMuted);
                setMuted(nextMuted);
              }}
            >
              {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </ControlButton>
          </Box>
        </Box>
      </Box>

      {hasAudioRecording && (
        <Box
          role="group"
          aria-label={labels.recordingControls}
          sx={{
            px: 1,
            py: 0.75,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <AudioWaveformPlayer
            enableRecording
            gradeId={gradeId}
            nodeKey={nodeKey}
            metadata={recordingMetadata}
            onRecordingComplete={onRecordingComplete}
            compact
            acceptDroppedAudio
          />
        </Box>
      )}

      <Collapse id={playlistId} in={playlistOpen && tracks.length > 0}>
        <List
          disablePadding
          sx={{ borderTop: "1px solid", borderColor: "divider" }}
        >
          {tracks.map((track, index) => (
            <ListItemButton
              key={track.id || track.src}
              selected={index === currentIndex}
              onClick={() => selectTrack(index)}
            >
              <ListItemText
                primary={track.title}
                secondary={(() => {
                  const details = [];
                  const trackDuration = trackDurations[track.id || track.src];
                  if (trackDuration)
                    details.push(formatTimecode(trackDuration));
                  if (track.size) {
                    details.push(`${(track.size / 1_000_000).toFixed(2)} MB`);
                  }
                  return details.length ? details.join(" • ") : undefined;
                })()}
              />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </Box>
  );
}
