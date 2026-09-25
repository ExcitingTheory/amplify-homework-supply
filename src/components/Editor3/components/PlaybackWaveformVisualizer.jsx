import * as React from "react";
import { Box } from "@mui/material";

import { hexToRgb } from "../../../utils/hexToRgb";
import {
  WAVEFORM_COLOR_FALLBACKS,
  WAVEFORM_CSS_VARIABLES,
  WAVEFORM_DATA_DEFAULTS,
  WAVEFORM_LINE_STYLE,
  resolveWaveformCssColor,
  waveformAmplitudeColor,
} from "../../../utils/waveformDefaults";

const FFT_SIZE = 2048;
const HORIZONTAL_PADDING = 12;
const VERTICAL_PADDING = 8;

export default function PlaybackWaveformVisualizer({
  onLevelChange,
  player,
  visible = true,
}) {
  const canvasRef = React.useRef(null);
  const frameRef = React.useRef(null);
  const onLevelChangeRef = React.useRef(onLevelChange);

  React.useEffect(() => {
    onLevelChangeRef.current = onLevelChange;
  }, [onLevelChange]);

  React.useEffect(() => {
    if (!player || player.isDisposed()) return undefined;

    const mediaElement = player.tech(true)?.el();
    const canvas = canvasRef.current;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!mediaElement || !canvas || !AudioContextClass) return undefined;

    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.82;

    let source;
    try {
      source = audioContext.createMediaElementSource(mediaElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    } catch (error) {
      console.warn("Unable to connect playback waveform:", error);
      void audioContext.close();
      return undefined;
    }

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const timeDomainData = new Uint8Array(analyser.fftSize);
    const context = canvas.getContext("2d");
    const container = canvas.parentElement;

    const resizeCanvas = () => {
      const bounds = container.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
      canvas.style.width = `${bounds.width}px`;
      canvas.style.height = `${bounds.height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);
    resizeCanvas();

    const resumeAudioContext = () => {
      if (audioContext.state === "suspended") void audioContext.resume();
    };
    player.on("play", resumeAudioContext);

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const primaryColor = resolveWaveformCssColor(
        WAVEFORM_CSS_VARIABLES.color,
        WAVEFORM_COLOR_FALLBACKS.color,
      );
      const rgbColor = hexToRgb(primaryColor);

      analyser.getByteFrequencyData(frequencyData);
      analyser.getByteTimeDomainData(timeDomainData);
      context.clearRect(0, 0, width, height);

      const isActive = !player.paused() && !player.muted();
      const rms = Math.sqrt(
        timeDomainData.reduce((sum, sample) => {
          const normalizedSample = (sample - 128) / 128;
          return sum + normalizedSample * normalizedSample;
        }, 0) / timeDomainData.length,
      );
      const outputDb = rms > 0 ? 20 * Math.log10(rms) : -60;
      const outputLevel = Math.max(0, Math.min(1, (outputDb + 60) / 60));
      onLevelChangeRef.current?.(isActive ? outputLevel : 0);

      const middle = height / 2;
      const maximumBarHeight = Math.max(0, middle - VERTICAL_PADDING);
      const drawableWidth = Math.max(1, width - HORIZONTAL_PADDING * 2);
      const sampleCount = Math.min(
        Math.max(1, Math.round(drawableWidth)),
        WAVEFORM_DATA_DEFAULTS.sampleCount,
      );
      const binSize = Math.max(
        1,
        Math.floor(frequencyData.length / sampleCount),
      );
      const barWidth = drawableWidth / sampleCount;
      const peakAmplitude = Math.max(...frequencyData) / 255;
      if (!isActive || peakAmplitude < 0.01) {
        context.fillStyle = waveformAmplitudeColor(0, rgbColor.g, rgbColor.b);
        context.globalAlpha = 0.55;
        context.fillRect(
          HORIZONTAL_PADDING,
          middle,
          drawableWidth,
          WAVEFORM_LINE_STYLE.idleLineThickness / 2,
        );
        context.globalAlpha = 1;
        frameRef.current = window.requestAnimationFrame(draw);
        return;
      }

      for (let index = 0; index < sampleCount; index += 1) {
        let total = 0;
        const start = index * binSize;
        for (
          let dataIndex = start;
          dataIndex < start + binSize && dataIndex < frequencyData.length;
          dataIndex += 1
        ) {
          total += frequencyData[dataIndex];
        }
        const amplitude = total / binSize / 255;
        const barHeight = amplitude * maximumBarHeight;
        context.fillStyle = waveformAmplitudeColor(
          amplitude,
          rgbColor.g,
          rgbColor.b,
        );
        context.fillRect(
          HORIZONTAL_PADDING + index * barWidth,
          middle - barHeight,
          Math.max(0.5, barWidth - WAVEFORM_LINE_STYLE.barGap),
          barHeight * 2,
        );
      }

      frameRef.current = window.requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
      player.off("play", resumeAudioContext);
      source.disconnect();
      analyser.disconnect();
      void audioContext.close();
    };
  }, [player]);

  return (
    <Box
      aria-hidden={true}
      sx={{
        display: visible ? "block" : "none",
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </Box>
  );
}
