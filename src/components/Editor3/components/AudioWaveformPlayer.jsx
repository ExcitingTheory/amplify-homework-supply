import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import { useTranslations } from "next-intl";
import { Box, IconButton, Typography, Slider } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import StopIcon from "@mui/icons-material/Stop";
import RecordIcon from "@mui/icons-material/KeyboardVoice";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import StaticWaveform from "./StaticWaveform";
import MicLevelIndicator from "./MicLevelIndicator";
import { useAudioPlayer } from "../context/AudioPlayerContext";
import { calculateWaveformData } from "../../../utils/calculateWaveformData";
import { uploadStudentSubmission } from "../../../utils/userSubmissionStorage";
import { applyAudioFilters } from "../../../utils/applyAudioFilters";
import { audioBufferToBlob } from "../../../utils/audioBufferToBlob";
import { useColorScheme } from "@mui/material/styles";
import { hexToRgb } from "../../../utils/hexToRgb";
import FilesContext from "../../../context/fileContext";
import { getCleanupFilters } from "../../RecordingStudio3/RecordingSettings";
import {
  createAudioLevelMonitor,
  rmsToPercent,
} from "../../../utils/audioLevelMonitor";
import ExerciseResponsePanel from "./ExerciseResponsePanel";
import AudioPromptPanel from "./AudioPromptPanel";
import AudioTakePlaylist from "./AudioTakePlaylist";
import {
  clearTemporaryAudioTakes,
  createTemporaryAudioTakeScope,
  deleteTemporaryAudioTake,
  getTemporaryAudioTakes,
  saveTemporaryAudioTake,
} from "../../../utils/temporaryAudioTakeStore";
import {
  AUDIO_WAVEFORM_PLAYER_DEFAULTS,
  WAVEFORM_COLOR_FALLBACKS,
  WAVEFORM_CSS_VARIABLES,
  WAVEFORM_LINE_STYLE,
  resolveWaveformCssColor,
  waveformAmplitudeColor,
  waveformCssColor,
} from "../../../utils/waveformDefaults";

// Module-level cache: avoids redundant fetch+decode when the same URL
// is rendered by multiple players or across remounts.
const waveformCache = new Map();
const AUDIO_MIME_PREFIX = "audio/";
const COPY_DROP_EFFECT = "copy";

function CompactLevelSlider({ label, onChange, value, visualLevel }) {
  const sliderRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);

  const updateFromPointer = React.useCallback(
    (clientX) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      onChange(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)));
    },
    [onChange],
  );

  return (
    <Box
      ref={sliderRef}
      aria-label={label}
      aria-valuemax={1}
      aria-valuemin={0}
      aria-valuenow={value}
      role="slider"
      tabIndex={0}
      onKeyDown={(event) => {
        const delta =
          event.key === "ArrowUp" || event.key === "ArrowRight"
            ? 0.05
            : event.key === "ArrowDown" || event.key === "ArrowLeft"
              ? -0.05
              : 0;
        if (!delta) return;
        event.preventDefault();
        onChange(Math.max(0, Math.min(1, value + delta)));
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        setDragging(true);
        updateFromPointer(event.clientX);
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (dragging) updateFromPointer(event.clientX);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      sx={{
        position: "relative",
        width: 28,
        height: 10,
        overflow: "hidden",
        borderRadius: 999,
        bgcolor: "action.hover",
        cursor: "pointer",
        outline: "none",
        touchAction: "none",
      }}
    >
      <Box
        aria-hidden={true}
        sx={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: `${Math.max(0, Math.min(100, value * 100))}%`,
          borderRadius: 999,
          bgcolor: "primary.main",
          opacity: 0.2,
          pointerEvents: "none",
        }}
      />
      <Box
        aria-hidden={true}
        sx={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: `${Math.max(0, Math.min(100, visualLevel * 100))}%`,
          borderRadius: 999,
          bgcolor: "primary.main",
          transition: "width 80ms linear",
          pointerEvents: "none",
        }}
      />
    </Box>
  );
}

/**
 * AudioWaveformPlayer - Complete audio player with waveform visualization and recording
 *
 * DO NOT MODIFY the following behaviors without thorough testing across all playback
 * and recording flows. These were hard-won fixes for browser-level edge cases:
 *
 * 1. OVERLAY VISIBILITY: The progress overlay div contains a zero-width space
 *    character ('\u200B') to prevent Lexical's `div:empty:last-child { display: none
 *    !important }` CSS rule from hiding it. Do NOT make the div self-closing or empty.
 *
 * 2. OVERLAY ANIMATION: Uses `transform: scaleX()` with `transformOrigin: 'left'`
 *    for GPU-composited progress reveal. This is preferred over width-percentage
 *    or clip-path approaches which were also tested.
 *
 * 3. DURATION SOURCE: The RAF progress loop uses `durationRef.current` exclusively
 *    (synced from `localDuration` via useEffect). Do NOT use `audioElement.duration`
 *    — WebM blobs from MediaRecorder report `Infinity` for duration. The accurate
 *    duration comes from `decodeAudioData()` in the recording stop handler.
 *
 * 4. SLIDER TRANSITIONS: MUI Slider CSS transitions are disabled during playback
 *    (`transition: 'none'` on thumb and track when `isPlaying && !isSeeking`).
 *    Without this, the ~150ms default transitions fight the RAF updates, making
 *    the thumb barely crawl instead of tracking smoothly.
 *
 * 5. RAF THROTTLING: Progress updates are throttled to ~30fps (33ms interval)
 *    to reduce React re-renders while remaining visually smooth.
 *
 * 6. HEIGHT DEFAULT: Default height is 80px. Do NOT change without comparing
 *    visual appearance of waveforms at different sizes.
 *
 * Uses shared audio context to ensure only one audio plays at a time.
 * Displays a static waveform with playback controls and progress tracking.
 * Shows current playback position on the waveform.
 * Can record new audio with real-time waveform visualization.
 *
 * @param {Object} props
 * @param {string} props.audioUrl - URL of the audio file to play
 * @param {Object} props.file - File object with path (alternative to audioUrl)
 * @param {number} props.width - Waveform width (default: 600)
 * @param {number} props.height - Waveform height (default: 80)
 * @param {string} [props.prompt] - Optional exercise prompt displayed below the waveform
 * @param {Object} [props.promptAudioFile] - Optional prompt audio file
 * @param {string} [props.promptAudioUrl] - Optional prompt audio URL or storage path
 * @param {string} [props.promptDefinition] - Optional word definition displayed with the prompt
 * @param {string} props.title - Legacy fallback for prompt
 * @param {boolean} props.showDuration - Show duration time (default: true)
 * @param {boolean} props.enableRecording - Enable recording controls (default: false)
 * @param {string} props.gradeId - Grade ID for upload (required if enableRecording is true)
 * @param {string} props.nodeKey - Node key for upload (required if enableRecording is true)
 * @param {Object} props.metadata - Additional metadata for recording upload
 * @param {Function} props.onRecordingComplete - Callback when recording is complete
 * @param {Set|Array} [props.audioFilters] - Active filter names for filtered playback
 * @param {string} [props.cleanupStrength] - Pre-submission cleanup strength: 'off'|'light'|'standard'|'aggressive'
 */
