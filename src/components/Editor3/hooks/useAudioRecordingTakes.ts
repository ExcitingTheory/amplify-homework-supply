import * as React from "react";
import { calculateWaveformData } from "../../../utils/calculateWaveformData";
import {
  clearTemporaryAudioTakes,
  getTemporaryAudioTakes,
  saveTemporaryAudioTake,
  type TemporaryAudioTake,
} from "../../../utils/temporaryAudioTakeStore";
import {
  WAVEFORM_COLOR_FALLBACKS,
  WAVEFORM_CSS_VARIABLES,
  WAVEFORM_LINE_STYLE,
  resolveWaveformCssColor,
  waveformAmplitudeColor,
} from "../../../utils/waveformDefaults";
import { hexToRgb } from "../../../utils/hexToRgb";

interface UseAudioRecordingTakesOptions {
  height?: number;
  scopeKey: string;
  width?: number;
}

export function useAudioRecordingTakes({
  height = 80,
  scopeKey,
  width = 600,
}: UseAudioRecordingTakesOptions) {
  const [takes, setTakes] = React.useState<TemporaryAudioTake[]>([]);
  const [selectedTakeId, setSelectedTakeId] = React.useState<string | null>(null);
  const [recording, setRecording] = React.useState(false);
  const [inputVolume, setInputVolume] = React.useState(1);
  const [inputLevel, setInputLevel] = React.useState(0);
  const [recordingDuration, setRecordingDuration] = React.useState(0);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const gainRef = React.useRef<GainNode | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const startedAtRef = React.useRef(0);

  React.useEffect(() => {
    let active = true;
    void getTemporaryAudioTakes(scopeKey)
      .then((storedTakes) => {
        if (!active) return;
        setTakes(storedTakes);
        setSelectedTakeId(storedTakes.at(-1)?.id || null);
      })
      .catch((error) => {
        console.warn("[useAudioRecordingTakes] Unable to restore takes:", error);
      });
    return () => {
      active = false;
    };
  }, [scopeKey]);

  React.useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = inputVolume;
  }, [inputVolume]);

  React.useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      setRecordingDuration((performance.now() - startedAtRef.current) / 1000);
    }, 100);
    return () => window.clearInterval(timer);
  }, [recording]);

  React.useEffect(() => {
    if (!recording || !analyserRef.current || !canvasRef.current) return;
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const background = resolveWaveformCssColor(
      WAVEFORM_CSS_VARIABLES.background,
      WAVEFORM_COLOR_FALLBACKS.background,
    );
    const color = hexToRgb(
      resolveWaveformCssColor(
        WAVEFORM_CSS_VARIABLES.color,
        WAVEFORM_COLOR_FALLBACKS.color,
      ),
    );
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;

    const draw = () => {
      analyser.getByteFrequencyData(data);
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
      const middle = canvas.height / 2;
      const samples = canvas.width;
      const binSize = Math.max(1, Math.floor(data.length / samples));
      const barWidth = canvas.width / samples;
      const maximum = Math.max(...data) || 1;
      let levelTotal = 0;

      for (let index = 0; index < samples; index += 1) {
        let total = 0;
        const start = index * binSize;
        for (
          let dataIndex = start;
          dataIndex < start + binSize && dataIndex < data.length;
          dataIndex += 1
        ) {
          total += data[dataIndex];
        }
        const amplitude = total / binSize / maximum;
        levelTotal += amplitude;
        const barHeight = amplitude * middle;
        context.fillStyle = waveformAmplitudeColor(amplitude, color.g, color.b);
        context.fillRect(
          index * barWidth,
          middle - barHeight,
          Math.max(0.5, barWidth - WAVEFORM_LINE_STYLE.barGap),
          barHeight * 2,
        );
      }

      setInputLevel(levelTotal / samples);
      frame = window.requestAnimationFrame(draw);
    };

    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, [recording]);

  const stopRecording = React.useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
    setInputLevel(0);
  }, []);

  const startRecording = React.useCallback(async () => {
    if (recording) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const gain = audioContext.createGain();
    const analyser = audioContext.createAnalyser();
    const destination = audioContext.createMediaStreamDestination();
    gain.gain.value = inputVolume;
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(gain);
    gain.connect(analyser);
    gain.connect(destination);

    const recorder = new MediaRecorder(destination.stream);
    const chunks: Blob[] = [];
    recorder.addEventListener("dataavailable", (event) => chunks.push(event.data));
    recorder.addEventListener("stop", async () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunks, { type: mimeType });
      let duration = Math.max(
        0,
        (performance.now() - startedAtRef.current) / 1000,
      );
      try {
        const decodeContext = new AudioContext();
        const buffer = await decodeContext.decodeAudioData(await blob.arrayBuffer());
        duration = buffer.duration;
        await decodeContext.close();
      } catch (error) {
        console.warn("[useAudioRecordingTakes] Unable to decode duration:", error);
      }
      const waveformData = await calculateWaveformData(blob, width).catch(() => null);
      const take: TemporaryAudioTake = {
        id: crypto.randomUUID(),
        scopeKey,
        blob,
        waveformData,
        duration,
        mimeType,
        createdAt: Date.now(),
      };
      await saveTemporaryAudioTake(take);
      setTakes((current) => [...current, take]);
      setSelectedTakeId(take.id);
      stream.getTracks().forEach((track) => track.stop());
      await audioContext.close();
      recorderRef.current = null;
      streamRef.current = null;
      audioContextRef.current = null;
      gainRef.current = null;
      analyserRef.current = null;
    });

    recorderRef.current = recorder;
    streamRef.current = stream;
    audioContextRef.current = audioContext;
    gainRef.current = gain;
    analyserRef.current = analyser;
    startedAtRef.current = performance.now();
    setRecordingDuration(0);
    setRecording(true);
    recorder.start();
  }, [inputVolume, recording, scopeKey, width]);

  React.useEffect(() => {
    return () => {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      void audioContextRef.current?.close();
    };
  }, []);

  const clearTakes = React.useCallback(async () => {
    await clearTemporaryAudioTakes(scopeKey);
    setTakes([]);
    setSelectedTakeId(null);
  }, [scopeKey]);

  return {
    canvasRef,
    clearTakes,
    inputLevel,
    inputVolume,
    recording,
    recordingDuration,
    selectedTake: takes.find((take) => take.id === selectedTakeId) || null,
    selectedTakeId,
    setInputVolume,
    setSelectedTakeId,
    startRecording,
    stopRecording,
    takes,
  };
}