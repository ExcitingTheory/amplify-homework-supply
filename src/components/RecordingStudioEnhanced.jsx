import React, { useReducer, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  recordingStudioReducer,
  initialRecordingStudioState,
} from "./recordingStudioReducer";

import RecordingStudioEnhancedView from "./RecordingStudioEnhancedView";
import { calculateWaveformData } from "../utils/calculateWaveformData";

/**
 * Enhanced Recording Studio with:
 * - Audio filtering toolbar (noise reduction, pop/click removal, speech enhancement)
 * - Cut functionality for audio editing
 * - Multiple tracks with different voices
 * - Horizontal scrolling track viewer
 * - Editable prompts per track
 * - Waveform visualization
 */
export default function RecordingStudioEnhanced({
  gradeId,
  nodeKey,
  onRecordingComplete,
  metadata = {},
  /** Optional ref — parent can read current state on demand (e.g. modal Save button) */
  stateRef,
}) {
  const t = useTranslations("components");
  const [state, dispatch] = useReducer(
    recordingStudioReducer,
    initialRecordingStudioState,
  );
  const {
    tracks,
    selectedTrackId,
    filters,
    recordingStatus,
    recordingAnalyser,
    selectionStart,
    selectionEnd,
  } = state;
  const recording = recordingStatus === "recording";

  // Keep stateRef current so parent modal can read state on Save
  if (stateRef) {
    stateRef.current = state;
  }

  // Refs
  const trackContainerRef = useRef(null);
  const audioContextRef = useRef(null);

  // Available Whisper voices
  const whisperVoices = [
    { value: "alloy", label: "Alloy" },
    { value: "echo", label: "Echo" },
    { value: "fable", label: "Fable" },
    { value: "onyx", label: "Onyx" },
    { value: "nova", label: "Nova" },
    { value: "shimmer", label: "Shimmer" },
  ];

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);

  // Add new track
  const handleAddTrack = useCallback(() => {
    const newTrack = {
      id: Date.now(),
      name: t("recordingStudioEnhanced.trackName", {
        number: tracks.length + 1,
      }),
      voice: "alloy",
      prompt: "",
      clips: [],
    };
    dispatch({ type: "ADD_TRACK", track: newTrack });
  }, [tracks.length, t]);

  // Delete track
  const handleDeleteTrack = useCallback(
    (trackId) => {
      if (tracks.length === 1) {
        alert(t("recordingStudioEnhanced.deleteLastTrackAlert"));
        return;
      }
      dispatch({ type: "DELETE_TRACK", trackId });
    },
    [tracks.length, t],
  );

  // Update track property
  const updateTrack = useCallback((trackId, updates) => {
    dispatch({ type: "UPDATE_TRACK", trackId, updates });
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create AudioContext + AnalyserNode for MicLevelIndicator
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      const recorder = new MediaRecorder(stream);

      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });

        // Apply filters to the recorded audio
        const processedBlob = await applyFilters(audioBlob, filters);

        // Calculate waveform
        const waveform = await calculateWaveformData(processedBlob, 600);

        // Add clip to selected track via reducer
        const newClip = {
          id: Date.now(),
          audioBlob: processedBlob,
          waveformData: waveform,
          startTime: 0,
          duration: 0,
        };

        dispatch({ type: "RECORDING_STOPPED", clip: newClip });

        // Clean up
        stream.getTracks().forEach((track) => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      };

      recorder.start();
      dispatch({
        type: "START_RECORDING",
        mediaStream: stream,
        mediaRecorder: recorder,
        recordingAnalyser: analyser,
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(t("recordingStudioEnhanced.micAccessError"));
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (state.mediaRecorder && recording) {
      state.mediaRecorder.stop();
      dispatch({ type: "STOP_RECORDING" });
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  // Apply audio filters (simplified version - would need Web Audio API for real implementation)
  const applyFilters = async (audioBlob, filters) => {
    // This is a placeholder. Real implementation would use Web Audio API
    // to apply actual filters like:
    // - BiquadFilterNode for high/low pass filters
    // - DynamicsCompressorNode for normalization
    // - Custom noise gate for noise reduction
    // - etc.

    console.log("Applying filters:", filters);

    // For now, just return the original blob
    // TODO: Implement actual audio filtering
    return audioBlob;
  };

  // Cut selected portion of audio
  const handleCut = () => {
    if (selectionStart === null || selectionEnd === null) {
      alert(t("recordingStudioEnhanced.selectToCut"));
      return;
    }

    // TODO: Implement actual cutting logic using Web Audio API
    console.log("Cutting from", selectionStart, "to", selectionEnd);

    dispatch({ type: "CUT_SELECTION" });
  };

  // Generate audio from prompt using TTS
  const handleGenerateFromPrompt = async (trackId) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track || !track.prompt.trim()) {
      alert(t("recordingStudioEnhanced.enterPrompt"));
      return;
    }

    try {
      // TODO: Call OpenAI TTS API with track.voice and track.prompt
      console.log("Generating audio:", {
        voice: track.voice,
        prompt: track.prompt,
      });

      // Placeholder - would need to implement actual API call
      alert(t("recordingStudioEnhanced.ttsNotImplemented"));
    } catch (error) {
      console.error("Error generating audio:", error);
      alert(t("recordingStudioEnhanced.ttsGenerationFailed"));
    }
  };

  return (
    <RecordingStudioEnhancedView
      tracks={tracks}
      selectedTrackId={selectedTrackId}
      filters={filters}
      recording={recording}
      recordingAnalyser={recordingAnalyser}
      selectionStart={selectionStart}
      selectionEnd={selectionEnd}
      whisperVoices={whisperVoices}
      trackContainerRef={trackContainerRef}
      onStartRecording={startRecording}
      onStopRecording={stopRecording}
      onCut={handleCut}
      onAddTrack={handleAddTrack}
      onDeleteTrack={handleDeleteTrack}
      onUpdateTrack={updateTrack}
      onGenerateFromPrompt={handleGenerateFromPrompt}
      onSetFilter={(filter) => dispatch({ type: "SET_FILTER", filter })}
      onSelectTrack={(trackId) => dispatch({ type: "SELECT_TRACK", trackId })}
    />
  );
}