export default function AudioWaveformPlayer({
  audioUrl,
  file,
  width = AUDIO_WAVEFORM_PLAYER_DEFAULTS.width,
  height = AUDIO_WAVEFORM_PLAYER_DEFAULTS.height,
  prompt = null,
  promptAudioFile = null,
  promptAudioUrl = null,
  promptDefinition = null,
  title,
  showDuration = true,
  enableRecording = false,
  gradeId,
  nodeKey,
  metadata = {},
  onRecordingComplete,
  audioFilters = [],
  cleanupStrength = "standard",
  compact = false,
  acceptDroppedAudio = enableRecording,
  submissionCountdown = null,
  submissionCountdownDuration = 10,
  onCancelSubmission,
  onRequestSubmission,
  onSubmitNow,
}) {
  const t = useTranslations("editor.shared");
  const tEditor = useTranslations("editor");
  const { mode } = useColorScheme();

  // Resolve CSS variables for canvas drawing (canvas API can't use var())
  // Re-computed when color mode changes (light <-> dark)
  const canvasBg = React.useMemo(() => {
    return resolveWaveformCssColor(
      WAVEFORM_CSS_VARIABLES.background,
      WAVEFORM_COLOR_FALLBACKS.background,
    );
  }, [mode]);
  const { _r, _g, _b } = React.useMemo(() => {
    const mc = resolveWaveformCssColor(
      WAVEFORM_CSS_VARIABLES.color,
      WAVEFORM_COLOR_FALLBACKS.color,
    );
    const rgb = hexToRgb(mc);
    return { _r: rgb.r, _g: rgb.g, _b: rgb.b };
  }, [mode]);

  const audioPlayer = useAudioPlayer();

  // Playback state
  const [localTime, setLocalTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);
  const [localProgress, setLocalProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [outputMuted, setOutputMuted] = useState(false);
  const [inputMuted, setInputMuted] = useState(false);
  const [outputVolume, setOutputVolume] = useState(1);
  const [inputVolume, setInputVolume] = useState(1);
  const [inputLevel, setInputLevel] = useState(0);

  // Recording state
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordedWaveformData, setRecordedWaveformData] = useState(null);
  const [computedWaveformData, setComputedWaveformData] = useState(null);
  const [pendingRecordingStart, setPendingRecordingStart] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const usesLocalTakes = compact && enableRecording;
  const takeScopeKey = React.useMemo(
    () => createTemporaryAudioTakeScope(gradeId, nodeKey),
    [gradeId, nodeKey],
  );
  const [takes, setTakes] = useState([]);
  const [selectedTakeId, setSelectedTakeId] = useState(null);

  // Filtered playback cache: keyed by `${url}::${sortedFilters}`
  const filteredBlobCacheRef = useRef(new Map());
  const [filteredBlobUrl, setFilteredBlobUrl] = useState(null);

  // Cleanup filtered blob URLs on unmount
  useEffect(() => {
    return () => {
      for (const url of filteredBlobCacheRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      filteredBlobCacheRef.current.clear();
    };
  }, []);

  // Mic preview state (hover to show room noise)
  const [previewing, setPreviewing] = useState(false);
  const previewStreamRef = useRef(null);
  const previewAudioCtxRef = useRef(null);
  const previewAnalyserRef = useRef(null);
  const previewRafRef = useRef(null);

  // Shared analyser ref for MicLevelIndicator (points to whichever is active)
  const [activeAnalyser, setActiveAnalyser] = useState(null);

  useEffect(() => {
    if (!activeAnalyser || inputMuted) {
      setInputLevel(0);
      return;
    }
    const monitor = createAudioLevelMonitor(activeAnalyser, {
      intervalMs: 80,
      onLevel: ({ rms }) => setInputLevel(rmsToPercent(rms) / 100),
    });
    monitor.start();
    return () => monitor.stop();
  }, [activeAnalyser, inputMuted]);

  // Refs
  const loadedSourceRef = useRef(null);
  const currentTimeRef = useRef(0);
  const displayTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const recordingCanvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingGainRef = useRef(null);
  const inputGainValueRef = useRef(1);
  const durationRef = useRef(0); // Always-current duration for RAF callbacks
  const pendingTakePlaybackRef = useRef(false);
  const seekPlaybackStartedRef = useRef(false);
  const previousInputVolumeRef = useRef(1);
  const previousOutputVolumeRef = useRef(1);

  // Context
  const filesContext = useContext(FilesContext);
  const identityId = filesContext?.session?.identityId;

  const selectTake = useCallback((take) => {
    if (!take) return;
    localAudioRef.current?.pause();
    pendingTakePlaybackRef.current = true;
    setSelectedTakeId(take.id);
    setAudioBlob(take.blob);
    setRecordedWaveformData(take.waveformData);
    setLocalDuration(take.duration);
    setLocalTime(0);
    setLocalProgress(0);
  }, []);

  useEffect(() => {
    if (!usesLocalTakes) return;
    let active = true;

    void getTemporaryAudioTakes(takeScopeKey)
      .then((storedTakes) => {
        if (!active) return;
        setTakes(storedTakes);
        const latestTake = storedTakes.at(-1);
        if (latestTake) selectTake(latestTake);
      })
      .catch((error) => {
        console.warn("[AudioWaveformPlayer] Unable to restore takes:", error);
      });

    return () => {
      active = false;
    };
  }, [selectTake, takeScopeKey, usesLocalTakes]);

  const submitAudioBlob = useCallback(
    async (submissionBlob, mimeType) => {
      let savedFile = null;
      let uploadResult = null;

      if (gradeId && nodeKey) {
        try {
          uploadResult = await uploadStudentSubmission({
            file: submissionBlob,
            gradeId,
            nodeKey,
            fileType: "mp3",
            metadata: { ...metadata },
          });

          const { getAmplifyClient } =
            await import("../../../utils/amplifyClient");
          const { getCurrentUser } = await import("aws-amplify/auth");
          const client = getAmplifyClient();
          const { username: owner } = await getCurrentUser();
          const { data: newFile, errors: fileErrors } =
            await client.models.File.create({
              path: uploadResult.path,
              owner,
              identityId,
              name: uploadResult.filename,
              size: submissionBlob.size,
              mimeType,
              level: "PRIVATE",
            });

          if (fileErrors?.length > 0 || !newFile) {
            console.error(
              "[AudioWaveformPlayer] Error creating File record:",
              fileErrors,
            );
          } else {
            savedFile = newFile;
          }
        } catch (uploadError) {
          console.error(
            "[AudioWaveformPlayer] Upload/save error (continuing):",
            uploadError,
          );
        }
      }

      onRecordingComplete?.(
        savedFile || { path: URL.createObjectURL(submissionBlob) },
        uploadResult,
      );

      if (usesLocalTakes) {
        await clearTemporaryAudioTakes(takeScopeKey);
        setTakes([]);
        setSelectedTakeId(null);
      }
    },
    [
      gradeId,
      identityId,
      metadata,
      nodeKey,
      onRecordingComplete,
      takeScopeKey,
      usesLocalTakes,
    ],
  );

  // Best-effort submission right after a take finishes recording — failures
  // leave the take saved locally so it can still be submitted manually.
  const attemptTakeAutoSubmit = useCallback(
    async (take) => {
      if (!take) return;
      try {
        if (submissionCountdown !== null) {
          onSubmitNow?.();
          return;
        }
        if (onRequestSubmission) {
          onRequestSubmission(() => submitAudioBlob(take.blob, take.mimeType));
          return;
        }
        await submitAudioBlob(take.blob, take.mimeType);
      } catch (submitError) {
        console.warn(
          "[AudioWaveformPlayer] Auto-submit attempt failed:",
          submitError,
        );
      }
    },
    [onRequestSubmission, onSubmitNow, submissionCountdown, submitAudioBlob],
  );

  // Keep durationRef in sync with localDuration state for RAF callbacks
  useEffect(() => {
    durationRef.current = localDuration;
  }, [localDuration]);

  // Create blob URL only once from file
  useEffect(() => {
    if (file && !audioUrl) {
      // Guard: file must be a Blob/File to create an object URL
      if (!(file instanceof Blob)) return;
      const url = URL.createObjectURL(file);
      setBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setBlobUrl(null);
      };
    }
  }, [file, audioUrl]);

  // Create blob URL for recorded audio
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setRecordedBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setRecordedBlobUrl(null);
      };
    }
  }, [audioBlob]);

  // Local audio element for recording playback (bypasses shared context)
  const localAudioRef = useRef(null);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);

  useEffect(() => {
    if (!recordedBlobUrl) {
      localAudioRef.current = null;
      return;
    }
    const audio = new Audio(recordedBlobUrl);
    localAudioRef.current = audio;

    // For WebM blobs from MediaRecorder, audio.duration is often Infinity.
    // We already have the correct duration from decodeAudioData (set in recording
    // stop handler via setLocalDuration). So we just need basic event listeners
    // and rely on durationRef for progress calculation in the RAF loop.

    const onMeta = () => {
      const dur = audio.duration;
      if (!isNaN(dur) && isFinite(dur) && dur > 0) {
        setLocalDuration(dur);
        setIsReady(true);
      } else {
        // Duration is Infinity/NaN (WebM) — rely on decodeAudioData value
        // which was already set in the recording stop handler
        setIsReady(true);
      }
    };
    const onEnded = () => {
      setLocalIsPlaying(false);
      setLocalTime(0);
      setLocalProgress(0);
      currentTimeRef.current = 0;
      displayTimeRef.current = 0;
    };
    const onPlay = () => setLocalIsPlaying(true);
    const onPause = () => setLocalIsPlaying(false);

    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    if (pendingTakePlaybackRef.current) {
      pendingTakePlaybackRef.current = false;
      const playResult = audio.play();
      if (playResult?.catch) {
        void playResult.catch((error) => {
          console.warn("[AudioWaveformPlayer] Unable to autoplay take:", error);
        });
      }
    }

    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
      audio.src = "";
      localAudioRef.current = null;
      setLocalIsPlaying(false);
    };
  }, [recordedBlobUrl]);

  // Use audioUrl if provided, otherwise use blob URL, otherwise use recorded blob URL
  const sourceUrl = audioUrl || blobUrl || recordedBlobUrl;
  const useLocalAudio = !!recordedBlobUrl;

  // Compute waveform from audioUrl when no file is provided
  useEffect(() => {
    if (!audioUrl || file) return;
    const cacheKey = `${audioUrl}:${width}`;
    const cached = waveformCache.get(cacheKey);
    if (cached) {
      setComputedWaveformData(cached);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const waveform = await calculateWaveformData(arrayBuffer, width);
        waveformCache.set(cacheKey, waveform);
        if (!cancelled) setComputedWaveformData(waveform);
      } catch (err) {
        console.warn("[AudioWaveformPlayer] Failed to compute waveform:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audioUrl, file, width]);

  // Check if this player is currently active
  const isActive = useLocalAudio
    ? !!localAudioRef.current
    : audioPlayer.currentSource === sourceUrl;
  const isPlaying = useLocalAudio
    ? localIsPlaying
    : isActive && audioPlayer.isPlaying;

  useEffect(() => {
    const audio = useLocalAudio
      ? localAudioRef.current
      : isActive
        ? audioPlayer.audioElement
        : null;
    if (audio) {
      audio.muted = outputMuted;
      audio.volume = outputVolume;
    }
  }, [
    audioPlayer.audioElement,
    isActive,
    outputMuted,
    outputVolume,
    useLocalAudio,
  ]);

  useEffect(() => {
    inputGainValueRef.current = inputMuted ? 0 : inputVolume;
    if (recordingGainRef.current) {
      recordingGainRef.current.gain.value = inputGainValueRef.current;
    }
  }, [inputMuted, inputVolume]);

  // Subscribe to shared audio player events (only for non-recording sources)
  useEffect(() => {
    if (!sourceUrl || useLocalAudio) return;

    const listener = {
      onTimeUpdate: (time) => {
        if (isActive && !isSeeking) {
          currentTimeRef.current = time;
        }
      },
      onDurationChange: (dur) => {
        if (isActive) {
          setLocalDuration(dur);
        }
      },
      onEnded: () => {
        if (isActive) {
          setLocalTime(0);
          setLocalProgress(0);
          currentTimeRef.current = 0;
          displayTimeRef.current = 0;
        }
      },
      onCanPlay: () => {
        if (isActive) {
          setIsReady(true);
        }
      },
      onError: () => {
        if (isActive) {
          setIsReady(false);
        }
      },
    };

    return audioPlayer.subscribe(listener);
  }, [sourceUrl, isActive, useLocalAudio, audioPlayer, isSeeking]);

  // Continuous animation loop for smooth progress updates
  useEffect(() => {
    // Don't update if we're seeking - let the slider control the state
    if (!isActive || !isPlaying || isSeeking) {
      return;
    }

    const audioElement = useLocalAudio
      ? localAudioRef.current
      : audioPlayer.audioElement;
    if (!audioElement) return;

    let rafId;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 33; // ~30fps — smooth enough for progress, halves re-renders

    const updateProgress = (timestamp) => {
      // Throttle React state updates to reduce re-renders
      if (timestamp - lastUpdate >= UPDATE_INTERVAL) {
        lastUpdate = timestamp;
        const time = audioElement.currentTime;
        // Always use durationRef (synced with localDuration) — same source
        // as the time display. For recordings, this comes from decodeAudioData
        // which is accurate, unlike audioElement.duration (Infinity for WebM).
        const dur = durationRef.current;

        displayTimeRef.current = time;
        currentTimeRef.current = time;
        setLocalTime(time);

        if (dur > 0) {
          const newProgress = Math.min((time / dur) * 100, 100);
          setLocalProgress(newProgress);
        }
      }

      rafId = requestAnimationFrame(updateProgress);
    };

    rafId = requestAnimationFrame(updateProgress);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isActive, isPlaying, isSeeking, useLocalAudio]);

  // Load source into shared audio context (only for non-recording sources)
  useEffect(() => {
    if (useLocalAudio) return; // Recording uses its own Audio element
    if (sourceUrl && loadedSourceRef.current !== sourceUrl) {
      loadedSourceRef.current = sourceUrl;
      setIsReady(false);
      audioPlayer.loadSource(sourceUrl);
    }
  }, [sourceUrl, useLocalAudio, audioPlayer]);

  const togglePlayPause = useCallback(async () => {
    // Normalize audioFilters to a Set
    const filtersSet =
      audioFilters instanceof Set
        ? audioFilters
        : Array.isArray(audioFilters)
          ? new Set(audioFilters)
          : new Set();

    // Use local audio for recording playback
    if (useLocalAudio && localAudioRef.current) {
      if (localIsPlaying) {
        localAudioRef.current.pause();
      } else {
        try {
          await localAudioRef.current.play();
        } catch (err) {
          console.error("[AudioWaveformPlayer] Error playing recording:", err);
        }
      }
      return;
    }

    if (!sourceUrl) return;

    // If filters are active, process through OfflineAudioContext
    if (filtersSet.size > 0) {
      const cacheKey = `${sourceUrl}::${[...filtersSet].sort().join(",")}`;
      let processedUrl = filteredBlobCacheRef.current.get(cacheKey);

      if (!processedUrl) {
        try {
          const response = await fetch(sourceUrl);
          const arrayBuffer = await response.arrayBuffer();
          const audioCtx = new (
            window.AudioContext || window.webkitAudioContext
          )();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          audioCtx.close();

          const processedBuffer = await applyAudioFilters(
            audioBuffer,
            filtersSet,
          );
          const processedBlob = await audioBufferToBlob(
            processedBuffer,
            "audio/wav",
          );
          processedUrl = URL.createObjectURL(processedBlob);
          filteredBlobCacheRef.current.set(cacheKey, processedUrl);
          setFilteredBlobUrl(processedUrl);
        } catch (err) {
          console.warn(
            "[AudioWaveformPlayer] Filter processing failed, playing raw:",
            err,
          );
          // Fallback to raw playback
          if (isPlaying) {
            audioPlayer.pause();
          } else {
            await audioPlayer.play(sourceUrl);
          }
          return;
        }
      }

      // Play the filtered version
      if (isPlaying) {
        audioPlayer.pause();
      } else {
        await audioPlayer.play(processedUrl);
      }
      return;
    }

    if (isPlaying) {
      audioPlayer.pause();
    } else {
      await audioPlayer.play(sourceUrl);
    }
  }, [
    sourceUrl,
    isPlaying,
    localIsPlaying,
    useLocalAudio,
    audioPlayer,
    audioFilters,
  ]);

  const handleSliderChange = useCallback(
    (event, newValue) => {
      // Mark that we're seeking to prevent animation loop from updating
      if (!isSeeking) {
        setIsSeeking(true);
      }
      // Update progress while dragging without seeking
      setLocalProgress(newValue);
      // Read duration from audio element, fall back to durationRef
      const audioElement = useLocalAudio
        ? localAudioRef.current
        : audioPlayer.audioElement;
      const dur = audioElement?.duration;
      const effectiveDuration =
        dur && isFinite(dur) && dur > 0 ? dur : durationRef.current;
      const newTime =
        effectiveDuration > 0 ? (newValue / 100) * effectiveDuration : 0;
      if (audioElement && effectiveDuration > 0) {
        audioElement.currentTime = newTime;
      }
      setLocalTime(newTime);
      currentTimeRef.current = newTime;
      displayTimeRef.current = newTime;

      if (compact && !isPlaying && !seekPlaybackStartedRef.current) {
        seekPlaybackStartedRef.current = true;
        if (useLocalAudio && localAudioRef.current) {
          void localAudioRef.current.play();
        } else if (sourceUrl) {
          void audioPlayer.play(sourceUrl);
        }
      }
    },
    [compact, isPlaying, isSeeking, sourceUrl, useLocalAudio, audioPlayer],
  );

  const handleSeek = useCallback(
    (event, newValue) => {
      // Prevent event propagation to other sliders
      event.stopPropagation();

      // Read duration from audio element, fall back to durationRef
      const audioElement = useLocalAudio
        ? localAudioRef.current
        : audioPlayer.audioElement;
      const dur = audioElement?.duration;
      const effectiveDuration =
        dur && isFinite(dur) && dur > 0 ? dur : durationRef.current;
      const newTime =
        effectiveDuration > 0 ? (newValue / 100) * effectiveDuration : 0;

      if (useLocalAudio && localAudioRef.current && effectiveDuration > 0) {
        localAudioRef.current.currentTime = newTime;
      } else if (isActive && effectiveDuration > 0) {
        audioPlayer.seek(newTime);
      }
      setLocalProgress(newValue);
      setLocalTime(newTime);
      currentTimeRef.current = newTime;
      displayTimeRef.current = newTime;
      setIsSeeking(false);
      seekPlaybackStartedRef.current = false;
    },
    [isActive, useLocalAudio, audioPlayer],
  );

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Stop mic preview helper
  const stopPreview = useCallback(() => {
    if (previewRafRef.current) {
      cancelAnimationFrame(previewRafRef.current);
      previewRafRef.current = null;
    }
    if (previewAudioCtxRef.current) {
      previewAudioCtxRef.current.close();
      previewAudioCtxRef.current = null;
    }
    previewAnalyserRef.current = null;
    if (!recording) setActiveAnalyser(null);
    // Only stop tracks if we're not handing off to recording
    if (previewStreamRef.current && !recording) {
      previewStreamRef.current.getTracks().forEach((track) => track.stop());
      previewStreamRef.current = null;
    }
    setPreviewing(false);
  }, [recording]);

  // Hover: start mic preview to show room noise
  const handleMouseEnter = useCallback(async () => {
    // Only preview when in recording mode with no content and not already active
    if (
      !enableRecording ||
      recording ||
      audioBlob ||
      sourceUrl ||
      computedWaveformData ||
      file ||
      previewing
    )
      return;
    // Guard: getUserMedia may not be available in headless/test environments
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      previewStreamRef.current = stream;

      const audioCtx = new AudioContext();
      previewAudioCtxRef.current = audioCtx;
      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      src.connect(analyser);
      previewAnalyserRef.current = analyser;
      setActiveAnalyser(analyser);

      setPreviewing(true);
    } catch (err) {
      console.warn("[AudioWaveformPlayer] Mic preview denied:", err);
    }
  }, [
    enableRecording,
    recording,
    audioBlob,
    sourceUrl,
    computedWaveformData,
    file,
    previewing,
  ]);

  const handleMouseLeave = useCallback(() => {
    if (recording || !previewing) return;
    stopPreview();
  }, [recording, previewing, stopPreview]);

  // Draw live mic preview on canvas
  useEffect(() => {
    const canvas = recordingCanvasRef.current;
    const analyser = previewAnalyserRef.current;
    if (!canvas || !previewing || !analyser || recording) return;

    const canvasCtx = canvas.getContext("2d");
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let active = true;

    const drawPreview = () => {
      if (!active) return;
      previewRafRef.current = requestAnimationFrame(drawPreview);

      analyser.getByteFrequencyData(dataArray);
      canvasCtx.fillStyle = canvasBg;
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const targetSamples = canvas.width;
      const barWidth = canvas.width / targetSamples;
      const middle = canvas.height / 2;
      const max = Math.max(...dataArray) || 1;
      const binSize = Math.floor(bufferLength / targetSamples);

      for (let i = 0; i < targetSamples; i++) {
        let sum = 0;
        const start = i * binSize;
        for (let j = start; j < start + binSize && j < bufferLength; j++) {
          sum += dataArray[j];
        }
        const amplitude = sum / binSize / max;
        const barHeight = amplitude * middle;
        const x = i * barWidth;
        canvasCtx.fillStyle = waveformAmplitudeColor(amplitude, _g, _b);
        canvasCtx.fillRect(
          x,
          middle - barHeight,
          Math.max(1, barWidth - WAVEFORM_LINE_STYLE.barGap),
          barHeight * 2,
        );
      }
    };

    drawPreview();

    return () => {
      active = false;
      if (previewRafRef.current) {
        cancelAnimationFrame(previewRafRef.current);
        previewRafRef.current = null;
      }
    };
  }, [previewing, recording, _g, _b]);

  // Recording functions
  const startRecording = useCallback(async () => {
    try {
      let stream;
      // Reuse preview stream if available, otherwise request new one
      if (previewStreamRef.current && previewStreamRef.current.active) {
        stream = previewStreamRef.current;
        // Stop preview drawing but keep the stream
        if (previewRafRef.current) {
          cancelAnimationFrame(previewRafRef.current);
          previewRafRef.current = null;
        }
        if (previewAudioCtxRef.current) {
          previewAudioCtxRef.current.close();
          previewAudioCtxRef.current = null;
        }
        previewAnalyserRef.current = null;
        setPreviewing(false);
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      mediaStreamRef.current = stream;
      setPendingRecordingStart(true);
      setRecording(true);
    } catch (error) {
      console.error("[AudioWaveformPlayer] Error starting recording:", error);
    }
  }, []);

  // Idle state: draw a flat center line (canvas looks "off")
  useEffect(() => {
    const canvas = recordingCanvasRef.current;
    if (
      !canvas ||
      recording ||
      audioBlob ||
      sourceUrl ||
      computedWaveformData ||
      file ||
      previewing
    ) {
      return;
    }

    if (!enableRecording) {
      return;
    }

    const canvasCtx = canvas.getContext("2d");
    // Theme-aware background
    canvasCtx.fillStyle = canvasBg;
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    // Single flat line at center using theme color
    const middle = canvas.height / 2;
    canvasCtx.fillStyle = `rgb(${_r}, ${_g}, ${_b})`;
    canvasCtx.fillRect(
      0,
      middle,
      canvas.width,
      WAVEFORM_LINE_STYLE.idleLineThickness,
    );
  }, [
    recording,
    audioBlob,
    sourceUrl,
    computedWaveformData,
    file,
    enableRecording,
    previewing,
    _r,
    _g,
    _b,
  ]);

  // Effect to handle recording setup once canvas is available
  useEffect(() => {
    if (
      !pendingRecordingStart ||
      !recording ||
      !recordingCanvasRef.current ||
      !mediaStreamRef.current
    ) {
      return;
    }

    setPendingRecordingStart(false);
    const stream = mediaStreamRef.current;

    // Setup real-time waveform visualization
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const gain = audioContext.createGain();
    const analyser = audioContext.createAnalyser();
    const destination = audioContext.createMediaStreamDestination();
    gain.gain.value = inputGainValueRef.current;
    source.connect(gain);
    source.connect(analyser);
    gain.connect(destination);
    recordingGainRef.current = gain;

    const recorder = new MediaRecorder(destination.stream);
    setMediaRecorder(recorder);
    recorder.start();
    const audioChunks = [];

    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    setActiveAnalyser(analyser);

    const canvas = recordingCanvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Track if we should keep drawing
    let isRecording = true;

    recorder.addEventListener("dataavailable", (event) => {
      audioChunks.push(event.data);
    });

    recorder.addEventListener("stop", async () => {
      isRecording = false;
      setActiveAnalyser(null);
      recordingGainRef.current = null;
      audioContext.close();
      // Use the recorder's actual mimeType so decodeAudioData gets a valid container
      const actualMimeType = recorder.mimeType || "audio/webm";
      let blob = new Blob(audioChunks, { type: actualMimeType });
      let takeDuration = 0;

      // Decode audio to get accurate duration (WebM blobs report Infinity via Audio element)
      try {
        const decodeCtx = new (
          window.AudioContext || window.webkitAudioContext
        )();
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
        const realDuration = audioBuffer.duration;
        console.log("[AudioWaveformPlayer] Decoded duration:", realDuration);
        if (isFinite(realDuration) && realDuration > 0) {
          takeDuration = realDuration;
          setLocalDuration(realDuration);
        }
        decodeCtx.close();

        // Pre-submission cleanup: apply filters based on cleanupStrength setting
        // Per-file settings override the user-level default (from RecordingStudio3)
        // TTS recordings are already clean — skip for type==='tts' (checked by parent)
        const effectiveStrength =
          file?.settings?.audioCleanupStrength || cleanupStrength;
        if (enableRecording && effectiveStrength !== "off") {
          try {
            const cleanupFilters = getCleanupFilters(effectiveStrength);
            const processedBuffer = await applyAudioFilters(
              audioBuffer,
              cleanupFilters,
            );
            const processedBlob = await audioBufferToBlob(
              processedBuffer,
              "audio/wav",
            );
            blob = processedBlob;
            console.log("[AudioWaveformPlayer] Pre-submission cleanup applied");
          } catch (cleanupErr) {
            console.warn(
              "[AudioWaveformPlayer] Cleanup failed, using raw recording:",
              cleanupErr,
            );
          }
        }
      } catch (decodeErr) {
        console.warn(
          "[AudioWaveformPlayer] Duration decode failed:",
          decodeErr,
        );
      }

      setAudioBlob(blob);

      // Calculate waveform data (non-blocking — failures don't prevent upload/callback)
      let waveform = null;
      try {
        waveform = await calculateWaveformData(blob, width);
        setRecordedWaveformData(waveform);
        console.log("[AudioWaveformPlayer] Calculated waveform for recording");
      } catch (waveformError) {
        console.warn(
          "[AudioWaveformPlayer] Waveform calculation failed (continuing):",
          waveformError,
        );
      }

      if (usesLocalTakes) {
        const take = {
          id: crypto.randomUUID(),
          scopeKey: takeScopeKey,
          blob,
          waveformData: waveform,
          duration: takeDuration,
          mimeType: blob.type || actualMimeType,
          createdAt: Date.now(),
        };
        await saveTemporaryAudioTake(take);
        setTakes((currentTakes) => [...currentTakes, take]);
        selectTake(take);
        void attemptTakeAutoSubmit(take);
        return;
      }

      await submitAudioBlob(blob, blob.type || actualMimeType);
    });

    // Real-time waveform drawing - use local variable instead of state
    const draw = () => {
      if (!isRecording) return;
      requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);
      canvasCtx.fillStyle = canvasBg;
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      // Match StaticWaveform: downsample analyser data to canvas.width bins,
      // use the shared bar gap and draw symmetrically from center
      const targetSamples = canvas.width;
      const barWidth = canvas.width / targetSamples;
      const middle = canvas.height / 2;

      // Prevent division by zero when analyser returns silence (all zeros)
      const max = Math.max(...dataArray) || 1;

      // Downsample frequency data to targetSamples bins
      const binSize = Math.floor(bufferLength / targetSamples);

      for (let i = 0; i < targetSamples; i++) {
        // Average the frequency bins for this sample
        let sum = 0;
        const start = i * binSize;
        for (let j = start; j < start + binSize && j < bufferLength; j++) {
          sum += dataArray[j];
        }
        const amplitude = sum / binSize / max;
        const barHeight = amplitude * middle;
        const x = i * barWidth;

        // Match StaticWaveform color: intensity varies red channel
        canvasCtx.fillStyle = waveformAmplitudeColor(amplitude, _g, _b);

        // Draw from middle outward (symmetric) - matches StaticWaveform exactly
        canvasCtx.fillRect(
          x,
          middle - barHeight,
          Math.max(1, barWidth - WAVEFORM_LINE_STYLE.barGap),
          barHeight * 2,
        );
      }
    };

    console.log(
      "[AudioWaveformPlayer] Starting real-time waveform visualization",
    );
    draw();
  }, [
    pendingRecordingStart,
    recording,
    width,
    _g,
    _b,
    gradeId,
    nodeKey,
    metadata,
    identityId,
    attemptTakeAutoSubmit,
    onRecordingComplete,
    selectTake,
    submitAudioBlob,
    takeScopeKey,
    usesLocalTakes,
  ]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
      setMediaRecorder(null);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    // Also clean up any leftover preview resources
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach((track) => track.stop());
      previewStreamRef.current = null;
    }
  }, [mediaRecorder]);

  const handleDroppedAudio = React.useCallback(
    async (droppedFile) => {
      if (
        !acceptDroppedAudio ||
        !droppedFile?.type?.startsWith(AUDIO_MIME_PREFIX)
      ) {
        return;
      }

      localAudioRef.current?.pause();
      setLocalTime(0);
      setLocalProgress(0);
      setIsReady(false);
      setAudioBlob(droppedFile);
      setRecordedWaveformData(null);

      try {
        const waveform = await calculateWaveformData(droppedFile, width);
        setRecordedWaveformData(waveform);
      } catch (error) {
        console.warn(
          "[AudioWaveformPlayer] Dropped audio waveform failed:",
          error,
        );
      }

      try {
        const audioContext = new (
          window.AudioContext || window.webkitAudioContext
        )();
        const audioBuffer = await audioContext.decodeAudioData(
          await droppedFile.arrayBuffer(),
        );
        setLocalDuration(audioBuffer.duration);
        durationRef.current = audioBuffer.duration;
        await audioContext.close();
      } catch (error) {
        console.warn(
          "[AudioWaveformPlayer] Dropped audio duration failed:",
          error,
        );
      }

      onRecordingComplete?.(droppedFile, null);
    },
    [acceptDroppedAudio, onRecordingComplete, width],
  );

  const handleTakeSelection = useCallback(
    (takeId) => {
      selectTake(takes.find((take) => take.id === takeId));
    },
    [selectTake, takes],
  );

  const handleTakeDelete = useCallback(
    (takeId) => {
      void deleteTemporaryAudioTake(takeId).catch((error) => {
        console.warn("[AudioWaveformPlayer] Unable to delete take:", error);
      });
      setTakes((currentTakes) => {
        const remainingTakes = currentTakes.filter(
          (take) => take.id !== takeId,
        );
        if (takeId === selectedTakeId) {
          const nextTake = remainingTakes.at(-1);
          if (nextTake) {
            selectTake(nextTake);
          } else {
            localAudioRef.current?.pause();
            setSelectedTakeId(null);
            setAudioBlob(null);
            setRecordedWaveformData(null);
            setLocalDuration(0);
            setLocalTime(0);
            setLocalProgress(0);
          }
        }
        return remainingTakes;
      });
    },
    [selectTake, selectedTakeId],
  );

  const submitSelectedTake = useCallback(async () => {
    const selectedTake = takes.find((take) => take.id === selectedTakeId);
    if (!selectedTake) return;
    await submitAudioBlob(selectedTake.blob, selectedTake.mimeType);
  }, [selectedTakeId, submitAudioBlob, takes]);

  const handleTakeSubmission = useCallback(() => {
    if (submissionCountdown !== null) {
      onSubmitNow?.();
      return;
    }
    if (onRequestSubmission) {
      onRequestSubmission(submitSelectedTake);
      return;
    }
    void submitSelectedTake();
  }, [
    onRequestSubmission,
    onSubmitNow,
    submissionCountdown,
    submitSelectedTake,
  ]);

  const footerControls = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 0.25 : 1,
        width: compact ? "auto" : "clamp(7rem, 42vw, 22rem)",
        minHeight: compact ? 28 : 40,
        "& .MuiIconButton-root": {
          minWidth: compact ? 28 : 36,
          minHeight: compact ? 28 : 36,
          p: compact ? 0.5 : undefined,
        },
        "& .MuiSvgIcon-root": {
          fontSize: compact ? "1.05rem" : undefined,
        },
      }}
    >
      {compact ? (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.25,
          }}
        >
          {enableRecording && (
            <IconButton
              aria-label={recording ? "Stop recording" : "Start recording"}
              aria-pressed={recording}
              color={recording ? "error" : "primary"}
              onClick={recording ? stopRecording : startRecording}
              size="small"
              title={recording ? "Stop recording" : "Start recording"}
            >
              <FiberManualRecordIcon />
            </IconButton>
          )}
          <IconButton
            aria-label={isPlaying ? "Pause" : "Play"}
            aria-pressed={isPlaying}
            color="primary"
            disabled={recording || (!sourceUrl && !audioBlob)}
            onClick={togglePlayPause}
            size="small"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          {enableRecording && (
            <IconButton
              aria-label={inputMuted ? "Unmute input" : "Mute input"}
              aria-pressed={inputMuted}
              onClick={() => {
                if (inputMuted) {
                  setInputVolume(previousInputVolumeRef.current);
                  setInputMuted(false);
                } else {
                  previousInputVolumeRef.current = inputVolume || 1;
                  setInputVolume(0);
                  setInputMuted(true);
                }
              }}
              size="small"
              title={inputMuted ? "Unmute input" : "Mute input"}
            >
              {inputMuted ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
          )}
          {enableRecording && (
            <CompactLevelSlider
              label="Input volume"
              value={inputMuted ? 0 : inputVolume}
              visualLevel={inputMuted ? 0 : inputLevel}
              onChange={(nextVolume) => {
                if (nextVolume > 0) {
                  previousInputVolumeRef.current = nextVolume;
                }
                setInputVolume(nextVolume);
                setInputMuted(nextVolume <= 0);
              }}
            />
          )}
          <IconButton
            aria-label={outputMuted ? "Unmute output" : "Mute output"}
            aria-pressed={outputMuted}
            onClick={() => {
              if (outputMuted) {
                setOutputVolume(previousOutputVolumeRef.current);
                setOutputMuted(false);
              } else {
                previousOutputVolumeRef.current = outputVolume || 1;
                setOutputVolume(0);
                setOutputMuted(true);
              }
            }}
            size="small"
            title={outputMuted ? "Unmute output" : "Mute output"}
          >
            {outputMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>
          <CompactLevelSlider
            label="Output volume"
            value={outputMuted ? 0 : outputVolume}
            visualLevel={outputMuted || !isPlaying ? 0 : outputVolume}
            onChange={(nextVolume) => {
              if (nextVolume > 0) {
                previousOutputVolumeRef.current = nextVolume;
              }
              setOutputVolume(nextVolume);
              setOutputMuted(nextVolume <= 0);
            }}
          />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {enableRecording && (
              <IconButton
                onClick={startRecording}
                color="primary"
                disabled={recording}
                size="small"
                title="Start recording"
              >
                <RecordIcon />
              </IconButton>
            )}

            {enableRecording && (
              <IconButton
                onClick={stopRecording}
                color="error"
                disabled={!recording}
                size="small"
                title="Stop recording"
              >
                <StopIcon />
              </IconButton>
            )}

            {(enableRecording || sourceUrl || audioBlob) && (
              <IconButton
                onClick={togglePlayPause}
                color="primary"
                disabled={recording || (!sourceUrl && !audioBlob)}
                size="small"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            )}
          </Box>

          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              minWidth: 0,
              minHeight: 20,
            }}
          >
            {!compact && !recording && (sourceUrl || audioBlob) && (
              <Slider
                value={
                  isNaN(localProgress) || !isFinite(localProgress)
                    ? 0
                    : localProgress
                }
                min={0}
                max={100}
                step={0.1}
                onChange={handleSliderChange}
                onChangeCommitted={handleSeek}
                aria-label={tEditor("answerComponent.inputMethods.audio")}
                track="normal"
                size="small"
                sx={{
                  width: "100%",
                  ...(!isSeeking && isPlaying
                    ? {
                        "& .MuiSlider-thumb": { transition: "none" },
                        "& .MuiSlider-track": { transition: "none" },
                      }
                    : {}),
                }}
              />
            )}

            {recording && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  flexGrow: 1,
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ fontWeight: 700 }}
                >
                  {t("recordingStudio3.record")}
                </Typography>
                <MicLevelIndicator analyser={activeAnalyser} />
              </Box>
            )}

            {!recording && !sourceUrl && !audioBlob && previewing && (
              <MicLevelIndicator analyser={activeAnalyser} />
            )}
          </Box>

          <Box sx={{ minWidth: 72, textAlign: "right" }}>
            {showDuration &&
              !compact &&
              !recording &&
              (sourceUrl || audioBlob) && (
                <Typography variant="caption" color="text.secondary">
                  {formatTime(localTime)} / {formatTime(localDuration)}
                </Typography>
              )}
          </Box>
        </>
      )}
    </Box>
  );

  if (!sourceUrl && !file && !enableRecording) {
    return (
      <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
        {t("audioWaveformPlayer.noAudioSource")}
      </Box>
    );
  }

  return (
    <ExerciseResponsePanel
      actionRowBackground={compact ? "background.paper" : undefined}
      centerControls={usesLocalTakes ? undefined : footerControls}
      countdown={submissionCountdown}
      countdownDuration={submissionCountdownDuration}
      cancelDisabled={!enableRecording || submissionCountdown === null}
      onCancel={onCancelSubmission}
      onSubmit={
        usesLocalTakes
          ? handleTakeSubmission
          : recording
            ? stopRecording
            : onSubmitNow
      }
      showCancel={enableRecording}
      showSubmit={usesLocalTakes || recording || submissionCountdown !== null}
      submitDisabled={usesLocalTakes && (!selectedTakeId || recording)}
      submitIcon={!usesLocalTakes && recording ? <StopIcon /> : undefined}
      submitLabel={
        !usesLocalTakes && recording
          ? t("recordingStudio3.stop")
          : t("questionBlock.submit")
      }
      onDragEnter={(event) => {
        if (!acceptDroppedAudio) return;
        if (
          [...event.dataTransfer.items].some((item) =>
            item.type.startsWith(AUDIO_MIME_PREFIX),
          )
        ) {
          event.preventDefault();
          setDropActive(true);
        }
      }}
      onDragOver={(event) => {
        if (!acceptDroppedAudio) return;
        if (
          [...event.dataTransfer.items].some((item) =>
            item.type.startsWith(AUDIO_MIME_PREFIX),
          )
        ) {
          event.preventDefault();
          event.dataTransfer.dropEffect = COPY_DROP_EFFECT;
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setDropActive(false);
        }
      }}
      onDrop={(event) => {
        if (!acceptDroppedAudio) return;
        const droppedFile = [...event.dataTransfer.files].find((item) =>
          item.type.startsWith(AUDIO_MIME_PREFIX),
        );
        if (!droppedFile) return;
        event.preventDefault();
        setDropActive(false);
        void handleDroppedAudio(droppedFile);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        border: dropActive ? "2px dashed" : "1px solid",
        borderColor: dropActive ? "primary.main" : "divider",
        borderRadius: 2,
        backgroundColor: "background.paper",
        maxWidth: width,
        ...(compact && {
          '& [data-testid="audio-prompt-panel"]': {
            bgcolor: "background.paper",
          },
        }),
      }}
    >
      {/* Waveform with progress overlay */}
      <Box
        sx={{
          position: "relative",
          borderRadius: 0,
          width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Show static waveform when not recording and we have data */}
        {!recording && (computedWaveformData || file) && !audioBlob && (
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: `${width}px`,
              height: `${height}px`,
            }}
          >
            <StaticWaveform
              file={file}
              waveformData={computedWaveformData}
              width={width}
              height={height}
              showLoading={false}
            />

            {/* Progress overlay — contains zero-width space to defeat
                            Lexical's div:empty:last-child {display:none!important} rule */}
            {localDuration > 0 && (
              <div
                data-testid="waveform-overlay"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: waveformCssColor(
                    WAVEFORM_CSS_VARIABLES.color,
                    WAVEFORM_COLOR_FALLBACKS.color,
                  ),
                  opacity: 0.2,
                  pointerEvents: "none",
                  transformOrigin: "left",
                  transform: `scaleX(${Math.min(localProgress / 100, 1)})`,
                  willChange: "transform",
                }}
              >
                {"\u200B"}
              </div>
            )}
          </div>
        )}

        {/* Canvas - shown for idle, preview, or recording */}
        {enableRecording &&
          (recording || (!computedWaveformData && !file && !audioBlob)) && (
            <canvas
              ref={recordingCanvasRef}
              width={width}
              height={height}
              style={{
                backgroundColor: waveformCssColor(
                  WAVEFORM_CSS_VARIABLES.background,
                  WAVEFORM_COLOR_FALLBACKS.background,
                ),
                border: "none",
                borderRadius: 0,
                width: "100%",
                maxWidth: `${width}px`,
                height: `${height}px`,
                display: "block",
                boxSizing: "border-box",
              }}
            />
          )}

        {/* Recorded audio waveform with progress overlay */}
        {audioBlob && recordedWaveformData && !recording && (
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: `${width}px`,
              height: `${height}px`,
            }}
          >
            <StaticWaveform
              waveformData={recordedWaveformData}
              width={width}
              height={height}
              showLoading={false}
            />

            {/* Progress overlay for recorded audio — see comment above */}
            {localDuration > 0 && (
              <div
                data-testid="waveform-overlay"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: waveformCssColor(
                    WAVEFORM_CSS_VARIABLES.color,
                    WAVEFORM_COLOR_FALLBACKS.color,
                  ),
                  opacity: 0.2,
                  pointerEvents: "none",
                  transformOrigin: "left",
                  transform: `scaleX(${Math.min(localProgress / 100, 1)})`,
                  willChange: "transform",
                }}
              >
                {"\u200B"}
              </div>
            )}
          </div>
        )}

        {/* Fallback: recorded blob exists but waveform not yet calculated */}
        {audioBlob && !recordedWaveformData && !recording && (
          <canvas
            ref={recordingCanvasRef}
            width={width}
            height={height}
            style={{
              backgroundColor: waveformCssColor(
                WAVEFORM_CSS_VARIABLES.background,
                WAVEFORM_COLOR_FALLBACKS.background,
              ),
              border: "none",
              borderRadius: 0,
              width: "100%",
              maxWidth: `${width}px`,
              height: `${height}px`,
              display: "block",
              boxSizing: "border-box",
            }}
          />
        )}

        {compact && (recording || sourceUrl || audioBlob) && (
          <>
            <Slider
              value={Number.isFinite(localProgress) ? localProgress : 0}
              min={0}
              max={100}
              step={0.1}
              onChange={handleSliderChange}
              onChangeCommitted={handleSeek}
              aria-label={tEditor("answerComponent.inputMethods.audio")}
              disabled={recording || !localDuration}
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                m: 0,
                p: 0,
                zIndex: 3,
                color: "primary.main",
                "&.Mui-disabled": { opacity: 1 },
                "& .MuiSlider-rail, & .MuiSlider-track": {
                  height: 4,
                  top: "auto",
                  bottom: 0,
                  transform: "none",
                },
                "& .MuiSlider-rail": { opacity: 0.7 },
                "& .MuiSlider-track": { border: 0 },
                "& .MuiSlider-thumb.MuiSlider-thumb": {
                  width: 1,
                  height: 1,
                  opacity: 0,
                  boxShadow: "none",
                },
                "& .MuiSlider-thumb::before, & .MuiSlider-thumb::after": {
                  display: "none",
                },
              }}
            />
          </>
        )}

        {compact && (
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 4,
              display: "grid",
              gridTemplateColumns: "minmax(3rem, 1fr) auto minmax(3rem, 1fr)",
              alignItems: "center",
              minHeight: 28,
              px: 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
              bgcolor:
                "color-mix(in srgb, var(--mui-palette-background-paper) 38%, transparent)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
              },
            }}
          >
            <Typography
              aria-label="Elapsed time"
              component="span"
              sx={{
                justifySelf: "start",
                fontSize: "0.7rem",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {showDuration && (recording || sourceUrl || audioBlob)
                ? formatTime(localTime)
                : null}
            </Typography>
            <Box
              data-compact-controls
              sx={{
                display: "flex",
                gridColumn: 2,
                transform: "scale(0.78)",
                transformOrigin: "center",
                transition: "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                "@media (prefers-reduced-motion: reduce)": {
                  transition: "none",
                },
              }}
            >
              {footerControls}
            </Box>
            <Typography
              aria-label="Remaining time"
              component="span"
              sx={{
                gridColumn: 3,
                justifySelf: "end",
                fontSize: "0.7rem",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {showDuration && (recording || sourceUrl || audioBlob)
                ? `-${formatTime(Math.max(0, localDuration - localTime))}`
                : null}
            </Typography>
          </Box>
        )}
      </Box>

      <AudioPromptPanel
        audioFile={promptAudioFile}
        audioUrl={promptAudioUrl}
        definition={promptDefinition}
        prompt={prompt ?? title}
        width={width}
      />

      {usesLocalTakes && (
        <AudioTakePlaylist
          compact
          takes={takes}
          selectedTakeId={selectedTakeId}
          onSelect={handleTakeSelection}
          onDelete={handleTakeDelete}
        />
      )}
    </ExerciseResponsePanel>
  );
}
