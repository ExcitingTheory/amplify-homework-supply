/**
 * recordingStudioReducer — State machine for RecordingStudioEnhanced.
 *
 * Manages recording/playback state machine, tracks, filters, and selection.
 * Prevents impossible states (e.g., recording + playing simultaneously).
 */

// ============================================================================
// Types
// ============================================================================

export interface AudioClip {
  id: number;
  audioBlob: Blob;
  waveformData: number[];
  startTime: number;
  duration: number;
}

export interface Track {
  id: number;
  name: string;
  voice: string;
  prompt: string;
  clips: AudioClip[];
}

export interface AudioFilters {
  noiseReduction: "none" | "light" | "medium" | "heavy";
  popClickRemoval: boolean;
  speechEnhancement: "none" | "clarity" | "presence" | "broadcast";
  highPassFilter: boolean;
  lowPassFilter: boolean;
  normalize: boolean;
}

export type RecordingStatus = "idle" | "recording" | "stopping";
export type PlaybackStatus = "idle" | "playing" | "paused";

export interface RecordingStudioState {
  tracks: Track[];
  selectedTrackId: number;
  filters: AudioFilters;
  recordingStatus: RecordingStatus;
  mediaRecorder: MediaRecorder | null;
  mediaStream: MediaStream | null;
  recordingAnalyser: AnalyserNode | null;
  playbackStatus: PlaybackStatus;
  currentTime: number;
  duration: number;
  selectionStart: number | null;
  selectionEnd: number | null;
}

// ============================================================================
// Actions
// ============================================================================

export type RecordingStudioAction =
  | {
      type: "START_RECORDING";
      mediaStream: MediaStream;
      mediaRecorder: MediaRecorder;
      recordingAnalyser: AnalyserNode;
    }
  | { type: "STOP_RECORDING" }
  | { type: "RECORDING_STOPPED"; clip: AudioClip }
  | { type: "START_PLAYBACK" }
  | { type: "PAUSE_PLAYBACK" }
  | { type: "STOP_PLAYBACK" }
  | { type: "SET_CURRENT_TIME"; time: number }
  | { type: "SET_DURATION"; duration: number }
  | { type: "SET_SELECTION"; start: number | null; end: number | null }
  | { type: "CLEAR_SELECTION" }
  | { type: "CUT_SELECTION" }
  | { type: "ADD_TRACK"; track: Track }
  | { type: "DELETE_TRACK"; trackId: number }
  | { type: "UPDATE_TRACK"; trackId: number; updates: Partial<Track> }
  | { type: "SELECT_TRACK"; trackId: number }
  | { type: "SET_FILTER"; filter: Partial<AudioFilters> }
  | { type: "CLEANUP_RECORDING_RESOURCES" };

// ============================================================================
// Initial State
// ============================================================================

export const initialRecordingStudioState: RecordingStudioState = {
  tracks: [
    {
      id: 1,
      name: "Track 1",
      voice: "alloy",
      prompt: "",
      clips: [],
    },
  ],
  selectedTrackId: 1,
  filters: {
    noiseReduction: "none",
    popClickRemoval: false,
    speechEnhancement: "none",
    highPassFilter: false,
    lowPassFilter: false,
    normalize: false,
  },
  recordingStatus: "idle",
  mediaRecorder: null,
  mediaStream: null,
  recordingAnalyser: null,
  playbackStatus: "idle",
  currentTime: 0,
  duration: 0,
  selectionStart: null,
  selectionEnd: null,
};

// ============================================================================
// Reducer
// ============================================================================

export function recordingStudioReducer(
  state: RecordingStudioState,
  action: RecordingStudioAction,
): RecordingStudioState {
  switch (action.type) {
    case "START_RECORDING":
      // Can't record while playing
      if (state.playbackStatus !== "idle") return state;
      return {
        ...state,
        recordingStatus: "recording",
        mediaStream: action.mediaStream,
        mediaRecorder: action.mediaRecorder,
        recordingAnalyser: action.recordingAnalyser,
      };

    case "STOP_RECORDING":
      return {
        ...state,
        recordingStatus: "stopping",
      };

    case "RECORDING_STOPPED": {
      const track = state.tracks.find((t) => t.id === state.selectedTrackId);
      if (!track)
        return {
          ...state,
          recordingStatus: "idle",
          mediaRecorder: null,
          mediaStream: null,
          recordingAnalyser: null,
        };
      return {
        ...state,
        recordingStatus: "idle",
        mediaRecorder: null,
        mediaStream: null,
        recordingAnalyser: null,
        tracks: state.tracks.map((t) =>
          t.id === state.selectedTrackId
            ? { ...t, clips: [...t.clips, action.clip] }
            : t,
        ),
      };
    }

    case "CLEANUP_RECORDING_RESOURCES":
      return {
        ...state,
        recordingStatus: "idle",
        mediaRecorder: null,
        mediaStream: null,
        recordingAnalyser: null,
      };

    case "START_PLAYBACK":
      // Can't play while recording
      if (state.recordingStatus !== "idle") return state;
      return { ...state, playbackStatus: "playing" };

    case "PAUSE_PLAYBACK":
      return { ...state, playbackStatus: "paused" };

    case "STOP_PLAYBACK":
      return { ...state, playbackStatus: "idle", currentTime: 0 };

    case "SET_CURRENT_TIME":
      return { ...state, currentTime: action.time };

    case "SET_DURATION":
      return { ...state, duration: action.duration };

    case "SET_SELECTION":
      return {
        ...state,
        selectionStart: action.start,
        selectionEnd: action.end,
      };

    case "CLEAR_SELECTION":
      return { ...state, selectionStart: null, selectionEnd: null };

    case "CUT_SELECTION":
      // Reset selection after cut (actual audio manipulation happens externally)
      return { ...state, selectionStart: null, selectionEnd: null };

    case "ADD_TRACK":
      return { ...state, tracks: [...state.tracks, action.track] };

    case "DELETE_TRACK": {
      if (state.tracks.length <= 1) return state;
      const remaining = state.tracks.filter((t) => t.id !== action.trackId);
      return {
        ...state,
        tracks: remaining,
        selectedTrackId:
          state.selectedTrackId === action.trackId
            ? remaining[0].id
            : state.selectedTrackId,
      };
    }

    case "UPDATE_TRACK":
      return {
        ...state,
        tracks: state.tracks.map((t) =>
          t.id === action.trackId ? { ...t, ...action.updates } : t,
        ),
      };

    case "SELECT_TRACK":
      return { ...state, selectedTrackId: action.trackId };

    case "SET_FILTER":
      return { ...state, filters: { ...state.filters, ...action.filter } };

    default:
      return state;
  }
}
